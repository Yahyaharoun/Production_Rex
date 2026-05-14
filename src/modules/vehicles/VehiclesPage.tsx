import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
  CarFront, Plus, Search, Filter, Edit, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

interface Vehicle {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  capacite: number;
  status: VehicleStatus;
  maintenanceNote?: string;
}

const STORAGE_KEY = 'rex-vehicles';

const generateId = () => `veh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const emptyForm: Omit<Vehicle, 'id'> = {
  immatriculation: '',
  marque: '',
  modele: '',
  capacite: 30,
  status: 'ACTIVE',
  maintenanceNote: '',
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusLabel: Record<VehicleStatus, string> = {
  ACTIVE: 'Actif',
  MAINTENANCE: 'En maintenance',
  INACTIVE: 'Inactif',
};

const statusColor: Record<VehicleStatus, string> = {
  ACTIVE: 'bg-green-500/15 text-green-400',
  MAINTENANCE: 'bg-yellow-500/15 text-yellow-400',
  INACTIVE: 'bg-red-500/15 text-red-400',
};

// ─── Données initiales de démonstration ───────────────────────────────────────
const DEFAULT_VEHICLES: Vehicle[] = [
  { id: 'veh-1', immatriculation: 'CE 451 1L', marque: 'Toyota', modele: 'Coaster', capacite: 30, status: 'ACTIVE' },
  { id: 'veh-2', immatriculation: 'LT 123 2L', marque: 'Toyota', modele: 'Hiace', capacite: 15, status: 'MAINTENANCE', maintenanceNote: 'Révision moteur' },
  { id: 'veh-3', immatriculation: 'CE 987 3L', marque: 'Mercedes', modele: 'Sprinter', capacite: 20, status: 'ACTIVE' },
  { id: 'veh-4', immatriculation: 'OU 456 4L', marque: 'Toyota', modele: 'Coaster', capacite: 30, status: 'ACTIVE' },
  { id: 'veh-5', immatriculation: 'SU 789 5L', marque: 'Hyundai', modele: 'County', capacite: 28, status: 'ACTIVE' },
];

// ─── Formulaire d'ajout / modification ────────────────────────────────────────
function VehicleForm({
  initial,
  onSave,
  onCancel,
  mode,
}: {
  initial: Omit<Vehicle, 'id'>;
  onSave: (data: Omit<Vehicle, 'id'>) => void;
  onCancel: () => void;
  mode: 'add' | 'edit';
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.immatriculation.trim()) e.immatriculation = 'Immatriculation requise';
    if (!form.marque.trim()) e.marque = 'Marque requise';
    if (!form.modele.trim()) e.modele = 'Modèle requis';
    if (form.capacite < 1) e.capacite = 'Capacité invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  return (
    <Card className="bg-card border-accent/40">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <CarFront className="h-5 w-5 text-accent" />
          {mode === 'add' ? 'Ajouter un véhicule' : 'Modifier le véhicule'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Immatriculation */}
        <div className="space-y-1.5">
          <Label className="text-white text-sm">Immatriculation *</Label>
          <Input
            placeholder="CE 123 4L"
            value={form.immatriculation}
            onChange={(e) => setForm({ ...form, immatriculation: e.target.value.toUpperCase() })}
            className="bg-secondary/50 border-border text-white"
          />
          {errors.immatriculation && <p className="text-xs text-destructive">{errors.immatriculation}</p>}
        </div>

        {/* Marque */}
        <div className="space-y-1.5">
          <Label className="text-white text-sm">Marque *</Label>
          <Input
            placeholder="Toyota"
            value={form.marque}
            onChange={(e) => setForm({ ...form, marque: e.target.value })}
            className="bg-secondary/50 border-border text-white"
          />
          {errors.marque && <p className="text-xs text-destructive">{errors.marque}</p>}
        </div>

        {/* Modèle */}
        <div className="space-y-1.5">
          <Label className="text-white text-sm">Modèle *</Label>
          <Input
            placeholder="Coaster"
            value={form.modele}
            onChange={(e) => setForm({ ...form, modele: e.target.value })}
            className="bg-secondary/50 border-border text-white"
          />
          {errors.modele && <p className="text-xs text-destructive">{errors.modele}</p>}
        </div>

        {/* Capacité */}
        <div className="space-y-1.5">
          <Label className="text-white text-sm">Capacité (places) *</Label>
          <Input
            type="number"
            min={1}
            value={form.capacite}
            onChange={(e) => setForm({ ...form, capacite: parseInt(e.target.value) || 0 })}
            className="bg-secondary/50 border-border text-white"
          />
          {errors.capacite && <p className="text-xs text-destructive">{errors.capacite}</p>}
        </div>

        {/* Statut */}
        <div className="space-y-1.5">
          <Label className="text-white text-sm">Statut</Label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
            className="w-full rounded-md bg-secondary/50 border border-border text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="ACTIVE">Actif</option>
            <option value="MAINTENANCE">En maintenance</option>
            <option value="INACTIVE">Inactif</option>
          </select>
        </div>

        {/* Note maintenance */}
        {form.status === 'MAINTENANCE' && (
          <div className="space-y-1.5">
            <Label className="text-white text-sm">Description de la panne</Label>
            <Input
              placeholder="Ex: Révision moteur..."
              value={form.maintenanceNote || ''}
              onChange={(e) => setForm({ ...form, maintenanceNote: e.target.value })}
              className="bg-secondary/50 border-border text-white"
            />
          </div>
        )}

        {/* Actions */}
        <div className="md:col-span-3 flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-border text-white hover:bg-secondary"
          >
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-white">
            <CheckCircle className="mr-2 h-4 w-4" />
            {mode === 'add' ? 'Enregistrer' : 'Mettre à jour'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | 'ALL'>('ALL');

  // ── Chargement initial depuis localStorage (avec données par défaut) ──────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setVehicles(JSON.parse(saved));
      } catch {
        setVehicles(DEFAULT_VEHICLES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VEHICLES));
      }
    } else {
      // Première visite : charger les données de démo
      setVehicles(DEFAULT_VEHICLES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VEHICLES));
    }
  }, []);

  // ── Persistance après chaque modification ──────────────────────────────────
  const persist = (updated: Vehicle[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setVehicles(updated);
  };

  // ── Ajout d'un véhicule ────────────────────────────────────────────────────
  const handleAdd = (data: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = { ...data, id: generateId() };
    const updated = [newVehicle, ...vehicles];
    persist(updated);
    setShowForm(false);
    toast.success('Véhicule ajouté', { description: `${data.immatriculation} — ${data.marque} ${data.modele}` });
  };

  // ── Modification d'un véhicule ─────────────────────────────────────────────
  const handleEdit = (data: Omit<Vehicle, 'id'>) => {
    if (!editingVehicle) return;
    const updated = vehicles.map((v) =>
      v.id === editingVehicle.id ? { ...editingVehicle, ...data } : v
    );
    persist(updated);
    setEditingVehicle(null);
    toast.success('Véhicule mis à jour', { description: `${data.immatriculation} modifié avec succès.` });
  };

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const filtered = vehicles.filter((v) => {
    const matchSearch =
      v.immatriculation.toLowerCase().includes(search.toLowerCase()) ||
      v.marque.toLowerCase().includes(search.toLowerCase()) ||
      v.modele.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: vehicles.length,
    ACTIVE: vehicles.filter((v) => v.status === 'ACTIVE').length,
    MAINTENANCE: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
    INACTIVE: vehicles.filter((v) => v.status === 'INACTIVE').length,
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Gestion des Véhicules</h2>
          <p className="text-muted-foreground">Gérez votre flotte et suivez la maintenance.</p>
        </div>
        <Button
          id="btn-add-vehicle"
          className="bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20"
          onClick={() => { setShowForm(true); setEditingVehicle(null); }}
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter un véhicule
        </Button>
      </div>

      {/* Formulaire ajout */}
      {showForm && !editingVehicle && (
        <VehicleForm
          mode="add"
          initial={emptyForm}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Formulaire modification */}
      {editingVehicle && (
        <VehicleForm
          mode="edit"
          initial={{
            immatriculation: editingVehicle.immatriculation,
            marque: editingVehicle.marque,
            modele: editingVehicle.modele,
            capacite: editingVehicle.capacite,
            status: editingVehicle.status,
            maintenanceNote: editingVehicle.maintenanceNote || '',
          }}
          onSave={handleEdit}
          onCancel={() => setEditingVehicle(null)}
        />
      )}

      {/* KPIs statuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: 'ALL', label: 'Total', icon: CarFront, color: 'text-white' },
          { key: 'ACTIVE', label: 'Actifs', icon: CheckCircle, color: 'text-green-400' },
          { key: 'MAINTENANCE', label: 'Maintenance', icon: AlertCircle, color: 'text-yellow-400' },
          { key: 'INACTIVE', label: 'Inactifs', icon: X, color: 'text-red-400' },
        ] as const).map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`bg-card border rounded-lg p-3 text-left transition-all hover:border-accent/50 ${filterStatus === key ? 'border-accent bg-accent/5' : 'border-border'
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
          </button>
        ))}
      </div>

      {/* Table des véhicules */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white text-lg">Liste des véhicules</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-vehicles"
                placeholder="Rechercher par immatriculation, marque..."
                className="pl-9 bg-background/50 border-border text-white focus-visible:ring-accent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="text-white border-border hover:bg-secondary"
              onClick={() => { setSearch(''); setFilterStatus('ALL'); }}
            >
              <Filter className="mr-2 h-4 w-4" /> Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Immatriculation</th>
                  <th className="px-4 py-3.5 font-medium">Marque / Modèle</th>
                  <th className="px-4 py-3.5 font-medium">Capacité</th>
                  <th className="px-4 py-3.5 font-medium">Statut</th>
                  <th className="px-4 py-3.5 font-medium">Note</th>
                  <th className="px-4 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      <CarFront className="mx-auto h-10 w-10 mb-2 opacity-20" />
                      {search ? `Aucun véhicule pour "${search}"` : 'Aucun véhicule enregistré'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">{v.immatriculation}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{v.marque} {v.modele}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{v.capacite} places</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[v.status]}`}>
                          {statusLabel[v.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[150px] truncate">
                        {v.maintenanceNote || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-accent hover:text-white hover:bg-accent transition-colors h-8 px-3"
                          onClick={() => {
                            setEditingVehicle(v);
                            setShowForm(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" /> Modifier
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
