import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';

interface ProtectedRouteProps {
  requiredRole?: Role | Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute = ({ requiredRole, children }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole.map(r => r.toUpperCase()) : [requiredRole.toUpperCase()];
    if (user && user.role && !roles.includes(user.role.toUpperCase())) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
