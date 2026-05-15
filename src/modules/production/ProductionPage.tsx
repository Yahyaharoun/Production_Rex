import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Save, Calculator, FileText, CheckCircle, History, Trash2, Loader2 } from 'lucide-react';
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
      toast.error('Erreur', { description: err.message || "Impossible d'enregistrer la production" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from('productions').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression'); return; }
    setHistory((prev) => prev.filter((r) => r.id !== id));
    toast.success('Entrée supprimée');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Production Quotidienne</h2>
          <p className="text-muted-foreground mt-1 font-medium">Enregistrez les départs et calculez le net à verser.</p>
        </div>
        <Button variant="outline" className="border-border text-foreground hover:bg-secondary font-bold shadow-sm"
          onClick={() => { setShowHistory(!showHistory); }}>
          <History className="mr-2 h-4 w-4" />
          Historique ({history.length})
        </Button>
      </div>

      {showHistory && (
        <Card className="bg-white border-border shadow-md rounded-2xl">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Historique des productions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
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
                      <th className="px-4 py-3"></th>
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
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-widest uppercase ${r.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-secondary text-muted-foreground'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === 'DRAFT' && (
                            <button onClick={() => deleteRecord(r.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-foreground font-bold text-sm">Véhicule (Immatriculation)</Label>
                    <Input {...register('immatriculation')} placeholder="Ex: CE 123 45" className="bg-secondary/20 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary shadow-sm" />
                    {errors.immatriculation && <p className="text-xs text-destructive font-semibold">{errors.immatriculation.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-bold text-sm">Chauffeur</Label>
                    <Input {...register('driverName')} placeholder="Nom du chauffeur" className="bg-secondary/20 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary shadow-sm" />
                    {errors.driverName && <p className="text-xs text-destructive font-semibold">{errors.driverName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-border/50 pt-5">
                  <div className="space-y-2">
                    <Label className="text-foreground font-bold text-sm">Places Totales</Label>
                    <Input type="number" {...register('totalSeats')} className="bg-secondary/20 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary shadow-sm" />
                    {errors.totalSeats && <p className="text-xs text-destructive font-semibold">{errors.totalSeats.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-bold text-sm">Passagers (Départ)</Label>
                    <Input type="number" {...register('passengersAtDeparture')} className="bg-secondary/20 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary shadow-sm" />
                    {errors.passengersAtDeparture && <p className="text-xs text-destructive font-semibold">{errors.passengersAtDeparture.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-black text-sm text-primary">Montant Total (Recette)</Label>
                    <Input type="number" {...register('revenue')} className="bg-white border-primary/30 text-foreground rounded-xl h-11 focus-visible:ring-primary font-black shadow-sm" />
                    {errors.revenue && <p className="text-xs text-destructive font-semibold">{errors.revenue.message}</p>}
                  </div>
                </div>
                <div className="space-y-4 border-t border-border/50 pt-5">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Dépenses (XAF)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/10 p-4 rounded-xl border border-border/50">
                    {(['fuel', 'toll', 'washing', 'others'] as const).map((field, i) => (
                      <div key={field} className="space-y-2">
                        <Label className="text-muted-foreground font-semibold text-xs uppercase">{['Carburant', 'Péage', 'Laverie', 'Autres'][i]}</Label>
                        <Input type="number" {...register(field)} className="bg-white border-border text-foreground rounded-lg h-10 focus-visible:ring-primary shadow-sm" />
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
