import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Lazy load pages for performance
import { lazy } from 'react';

const LoginPage = lazy(() => import('../modules/auth/LoginPage'));
const DashboardPage = lazy(() => import('../modules/dashboard/DashboardPage'));
const VehiclesPage = lazy(() => import('../modules/vehicles/VehiclesPage'));
const DriversPage = lazy(() => import('../modules/drivers/DriversPage'));
const ProductionPage = lazy(() => import('../modules/production/ProductionPage'));
const ReportsPage = lazy(() => import('../modules/reports/ReportsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'vehicles', element: <VehiclesPage /> },
          { path: 'drivers', element: <DriversPage /> },
          { path: 'production', element: <ProductionPage /> },
          { path: 'reports', element: <ReportsPage /> },
        ],
      },
    ],
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
    ],
  },
]);
