import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { FileText, Loader2, Save, Trash2, CarFront, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../lib/dexie';
import { queueSync, logActivity } from '../../services/syncService';
import { useRBAC } from '../../hooks/useRBAC';
import { useConfirm } from '../../providers/ConfirmProvider';

const normalize = (s: string) => (s || '').replace(/[\s\-_]/g, '').toUpperCase();

const washSchema = z.object({
  vehicleImmat: z.string().min(1, "L'immatriculation est requise"),
  amount: z.coerce.number().min(0, 'Montant requis'),
});

type WashFormValues = z.infer<typeof washSchema>;

export default function WashingControlPage() {
  const { user } = useAuthStore();
  const { canManageFuel, canDelete } = useRBAC();
  const [washes, setWashes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const confirm = useConfirm();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<WashFormValues>({
    resolver: zodResolver(washSchema),
    defaultValues: { vehicleImmat: '', amount: 1000 }
  });

  const loadWashes = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        let query = supabase
          .from('washes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (user?.role !== 'PDG' && user?.lineIds && user.lineIds.length > 0) {
          query = query.in('agence_id', user.lineIds);
        }

        const { data, error } = await query;
        if (error) throw error;
        setWashes(data || []);

        // Update local cache
        if (data && data.length > 0) {
          for (const w of data) {
            await db.washes.put({
              clientId: w.id,
              id: w.id,
              date: w.date,
              vehicleImmat: w.vehicle_immat,
              vehicle_immat: w.vehicle_immat,
              agenceId: w.agence_id,
              agence_id: w.agence_id,
              amount: w.amount,
              caissiere_name: w.caissiere_name,
              created_by: w.created_by,
              syncStatus: 'SYNCED',
              createdAt: new Date(w.created_at).getTime(),
            });
          }
        }
      } else {
        const localData = await db.washes.toArray();
        setWashes(localData.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (err: any) {
      toast.error('Erreur chargement lavages: ' + err.message);
      try {
        const localData = await db.washes.toArray();
        setWashes(localData.sort((a, b) => b.createdAt - a.createdAt));
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
      console.warn('[WashPage] fetchVehicles error:', err);
    }
  };

  useEffect(() => {
    loadWashes();
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
        console.warn('[WashPage] Supabase vehicles fetch error:', err);
      }
    }

    // 3. Chercher dans le cache local Dexie
    const local = await db.vehicles.toArray();
    return local.find(v => normalize(v.immatriculation) === searchImmat) || null;
  };

  const onSubmit = async (data: WashFormValues) => {
    if (!canManageFuel) return toast.error('Non autorisé');

    setSaving(true);
    const todayStr = new Date().toISOString().split('T')[0];

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

      // 2. Vérifier doublon lavage aujourd'hui (côté client via state)
      const norm = (s: string) => (s || '').replace(/[\s\-_]/g, '').toUpperCase();
      const hasDuplicateLocal = washes.some(w => {
        const washDate = (w.date || '').split('T')[0];
        return washDate === todayStr && (
          norm(w.vehicle_immat || '') === norm(vehicle.immatriculation) ||
          norm(w.vehicleImmat || '') === norm(vehicle.immatriculation)
        );
      });

      if (hasDuplicateLocal) {
        toast.error(`Lavage déjà enregistré`, {
          description: `Le véhicule ${vehicle.immatriculation} a déjà été lavé aujourd'hui.`,
        });
        setSaving(false);
        return;
      }

      // 3. Vérifier doublon côté Supabase (sécurité supplémentaire)
      if (navigator.onLine) {
        const { data: remoteDup } = await supabase
          .from('washes')
          .select('id')
          .eq('vehicle_immat', vehicle.immatriculation)
          .eq('date', todayStr)
          .maybeSingle();

        if (remoteDup) {
          toast.error(`Lavage déjà enregistré`, {
            description: `Le véhicule ${vehicle.immatriculation} a déjà été lavé aujourd'hui.`,
          });
          setSaving(false);
          return;
        }
      }

      const payload = {
        vehicle_immat: vehicle.immatriculation,
        amount: data.amount,
        agence_id: user?.agenceId || null,
        caissiere_name: user?.name || null,
        created_by: user?.id || null,
        date: todayStr,
      };

      if (navigator.onLine) {
        // 4a. Insertion directe dans Supabase
        const { data: inserted, error } = await supabase.from('washes').insert(payload).select().single();
        if (error) throw error;

        await db.washes.put({
          clientId: inserted.id,
          id: inserted.id,
          date: todayStr,
          vehicleImmat: vehicle.immatriculation,
          vehicle_immat: vehicle.immatriculation,
          agenceId: user?.agenceId || '',
          agence_id: user?.agenceId || undefined,
          amount: data.amount,
          caissiere_name: user?.name,
          created_by: user?.id,
          syncStatus: 'SYNCED',
          createdAt: Date.now(),
        });

        await logActivity('INSERT', 'washes', `Lavage enregistré pour ${vehicle.immatriculation}: ${data.amount} FCFA`, payload, user?.id, user?.email);
      } else {
        // 4b. File d'attente pour synchronisation ultérieure
        const clientId = await queueSync('washes', 'INSERT', payload);

        await db.washes.put({
          clientId,
          date: todayStr,
          vehicleImmat: vehicle.immatriculation,
          vehicle_immat: vehicle.immatriculation,
          agenceId: user?.agenceId || '',
          amount: data.amount,
          caissiere_name: user?.name,
          created_by: user?.id,
          syncStatus: 'PENDING',
          createdAt: Date.now(),
        });
      }

      toast.success('Lavage enregistré', { description: `${vehicle.immatriculation} — ${data.amount.toLocaleString('fr-FR')} FCFA` });
      reset();
      loadWashes();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };



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
    const visibleRecords = washes.filter(r => r.id || r.clientId);
    if (selectedIds.size === visibleRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleRecords.map(r => (r.id || r.clientId)!)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!canDelete) return;
    if (selectedIds.size === 0) return;
    const isConfirmed = await confirm('Voulez-vous vraiment SUPPRIMER les ' + selectedIds.size + ' lavage(s) sélectionné(s) ? Cette action est définitive.');
    if (!isConfirmed) return;
    
    setDeletingAll(true);
    const idsToDelete = Array.from(selectedIds);
    if (navigator.onLine && idsToDelete.length > 0) {
      const { error } = await supabase.from('washes').delete().in('id', idsToDelete);
      if (error) {
        toast.error('Erreur', { description: error.message });
      } else {
        toast.success(`${idsToDelete.length} lavage(s) supprimé(s)`);
      }
    } else {
      // Offline fallback: delete locally only
      for (const id of idsToDelete) {
        const w = washes.find(e => (e.id || e.clientId) === id);
        if (w) await handleDelete(w.id, w.clientId || w.client_id, true);
      }
      toast.success(`${idsToDelete.length} lavage(s) mis en attente de suppression`);
    }

    setDeletingAll(false);
    setSelectedIds(new Set());
    loadWashes();
  };

  const handleDelete = async (id: string, clientId: string, isBulk: boolean = false) => {
    if (!canDelete) {
      if (!isBulk) toast.error('Non autorisé');
      return;
    }
    if (!isBulk) {
      const isConfirmed = await confirm('Supprimer ce lavage ?');
      if (!isConfirmed) return;
    }

    try {
      if (navigator.onLine && id) {
        const { error } = await supabase.from('washes').delete().eq('id', id);
        if (error) throw error;
      } else {
        await queueSync('washes', 'DELETE', { id: id || clientId });
      }

      const idToDelete = id || clientId;
      await db.washes.where('clientId').equals(idToDelete).delete().catch(() => {});

      if (!isBulk) {
        toast.success('Lavage supprimé');
        loadWashes();
      }
    } catch (err: any) {
      if (!isBulk) toast.error('Erreur: ' + err.message);
    }
  };

  if (!canManageFuel) {
    return <div className="p-4 text-center text-muted-foreground">Accès non autorisé au module Lavage.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contrôle Lavage</h1>
          <p className="text-muted-foreground">Enregistrement des lavages (Max 1 par véhicule par jour)</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadWashes} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulaire */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CarFront className="h-5 w-5 text-primary" />
              Nouveau lavage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Immatriculation</Label>
                <Input {...register('vehicleImmat')} placeholder="Ex: CE-123-AB" />
                {errors.vehicleImmat && <p className="text-xs text-red-500">{errors.vehicleImmat.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input type="number" {...register('amount')} />
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
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
              Historique des lavages ({washes.length} entrée{washes.length !== 1 ? 's' : ''})
            </CardTitle>
            {canDelete && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  className="h-8 text-xs font-bold"
                >
                  {selectedIds.size > 0 && selectedIds.size === washes.filter(r => r.id || r.clientId).length ? 'Tout décocher' : 'Tout cocher'}
                </Button>
                {selectedIds.size > 0 && (
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
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : washes.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Aucun lavage enregistré.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary"
                          checked={selectedIds.size > 0 && selectedIds.size === washes.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Véhicule</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3">Auteur</th>
                      {canDelete && <th className="px-4 py-3 rounded-tr-lg"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {washes.map((wash: any, i) => (
                      <tr key={wash.id || wash.clientId || i} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary"
                            checked={selectedIds.has(wash.id || wash.clientId)}
                            onChange={() => handleToggleSelect(wash.id || wash.clientId)}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {wash.date ? new Date(wash.date + 'T00:00:00').toLocaleDateString('fr-FR') : '—'}
                          {wash.syncStatus === 'PENDING' && <AlertCircle className="inline h-3 w-3 text-yellow-500 ml-1" title="En attente de sync" />}
                        </td>
                        <td className="px-4 py-3 font-medium font-mono">{wash.vehicle_immat || wash.vehicleImmat || '—'}</td>
                        <td className="px-4 py-3 font-semibold">{Number(wash.amount).toLocaleString('fr-FR')} FCFA</td>
                        <td className="px-4 py-3 text-muted-foreground">{wash.caissiere_name || user?.name || '—'}</td>
                        {canDelete && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(wash.id, wash.client_id || wash.clientId)}
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
