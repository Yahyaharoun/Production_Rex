import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { FileText, Loader2, Save, Trash2, Bus, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../lib/dexie';
import { queueSync, logActivity } from '../../services/syncService';
import { useRBAC } from '../../hooks/useRBAC';

const normalize = (s: string) => (s || '').replace(/[\s\-_]/g, '').toUpperCase();

const fuelSchema = z.object({
  vehicleImmat: z.string().min(1, "L'immatriculation est requise"),
  amount: z.coerce.number().min(1, 'Montant requis'),
  category: z.enum(['VIP', 'CLASSIQUE'], { message: 'Sélectionnez la catégorie' }),
  lineName: z.string().min(1, 'Ligne requise'),
  notes: z.string().optional(),
});

type FuelFormValues = z.infer<typeof fuelSchema>;

export default function FuelExpensePage() {
  const { user } = useAuthStore();
  const { canManageFuel, canDelete } = useRBAC();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FuelFormValues>({
    resolver: zodResolver(fuelSchema),
    defaultValues: { amount: 0, category: 'CLASSIQUE', vehicleImmat: '', lineName: '', notes: '' }
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        let query = supabase
          .from('fuel_expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        let prodQuery = supabase
          .from('productions')
          .select('id, date, immatriculation, ligne, agence_id, production_type, expense_fuel, caissiere_name, created_at, created_by')
          .gt('expense_fuel', 0)
          .order('created_at', { ascending: false })
          .limit(100);

        if (user?.role !== 'PDG' && user?.lineIds && user.lineIds.length > 0) {
          query = query.in('agence_id', user.lineIds);
          prodQuery = prodQuery.in('agence_id', user.lineIds);
        }

        const [fuelRes, prodRes] = await Promise.all([query, prodQuery]);
        if (fuelRes.error) throw fuelRes.error;
        if (prodRes.error) throw prodRes.error;

        const mappedProds = (prodRes.data || []).map((p: any) => ({
          id: 'prod_' + p.id,
          date: p.date,
          vehicle_immat: p.immatriculation,
          line_name: p.ligne,
          agence_id: p.agence_id,
          category: p.production_type || 'CLASSIQUE',
          amount: p.expense_fuel,
          notes: 'Lié à une production',
          caissiere_name: p.caissiere_name,
          created_by: p.created_by,
          created_at: p.created_at,
          isFromProduction: true,
          originalId: p.id
        }));

        const merged = [...(fuelRes.data || []), ...mappedProds].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        setExpenses(merged);

        // Update local cache ONLY for fuel_expenses
        if (fuelRes.data && fuelRes.data.length > 0) {
          for (const exp of fuelRes.data) {
            await db.fuelExpenses.put({
              clientId: exp.id,
              id: exp.id,
              date: exp.date,
              vehicleImmat: exp.vehicle_immat,
              vehicle_immat: exp.vehicle_immat,
              lineName: exp.line_name,
              agenceId: exp.agence_id,
              category: exp.category,
              amount: exp.amount,
              notes: exp.notes,
              caissiere_name: exp.caissiere_name,
              created_by: exp.created_by,
              syncStatus: 'SYNCED',
              createdAt: new Date(exp.created_at).getTime(),
            });
          }
        }
      } else {
        const localFuel = await db.fuelExpenses.toArray();
        const localProd = await db.productions.filter(p => (p.expense_fuel || 0) > 0).toArray();
        const mappedLocalProds = localProd.map(p => ({
          id: 'prod_' + (p.id || p.clientId),
          clientId: p.clientId,
          date: p.date,
          vehicle_immat: p.immatriculation,
          vehicleImmat: p.immatriculation,
          line_name: p.ligne,
          agence_id: p.agence_id,
          category: p.production_type || 'CLASSIQUE',
          amount: p.expense_fuel,
          notes: 'Lié à une production',
          caissiere_name: p.caissiere_name,
          created_by: p.created_by,
          created_at: p.created_at || new Date().toISOString(),
          createdAt: new Date(p.created_at || Date.now()).getTime(),
          isFromProduction: true,
          originalId: p.id || p.clientId
        }));
        
        const mergedLocal = [...localFuel, ...mappedLocalProds].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setExpenses(mergedLocal);
      }
    } catch (err: any) {
      toast.error('Erreur chargement carburant: ' + err.message);
      // Fallback to local data
      try {
        const localFuel = await db.fuelExpenses.toArray();
        const localProd = await db.productions.filter(p => (p.expense_fuel || 0) > 0).toArray();
        const mappedLocalProds = localProd.map(p => ({
          id: 'prod_' + (p.id || p.clientId),
          clientId: p.clientId,
          date: p.date,
          vehicle_immat: p.immatriculation,
          line_name: p.ligne,
          amount: p.expense_fuel,
          createdAt: new Date(p.created_at || Date.now()).getTime(),
          isFromProduction: true
        }));
        const mergedLocal = [...localFuel, ...mappedLocalProds].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setExpenses(mergedLocal);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('vehicles').select('id, immatriculation');
        if (data && data.length > 0) {
          setVehicles(data);
          await db.vehicles.clear();
          await db.vehicles.bulkPut(data.map(v => ({ ...v, clientId: v.id })));
        }
      } else {
        const local = await db.vehicles.toArray();
        setVehicles(local);
      }
    } catch (err) {
      console.warn('[FuelPage] fetchVehicles error:', err);
    }
  };

  useEffect(() => {
    loadExpenses();
    fetchVehicles();
  }, [user]);

  // Cherche un véhicule par immatriculation (ignore espaces et tirets)
  const findVehicle = async (immat: string): Promise<any | null> => {
    const normalize = (s: string) => (s || '').replace(/[\s\-_]/g, '').toUpperCase();
    const searchImmat = normalize(immat);

    // 1. Chercher dans le state React (le plus rapide)
    let found = vehicles.find(v => normalize(v.immatriculation) === searchImmat);
    if (found) return found;

    // 2. Chercher directement dans Supabase
    if (navigator.onLine) {
      try {
        const { data } = await supabase.from('vehicles').select('*');
        if (data && data.length > 0) {
          setVehicles(data);
          found = data.find((v: any) => normalize(v.immatriculation) === searchImmat);
          if (found) return found;
        }
      } catch (err) {
        console.warn('[FuelPage] Supabase vehicles fetch error:', err);
      }
    }

    // 3. Chercher dans le cache local Dexie
    const local = await db.vehicles.toArray();
    return local.find(v => normalize(v.immatriculation) === searchImmat) || null;
  };

  const onSubmit = async (data: FuelFormValues) => {
    if (!canManageFuel) return toast.error('Non autorisé');

    setSaving(true);
    try {
      // 1. Valider que le véhicule existe
      const vehicle = await findVehicle(data.vehicleImmat);

      if (!vehicle) {
        toast.error('Immatriculation invalide', {
          description: `"${data.vehicleImmat}" n'est pas reconnue dans la base de données. Vérifiez l'orthographe.`,
        });
        setSaving(false);
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const payload = {
        vehicle_immat: vehicle.immatriculation,
        amount: data.amount,
        category: data.category,
        line_name: data.lineName,
        notes: data.notes || null,
        agence_id: user?.agenceId || null,
        caissiere_name: user?.name || null,
        created_by: user?.id || null,
        date: todayStr,
      };

      if (navigator.onLine) {
        // 2a. Insertion directe dans Supabase
        const { data: inserted, error } = await supabase.from('fuel_expenses').insert(payload).select().single();
        if (error) throw error;

        // Mise à jour du cache local avec le vrai ID Supabase
        await db.fuelExpenses.put({
          clientId: inserted.id,
          id: inserted.id,
          date: todayStr,
          vehicleImmat: vehicle.immatriculation,
          vehicle_immat: vehicle.immatriculation,
          lineName: data.lineName,
          agenceId: user?.agenceId || '',
          category: data.category,
          amount: data.amount,
          notes: data.notes,
          caissiere_name: user?.name,
          created_by: user?.id,
          syncStatus: 'SYNCED',
          createdAt: Date.now(),
        });

        await logActivity('INSERT', 'fuel_expenses', `Carburant enregistré pour ${vehicle.immatriculation}: ${data.amount} FCFA`, payload, user?.id, user?.email);
      } else {
        // 2b. Mise en file d'attente pour synchronisation ultérieure
        const clientId = await queueSync('fuel_expenses', 'INSERT', payload);

        await db.fuelExpenses.put({
          clientId,
          date: todayStr,
          vehicleImmat: vehicle.immatriculation,
          vehicle_immat: vehicle.immatriculation,
          lineName: data.lineName,
          agenceId: user?.agenceId || '',
          category: data.category,
          amount: data.amount,
          notes: data.notes,
          caissiere_name: user?.name,
          created_by: user?.id,
          syncStatus: 'PENDING',
          createdAt: Date.now(),
        });
      }

      toast.success('Dépense carburant enregistrée', { description: `${vehicle.immatriculation} — ${data.amount.toLocaleString('fr-FR')} FCFA` });
      reset();
      loadExpenses();
    } catch (err: any) {
      toast.error('Erreur enregistrement carburant', { description: err.message });
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (id: string, clientId: string, isFromProduction?: boolean) => {
    if (!canDelete) return toast.error('Non autorisé');
    if (isFromProduction) {
      return toast.error('Action impossible', { description: 'Ce carburant est lié à une production. La suppression est impossible ici.' });
    }
    if (!confirm('Supprimer cette dépense carburant ?')) return;

    try {
      if (navigator.onLine && id && !id.startsWith('prod_')) {
        const { error } = await supabase.from('fuel_expenses').delete().eq('id', id);
        if (error) throw error;
      } else if (!id.startsWith('prod_')) {
        await queueSync('fuel_expenses', 'DELETE', { id: id || clientId });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingAll, setDeletingAll] = useState(false);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleSelectAll = () => {
    const visibleRecords = expenses.filter(r => r.id || r.clientId);
    if (selectedIds.size === visibleRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleRecords.map(r => (r.id || r.clientId)!)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!canDelete) return;
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Voulez-vous vraiment SUPPRIMER les ${selectedIds.size} dépense(s) sélectionnée(s) ? Cette action est définitive.`)) return;
    
    setDeletingAll(true);
    for (const id of Array.from(selectedIds)) {
      const exp = expenses.find(e => (e.id || e.clientId) === id);
      if (exp) {
        await handleDelete(exp.id, exp.clientId || exp.client_id, exp.isFromProduction);
      }
    }
    setDeletingAll(false);
    setSelectedIds(new Set());
  };

  const handleDelete = async (id: string, clientId: string, isFromProduction: boolean) => {
    if (!canDelete) {
      toast.error('Vous n\'avez pas les droits pour supprimer.');
      return;
    }
    
    // Si ce n'est pas depuis handleDeleteSelected, on demande confirmation
    if (arguments.length === 3 && deletingAll === false) {
      if (!window.confirm('Voulez-vous vraiment supprimer cette dépense de carburant ?')) return;
    }

    try {
      if (isFromProduction) {
        const prodId = id.replace('prod_', '');
        await supabase.from('productions').update({ expense_fuel: 0 }).eq('id', prodId);
        await db.productions.where('id').equals(prodId).modify({ expense_fuel: 0 });
      } else {
        if (navigator.onLine && id) {
          await supabase.from('fuel_expenses').delete().eq('id', id);
        }
        await db.fuelExpenses.delete(clientId);
      }
      if (!deletingAll) {
         toast.success('Dépense supprimée');
         loadExpenses();
      }
    } catch (err: any) {
      if (!deletingAll) toast.error('Erreur', { description: err.message });
      console.error(err);
    }
  };

  if (!canManageFuel) {
    return <div className="p-4 text-center text-muted-foreground">Accès non autorisé au module Carburant.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Carburant</h2>
          <p className="text-muted-foreground">Gestion des dépenses de carburant</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadExpenses} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulaire */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Nouvelle Dépense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Véhicule</Label>
                <select 
                  {...register('vehicleImmat')}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => {
                    const veh = vehicles.find(v => v.immatriculation === e.target.value);
                    if (veh) {
                      const type = veh.immatriculation.includes('(VIP)') ? 'VIP' : 'CLASSIQUE';
                      reset({ ...register, category: type, lineName: veh.ligne_actuelle || '' });
                    }
                  }}
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map(v => (
                    <option key={v.id || v.clientId} value={v.immatriculation}>
                      {v.immatriculation} - {v.marque}
                    </option>
                  ))}
                </select>
                {errors.vehicleImmat && <p className="text-xs text-red-500">{errors.vehicleImmat.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <select 
                  {...register('category')}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="CLASSIQUE">Classique</option>
                  <option value="VIP">VIP</option>
                </select>
                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Ligne</Label>
                <Input {...register('lineName')} placeholder="Ex: YAOUNDE - DOUALA" />
                {errors.lineName && <p className="text-xs text-red-500">{errors.lineName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input type="number" {...register('amount')} placeholder="0" />
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Notes (Optionnel)</Label>
                <Input {...register('notes')} placeholder="Détails supplémentaires..." />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Historique */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Historique récent ({expenses.length} entrée{expenses.length !== 1 ? 's' : ''})
            </CardTitle>
            {canDelete && selectedIds.size > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs font-bold text-destructive hover:bg-destructive hover:text-white border-destructive"
                onClick={handleDeleteSelected}
                disabled={deletingAll}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer ({selectedIds.size})
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : expenses.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Aucune dépense enregistrée.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary"
                          checked={selectedIds.size > 0 && selectedIds.size === expenses.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Véhicule</th>
                      <th className="px-4 py-3">Ligne</th>
                      <th className="px-4 py-3">Catégorie</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3">Auteur</th>
                      {canDelete && <th className="px-4 py-3 rounded-tr-lg"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp: any, i) => (
                      <tr key={exp.id || exp.clientId || i} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary"
                            checked={selectedIds.has(exp.id || exp.clientId)}
                            onChange={() => handleToggleSelect(exp.id || exp.clientId)}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {exp.date ? new Date(exp.date + 'T00:00:00').toLocaleDateString('fr-FR') : '—'}
                          {(exp.syncStatus === 'PENDING') && <AlertCircle className="inline h-3 w-3 text-yellow-500 ml-1" title="En attente de sync" />}
                        </td>
                        <td className="px-4 py-3 font-medium font-mono">{exp.vehicle_immat || exp.vehicleImmat || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {exp.line_name || exp.lineName || '—'}
                          {exp.isFromProduction && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">Production</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${exp.category === 'VIP' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{Number(exp.amount).toLocaleString('fr-FR')} FCFA</td>
                        <td className="px-4 py-3 text-muted-foreground">{exp.caissiere_name || '—'}</td>
                        {canDelete && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(exp.id, exp.client_id || exp.clientId, exp.isFromProduction)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
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
  );
}
