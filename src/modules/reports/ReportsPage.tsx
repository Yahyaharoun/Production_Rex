import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  FileDown,
  TrendingUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Save,
  AlertTriangle,
  CheckCircle,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY_PROD = 'rex-productions';
const STORAGE_KEY_REPORTS = 'rex-reports-comments';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');

const formatDate = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const addMonths = (d: Date, n: number) => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
};

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ─── Mini DateRangePicker ─────────────────────────────────────────────────────
function DateRangePicker({
  value,
  onChange,
}: {
  value: { start: Date | null; end: Date | null };
  onChange: (v: { start: Date | null; end: Date | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [hovered, setHovered] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const monthA = viewDate;
  const monthB = addMonths(viewDate, 1);

  const getDays = (year: number, month: number) => {
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { first: first === 0 ? 6 : first - 1, days };
  };

  const handleDayClick = (d: Date) => {
    if (!value.start || (value.start && value.end)) {
      onChange({ start: d, end: null });
    } else {
      if (d < value.start) onChange({ start: d, end: value.start });
      else onChange({ start: value.start, end: d });
      setOpen(false);
    }
  };

  const inRange = (d: Date) => {
    if (!value.start) return false;
    const endRef = value.end || hovered;
    if (!endRef) return false;
    const lo = value.start < endRef ? value.start : endRef;
    const hi = value.start < endRef ? endRef : value.start;
    return d > lo && d < hi;
  };

  const isStart = (d: Date) =>
    value.start && isoDate(d) === isoDate(value.start);
  const isEnd = (d: Date) =>
    value.end && isoDate(d) === isoDate(value.end);

  const label =
    value.start && value.end
      ? `${formatDate(value.start)} → ${formatDate(value.end)}`
      : value.start
        ? `${formatDate(value.start)} → ...`
        : 'Sélectionner une période';

  const renderMonth = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const { first, days } = getDays(year, month);

    return (
      <div className="select-none min-w-[200px]">
        <p className="text-center text-white font-semibold mb-3 text-sm">
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
            <span key={d} className="text-xs text-muted-foreground py-1">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array(first).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = new Date(year, month, i + 1);
            const start = isStart(d);
            const end = isEnd(d);
            const range = inRange(d);
            return (
              <button
                key={i}
                onClick={() => handleDayClick(d)}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  text-xs py-1.5 rounded transition-colors
                  ${start || end ? 'bg-accent text-white font-bold' : ''}
                  ${range ? 'bg-accent/20 text-accent' : ''}
                  ${!start && !end && !range ? 'text-white hover:bg-accent/30' : ''}
                `}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-white text-sm hover:border-accent transition-colors"
      >
        <CalendarDays className="h-4 w-4 text-accent" />
        {label}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 p-4 bg-card border border-border rounded-xl shadow-2xl right-0 sm:right-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setViewDate(addMonths(viewDate, -1))} className="text-muted-foreground hover:text-white p-1">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="text-muted-foreground hover:text-white p-1">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            {renderMonth(monthA)}
            <div className="hidden sm:block w-px bg-border" />
            {renderMonth(monthB)}
          </div>
          {(value.start || value.end) && (
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{label}</span>
              <button
                onClick={() => onChange({ start: null, end: null })}
                className="text-xs text-destructive hover:opacity-80"
              >
                Effacer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mini Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-48 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1 group relative">
          <span className="absolute -top-6 text-[10px] text-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {d.value.toLocaleString()}
          </span>
          <div className="w-full bg-secondary/50 rounded-t relative h-32">
            <div
              className="absolute bottom-0 w-full bg-accent rounded-t transition-all duration-700 hover:bg-accent/80 cursor-pointer"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color = 'text-accent' }: any) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm hover:border-accent/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('400', '400/10')}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> {sub}
      </p>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [ceoComment, setCeoComment] = useState('');
  const [commentSaved, setCommentSaved] = useState(false);
  const [productions, setProductions] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY_PROD);
    if (raw) { try { setProductions(JSON.parse(raw)); } catch { } }
    const comments = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (comments) { try { setCeoComment(JSON.parse(comments).ceo || ''); } catch { } }
  }, []);

  // Filtrage par plage de dates
  const filtered = productions.filter((p) => {
    if (!dateRange.start || !dateRange.end) return true;
    const d = new Date(p.date);
    const s = new Date(dateRange.start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(dateRange.end);
    e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculs KPI
  const totalRevenue = filtered.reduce((s, p) => s + Number(p.revenue || 0), 0);
  const totalExpenses = filtered.reduce((s, p) => {
    return s + Number(p.fuel || 0) + Number(p.toll || 0) + Number(p.washing || 0) + Number(p.others || 0);
  }, 0);
  const totalNet = filtered.reduce((s, p) => s + Number(p.netToDeposit || 0), 0);
  const avgOccupancy = filtered.length
    ? Math.round(filtered.reduce((s, p) => s + (Number(p.passengersAtDeparture) / Number(p.totalSeats)) * 100, 0) / filtered.length)
    : 0;

  // Données graphe : s'adapte au mois sélectionné ou affiche les 6 derniers mois
  const getGraphData = () => {
    if (dateRange.start && dateRange.end) {
      // Si la plage est < 40 jours, on montre les jours
      const diffDays = Math.ceil(Math.abs(dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 45) {
        const days = [];
        for (let d = new Date(dateRange.start); d <= dateRange.end; d.setDate(d.getDate() + 1)) {
          const dayStr = isoDate(d);
          const val = filtered
            .filter(p => isoDate(new Date(p.date)) === dayStr)
            .reduce((s, p) => s + Number(p.netToDeposit || 0), 0);
          days.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: val });
        }
        return days;
      }
    }
    
    // Sinon on montre les 6 derniers mois
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const y = d.getFullYear();
      const m = d.getMonth();
      const net = productions
        .filter((p) => {
          const pd = new Date(p.date);
          return pd.getFullYear() === y && pd.getMonth() === m;
        })
        .reduce((s, p) => s + Number(p.netToDeposit || 0), 0);
      return { label: MONTH_NAMES[m].slice(0, 3), value: net };
    });
  };

  const graphData = getGraphData();

  // Anomalies (Audit complet)
  const anomalies = filtered.filter((p) => {
    const occ = Number(p.passengersAtDeparture) / Number(p.totalSeats);
    const expRatio = (Number(p.fuel) + Number(p.toll) + Number(p.washing) + Number(p.others)) / Number(p.revenue);
    return occ < 0.4 || Number(p.netToDeposit) < 5000 || expRatio > 0.6;
  });

  const saveCeoComment = () => {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify({ ceo: ceoComment }));
    setCommentSaved(true);
    toast.success('Commentaire sauvegardé');
    setTimeout(() => setCommentSaved(false), 3000);
  };

  // Export PDF (impression premium)
  const downloadPDF = (type: string) => {
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rex - Rapport ${type}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1f2937; padding: 40px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-box { display: flex; align-items: center; gap: 15px; }
          .logo { width: 60px; height: 60px; background: #10b981; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 800; }
          .brand-name { font-size: 28px; font-weight: 800; color: #064e3b; margin: 0; }
          .report-title { font-size: 18px; color: #059669; font-weight: 600; margin-top: 5px; }
          .meta { text-align: right; font-size: 12px; color: #6b7280; }
          
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; text-align: center; }
          .kpi-label { font-size: 11px; font-weight: 600; color: #065f46; text-transform: uppercase; margin-bottom: 5px; }
          .kpi-value { font-size: 20px; font-weight: 800; color: #047857; }
          
          h2 { font-size: 16px; font-weight: 800; color: #064e3b; border-left: 4px solid #10b981; padding-left: 10px; margin: 25px 0 15px 0; text-transform: uppercase; }
          
          table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; font-size: 12px; }
          th { background: #065f46; color: white; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .net-val { font-weight: 800; color: #059669; }
          
          .anomaly-list { display: flex; flex-direction: column; gap: 8px; }
          .anomaly { background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 15px; font-size: 12px; color: #991b1b; display: flex; align-items: center; gap: 10px; }
          .anomaly b { color: #be123c; }
          
          .ceo-section { margin-top: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
          .ceo-title { font-weight: 800; color: #1e293b; font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
          .ceo-text { font-style: italic; color: #475569; font-size: 13px; border-left: 3px solid #10b981; padding-left: 15px; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <div class="logo">R</div>
            <div>
              <h1 class="brand-name">REX</h1>
              <div class="report-title">RAPPORT ${type.toUpperCase()}</div>
            </div>
          </div>
          <div class="meta">
            <div>Généré le <b>${new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}</b></div>
            ${dateRange.start ? `<div>Période : <b>${formatDate(dateRange.start)} — ${dateRange.end ? formatDate(dateRange.end) : '...'}</b></div>` : ''}
            <div>Agences : <b>Toutes Agences</b></div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Recette Brut</div><div class="kpi-value">${totalRevenue.toLocaleString()} XAF</div></div>
          <div class="kpi"><div class="kpi-label">Dépenses</div><div class="kpi-value">${totalExpenses.toLocaleString()} XAF</div></div>
          <div class="kpi"><div class="kpi-label">Net à Verser</div><div class="kpi-value">${totalNet.toLocaleString()} XAF</div></div>
          <div class="kpi"><div class="kpi-label">Occupation Moy.</div><div class="kpi-value">${avgOccupancy}%</div></div>
        </div>

        <h2>Détail des Activités</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Véhicule</th>
              <th>Chauffeur</th>
              <th>Occ.</th>
              <th>Recette</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((p) => `
              <tr>
                <td>${new Date(p.date).toLocaleDateString('fr-FR')}</td>
                <td><b>${p.immatriculation}</b></td>
                <td>${p.driverName}</td>
                <td>${p.passengersAtDeparture}/${p.totalSeats}</td>
                <td>${Number(p.revenue).toLocaleString()}</td>
                <td class="net-val">${Number(p.netToDeposit).toLocaleString()}</td>
              </tr>
            `).join('') || '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:40px">Aucune donnée trouvée sur cette période.</td></tr>'}
          </tbody>
        </table>

        ${anomalies.length > 0 ? `
          <h2>Audit & Anomalies Detected</h2>
          <div class="anomaly-list">
            ${anomalies.map((p) => `
              <div class="anomaly">
                <span>⚠</span>
                <div>
                  <b>${p.immatriculation} (${p.driverName})</b> : 
                  ${Number(p.netToDeposit) < 5000 ? `Performance critique (${Number(p.netToDeposit).toLocaleString()} XAF)` : `Faible taux d'occupation (${Math.round((Number(p.passengersAtDeparture) / Number(p.totalSeats)) * 100)}%)`}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="ceo-section">
          <div class="ceo-title">📝 OBSERVATIONS & COMMENTAIRE DU PDG</div>
          <div class="ceo-text">${ceoComment || "Aucune observation particulière pour ce rapport."}</div>
        </div>

        <div class="footer">
          Système de Gestion Rex — Document Confidentiel — © ${new Date().getFullYear()}
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(content);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 700);
    }
    toast.success(`Rapport ${type} prêt à l'impression`);
  };

  const reportTypes = [
    { label: 'Rapport Journalier', sub: "Audit des départs du jour", type: 'Journalier', icon: Printer },
    { label: 'Rapport Hebdomadaire', sub: 'Analyse de performance hebdo', type: 'Hebdomadaire', icon: TrendingUp },
    { label: 'Rapport Mensuel', sub: 'Bilan comptable mensuel', type: 'Mensuel', icon: BarChart2 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Reports Center</h2>
          <p className="text-muted-foreground mt-1">Intelligence d'affaires et audit de performance Rex.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button 
            variant="outline" 
            className="border-border text-white hover:bg-secondary"
            onClick={() => { setDateRange({ start: null, end: null }); }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Chiffre d'Affaires" value={`${totalRevenue.toLocaleString()} XAF`} icon={TrendingUp} />
        <KpiCard label="Charges Opérationnelles" value={`${totalExpenses.toLocaleString()} XAF`} icon={BarChart2} color="text-destructive" />
        <KpiCard label="Net à Verser Total" value={`${totalNet.toLocaleString()} XAF`} icon={CheckCircle} color="text-green-400" />
        <KpiCard label="Productivité Moy." value={`${avgOccupancy}%`} icon={BarChart2} color={avgOccupancy >= 75 ? 'text-green-400' : 'text-yellow-400'} sub={`${filtered.length} missions auditées`} />
      </div>

      {/* Graphes & Rapports */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Performance {dateRange.start ? 'sur la période' : 'Mensuelle'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Evolution du revenu net (XAF)</p>
            </div>
            {dateRange.start && <span className="text-[10px] bg-accent/10 text-accent px-2 py-1 rounded font-bold uppercase">Dynamic View</span>}
          </CardHeader>
          <CardContent className="pt-6">
            {graphData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border">
                <p>Aucune donnée disponible pour cette période.</p>
              </div>
            ) : (
              <BarChart data={graphData} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest px-1">Exporter Reports</h3>
          {reportTypes.map(({ label, sub, type, icon: Icon }) => (
            <Card key={type} className="bg-card border-border hover:border-accent/40 transition-all group cursor-pointer" onClick={() => downloadPDF(type)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent transition-colors">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
                <FileDown className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Audit / Anomalies */}
        <Card className={`bg-card border-border ${anomalies.length > 0 ? 'ring-1 ring-yellow-500/20' : ''}`}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${anomalies.length > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`} />
              Audit de Conformité
            </CardTitle>
            <p className="text-xs text-muted-foreground">Détection automatique des performances critiques.</p>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border">
            {anomalies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                <CheckCircle className="h-10 w-10 mb-2 text-green-400" />
                <p className="text-sm">Toutes les missions sont conformes.</p>
              </div>
            ) : (
              anomalies.map((p, i) => (
                <div key={i} className="flex items-start gap-4 bg-secondary/20 border border-border rounded-xl p-4 hover:bg-secondary/30 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{p.immatriculation} — {p.driverName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Number(p.netToDeposit) < 5000 
                        ? `Alerte Revenu : ${Number(p.netToDeposit).toLocaleString()} XAF (trop faible)` 
                        : `Alerte Occupation : ${Math.round((Number(p.passengersAtDeparture) / Number(p.totalSeats)) * 100)}% (sous le seuil)`}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-border px-2 py-1 rounded">Audit Ref. {i+1}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Commentaire PDG */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white text-base">Directives de Direction</CardTitle>
            <p className="text-xs text-muted-foreground">Ce texte sera apposé sur les rapports PDF officiels.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={ceoComment}
              onChange={(e) => { setCeoComment(e.target.value); setCommentSaved(false); }}
              placeholder="Saisissez vos observations ou instructions ici..."
              rows={6}
              className="w-full rounded-xl bg-secondary/30 border border-border text-white placeholder:text-muted-foreground px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {commentSaved && (
                  <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold animate-in fade-in slide-in-from-left-2">
                    <CheckCircle className="h-4 w-4" /> Sauvegardé
                  </span>
                )}
              </div>
              <Button
                onClick={saveCeoComment}
                className="bg-accent hover:bg-accent/90 text-white font-bold px-8 shadow-lg shadow-accent/20"
              >
                <Save className="mr-2 h-4 w-4" /> Publier
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
