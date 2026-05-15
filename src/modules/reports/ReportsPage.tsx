import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { FileText, Filter, Search, Calendar, FileDown, TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';
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
  const [period, setPeriod] = useState<ReportPeriod>('DAILY');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase.from('productions').select('*').order('date', { ascending: false });
      
      const now = new Date();
      let start = '';
      let end = now.toISOString().split('T')[0];

      if (period === 'DAILY') {
        start = end;
      } else if (period === 'WEEKLY') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
      } else if (period === 'MONTHLY') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        start = d.toISOString().split('T')[0];
      } else if (period === 'YEARLY') {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        start = d.toISOString().split('T')[0];
      } else if (period === 'CUSTOM') {
        if (dateStart) query = query.gte('date', dateStart);
        if (dateEnd) query = query.lte('date', dateEnd);
      }

      if (period !== 'CUSTOM') {
        query = query.gte('date', start).lte('date', end);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      toast.error('Erreur de chargement', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [period]);

  const filteredRecords = records.filter(r => 
    r.immatriculation.toLowerCase().includes(search.toLowerCase()) ||
    r.driver_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filteredRecords.reduce((sum, r) => sum + Number(r.revenue), 0);
  const totalExpenses = filteredRecords.reduce((sum, r) => sum + (Number(r.expense_fuel) + Number(r.expense_toll) + Number(r.expense_washing) + Number(r.expense_others)), 0);
  const totalNet = filteredRecords.reduce((sum, r) => {
    const net = Number(r.net_to_deposit) || (Number(r.revenue) - (Number(r.expense_fuel) + Number(r.expense_toll) + Number(r.expense_washing) + Number(r.expense_others)));
    return sum + net;
  }, 0);

  const exportPDF = async () => {
    setLoading(true);
    console.log('[REX-PDF] Début de la génération du rapport. Période:', period);
    try {
      // Fetch fresh data for the selected period directly from Supabase
      let query = supabase.from('productions').select('*').order('date', { ascending: false });
      
      const now = new Date();
      let start = '';
      let end = now.toISOString().split('T')[0];

      if (period === 'DAILY') {
        start = end;
      } else if (period === 'WEEKLY') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
      } else if (period === 'MONTHLY') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        start = d.toISOString().split('T')[0];
      } else if (period === 'YEARLY') {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        start = d.toISOString().split('T')[0];
      } else if (period === 'CUSTOM') {
        if (dateStart) query = query.gte('date', dateStart);
        if (dateEnd) query = query.lte('date', dateEnd);
      }

      if (period !== 'CUSTOM') {
        query = query.gte('date', start).lte('date', end);
      }
      
      console.log('[REX-PDF] Exécution de la requête Supabase pour la période:', { start, end });
      const { data: exportData, error } = await query;
      
      if (error) {
        console.error('[REX-PDF] Erreur lors du fetch des données:', error);
        throw error;
      }

      if (!exportData || exportData.length === 0) {
        console.warn('[REX-PDF] Aucune donnée trouvée pour l\'export.');
        toast.error('Aucune donnée à exporter pour cette période');
        return;
      }

      console.log(`[REX-PDF] Données récupérées: ${exportData.length} enregistrements. Génération du PDF...`);
      const totalRev = exportData.reduce((sum, r) => sum + Number(r.revenue), 0);
      const totalExp = exportData.reduce((sum, r) => sum + (Number(r.expense_fuel) + Number(r.expense_toll) + Number(r.expense_washing) + Number(r.expense_others)), 0);
      const totalNetVal = exportData.reduce((sum, r) => sum + Number(r.net_to_deposit), 0);

      const doc = new jsPDF();
      
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.text('PRODUCTION REX ERP', 14, 22);
      
      doc.setFontSize(10);
      doc.text('RAPPORT DE PERFORMANCE - PERIODE : ' + period, 14, 32);
      doc.text('GENERE LE : ' + new Date().toLocaleDateString('fr-FR'), 14, 38);
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.text('SYNTHESE FINANCIERE', 14, 60);
      
      doc.setDrawColor(230, 230, 230);
      doc.line(14, 63, 196, 63);
      
      doc.setFontSize(11);
      doc.text('Nombre de voyages : ' + exportData.length, 14, 72);
      doc.text('Recette Brut Totale : ' + totalRev + ' XAF', 14, 80);
      
      doc.setTextColor(220, 38, 38);
      doc.text('Total des Charges : ' + totalExp + ' XAF', 14, 88);
      
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(12);
      doc.text('NET TOTAL A VERSER : ' + totalNetVal + ' XAF', 14, 98);

      const tableColumn = ["ID", "Date", "Vehicule", "Chauffeur", "Recette", "Charges", "Net"];
      const tableRows = exportData.map((r, i) => {
        const expenses = (Number(r.expense_fuel) + Number(r.expense_toll) + Number(r.expense_washing) + Number(r.expense_others));
        return [
          (exportData.length - i).toString(),
          r.date,
          r.immatriculation,
          r.driver_name,
          r.revenue.toString(),
          expenses.toString(),
          r.net_to_deposit.toString()
        ];
      });

      autoTable(doc, {
        startY: 110,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [245, 250, 245] }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} sur ${pageCount} - Système Production Rex - Document Confidentiel`, 105, 290, { align: 'center' });
      }

      console.log('[REX-PDF] Génération terminée avec succès.');
      doc.save(`Rex_Rapport_Officiel_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport PDF généré avec les données réelles de la base');
    } catch (err: any) {
      console.error('[REX-PDF] Erreur fatale lors de la génération PDF:', err);
      toast.error('Erreur lors de la génération du PDF', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Rapports Financiers</h2>
          <p className="text-muted-foreground mt-1 font-bold">Analyse des performances et exports comptables.</p>
        </div>
        <Button onClick={exportPDF} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-black transition-all hover:-translate-y-0.5">
          <FileDown className="mr-3 h-5 w-5" />Exporter Rapport PDF
        </Button>
      </div>

      {/* Sélecteur de Période Premium */}
      <div className="bg-white p-1.5 rounded-[1.25rem] shadow-sm border-2 border-border flex flex-wrap gap-1.5">
        {([
          { id: 'DAILY', label: 'Journalier', icon: Clock },
          { id: 'WEEKLY', label: 'Hebdomadaire', icon: BarChart3 },
          { id: 'MONTHLY', label: 'Mensuel', icon: Calendar },
          { id: 'YEARLY', label: 'Annuel', icon: TrendingUp },
          { id: 'CUSTOM', label: 'Personnalisé', icon: Filter },
        ] as const).map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all",
              period === p.id 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <p.icon className="h-3.5 w-3.5" />
            {p.label}
          </button>
        ))}
      </div>

      {period === 'CUSTOM' && (
        <Card className="bg-white border-border shadow-sm rounded-3xl animate-in zoom-in-95 duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="space-y-2 flex-1">
                <Label className="text-foreground text-xs font-black uppercase tracking-widest ml-1">Date début</Label>
                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="bg-secondary/20 border-border rounded-xl h-12 font-bold" />
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-foreground text-xs font-black uppercase tracking-widest ml-1">Date fin</Label>
                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="bg-secondary/20 border-border rounded-xl h-12 font-bold" />
              </div>
              <Button onClick={fetchReports} className="bg-foreground text-white h-12 px-8 rounded-xl font-black">Appliquer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé Financier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-white border-border shadow-sm rounded-xl p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Recette Brut</p>
              <h3 className="text-xl font-black text-foreground">{totalRevenue.toLocaleString()} <span className="text-xs">XAF</span></h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg text-primary"><TrendingUp className="h-5 w-5" /></div>
          </div>
        </Card>
        <Card className="bg-white border-border shadow-sm rounded-xl p-5 border-l-4 border-l-destructive">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Total Charges</p>
              <h3 className="text-xl font-black text-foreground">{totalExpenses.toLocaleString()} <span className="text-xs">XAF</span></h3>
            </div>
            <div className="bg-destructive/10 p-2 rounded-lg text-destructive"><TrendingDown className="h-5 w-5" /></div>
          </div>
        </Card>
        <Card className="bg-primary text-white shadow-lg shadow-primary/20 rounded-xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1.5">Net à Verser Total</p>
              <h3 className="text-xl font-black">{totalNet.toLocaleString()} <span className="text-xs">XAF</span></h3>
            </div>
            <div className="bg-white/20 p-2 rounded-lg"><FileText className="h-5 w-5" /></div>
          </div>
        </Card>
      </div>

      {/* Tableau des données */}
      <Card className="bg-white border-border shadow-sm rounded-[2.5rem] overflow-hidden border-2">
        <CardHeader className="bg-secondary/10 p-8 border-b border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl font-black">Historique {period}</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} 
                className="pl-12 bg-white border-border rounded-xl h-12 font-bold shadow-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
               <Skeleton className="h-16 w-full rounded-2xl" />
               <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <FileText className="mx-auto h-16 w-16 mb-4 opacity-5" />
              <p className="font-black text-xl">Aucune donnée sur cette période.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[10px] font-black uppercase tracking-widest bg-secondary/30 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Véhicule</th>
                    <th className="px-8 py-5">Chauffeur</th>
                    <th className="px-8 py-5 text-right">Recette</th>
                    <th className="px-8 py-5 text-right">Charges</th>
                    <th className="px-8 py-5 text-right text-primary">Net Versé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-all group font-bold">
                      <td className="px-8 py-6 text-muted-foreground">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-8 py-6 font-black text-foreground">{r.immatriculation}</td>
                      <td className="px-8 py-6 text-muted-foreground">{r.driver_name}</td>
                      <td className="px-8 py-6 text-right">{Number(r.revenue).toLocaleString()}</td>
                      <td className="px-8 py-6 text-right text-destructive">
                        {(Number(r.expense_fuel) + Number(r.expense_toll) + Number(r.expense_washing) + Number(r.expense_others)).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right font-black text-primary bg-primary/5">{Number(r.net_to_deposit).toLocaleString()} XAF</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-secondary/40 font-black text-lg">
                  <tr>
                    <td colSpan={3} className="px-8 py-6 text-right uppercase tracking-tighter text-xs">TOTAUX SUR LA PÉRIODE</td>
                    <td className="px-8 py-6 text-right">{totalRevenue.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right text-destructive">{totalExpenses.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right text-primary">{totalNet.toLocaleString()} XAF</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
