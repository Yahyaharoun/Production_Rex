import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail, Lock, Loader2, LogIn, Bus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Erreur', { description: 'Veuillez remplir tous les champs.' });
      return;
    }
    
    setLoading(true);
    console.log('[REX-AUTH] Tentative de connexion pour:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      console.log('[REX-AUTH] Authentification Supabase réussie, récupération du profil...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[REX-AUTH] Erreur base de données (profil):', profileError);
        toast.error('Erreur Base de Données', { description: profileError.message || 'Problème de schéma ou permissions.' });
      }

      if (profile && profile.is_active === false) {
        console.warn('[REX-AUTH] Tentative de connexion sur un compte désactivé:', email);
        throw new Error('Votre compte a été désactivé. Veuillez contacter la direction.');
      }
      
      console.log('[REX-AUTH] Profil chargé avec succès. Rôle:', profile?.role);
      
      login({
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || 'Utilisateur',
        role: (profile?.role?.toUpperCase() || 'CHAUFFEUR') as any,
        agenceId: profile?.agence_id || '',
        isActive: profile?.is_active ?? true
      }, data.session.access_token);

      toast.success('Connexion réussie', { description: 'Bienvenue sur Production Rex' });
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('[REX-AUTH] Erreur globale de login:', err.message);
      toast.error('Échec de la connexion', { 
        description: err.message || 'Identifiants incorrects ou problème réseau.' 
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
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-muted-foreground">Email Professionnel</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="nom@rex.cm" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 bg-secondary/30 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary font-bold text-sm" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-muted-foreground">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 bg-secondary/30 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary font-bold text-sm" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 mt-2" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Se connecter
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
