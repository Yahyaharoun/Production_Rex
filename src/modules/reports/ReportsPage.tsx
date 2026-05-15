import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { FileText, Download, Filter, Search, Loader2, Calendar, FileDown, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/skeleton';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../../lib/utils';

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
}

type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>('CUSTOM');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase.from('productions').select('*').order('date', { ascending: false });
      
      const now = new Date();
      let start = dateStart;
      let end = dateEnd;

      if (period !== 'CUSTOM') {
        const d = new Date();
        if (period === 'DAILY') {
          start = d.toISOString().split('T')[0];
          end = start;
        } else if (period === 'WEEKLY') {
          d.setDate(d.getDate() - 7);
          start = d.toISOString().split('T')[0];
          end = new Date().toISOString().split('T')[0];
        } else if (period === 'MONTHLY') {
          start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
          end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        } else if (period === 'YEARLY') {
          start = new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
          end = new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0];
        }
      }

      if (start) query = query.gte('date', start);
      if (end) query = query.lte('date', end);
      
      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [period]);

  const totalRevenue = records.reduce((sum, r) => sum + Number(r.revenue), 0);
  const totalExpenses = records.reduce((sum, r) => sum + (Number(r.expense_fuel) + Number(r.expense_toll) + Number(r.expense_washing) + Number(r.expense_others)), 0);
  const totalNet = records.reduce((sum, r) => sum + Number(r.net_to_deposit), 0);

  const filteredRecords = records.filter(r => 
    r.immatriculation.toLowerCase().includes(search.toLowerCase()) ||
    r.driver_name.toLowerCase().includes(search.toLowerCase())
  );

  const exportPDF = () => {
    if (filteredRecords.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      const doc = new jsPDF();
      const periodLabel = { DAILY: 'Journalier', WEEKLY: 'Hebdomadaire', MONTHLY: 'Mensuel', YEARLY: 'Annuel', CUSTOM: 'Personnalisé' }[period];
      
      // Header
      doc.setFillColor(16, 185, 129); // Primary color
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('REX TRANSPORT - RAPPORT', 15, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${periodLabel} | Généré le: ${new Date().toLocaleString('fr-FR')}`, 15, 33);
      
      // Totals Box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(15, 50, 180, 25, 3, 3, 'F');
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.text('RECETTE TOTALE', 25, 60);
      doc.text('TOTAL CHARGES', 85, 60);
      doc.text('NET À VERSER', 145, 60);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalRevenue.toLocaleString()} XAF`, 25, 68);
      doc.setTextColor(220, 38, 38);
      doc.text(`${totalExpenses.toLocaleString()} XAF`, 85, 68);
      doc.setTextColor(16, 185, 129);
      doc.text(`${totalNet.toLocaleString()} XAF`, 145, 68);

      // Table
      const tableColumn = ["Date", "Véhicule", "Chauffeur", "Recette", "Net", "Statut"];
      const tableRows = filteredRecords.map(r => [
        new Date(r.date).toLocaleDateString('fr-FR'),
        r.immatriculation,
        r.driver_name,
        Number(r.revenue).toLocaleString(),
        Number(r.net_to_deposit).toLocaleString(),
        r.status
      ]);

      autoTable(doc, {
        startY: 85,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' }
        }
      });

      doc.save(`Rex_Rapport_${periodLabel}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport PDF généré');
    } catch (err) {
      toast.error('Erreur PDF');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Analyse & Rapports</h2>
          <p className="text-muted-foreground mt-1 font-bold">Consultez vos performances financières par période.</p>
        </div>
        <Button onClick={exportPDF} className="bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 rounded-[2rem] h-16 px-10 font-black text-lg transition-all hover:scale-105">
          <FileDown className="mr-3 h-6 w-6" />Exporter le Rapport
        </Button>
      </div>

      {/* Sélecteur de Période Premium */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {([
          { id: 'DAILY', label: 'Journalier', icon: Calendar },
          { id: 'WEEKLY', label: 'Hebdomadaire', icon: TrendingUp },
          { id: 'MONTHLY', label: 'Mensuel', icon: BarChart3 },
          { id: 'YEARLY', label: 'Annuel', icon: PieChart },
          { id: 'CUSTOM', label: 'Personnalisé', icon: Filter },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setPeriod(id)}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all shadow-sm",
              period === id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-transparent bg-white hover:border-border"
            )}>
            <Icon className={cn("h-8 w-8 mb-3", period === id ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-xs font-black uppercase tracking-widest", period === id ? "text-primary" : "text-muted-foreground")}>{label}</span>
          </button>
        ))}
      </div>

      {period === 'CUSTOM' && (
        <Card className="bg-white border-border shadow-xl rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              <div className="space-y-2 flex-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date de début</Label>
                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="bg-secondary/20 border-border rounded-xl h-12 font-bold" />
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date de fin</Label>
                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="bg-secondary/20 border-border rounded-xl h-12 font-bold" />
              </div>
              <Button onClick={fetchReports} className="bg-foreground text-white h-12 px-10 rounded-xl font-black shadow-lg">Calculer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé des Totaux */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <Card className="bg-white border-border shadow-lg rounded-[2.5rem] p-8 border-l-[12px] border-l-primary">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Recette Brut Totale</p>
          <p className="text-4xl font-black text-foreground">{totalRevenue.toLocaleString()} <span className="text-sm font-bold text-muted-foreground">XAF</span></p>
        </Card>
        <Card className="bg-white border-border shadow-lg rounded-[2.5rem] p-8 border-l-[12px] border-l-destructive">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Total Dépenses</p>
          <p className="text-4xl font-black text-destructive">{totalExpenses.toLocaleString()} <span className="text-sm font-bold text-muted-foreground">XAF</span></p>
        </Card>
        <Card className="bg-primary text-white shadow-2xl rounded-[2.5rem] p-8">
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Net Total à Verser</p>
          <p className="text-4xl font-black">{totalNet.toLocaleString()} <span className="text-sm font-bold text-white/60">XAF</span></p>
        </Card>
      </div>

      <Card className="bg-white border-border shadow-sm rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-border/50 bg-secondary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <CardTitle className="text-xl font-black">Historique des données</CardTitle>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} 
              className="pl-12 bg-white border-border rounded-2xl h-12 shadow-sm font-bold" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="p-12 space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-secondary/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Véhicule</th>
                    <th className="px-8 py-5">Chauffeur</th>
                    <th className="px-8 py-5 text-right">Recette</th>
                    <th className="px-8 py-5 text-right">Net</th>
                    <th className="px-8 py-5 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-8 py-6 font-bold text-muted-foreground">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-8 py-6 font-black text-foreground">{r.immatriculation}</td>
                      <td className="px-8 py-6 font-bold text-foreground">{r.driver_name}</td>
                      <td className="px-8 py-6 text-right font-bold">{Number(r.revenue).toLocaleString()}</td>
                      <td className="px-8 py-6 text-right font-black text-primary">{Number(r.net_to_deposit).toLocaleString()}</td>
                      <td className="px-8 py-6 text-center">
                        <span className="bg-secondary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-muted-foreground font-black italic">
                        Aucune donnée disponible pour cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
