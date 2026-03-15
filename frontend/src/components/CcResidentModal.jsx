import { useState, useEffect } from 'react';
import { createCcResident, updateCcResident } from '../services/api';

const EMPTY_FORM = {
  taxpayer_id: '',
  house: '',
  landlord: '',
  tenant: '',
  monthly_amount: '',
  card_expiry: '',
  card_token: '',
  current_debt: '0',
  active: true,
  notes: '',
};

export default function CcResidentModal({ resident, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!resident;

  useEffect(() => {
    if (resident) {
      setForm({
        taxpayer_id: resident.taxpayer_id || '',
        house: resident.house || '',
        landlord: resident.landlord || '',
        tenant: resident.tenant || '',
        monthly_amount: String(resident.monthly_amount ?? ''),
        card_expiry: resident.card_expiry || '',
        card_token: resident.card_token || '',
        current_debt: String(resident.current_debt ?? '0'),
        active: resident.active !== false,
        notes: resident.notes || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [resident]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.tenant.trim()) {
      setError('Tenant name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        monthly_amount: form.monthly_amount === '' ? 0 : Number(form.monthly_amount),
        current_debt: form.current_debt === '' ? 0 : Number(form.current_debt),
        card_expiry: form.card_expiry || null,
        card_token: form.card_token || null,
        taxpayer_id: form.taxpayer_id || null,
        house: form.house || null,
        landlord: form.landlord || null,
        notes: form.notes || null,
      };
      if (isEdit) {
        await updateCcResident(resident.id, payload);
      } else {
        await createCcResident(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Resident' : 'Add Resident'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded p-3">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Taxpayer ID" name="taxpayer_id" value={form.taxpayer_id} onChange={handleChange} />
            <Field label="House" name="house" value={form.house} onChange={handleChange} />
          </div>

          <Field label="Tenant *" name="tenant" value={form.tenant} onChange={handleChange} required />
          <Field label="Landlord (blank = same as tenant)" name="landlord" value={form.landlord} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly Charge (₪)" name="monthly_amount" value={form.monthly_amount} onChange={handleChange} type="number" min="0" step="0.01" />
            <Field label="Current Debt (₪)" name="current_debt" value={form.current_debt} onChange={handleChange} type="number" step="0.01" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Card Expiry (MMYY)"
              name="card_expiry"
              value={form.card_expiry}
              onChange={handleChange}
              placeholder="e.g. 0830"
              maxLength={4}
            />
            <div />
          </div>

          <Field label="Card Token" name="card_token" value={form.card_token} onChange={handleChange} />
          <Field label="Notes" name="notes" value={form.notes} onChange={handleChange} />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="rounded"
            />
            Active (include in monthly batch charges)
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Resident'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', required, ...rest }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...rest}
      />
    </div>
  );
}
