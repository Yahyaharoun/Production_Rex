import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';

interface ProtectedRouteProps {
  requiredRole?: Role | Role[];
}

export const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (user && !roles.includes(user.role)) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return <Outlet />;
};
