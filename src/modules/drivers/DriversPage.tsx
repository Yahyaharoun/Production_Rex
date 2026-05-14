import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Users, Plus, X, Search, Phone, CreditCard, CheckCircle, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'REST';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  status: DriverStatus;
  createdAt: string;
}

const STORAGE_KEY = 'rex-drivers';
const generateId = () => `drv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const emptyForm = {
  name: '',
  licenseNumber: '',
  phone: '',
  status: 'AVAILABLE' as DriverStatus,
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusLabel: Record<DriverStatus, string> = {
  AVAILABLE: 'Disponible',
  ON_TRIP: 'En mission',
  REST: 'En repos',
};

const statusColor: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-500/15 text-green-400',
  ON_TRIP: 'bg-accent/15 text-accent',
  REST: 'bg-yellow-500/15 text-yellow-400',
};

// ─── Page principale ──────────────────────────────────────────────────────────
export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Chargement depuis localStorage au démarrage ────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDrivers(JSON.parse(saved));
      } catch {
        setDrivers([]);
      }
    }
  }, []);

  // ── Persistance dans localStorage ─────────────────────────────────────────
  const persist = (updated: Driver[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDrivers(updated);
  };

  // ── Validation du formulaire ───────────────────────────────────────────────
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nom requis';
    if (!form.licenseNumber.trim()) errors.licenseNumber = 'Numéro de permis requis';
    if (!form.phone.trim()) errors.phone = 'Téléphone requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Ajout d'un chauffeur ───────────────────────────────────────────────────
  const handleSave = () => {
    if (!validateForm()) return;

    const newDriver: Driver = {
      id: generateId(),
      name: form.name.trim(),
      licenseNumber: form.licenseNumber.trim(),
      phone: form.phone.trim(),
      status: form.status,
      createdAt: new Date().toISOString(),
    };

    const updated = [newDriver, ...drivers];
    persist(updated);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(false);
    toast.success('Chauffeur enregistré', { description: `${newDriver.name} ajouté avec succès.` });
  };

  // ── Modification d'un chauffeur ────────────────────────────────────────────
  const handleUpdate = () => {
    if (!validateForm() || !editingDriver) return;

    const updated = drivers.map((d) =>
      d.id === editingDriver.id
        ? {
            ...d,
            name: form.name.trim(),
            licenseNumber: form.licenseNumber.trim(),
            phone: form.phone.trim(),
            status: form.status,
          }
        : d
    );
    persist(updated);
    setEditingDriver(null);
    setForm(emptyForm);
    setFormErrors({});
    toast.success('Chauffeur mis à jour', { description: `${form.name} modifié avec succès.` });
  };

  // ── Ouverture du formulaire de modification ────────────────────────────────
  const openEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      phone: driver.phone,
      status: driver.status,
    });
    setFormErrors({});
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Gestion des Chauffeurs</h2>
          <p className="text-muted-foreground">Gérez le personnel de conduite et leurs affectations.</p>
        </div>
        <Button
          id="btn-add-driver"
          className="bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20"
          onClick={() => {
            setShowForm(true);
            setEditingDriver(null);
            setForm(emptyForm);
            setFormErrors({});
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nouveau chauffeur
        </Button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && !editingDriver && (
        <Card className="bg-card border-accent/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Ajouter un chauffeur
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setFormErrors({}); }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white text-sm">Nom complet *</Label>
              <Input
                id="driver-name"
                placeholder="Jean Dupont"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-secondary/50 border-border text-white"
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white text-sm">N° Permis *</Label>
              <Input
                id="driver-license"
                placeholder="D-123456"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                className="bg-secondary/50 border-border text-white"
              />
              {formErrors.licenseNumber && <p className="text-xs text-destructive">{formErrors.licenseNumber}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white text-sm">Téléphone *</Label>
              <Input
                id="driver-phone"
                placeholder="+237 6XX XXX XXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-secondary/50 border-border text-white"
              />
              {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white text-sm">Statut</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}
                className="w-full rounded-md bg-secondary/50 border border-border text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="ON_TRIP">En mission</option>
                <option value="REST">En repos</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); setFormErrors({}); setForm(emptyForm); }}
                className="border-border text-white hover:bg-secondary"
              >
                Annuler
              </Button>
              <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-white">
                <CheckCircle className="mr-2 h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire de modification */}
      {editingDriver && (
        <Card className="bg-card border-accent/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-accent" />
              Modifier — {editingDriver.name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { setEditingDriver(null); setFormErrors({}); setForm(emptyForm); }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white text-sm">Nom complet *</Label>
              <Input
                placeholder="Jean Dupont"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-secondary/50 border-border text-white"
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white text-sm">N° Permis *</Label>
              <Input
                placeholder="D-123456"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                className="bg-secondary/50 border-border text-white"
              />
              {formErrors.licenseNumber && <p className="text-xs text-destructive">{formErrors.licenseNumber}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white text-sm">Téléphone *</Label>
              <Input
                placeholder="+237 6XX XXX XXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-secondary/50 border-border text-white"
              />
              {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white text-sm">Statut</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}
                className="w-full rounded-md bg-secondary/50 border border-border text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="ON_TRIP">En mission</option>
                <option value="REST">En repos</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setEditingDriver(null); setFormErrors({}); setForm(emptyForm); }}
                className="border-border text-white hover:bg-secondary"
              >
                Annuler
              </Button>
              <Button onClick={handleUpdate} className="bg-accent hover:bg-accent/90 text-white">
                <CheckCircle className="mr-2 h-4 w-4" /> Mettre à jour
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre de recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="search-drivers"
          placeholder="Rechercher un chauffeur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border text-white"
        />
      </div>

      {/* Grille des chauffeurs */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p>{search ? `Aucun chauffeur trouvé pour "${search}"` : 'Aucun chauffeur enregistré. Ajoutez-en un !'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((driver) => (
            <Card key={driver.id} className="bg-card border-border hover:border-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                {/* Avatar initiales */}
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-lg select-none">
                  {driver.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <CardTitle className="text-white text-base truncate">{driver.name}</CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CreditCard className="h-3 w-3 flex-shrink-0" /> {driver.licenseNumber}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[driver.status]}`}>
                  {statusLabel[driver.status]}
                </span>
              </CardHeader>
              <CardContent className="pt-3 border-t border-border mt-3">
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Téléphone
                  </span>
                  <span className="text-white">{driver.phone}</span>
                </div>
                <div className="flex gap-2">
                  {/* Bouton Détails */}
                  <Button
                    id={`btn-details-${driver.id}`}
                    className="flex-1 bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/30 transition-colors"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    Détails
                  </Button>
                  {/* Bouton Modifier */}
                  <Button
                    id={`btn-edit-${driver.id}`}
                    variant="outline"
                    className="border-border text-muted-foreground hover:text-white hover:bg-secondary"
                    onClick={() => openEdit(driver)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Détails */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold text-white">Profil du chauffeur</h3>
              <button
                onClick={() => setSelectedDriver(null)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-5 space-y-5">
              {/* Avatar + nom + statut */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center font-black text-accent text-3xl select-none">
                  {selectedDriver.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedDriver.name}</h4>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[selectedDriver.status]}`}>
                    {statusLabel[selectedDriver.status]}
                  </span>
                  {selectedDriver.createdAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajouté le {new Date(selectedDriver.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Infos détaillées */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between bg-secondary/20 rounded-lg p-3">
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> N° Permis
                  </span>
                  <span className="text-white font-semibold">{selectedDriver.licenseNumber}</span>
                </div>
                <div className="flex items-center justify-between bg-secondary/20 rounded-lg p-3">
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Téléphone
                  </span>
                  <span className="text-white font-semibold">{selectedDriver.phone}</span>
                </div>
                <div className="flex items-center justify-between bg-secondary/20 rounded-lg p-3">
                  <span className="text-muted-foreground text-sm">ID Chauffeur</span>
                  <span className="text-white font-mono text-xs">{selectedDriver.id}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border flex justify-between gap-3">
              <Button
                variant="outline"
                className="border-border text-white hover:bg-secondary"
                onClick={() => {
                  setSelectedDriver(null);
                  openEdit(selectedDriver);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" /> Modifier
              </Button>
              <Button
                onClick={() => setSelectedDriver(null)}
                className="bg-accent hover:bg-accent/90 text-white"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
