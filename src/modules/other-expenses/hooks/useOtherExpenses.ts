import { useState, useEffect } from 'react';
import { db } from '../../../lib/dexie';
import { SyncEngine } from '../../../lib/sync';
import { OtherExpense } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';

export function useOtherExpenses() {
  const [expenses, setExpenses] = useState<OtherExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const fetchExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = db.otherExpenses.orderBy('date').reverse();
      
      if (user.role === 'CAISSIERE') {
        query = db.otherExpenses.where('author_id').equals(user.id);
      } else if (user.role === 'CHEF_AGENCE') {
        // Chef can see all expenses for their agency, plus all lines if multi-line is enabled
        // For now we load all if they have READ access, but let's filter by their agency for validation
        // In a real app we might fetch from server for other agencies if offline DB only has their agency
      }
      
      const data = await query.toArray();
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setExpenses(data as OtherExpense[]);
    } catch (error) {
      console.error('Error fetching other expenses:', error);
      toast.error('Erreur lors du chargement des autres dépenses');
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData: Omit<OtherExpense, 'id' | 'author_id' | 'author_name' | 'status' | 'clientId' | 'synced' | 'created_at'>) => {
    if (!user) return;
    
    const clientId = uuidv4();
    const newExpense = {
      ...expenseData,
      clientId,
      author_id: user.id,
      author_name: user.name,
      agence_id: user.agenceId || '',
      status: 'EN_ATTENTE' as const,
      synced: false,
      created_at: new Date().toISOString()
    };

    try {
      await db.otherExpenses.add(newExpense);
      await SyncEngine.enqueue('other_expenses', 'INSERT', newExpense, clientId);
      toast.success('Dépense ajoutée et en attente de validation');
      fetchExpenses();
    } catch (error) {
      console.error('Error adding other expense:', error);
      toast.error('Erreur lors de l\'ajout de la dépense');
      throw error;
    }
  };

  const validateExpense = async (clientId: string, action: 'VALIDEE' | 'REJETEE', reason?: string) => {
    if (!user) return;

    try {
      const updateData = {
        status: action,
        validator_id: user.id,
        validator_name: user.name,
        validated_at: new Date().toISOString(),
        ...(reason && { rejection_reason: reason })
      };

      await db.otherExpenses.where('clientId').equals(clientId).modify(updateData);
      
      const expense = await db.otherExpenses.where('clientId').equals(clientId).first();
      if (expense) {
        await SyncEngine.enqueue('other_expenses', 'UPDATE', expense, clientId);
      }
      
      toast.success(`Dépense ${action === 'VALIDEE' ? 'validée' : 'rejetée'}`);
      fetchExpenses();
    } catch (error) {
      console.error('Error validating other expense:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  return {
    expenses,
    loading,
    addExpense,
    validateExpense,
    refresh: fetchExpenses
  };
}
