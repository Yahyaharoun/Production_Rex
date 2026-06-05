import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Users, UserPlus, X, Phone, CheckCircle, Edit2, Loader2, Car, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { useConfirm } from '../../providers/ConfirmProvider';

type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'REST';
type DriverType = 'TITULAIRE' | 'MERCENAIRE';

interface Driver {
  id: string;
  name: string;
  license_number: string;
  phone: string;
  status: DriverStatus;
  type: DriverType;
  assigned_vehicle_id?: string;
  vehicles?: { immatriculation: string };
}

interface Vehicle {
  id: string;
  immatriculation: string;
}

const emptyForm = {
  name: '',
  license_number: '',
  phone: '',
  status: 'AVAILABLE' as DriverStatus,
  type: 'TITULAIRE' as DriverType,
  assigned_vehicle_id: 'none'
};

function DriverForm({ mode, initial, vehicles, onSave, onCancel, saving }: {
  mode: 'add' | 'edit';
  initial: typeof emptyForm;
  vehicles: Vehicle[];
  onSave: (d: typeof emptyForm) => void;
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
    if (!form.name.trim()) e.name = 'Nom requis';
    if (!form.license_number.trim()) e.license_number = 'Permis requis';
    if (!form.phone.trim()) e.phone = 'Téléphone requis';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <Card className="bg-white border-primary/20 shadow-xl rounded-xl mb-6 animate-in slide-in-from-top-4 duration-300 overflow-hidden">
      <CardHeader className="bg-secondary/20 pb-4 p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {mode === 'add' ? 'Nouveau Chauffeur' : 'Modifier Chauffeur'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-white rounded-xl p-2 border border-border">
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom complet *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" />
            {errors.name && <p className="text-[10px] text-destructive font-black uppercase">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Numéro Permis *</Label>
            <Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" />
            {errors.license_number && <p className="text-[10px] text-destructive font-black uppercase">{errors.license_number}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Téléphone *</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" />
            {errors.phone && <p className="text-[10px] text-destructive font-black uppercase">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type de contrat</Label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DriverType })}
              className="w-full rounded-xl bg-secondary/10 border border-border h-11 px-3 text-sm font-bold">
              <option value="TITULAIRE">Titulaire</option>
              <option value="MERCENAIRE">Mercenaire</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Véhicule</Label>
            <select value={form.assigned_vehicle_id} onChange={(e) => setForm({ ...form, assigned_vehicle_id: e.target.value })}
              className="w-full rounded-xl bg-secondary/10 border border-border h-11 px-3 text-sm font-bold">
              <option value="none">Aucun</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.immatriculation}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Statut</Label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}
              className="w-full rounded-xl bg-secondary/10 border border-border h-11 px-3 text-sm font-bold">
              <option value="AVAILABLE">Disponible</option>
              <option value="ON_TRIP">En mission</option>
              <option value="REST">En repos</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border/50">
          <Button variant="outline" onClick={onCancel} className="rounded-xl font-bold h-10 px-6 border-border">Annuler</Button>
          <Button onClick={() => { if (validate()) onSave(form); }} className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black h-10 px-8 shadow-md" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DriversPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'PDG';
  const isChef = user?.role === 'CHEF_AGENCE';
  const canAddDelete = isAdmin || isChef;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [search, setSearch] = useState('');
  const confirm = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        supabase.from('drivers').select('*, vehicles(immatriculation)').order('name'),
        supabase.from('vehicles').select('id, immatriculation').order('immatriculation')
      ]);
      if (driversRes.error) throw driversRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      setDrivers(driversRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (err: unknown) {
      toast.error('Erreur', { description: (err as any)?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (d: typeof emptyForm) => {
    setSaving(true);
    try {
      const payload = {
        name: d.name,
        license_number: d.license_number,
        phone: d.phone,
        status: d.status,
        type: d.type,
        assigned_vehicle_id: d.assigned_vehicle_id === 'none' ? null : d.assigned_vehicle_id
      };
      const { error } = await supabase.from('drivers').insert(payload);
      if (error) throw error;
      toast.success('Chauffeur ajouté');
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      toast.error('Erreur', { description: (err as any)?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (d: typeof emptyForm) => {
    if (!editingDriver) return;
    setSaving(true);
    try {
      const payload = {
        name: d.name,
        license_number: d.license_number,
        phone: d.phone,
        status: d.status,
        type: d.type,
        assigned_vehicle_id: d.assigned_vehicle_id === 'none' ? null : d.assigned_vehicle_id
      };
      const { error } = await supabase.from('drivers').update(payload).eq('id', editingDriver.id);
      if (error) throw error;
      toast.success('Chauffeur mis à jour');
      setEditingDriver(null);
      fetchData();
    } catch (err: unknown) {
      toast.error('Erreur', { description: (err as any)?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Suppression',
      message: 'Voulez-vous vraiment supprimer ce chauffeur ?',
      variant: 'danger'
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Chauffeur supprimé');
      fetchData();
    } catch (err: unknown) {
      toast.error('Erreur', { description: (err as any)?.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search));

  const statusColor = {
    AVAILABLE: 'bg-green-100 text-green-700',
    ON_TRIP: 'bg-blue-600 text-white shadow-md shadow-blue-200',
    REST: 'bg-gray-100 text-gray-600'
  };

  const statusLabel = {
    AVAILABLE: 'Disponible',
    ON_TRIP: 'En mission',
    REST: 'En repos'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Répertoire Chauffeurs</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Gestion des contrats et missions</p>
        </div>
        {canAddDelete && (
          <Button onClick={() => { setShowForm(true); setEditingDriver(null); }} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 font-black shadow-lg">
            <UserPlus className="mr-2 h-4 w-4" /> Ajouter Chauffeur
          </Button>
        )}
      </div>

      {showForm && !editingDriver && <DriverForm mode="add" initial={emptyForm} vehicles={vehicles} onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />}
      {editingDriver && <DriverForm mode="edit" vehicles={vehicles} onSave={handleUpdate} onCancel={() => setEditingDriver(null)} saving={saving}
        initial={{
          name: editingDriver.name,
          license_number: editingDriver.license_number,
          phone: editingDriver.phone,
          status: editingDriver.status,
          type: editingDriver.type || 'TITULAIRE',
          assigned_vehicle_id: editingDriver.assigned_vehicle_id || 'none'
        }}
      />}

      <div className="relative max-w-sm">
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white border-border rounded-xl h-10 shadow-sm font-bold text-sm" />
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(driver => (
            <Card key={driver.id} className="bg-white border-border hover:border-primary/40 transition-all shadow-sm rounded-xl overflow-hidden group border-2">
              <CardHeader className="p-4 bg-secondary/5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white border border-border flex items-center justify-center font-black text-primary text-sm group-hover:scale-110 transition-transform">
                    {driver.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-foreground text-sm font-black truncate">{driver.name}</CardTitle>
                    <span className={cn("text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter", driver.type === 'TITULAIRE' ? "bg-primary text-white" : "bg-orange-500 text-white")}>
                      {driver.type}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className={cn("text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest", statusColor[driver.status])}>
                    {statusLabel[driver.status]}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {driver.phone}
                  </span>
                </div>
                <div className="bg-secondary/20 p-2 rounded-lg border border-border/50 flex items-center gap-2">
                  <Car className="h-3.5 w-3.5 text-primary" />
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Véhicule assigné</p>
                    <p className="text-xs font-black text-foreground">{driver.vehicles?.immatriculation || 'AUCUN'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-foreground text-white rounded-lg h-9 font-black text-xs" onClick={() => setSelectedDriver(driver)}>Détails</Button>
                  {canAddDelete && (
                    <>
                      <Button variant="outline" className="border-border rounded-lg h-9 w-9 p-0" onClick={() => setEditingDriver(driver)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="border-border text-destructive hover:bg-destructive/10 rounded-lg h-9 w-9 p-0" onClick={() => handleDelete(driver.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur px-4">
          <Card className="bg-white border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="h-20 bg-primary/10 relative">
              <Button variant="ghost" className="absolute right-2 top-2 rounded-full h-8 w-8 p-0" onClick={() => setSelectedDriver(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 pb-6 -mt-8 relative">
              <div className="h-16 w-16 rounded-2xl bg-white border-2 border-primary shadow-xl flex items-center justify-center font-black text-primary text-xl mb-4">
                {selectedDriver.name.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="text-xl font-black text-foreground">{selectedDriver.name}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Permis: {selectedDriver.license_number}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-bold">Type Contrat</span>
                  <span className="font-black text-foreground">{selectedDriver.type}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-bold">Téléphone</span>
                  <span className="font-black text-foreground">{selectedDriver.phone}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-bold">Véhicule</span>
                  <span className="font-black text-primary">{selectedDriver.vehicles?.immatriculation || 'NON ASSIGNÉ'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}


