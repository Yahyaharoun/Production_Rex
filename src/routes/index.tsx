import { createHashRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { lazy } from 'react';

const LoginPage = lazy(() => import('../modules/auth/LoginPage'));
const RegisterPage = lazy(() => import('../modules/auth/RegisterPage'));
const DashboardPage = lazy(() => import('../modules/dashboard/DashboardPage'));
const VehiclesPage = lazy(() => import('../modules/vehicles/VehiclesPage'));
const DriversPage = lazy(() => import('../modules/drivers/DriversPage'));
const ProductionPage = lazy(() => import('../modules/production/ProductionPage'));
const ReportsPage = lazy(() => import('../modules/reports/ReportsPage'));
const UsersPage = lazy(() => import('../modules/users/UsersPage'));
const FuelExpensesPage = lazy(() => import('../modules/fuel-expenses/FuelExpensesPage'));
const OtherExpensesPage = lazy(() => import('../modules/other-expenses/OtherExpensesPage'));
const WashingControlPage = lazy(() => import('../modules/washing-control/WashingControlPage'));

export const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { 
            path: 'vehicles', 
            element: (
              <ProtectedRoute requiredRole={['PDG', 'CHEF_AGENCE']}>
                <VehiclesPage />
              </ProtectedRoute>
            )
          },
          { path: 'drivers', element: <DriversPage /> },
          { path: 'production', element: <ProductionPage /> },
          { path: 'fuel', element: <FuelExpensesPage /> },
          { path: 'other-expenses', element: <OtherExpensesPage /> },
          { path: 'washing', element: <WashingControlPage /> },
          { 
            path: 'reports', 
            element: (
              <ProtectedRoute requiredRole={['PDG', 'CHEF_AGENCE']}>
                <ReportsPage />
              </ProtectedRoute>
            )
          },
          { 
            path: 'users', 
            element: (
              <ProtectedRoute requiredRole={['PDG', 'CHEF_AGENCE']}>
                <UsersPage />
              </ProtectedRoute>
            )
          },
        ],
      }
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
