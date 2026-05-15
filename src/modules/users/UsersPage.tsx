import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { UserPlus, Users, Loader2, Trash2, ShieldCheck, Phone, CreditCard, PowerOff, Power } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'PDG' | 'CHEF_AGENCE' | 'CAISSIERE' | 'CHAUFFEUR';
  phone: string;
  cni_number: string;
  agence_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Agency {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CHEF_AGENCE' | 'CAISSIERE' | 'CHAUFFEUR'>('CAISSIERE');
  const [phone, setPhone] = useState('');
  const [cni, setCni] = useState('');
  const [agenceId, setAgenceId] = useState<string>('none');

  const isPDG = user?.role === 'PDG';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, agenciesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('agencies').select('id, name')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (agenciesRes.error) throw agenciesRes.error;

      let fetchedProfiles = profilesRes.data || [];
      
      // Le chef d'agence ne voit que les caissières (et les chauffeurs s'ils existent ici)
      if (!isPDG) {
        fetchedProfiles = fetchedProfiles.filter(p => p.role === 'CAISSIERE');
      }

      setProfiles(fetchedProfiles);
      setAgencies(agenciesRes.data || []);
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('Champs manquants', { description: 'Veuillez remplir au moins le nom, l\'email et le mot de passe.' });
      return;
    }

    setCreating(true);
    try {
      const targetRole = isPDG ? role : 'CAISSIERE';

      const { error } = await supabase.rpc('admin_create_user', {
        user_email: email,
        user_password: password,
        user_full_name: name,
        user_role: targetRole,
        user_phone: phone,
        user_cni: cni,
        user_agence_id: agenceId === 'none' ? null : agenceId
      });

      if (error) throw error;

      toast.success('Compte créé', { description: `L'utilisateur ${name} a été ajouté avec succès.` });
      
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setCni('');
      setAgenceId('none');
      
      fetchData();
    } catch (err: any) {
      toast.error('Erreur de création', { description: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
      if (error) throw error;
      
      toast.success('Utilisateur supprimé', { description: 'Le compte a été retiré avec succès.' });
      fetchData();
    } catch (err: any) {
      toast.error('Erreur de suppression', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const actionName = newStatus ? 'activer' : 'suspendre';
    if (!window.confirm(`Voulez-vous vraiment ${actionName} cet utilisateur ?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_toggle_user_status', { target_user_id: userId, new_status: newStatus });
      if (error) throw error;
      
      toast.success('Statut mis à jour', { description: `L'utilisateur a été ${newStatus ? 'activé' : 'suspendu'}.` });
      fetchData();
    } catch (err: any) {
      toast.error('Erreur de modification', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">Gestion des Comptes</h2>
        <p className="text-muted-foreground mt-1 font-medium">Créez et gérez les accès au système.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire de création */}
        <Card className="bg-white border-border shadow-sm rounded-2xl h-fit">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-foreground flex items-center font-black text-lg">
              <UserPlus className="mr-2 h-5 w-5 text-primary" /> Nouveau Compte
            </CardTitle>
            <CardDescription>Ajoutez un nouveau collaborateur au système.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom Complet</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Jean Dupont" className="bg-secondary/20 border-border rounded-xl h-11" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Identifiant)</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean.dupont@rex.cm" className="bg-secondary/20 border-border rounded-xl h-11" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe provisoire</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary/20 border-border rounded-xl h-11" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  {isPDG ? (
                    <select id="role" value={role} onChange={(e) => setRole(e.target.value as any)}
                      className="w-full rounded-xl bg-secondary/20 border border-border h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="CHEF_AGENCE">Chef d'Agence</option>
                      <option value="CAISSIERE">Caissière</option>
                    </select>
                  ) : (
                    <div className="flex items-center h-11 px-3 bg-secondary/10 border border-border rounded-xl text-sm text-muted-foreground font-bold">
                      Caissière (Auto)
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agence">Agence</Label>
                  <select id="agence" value={agenceId} onChange={(e) => setAgenceId(e.target.value)}
                    className="w-full rounded-xl bg-secondary/20 border border-border h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="none">Aucune</option>
                    {agencies.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3">Informations Complémentaires</p>
                <div className="space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Numéro de ligne" className="pl-10 bg-secondary/10 border-border rounded-xl h-11" />
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={cni} onChange={(e) => setCni(e.target.value)} placeholder="Numéro CNI" className="pl-10 bg-secondary/10 border-border rounded-xl h-11" />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl mt-4 shadow-lg shadow-primary/20" disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                Créer le compte
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-foreground flex items-center font-black text-lg">
                <Users className="mr-2 h-5 w-5 text-primary" /> Utilisateurs existants
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground font-medium">Aucun utilisateur trouvé.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border font-bold">
                      <tr>
                        <th className="px-6 py-4">Utilisateur</th>
                        <th className="px-6 py-4">Rôle</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Agence</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {profiles.map((p) => (
                        <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary uppercase text-xs">
                                {p.name.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              p.role === 'PDG' ? "bg-purple-100 text-purple-700" : 
                              p.role === 'CHEF_AGENCE' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                            )}>
                              {p.role === 'PDG' && <ShieldCheck className="h-3 w-3" />}
                              {p.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                              {p.is_active ? 'Actif' : 'Suspendu'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-muted-foreground">
                            {agencies.find(a => a.id === p.agence_id)?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {p.role !== 'PDG' && (isPDG || p.role === 'CAISSIERE') && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleToggleStatus(p.id, p.is_active)} 
                                  className={cn("p-2 rounded-lg transition-colors border shadow-sm", p.is_active ? "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100" : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100")}
                                  title={p.is_active ? "Suspendre" : "Activer"}>
                                  {p.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                </button>
                                <button onClick={() => handleDeleteUser(p.id)} className="text-destructive hover:bg-destructive/10 border border-destructive/20 p-2 rounded-lg transition-colors shadow-sm" title="Supprimer">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
