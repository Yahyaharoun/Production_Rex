import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail, Lock, Loader2, LogIn, Bus, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { cacheUserCredentials, offlineLogin } from '../../lib/offlineAuth';

/** Détecte si une erreur est une erreur réseau (pas de connexion Internet) */
function isNetworkError(err: unknown): boolean {
  const msg = ((err as any)?.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('load failed') ||
    msg.includes('the internet connection appears to be offline') ||
    msg.includes('offline') ||
    msg.includes('err_internet_disconnected') ||
    msg.includes('err_network_changed')
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isOnline = useOnlineStatus();

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Erreur', { description: 'Veuillez remplir tous les champs.' });
      return;
    }

    setLoading(true);

    // ─── TENTATIVE EN LIGNE (même si navigator.onLine peut mentir) ──────────────
    if (navigator.onLine) {
      try {
        console.log('[REX-AUTH] Tentative de connexion Supabase pour:', email);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        console.log('[REX-AUTH] Authentification Supabase réussie, récupération du profil...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('[REX-AUTH] Erreur profil:', profileError);
          toast.error('Erreur Base de Données', { description: profileError.message });
          setLoading(false);
          return;
        }

        if (profile && profile.is_active === false) {
          throw new Error('Votre compte a été désactivé. Veuillez contacter la direction.');
        }

        console.log('[REX-AUTH] Profil chargé. Rôle:', profile?.role);

        const userObj = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || 'Utilisateur',
          role: (profile?.role?.toUpperCase() || 'CAISSIERE') as any,
          agenceId: profile?.agence_id || '',
          lineIds: profile?.line_ids || (profile?.agence_id ? [profile.agence_id] : []),
          isActive: profile?.is_active ?? true,
        };

        login(userObj, data.session.access_token);

        // Mise en cache pour connexion hors ligne future
        await cacheUserCredentials(
          email,
          password,
          profile || { id: data.user.id, name: userObj.name, role: userObj.role, agence_id: userObj.agenceId },
          data.session.access_token
        );

        toast.success('Connexion réussie', { description: 'Bienvenue sur Production Rex' });
        navigate('/app/dashboard');
        setLoading(false);
        return;

      } catch (err: unknown) {
        // Si c'est une erreur réseau → basculer sur le mode hors ligne
        if (isNetworkError(err)) {
          console.warn('[REX-AUTH] Erreur réseau, tentative de connexion hors ligne...');
          // Continuer vers le bloc hors ligne ci-dessous
        } else {
          // Erreur d'authentification réelle (mauvais mot de passe, compte désactivé…)
          console.error('[REX-AUTH] Erreur login:', (err as any)?.message);
          toast.error('Échec de la connexion', {
            description: (err as any)?.message || 'Identifiants incorrects.',
          });
          setLoading(false);
          return;
        }
      }
    }

    // ─── FALLBACK HORS LIGNE ────────────────────────────────────────────────────
    try {
      console.log('[REX-AUTH] Mode hors ligne – vérification du cache local...');
      const offlineUser = await offlineLogin(email, password);

      if (!offlineUser) {
        toast.error('Connexion hors ligne impossible', {
          description: 'Identifiants incorrects ou compte jamais connecté sur cet appareil. Connectez-vous en ligne au moins une fois.',
          duration: 7000,
        });
        setLoading(false);
        return;
      }

      login(
        {
          id: offlineUser.id,
          email: offlineUser.email,
          name: offlineUser.name,
          role: offlineUser.role as any,
          agenceId: offlineUser.agenceId,
          lineIds: offlineUser.lineIds,
          isActive: offlineUser.isActive,
        },
        'offline-session'
      );

      toast.success('Connexion hors ligne réussie', {
        description: '⚡ Vos données locales sont disponibles. Synchronisation à la reconnexion.',
        duration: 5000,
      });
      navigate('/app/dashboard');
    } catch (err: unknown) {
      console.error('[REX-AUTH] Erreur connexion hors ligne:', (err as any)?.message);
      toast.error('Erreur inattendue', {
        description: (err as any)?.message || 'Impossible de se connecter.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-[2rem] shadow-2xl border border-border animate-in fade-in zoom-in duration-500">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <Bus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-foreground">Production Rex</h1>
          <p className="text-muted-foreground text-xs font-bold italic uppercase tracking-wider">Accès Sécurisé</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Indicateur hors ligne */}
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <WifiOff className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-bold">Mode Hors Ligne</p>
                <p className="mt-0.5 opacity-80">
                  Connexion locale disponible si vous vous êtes déjà connecté sur cet appareil.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-muted-foreground">
              Email Professionnel
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nom@rex.cm"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 bg-secondary/30 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary font-bold text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-muted-foreground">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 bg-secondary/30 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary font-bold text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 mt-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-border/50">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            © 2026 Production Rex System
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Contactez votre administrateur pour obtenir un accès.
          </p>
        </div>
      </div>
    </div>
  );
}
