import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { useAuthStore } from '../../store/useAuthStore';
import { CarFront, Plus, X, CheckCircle, AlertCircle, Loader2, Bus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';

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

const emptyForm = {
  immatriculation: '',
  brand: '',
  model: '',
  total_seats: 30,
  status: 'ACTIVE' as VehicleStatus,
  notes: ''
};

function VehicleForm({ mode, initial, onSave, onCancel, saving }: { 
  mode: 'add' | 'edit'; 
  initial: typeof emptyForm; 
  onSave: (v: typeof emptyForm) => void; 
  onCancel: () => void; 
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(initial);
    setFormErrors({});
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
    <Card className="bg-white border-primary/20 shadow-xl rounded-xl mb-8 animate-in slide-in-from-top-4 duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
        <CardTitle className="text-foreground text-lg font-black flex items-center gap-2">
          <CarFront className="h-5 w-5 text-primary" />
          {mode === 'add' ? 'Ajouter un véhicule' : 'Modifier le véhicule'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-secondary rounded-xl"><X className="h-5 w-5 text-muted-foreground" /></Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-bold uppercase tracking-widest text-[10px]">Immatriculation *</Label>
            <Input placeholder="CE 123 4L" value={form.immatriculation}
              onChange={(e) => setForm({ ...form, immatriculation: e.target.value.toUpperCase() })}
              className="bg-secondary/20 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary shadow-sm font-bold text-sm" />
            {errors.immatriculation && <p className="text-xs text-destructive font-semibold">{errors.immatriculation}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-bold uppercase tracking-widest text-[10px]">Marque *</Label>
            <Input placeholder="Toyota" value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="bg-secondary/20 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary shadow-sm font-bold text-sm" />
            {errors.brand && <p className="text-xs text-destructive font-semibold">{errors.brand}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-bold uppercase tracking-widest text-[10px]">Modèle *</Label>
            <Input placeholder="Coaster" value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="bg-secondary/20 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary shadow-sm font-bold text-sm" />
            {errors.model && <p className="text-xs text-destructive font-semibold">{errors.model}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-bold uppercase tracking-widest text-[10px]">Capacité (places) *</Label>
            <Input type="number" min={1} value={form.total_seats}
              onChange={(e) => setForm({ ...form, total_seats: parseInt(e.target.value) || 0 })}
              className="bg-secondary/20 border-border text-foreground rounded-xl h-11 focus-visible:ring-primary shadow-sm font-bold text-sm" />
            {errors.total_seats && <p className="text-xs text-destructive font-semibold">{errors.total_seats}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-bold uppercase tracking-widest text-[10px]">Statut</Label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
              className="w-full rounded-xl bg-secondary/20 border border-border text-foreground h-11 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm font-bold">
              <option value="ACTIVE">Actif</option>
              <option value="MAINTENANCE">En maintenance</option>
              <option value="GARAGE">Au garage</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onCancel} className="rounded-xl font-bold h-10 px-6 border-border">Annuler</Button>
          <Button onClick={() => { if (validate()) onSave(form); }} className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black h-10 px-8 shadow-md shadow-primary/20 transition-all active:scale-95" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VehiclesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'PDG';
  const isChef = user?.role === 'CHEF_AGENCE';
  const isAdminOrChef = isAdmin || isChef;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | VehicleStatus>('ALL');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('vehicles').select('*').order('immatriculation');
      if (error) throw error;
      setVehicles(data || []);
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleAdd = async (v: typeof emptyForm) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('vehicles').insert(v);
      if (error) throw error;
      toast.success('Véhicule ajouté');
      setShowForm(false);
      fetchVehicles();
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (v: typeof emptyForm) => {
    if (!editingVehicle) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('vehicles').update(v).eq('id', editingVehicle.id);
      if (error) throw error;
      toast.success('Véhicule modifié');
      setEditingVehicle(null);
      fetchVehicles();
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce véhicule ?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Véhicule supprimé');
      fetchVehicles();
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchStatus;
  });

  const counts = {
    ALL: vehicles.length,
    ACTIVE: vehicles.filter((v) => v.status === 'ACTIVE').length,
    MAINTENANCE: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
    GARAGE: vehicles.filter((v) => v.status === 'GARAGE').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Gestion de la Flotte</h2>
          <p className="text-muted-foreground mt-1 font-bold italic">Suivi technique et opérationnel des bus.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowForm(true); setEditingVehicle(null); }} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-black transition-all hover:-translate-y-0.5">
            <Plus className="mr-3 h-5 w-5" />Ajouter Véhicule
          </Button>
        )}
      </div>

      {showForm && !editingVehicle && (
        <VehicleForm mode="add" initial={emptyForm} onSave={handleAdd} onCancel={() => setShowForm(false)} saving={saving} />
      )}
      {editingVehicle && (
        <VehicleForm mode="edit"
          initial={{ immatriculation: editingVehicle.immatriculation, brand: editingVehicle.brand, model: editingVehicle.model, total_seats: editingVehicle.total_seats, status: editingVehicle.status, notes: editingVehicle.notes || '' }}
          onSave={handleEdit} onCancel={() => setEditingVehicle(null)} saving={saving} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { key: 'ALL', label: 'Total Flotte', icon: CarFront, color: 'text-foreground', bg: 'bg-secondary' },
          { key: 'ACTIVE', label: 'Opérationnels', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { key: 'MAINTENANCE', label: 'En révision', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { key: 'GARAGE', label: 'Immobilisés', icon: X, color: 'text-red-600', bg: 'bg-red-50' },
        ] as const).map(({ key, label, icon: Icon, color, bg }) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            className={`bg-white border rounded-xl p-4 text-left transition-all shadow-sm hover:shadow-md ${filterStatus === key ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-border/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
              <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
            </div>
            <p className={`text-2xl font-black ${filterStatus === key ? 'text-primary' : 'text-foreground'}`}>{counts[key]}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
          <Bus className="mx-auto h-12 w-12 opacity-10 mb-4" />
          <p className="font-bold text-muted-foreground">Aucun véhicule trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v) => (
            <Card key={v.id} className="bg-white border-border hover:border-primary/40 transition-all shadow-sm hover:shadow-xl rounded-xl overflow-hidden group border-2">
              <CardHeader className="bg-secondary/10 p-5 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-lg bg-white border border-border shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-lg font-black text-foreground leading-none">{v.immatriculation}</CardTitle>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{v.brand} {v.model}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold">Capacité :</span>
                    <span className="font-black text-foreground">{v.total_seats} places</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-bold text-sm">État :</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
                      v.status === 'ACTIVE' ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                    )}>
                      {v.status === 'ACTIVE' ? 'En service' : 'Maintenance'}
                    </span>
                  </div>
                  {isAdminOrChef && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" className="flex-1 border-2 border-border text-foreground hover:bg-secondary rounded-xl font-bold h-9 text-xs" 
                        onClick={() => { setEditingVehicle(v); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        <Edit2 className="mr-2 h-3.5 w-3.5" />Modifier
                      </Button>
                      <Button variant="outline" className="w-10 border-2 border-border text-destructive hover:bg-destructive/10 rounded-xl font-bold h-9 p-0" 
                        onClick={() => handleDelete(v.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
