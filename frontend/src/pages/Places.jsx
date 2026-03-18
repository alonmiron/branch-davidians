export default function Places() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="mb-6 inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Places</h1>
        <p className="text-lg text-gray-500 mb-2">Interactive Community Map</p>
        <p className="text-sm text-gray-400">
          An interactive map of the community — showing homes, landmarks and key locations — is coming soon.
        </p>
      </div>
    </div>
  );
}
