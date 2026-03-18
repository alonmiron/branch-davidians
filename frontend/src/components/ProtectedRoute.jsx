import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requirePayments = false,
}) {
  const { isAuthenticated, isAdmin, isSuperAdmin, canAccessPayments, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Access denied. Super admin privileges required.</div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin() && !isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  if (requirePayments && !canAccessPayments()) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">Your account does not have access to payment screens.</p>
        </div>
      </div>
    );
  }

  if (user?.requires_email_update && location.pathname !== '/account') {
    return <Navigate to="/account" replace />;
  }

  if (user?.requires_password_reset && location.pathname !== '/account') {
    return <Navigate to="/account" replace />;
  }

  return children;
}
