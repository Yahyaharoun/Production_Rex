import { useState, useEffect } from 'react';
import { db } from '../../../lib/dexie';
import { OtherExpense } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { queueSync } from '../../../services/syncService';

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
      if (navigator.onLine) {
        // Fetch from Supabase for fresh data
        let query = supabase.from('other_expenses').select('*').order('created_at', { ascending: false }).limit(200);
        
        if (user.role === 'CAISSIERE' || user.role === 'AGENT_RECETTE') {
          query = query.eq('created_by', user.id);
        } else if (user.role === 'CHEF_AGENCE' && user.agenceId) {
          query = query.eq('agence_id', user.agenceId);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Sync to local DB and prepare mapped data
        const mappedData: any[] = [];
        if (data && data.length > 0) {
          for (const exp of data) {
            const mapped = {
              clientId: exp.id,
              id: exp.id,
              date: exp.date || new Date().toISOString().split('T')[0],
              label: exp.label || exp.libelle || '',
              motif: exp.motif || exp.reason || '',
              amount: exp.amount || (exp.unit_price * exp.quantity) || 0,
              unit_price: exp.unit_price || 0,
              quantity: exp.quantity || 1,
              agence_id: exp.agence_id,
              agenceId: exp.agence_id,
              author_id: exp.created_by,
              author_name: exp.caissiere_name,
              caissiere_name: exp.caissiere_name,
              status: exp.status || 'PENDING',
              synced: true,
              created_at: exp.created_at,
              createdAt: new Date(exp.created_at).getTime(),
              validator_name: exp.validator_name,
              rejection_reason: exp.rejection_note || exp.rejection_reason
            };
            await db.otherExpenses.put(mapped).catch(() => {});
            mappedData.push(mapped);
          }
        }
        setExpenses(mappedData);
      } else {
        const localData = await db.otherExpenses.toArray();
        localData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setExpenses(localData as OtherExpense[]);
      }
    } catch (error) {
      console.error('Error fetching other expenses:', error);
      // Fallback to local
      try {
        const localData = await db.otherExpenses.toArray();
        setExpenses(localData as OtherExpense[]);
      } catch (_) {}
      toast.error('Erreur lors du chargement des autres dépenses');
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData: any) => {
    if (!user) return;
    
    const clientId = crypto.randomUUID();
    const todayStr = new Date().toISOString().split('T')[0];
    const amount = Number(expenseData.unit_price || 0) * Number(expenseData.quantity || 1);
    
    // Payload propre sans le champ 'ligne' qui n'existe pas dans la table Supabase
    // Mapping des champs pour correspondre à l'ancien schéma (reason)
    const payloadForServer = {
      label: expenseData.label,
      motif: expenseData.motif,
      reason: expenseData.motif,      // Fallback pour les anciennes tables
      unit_price: Number(expenseData.unit_price),
      quantity: Number(expenseData.quantity),
      amount,
      agence_id: user.agenceId || null,
      created_by: user.id,
      caissiere_name: user.name,
      status: 'PENDING',
      date: expenseData.date || todayStr,
    };

    try {
      let insertedId = clientId;
      if (navigator.onLine) {
        const { data: inserted, error } = await supabase.from('other_expenses').insert(payloadForServer).select().single();
        if (error) throw error;
        insertedId = inserted.id;
      } else {
        insertedId = await queueSync('other_expenses', 'INSERT', payloadForServer);
      }
      
      await db.otherExpenses.put({
        clientId: insertedId,
        id: insertedId,
        date: expenseData.date || todayStr,
        label: expenseData.label,
        motif: expenseData.motif,
        amount,
        unit_price: Number(expenseData.unit_price),
        quantity: Number(expenseData.quantity),
        agence_id: user.agenceId || '',
        agenceId: user.agenceId || '',
        author_id: user.id,
        author_name: user.name,
        caissiere_name: user.name,
        status: 'PENDING' as any,
        synced: navigator.onLine,
        created_at: new Date().toISOString(),
        createdAt: Date.now(),
      });
      
      toast.success('Dépense ajoutée et en attente de validation');
      fetchExpenses();
    } catch (error: any) {
      console.error('Error adding other expense:', error);
      toast.error("Erreur lors de l'ajout de la dépense: " + error.message);
      throw error;
    }
  };

  const validateExpense = async (clientId: string, action: 'VALIDATED' | 'REJECTED', reason?: string) => {
    if (!user) return;

    try {
      const payload = {
        status: action,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
        ...(reason && { rejection_note: reason })
      };

      if (navigator.onLine) {
        const { error } = await supabase.from('other_expenses').update(payload).eq('id', clientId);
        if (error) throw error;
      } else {
        await queueSync('other_expenses', 'UPDATE', { id: clientId, ...payload });
      }

      await db.otherExpenses.where('clientId').equals(clientId).modify({
        status: action as any,
        validated_at: payload.validated_at,
        ...(reason && { rejection_note: reason })
      });
      
      toast.success(`Dépense ${action === 'VALIDATED' ? 'validée' : 'rejetée'}`);
      fetchExpenses();
    } catch (error: any) {
      console.error('Error validating other expense:', error);
      toast.error('Erreur lors de la validation: ' + error.message);
    }
  };

  const deleteExpense = async (clientId: string) => {
    if (!user) return;
    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('other_expenses').delete().eq('id', clientId);
        if (error) throw error;
      } else {
        await queueSync('other_expenses', 'DELETE', { id: clientId });
      }
      
      // Delete from local DB by clientId OR id
      await db.otherExpenses.where('clientId').equals(clientId).delete().catch(() => {});
      await db.otherExpenses.where('id').equals(clientId).delete().catch(() => {});
      
      toast.success('Dépense supprimée avec succès');
      fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error('Erreur lors de la suppression: ' + (error.message || ''));
    }
  };

  return {
    expenses,
    loading,
    addExpense,
    validateExpense,
    deleteExpense,
    refresh: fetchExpenses
  };
}
