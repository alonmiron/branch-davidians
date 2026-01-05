import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { MainLogo, SecondaryLogo } from './components/Logo'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import FailedCharges from './pages/FailedCharges'
import BatchOperations from './pages/BatchOperations'
import ManualPayments from './pages/ManualPayments'

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated()) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div className="hidden lg:flex lg:space-x-2 xl:space-x-4 flex-1 justify-center max-w-3xl">
              <Link
                to="/"
                className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                to="/customers"
                className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Customers
              </Link>
              <Link
                to="/manual-payments"
                className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Payments
              </Link>
              <Link
                to="/batch"
                className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Batch
              </Link>
              <Link
                to="/failed"
                className="border-b-2 border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-2 xl:px-3 pt-1 text-sm font-medium transition duration-150"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Failed
              </Link>
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
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/manual-payments" element={<ProtectedRoute><ManualPayments /></ProtectedRoute>} />
          <Route path="/batch" element={<ProtectedRoute><BatchOperations /></ProtectedRoute>} />
          <Route path="/failed" element={<ProtectedRoute><FailedCharges /></ProtectedRoute>} />
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
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App



