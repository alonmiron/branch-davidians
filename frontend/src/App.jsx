import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CommunityProvider, useCommunity } from './context/CommunityContext'
import ProtectedRoute from './components/ProtectedRoute'
import { MainLogo, SecondaryLogo } from './components/Logo'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AccountSettings from './pages/AccountSettings'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import FailedCharges from './pages/FailedCharges'
import BatchOperations from './pages/BatchOperations'
import ManualPayments from './pages/ManualPayments'
import AdminUsers from './pages/AdminUsers'
import CreditCardPayments from './pages/CreditCardPayments'
import CreditCardArchive from './pages/CreditCardArchive'
import Residents from './pages/Residents'
import Places from './pages/Places'
import CommunityPage from './pages/CommunityPage'
import PaymentsHub from './pages/PaymentsHub'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

function AppContent() {
  const { isAuthenticated, isAdmin, isSuperAdmin, isCommunityDataAdmin, canReadResidents, canAccessPayments, user, logout } = useAuth();
  const { activeCommunity, clearActiveCommunity, communitySettings } = useCommunity();
  const navigate = useNavigate();

  if (!isAuthenticated()) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Super admin with no active community → redirect to super admin dashboard
  if (isSuperAdmin() && !activeCommunity) {
    return (
      <Routes>
        <Route path="/super-admin" element={<ProtectedRoute requireSuperAdmin><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Community context banner — shown when super admin is viewing a specific community */}
      {isSuperAdmin() && activeCommunity && (
        <div className="bg-indigo-700 text-white text-sm px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Viewing as Super Admin: <strong>{activeCommunity.name}</strong></span>
          </div>
          <button
            onClick={() => { clearActiveCommunity(); navigate('/super-admin'); }}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 px-3 py-1 rounded text-xs font-medium transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Exit to Super Admin
          </button>
        </div>
      )}
      <nav className="bg-white shadow-md border-b-2 border-blue-100">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and title */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {/* Main Logo - Hebrew Text */}
                <div className="h-12 flex items-center">
                  <MainLogo className="h-12 w-auto" />
                </div>
                
                {/* Secondary Logo - Community Emblem */}
                <div className="h-12 flex items-center border-l-2 border-gray-200 pl-3">
                  <SecondaryLogo className="h-10 w-auto" />
                </div>
                
                <div className="ml-2">
                  <h1 className="text-xl font-bold text-gray-800">Hogla Community</h1>
                  <p className="text-xs text-gray-500">Tax Management</p>
                </div>
              </div>
            </div>

            {/* Center - Navigation Links */}
            <div className="hidden lg:flex lg:space-x-1 xl:space-x-2 flex-1 justify-center max-w-3xl">
              {/* Dashboard — always visible */}
              <Link
                to="/"
                className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>

              {/* People section — only shown when People is enabled AND Community section is not (avoids duplication).
                  When Community is also enabled, Residents is reached via the Community hub. */}
              {communitySettings?.section_people && !communitySettings?.section_community && canReadResidents() && (
                <Link
                  to="/residents"
                  className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  People
                </Link>
              )}

              {/* Places section */}
              {communitySettings?.section_places && (
                <Link
                  to="/places"
                  className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Places
                </Link>
              )}

              {/* Community section */}
              {communitySettings?.section_community && (
                <Link
                  to="/community"
                  className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Community
                </Link>
              )}

              {/* Payments section — hidden for community_data_administrator */}
              {communitySettings?.section_payments && canAccessPayments() && (
                <Link
                  to="/payments"
                  className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payments
                </Link>
              )}

              {/* Admin Users — role-based */}
              {isAdmin() && (
                <Link
                  to="/admin/users"
                  className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 017 16h10a4 4 0 011.879.804M15 11a3 3 0 11-6 0 3 3 0 016 0zM12 4a8 8 0 100 16 8 8 0 000-16z" />
                  </svg>
                  Admin Users
                </Link>
              )}

              {/* Super Admin — only for super_admin role */}
              {isSuperAdmin() && !isCommunityDataAdmin() && (
                <Link
                  to="/super-admin"
                  onClick={() => clearActiveCommunity()}
                  className="border-b-2 border-transparent text-indigo-600 hover:border-indigo-500 hover:text-indigo-700 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-semibold transition duration-150"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Super Admin
                </Link>
              )}
            </div>

            {/* Right side - User info and logout */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="hidden md:flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-green-50 px-3 xl:px-4 py-2 rounded-lg">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <Link
                to="/account"
                className="inline-flex items-center px-3 xl:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition duration-150"
              >
                <svg className="h-4 w-4 xl:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 017 16h10a4 4 0 011.879.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4a8 8 0 100 16 8 8 0 000-16z" />
                </svg>
                <span className="hidden xl:inline">Account</span>
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 xl:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition duration-150"
              >
                <svg className="h-4 w-4 xl:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          {/* Section: People */}
          <Route path="/residents" element={<ProtectedRoute><Residents /></ProtectedRoute>} />
          {/* Section: Places */}
          <Route path="/places" element={<ProtectedRoute><Places /></ProtectedRoute>} />
          {/* Section: Community */}
          <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          {/* Section: Payments — blocked for community_data_administrator */}
          <Route path="/payments" element={<ProtectedRoute requirePayments><PaymentsHub /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute requirePayments><Customers /></ProtectedRoute>} />
          <Route path="/manual-payments" element={<ProtectedRoute requirePayments><ManualPayments /></ProtectedRoute>} />
          <Route path="/batch" element={<ProtectedRoute requirePayments><BatchOperations /></ProtectedRoute>} />
          <Route path="/failed" element={<ProtectedRoute requirePayments><FailedCharges /></ProtectedRoute>} />
          <Route path="/cc-payments" element={<ProtectedRoute requirePayments><CreditCardPayments /></ProtectedRoute>} />
          <Route path="/cc-archive" element={<ProtectedRoute requirePayments><CreditCardArchive /></ProtectedRoute>} />
          {/* Admin & account */}
          <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/super-admin" element={<ProtectedRoute requireSuperAdmin><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CommunityProvider>
          <AppContent />
        </CommunityProvider>
      </AuthProvider>
    </Router>
  )
}

export default App



