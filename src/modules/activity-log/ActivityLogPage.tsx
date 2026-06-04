import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { FileText, Loader2, RefreshCw, Droplets, Fuel, Package, DollarSign, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { db } from '../../lib/dexie';

interface JournalEntry {
  id: string;
  date: string;
  type: 'production' | 'fuel' | 'wash' | 'other_expense' | 'activity';
  icon: string;
  description: string;
  amount?: number;
  status?: string;
  author?: string;
  vehicle?: string;
}

export default function ActivityLogPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'production' | 'fuel' | 'wash' | 'other_expense'>('ALL');

  const fetchAllData = async () => {
    setLoading(true);
    const all: JournalEntry[] = [];

    try {
      if (navigator.onLine) {
        // 1. Productions
        const prodQuery = supabase
          .from('productions')
          .select('id, date, immatriculation, driver_name, revenue, net_to_deposit, status, caissiere_name, created_at, ligne')
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: prods } = await prodQuery;
        if (prods) {
          for (const p of prods) {
            all.push({
              id: `prod-${p.id}`,
              date: p.created_at || p.date,
              type: 'production',
              icon: '🚌',
              description: `Production — ${p.immatriculation} · ${p.ligne || ''}`,
              amount: p.net_to_deposit,
              status: p.status,
              author: p.caissiere_name,
              vehicle: p.immatriculation,
            });
          }
        }

        // 2. Fuel expenses
        const fuelQuery = supabase
          .from('fuel_expenses')
          .select('id, date, vehicle_immat, amount, category, caissiere_name, created_at, line_name')
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: fuels } = await fuelQuery;
        if (fuels) {
          for (const f of fuels) {
            all.push({
              id: `fuel-${f.id}`,
              date: f.created_at || f.date,
              type: 'fuel',
              icon: '⛽',
              description: `Carburant ${f.category} — ${f.vehicle_immat} · ${f.line_name || ''}`,
              amount: f.amount,
              author: f.caissiere_name,
              vehicle: f.vehicle_immat,
            });
          }
        }

        // 3. Washes
        const washQuery = supabase
          .from('washes')
          .select('id, date, vehicle_immat, amount, caissiere_name, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: washData } = await washQuery;
        if (washData) {
          for (const w of washData) {
            all.push({
              id: `wash-${w.id}`,
              date: w.created_at || w.date,
              type: 'wash',
              icon: '🚿',
              description: `Lavage — ${w.vehicle_immat}`,
              amount: w.amount,
              author: w.caissiere_name,
              vehicle: w.vehicle_immat,
            });
          }
        }

        // 4. Other expenses
        const oeQuery = supabase
          .from('other_expenses')
          .select('id, date, label, reason, amount, status, caissiere_name, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: oeData } = await oeQuery;
        if (oeData) {
          for (const oe of oeData) {
            all.push({
              id: `oe-${oe.id}`,
              date: oe.created_at || oe.date,
              type: 'other_expense',
              icon: '💸',
              description: `Dépense — ${oe.label}: ${oe.reason || ''}`,
              amount: oe.amount,
              status: oe.status,
              author: oe.caissiere_name,
            });
          }
        }
      } else {
        // Offline: read from local Dexie
        const localProds = await db.productions.toArray();
        for (const p of localProds.slice(0, 30)) {
          all.push({
            id: `prod-${p.clientId}`,
            date: p.created_at || p.date,
            type: 'production',
            icon: '🚌',
            description: `Production — ${p.immatriculation} · ${p.ligne || ''}`,
            amount: p.net_to_deposit,
            status: p.status,
            vehicle: p.immatriculation,
          });
        }

        const localFuels = await db.fuelExpenses.toArray();
        for (const f of localFuels.slice(0, 30)) {
          all.push({
            id: `fuel-${f.clientId}`,
            date: f.date,
            type: 'fuel',
            icon: '⛽',
            description: `Carburant ${f.category} — ${f.vehicleImmat}`,
            amount: f.amount,
            vehicle: f.vehicleImmat,
          });
        }

        const localWashes = await db.washes.toArray();
        for (const w of localWashes.slice(0, 30)) {
          all.push({
            id: `wash-${w.clientId}`,
            date: w.date,
            type: 'wash',
            icon: '🚿',
            description: `Lavage — ${w.vehicleImmat}`,
            amount: w.amount,
            vehicle: w.vehicleImmat,
          });
        }
      }

      // Sort all by date desc
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(all);
    } catch (err: any) {
      toast.error('Erreur chargement journal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const filtered = filter === 'ALL' ? entries : entries.filter(e => e.type === filter);

  const typeLabel: Record<string, string> = {
    production: 'Productions',
    fuel: 'Carburant',
    wash: 'Lavage',
    other_expense: 'Autres Dépenses',
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const map: Record<string, string> = {
      VALIDATED: 'bg-emerald-100 text-emerald-700',
      DRAFT: 'bg-orange-100 text-orange-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
      VALIDEE: 'bg-emerald-100 text-emerald-700',
      REJETEE: 'bg-red-100 text-red-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    const label: Record<string, string> = {
      VALIDATED: 'Validé', DRAFT: 'Brouillon',
      PENDING: 'En attente', EN_ATTENTE: 'En attente',
      VALIDEE: 'Validée', REJETEE: 'Rejetée', REJECTED: 'Rejeté',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {label[status] || status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Journal d'Activité
          </h1>
          <p className="text-muted-foreground text-sm">Toutes les opérations — Productions, Carburant, Lavage, Dépenses</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'production', 'fuel', 'wash', 'other_expense'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'Tout' : typeLabel[f]}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { type: 'production', label: 'Productions', icon: '🚌', color: 'bg-blue-50 border-blue-200' },
          { type: 'fuel', label: 'Carburant', icon: '⛽', color: 'bg-amber-50 border-amber-200' },
          { type: 'wash', label: 'Lavages', icon: '🚿', color: 'bg-cyan-50 border-cyan-200' },
          { type: 'other_expense', label: 'Dépenses', icon: '💸', color: 'bg-rose-50 border-rose-200' },
        ].map(s => (
          <div key={s.type} className={`rounded-xl border p-3 ${s.color}`}>
            <div className="text-2xl">{s.icon}</div>
            <div className="text-xl font-black mt-1">{entries.filter(e => e.type === s.type).length}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {filtered.length} opération{filtered.length !== 1 ? 's' : ''}
            {filter !== 'ALL' && ` — ${typeLabel[filter]}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Aucune activité enregistrée.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Date / Heure</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Véhicule</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Auteur</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-4 py-3 rounded-tr-lg">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg">{entry.icon}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{entry.vehicle || '—'}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{entry.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.author || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {entry.amount != null ? `${Number(entry.amount).toLocaleString('fr-FR')} FCFA` : '—'}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(entry.status)}</td>
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
