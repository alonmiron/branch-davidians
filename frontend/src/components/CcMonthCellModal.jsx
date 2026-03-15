import { useState } from 'react';
import { updateCcEntry, createCcManualEntry, deleteCcEntry } from '../services/api';

const STATUS_LABELS = {
  pending: 'Pending',
  success: 'Success',
  failed: 'Failed',
  zero: 'Zero / No charge',
  prepaid: 'Prepaid',
  manual: 'Manual adjustment',
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CcMonthCellModal({ resident, year, month, entry, onClose, onSaved }) {
  const isNew = !entry?.entry_id;
  const [form, setForm] = useState({
    status: entry?.status || 'manual',
    expected_amount: String(entry?.expected_amount ?? resident.monthly_amount ?? '0'),
    attempted_amount: String(entry?.attempted_amount ?? ''),
    actual_amount: String(entry?.actual_amount ?? ''),
    notes: entry?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        status: form.status,
        expected_amount: form.expected_amount !== '' ? Number(form.expected_amount) : null,
        attempted_amount: form.attempted_amount !== '' ? Number(form.attempted_amount) : null,
        actual_amount: form.actual_amount !== '' ? Number(form.actual_amount) : null,
        notes: form.notes || null,
      };

      if (isNew) {
        await createCcManualEntry({
          resident_id: resident.id,
          year,
          month,
          amount: Number(form.actual_amount || form.expected_amount || 0),
          status: form.status,
          notes: form.notes,
        });
      } else {
        await updateCcEntry(entry.entry_id, payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry?.entry_id) return;
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteCcEntry(entry.entry_id);
      onSaved();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{resident.tenant}</h2>
            <p className="text-xs text-gray-500">{MONTH_NAMES[month]} {year}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded p-3">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <NumField label="Expected (₪)" name="expected_amount" value={form.expected_amount} onChange={handleChange} />
            <NumField label="Attempted (₪)" name="attempted_amount" value={form.attempted_amount} onChange={handleChange} />
            <NumField label="Actual (₪)" name="actual_amount" value={form.actual_amount} onChange={handleChange} />
          </div>

          {entry?.response_code && (
            <p className="text-xs text-gray-500">Response code: <span className="font-mono font-semibold">{entry.response_code}</span></p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min="0"
        step="0.01"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
