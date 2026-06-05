import { useState, useEffect, useCallback, useRef } from 'react';
import { PrintableReport } from './PrintableReport';
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
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';
import { Skeleton } from '../../components/ui/skeleton';
import * as XLSX from 'xlsx';

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
  const [fuelRecords, setFuelRecords] = useState<any[]>([]);
  const [washRecords, setWashRecords] = useState<any[]>([]);
  const [otherRecords, setOtherRecords] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>('DAILY');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [search, setSearch] = useState('');
  const [agenceFilter, setAgenceFilter] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

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

      let qFuel = supabase.from('fuel_expenses').select('*');
      let qWash = supabase.from('washes').select('*');
      let qOther = supabase.from('other_expenses').select('*');

      if (!isAdmin && !isChef && user?.lineIds && user.lineIds.length > 0) {
        query = query.in('agence_id', user.lineIds);
        qFuel = qFuel.in('agence_id', user.lineIds);
        qWash = qWash.in('agence_id', user.lineIds);
        qOther = qOther.in('agence_id', user.lineIds);
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const applyDateFilter = (q: any) => {
        if (period === 'DAILY') {
          return q.gte('date', today).lte('date', today);
        } else if (period === 'WEEKLY') {
          const d = new Date(); d.setDate(d.getDate() - 7);
          return q.gte('date', d.toISOString().split('T')[0]).lte('date', today);
        } else if (period === 'MONTHLY') {
          const d = new Date(); d.setMonth(d.getMonth() - 1);
          return q.gte('date', d.toISOString().split('T')[0]).lte('date', today);
        } else if (period === 'YEARLY') {
          const d = new Date(); d.setFullYear(d.getFullYear() - 1);
          return q.gte('date', d.toISOString().split('T')[0]).lte('date', today);
        } else if (period === 'CUSTOM') {
          let req = q;
          if (dateStart) req = req.gte('date', dateStart);
          if (dateEnd) req = req.lte('date', dateEnd);
          return req;
        }
        return q;
      };

      query = applyDateFilter(query);
      qFuel = applyDateFilter(qFuel);
      qWash = applyDateFilter(qWash);
      qOther = applyDateFilter(qOther);

      const [resProd, resFuel, resWash, resOther] = await Promise.all([
        query, qFuel, qWash, qOther
      ]);

      if (resProd.error) throw resProd.error;
      
      // Injecter le type de production déduit de l'immatriculation
      const dataWithType = (resProd.data || []).map((r: any) => ({
        ...r,
        production_type: r.immatriculation?.includes('(VIP)') ? 'VIP' : 'CLASSIQUE'
      }));
      
      setRecords(dataWithType);
      setFuelRecords(resFuel.data || []);
      setWashRecords(resWash.data || []);
      setOtherRecords((resOther.data || []).filter((o: any) => o.status !== 'REJECTED'));
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

  const statsTotal = {
    count: filteredRecords.length,
    revenue: filteredRecords.reduce((s, r) => s + Number(r.revenue || 0), 0),
    expenses: filteredRecords.reduce(
      (s, r) => s + Number(r.expense_fuel || 0), 0
    ),
    net: filteredRecords.reduce((s, r) => s + Number(r.net_to_deposit || 0), 0),
  };

  // --- Stats par agence ---
  const statsByAgence = (() => {
    const map: Record<string, { 
      name: string; 
      classiqueCount: number; 
      vipCount: number; 
      totalCount: number;
      revenue: number;
      fuelExpense: number;
      washExpense: number;
      otherExpense: number;
      totalExpense: number;
      net: number;
    }> = {};

    const getOrCreate = (key: string) => {
      if (!map[key]) {
        map[key] = { 
          name: key, classiqueCount: 0, vipCount: 0, totalCount: 0, 
          revenue: 0, fuelExpense: 0, washExpense: 0, otherExpense: 0, totalExpense: 0, net: 0 
        };
      }
      return map[key];
    };

    const getAgenceName = (id: string) => agencies.find(a => a.id === id)?.name;

    // 1. Productions
    filteredRecords.forEach((r) => {
      const key = r.ligne || getAgenceName(r.agence_id || '') || r.agence_id || 'Inconnue';
      const stats = getOrCreate(key);
      
      stats.totalCount += 1;
      if (!r.production_type || r.production_type === 'CLASSIQUE') {
        stats.classiqueCount += 1;
      } else {
        stats.vipCount += 1;
      }

      stats.revenue += Number(r.revenue || 0);
      stats.fuelExpense += Number(r.expense_fuel || 0);
    });

    // 2. Fuel (external)
    fuelRecords.forEach(r => {
      const key = r.ligne || r.line_name || getAgenceName(r.agence_id || '') || r.agence_id || 'Inconnue';
      const stats = getOrCreate(key);
      stats.fuelExpense += Number(r.amount || 0);
    });

    // 3. Washes (external)
    washRecords.forEach(r => {
      const key = r.ligne || getAgenceName(r.agence_id || '') || r.agence_id || 'Inconnue';
      const stats = getOrCreate(key);
      stats.washExpense += Number(r.amount || 0);
    });

    // 4. Other Expenses (external)
    otherRecords.forEach(r => {
      const key = r.ligne || getAgenceName(r.agence_id || '') || r.agence_id || 'Inconnue';
      const stats = getOrCreate(key);
      stats.otherExpense += Number(r.amount || 0);
    });

    // 5. Final calculation
    Object.values(map).forEach(stats => {
      stats.totalExpense = stats.fuelExpense + stats.washExpense + stats.otherExpense;
      stats.net = stats.revenue - stats.totalExpense;
    });

    return Object.values(map).sort((a, b) => b.net - a.net);
  })();

  const globalFuel = statsByAgence.reduce((s, a) => s + a.fuelExpense, 0);
  const globalWash = statsByAgence.reduce((s, a) => s + a.washExpense, 0);
  const globalOther = statsByAgence.reduce((s, a) => s + a.otherExpense, 0);
  const globalExpense = statsByAgence.reduce((s, a) => s + a.totalExpense, 0);
  const globalRevenue = statsByAgence.reduce((s, a) => s + a.revenue, 0);
  const globalNet = statsByAgence.reduce((s, a) => s + a.net, 0);

  //  Export PDF haute fidélité (Capture React -> PDF) 
  const exportPDF = async () => {
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = reportRef.current;
      if (!element) throw new Error('Composant introuvable');

      toast.info('Génération du rapport PDF en cours...');
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Si le rapport est plus long qu'une page A4, on gère l'étirement ou on ajoute des pages,
      // Mais vu le design (1200px width par ~1600px height), ça tient parfaitement sur une page A4 portrait.
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      pdf.save(
        `rapport-rex-${period.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success('Rapport PDF exporté avec succès !');
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err as any).message : 'Erreur inconnue';
      toast.error('Erreur export PDF', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Export Excel
  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Feuille 1: Liste des productions
      const dataToExport = filteredRecords.map(r => ({
        Date: new Date(r.date).toLocaleDateString('fr-FR'),
        'Type': r.production_type || 'CLASSIQUE',
        'Immatriculation': r.immatriculation,
        'Chauffeur': r.driver_name,
        'Agence/Ligne': r.ligne || r.agence_id,
        'Recette Brut': r.revenue,
        'Dépense Carburant': r.expense_fuel,
        'Dépense Péage': r.expense_toll,
        'Dépense Lavage': r.expense_washing,
        'Autres Dépenses': r.expense_others,
        'Net à Verser': r.net_to_deposit || (r.revenue - (r.expense_fuel + r.expense_toll + r.expense_washing + r.expense_others)),
        'Agent Production': r.caissiere_name
      }));

      const wsProd = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(wb, wsProd, 'Productions');

      // Feuille 2: Résumé par agence
      const agenceData = statsByAgence.map(a => ({
        'Agence': a.name,
        'Voyages VIP': a.vipCount,
        'Voyages Classique': a.classiqueCount,
        'Total Voyages': a.totalCount,
        'Dépense Carburant': a.fuelExpense,
        'Dépense Lavage': a.washExpense,
        'Autres Dépenses': a.otherExpense,
        'Total Dépenses': a.totalExpense,
        'Recette Brute': a.revenue,
        'Net à Verser': a.net
      }));
      const wsAgence = XLSX.utils.json_to_sheet(agenceData);
      XLSX.utils.book_append_sheet(wb, wsAgence, 'Résumé Agences');

      // Feuille 3: Statistiques globales
      const globalData = [
        { 'Métrique': 'Recette Brute Totale', 'Valeur': globalRevenue },
        { 'Métrique': 'Total Dépenses', 'Valeur': globalExpense },
        { 'Métrique': 'Net à Verser Total', 'Valeur': globalNet }
      ];
      const wsGlobal = XLSX.utils.json_to_sheet(globalData);
      XLSX.utils.book_append_sheet(wb, wsGlobal, 'Résumé Global');

      XLSX.writeFile(wb, `rapport-rex-${period.toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Rapport Excel exporté avec succès !');
    } catch (err: unknown) {
       toast.error('Erreur lors de l\'export Excel');
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
          <Button variant="secondary" size="sm" onClick={exportExcel} disabled={loading || filteredRecords.length === 0} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
            <FileDown className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button size="sm" onClick={exportPDF} disabled={loading || filteredRecords.length === 0}>
            <FileDown className="h-4 w-4 mr-2" />
            PDF
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

      {/*  Statistiques Globales  */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recette Brute Totale */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Recette Brute Totale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-black text-foreground">{fmt(globalRevenue)}</div>
              <div className="text-xs text-muted-foreground">tickets vendus</div>
            </CardContent>
          </Card>

          {/* Dépenses Totales */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Dépenses Totales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-black text-red-600">{fmt(globalExpense)}</div>
              <div className="text-xs text-muted-foreground text-red-600/70">carburant + lavage + autres</div>
            </CardContent>
          </Card>

          {/* Net à verser */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Net à verser Total
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-black text-emerald-600">{fmt(globalNet)}</div>
              <div className="text-xs text-muted-foreground text-emerald-600/70">recette - dépenses</div>
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
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Voyages (V/C)</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Total Voy.</th>
                    <th className="text-right py-2 px-3 font-semibold text-destructive">Carburant</th>
                    <th className="text-right py-2 px-3 font-semibold text-destructive">Lavage</th>
                    <th className="text-right py-2 px-3 font-semibold text-destructive">Tot. Dépenses</th>
                    <th className="text-right py-2 px-3 font-semibold text-primary">Recette Brute</th>
                    <th className="text-right py-2 px-3 font-semibold text-emerald-600">Net à verser</th>
                  </tr>
                </thead>
                <tbody>
                  {statsByAgence.map((a, i) => (
                    <tr key={a.name} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-muted/20' : '')}>
                      <td className="py-2.5 px-3 font-medium">{a.name}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground whitespace-nowrap">
                        <span className="text-amber-600">{a.vipCount}V</span> / <span className="text-primary">{a.classiqueCount}C</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground font-semibold">{a.totalCount}</td>
                      <td className="py-2.5 px-3 text-right text-destructive">{fmtCompact(a.fuelExpense)}</td>
                      <td className="py-2.5 px-3 text-right text-destructive">{fmtCompact(a.washExpense)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-destructive">{fmtCompact(a.totalExpense)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-primary">
                        {fmtCompact(a.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600">
                        {fmtCompact(a.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/20 bg-primary/5">
                    <td className="py-2.5 px-3 font-bold">TOTAL GLOBAL</td>
                    <td className="py-2.5 px-3 text-right font-bold text-muted-foreground">
                      {statsByAgence.reduce((s, a) => s + a.vipCount, 0)}V / {statsByAgence.reduce((s, a) => s + a.classiqueCount, 0)}C
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">{statsByAgence.reduce((s, a) => s + a.totalCount, 0)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-destructive">{fmtCompact(globalFuel)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-destructive">{fmtCompact(globalWash)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-destructive">{fmtCompact(globalExpense)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-primary">{fmtCompact(globalRevenue)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-600">{fmtCompact(globalNet)}</td>
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

      {/* Rendu invisible pour la capture PDF */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -1 }}>
        <PrintableReport
          ref={reportRef}
          periodLabel={PERIODS.find(p => p.key === period)?.label || ''}
          generatedBy={user?.name || user?.email || 'Admin'}
          statsByAgence={statsByAgence}
          globalRevenue={globalRevenue}
          globalExpense={globalExpense}
          globalNet={globalNet}
          globalFuel={globalFuel}
          globalWash={globalWash}
          globalOther={globalOther}
          totalTickets={statsByAgence.reduce((s, a) => s + a.totalCount, 0)}
          totalVoyages={statsByAgence.reduce((s, a) => s + a.totalCount, 0)}
          fuelRecords={fuelRecords}
          washRecords={washRecords}
          otherRecords={otherRecords}
        />
      </div>
    </div>
  );
}
