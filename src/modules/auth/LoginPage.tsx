import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2, LogIn, UserPlus, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

// ─── Validation schemas ───────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(6, { message: 'Minimum 6 caractères' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Nom requis (min. 2 caractères)' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(6, { message: 'Minimum 6 caractères' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

// ─── Logo Rex inline SVG ──────────────────────────────────────────────────────
const RexLogo = ({ size = 52 }: { size?: number }) => (
  <div
    style={{ width: size, height: size }}
    className="rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30 ring-2 ring-accent/30"
  >
    <span className="text-white font-black select-none" style={{ fontSize: size * 0.5 }}>R</span>
  </div>
);

// ─── Login form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitchMode }: { onSwitchMode: () => void }) {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      let role: 'ADMIN' | 'CHEF_AGENCE' | 'CAISSIERE' = 'CAISSIERE';
      if (data.email.includes('admin')) role = 'ADMIN';
      if (data.email.includes('chef')) role = 'CHEF_AGENCE';
      const name = role === 'ADMIN' ? 'PDG Rex' : role === 'CHEF_AGENCE' ? 'Chef Agence' : 'Caissière';
      login({ id: '1', email: data.email, name, role, isActive: true }, 'rex-jwt-token');
      toast.success('Connexion réussie', { description: `Bienvenue, ${name} !` });
      navigate('/');
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="login-email" className="text-white text-sm font-medium">Adresse email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="admin@rex.cm"
          className="bg-secondary/40 border-border text-white placeholder:text-muted-foreground focus-visible:ring-accent h-11"
          disabled={isLoading}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Mot de passe */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-white text-sm font-medium">Mot de passe</Label>
          <a
            href="#"
            className="text-xs font-semibold text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
            onClick={(e) => { e.preventDefault(); toast.info('Contactez votre administrateur Rex.'); }}
          >
            Mot de passe oublié ?
          </a>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="bg-secondary/40 border-border text-white placeholder:text-muted-foreground focus-visible:ring-accent h-11 pr-10"
            disabled={isLoading}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {/* Bouton Log In */}
      <Button
        type="submit"
        id="btn-login"
        className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 text-base shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
        disabled={isLoading}
      >
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>
        ) : (
          <><LogIn className="mr-2 h-5 w-5" />Log In</>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitchMode} className="text-accent font-semibold hover:underline">
          Créer un compte
        </button>
      </p>
    </form>
  );
}

// ─── Signup form ──────────────────────────────────────────────────────────────
function SignupForm({ onSwitchMode }: { onSwitchMode: () => void }) {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      login({ id: Date.now().toString(), email: data.email, name: data.name, role: 'CAISSIERE', isActive: true }, 'rex-jwt-token');
      toast.success('Compte créé !', { description: `Bienvenue, ${data.name} !` });
      navigate('/');
    } catch {
      toast.error('Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nom */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-name" className="text-white text-sm font-medium">Nom complet</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Jean Dupont"
          className="bg-secondary/40 border-border text-white placeholder:text-muted-foreground focus-visible:ring-accent h-11"
          disabled={isLoading}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className="text-white text-sm font-medium">Adresse email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="vous@rex.cm"
          className="bg-secondary/40 border-border text-white placeholder:text-muted-foreground focus-visible:ring-accent h-11"
          disabled={isLoading}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Mot de passe */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className="text-white text-sm font-medium">Mot de passe</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="bg-secondary/40 border-border text-white placeholder:text-muted-foreground focus-visible:ring-accent h-11 pr-10"
            disabled={isLoading}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {/* Bouton Sign Up */}
      <Button
        type="submit"
        id="btn-signup"
        className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 text-base shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
        disabled={isLoading}
      >
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</>
        ) : (
          <><UserPlus className="mr-2 h-5 w-5" />Sign Up</>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <button type="button" onClick={onSwitchMode} className="text-accent font-semibold hover:underline">
          Se connecter
        </button>
      </p>
    </form>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="w-full">
      {/* Logo + Titre */}
      <div className="flex flex-col items-center mb-8">
        <RexLogo size={64} />
        <h1 className="mt-4 text-3xl font-black text-white tracking-tight">Rex</h1>
        <p className="text-muted-foreground text-sm mt-1">Système de gestion du transport</p>
      </div>

      {/* Card principale */}
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Onglets Sign Up / Log In */}
        <div className="flex border-b border-border">
          <button
            type="button"
            id="tab-signup"
            onClick={() => setMode('signup')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-accent/10 text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-white hover:bg-secondary/50'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Sign Up
          </button>
          <button
            type="button"
            id="tab-login"
            onClick={() => setMode('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all ${
              mode === 'login'
                ? 'bg-accent/10 text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-white hover:bg-secondary/50'
            }`}
          >
            <LogIn className="h-4 w-4" />
            Log In
          </button>
        </div>

        {/* Contenu du formulaire */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' ? 'Connexion à votre espace' : 'Créer un compte Rex'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login'
                ? 'Entrez vos identifiants pour continuer'
                : 'Remplissez les informations ci-dessous'}
            </p>
          </div>

          {mode === 'login' ? (
            <LoginForm onSwitchMode={() => setMode('signup')} />
          ) : (
            <SignupForm onSwitchMode={() => setMode('login')} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-secondary/20 border-t border-border flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <p className="text-xs text-muted-foreground">Accès réservé au personnel autorisé de Rex</p>
        </div>
      </div>
    </div>
  );
}
