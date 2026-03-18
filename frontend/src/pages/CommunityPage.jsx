import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';

export default function CommunityPage() {
  const { canReadResidents } = useAuth();
  const { communitySettings } = useCommunity();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Community</h1>
          <p className="mt-2 text-sm text-gray-700">
            People, places and services that make up the community
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* People / Residents — shown when section_people is enabled */}
        {communitySettings?.section_people && canReadResidents() && (
          <Link
            to="/residents"
            className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition"
          >
            <div className="flex-shrink-0 h-11 w-11 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 flex items-center justify-center transition">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">People</p>
              <p className="text-xs text-gray-500 mt-0.5">Residents directory — contact details, households and family ties</p>
            </div>
          </Link>
        )}

        {/* Groups & Leaders — coming soon */}
        <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-dashed border-gray-200 opacity-60 cursor-not-allowed">
          <div className="flex-shrink-0 h-11 w-11 rounded-lg bg-purple-50 text-purple-400 flex items-center justify-center">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Groups & Leaders</p>
            <p className="text-xs text-gray-400 mt-0.5">Community groups and leadership directory — coming soon</p>
          </div>
        </div>

        {/* Services — coming soon */}
        <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-dashed border-gray-200 opacity-60 cursor-not-allowed">
          <div className="flex-shrink-0 h-11 w-11 rounded-lg bg-green-50 text-green-400 flex items-center justify-center">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Services & Administration</p>
            <p className="text-xs text-gray-400 mt-0.5">Local services and administration contacts — coming soon</p>
          </div>
        </div>

      </div>
    </div>
  );
}
