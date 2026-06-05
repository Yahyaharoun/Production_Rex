import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutDashboard, CarFront, Users, FileText,
  LogOut, Menu, X, WifiOff, Download, Share2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { Role } from '../types';

// ── Logo Rex ──────────────────────────────────────────────────────────────
const RexLogo = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shadow-sm rounded-lg flex-shrink-0"
  >
    <rect width="40" height="40" rx="8" fill="hsl(158, 82%, 43%)" />
    <text
      x="50%"
      y="54%"
      dominantBaseline="middle"
      textAnchor="middle"
      fill="white"
      fontSize="18"
      fontWeight="bold"
      fontFamily="sans-serif"
    >
      R
    </text>
  </svg>
);

// ── Indicateur Online/Offline ─────────────────────────────────────────────
const OnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive font-medium">
      <WifiOff className="h-3 w-3" />
      Hors ligne
    </div>
  );
};

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { user, login, logout } = useAuthStore();
  const navigate = useNavigate();

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // PWA Install Prompt
  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setIsStandalone(true));
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsStandalone(true);
      setDeferredPrompt(null);
    } else if (isIOS && isSafari) {
      setShowIOSGuide(true);
    } else if (isIOS && !isSafari) {
      setShowIOSGuide(true); // show guide, note Safari required
    }
  };

  // Rafraîchir le profil au montage
  useEffect(() => {
    const refreshProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        login(
          {
            id: user.id,
            email: user.email,
            name: data.name || 'Utilisateur',
            role: (data.role?.toUpperCase() || 'CHAUFFEUR') as Role,
            agenceId: data.agence_id || '',
            lineIds: data.line_ids || (data.agence_id ? [data.agence_id] : []),
            isActive: data.is_active ?? true,
          },
          useAuthStore.getState().token || ''
        );
      }
    };
    refreshProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const navigation = [
    { name: 'Tableau de bord', href: '/app/dashboard', icon: LayoutDashboard,
      show: true },
    { name: 'Production', href: '/app/production', icon: FileText,
      show: user?.role !== 'AGENT_RECETTE' },
    { name: 'Bordereaux', href: '/app/bordereaux', icon: FileText,
      show: user?.role === 'AGENT_RECETTE' || user?.role === 'PDG' || user?.role === 'ADMIN' || user?.role === 'CHEF_AGENCE' },
    { name: 'Carburant', href: '/app/fuel-expenses', icon: FileText,
      show: user?.role !== 'AGENT_RECETTE' },
    { name: 'Autres Dépenses', href: '/app/other-expenses', icon: FileText,
      show: user?.role !== 'AGENT_RECETTE' },
    { name: 'Lavage', href: '/app/washing-control', icon: CarFront,
      show: user?.role !== 'AGENT_RECETTE' },
    { name: 'Véhicules', href: '/app/vehicles', icon: CarFront,
      show: user?.role === 'PDG' || user?.role === 'CHEF_AGENCE' },
    { name: 'Chauffeurs', href: '/app/drivers', icon: Users,
      show: user?.role !== 'AGENT_RECETTE' },
    { name: 'Rapports', href: '/app/reports', icon: FileText,
      show: user?.role === 'PDG' || user?.role === 'CHEF_AGENCE' },
    { name: 'Utilisateurs', href: '/app/users', icon: Users,
      show: user?.role === 'PDG' || user?.role === 'CHEF_AGENCE' },
    { name: 'Journal', href: '/app/activity-log', icon: FileText,
      show: user?.role === 'PDG' || user?.role === 'CHEF_AGENCE' },
  ].filter(item => item.show);

  // ── Contenu de la sidebar ──────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card shadow-sm">
      {/* Logo + Titre */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <RexLogo size={36} />
        <div className="min-w-0">
          <div className="font-bold text-base leading-tight truncate">Production Rex</div>
          <div className="text-xs text-muted-foreground truncate">Gestion des transports</div>
        </div>
        <button
          onClick={closeSidebar}
          className="ml-auto lg:hidden p-1 rounded-md hover:bg-muted"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={closeSidebar}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            }
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Profil utilisateur + Déconnexion */}
      <div className="border-t border-border p-3 space-y-2">
        <OnlineStatus />

        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/50">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{user?.name || 'Utilisateur'}</div>
            <div className="text-xs text-muted-foreground truncate">
              {user?.role === 'CAISSIERE' ? 'AGENT PRODUCTION' : user?.role === 'AGENT_RECETTE' ? 'CAISSIÈRE' : user?.role?.replace('_', ' ') || 'Rôle inconnu'}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>

        {!isStandalone && (
          <Button
            variant="default"
            size="sm"
            onClick={handleInstallClick}
            className="w-full justify-start mt-2 bg-primary text-white hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            {isIOS ? "Ajouter à l'écran" : "Installer l'application"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar desktop ── */}
      <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col">
        <SidebarContent />
      </div>

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar mobile (drawer) ── */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden bg-background',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <SidebarContent />
      </div>

      {/* ── Contenu principal ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar mobile */}
        <header 
          className="flex items-center gap-3 border-b border-border bg-card px-4 pb-3 lg:hidden shadow-sm"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <RexLogo size={28} />
            <span className="font-bold text-sm truncate">Production Rex</span>
          </div>
          <OnlineStatus />
        </header>

        {/* Zone de contenu scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── iOS Installation Guide Modal ─────────────────────────────────── */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-t-3xl text-white pb-8 shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#065f46,#0ea57a)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1.5 bg-white/30 rounded-full" />
            </div>

            <div className="px-5 pb-2">
              <div className="flex items-center justify-between mb-4">
                <p className="font-black text-lg">Installer Production Rex</p>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!isSafari && (
                <div className="bg-yellow-400/20 border border-yellow-300/40 rounded-xl p-3 mb-4 text-sm">
                  ⚠️ <strong>Ouvrez d'abord ce lien dans Safari</strong> — l'installation n'est pas possible depuis Chrome ou Firefox sur iOS.
                </div>
              )}

              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-white/10 rounded-2xl p-3 mb-3">
                <div className="bg-white text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-black text-sm flex-shrink-0">
                  1
                </div>
                <div className="text-sm leading-relaxed">
                  Dans <strong>Safari</strong> (en haut ou en bas), appuyez sur l'icône{' '}
                  <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-lg font-semibold">
                    <Share2 className="h-4 w-4 inline" />
                    Partager
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-white/10 rounded-2xl p-3 mb-4">
                <div className="bg-white text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-black text-sm flex-shrink-0">
                  2
                </div>
                <div className="text-sm leading-relaxed">
                  Faites défiler vers le bas et appuyez sur{' '}
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg">
                    « Sur l'écran d'accueil »
                  </span>{' '}
                  puis <strong>Ajouter</strong>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full bg-white text-green-800 rounded-full py-3 font-black text-sm hover:bg-white/90 transition"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


