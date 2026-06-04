import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { FileText, Plus, Clock, Filter, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useOtherExpenses } from './hooks/useOtherExpenses';
import { OtherExpenseForm } from './OtherExpenseForm';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { useRBAC } from '../../hooks/useRBAC';
import { OtherExpense } from '../../types';

export default function OtherExpensesPage() {
  const { expenses, loading, addExpense, validateExpense, deleteExpense } = useOtherExpenses();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VALIDATED' | 'REJECTED'>('ALL');
  const { can, user } = useRBAC();
  const canAdd = can('write', 'other_expenses');
  // Caissiere cannot validate. Chef can validate their own agency.
  const canValidate = (agenceId: string) => can('write', 'other_expenses', agenceId) && (user?.role === 'PDG' || user?.role === 'CHEF_AGENCE');

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      await addExpense(data);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (expense: OtherExpense, action: 'VALIDATED' | 'REJECTED') => {
    let reason = '';
    if (action === 'REJECTED') {
      const input = prompt('Veuillez indiquer le motif du rejet :');
      if (input === null) return;
      if (!input.trim()) {
        alert('Le motif est obligatoire pour un rejet.');
        return;
      }
      reason = input;
    } else {
      if (!window.confirm('Voulez-vous vraiment valider cette dépense ?')) return;
    }
    
    await validateExpense(expense.clientId!, action, reason);
  };

  const filteredExpenses = expenses.filter(e => filter === 'ALL' || e.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">En attente</span>;
      case 'VALIDATED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">Validée</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">Rejetée</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Autres Dépenses</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Gestion et validation des dépenses diverses
          </p>
        </div>
        {canAdd && !showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 font-black shadow-lg">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
          </Button>
        )}
      </div>

      {showForm && (
        <OtherExpenseForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {/* Filter and List */}
      <Card className="bg-white border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-secondary/5 pb-4 p-6 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Demandes de Dépenses
          </CardTitle>
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-xl bg-white border border-border h-9 px-3 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="VALIDATED">Validées</option>
              <option value="REJECTED">Rejetées</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              Aucune dépense trouvée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border font-bold">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Dépense & Motif</th>
                    <th className="px-6 py-4">Auteur</th>
                    <th className="px-6 py-4 text-right">Montant Total</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id || expense.clientId} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold">{expense.date}</div>
                        <div className="text-[10px] text-muted-foreground">{expense.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{expense.label}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={expense.motif}>
                          {expense.motif}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        {expense.author_name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-black text-foreground">{(expense.amount || (expense.total as any) || 0).toLocaleString()} FCFA</div>
                        <div className="text-[10px] text-muted-foreground">{expense.quantity} x {(expense.unit_price || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(expense.status)}
                        {expense.status !== 'EN_ATTENTE' && (
                          <div className="text-[9px] text-muted-foreground mt-1">
                            Par {expense.validator_name}
                          </div>
                        )}
                        {expense.status !== 'PENDING' && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            par {expense.validator_name || 'Admin'}
                            {expense.rejection_reason && (
                              <div className="text-rose-600 truncate max-w-[150px]" title={expense.rejection_reason}>
                                Motif: {expense.rejection_reason}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-1">
                          {expense.synced ? (
                            <span className="text-emerald-500 text-[9px] font-bold" title="Synchronisé">✅ Sync</span>
                          ) : (
                            <span className="text-amber-500 text-[9px] font-bold" title="En attente de synchronisation">⏳ Local</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canValidate(expense.agence_id || '') && expense.status === 'PENDING' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                                onClick={() => handleAction(expense, 'VALIDATED')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full"
                                onClick={() => handleAction(expense, 'REJECTED')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(user?.role === 'PDG' || user?.role === 'CHEF_AGENCE') && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full" onClick={() => {
                              if (window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
                                deleteExpense(expense.clientId!);
                              }
                            }} title="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
