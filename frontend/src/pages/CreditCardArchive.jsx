import { useState, useEffect } from 'react';
import { getCcArchives, downloadCcArchive, viewCcArchive, deleteCcArchive } from '../services/api';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TYPE_LABELS = {
  batch_export: { label: 'Batch Export', color: 'bg-indigo-100 text-indigo-700' },
  result_import: { label: 'Result Import', color: 'bg-green-100 text-green-700' },
};

export default function CreditCardArchive() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [viewContent, setViewContent] = useState(null); // { filename, content }
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.file_type = filterType;
      if (filterYear) params.year = filterYear;
      const res = await getCcArchives(params);
      setArchives(res.data);
    } catch {
      setError('Failed to load archives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterType, filterYear]);

  const handleDownload = async (archive) => {
    try {
      const resp = await downloadCcArchive(archive.id);
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', archive.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError('Download failed.');
    }
  };

  const handleView = async (archive) => {
    try {
      const resp = await viewCcArchive(archive.id);
      setViewContent({ filename: archive.filename, content: resp.data });
    } catch {
      setError('Failed to load file content.');
    }
  };

  const handleDelete = async (archive) => {
    if (!window.confirm(`Delete archive record "${archive.filename}"? This does not delete the file from disk.`)) return;
    try {
      await deleteCcArchive(archive.id);
      load();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <div className="px-2 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Archive</h1>
          <p className="text-sm text-gray-500 mt-0.5">Legal archive of all exported batch files and imported result files</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            <option value="batch_export">Batch Export</option>
            <option value="result_import">Result Import</option>
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All years</option>
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg p-3 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Filename</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Period</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Records</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {archives.map((a) => {
                const typeInfo = TYPE_LABELS[a.file_type] || { label: a.file_type, color: 'bg-gray-100 text-gray-600' };
                const period = a.month && a.year
                  ? `${MONTH_NAMES[a.month]} ${a.year}`
                  : a.year || '—';
                const dateStr = a.created_at
                  ? new Date(a.created_at).toLocaleDateString('en-IL', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—';

                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{a.filename}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{period}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{a.record_count ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{dateStr}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${a.processed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a.processed ? 'Processed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleView(a)}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(a)}
                        className="text-indigo-500 hover:text-indigo-700 text-xs font-medium"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {archives.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No archive files found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* File viewer modal */}
      {viewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 font-mono">{viewContent.filename}</h2>
              <button onClick={() => setViewContent(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre">{viewContent.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
