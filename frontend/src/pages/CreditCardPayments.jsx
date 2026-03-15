import { useState, useEffect, useCallback } from 'react';
import { getCcOverview, generateCcBatch, uploadCcResults, deleteCcResident } from '../services/api';
import CcResidentModal from '../components/CcResidentModal';
import CcMonthCellModal from '../components/CcMonthCellModal';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// ─── Expiry helpers ──────────────────────────────────────────────────────────

function parseExpiryDate(mmyy) {
  if (!mmyy || mmyy.length < 4) return null;
  const mm = parseInt(mmyy.slice(0, 2), 10);
  const yy = parseInt(mmyy.slice(2, 4), 10);
  if (isNaN(mm) || isNaN(yy)) return null;
  const fullYear = 2000 + yy;
  // Last day of that month
  return new Date(fullYear, mm, 0);
}

function expiryStatus(mmyy) {
  const expDate = parseExpiryDate(mmyy);
  if (!expDate) return 'normal';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (expDate < now) return 'expired';
  const threeMonths = new Date(now);
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  if (expDate <= threeMonths) return 'expiring';
  return 'normal';
}

function formatExpiry(mmyy) {
  if (!mmyy || mmyy.length < 4) return mmyy || '—';
  return `${mmyy.slice(0, 2)}/${mmyy.slice(2, 4)}`;
}

// ─── Status cell styling ─────────────────────────────────────────────────────

function statusCell(status) {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-800';
    case 'failed':  return 'bg-red-100 text-red-700';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'zero':    return 'bg-gray-100 text-gray-500';
    case 'prepaid': return 'bg-blue-100 text-blue-700';
    case 'manual':  return 'bg-purple-100 text-purple-700';
    default:        return 'bg-gray-50 text-gray-400';
  }
}

function cellLabel(cell) {
  if (!cell || !cell.status) return null;
  switch (cell.status) {
    case 'success': return `₪${Number(cell.actual_amount ?? cell.attempted_amount ?? 0).toLocaleString()}`;
    case 'failed':  return `✗ ${cell.response_code || 'err'}`;
    case 'pending': return '…';
    case 'zero':    return '0';
    case 'prepaid': return `↑₪${Number(cell.actual_amount ?? 0).toLocaleString()}`;
    case 'manual':  return `~₪${Number(cell.actual_amount ?? 0).toLocaleString()}`;
    default:        return null;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreditCardPayments() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMonth, setUploadMonth] = useState(new Date().getMonth() + 1);
  const [uploadYear, setUploadYear] = useState(CURRENT_YEAR);
  const [residentModal, setResidentModal] = useState(null); // null | 'new' | resident object
  const [cellModal, setCellModal] = useState(null);  // { resident, month, entry }
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [batchMonth, setBatchMonth] = useState(new Date().getMonth() + 1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCcOverview(year);
      setOverview(res.data);
    } catch {
      setError('Failed to load payment overview.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  // ─── Batch generation ───────────────────────────────────────────────────

  const handleGenerateBatch = async () => {
    setBatchLoading(true);
    try {
      const resp = await generateCcBatch({ year: year, month: batchMonth, include_debt: true });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ttxhogla-${MONTH_NAMES[batchMonth]}-${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      load();
    } catch {
      setError('Failed to generate batch file.');
    } finally {
      setBatchLoading(false);
    }
  };

  // ─── Result upload ───────────────────────────────────────────────────────

  const handleUploadResults = async () => {
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadResult(null);
    try {
      const resp = await uploadCcResults(uploadFile, uploadYear, uploadMonth);
      setUploadResult(resp.data);
      setUploadFile(null);
      document.getElementById('cc-result-upload').value = '';
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  // ─── Resident delete ─────────────────────────────────────────────────────

  const handleDeleteResident = async (resident) => {
    if (!window.confirm(`Delete ${resident.tenant}? This will also delete all their payment entries.`)) return;
    try {
      await deleteCcResident(resident.id);
      load();
    } catch {
      setError('Delete failed.');
    }
  };

  // ─── Filtering ──────────────────────────────────────────────────────────

  const rows = overview?.rows ?? [];
  const filtered = search.trim()
    ? rows.filter((r) =>
        r.resident.tenant.toLowerCase().includes(search.toLowerCase()) ||
        (r.resident.house || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.resident.taxpayer_id || '').includes(search)
      )
    : rows;

  return (
    <div className="px-2 sm:px-4 lg:px-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Card Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hogla community tax – credit card payers</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year switcher */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search resident…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => setResidentModal('new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Add Resident
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg p-3 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold">×</button>
        </div>
      )}

      {/* ── Batch + Upload panels ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Generate batch */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Generate Monthly Batch CSV</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={batchMonth}
              onChange={(e) => setBatchMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              {MONTH_NAMES.slice(1).map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={handleGenerateBatch}
              disabled={batchLoading}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {batchLoading ? 'Generating…' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Upload results */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Upload Processor Result File</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={uploadMonth}
                onChange={(e) => setUploadMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              >
                {MONTH_NAMES.slice(1).map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>{name}</option>
                ))}
              </select>
              <select
                value={uploadYear}
                onChange={(e) => setUploadYear(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              >
                {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="cc-result-upload"
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <button
                onClick={handleUploadResults}
                disabled={uploadLoading || !uploadFile}
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                {uploadLoading ? 'Processing…' : 'Upload & Process'}
              </button>
            </div>
          </div>

          {uploadResult && (
            <div className="mt-3 text-xs text-green-700 bg-green-50 rounded-lg p-2">
              Processed: {uploadResult.total_processed} | Success: {uploadResult.successful} | Failed: {uploadResult.failed} | Zero: {uploadResult.zero}
              {uploadResult.errors?.length > 0 && (
                <details className="mt-1"><summary className="cursor-pointer text-red-600">Errors ({uploadResult.errors.length})</summary>
                  <ul className="mt-1 space-y-0.5">
                    {uploadResult.errors.map((e, i) => <li key={i} className="text-red-600">{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main table ── */}
      {loading ? (
        <div className="flex justify-center items-center h-48 text-gray-400">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {/* Sticky columns */}
                <th className="sticky left-0 z-20 bg-gray-50 px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-[160px]">Tenant</th>
                <th className="sticky left-[160px] z-20 bg-gray-50 px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">Monthly</th>
                <th className="sticky left-[240px] z-20 bg-gray-50 px-3 py-3 text-center font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">Expiry</th>
                <th className="sticky left-[320px] z-20 bg-gray-50 px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">Debt</th>
                {/* Month columns */}
                {MONTH_ABBR.map((m) => (
                  <th key={m} className="px-2 py-3 text-center font-semibold text-gray-700 whitespace-nowrap min-w-[70px]">{m}</th>
                ))}
                {/* Annual */}
                <th className="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap min-w-[90px]">Expected</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap min-w-[90px]">Collected</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(({ resident, months, annual_expected, annual_collected }) => {
                const expStatus = expiryStatus(resident.card_expiry);
                const expClass =
                  expStatus === 'expired' ? 'text-red-600 font-semibold' :
                  expStatus === 'expiring' ? 'text-orange-500 font-semibold' :
                  'text-gray-700';
                const debt = Number(resident.current_debt ?? 0);

                return (
                  <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                    {/* Tenant */}
                    <td className="sticky left-0 z-10 bg-white px-3 py-2.5 whitespace-nowrap font-medium text-gray-900 min-w-[160px]">
                      <div className="leading-tight">
                        {resident.tenant}
                        {resident.house && <span className="ml-1 text-xs text-gray-400">#{resident.house}</span>}
                      </div>
                      {resident.landlord && (
                        <div className="text-xs text-gray-400">Landlord: {resident.landlord}</div>
                      )}
                    </td>

                    {/* Monthly */}
                    <td className="sticky left-[160px] z-10 bg-white px-3 py-2.5 text-right text-gray-700 min-w-[80px] whitespace-nowrap">
                      ₪{Number(resident.monthly_amount).toLocaleString()}
                    </td>

                    {/* Expiry */}
                    <td className={`sticky left-[240px] z-10 bg-white px-3 py-2.5 text-center min-w-[80px] whitespace-nowrap ${expClass}`}>
                      {expStatus === 'expired' && <span title="Card expired">⛔ </span>}
                      {expStatus === 'expiring' && <span title="Expiring soon">⚠️ </span>}
                      {formatExpiry(resident.card_expiry)}
                    </td>

                    {/* Debt */}
                    <td className={`sticky left-[320px] z-10 bg-white px-3 py-2.5 text-right min-w-[80px] whitespace-nowrap font-medium ${debt > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      {debt > 0 ? `₪${debt.toLocaleString()}` : '—'}
                    </td>

                    {/* Month cells */}
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const cell = months[m];
                      const label = cellLabel(cell);
                      return (
                        <td
                          key={m}
                          className="px-1 py-2.5 text-center min-w-[70px] cursor-pointer"
                          onClick={() => setCellModal({ resident, month: m, entry: cell })}
                        >
                          {label ? (
                            <span
                              className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-medium leading-5 ${statusCell(cell.status)}`}
                              title={cell.response_code ? `Code: ${cell.response_code}` : cell.notes || undefined}
                            >
                              {label}
                            </span>
                          ) : (
                            <span className="text-gray-200 hover:text-gray-400 text-lg leading-none" title="Click to add entry">+</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Annual expected */}
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                      ₪{Number(annual_expected).toLocaleString()}
                    </td>

                    {/* Annual collected */}
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                      ₪{Number(annual_collected).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setResidentModal(resident)}
                        className="text-blue-500 hover:text-blue-700 mr-2 text-xs font-medium"
                        title="Edit resident"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteResident(resident)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                        title="Delete resident"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={18} className="text-center py-10 text-gray-400">
                    No residents found. {search ? 'Try a different search.' : 'Import from CSV or add residents manually.'}
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totals footer */}
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 font-semibold text-gray-700" colSpan={4}>
                    Totals ({filtered.length} residents)
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const monthTotal = filtered.reduce((sum, { months }) => {
                      const cell = months[m];
                      if (cell?.status === 'success') {
                        return sum + Number(cell.actual_amount ?? cell.attempted_amount ?? 0);
                      }
                      return sum;
                    }, 0);
                    return (
                      <td key={m} className="px-1 py-2.5 text-center text-xs font-medium text-gray-600">
                        {monthTotal > 0 ? `₪${monthTotal.toLocaleString()}` : ''}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-right font-semibold text-gray-700">
                    ₪{filtered.reduce((s, r) => s + Number(r.annual_expected), 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-green-700">
                    ₪{filtered.reduce((s, r) => s + Number(r.annual_collected), 0).toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {residentModal && (
        <CcResidentModal
          resident={residentModal === 'new' ? null : residentModal}
          onClose={() => setResidentModal(null)}
          onSaved={() => { setResidentModal(null); load(); }}
        />
      )}

      {cellModal && (
        <CcMonthCellModal
          resident={cellModal.resident}
          year={year}
          month={cellModal.month}
          entry={cellModal.entry}
          onClose={() => setCellModal(null)}
          onSaved={() => { setCellModal(null); load(); }}
        />
      )}
    </div>
  );
}
