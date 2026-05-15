import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail, Lock, Loader2, UserPlus, Bus, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('Erreur', { description: 'Veuillez remplir tous les champs.' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      if (data.user && data.user.identities?.length === 0) {
        toast.error('Erreur', { description: 'Cet email est déjà utilisé.' });
      } else {
        toast.success('Inscription réussie', { description: 'Vous pouvez maintenant vous connecter.' });
        navigate('/login');
      }
    } catch (err: any) {
      toast.error("Échec de l'inscription", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-[2rem] shadow-2xl border border-border animate-in fade-in zoom-in duration-500">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-foreground">Accès Restreint</h1>
          <p className="text-muted-foreground text-sm font-bold">
            La création de compte est réservée à l'administrateur du système Production Rex.
          </p>
          <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground font-medium italic">
              Veuillez contacter votre chef d'agence ou la direction générale (PDG) pour obtenir vos identifiants de connexion.
            </p>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-border/50">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
            <Link to="/login">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
