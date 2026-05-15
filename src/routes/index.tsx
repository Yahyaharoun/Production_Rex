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
          { path: 'vehicles', element: <VehiclesPage /> },
          { path: 'drivers', element: <DriversPage /> },
          { path: 'production', element: <ProductionPage /> },
        ],
      },
      // Routes restreintes sous /app
      {
        element: <ProtectedRoute requiredRole={['PDG', 'CHEF_AGENCE']} />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { path: 'reports', element: <ReportsPage /> },
            ]
          }
        ]
      },
      {
        element: <ProtectedRoute requiredRole="PDG" />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { path: 'users', element: <UsersPage /> },
            ]
          }
        ]
      }
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
