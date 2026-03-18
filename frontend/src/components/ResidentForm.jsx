import { useState, useEffect, useRef } from 'react';
import { createResident, updateResident, getResidents, createUserForResident } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

const RESIDENT_USER_ROLES = [
  { value: 'community_data_administrator', label: 'Community Data Administrator' },
  { value: 'payment_clerk',                label: 'Payment Clerk' },
  { value: 'mehamemet',                    label: 'Mehamemet' },
  { value: 'manager',                      label: 'Manager' },
  { value: 'data_entry',                   label: 'Data Entry' },
  { value: 'public',                       label: 'Public' },
];

export default function ResidentForm({ resident, onClose, onSaved }) {
  const { isCommunityDataAdmin, isAdmin, isSuperAdmin } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allResidents, setAllResidents] = useState([]);
  const isEdit = !!resident;

  // "Create User" sub-form state (edit mode, admin/super_admin only)
  const canCreateUser = isEdit && (isAdmin() || isSuperAdmin());
  const [createUser, setCreateUser] = useState(false);
  const [userForm, setUserForm] = useState({ role: 'community_data_administrator', password: '', showPassword: false });
  const [userSuccess, setUserSuccess] = useState('');

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
    setUserSuccess('');
    if (!form.first_name.trim() || !form.family_name.trim()) {
      setError('First name and family name are required.');
      return;
    }
    if (form.is_child_of && !form.child_of_parent_id && !form.child_of_parent2_id) {
      setError('Please select at least one parent from the list.');
      return;
    }
    // When creating a user, email and phone become required
    if (createUser) {
      if (!form.email.trim()) {
        setError('Email is required to create a user account.');
        return;
      }
      if (!form.telephone.trim()) {
        setError('Phone number is required to create a user account.');
        return;
      }
      if (!userForm.password || userForm.password.length < 6) {
        setError('Temporary password must be at least 6 characters.');
        return;
      }
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

      // Optionally create a platform user account for this resident
      if (createUser && isEdit) {
        try {
          const userRes = await createUserForResident(resident.id, {
            role: userForm.role,
            password: userForm.password,
          });
          setUserSuccess(`User account created! Username: ${userRes.data.username}. The user will be prompted to change their password on first login.`);
          setSaving(false);
          // Don't close — show the success message so the admin can note the username
          return;
        } catch (userErr) {
          const uData = userErr?.response?.data;
          const uStatus = userErr?.response?.status;
          let uMsg;
          if (uStatus === 409) {
            uMsg = (typeof uData?.detail === 'string' ? uData.detail : null) || 'A user with this email already exists.';
          } else if (typeof uData?.detail === 'string') {
            uMsg = uData.detail;
          } else {
            uMsg = `User creation failed (HTTP ${uStatus || '?'}). Resident was saved.`;
          }
          // Resident was already saved — show error but don't close
          setError(`Resident saved, but user creation failed: ${uMsg}`);
          setSaving(false);
          return;
        }
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
              <Field
                label={createUser ? 'Telephone *' : 'Telephone'}
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                type="tel"
                required={createUser}
              />
              <Field
                label={createUser ? 'Email *' : 'Email'}
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                required={createUser}
              />
            </div>
            {createUser && (!form.telephone.trim() || !form.email.trim()) && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                Email and phone are required to create a user account.
              </p>
            )}
          </section>

          {/* Status flags */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status</h3>
            {/* Taxpayer — hidden for community_data_administrator */}
            {!isCommunityDataAdmin() && (
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
            )}
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

          {/* Create User Account (admin / super_admin, edit mode only) */}
          {canCreateUser && (
            <section className="border border-indigo-200 rounded-xl bg-indigo-50 px-4 py-4">
              <label className="flex items-center gap-3 cursor-pointer select-none mb-1">
                <input
                  type="checkbox"
                  checked={createUser}
                  onChange={(e) => { setCreateUser(e.target.checked); setUserSuccess(''); setError(''); }}
                  className="h-4 w-4 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-indigo-800">Create platform user account for this resident</span>
              </label>
              <p className="text-xs text-indigo-500 mb-3 ml-7">
                A login account will be created using the resident&apos;s email. They will be prompted to change their password on first login.
              </p>

              {createUser && (
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-indigo-700 mb-1">User Type / Role *</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full border border-indigo-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {RESIDENT_USER_ROLES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-indigo-700 mb-1">Temporary Password * <span className="font-normal text-indigo-400">(min. 6 characters)</span></label>
                    <div className="relative">
                      <input
                        type={userForm.showPassword ? 'text' : 'password'}
                        value={userForm.password}
                        onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Set a temporary password…"
                        className="w-full border border-indigo-300 rounded-md px-3 py-2 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setUserForm((f) => ({ ...f, showPassword: !f.showPassword }))}
                        className="absolute inset-y-0 right-2 flex items-center text-indigo-400 hover:text-indigo-600"
                        tabIndex={-1}
                      >
                        {userForm.showPassword ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* User creation success message */}
          {userSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3">
              <strong>Success!</strong> {userSuccess}
              <div className="mt-2">
                <button type="button" onClick={onSaved} className="text-green-700 underline text-xs">
                  Close and refresh list
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving || !!userSuccess}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : isEdit
                ? (createUser ? 'Save & Create User Account' : 'Save Changes')
                : 'Create Resident'}
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
