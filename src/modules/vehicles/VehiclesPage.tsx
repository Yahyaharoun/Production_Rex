import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { CarFront, Plus, Search, Filter, Edit, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/skeleton';

type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'GARAGE';

interface Vehicle {
  id: string;
  immatriculation: string;
  brand: string;
  model: string;
  total_seats: number;
  status: VehicleStatus;
  notes?: string;
}

const emptyForm = { immatriculation: '', brand: '', model: '', total_seats: 30, status: 'ACTIVE' as VehicleStatus, notes: '' };

const statusLabel: Record<VehicleStatus, string> = { ACTIVE: 'Actif', MAINTENANCE: 'En maintenance', GARAGE: 'Au garage' };
const statusColor: Record<VehicleStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  GARAGE: 'bg-red-100 text-red-700',
};

function VehicleForm({ initial, onSave, onCancel, mode, saving }: {
  initial: typeof emptyForm; onSave: (d: typeof emptyForm) => void;
  onCancel: () => void; mode: 'add' | 'edit'; saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setFormErrors] = useState<Record<string, string>>({});

  // IMPORTANT: Update internal state when initial prop changes (fixes Edit bug)
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.immatriculation.trim()) e.immatriculation = 'Immatriculation requise';
    if (!form.brand.trim()) e.brand = 'Marque requise';
    if (!form.model.trim()) e.model = 'Modèle requis';
    if (form.total_seats < 1) e.total_seats = 'Capacité invalide';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <Card className="bg-white border-primary/20 shadow-2xl rounded-[2rem] mb-10 overflow-hidden animate-in slide-in-from-top-6 duration-500">
      <CardHeader className="bg-secondary/10 flex flex-row items-center justify-between p-8 border-b border-border/50">
        <CardTitle className="text-2xl font-black flex items-center gap-3 text-foreground">
          <CarFront className="h-8 w-8 text-primary" />
          {mode === 'add' ? 'Nouveau Véhicule' : `Modifier ${form.immatriculation}`}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-white rounded-2xl h-10 w-10 p-0 shadow-sm border border-border">
          <X className="h-6 w-6 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Immatriculation *</Label>
            <Input placeholder="Ex: CE 123 4L" value={form.immatriculation}
              onChange={(e) => setForm({ ...form, immatriculation: e.target.value.toUpperCase() })}
              className="bg-secondary/20 border-border rounded-xl h-12 font-black text-lg focus:ring-primary shadow-sm" />
            {errors.immatriculation && <p className="text-[10px] text-destructive font-black uppercase">{errors.immatriculation}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Marque *</Label>
            <Input placeholder="Toyota" value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="bg-secondary/20 border-border rounded-xl h-12 font-bold focus:ring-primary shadow-sm" />
            {errors.brand && <p className="text-[10px] text-destructive font-black uppercase">{errors.brand}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Modèle *</Label>
            <Input placeholder="Coaster" value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="bg-secondary/20 border-border rounded-xl h-12 font-bold focus:ring-primary shadow-sm" />
            {errors.model && <p className="text-[10px] text-destructive font-black uppercase">{errors.model}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Capacité (places)</Label>
            <Input type="number" min={1} value={form.total_seats}
              onChange={(e) => setForm({ ...form, total_seats: parseInt(e.target.value) || 0 })}
              className="bg-secondary/20 border-border rounded-xl h-12 font-black focus:ring-primary shadow-sm" />
            {errors.total_seats && <p className="text-[10px] text-destructive font-black uppercase">{errors.total_seats}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Statut Opérationnel</Label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
              className="w-full rounded-xl bg-secondary/20 border border-border h-12 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm">
              <option value="ACTIVE">Actif / Opérationnel</option>
              <option value="MAINTENANCE">En maintenance</option>
              <option value="GARAGE">Au garage (Panne)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Observations</Label>
            <Input placeholder="Ex: Révision prévue..." value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="bg-secondary/20 border-border rounded-xl h-12 font-medium focus:ring-primary shadow-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-4 pt-10 mt-10 border-t border-border/50">
          <Button variant="outline" onClick={onCancel} className="h-12 px-8 rounded-xl font-bold border-border shadow-sm">Annuler</Button>
          <Button onClick={() => { if (validate()) onSave(form); }} className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black h-12 px-12 shadow-xl shadow-primary/20 transition-all hover:scale-105" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
            {mode === 'add' ? 'Enregistrer le véhicule' : 'Mettre à jour les données'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | 'ALL'>('ALL');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setVehicles(data || []);
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleAdd = async (form: typeof emptyForm) => {
    setSaving(true);
    const { error } = await supabase.from('vehicles').insert({
      immatriculation: form.immatriculation, brand: form.brand, model: form.model,
      total_seats: form.total_seats, status: form.status, notes: form.notes,
    });
    setSaving(false);
    if (error) {
      toast.error('Erreur', { description: error.message.includes('unique') ? 'Cette immatriculation existe déjà.' : error.message });
    } else {
      toast.success('Véhicule ajouté');
      setShowForm(false);
      fetchVehicles();
    }
  };

  const handleEdit = async (form: typeof emptyForm) => {
    if (!editingVehicle) return;
    setSaving(true);
    const { error } = await supabase.from('vehicles').update({
      immatriculation: form.immatriculation, brand: form.brand, model: form.model,
      total_seats: form.total_seats, status: form.status, notes: form.notes,
    }).eq('id', editingVehicle.id);
    setSaving(false);
    if (error) { toast.error('Erreur', { description: error.message }); }
    else {
      toast.success('Mise à jour réussie');
      setEditingVehicle(null);
      fetchVehicles();
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchSearch = v.immatriculation.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: vehicles.length,
    ACTIVE: vehicles.filter((v) => v.status === 'ACTIVE').length,
    MAINTENANCE: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
    GARAGE: vehicles.filter((v) => v.status === 'GARAGE').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">Parc Automobile</h2>
          <p className="text-muted-foreground mt-1 font-bold">Gérez vos bus, la maintenance et les immobilisations.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black transition-all hover:scale-105"
          onClick={() => { setShowForm(!showForm); setEditingVehicle(null); }}>
          {showForm ? <X className="mr-2 h-6 w-6" /> : <Plus className="mr-2 h-6 w-6" />}
          {showForm ? 'Annuler' : 'Nouveau véhicule'}
        </Button>
      </div>

      {showForm && !editingVehicle && (
        <VehicleForm mode="add" initial={emptyForm} onSave={handleAdd} onCancel={() => setShowForm(false)} saving={saving} />
      )}
      {editingVehicle && (
        <VehicleForm mode="edit"
          initial={{ immatriculation: editingVehicle.immatriculation, brand: editingVehicle.brand, model: editingVehicle.model, total_seats: editingVehicle.total_seats, status: editingVehicle.status, notes: editingVehicle.notes || '' }}
          onSave={handleEdit} onCancel={() => setEditingVehicle(null)} saving={saving} />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {([
          { key: 'ALL', label: 'Total Flotte', icon: CarFront, color: 'text-foreground', bg: 'bg-secondary' },
          { key: 'ACTIVE', label: 'En service', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
          { key: 'MAINTENANCE', label: 'Maintenance', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { key: 'GARAGE', label: 'Au garage', icon: X, color: 'text-red-600', bg: 'bg-red-100' },
        ] as const).map(({ key, label, icon: Icon, color, bg }) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            className={cn(
              "bg-white border-2 rounded-[2rem] p-6 text-left transition-all shadow-sm hover:shadow-xl",
              filterStatus === key ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
            )}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
              <div className={cn("p-3 rounded-2xl", bg)}><Icon className={cn("h-6 w-6", color)} /></div>
            </div>
            <p className={cn("text-4xl font-black", filterStatus === key ? "text-primary" : "text-foreground")}>{counts[key]}</p>
          </button>
        ))}
      </div>

      <Card className="bg-white border-border shadow-sm rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-border/50 bg-secondary/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <CardTitle className="text-xl font-black flex items-center gap-2">Liste des Véhicules</CardTitle>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Rechercher (Immat, Marque...)"
                className="pl-12 bg-white border-border rounded-2xl h-12 shadow-sm font-bold"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="p-12 space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-secondary/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-8 py-5">Immatriculation</th>
                    <th className="px-8 py-5">Marque & Modèle</th>
                    <th className="px-8 py-5 text-center">Capacité</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-20 text-center text-muted-foreground">
                      <CarFront className="mx-auto h-16 w-16 mb-4 opacity-10 text-foreground" />
                      <p className="font-black text-lg">Aucun véhicule trouvé.</p>
                    </td></tr>
                  ) : filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="px-8 py-6 font-black text-foreground text-lg">{v.immatriculation}</td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-foreground">{v.brand}</p>
                        <p className="text-xs text-muted-foreground font-medium">{v.model}</p>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-foreground">
                        <span className="bg-secondary/50 px-3 py-1 rounded-lg">{v.total_seats} <span className="text-[10px] font-bold">PL</span></span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn("inline-flex items-center rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest", statusColor[v.status])}>
                          {statusLabel[v.status]}
                        </span>
                        {v.notes && <p className="text-[10px] text-muted-foreground mt-1 font-medium italic max-w-[150px] truncate">{v.notes}</p>}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Button variant="ghost" 
                          className="bg-secondary/50 text-foreground hover:bg-primary hover:text-white rounded-xl font-black h-10 px-6 shadow-sm border border-border/50"
                          onClick={() => { setEditingVehicle(v); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                          <Edit className="h-4 w-4 mr-2" />Modifier
                        </Button>
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
  );
}
