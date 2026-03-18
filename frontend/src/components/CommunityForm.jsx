import { useState, useEffect } from 'react';
import { createCommunity, updateCommunity } from '../services/api';

const EMPTY_FORM = { name: '', website_url: '', phone_number: '', active: true };

export default function CommunityForm({ community, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!community;

  useEffect(() => {
    if (community) {
      setForm({
        name:         community.name || '',
        website_url:  community.website_url || '',
        phone_number: community.phone_number || '',
        active:       community.active !== false,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [community]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Community name is required.'); return; }

    setSaving(true);
    try {
      const payload = {
        name:         form.name.trim(),
        website_url:  form.website_url.trim() || null,
        phone_number: form.phone_number.trim() || null,
        active:       form.active,
      };
      if (isEdit) {
        await updateCommunity(community.id, payload);
      } else {
        await createCommunity(payload);
      }
      onSaved();
    } catch (err) {
      const data = err?.response?.data;
      const status = err?.response?.status;
      if (status === 409) {
        setError('A community with this name already exists.');
      } else if (typeof data?.detail === 'string') {
        setError(data.detail);
      } else {
        setError(`Save failed (HTTP ${status || '?'}). Please try again.`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Community' : 'Add New Community'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? `Editing: ${community.name}` : 'Create a new community on the platform'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Community Name *</label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Hogla Community"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Website URL <span className="text-gray-400">(optional)</span></label>
            <input
              type="url" name="website_url" value={form.website_url} onChange={handleChange}
              placeholder="https://example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number <span className="text-gray-400">(optional)</span></label>
            <input
              type="tel" name="phone_number" value={form.phone_number} onChange={handleChange}
              placeholder="+972-50-000-0000"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Active (visible and accessible on the platform)
          </label>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition text-sm">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Community'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
