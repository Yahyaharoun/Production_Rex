import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Fuel, Plus, Clock, Filter, FileText } from 'lucide-react';
import { useFuelExpenses } from './hooks/useFuelExpenses';
import { FuelExpenseForm } from './FuelExpenseForm';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { useRBAC } from '../../hooks/useRBAC';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FuelExpensesPage() {
  const { expenses, loading, addExpense } = useFuelExpenses();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'VIP' | 'CLASSIQUE'>('ALL');
  const { can } = useRBAC();
  const canAdd = can('write', 'fuel');

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      await addExpense(data);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const filteredExpenses = expenses.filter(e => filter === 'ALL' || e.category === filter);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Rapport des Dépenses de Carburant', 14, 15);
    doc.text(`Catégorie : ${filter === 'ALL' ? 'Toutes' : filter}`, 14, 22);
    doc.text(`Total : ${totalAmount.toLocaleString()} FCFA`, 14, 29);

    const tableData = filteredExpenses.map(e => [
      e.date,
      e.time,
      e.immatriculation,
      e.category,
      e.user_name,
      `${e.amount.toLocaleString()} FCFA`,
      e.synced ? 'Oui' : 'Non'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Heure', 'Véhicule', 'Catégorie', 'Auteur', 'Montant', 'Synchronisé']],
      body: tableData,
    });

    doc.save(`carburant_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Carburant Avancé</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Gestion des dépenses VIP & Classique
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPDF} variant="outline" className="border-border rounded-xl h-11 px-4 font-bold shadow-sm">
            <FileText className="mr-2 h-4 w-4" /> Exporter PDF
          </Button>
          {canAdd && !showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 font-black shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
            </Button>
          )}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-primary/20 shadow-sm rounded-xl">
          <CardHeader className="pb-2 pt-4 px-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Dépenses</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="text-2xl font-black text-foreground">{totalAmount.toLocaleString()} FCFA</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Pour la sélection actuelle</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <FuelExpenseForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {/* Filter and List */}
      <Card className="bg-white border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-secondary/5 pb-4 p-6 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Historique
          </CardTitle>
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-xl bg-white border border-border h-9 px-3 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Toutes les catégories</option>
              <option value="VIP">VIP uniquement</option>
              <option value="CLASSIQUE">CLASSIQUE uniquement</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              Aucune dépense de carburant trouvée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border font-bold">
                  <tr>
                    <th className="px-6 py-4">Date & Heure</th>
                    <th className="px-6 py-4">Véhicule</th>
                    <th className="px-6 py-4">Catégorie</th>
                    <th className="px-6 py-4">Auteur</th>
                    <th className="px-6 py-4 text-right">Montant</th>
                    <th className="px-6 py-4 text-center">Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id || expense.clientId} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {expense.date} <span className="text-muted-foreground text-xs">{expense.time}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {expense.immatriculation}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                          expense.category === 'VIP' ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"
                        )}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        {expense.user_name}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-foreground">
                        {expense.amount.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 text-center">
                        {expense.synced ? (
                          <span className="text-emerald-500 font-bold" title="Synchronisé">✅</span>
                        ) : (
                          <span className="text-amber-500 font-bold" title="En attente de synchronisation">⏳</span>
                        )}
                      </td>
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
