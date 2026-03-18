import { useAuth } from '../context/AuthContext';

function Badge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  return value ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      {falseLabel}
    </span>
  );
}

function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 break-words flex-1">{value}</span>
    </div>
  );
}

function FlagRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <Badge value={value} />
    </div>
  );
}

function formatDOB(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function calcAge(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const dob = new Date(dateStr + 'T00:00:00');
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function upcomingBirthday(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const dob = new Date(dateStr + 'T00:00:00');
  const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  const diff = Math.round((next - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today!';
  if (diff <= 7) return `In ${diff} day${diff === 1 ? '' : 's'}`;
  if (diff <= 30) return `In ${diff} days`;
  return null;
}

export default function ResidentDetailModal({ resident, onClose, onEdit, onDelete }) {
  const { canWriteResidents, canDeleteResidents, isCommunityDataAdmin } = useAuth();

  if (!resident) return null;

  const fullAddress = [resident.street_name, resident.house_address_number]
    .filter(Boolean)
    .join(' ');

  const age = calcAge(resident.date_of_birth);
  const birthdayAlert = upcomingBirthday(resident.date_of_birth);
  const hasParent = !!(resident.child_of_parent_id || resident.parent || resident.child_of_parent2_id || resident.parent2);

  const mapsUrl = (resident.street_name && resident.house_address_number)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${resident.house_address_number} ${resident.street_name}, Hogla, Israel`)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{resident.full_name}</h2>
            {fullAddress && (
              <p className="text-sm text-gray-500 mt-0.5">{fullAddress}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1 ml-4 flex-shrink-0">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Birthday alert */}
          {birthdayAlert && (
            <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${birthdayAlert === 'Today!' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-50 text-blue-700'}`}>
              <span>{birthdayAlert === 'Today!' ? '🎂' : '🎁'}</span>
              <span>Birthday {birthdayAlert}</span>
            </div>
          )}

          {/* Personal */}
          {resident.date_of_birth && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Personal</h3>
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                <InfoRow label="Date of Birth" value={`${formatDOB(resident.date_of_birth)}${age !== null ? ` (age ${age})` : ''}`} />
              </div>
            </section>
          )}

          {/* Contact */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</h3>
            <div className="bg-gray-50 rounded-xl px-4 py-2">
              <InfoRow label="Telephone" value={resident.telephone} />
              <InfoRow label="Email" value={resident.email} />
              {mapsUrl && (
                <InfoRow
                  label="Address Map"
                  value={
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {resident.house_address_number} {resident.street_name}, Hogla
                    </a>
                  }
                />
              )}
              <InfoRow
                label="Map Locator"
                value={
                  resident.map_locator ? (
                    <a
                      href={resident.map_locator.startsWith('http') ? resident.map_locator : `https://maps.google.com/?q=${encodeURIComponent(resident.map_locator)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {resident.map_locator}
                    </a>
                  ) : null
                }
              />
            </div>
          </section>

          {/* Status */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</h3>
            {/* Taxpayer highlight — hidden for community_data_administrator */}
            {!isCommunityDataAdmin() && (
              <div className={`mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${resident.taxpayer ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                {resident.taxpayer ? 'Taxpayer' : 'Not a taxpayer'}
              </div>
            )}
            {/* Landlord link when tenant */}
            {resident.tenant && (resident.landlord_id || resident.landlord_resident) && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21V12h6v9" />
                </svg>
                <span>Tenant of <strong>{resident.landlord_resident?.full_name || `Resident #${resident.landlord_id}`}</strong></span>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl px-4 py-2 grid grid-cols-2 gap-x-8">
              <FlagRow label="Landlord" value={resident.landlord} />
              <FlagRow label="Tenant" value={resident.tenant} />
              <FlagRow label="Senior Citizen" value={resident.senior_citizen} />
              <FlagRow label="Armed Forces" value={resident.armed_forces} />
              <FlagRow label="Active Miluim" value={resident.active_miluim} />
              <FlagRow label="Armed" value={resident.armed} />
              <FlagRow label="Tzahi" value={resident.tzahi} />
              <FlagRow label="Medical Personal Team" value={resident.medical_personal_team} />
            </div>
          </section>

          {/* Family */}
          {hasParent && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Family</h3>
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                {(resident.child_of_parent_id || resident.parent) && (
                  <InfoRow
                    label="Parent 1"
                    value={resident.parent?.full_name || `Resident #${resident.child_of_parent_id}`}
                  />
                )}
                {(resident.child_of_parent2_id || resident.parent2) && (
                  <InfoRow
                    label="Parent 2"
                    value={resident.parent2?.full_name || `Resident #${resident.child_of_parent2_id}`}
                  />
                )}
              </div>
            </section>
          )}

          {/* Other */}
          {resident.konenut && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Other</h3>
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                <InfoRow label="Konenut" value={resident.konenut} />
              </div>
            </section>
          )}

          {/* Timestamps */}
          <section className="text-xs text-gray-400 space-y-0.5">
            <p>Added: {new Date(resident.created_at).toLocaleDateString()}</p>
            {resident.updated_at && (
              <p>Updated: {new Date(resident.updated_at).toLocaleDateString()}</p>
            )}
          </section>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {canWriteResidents() && (
            <button
              onClick={onEdit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
            >
              Edit Resident
            </button>
          )}
          {canDeleteResidents() && (
            <button
              onClick={onDelete}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
