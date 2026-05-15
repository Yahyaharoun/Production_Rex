import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Users, Plus, X, Search, Phone, CreditCard, CheckCircle, Edit2, Loader2, Car, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';

type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'REST';
type DriverType = 'TITULAIRE' | 'MERCENAIRE';

interface Driver {
  id: string;
  name: string;
  license_number: string;
  phone: string;
  status: DriverStatus;
  type: DriverType;
  assigned_vehicle_id: string | null;
  vehicles?: { immatriculation: string } | null;
  created_at: string;
}

interface Vehicle {
  id: string;
  immatriculation: string;
}

const statusLabel: Record<DriverStatus, string> = { AVAILABLE: 'Disponible', ON_TRIP: 'En mission', REST: 'En repos' };
const statusColor: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  ON_TRIP: 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200', // Bleu vif comme demandé
  REST: 'bg-yellow-100 text-yellow-700',
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [search, setSearch] = useState('');

  // États de formulaire séparés pour éviter les problèmes de focus/saisie
  const [fName, setFName] = useState('');
  const [fLicense, setFLicense] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fStatus, setFStatus] = useState<DriverStatus>('AVAILABLE');
  const [fType, setFType] = useState<DriverType>('TITULAIRE');
  const [fVehicle, setFVehicle] = useState<string>('none');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        supabase.from('drivers').select('*, vehicles(immatriculation)').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('id, immatriculation')
      ]);
      if (driversRes.error) throw driversRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      setDrivers(driversRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFName(''); setFLicense(''); setFPhone('');
    setFStatus('AVAILABLE'); setFType('TITULAIRE'); setFVehicle('none');
    setFormErrors({});
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fName.trim()) errors.name = 'Nom requis';
    if (!fLicense.trim()) errors.license = 'N° Permis requis';
    if (!fPhone.trim()) errors.phone = 'Téléphone requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: fName.trim(),
        license_number: fLicense.trim(),
        phone: fPhone.trim(),
        status: fStatus,
        type: fType,
        assigned_vehicle_id: fVehicle === 'none' ? null : fVehicle
      };

      let res;
      if (editingDriver) {
        res = await supabase.from('drivers').update(payload).eq('id', editingDriver.id);
      } else {
        res = await supabase.from('drivers').insert(payload);
      }

      if (res.error) throw res.error;

      toast.success(editingDriver ? 'Mis à jour' : 'Enregistré');
      setShowForm(false); setEditingDriver(null); resetForm();
      fetchData();
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFName(driver.name);
    setFLicense(driver.license_number);
    setFPhone(driver.phone);
    setFStatus(driver.status);
    setFType(driver.type || 'TITULAIRE');
    setFVehicle(driver.assigned_vehicle_id || 'none');
    setFormErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.license_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">Personnel de Conduite</h2>
          <p className="text-muted-foreground mt-1 font-bold">Gérez vos chauffeurs titulaires et mercenaires.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black transition-all hover:scale-105"
          onClick={() => { setShowForm(!showForm); setEditingDriver(null); resetForm(); }}>
          {showForm ? <X className="mr-2 h-6 w-6" /> : <Plus className="mr-2 h-6 w-6" />}
          {showForm ? 'Annuler' : 'Nouveau chauffeur'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white border-primary/20 shadow-2xl rounded-[2rem] overflow-hidden animate-in slide-in-from-top-6 duration-500">
          <CardHeader className="bg-secondary/10 border-b border-border/50 p-8">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <UserCheck className="h-7 w-7 text-primary" />
              {editingDriver ? `Modifier ${editingDriver.name}` : 'Enregistrer un nouveau chauffeur'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom Complet</Label>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Ex: Jean Essomba" className="bg-secondary/20 border-border rounded-xl h-12 font-bold" />
                {formErrors.name && <p className="text-[10px] text-destructive font-black uppercase">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Numéro de Permis</Label>
                <Input value={fLicense} onChange={(e) => setFLicense(e.target.value)} placeholder="Ex: CM-12345" className="bg-secondary/20 border-border rounded-xl h-12 font-bold" />
                {formErrors.license && <p className="text-[10px] text-destructive font-black uppercase">{formErrors.license}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Téléphone</Label>
                <Input value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="+237 ..." className="bg-secondary/20 border-border rounded-xl h-12 font-bold" />
                {formErrors.phone && <p className="text-[10px] text-destructive font-black uppercase">{formErrors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type de contrat</Label>
                <select value={fType} onChange={(e) => setFType(e.target.value as any)} className="w-full bg-secondary/20 border-border rounded-xl h-12 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="TITULAIRE">Titulaire</option>
                  <option value="MERCENAIRE">Mercenaire</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Véhicule assigné</Label>
                <select value={fVehicle} onChange={(e) => setFVehicle(e.target.value)} className="w-full bg-secondary/20 border-border rounded-xl h-12 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="none">Aucun véhicule</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.immatriculation}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Statut actuel</Label>
                <select value={fStatus} onChange={(e) => setFStatus(e.target.value as any)} className="w-full bg-secondary/20 border-border rounded-xl h-12 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="AVAILABLE">Disponible</option>
                  <option value="ON_TRIP">En mission</option>
                  <option value="REST">En repos</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-border/50">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingDriver(null); resetForm(); }} className="h-12 px-8 rounded-xl font-bold">Annuler</Button>
              <Button onClick={handleSave} className="h-12 px-12 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20" disabled={saving}>
                {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                {editingDriver ? 'Enregistrer les modifications' : 'Créer le profil chauffeur'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Rechercher par nom ou permis..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 bg-white border-border rounded-2xl h-14 shadow-sm font-bold" />
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 rounded-[2rem]" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="bg-white border-border hover:border-primary/40 transition-all shadow-sm hover:shadow-2xl rounded-[2rem] overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center font-black text-primary text-2xl border border-border shadow-inner">
                    {d.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-foreground truncate">{d.name}</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{d.type || 'TITULAIRE'}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl border border-border/50">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Véhicule</span>
                    <span className="text-xs font-black text-foreground">{d.vehicles?.immatriculation || 'NON ASSIGNÉ'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", statusColor[d.status])}>
                      {statusLabel[d.status]}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-2"><Phone className="h-3 w-3 text-primary" />{d.phone}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setSelectedDriver(d)} className="flex-1 bg-foreground text-white rounded-xl h-11 font-black">Détails</Button>
                  <Button variant="outline" onClick={() => openEdit(d)} className="w-11 h-11 p-0 rounded-xl border-border hover:bg-secondary"><Edit2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-none">
            <div className="bg-primary p-10 text-white relative">
              <button onClick={() => setSelectedDriver(null)} className="absolute top-6 right-6 p-2 bg-white/20 rounded-2xl hover:bg-white/30 transition-colors"><X className="h-6 w-6" /></button>
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-[2rem] bg-white text-primary flex items-center justify-center text-4xl font-black shadow-2xl">
                  {selectedDriver.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-3xl font-black leading-tight">{selectedDriver.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedDriver.type}</span>
                    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white text-primary")}>
                      {statusLabel[selectedDriver.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 p-6 rounded-[2rem] border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Immatriculation</p>
                  <p className="text-xl font-black text-foreground flex items-center gap-2">
                    <Car className="h-6 w-6 text-primary" />
                    {selectedDriver.vehicles?.immatriculation || 'AUCUNE'}
                  </p>
                </div>
                <div className="bg-secondary/30 p-6 rounded-[2rem] border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Numéro Permis</p>
                  <p className="text-xl font-black text-foreground flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                    {selectedDriver.license_number}
                  </p>
                </div>
              </div>
              <div className="bg-secondary/30 p-6 rounded-[2rem] border border-border/50">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Contact Direct</p>
                <p className="text-2xl font-black text-foreground flex items-center gap-3">
                  <Phone className="h-7 w-7 text-primary" />
                  {selectedDriver.phone}
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Button className="flex-1 h-14 bg-foreground text-white rounded-2xl font-black shadow-xl" onClick={() => setSelectedDriver(null)}>Fermer</Button>
                <Button variant="outline" className="flex-1 h-14 border-border rounded-2xl font-black" onClick={() => { const d = selectedDriver; setSelectedDriver(null); openEdit(d); }}>Modifier</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
