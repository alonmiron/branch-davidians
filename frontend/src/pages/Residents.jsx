import { useState, useEffect, useCallback } from 'react';
import { getResidents, deleteResident } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ResidentForm from '../components/ResidentForm';
import ResidentDetailModal from '../components/ResidentDetailModal';

const SORT_FIELDS = [
  { key: 'family_name', label: 'Family Name' },
  { key: 'first_name',  label: 'First Name' },
  { key: 'full_name',   label: 'Full Name' },
  { key: 'street_name', label: 'Street Address' },
  { key: 'telephone',   label: 'Telephone' },
  { key: 'email',       label: 'Email' },
  { key: 'map_locator', label: 'Map Locator' },
];

// All status filters — taxpayer handled separately (role-gated)
const BASE_FILTERS = [
  { key: 'landlord',            label: 'Landlord' },
  { key: 'tenant',              label: 'Tenant' },
  { key: 'senior_citizen',      label: 'Senior Citizen' },
  { key: 'armed_forces',        label: 'Armed Forces' },
  { key: 'active_miluim',       label: 'Active Miluim' },
  { key: 'armed',               label: 'Armed' },
  { key: 'tzahi',               label: 'Tzahi' },
  { key: 'medical_personal_team', label: 'Medical Team' },
];

function SortIcon({ direction }) {
  if (!direction) return <span className="ml-1 text-gray-300">↕</span>;
  return <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
}

export default function Residents() {
  const { canWriteResidents, canDeleteResidents, isCommunityDataAdmin, isAdmin, isSuperAdmin } = useAuth();

  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('family_name');
  const [sortDir, setSortDir] = useState('asc');
  const [detailResident, setDetailResident] = useState(null);
  const [formResident, setFormResident] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Active filter flags — each key maps to a boolean
  const [activeFilters, setActiveFilters] = useState({});

  // Build the complete filter list based on role
  const canSeeTaxpayer = isAdmin() || isSuperAdmin();
  const allFilters = canSeeTaxpayer
    ? [{ key: 'taxpayer', label: 'Taxpayer' }, ...BASE_FILTERS]
    : BASE_FILTERS;

  const activeFilterKeys = Object.keys(activeFilters).filter((k) => activeFilters[k]);
  const hasFilters = activeFilterKeys.length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getResidents({ search: search || undefined, sort_by: sortBy, sort_dir: sortDir });
      setResidents(res.data);
    } catch {
      setError('Failed to load residents.');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const toggleFilter = (key) => {
    setActiveFilters((f) => ({ ...f, [key]: !f[key] }));
  };

  const clearFilters = () => setActiveFilters({});

  // Client-side filtering: resident must match ALL selected flags (AND within each flag)
  // OR interpretation: if multiple flags selected, show residents matching ANY of them
  const displayedResidents = hasFilters
    ? residents.filter((r) => activeFilterKeys.some((k) => r[k]))
    : residents;

  const handleNewResident = () => { setFormResident(null); setShowForm(true); };
  const handleEditResident = (resident) => { setDetailResident(null); setFormResident(resident); setShowForm(true); };
  const handleFormClose = () => { setShowForm(false); setFormResident(null); };
  const handleFormSaved = () => { setShowForm(false); setFormResident(null); load(); };

  const handleDeleteResident = async (resident) => {
    if (!window.confirm(`Delete "${resident.full_name}"? This cannot be undone.`)) return;
    try {
      await deleteResident(resident.id);
      setDetailResident(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Delete failed.');
    }
  };

  return (
    <div className="px-2 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hogla community resident registry</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, address, phone, email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            )}
          </div>

          {canWriteResidents() && (
            <button
              onClick={handleNewResident}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Resident
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
            Show only:
          </span>

          {allFilters.map(({ key, label }) => {
            const active = !!activeFilters[key];
            return (
              <label
                key={key}
                className={`inline-flex items-center gap-1.5 cursor-pointer select-none text-sm font-medium rounded-full px-3 py-1 border transition
                  ${active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={() => toggleFilter(key)}
                />
                {active && (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {label}
              </label>
            );
          })}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition ml-auto shrink-0"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <p className="text-xs text-gray-500 mb-3">
          {displayedResidents.length}
          {hasFilters ? ` of ${residents.length}` : ''} resident{displayedResidents.length !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ''}
          {hasFilters ? ` · filtered by: ${activeFilterKeys.map((k) => allFilters.find((f) => f.key === k)?.label).filter(Boolean).join(', ')}` : ''}
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16 text-gray-500 text-sm">
            <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading residents…
          </div>
        ) : displayedResidents.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 text-sm">
              {hasFilters
                ? 'No residents match the selected filters.'
                : search
                  ? `No residents found matching "${search}"`
                  : 'No residents yet. Add the first one!'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
            {canWriteResidents() && !search && !hasFilters && (
              <button
                onClick={handleNewResident}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Add First Resident
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {SORT_FIELDS.map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition whitespace-nowrap"
                      onClick={() => handleSort(key)}
                    >
                      {label}
                      <SortIcon direction={sortBy === key ? sortDir : null} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedResidents.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setDetailResident(r)}
                    className="hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {r.family_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {r.first_name}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {r.full_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {[r.street_name, r.house_address_number].filter(Boolean).join(' ') || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {r.telephone || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {r.email ? (
                        <a
                          href={`mailto:${r.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline"
                        >
                          {r.email}
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {r.map_locator || <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailResident && (
        <ResidentDetailModal
          resident={detailResident}
          onClose={() => setDetailResident(null)}
          onEdit={() => handleEditResident(detailResident)}
          onDelete={() => handleDeleteResident(detailResident)}
        />
      )}

      {/* Create / Edit form modal */}
      {showForm && (
        <ResidentForm
          resident={formResident || null}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
