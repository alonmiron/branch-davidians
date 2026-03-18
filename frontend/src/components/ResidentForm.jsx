import { useState, useEffect, useRef } from 'react';
import { createResident, updateResident, getResidents } from '../services/api';

// ─── Searchable street selector ───────────────────────────────────────────────
function StreetSelect({ label, value, onChange, streets, placeholder = '— select street —' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const filtered = query.trim()
    ? streets.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : streets;

  useEffect(() => {
    if (!listRef.current) return;
    const target = listRef.current.querySelector(`li[data-idx="${activeIndex}"]`);
    if (target) target.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (street) => {
    onChange(street);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { setOpen(true); setActiveIndex(-1); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, -1)); break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex === -1) handleSelect('');
        else if (filtered[activeIndex]) handleSelect(filtered[activeIndex]);
        break;
      case 'Escape': setOpen(false); setQuery(''); setActiveIndex(-1); break;
      default: break;
    }
  };

  const displayValue = open ? query : (value || '');

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          placeholder={value || placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
        />
        {value ? (
          <button type="button" onClick={() => { onChange(''); setQuery(''); }} tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">
            &times;
          </button>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
        )}
      </div>
      {open && (
        <ul ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm"
          role="listbox">
          <li data-idx="-1" onMouseDown={() => handleSelect('')}
            className={`px-3 py-2 italic cursor-pointer ${activeIndex === -1 ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hover:bg-gray-50'}`}>
            — none —
          </li>
          {filtered.length === 0 && <li className="px-3 py-2 text-gray-400 select-none">No matches</li>}
          {filtered.map((s, idx) => (
            <li key={s} data-idx={idx} onMouseDown={() => handleSelect(s)} role="option" aria-selected={value === s}
              className={`px-3 py-2 cursor-pointer ${
                activeIndex === idx ? 'bg-blue-600 text-white'
                : value === s ? 'bg-blue-50 font-medium text-blue-800'
                : 'text-gray-800 hover:bg-blue-50 hover:text-blue-800'
              }`}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Searchable parent selector ───────────────────────────────────────────────
function ParentSelect({ label, value, onChange, options, placeholder = '— search or select —' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // -1 = "none" row
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find((o) => o.id === Number(value));

  const filtered = query.trim()
    ? options.filter((o) => o.full_name.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Total navigable items = "none" row (index -1) + filtered items (index 0..n-1)
  const totalItems = filtered.length; // "none" sits at -1

  // Scroll the highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    // activeIndex -1 = first <li> (the "none" row); 0+ = subsequent items
    const items = listRef.current.querySelectorAll('li[data-idx]');
    const target = listRef.current.querySelector(`li[data-idx="${activeIndex}"]`);
    if (target) target.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id) => {
    onChange(id);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        setActiveIndex(-1);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex === -1) {
          handleSelect('');
        } else if (filtered[activeIndex]) {
          handleSelect(filtered[activeIndex].id);
        }
        break;
      case 'Escape':
        setOpen(false);
        setQuery('');
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  const displayValue = open ? query : (selectedOption ? selectedOption.full_name : '');

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          placeholder={selectedOption ? selectedOption.full_name : placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => { setOpen(true); }}
          onKeyDown={handleKeyDown}
          className="w-full border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            tabIndex={-1}
          >
            &times;
          </button>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
        )}
      </div>
      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm"
          role="listbox"
        >
          {/* "none" row — index -1 */}
          <li
            data-idx="-1"
            onMouseDown={() => handleSelect('')}
            className={`px-3 py-2 italic cursor-pointer ${activeIndex === -1 ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            — none —
          </li>
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-gray-400 select-none">No matches found</li>
          )}
          {filtered.map((o, idx) => (
            <li
              key={o.id}
              data-idx={idx}
              onMouseDown={() => handleSelect(o.id)}
              className={`px-3 py-2 cursor-pointer ${
                activeIndex === idx
                  ? 'bg-blue-600 text-white'
                  : Number(value) === o.id
                  ? 'bg-blue-50 font-medium text-blue-800'
                  : 'text-gray-800 hover:bg-blue-50 hover:text-blue-800'
              }`}
              role="option"
              aria-selected={Number(value) === o.id}
            >
              {o.full_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  first_name: '',
  family_name: '',
  date_of_birth: '',
  street_name: '',
  house_address_number: '',
  map_locator: '',
  telephone: '',
  email: '',
  taxpayer: false,
  landlord: false,
  tenant: false,
  landlord_id: '',
  senior_citizen: false,
  armed_forces: false,
  active_miluim: false,
  armed: false,
  tzahi: false,
  medical_personal_team: false,
  child_of_parent_id: '',
  child_of_parent2_id: '',
  is_child_of: false,
  konenut: '',
};

export default function ResidentForm({ resident, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allResidents, setAllResidents] = useState([]);
  const isEdit = !!resident;

  useEffect(() => {
    getResidents()
      .then((res) => setAllResidents(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (resident) {
      setForm({
        first_name: resident.first_name || '',
        family_name: resident.family_name || '',
        date_of_birth: resident.date_of_birth || '',
        street_name: resident.street_name || '',
        house_address_number: resident.house_address_number || '',
        map_locator: resident.map_locator || '',
        telephone: resident.telephone || '',
        email: resident.email || '',
        taxpayer: !!resident.taxpayer,
        landlord: !!resident.landlord,
        tenant: !!resident.tenant,
        landlord_id: resident.landlord_id ?? '',
        senior_citizen: !!resident.senior_citizen,
        armed_forces: !!resident.armed_forces,
        active_miluim: !!resident.active_miluim,
        armed: !!resident.armed,
        tzahi: !!resident.tzahi,
        medical_personal_team: !!resident.medical_personal_team,
        child_of_parent_id: resident.child_of_parent_id ?? '',
        child_of_parent2_id: resident.child_of_parent2_id ?? '',
        is_child_of: !!(resident.child_of_parent_id || resident.child_of_parent2_id),
        konenut: resident.konenut || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [resident]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'tenant' && !checked) {
      setForm((f) => ({ ...f, tenant: false, landlord_id: '' }));
    } else if (name === 'is_child_of') {
      setForm((f) => ({
        ...f,
        is_child_of: checked,
        child_of_parent_id: checked ? f.child_of_parent_id : '',
        child_of_parent2_id: checked ? f.child_of_parent2_id : '',
      }));
    } else {
      setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.first_name.trim() || !form.family_name.trim()) {
      setError('First name and family name are required.');
      return;
    }
    // Validate: if marked as child, at least one parent must be chosen
    if (form.is_child_of && !form.child_of_parent_id && !form.child_of_parent2_id) {
      setError('Please select at least one parent from the list.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        family_name: form.family_name.trim(),
        date_of_birth: form.date_of_birth || null,
        street_name: form.street_name || null,
        house_address_number: form.house_address_number || null,
        map_locator: form.map_locator || null,
        telephone: form.telephone || null,
        email: form.email || null,
        taxpayer: form.taxpayer,
        landlord: form.landlord,
        tenant: form.tenant,
        landlord_id: form.tenant && form.landlord_id ? Number(form.landlord_id) : null,
        senior_citizen: form.senior_citizen,
        armed_forces: form.armed_forces,
        active_miluim: form.active_miluim,
        armed: form.armed,
        tzahi: form.tzahi,
        medical_personal_team: form.medical_personal_team,
        child_of_parent_id:  form.is_child_of && form.child_of_parent_id  ? Number(form.child_of_parent_id)  : null,
        child_of_parent2_id: form.is_child_of && form.child_of_parent2_id ? Number(form.child_of_parent2_id) : null,
        konenut: form.konenut || null,
      };
      if (isEdit) {
        await updateResident(resident.id, payload);
      } else {
        await createResident(payload);
      }
      onSaved();
    } catch (err) {
      console.error('[ResidentForm] save error:', err, 'response:', err?.response);
      const data = err?.response?.data;
      const status = err?.response?.status;
      let msg;
      if (status === 409) {
        msg = (typeof data?.detail === 'string' ? data.detail : null) || 'A resident with this name already exists.';
      } else if (Array.isArray(data?.detail)) {
        msg = data.detail.map((e) => `${e.loc?.slice(1).join(' → ')}: ${e.msg}`).join('; ');
      } else if (typeof data?.detail === 'string') {
        msg = data.detail;
      } else if (!err?.response) {
        msg = `Network error (${err?.code || err?.message || 'unknown'}). Check the browser Console and Network tabs for details.`;
      } else {
        msg = `Save failed (HTTP ${status || '?'}). Please try again.`;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Filter out the current resident from parent options
  const parentOptions = allResidents.filter((r) => !isEdit || r.id !== resident?.id);

  // Only residents marked as landlords (excluding self)
  const landlordOptions = allResidents.filter(
    (r) => r.landlord && (!isEdit || r.id !== resident?.id)
  );

  // Distinct street names from all residents, sorted, with fixed extra option
  const EXTRA_STREET = 'לא גרים בכפר';
  const streetOptions = [
    ...Array.from(
      new Set(
        allResidents
          .map((r) => r.street_name)
          .filter((s) => s && s.trim() && s !== EXTRA_STREET)
      )
    ).sort((a, b) => a.localeCompare(b, 'he')),
    EXTRA_STREET,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Resident' : 'Add New Resident'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? `Editing: ${resident.full_name}` : 'Full name will be generated from first + family name'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
          )}

          {/* Identity */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Identity</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name *" name="first_name" value={form.first_name} onChange={handleChange} required />
              <Field label="Family Name *" name="family_name" value={form.family_name} onChange={handleChange} required />
            </div>
            {(form.first_name || form.family_name) && (
              <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded px-2 py-1">
                Full name: <strong>{[form.first_name, form.family_name].filter(Boolean).join(' ')}</strong>
              </p>
            )}
            <div className="mt-4">
              <Field label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} type="date" />
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <StreetSelect
                label="Street Name"
                value={form.street_name}
                onChange={(s) => setForm((f) => ({ ...f, street_name: s }))}
                streets={streetOptions}
              />
              <Field label="House Number" name="house_address_number" value={form.house_address_number} onChange={handleChange} />
            </div>
            <div className="mt-4">
              <Field label="Map Locator" name="map_locator" value={form.map_locator} onChange={handleChange} placeholder="e.g. GPS coords, Google Maps link…" />
            </div>
          </section>

          {/* Contact */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telephone" name="telephone" value={form.telephone} onChange={handleChange} type="tel" />
              <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" />
            </div>
          </section>

          {/* Status flags */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status</h3>
            {/* Taxpayer — primary community flag */}
            <label className="flex items-center gap-2.5 mb-3 px-3 py-2.5 rounded-lg border-2 border-blue-200 bg-blue-50 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                name="taxpayer"
                checked={form.taxpayer}
                onChange={handleChange}
                className="h-4 w-4 rounded border-blue-400 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-blue-800">Taxpayer</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <CheckField label="Landlord" name="landlord" checked={form.landlord} onChange={handleChange} />
              <CheckField label="Tenant" name="tenant" checked={form.tenant} onChange={handleChange} />
              <CheckField label="Senior Citizen" name="senior_citizen" checked={form.senior_citizen} onChange={handleChange} />
            </div>
            {form.tenant && (
              <div className="mt-3 pl-1">
                <ParentSelect
                  label={
                    <>Landlord
                      <span className="text-gray-400 font-normal ml-1">(select from landlords list)</span>
                    </>
                  }
                  value={form.landlord_id}
                  onChange={(id) => setForm((f) => ({ ...f, landlord_id: id }))}
                  options={landlordOptions}
                  placeholder={landlordOptions.length ? '— type to search landlords —' : '— no landlords registered yet —'}
                />
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <CheckField label="Armed Forces" name="armed_forces" checked={form.armed_forces} onChange={handleChange} />
              <CheckField label="Active Miluim" name="active_miluim" checked={form.active_miluim} onChange={handleChange} />
              <CheckField label="Armed" name="armed" checked={form.armed} onChange={handleChange} />
              <CheckField label="Tzahi" name="tzahi" checked={form.tzahi} onChange={handleChange} />
              <CheckField label="Medical Personal Team" name="medical_personal_team" checked={form.medical_personal_team} onChange={handleChange} />
            </div>
          </section>


          {/* Family */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Family</h3>
            <div className="space-y-3">
              <CheckField label="Child of (resident in this list)" name="is_child_of" checked={form.is_child_of} onChange={handleChange} />
              {form.is_child_of && (
                <div className="space-y-3 pl-1">
                  <ParentSelect
                    label={<>Parent 1 <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(at least one required)</span></>}
                    value={form.child_of_parent_id}
                    onChange={(id) => setForm((f) => ({ ...f, child_of_parent_id: id }))}
                    options={parentOptions}
                    placeholder="— type to search —"
                  />
                  <ParentSelect
                    label={<>Parent 2 <span className="text-gray-400 font-normal">(optional)</span></>}
                    value={form.child_of_parent2_id}
                    onChange={(id) => setForm((f) => ({ ...f, child_of_parent2_id: id }))}
                    options={parentOptions.filter((r) => !form.child_of_parent_id || r.id !== Number(form.child_of_parent_id))}
                    placeholder="— type to search —"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Other */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Other</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Konenut</label>
              <textarea
                name="konenut"
                value={form.konenut}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Resident'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', required, placeholder, ...rest }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...rest}
      />
    </div>
  );
}

function CheckField({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}
