import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
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

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Access denied. Admin privileges required.</div>
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


