import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutDashboard,
  CarFront,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Truck
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';

// Logo Rex SVG inline
const RexLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="hsl(142,70%,45%)" />
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="sans-serif">R</text>
  </svg>
);

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Production', href: '/production', icon: FileText },
    { name: 'Véhicules', href: '/vehicles', icon: CarFront },
    { name: 'Chauffeurs', href: '/drivers', icon: Users },
    { name: 'Rapports', href: '/reports', icon: FileText },
  ];

  const SidebarContent = () => (
    <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card">
      <div className="flex flex-1 flex-col overflow-y-auto pb-4 pt-5">
        {/* Logo Rex */}
        <div className="flex flex-shrink-0 items-center px-4 gap-3 mb-2">
          <RexLogo size={36} />
          <div>
            <span className="text-xl font-bold text-white tracking-tight">Rex</span>
            <p className="text-xs text-muted-foreground">Production & Transport</p>
          </div>
        </div>
        <nav className="mt-6 flex-1 space-y-1 px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-accent/20 text-accent border-l-2 border-accent'
                    : 'text-muted-foreground hover:bg-secondary hover:text-white',
                  'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-border p-4">
        <div className="group block w-full flex-shrink-0">
          <div className="flex items-center">
            <div className="inline-flex h-9 w-9 rounded-full bg-accent items-center justify-center font-bold text-white uppercase text-sm flex-shrink-0">
              {user?.name ? user.name.split(' ').map(w => w[0]).join('').substring(0, 2) : 'RX'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground">{user?.role || 'Rôle'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start text-muted-foreground hover:text-white hover:bg-secondary"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col">
            <div className="absolute right-0 top-0 -mr-12 pt-2">
              <button
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="relative z-10 flex h-16 flex-shrink-0 border-b border-border bg-card lg:hidden">
          <button
            className="border-r border-border px-4 text-muted-foreground focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <RexLogo size={28} />
              <span className="font-bold text-white">Rex</span>
            </div>
            <div className="inline-flex h-8 w-8 rounded-full bg-accent items-center justify-center font-bold text-white uppercase text-sm">
              {user?.name?.substring(0, 2) || 'U'}
            </div>
          </div>
        </div>

        <main className="relative z-0 flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
