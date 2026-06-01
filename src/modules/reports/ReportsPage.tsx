import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  FileText, Filter, Search, FileDown,
  TrendingUp, RefreshCw, Star, Bus, MapPin, BarChart3, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

//  Types 
interface ProductionRecord {
  id: string;
  immatriculation: string;
  driver_name: string;
  revenue: number;
  expense_fuel: number;
  expense_toll: number;
  expense_washing: number;
  expense_others: number;
  net_to_deposit: number;
  date: string;
  status: string;
  ligne?: string;
  agence_id?: string;
  caissiere_name?: string;
  passengers_at_departure?: number;
  production_type?: 'CLASSIQUE' | 'VIP';
  price_per_ticket?: number;
}

interface Agency {
  id: string;
  name: string;
  city: string;
}

type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

//  Helpers 
const formatNumber = (n: number) => {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
const fmt = (n: number) => formatNumber(n) + ' FCFA';
const fmtCompact = (n: number) => formatNumber(n);

//  Composant principal 
export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const roleStr = String(user?.role || '').toUpperCase().trim();
  const isAdmin = roleStr === 'PDG' || roleStr === 'ADMIN';
  const isChef = roleStr === 'CHEF_AGENCE' || roleStr === 'CHEF D\'AGENCE' || roleStr === 'CHEF AGENCE';
  const canValidate = isAdmin || isChef;

  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>('DAILY');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [search, setSearch] = useState('');
  const [agenceFilter, setAgenceFilter] = useState('');

  //  Chargement des agences 
  useEffect(() => {
    supabase
      .from('agencies')
      .select('id, name, city')
      .order('name')
      .then(({ data }) => {
        if (data) setAgencies(data);
      });
  }, []);

  //  Chargement des rapports 
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('productions')
        .select('*')
        .eq('status', 'VALIDATED')
        .order('date', { ascending: false });

      if (!isAdmin && user?.agenceId) {
        query = query.eq('agence_id', user.agenceId as string);
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      if (period === 'DAILY') {
        query = query.gte('date', today).lte('date', today);
      } else if (period === 'WEEKLY') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte('date', d.toISOString().split('T')[0]).lte('date', today);
      } else if (period === 'MONTHLY') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        query = query.gte('date', d.toISOString().split('T')[0]).lte('date', today);
      } else if (period === 'YEARLY') {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        query = query.gte('date', d.toISOString().split('T')[0]).lte('date', today);
      } else if (period === 'CUSTOM') {
        if (dateStart) query = query.gte('date', dateStart);
        if (dateEnd) query = query.lte('date', dateEnd);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Injecter le type de production déduit de l'immatriculation
      const dataWithType = (data || []).map((r: any) => ({
        ...r,
        production_type: r.immatriculation?.includes('(VIP)') ? 'VIP' : 'CLASSIQUE'
      }));
      
      setRecords(dataWithType);
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err as any)?.message : 'Erreur inconnue';
      toast.error('Erreur de chargement', { description: msg });
    } finally {
      setLoading(false);
    }
  }, [period, dateStart, dateEnd]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDelete = async (id: string) => {
    if (!canValidate) return;
    if (!window.confirm('Voulez-vous vraiment supprimer cette production ?')) return;
    const { error } = await supabase.from('productions').delete().eq('id', id);
    if (!error) {
      toast.success('Production supprime');
      fetchReports();
    } else {
      toast.error('Erreur de suppression', { description: (error as any)?.message });
    }
  };

  //  Filtrage local 
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      !search ||
      r.immatriculation?.toLowerCase().includes(search.toLowerCase()) ||
      r.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.ligne?.toLowerCase().includes(search.toLowerCase()) ||
      r.caissiere_name?.toLowerCase().includes(search.toLowerCase());

    const matchAgence =
      !agenceFilter ||
      r.ligne?.toLowerCase() === agenceFilter.toLowerCase() ||
      r.agence_id === agenceFilter;

    return matchSearch && matchAgence;
  });

  //  Statistiques globales 
  const classiques = filteredRecords.filter(
    (r) => !r.production_type || r.production_type === 'CLASSIQUE'
  );
  const vips = filteredRecords.filter((r) => r.production_type === 'VIP');

  const calcStats = (recs: ProductionRecord[]) => ({
    count: recs.length,
    revenue: recs.reduce((s, r) => s + Number(r.revenue || 0), 0),
    expenses: recs.reduce(
      (s, r) =>
        s +
        Number(r.expense_fuel || 0) +
        Number(r.expense_toll || 0) +
        Number(r.expense_washing || 0) +
        Number(r.expense_others || 0),
      0
    ),
    net: recs.reduce((s, r) => {
      const net =
        Number(r.net_to_deposit) ||
        Number(r.revenue) -
          (Number(r.expense_fuel) +
            Number(r.expense_toll) +
            Number(r.expense_washing) +
            Number(r.expense_others));
      return s + net;
    }, 0),
    passengers: recs.reduce((s, r) => s + Number(r.passengers_at_departure || 0), 0),
  });

  const statsClassique = calcStats(classiques);
  const statsVIP = calcStats(vips);
  const statsTotal = calcStats(filteredRecords);

  // --- Stats par agence ---
  const statsByAgence = (() => {
    const map: Record<string, { name: string; classique: number; vip: number; net: number; count: number }> = {};
    filteredRecords.forEach((r) => {
      const key = r.ligne || r.agence_id || 'Inconnue';
      if (!map[key]) map[key] = { name: key, classique: 0, vip: 0, net: 0, count: 0 };
      const recNet =
        Number(r.net_to_deposit) ||
        Number(r.revenue) -
          (Number(r.expense_fuel) + Number(r.expense_toll) + Number(r.expense_washing) + Number(r.expense_others));
      map[key].net += recNet;
      map[key].count += 1;
      if (!r.production_type || r.production_type === 'CLASSIQUE') {
        map[key].classique += Number(r.revenue || 0);
      } else {
        map[key].vip += Number(r.revenue || 0);
      }
    });
    return Object.values(map).sort((a, b) => b.net - a.net);
  })();

  //  Export PDF (sans jspdf-autotable  utilise jsPDF natif) 
  const exportPDF = async () => {
    setLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape' });

      const periodLabels: Record<ReportPeriod, string> = {
        DAILY: "Aujourd'hui",
        WEEKLY: '7 derniers jours',
        MONTHLY: '30 derniers jours',
        YEARLY: 'Cette annee',
        CUSTOM: `${dateStart} - ${dateEnd}`,
      };

      // En-tête
      doc.setFillColor(6, 95, 70);
      doc.rect(0, 0, 297, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCTION REX - RAPPORT', 14, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode: ${periodLabels[period]}  |  Genere le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);
      doc.setTextColor(0, 0, 0);

      let y = 35;

      // Résumé global
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Resume Global', 14, y);
      y += 8;

      // Table manuelle
      const colWidths = [50, 40, 55, 55, 55];
      const headers = ['Type', 'Productions', 'Recettes', 'Depenses', 'Net a verser'];
      const rows = [
        ['CLASSIQUE', String(statsClassique.count), fmt(statsClassique.revenue), fmt(statsClassique.expenses), fmt(statsClassique.net)],
        ['VIP', String(statsVIP.count), fmt(statsVIP.revenue), fmt(statsVIP.expenses), fmt(statsVIP.net)],
        ['TOTAL', String(statsTotal.count), fmt(statsTotal.revenue), fmt(statsTotal.expenses), fmt(statsTotal.net)],
      ];

      // Draw table header
      doc.setFillColor(6, 95, 70);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      let x = 14;
      headers.forEach((h, i) => {
        doc.rect(x, y, colWidths[i], 8, 'F');
        doc.text(h, x + 2, y + 5.5);
        x += colWidths[i];
      });
      y += 8;

      // Draw table rows
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      rows.forEach((row, ri) => {
        if (ri % 2 === 0) {
          doc.setFillColor(240, 255, 248);
          x = 14;
          row.forEach((_cell, i) => {
            doc.rect(x, y, colWidths[i], 7, 'F');
            x += colWidths[i];
          });
        }
        x = 14;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 7);
          doc.text(cell, x + 2, y + 4.5);
          x += colWidths[i];
        });
        y += 7;
      });
      y += 10;

      // Stats par agence
      if (statsByAgence.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistiques par Agence', 14, y);
        y += 8;

        const agColW = [60, 35, 55, 55, 55];
        const agHeaders = ['Agence', 'Productions', 'Classique', 'VIP', 'Net Total'];
        doc.setFillColor(14, 165, 122);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        x = 14;
        agHeaders.forEach((h, i) => {
          doc.rect(x, y, agColW[i], 8, 'F');
          doc.text(h, x + 2, y + 5.5);
          x += agColW[i];
        });
        y += 8;

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        statsByAgence.forEach((a, ri) => {
          const row = [a.name, String(a.count), fmt(a.classique), a.vip > 0 ? fmt(a.vip) : '-', fmt(a.net)];
          if (ri % 2 === 0) {
            doc.setFillColor(240, 253, 250);
            x = 14;
            row.forEach((_c, i) => {
              doc.rect(x, y, agColW[i], 7, 'F');
              x += agColW[i];
            });
          }
          x = 14;
          row.forEach((cell, i) => {
            doc.rect(x, y, agColW[i], 7);
            doc.text(cell.substring(0, 20), x + 2, y + 4.5);
            x += agColW[i];
          });
          y += 7;
          if (y > 185) {
            doc.addPage();
            y = 15;
          }
        });
      }

      doc.save(`rapport-rex-${period.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport PDF exporte avec succes !');
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err as any)?.message : 'Erreur inconnue';
      toast.error('Erreur export PDF', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const PERIODS: { key: ReportPeriod; label: string; icon: string }[] = [
    { key: 'DAILY',   label: "Aujourd'hui", icon: '📅' },
    { key: 'WEEKLY',  label: '7 jours',     icon: '📊' },
    { key: 'MONTHLY', label: '30 jours',    icon: '📆' },
    { key: 'YEARLY',  label: 'Annuel',      icon: '📈' },
    { key: 'CUSTOM',  label: 'Personnalisé', icon: '🔧' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/*  En-tête  */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Rapports &amp; Comptabilite
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Analyse detaillee des productions  Classique &amp; VIP
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button size="sm" onClick={exportPDF} disabled={loading || filteredRecords.length === 0}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/*  Filtres de période  */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                  period === key
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted'
                )}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {period === 'CUSTOM' && (
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Du :</Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Au :</Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={fetchReports} className="h-8">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Appliquer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/*  Statistiques Classique vs VIP  */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CLASSIQUE */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                <Bus className="h-4 w-4" /> Productions CLASSIQUE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-black text-foreground">{statsClassique.count}</div>
              <div className="text-xs text-muted-foreground">voyages effectues</div>
              <div className="pt-2 space-y-1 border-t border-primary/10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recettes</span>
                  <span className="font-bold text-primary">{fmt(statsClassique.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net verse</span>
                  <span className="font-bold text-emerald-600">{fmt(statsClassique.net)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Passagers</span>
                  <span className="font-semibold">{statsClassique.passengers.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VIP */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400" /> Productions VIP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-black text-foreground">{statsVIP.count}</div>
              <div className="text-xs text-muted-foreground">voyages effectues</div>
              <div className="pt-2 space-y-1 border-t border-amber-100 dark:border-amber-900/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recettes</span>
                  <span className="font-bold text-amber-600">{fmt(statsVIP.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net verse</span>
                  <span className="font-bold text-emerald-600">{fmt(statsVIP.net)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Passagers</span>
                  <span className="font-semibold">{statsVIP.passengers.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TOTAL */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/20 dark:to-transparent border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> TOTAL GENERAL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-black text-foreground">{statsTotal.count}</div>
              <div className="text-xs text-muted-foreground">toutes productions</div>
              <div className="pt-2 space-y-1 border-t border-emerald-100 dark:border-emerald-900/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recettes totales</span>
                  <span className="font-bold text-emerald-600">{fmt(statsTotal.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Depenses totales</span>
                  <span className="font-bold text-destructive">- {fmt(statsTotal.expenses)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-emerald-200 dark:border-emerald-800 pt-1 mt-1">
                  <span>Net total verse</span>
                  <span className="text-emerald-600 text-base">{fmt(statsTotal.net)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/*  Stats par agence  */}
      {!loading && statsByAgence.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Statistiques par Agence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Agence</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Productions</th>
                    <th className="text-right py-2 px-3 font-semibold text-primary">Classique</th>
                    <th className="text-right py-2 px-3 font-semibold text-amber-600">VIP</th>
                    <th className="text-right py-2 px-3 font-semibold text-emerald-600">Net Total</th>
                  </tr>
                </thead>
                <tbody>
                  {statsByAgence.map((a, i) => (
                    <tr key={a.name} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-muted/20' : '')}>
                      <td className="py-2.5 px-3 font-medium">{a.name}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{a.count}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-primary">
                        {fmtCompact(a.classique)} FCFA
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-amber-600">
                        {a.vip > 0 ? `${fmtCompact(a.vip)} FCFA` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        {fmtCompact(a.net)} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/20 bg-primary/5">
                    <td className="py-2.5 px-3 font-bold">TOTAL</td>
                    <td className="py-2.5 px-3 text-right font-bold">{statsTotal.count}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-primary">
                      {fmtCompact(statsClassique.revenue)} FCFA
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                      {fmtCompact(statsVIP.revenue)} FCFA
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      {fmtCompact(statsTotal.net)} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/*  Filtres de recherche  */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher immatriculation, chauffeur, ligne..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <select
              value={agenceFilter}
              onChange={(e) => setAgenceFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[160px]"
            >
              <option value="">Toutes les agences</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredRecords.length} resultat{filteredRecords.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/*  Liste des productions  */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail des Productions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucune production trouvee</p>
              <p className="text-sm mt-1 opacity-70">
                Modifiez les filtres ou la periode selectionnee
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredRecords.map((r) => {
                const expenses =
                  Number(r.expense_fuel) +
                  Number(r.expense_toll) +
                  Number(r.expense_washing) +
                  Number(r.expense_others);
                const net = Number(r.net_to_deposit) || Number(r.revenue) - expenses;

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm font-mono">{r.immatriculation}</span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-semibold',
                            r.production_type === 'VIP'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          {r.production_type || 'CLASSIQUE'}
                        </span>
                        {r.ligne && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {r.ligne}
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            r.status === 'VALIDATED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-orange-100 text-orange-700'
                          )}
                        >
                          {r.status === 'VALIDATED' ? 'Valide' : 'Brouillon'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                        <span>{r.driver_name}</span>
                        <span>·</span>
                        <span>{r.passengers_at_departure || 0} pass.</span>
                        <span>·</span>
                        <span>{new Date(r.date).toLocaleDateString('fr-FR')}</span>
                        <span>·</span>
                        <span className="text-destructive">- {fmt(expenses)}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <div className="text-xs text-muted-foreground">Recette</div>
                      <div className="text-sm font-semibold">{fmt(Number(r.revenue))}</div>
                      <div className="text-xs text-muted-foreground">Net</div>
                      <div className={cn('font-black text-sm', net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                        {fmt(net)}
                      </div>
                    </div>

                    {canValidate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 ml-2 text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => handleDelete(r.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

