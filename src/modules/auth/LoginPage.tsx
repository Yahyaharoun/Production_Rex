import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { User, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      
      login({
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || 'Utilisateur',
        role: profile?.role || 'CHAUFFEUR',
        agenceId: profile?.agence_id || '',
        isActive: profile?.is_active ?? true
      }, data.session.access_token);

      toast.success('Connexion réussie', { description: 'Bienvenue sur Rex Transport' });
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Échec de la connexion', { 
        description: err.message === 'Invalid login credentials' 
          ? 'Identifiants incorrects.' 
          : `Erreur: ${err.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8">
        <h2 className="text-[2rem] font-bold text-foreground mb-2">Sign in</h2>
        <p className="text-xs text-muted-foreground font-medium">
          Entrez vos identifiants pour accéder au système sécurisé de Rex Transport.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Field */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input 
            type="email" 
            placeholder="User Name (Email)" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 bg-slate-50 border-none h-14 rounded-xl text-sm font-semibold shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50"
            required
          />
        </div>

        {/* Password Field */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-12 pr-20 bg-slate-50 border-none h-14 rounded-xl text-sm font-semibold shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50"
            required
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between mt-6 mb-6">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
          </label>
          <a href="#" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full h-14 bg-[#1a4a6b] hover:bg-[#1a4a6b]/90 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-[#1a4a6b]/20 transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: 'hsl(var(--primary))' }} // Override avec la couleur verte du thème
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border/60"></div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Or</span>
          <div className="flex-1 h-px bg-border/60"></div>
        </div>

        {/* Other Login Button */}
        <Button 
          type="button"
          variant="outline"
          onClick={() => toast.info('Bientôt disponible', { description: 'La connexion avec Google/Apple sera activée prochainement.' })}
          className="w-full h-14 border-2 border-border/50 text-foreground rounded-xl font-bold text-sm tracking-wide hover:bg-secondary/50 transition-colors"
        >
          Sign in with other
        </Button>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs font-medium text-muted-foreground">
            Don't have an account? <a href="#" className="text-primary font-bold hover:underline">Sign up</a>
          </p>
        </div>
      </form>
    </div>
  );
}
