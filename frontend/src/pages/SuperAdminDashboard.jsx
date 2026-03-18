import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunities, deleteCommunity } from '../services/api';
import { useCommunity } from '../context/CommunityContext';
import CommunityForm from '../components/CommunityForm';

export default function SuperAdminDashboard() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formCommunity, setFormCommunity] = useState(null); // null=closed, false=new, obj=edit
  const [showForm, setShowForm] = useState(false);
  const { setActiveCommunity } = useCommunity();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCommunities();
      setCommunities(res.data);
    } catch {
      setError('Failed to load communities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleNew = () => { setFormCommunity(null); setShowForm(true); };
  const handleEdit = (c) => { setFormCommunity(c); setShowForm(true); };
  const handleFormClose = () => { setShowForm(false); setFormCommunity(null); };
  const handleFormSaved = () => { setShowForm(false); setFormCommunity(null); load(); };

  const handleAccess = (community) => {
    setActiveCommunity({ id: community.id, name: community.name });
    navigate('/');
  };

  const handleDelete = async (community) => {
    if (!window.confirm(`Delete "${community.name}"? This cannot be undone.`)) return;
    try {
      await deleteCommunity(community.id);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Delete failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Manage all communities on the platform</p>
              <p className="text-sm text-gray-600 mt-2">
                To add a community: click <strong>New Community</strong> above. To open a community&apos;s site: click <strong>Access Platform</strong> on its card.
              </p>
            </div>
            <button onClick={handleNew}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Community
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold ml-4">&times;</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-500">
            <svg className="animate-spin h-6 w-6 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading communities…
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto h-14 w-14 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-10h2m4 0h2M7 7h2m4 0h2" />
            </svg>
            <p className="text-gray-500">No communities yet.</p>
            <button onClick={handleNew}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Create First Community
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {communities.map((c) => (
              <div key={c.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden">
                {/* Card header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-gray-900 truncate">{c.name}</h2>
                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">#{c.id}</span>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 space-y-2 text-sm">
                  {c.phone_number ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {c.phone_number}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-300 text-xs italic">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      No phone number
                    </div>
                  )}
                  {c.website_url ? (
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                      </svg>
                      <a href={c.website_url} target="_blank" rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline truncate text-xs" onClick={(e) => e.stopPropagation()}>
                        {c.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-300 text-xs italic">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                      </svg>
                      No website
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Created {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Card actions */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                  <button onClick={() => handleAccess(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                    </svg>
                    Access Platform
                  </button>
                  <button onClick={() => handleEdit(c)}
                    className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-white transition">
                    Edit
                  </button>
                  {c.id !== 1 && (
                    <button onClick={() => handleDelete(c)}
                      className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CommunityForm
          community={formCommunity || null}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
