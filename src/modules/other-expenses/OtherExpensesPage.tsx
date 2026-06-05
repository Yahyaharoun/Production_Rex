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
import { useConfirm } from '../../providers/ConfirmProvider';
import { OtherExpense } from '../../types';

export default function OtherExpensesPage() {
  const { expenses, loading, addExpense, validateExpense, deleteExpense } = useOtherExpenses();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VALIDATED' | 'REJECTED'>('PENDING');
  const { can, user } = useRBAC();
  const confirm = useConfirm();
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
    let reason: string | undefined = undefined;
    if (action === 'REJECTED') {
      const input = prompt('Veuillez indiquer le motif du rejet :');
      if (input === null) return;
      if (!input.trim()) {
        alert('Le motif est obligatoire pour un rejet.');
        return;
      }
      reason = input;
    } else {
      const isConfirmed = await confirm({
        title: 'Validation',
        message: 'Voulez-vous vraiment valider cette dépense ?',
        variant: 'info'
      });
      if (!isConfirmed) return;
    }
    
    await validateExpense((expense.id || expense.clientId)!, action, reason);
  };

  const filteredExpenses = expenses.filter(e => filter === 'ALL' || e.status === filter);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [validatingAll, setValidatingAll] = useState(false);

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

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleSelectAll = () => {
    const visibleRecords = filteredExpenses.filter(r => r.id || r.clientId);
    if (selectedIds.size === visibleRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleRecords.map(r => (r.id || r.clientId)!)));
    }
  };

  const handleValidateSelected = async () => {
    if (!user || (user.role !== 'PDG' && user.role !== 'CHEF_AGENCE')) return;
    if (selectedIds.size === 0) return;
    
    const toValidate = filteredExpenses.filter(r => selectedIds.has((r.id || r.clientId)!) && r.status === 'PENDING');
    if (toValidate.length === 0) return;

    const isConfirmed = await confirm({
      title: 'Validation multiple',
      message: `Voulez-vous valider les ${toValidate.length} dépense(s) sélectionnée(s) ?`,
      variant: 'info'
    });
    if (!isConfirmed) return;
    
    setValidatingAll(true);
    for (const record of toValidate) {
      await validateExpense((record.id || record.clientId)!, 'VALIDATED', '');
    }
    setValidatingAll(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (user?.role !== 'PDG' && user?.role !== 'CHEF_AGENCE') return;
    if (selectedIds.size === 0) return;
    
    const isConfirmed = await confirm({
      title: 'Suppression',
      message: `Voulez-vous vraiment SUPPRIMER les ${selectedIds.size} dépense(s) sélectionnée(s) ? Cette action est définitive.`,
      variant: 'danger'
    });
    if (!isConfirmed) return;
    
    setValidatingAll(true);
    for (const id of Array.from(selectedIds)) {
      await deleteExpense(id);
    }
    setValidatingAll(false);
    setSelectedIds(new Set());
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
            {user?.role === 'PDG' || user?.role === 'CHEF_AGENCE' ? (
              <div className="flex gap-2 mr-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSelectAll}
                  className="h-9 text-xs font-bold"
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredExpenses.filter(r => r.id || r.clientId).length ? 'Tout décocher' : 'Tout cocher'}
                </Button>
                {selectedIds.size > 0 && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-9 text-xs font-bold text-destructive hover:bg-destructive hover:text-white border-destructive"
                      onClick={handleDeleteSelected}
                      disabled={validatingAll}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer ({selectedIds.size})
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      onClick={handleValidateSelected}
                      disabled={validatingAll}
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" /> 
                      {validatingAll ? 'Validation...' : `Valider (${selectedIds.size})`}
                    </Button>
                  </>
                )}
              </div>
            ) : null}
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
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium text-lg">Aucune dépense trouvée</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Ajoutez une nouvelle dépense pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground font-bold text-xs uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredExpenses.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4">Date & Agence</th>
                    <th className="px-6 py-4">Type & Description</th>
                    <th className="px-6 py-4">Auteur</th>
                    <th className="px-6 py-4 text-right">Montant</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id || expense.clientId} className={cn(
                      "group transition-colors hover:bg-secondary/5",
                      selectedIds.has((expense.id || expense.clientId)!) && "bg-primary/5"
                    )}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary"
                          checked={selectedIds.has((expense.id || expense.clientId)!)}
                          onChange={() => handleToggleSelect((expense.id || expense.clientId)!)}
                        />
                      </td>
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
                        <div className="flex justify-end gap-1 transition-opacity">
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
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full" onClick={async () => {
                              const isConfirmed = await confirm('Voulez-vous vraiment supprimer cette dépense ?');
                              if (isConfirmed) {
                                deleteExpense((expense.id || expense.clientId)!);
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
