import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
  FileText, History, Loader2, Bus, Trash2, Calculator,
  Save, CheckCircle, MapPin, User, Star, AlertCircle, RefreshCw, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Skeleton } from '../../components/ui/skeleton';
import { db } from '../../lib/dexie';
import { stripSensitiveFields } from '../../lib/utils';
import { TicketPrint } from './TicketPrint';

//  Tarifs dynamiques par agence 
const getPrice = (agenceName: string, type: 'CLASSIQUE' | 'VIP'): number => {
  const name = agenceName.toLowerCase();
  if (name.includes('mbalmayo') || name.includes('yaoundé') || name.includes('yaounde')) {
    return type === 'VIP' ? 1000 : 700;
  }
  if (name.includes('mimboman') || name.includes('akonolinga')) {
    return 1500;
  }
  if (name.includes('mimbone') || name.includes('ayos')) {
    return 2000;
  }
  // Prix par défaut
  return type === 'VIP' ? 1000 : 700;
};

//  Schéma de validation 
const productionSchema = z.object({
  immatriculation: z.string().min(1, "L'immatriculation est requise"),
  driverName: z.string().min(1, 'Le nom du chauffeur est requis'),
  totalSeats: z.coerce.number().min(1, 'Capacité requise'),
  passengersAtDeparture: z.coerce.number().min(0, 'Nombre de passagers requis'),
  productionType: z.enum(['CLASSIQUE', 'VIP'], {
    message: 'Sélectionnez le type de production',
  }),
  fuel: z.coerce.number().min(0).default(0),
  ligne: z.string().min(1, 'La ligne est requise'),
});

type ProductionFormValues = z.infer<typeof productionSchema>;

interface Agency {
  id: string;
  name: string;
  city: string;
}

interface ProductionRecord {
  id: string;
  immatriculation: string;
  driver_name: string;
  total_seats: number;
  passengers_at_departure: number;
  revenue: number;
  expense_fuel: number;
  net_to_deposit: number;
  date: string;
  status: string;
  created_at: string;
  caissiere_name?: string;
  ligne?: string;
  agence_id?: string;
  production_type?: 'CLASSIQUE' | 'VIP';
  price_per_ticket?: number;
}

export default function ProductionPage() {
  const user = useAuthStore((s) => s.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<ProductionRecord[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agenciesError, setAgenciesError] = useState<string | null>(null);
  const [agenciesLoading, setAgenciesLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [validatingAll, setValidatingAll] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  const roleStr = String(user?.role || '').toUpperCase().trim();
  const isAdmin = roleStr === 'PDG' || roleStr === 'ADMIN';
  const isChef = roleStr === 'CHEF_AGENCE' || roleStr === 'CHEF D\'AGENCE' || roleStr === 'CHEF AGENCE';
  const canValidate = isAdmin || isChef;
  const userAgenceId = user?.agenceId || '';

  const {
    register, control, handleSubmit, reset, setValue,
    formState: { errors },
  } = useForm<ProductionFormValues>({
    resolver: zodResolver(productionSchema) as any,
    defaultValues: {
      totalSeats: 30,
      fuel: 0,
      ligne: '',
      productionType: 'CLASSIQUE',
    },
  });

  // Watchers pour calcul automatique
  const passengersAtDeparture = useWatch({ control, name: 'passengersAtDeparture', defaultValue: 0 }) || 0;
  const productionType = useWatch({ control, name: 'productionType', defaultValue: 'CLASSIQUE' });
  const fuel    = useWatch({ control, name: 'fuel',    defaultValue: 0 }) || 0;

  const ligne = useWatch({ control, name: 'ligne', defaultValue: '' }) || '';

  //  Calculs automatiques 
  const pricePerTicket = getPrice(ligne, productionType as 'CLASSIQUE' | 'VIP');
  const revenue = Number(passengersAtDeparture) * pricePerTicket;
  const totalExpenses = Number(fuel);
  const netToDeposit = revenue - totalExpenses;

  //  Chargement des agences 
  const fetchAgencies = async () => {
    setAgenciesLoading(true);
    setAgenciesError(null);
    try {
      let dataToUse: Agency[] = [];
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('agencies')
          .select('id, name, city')
          .order('name');
        if (error) throw error;
        dataToUse = data || [];
        if (dataToUse.length > 0) {
          await db.agencies.clear();
          await db.agencies.bulkPut(dataToUse);
        }
      } else {
        dataToUse = await db.agencies.toArray();
      }

      if (!dataToUse || dataToUse.length === 0) {
        setAgenciesError('Aucune agence disponible. Contactez l\'administrateur.');
        setAgencies([]);
        return;
      }

      setAgencies(dataToUse);

      // Pré-sélectionner l'agence de l'utilisateur
      if (userAgenceId) {
        const myAgence = dataToUse.find((a: Agency) => a.id === userAgenceId);
        if (myAgence) setValue('ligne', myAgence.name, { shouldValidate: true });
      }
    } catch (err: unknown) {
      const msg = (err as any)?.message || 'Connexion à la base de données impossible';
      setAgenciesError(`Erreur de chargement des agences : ${msg}`);
      setAgencies([]);
      console.error('[ProductionPage] fetchAgencies error:', err);
    } finally {
      setAgenciesLoading(false);
    }
  };

  //  Chargement de l'historique 
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      let dataToUse: any[] = [];
      if (navigator.onLine) {
        let query = supabase
          .from('productions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        // Filtrer par agence pour les non-admins
        if (!isAdmin && user?.lineIds && user.lineIds.length > 0) {
          query = query.in('agence_id', user.lineIds);
        }

        const { data, error } = await query;
        if (error) throw error;
        dataToUse = data || [];
      } else {
        const allProds = await db.productions.toArray();
        if (!isAdmin && user?.lineIds && user.lineIds.length > 0) {
          dataToUse = allProds.filter(p => user.lineIds.includes(p.agence_id || p.agenceId));
        } else {
          dataToUse = allProds;
        }
        dataToUse.sort((a, b) => b.created_at?.localeCompare(a.created_at));
      }
      
      const dataWithType = dataToUse.map((r: any) => ({
        ...r,
        production_type: r.immatriculation?.includes('(VIP)') ? 'VIP' : 'CLASSIQUE'
      }));
      setHistory(dataWithType);
    } catch (err: unknown) {
      toast.error('Erreur de chargement de l\'historique', { description: (err as any)?.message });
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('vehicles').select('*');
        if (data) {
           setVehicles(data);
           // Update local Dexie for offline
           await db.vehicles.clear();
           await db.vehicles.bulkPut(data.map(v => ({...v, clientId: v.id})));
        }
      } else {
        const localData = await db.vehicles.toArray();
        setVehicles(localData);
      }
    } catch (err) {
      console.error('Erreur chargement véhicules:', err);
    }
  };

  useEffect(() => {
    fetchAgencies();
    fetchHistory();
    fetchVehicles();
  }, []);

  const watchedImmat = useWatch({ control, name: 'immatriculation' });
  useEffect(() => {
    if (watchedImmat && vehicles.length > 0) {
      const normalize = (s: string) => s.replace(/[\s-]/g, '').toUpperCase();
      const v = vehicles.find(v => normalize(v.immatriculation) === normalize(watchedImmat));
      if (v) {
        if (v.total_seats) setValue('totalSeats', v.total_seats);
        if (v.default_driver_name) setValue('driverName', v.default_driver_name);
        if (v.production_type) setValue('productionType', v.production_type);
      }
    }
  }, [watchedImmat, vehicles, setValue]);

  //  Soumission du formulaire 
  const onSubmit = async (data: ProductionFormValues) => {
    setIsSubmitting(true);
    setSaved(false);
    try {
      // Validate that the vehicle is recognized
      const normalize = (s: string) => (s || '').replace(/[\s\-_]/g, '').toUpperCase();
      const searchImmat = normalize(data.immatriculation);

      const matchedVehicle = vehicles.find(v => normalize(v.immatriculation) === searchImmat);
      if (!matchedVehicle) {
        toast.error("Immatriculation invalide", { 
          description: "Cette immatriculation n'est pas reconnue dans la base de données. Veuillez utiliser une immatriculation existante." 
        });
        return;
      }

      const selectedAgence = agencies.find((a) => a.name === data.ligne);
      const agenceId = selectedAgence?.id || userAgenceId || null;
      const calculatedRevenue = Number(data.passengersAtDeparture) * pricePerTicket;
      const calculatedNet = calculatedRevenue - Number(data.fuel);

      const clientId = crypto.randomUUID();

      // Payload complet (utiliser l'immatriculation normalisée de la BD)
      const baseImmat = matchedVehicle.immatriculation;
      const payload = {
        immatriculation: data.productionType === 'VIP' ? `${baseImmat} (VIP)` : baseImmat,
        driver_name: data.driverName,
        total_seats: data.totalSeats,
        passengers_at_departure: data.passengersAtDeparture,
        revenue: calculatedRevenue,
        expense_fuel: data.fuel,
        expense_toll: 0,
        expense_washing: 0,
        expense_others: 0,
        net_to_deposit: calculatedNet,
        status: 'DRAFT',
        created_by: user?.id,
        date: new Date().toISOString().split('T')[0],
        trip_number: `PRX${new Date().toISOString().slice(2,10).replace(/-/g,'')}${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`,
        caissiere_name: user?.name || '',
        ligne: data.ligne,
        agence_id: agenceId,
        production_type: data.productionType,
        price_per_ticket: pricePerTicket,
        client_id: clientId,
      };

      if (user?.role === 'AGENT_RECETTE') {
        const localEntry = {
          clientId,
          immatriculation: payload.immatriculation,
          driver_name: payload.driver_name,
          total_seats: payload.total_seats,
          passengers_at_departure: payload.passengers_at_departure,
          revenue: payload.revenue,
          expense_fuel: payload.expense_fuel,
          expense_toll: 0,
          expense_washing: 0,
          expense_others: 0,
          net_to_deposit: calculatedNet,
          production_type: data.productionType,
          price_per_ticket: pricePerTicket,
          status: 'TICKET_ONLY',
          date: payload.date,
          trip_number: payload.trip_number,
          caissiere_name: payload.caissiere_name,
          ligne: data.ligne,
          agence_id: agenceId || '',
          created_at: new Date().toISOString(),
          synced: true, // true pour ne pas déclencher la file d'attente
        };
        await db.productions.put(localEntry);
        setTicketData({
          id: localEntry.clientId,
          ticketNumber: localEntry.clientId.split('-')[0].toUpperCase(),
          date: new Date().toLocaleDateString('fr-FR'),
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          tripNumber: payload.trip_number,
          vehicleImmat: payload.immatriculation,
          driverName: payload.driver_name,
          passengers: payload.passengers_at_departure,
          revenue: calculatedRevenue,
          agentName: user?.name || '',
          ligne: data.ligne,
          productionType: data.productionType
        });

        toast.success('Production enregistrée !', {
        });
        toast.success('Ticket généré !', {
          description: `Bordereau prêt pour l'impression.`,
        });
      } else if (navigator.onLine) {
        // En ligne : envoi direct à Supabase
        const sanitized = stripSensitiveFields(payload);
        // Remove client_id since it's only for local offline tracking
        delete (sanitized as any).client_id;
        
        const { error } = await supabase.from('productions').insert(sanitized);
        if (error) throw error;

        // Aussi sauvegarder localement pour que ce soit visible hors-ligne
        await db.productions.put({
          clientId,
          immatriculation: payload.immatriculation,
          driver_name: payload.driver_name,
          total_seats: payload.total_seats,
          passengers_at_departure: payload.passengers_at_departure,
          revenue: payload.revenue,
          expense_fuel: payload.expense_fuel,
          expense_toll: 0,
          expense_washing: 0,
          expense_others: 0,
          net_to_deposit: calculatedNet,
          production_type: data.productionType,
          price_per_ticket: pricePerTicket,
          status: 'DRAFT',
          date: payload.date,
          caissiere_name: payload.caissiere_name,
          ligne: data.ligne,
          agence_id: agenceId || '',
          created_at: new Date().toISOString(),
          synced: true,
        });

        toast.success('Production enregistrée !', {
          description: `${data.productionType} · ${data.passengersAtDeparture} pass. × ${pricePerTicket.toLocaleString()} FCFA = Net: ${calculatedNet.toLocaleString()} FCFA`,
        });
      } else {
        // Hors-ligne : sauvegarde dans IndexedDB + file d'attente de sync
        const localEntry = {
          clientId,
          immatriculation: payload.immatriculation,
          driver_name: payload.driver_name,
          total_seats: payload.total_seats,
          passengers_at_departure: payload.passengers_at_departure,
          revenue: payload.revenue,
          expense_fuel: payload.expense_fuel,
          expense_toll: 0,
          expense_washing: 0,
          expense_others: 0,
          net_to_deposit: calculatedNet,
          production_type: data.productionType,
          price_per_ticket: pricePerTicket,
          status: 'DRAFT',
          date: payload.date,
          caissiere_name: payload.caissiere_name,
          ligne: data.ligne,
          agence_id: agenceId || '',
          created_at: new Date().toISOString(),
          synced: false,
        };

        await db.productions.put(localEntry);

        // Ajouter dans la file de sync pour envoi dès que connexion revient
        await db.syncQueue.add({
          clientId,
          table: 'productions',
          action: 'INSERT',
          payload: {
            ...payload,
            net_to_deposit: calculatedNet,
          },
          status: 'PENDING',
          retries: 0,
          createdAt: new Date().toISOString(),
        });

        toast.success('Production sauvegardée localement', {
          description: `⚡ Hors-ligne. Sera synchronisée automatiquement dès que vous aurez internet.`,
          duration: 6000,
        });
      }

      setSaved(true);
      await fetchHistory();
      setTimeout(() => setSaved(false), 3000);

      // Afficher le ticket thermique pour l'Agent Production
      if (user?.role === 'CAISSIERE' || user?.role === 'AGENT_RECETTE') {
        setTicketData({
          id: clientId, // we don't have the real DB ID if online without returning it, so we use clientId
          companyName: 'PRODUCTION REX',
          ticketNumber: clientId.split('-')[0].toUpperCase(),
          date: new Date().toLocaleDateString('fr-FR'),
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          tripNumber: payload.trip_number,
          vehicleImmat: payload.immatriculation,
          driverName: data.driverName,
          passengers: data.passengersAtDeparture,
          revenue: calculatedRevenue,
          agentName: user?.name || '',
          ligne: data.ligne,
          productionType: data.productionType,
        });
      }

      // Réinitialiser partiellement
      reset({
        totalSeats: 30,
        fuel: 0,
        ligne: data.ligne,
        productionType: 'CLASSIQUE',
        immatriculation: '',
        driverName: '',
        passengersAtDeparture: 0,
      });
    } catch (err: unknown) {
      toast.error('Erreur d\'enregistrement', { description: (err as any)?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  //  Suppression 
  const handleDelete = async (id: string) => {
    if (!canValidate) return;
    if (!confirm('Voulez-vous vraiment supprimer cette production ?')) return;
    const { error } = await supabase.from('productions').delete().eq('id', id);
    if (!error) {
      toast.success('Production supprime');
      fetchHistory();
    } else {
      toast.error('Erreur de suppression', { description: error.message });
    }
  };

  const handleValidate = async (id: string) => {
    if (!canValidate) return;
    if (!confirm('Voulez-vous valider cette production ? Elle apparaîtra ensuite dans les rapports.')) return;
    const { error } = await supabase.from('productions').update({ status: 'VALIDATED' }).eq('id', id);
    if (!error) {
      toast.success('Production validée !');
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      fetchHistory();
    } else {
      toast.error('Erreur de validation', { description: error.message });
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleSelectAll = () => {
    const unvalidated = history.filter(r => r.status !== 'VALIDATED' && r.id);
    if (selectedIds.size === unvalidated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unvalidated.map(r => r.id)));
    }
  };

  const handleValidateSelected = async () => {
    if (!canValidate || selectedIds.size === 0) return;
    if (!confirm(`Voulez-vous valider les ${selectedIds.size} production(s) sélectionnée(s) ? Elles apparaîtront dans les rapports.`)) return;
    setValidatingAll(true);
    let ok = 0; let fail = 0;
    for (const id of Array.from(selectedIds)) {
      const { error } = await supabase.from('productions').update({ status: 'VALIDATED' }).eq('id', id);
      if (error) fail++; else ok++;
    }
    setValidatingAll(false);
    setSelectedIds(new Set());
    if (ok > 0) toast.success(`${ok} production(s) validée(s) !`);
    if (fail > 0) toast.error(`${fail} production(s) en erreur.`);
    fetchHistory();
  };

  const handlePrintDone = async (tripNumber: string) => {
    try {
      if (navigator.onLine && tripNumber) {
        await supabase
          .from('productions')
          .update({ departure_time: new Date().toISOString() })
          .eq('trip_number', tripNumber)
          .is('departure_time', null);
      }
    } catch (err) {
      console.error('Erreur mise à jour heure de départ', err);
    }
  };

  const handleValidateArrival = async (id: string) => {
    try {
      if (!navigator.onLine) {
         toast.error("Impossible de valider l'arrivée hors ligne.");
         return;
      }
      const { error } = await supabase
        .from('productions')
        .update({ arrival_time: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Arrivée validée avec succès !');
      fetchHistory();
    } catch (err: any) {
      toast.error("Erreur", { description: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Ticket thermique */}
      {ticketData && (
        <TicketPrint
          data={ticketData}
          onClose={() => setTicketData(null)}
          onPrint={() => {
            if (ticketData.tripNumber) handlePrintDone(ticketData.tripNumber);
          }}
        />
      )}

      {/*  En-tête  */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Saisie de Production
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.name} · {user?.role === 'CAISSIERE' ? 'AGENT PRODUCTION' : user?.role === 'AGENT_RECETTE' ? 'CAISSIÈRE' : user?.role?.replace('_', ' ')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) fetchHistory();
          }}
        >
          <History className="h-4 w-4 mr-2" />
          {showHistory ? 'Fermer' : 'Historique'}
        </Button>
      </div>

      {/*  Formulaire  */}
      <Card className="shadow-md border-0 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Nouvelle Production
          </CardTitle>
          <CardDescription>
            Le tarif est calculé <strong>automatiquement</strong> selon le type de production  la caissière ne peut pas modifier le prix.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/*  Ligne / Agence  */}
            <div className="space-y-2">
              <Label htmlFor="ligne" className="flex items-center gap-1.5 font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                Ligne / Agence *
              </Label>

              {agenciesLoading && (
                <Skeleton className="h-10 w-full rounded-md" />
              )}

              {!agenciesLoading && agenciesError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{agenciesError}</p>
                    <button
                      type="button"
                      onClick={fetchAgencies}
                      className="mt-1.5 text-xs underline opacity-80 hover:opacity-100 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Réessayer
                    </button>
                  </div>
                </div>
              )}

              {!agenciesLoading && (
                isAdmin ? (
                  <select
                    id="ligne"
                    {...register('ligne')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">-- Sélectionner une agence --</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-bold text-foreground">
                    {agencies.find(a => a.id === userAgenceId)?.name || 'Agence non assignée'}
                    <input type="hidden" {...register('ligne')} />
                  </div>
                )
              )}
              {errors.ligne && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.ligne.message}
                </p>
              )}
            </div>

            {/*  Immatriculation + Chauffeur  */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="immatriculation" className="flex items-center gap-1.5 font-semibold">
                  <Bus className="h-4 w-4 text-primary" />
                  Immatriculation *
                </Label>
                <Input
                  id="immatriculation"
                  placeholder="ex: LT-1234-A"
                  className="uppercase font-mono"
                  list="vehicles-list"
                  {...register('immatriculation')}
                />
                <datalist id="vehicles-list">
                  {vehicles.map(v => (
                    <option key={v.id} value={v.immatriculation} />
                  ))}
                </datalist>
                {errors.immatriculation && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.immatriculation.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverName" className="flex items-center gap-1.5 font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  Nom du Chauffeur *
                </Label>
                <Input id="driverName" placeholder="Nom complet du chauffeur" {...register('driverName')} />
                {errors.driverName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.driverName.message}
                  </p>
                )}
              </div>
            </div>

            {/*  Capacité + Passagers  */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalSeats" className="font-semibold">
                  Capacité totale (sièges)
                </Label>
                <Input id="totalSeats" type="number" min="1" {...register('totalSeats')} />
                {errors.totalSeats && (
                  <p className="text-xs text-destructive">{errors.totalSeats.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengersAtDeparture" className="font-semibold">
                  Passagers au départ *
                </Label>
                <Input
                  id="passengersAtDeparture"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('passengersAtDeparture')}
                />
                {errors.passengersAtDeparture && (
                  <p className="text-xs text-destructive">{errors.passengersAtDeparture.message}</p>
                )}
              </div>
            </div>

            {/*  Type de production (choix principal)  */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 font-semibold">
                <Star className="h-4 w-4 text-primary" />
                Type de Production *
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Le prix est fixé automatiquement selon le type choisi. Non modifiable.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Classique */}
                <label
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    productionType === 'CLASSIQUE'
                      ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <input type="radio" value="CLASSIQUE" {...register('productionType')} className="sr-only" />
                  <span className="text-3xl">xaR</span>
                  <div className="text-center">
                    <div className="font-bold text-sm tracking-wide">CLASSIQUE</div>
                    <div className="text-primary font-extrabold text-xl mt-0.5">{getPrice(ligne || '', 'CLASSIQUE')} FCFA</div>
                    <div className="text-xs text-muted-foreground">par passager</div>
                  </div>
                  {productionType === 'CLASSIQUE' && (
                    <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary fill-primary/10" />
                  )}
                </label>

                {/* VIP */}
                <label
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    productionType === 'VIP'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-md scale-[1.02]'
                      : 'border-border hover:border-amber-400 hover:bg-muted/50'
                  }`}
                >
                  <input type="radio" value="VIP" {...register('productionType')} className="sr-only" />
                  <span className="text-3xl">⭐</span>
                  <div className="text-center">
                    <div className="font-bold text-sm tracking-wide">VIP</div>
                    <div className="text-amber-500 font-extrabold text-xl mt-0.5">{getPrice(ligne || '', 'VIP')} FCFA</div>
                    <div className="text-xs text-muted-foreground">par passager</div>
                  </div>
                  {productionType === 'VIP' && (
                    <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-amber-500 fill-amber-100" />
                  )}
                </label>
              </div>

              {errors.productionType && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.productionType.message}
                </p>
              )}
            </div>

            {/*  Récapitulatif recette automatique  */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 space-y-3">
              <div className="text-sm font-semibold text-primary flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calcul automatique des recettes
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Type de production</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                    productionType === 'VIP'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {productionType}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Prix par passager</span>
                  <span className="font-semibold">{pricePerTicket.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Nombre de passagers</span>
                  <span className="font-semibold">{Number(passengersAtDeparture)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-primary/20 pt-3">
                <span className="font-bold">Recette brute</span>
                <span className="text-primary text-xl font-black">
                  {revenue.toLocaleString()} FCFA
                </span>
              </div>

              <p className="text-xs text-muted-foreground italic">
                a️ Prix fixé automatiquement  Non modifiable par la caissière
              </p>
            </div>

            {/*  Dépenses du trajet  */}
            <div className="space-y-3">
              <Label className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Dépenses du trajet (FCFA)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'fuel' as const, label: 'Carburant' },
                ].map(({ name, label }) => (
                  <div key={name} className="space-y-1.5">
                    <Label htmlFor={name} className="text-xs font-medium">{label}</Label>
                    <Input id={name} type="number" min="0" placeholder="0" {...register(name)} />
                  </div>
                ))}
              </div>
            </div>

            {/*  Récapitulatif net  */}
            <div className={`rounded-xl p-4 border-2 transition-colors ${
              netToDeposit >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Dépenses totales</div>
                  <div className="text-sm font-semibold text-destructive">
                    - {totalExpenses.toLocaleString()} FCFA
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Net à verser</div>
                  <div className={`text-2xl font-black ${
                    netToDeposit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive'
                  }`}>
                    {netToDeposit.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            </div>

            {/*  Bouton d'enregistrement  */}
            <Button
              type="submit"
              disabled={isSubmitting || agenciesLoading}
              className="w-full h-12 text-base font-bold shadow-md"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Enregistrement en cours...</>
              ) : saved ? (
                <><CheckCircle className="mr-2 h-5 w-5" />Production enregistrée !</>
              ) : (
                <><Save className="mr-2 h-5 w-5" />Enregistrer la Production</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/*  Historique  */}
      {showHistory && (
        <Card className="shadow-md border-0">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des Productions
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">{history.length} entrée(s)</span>
                {canValidate && history.some(r => r.status !== 'VALIDATED') && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedIds.size === history.filter(r => r.status !== 'VALIDATED').length && selectedIds.size > 0 ? 'Tout décocher' : 'Tout cocher'}
                    </Button>
                    {selectedIds.size > 0 && (
                      <Button
                        size="sm"
                        onClick={handleValidateSelected}
                        disabled={validatingAll}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {validatingAll ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                        Valider {selectedIds.size} sélection(s)
                      </Button>
                    )}
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={loadingHistory}>
                  <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune production enregistrée</p>
                <p className="text-sm mt-1 opacity-70">Les productions apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {history.map((rec) => (
                  <div
                    key={rec.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors gap-3 ${
                      selectedIds.has(rec.id)
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    {/* Checkbox for selection */}
                    {canValidate && rec.status !== 'VALIDATED' && (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 cursor-pointer flex-shrink-0"
                        checked={selectedIds.has(rec.id)}
                        onChange={() => handleToggleSelect(rec.id)}
                      />
                    )}
                    {canValidate && rec.status === 'VALIDATED' && (
                      <div className="h-4 w-4 flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm font-mono">{rec.immatriculation}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          rec.production_type === 'VIP'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {rec.production_type || 'CLASSIQUE'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rec.status === 'VALIDATED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {rec.status === 'VALIDATED' ? '✔ Validé' : '⏳ Brouillon'}
                        </span>
                        {rec.synced === false && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                            ⚡ En attente sync
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {rec.driver_name} · {rec.ligne || 'N/A'} ·{' '}
                        {rec.passengers_at_departure} pass. ·{' '}
                        {new Date(rec.created_at).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {(rec.net_to_deposit || 0).toLocaleString()} FCFA
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">net versé</div>
                      {(isAdmin || isChef) && (
                        <div className="text-[10px] text-left border-t border-slate-200 pt-1 mt-1">
                          <div className="text-slate-500">Départ: <span className="font-bold text-slate-700">{rec.departure_time ? new Date(rec.departure_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '-'}</span></div>
                          <div className="text-slate-500">Arrivée: <span className="font-bold text-slate-700">{rec.arrival_time ? new Date(rec.arrival_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '-'}</span></div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 items-end">
                      {user?.role === 'AGENT_RECETTE' && !rec.arrival_time && (
                         <Button size="sm" variant="outline" className="h-7 text-[10px] border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => handleValidateArrival(rec.id)}>
                            Valider Arrivée
                         </Button>
                      )}
                      {canValidate && (
                        <div className="flex gap-1 justify-end mt-1">
                        {rec.status !== 'VALIDATED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100 flex-shrink-0"
                            onClick={() => handleValidate(rec.id)}
                            title="Valider"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => handleDelete(rec.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


