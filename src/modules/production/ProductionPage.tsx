import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { FileText, History, Loader2, Bus, Trash2, Calculator, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Skeleton } from '../../components/ui/skeleton';

const productionSchema = z.object({
  immatriculation: z.string().min(1, "L'immatriculation est requise"),
  driverName: z.string().min(1, 'Le nom du chauffeur est requis'),
  totalSeats: z.coerce.number().min(1, 'Capacité requise'),
  passengersAtDeparture: z.coerce.number().min(0, 'Nombre de passagers requis'),
  revenue: z.coerce.number().min(0, 'La recette est requise'),
  fuel: z.coerce.number().min(0).default(0),
  toll: z.coerce.number().min(0).default(0),
  washing: z.coerce.number().min(0).default(0),
  others: z.coerce.number().min(0).default(0),
});
type ProductionFormValues = z.infer<typeof productionSchema>;

interface ProductionRecord {
  id: string;
  immatriculation: string;
  driver_name: string;
  total_seats: number;
  passengers_at_departure: number;
  revenue: number;
  expense_fuel: number;
  expense_toll: number;
  expense_washing: number;
  expense_others: number;
  net_to_deposit: number;
  date: string;
  status: string;
  created_at: string;
}

export default function ProductionPage() {
  const user = useAuthStore((s) => s.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<ProductionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(productionSchema),
    defaultValues: { totalSeats: 30, fuel: 0, toll: 0, washing: 0, others: 0 },
  });

  const revenue = useWatch({ control, name: 'revenue', defaultValue: 0 }) || 0;
  const fuel = useWatch({ control, name: 'fuel', defaultValue: 0 }) || 0;
  const toll = useWatch({ control, name: 'toll', defaultValue: 0 }) || 0;
  const washing = useWatch({ control, name: 'washing', defaultValue: 0 }) || 0;
  const others = useWatch({ control, name: 'others', defaultValue: 0 }) || 0;

  const totalExpenses = Number(fuel) + Number(toll) + Number(washing) + Number(others);
  const netToDeposit = Number(revenue) - totalExpenses;

  const isAdmin = user?.role === 'PDG';
  const isChef = user?.role === 'CHEF_AGENCE';
  const canValidate = isAdmin || isChef;

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('productions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      toast.error('Erreur de chargement', { description: err.message });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const onSubmit = async (data: ProductionFormValues) => {
    setIsSubmitting(true);
    setSaved(false);
    try {
      const { error } = await supabase.from('productions').insert({
        immatriculation: data.immatriculation,
        driver_name: data.driverName,
        total_seats: data.totalSeats,
        passengers_at_departure: data.passengersAtDeparture,
        revenue: data.revenue,
        expense_fuel: data.fuel,
        expense_toll: data.toll,
        expense_washing: data.washing,
        expense_others: data.others,
        status: 'DRAFT',
        created_by: user?.id,
        date: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;

      setSaved(true);
      toast.success('Production enregistrée', {
        description: `Net à verser : ${netToDeposit.toLocaleString()} XAF`,
      });
      fetchHistory();
      setTimeout(() => {
        reset({ totalSeats: 30, fuel: 0, toll: 0, washing: 0, others: 0 });
        setSaved(false);
      }, 2000);
    } catch (err: any) {
      console.error('Production save error:', err);
      toast.error('Erreur', { description: err.message || "Impossible d'enregistrer la production" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette entrée ?')) return;
    const { error } = await supabase.from('productions').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression'); return; }
    setHistory((prev) => prev.filter((r) => r.id !== id));
    toast.success('Entrée supprimée');
  };

  const validateRecord = async (id: string) => {
    if (!window.confirm('Voulez-vous valider cette production ? Cette action est irréversible.')) return;
    const { error } = await supabase.from('productions').update({ status: 'VALIDATED' }).eq('id', id);
    if (error) { toast.error('Erreur de validation'); return; }
    setHistory((prev) => prev.map((r) => r.id === id ? { ...r, status: 'VALIDATED' } : r));
    toast.success('Production validée');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">Saisie de Production</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Enregistrement des recettes journalières</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="rounded-xl h-10 border-border bg-white font-bold text-xs shadow-sm">
            <History className="mr-2 h-4 w-4" /> {showHistory ? 'Nouveau bordereau' : 'Historique & Validation'}
          </Button>
        </div>
      </div>

      {showHistory && (
        <Card className="bg-white border-border shadow-2xl rounded-[1.25rem] overflow-hidden border-2 animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-primary/5 p-6 border-b border-border/50">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" /> Détails du Voyage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingHistory ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 font-medium">Aucune production enregistrée.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="text-xs font-bold uppercase bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Véhicule</th>
                      <th className="px-4 py-3 text-left">Chauffeur</th>
                      <th className="px-4 py-3 text-right">Recette</th>
                      <th className="px-4 py-3 text-right">Net</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {history.map((r) => (
                      <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground text-xs font-medium">
                          {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-foreground font-bold">{r.immatriculation}</td>
                        <td className="px-4 py-3 text-muted-foreground font-medium">{r.driver_name}</td>
                        <td className="px-4 py-3 text-right text-foreground font-medium">{Number(r.revenue).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-primary font-black">{Number(r.net_to_deposit).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-widest uppercase ${r.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {r.status === 'DRAFT' ? 'EN ATTENTE' : r.status === 'VALIDATED' ? 'VALIDÉ' : r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {r.status === 'DRAFT' && canValidate && (
                              <button onClick={() => validateRecord(r.id)} className="text-green-600 bg-green-50 hover:bg-green-100 p-1.5 rounded-lg transition-colors border border-green-200" title="Valider">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {r.status === 'DRAFT' && (
                              <button onClick={() => deleteRecord(r.id)} className="text-destructive bg-destructive/5 hover:bg-destructive/10 p-1.5 rounded-lg transition-colors border border-destructive/20" title="Supprimer">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-white border-border shadow-sm rounded-2xl">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-foreground flex items-center font-black text-xl">
                <FileText className="mr-3 h-6 w-6 text-primary" />Fiche de Production
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium ml-9">Saisissez les informations du voyage de manière précise.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form id="production-form" onSubmit={handleSubmit((data) => onSubmit(data as ProductionFormValues))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label className="text-foreground font-bold text-sm transition-colors group-focus-within:text-primary">Véhicule (Immatriculation)</Label>
                    <Input {...register('immatriculation')} placeholder="Ex: CE 123 45" className="bg-secondary/20 border-border text-foreground rounded-xl h-12 focus-visible:ring-primary focus-visible:bg-white shadow-sm transition-all duration-300" />
                    {errors.immatriculation && <p className="text-xs text-destructive font-semibold">{errors.immatriculation.message}</p>}
                  </div>
                  <div className="space-y-2 group">
                    <Label className="text-foreground font-bold text-sm transition-colors group-focus-within:text-primary">Chauffeur</Label>
                    <Input {...register('driverName')} placeholder="Nom du chauffeur" className="bg-secondary/20 border-border text-foreground rounded-xl h-12 focus-visible:ring-primary focus-visible:bg-white shadow-sm transition-all duration-300" />
                    {errors.driverName && <p className="text-xs text-destructive font-semibold">{errors.driverName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border/50 pt-6">
                  <div className="space-y-2 group">
                    <Label className="text-foreground font-bold text-sm transition-colors group-focus-within:text-primary">Places Totales</Label>
                    <Input type="number" {...register('totalSeats')} className="bg-secondary/20 border-border text-foreground rounded-xl h-12 focus-visible:ring-primary focus-visible:bg-white shadow-sm transition-all duration-300" />
                    {errors.totalSeats && <p className="text-xs text-destructive font-semibold">{errors.totalSeats.message}</p>}
                  </div>
                  <div className="space-y-2 group">
                    <Label className="text-foreground font-bold text-sm transition-colors group-focus-within:text-primary">Passagers (Départ)</Label>
                    <Input type="number" {...register('passengersAtDeparture')} className="bg-secondary/20 border-border text-foreground rounded-xl h-12 focus-visible:ring-primary focus-visible:bg-white shadow-sm transition-all duration-300" />
                    {errors.passengersAtDeparture && <p className="text-xs text-destructive font-semibold">{errors.passengersAtDeparture.message}</p>}
                  </div>
                  <div className="space-y-2 group relative">
                    <Label className="text-primary font-black text-sm uppercase tracking-wider">Recette Totale</Label>
                    <Input type="number" {...register('revenue')} className="bg-primary/5 border-primary/30 text-primary rounded-xl h-12 focus-visible:ring-primary font-black shadow-sm text-lg transition-all duration-300" />
                    {errors.revenue && <p className="text-xs text-destructive font-semibold">{errors.revenue.message}</p>}
                  </div>
                </div>
                <div className="space-y-5 border-t border-border/50 pt-6">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive"></span> Dépenses (XAF)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/10 p-5 rounded-2xl border border-border/50 hover:bg-secondary/20 transition-colors">
                    {(['fuel', 'toll', 'washing', 'others'] as const).map((field, i) => (
                      <div key={field} className="space-y-2 group">
                        <Label className="text-muted-foreground font-semibold text-xs uppercase transition-colors group-focus-within:text-foreground">{['Carburant', 'Péage', 'Laverie', 'Autres'][i]}</Label>
                        <Input type="number" {...register(field)} className="bg-white border-border text-foreground rounded-xl h-11 focus-visible:ring-destructive focus-visible:border-destructive shadow-sm transition-all duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white border-border shadow-sm rounded-2xl sticky top-6">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-foreground flex items-center font-black text-lg">
                <Calculator className="mr-2 h-5 w-5 text-primary" />Résumé & Calcul
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Recette Brut</span>
                <span className="font-bold text-foreground text-lg">{Number(revenue).toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Total Dépenses</span>
                <span className="font-bold text-destructive text-lg">- {totalExpenses.toLocaleString()} XAF</span>
              </div>
              <div className="pt-2 pb-2">
                <div className="flex justify-between items-center bg-primary/5 p-5 rounded-xl border border-primary/20 shadow-inner">
                  <span className="text-primary font-black tracking-tight">NET À VERSER</span>
                  <span className="text-2xl font-black text-primary">{netToDeposit.toLocaleString()} XAF</span>
                </div>
              </div>
              {saved && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-green-700 text-sm font-bold">Production sauvegardée avec succès !</span>
                </div>
              )}
              <Button type="submit" form="production-form"
                className="w-full bg-foreground hover:bg-foreground/90 text-white font-bold mt-4 h-14 rounded-xl shadow-lg shadow-foreground/10 text-lg transition-all hover:-translate-y-0.5"
                disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-5 w-5" />Enregistrer la fiche</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
