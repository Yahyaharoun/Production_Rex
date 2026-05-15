import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutDashboard,
  CarFront,
  Users,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

// Logo Rex SVG inline
const RexLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shadow-sm rounded-lg">
    <rect width="40" height="40" rx="8" fill="hsl(158, 82%, 43%)" />
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="sans-serif">R</text>
  </svg>
);

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, login, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const refreshProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        // Update store with fresh profile data
        login({
          id: user.id,
          email: user.email,
          name: data.name || 'Utilisateur',
          role: data.role as any,
          agenceId: data.agence_id || '',
          isActive: data.is_active ?? true
        }, useAuthStore.getState().token || '');
      }
    };
    refreshProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Tableau de bord', href: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Production', href: '/app/production', icon: FileText },
    ...(user?.role !== 'CAISSIERE' ? [{ name: 'Véhicules', href: '/app/vehicles', icon: CarFront }] : []),
    { name: 'Chauffeurs', href: '/app/drivers', icon: Users },
    ...(user?.role !== 'CAISSIERE' ? [{ name: 'Rapports', href: '/app/reports', icon: FileText }] : []),
    ...(user?.role === 'PDG' || user?.role === 'CHEF_AGENCE' ? [{ name: 'Utilisateurs', href: '/app/users', icon: Users }] : []),
  ];

  const SidebarContent = () => (
    <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card shadow-sm">
      <div className="flex flex-1 flex-col overflow-y-auto pb-4 pt-6">
        {/* Logo Rex */}
        <div className="flex flex-shrink-0 items-center px-6 gap-3 mb-6">
          <RexLogo size={36} />
          <div>
            <span className="text-2xl font-black text-foreground tracking-tight">Rex</span>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Production & Transport</p>
          </div>
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/app/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground font-medium',
                  'group flex items-center rounded-xl px-3 py-3 text-sm transition-all duration-200'
                )
              }
            >
              <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", 
                ({ isActive }: any) => isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-border p-4 bg-secondary/30">
        <div className="group block w-full flex-shrink-0">
          <div className="flex items-center bg-card p-2 rounded-xl border border-border shadow-sm">
            <div className="inline-flex h-10 w-10 rounded-lg bg-primary/10 items-center justify-center font-black text-primary uppercase text-sm flex-shrink-0">
              {user?.name ? user.name.split(' ').map(w => w[0]).join('').substring(0, 2) : 'RX'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role || 'Rôle'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 rounded-xl transition-all"
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
    <div className="flex h-screen overflow-hidden bg-secondary/30 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-[280px] flex-1 flex-col bg-card shadow-2xl">
            <div className="absolute right-0 top-0 -mr-12 pt-2">
              <button
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none bg-card/50 backdrop-blur-md text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-72 flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="relative z-10 flex h-16 flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-md lg:hidden shadow-sm">
          <button
            className="border-r border-border px-4 text-muted-foreground focus:outline-none hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <RexLogo size={28} />
              <span className="font-black text-foreground text-lg tracking-tight">Rex</span>
            </div>
            <div className="inline-flex h-8 w-8 rounded-lg bg-primary/10 items-center justify-center font-bold text-primary uppercase text-sm border border-primary/20">
              {user?.name?.substring(0, 2) || 'U'}
            </div>
          </div>
        </div>

        <main className="relative z-0 flex-1 overflow-y-auto focus:outline-none rex-gradient-bg">
          <div className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
