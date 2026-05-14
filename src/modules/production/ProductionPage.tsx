import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Save, Calculator, FileText, CheckCircle, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'rex-productions';

const productionSchema = z.object({
  immatriculation: z.string().min(1, "L'immatriculation est requise"),
  driverName: z.string().min(1, 'Le nom du chauffeur est requis'),
  totalSeats: z.number({ coerce: true }).min(1, 'Capacité requise'),
  passengersAtDeparture: z.number({ coerce: true }).min(0, 'Nombre de passagers requis'),
  revenue: z.number({ coerce: true }).min(0, 'La recette est requise'),
  fuel: z.number({ coerce: true }).min(0).default(0),
  toll: z.number({ coerce: true }).min(0).default(0),
  washing: z.number({ coerce: true }).min(0).default(0),
  others: z.number({ coerce: true }).min(0).default(0),
});

type ProductionFormValues = z.infer<typeof productionSchema>;

interface ProductionRecord extends ProductionFormValues {
  id: string;
  netToDeposit: number;
  date: string;
}

export default function ProductionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<ProductionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ProductionFormValues>({
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

  // Charger l'historique depuis localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setHistory(JSON.parse(stored)); } catch { }
    }
  }, []);

  const onSubmit = async (data: ProductionFormValues) => {
    setIsSubmitting(true);
    setSaved(false);
    try {
      // Création de l'enregistrement avec ID unique et date
      const record: ProductionRecord = {
        ...data,
        id: `prod-${Date.now()}`,
        netToDeposit,
        date: new Date().toISOString(),
      };

      // Persistance réelle dans localStorage
      const existing = localStorage.getItem(STORAGE_KEY);
      const all: ProductionRecord[] = existing ? JSON.parse(existing) : [];
      const updated = [record, ...all];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistory(updated);

      // Confirmation visuelle UNIQUEMENT après sauvegarde réussie
      setSaved(true);
      toast.success('Production enregistrée', {
        description: `Net à verser : ${netToDeposit.toLocaleString()} XAF`,
      });

      // Reset après 2 secondes
      setTimeout(() => {
        reset({ totalSeats: 30, fuel: 0, toll: 0, washing: 0, others: 0 });
        setSaved(false);
      }, 2000);
    } catch (error) {
      toast.error('Erreur', { description: "Impossible d'enregistrer la production" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRecord = (id: string) => {
    const updated = history.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setHistory(updated);
    toast.success('Entrée supprimée');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Production Quotidienne</h2>
          <p className="text-muted-foreground">Enregistrez les départs et calculez le net à verser.</p>
        </div>
        <Button
          variant="outline"
          className="border-border text-white hover:bg-secondary"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="mr-2 h-4 w-4" />
          Historique ({history.length})
        </Button>
      </div>

      {/* Historique */}
      {showHistory && history.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Historique des productions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Véhicule</th>
                    <th className="px-3 py-2 text-left">Chauffeur</th>
                    <th className="px-3 py-2 text-right">Recette</th>
                    <th className="px-3 py-2 text-right">Net</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-secondary/20">
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-2 text-white font-medium">{r.immatriculation}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.driverName}</td>
                      <td className="px-3 py-2 text-right text-white">{Number(r.revenue).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-accent font-bold">{r.netToDeposit.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => deleteRecord(r.id)} className="text-destructive hover:opacity-70">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="mr-2 h-5 w-5 text-accent" />
                Fiche de Production
              </CardTitle>
              <CardDescription>Saisissez les informations du voyage</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="production-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Véhicule (Immatriculation)</Label>
                    <Input {...register('immatriculation')} placeholder="Ex: CE 123 45" className="bg-secondary/50 border-border text-white" />
                    {errors.immatriculation && <p className="text-xs text-destructive">{errors.immatriculation.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Chauffeur</Label>
                    <Input {...register('driverName')} placeholder="Nom du chauffeur" className="bg-secondary/50 border-border text-white" />
                    {errors.driverName && <p className="text-xs text-destructive">{errors.driverName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label className="text-white">Places Totales</Label>
                    <Input type="number" {...register('totalSeats')} className="bg-secondary/50 border-border text-white" />
                    {errors.totalSeats && <p className="text-xs text-destructive">{errors.totalSeats.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Passagers (Départ)</Label>
                    <Input type="number" {...register('passengersAtDeparture')} className="bg-secondary/50 border-border text-white" />
                    {errors.passengersAtDeparture && <p className="text-xs text-destructive">{errors.passengersAtDeparture.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Montant Total (Recette)</Label>
                    <Input type="number" {...register('revenue')} className="bg-secondary/50 border-border text-white focus-visible:ring-accent font-bold" />
                    {errors.revenue && <p className="text-xs text-destructive">{errors.revenue.message}</p>}
                  </div>
                </div>

                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="text-sm font-medium text-white">Dépenses (XAF)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['fuel', 'toll', 'washing', 'others'] as const).map((field, i) => (
                      <div key={field} className="space-y-2">
                        <Label className="text-muted-foreground">{['Carburant', 'Péage', 'Laverie', 'Autres'][i]}</Label>
                        <Input type="number" {...register(field)} className="bg-secondary/50 border-border text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border sticky top-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calculator className="mr-2 h-5 w-5 text-accent" />
                Résumé & Calcul
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Recette Brut</span>
                <span className="font-semibold text-white">{Number(revenue).toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Total Dépenses</span>
                <span className="font-semibold text-destructive">- {totalExpenses.toLocaleString()} XAF</span>
              </div>

              <div className="pt-2 pb-2">
                <div className="flex justify-between items-center bg-accent/10 p-4 rounded-lg border border-accent/20">
                  <span className="text-accent font-bold">NET À VERSER</span>
                  <span className="text-xl font-bold text-accent">{netToDeposit.toLocaleString()} XAF</span>
                </div>
              </div>

              {/* Confirmation visuelle après sauvegarde */}
              {saved && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 text-sm font-medium">Production sauvegardée !</span>
                </div>
              )}

              <Button
                type="submit"
                form="production-form"
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold mt-2 h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Enregistrement...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Enregistrer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
