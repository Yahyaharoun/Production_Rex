import { useState, useEffect } from 'react';
import { db } from '../../../lib/dexie';
import { OtherExpense } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { queueSync } from '../../../services/syncService';
import { useLiveQuery } from 'dexie-react-hooks';

export function useOtherExpenses() {
  const user = useAuthStore(s => s.user);
  
  const dexieExpenses = useLiveQuery(() => db.otherExpenses.toArray());
  const expenses = dexieExpenses ? dexieExpenses.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : [];
  const loading = dexieExpenses === undefined;

  useEffect(() => {
    syncFromServer();
  }, [user]);

  const syncFromServer = async () => {
    if (!user || !navigator.onLine) return;
      try {
        let query = supabase.from('other_expenses').select('*').order('created_at', { ascending: false }).limit(200);
        
        if (user.role === 'CAISSIERE' || user.role === 'AGENT_RECETTE') {
          query = query.eq('created_by', user.id);
        } else if (user.role === 'CHEF_AGENCE' && user.agenceId) {
          query = query.eq('agence_id', user.agenceId);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Sync to local DB and prepare mapped data
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
          }
        }
      } catch (error) {
        console.error('Error fetching other expenses background:', error);
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
      const payloadWithId = { ...payloadForServer, id: clientId };
      await queueSync('other_expenses', 'INSERT', payloadWithId);
      
      await db.otherExpenses.put({
        clientId: clientId,
        id: clientId,
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

      await queueSync('other_expenses', 'UPDATE', { id: clientId, ...payload });

      await db.otherExpenses.where('clientId').equals(clientId).modify({
        status: action as any,
        validated_at: payload.validated_at,
        ...(reason && { rejection_note: reason })
      });
      toast.success(`Dépense ${action === 'VALIDATED' ? 'validée' : 'rejetée'}`);
    } catch (error: any) {
      console.error('Error validating other expense:', error);
      toast.error('Erreur lors de la validation: ' + error.message);
    }
  };

  const deleteExpense = async (clientId: string) => {
    if (!user) return;
    try {
      await queueSync('other_expenses', 'DELETE', { id: clientId });
      
      // Delete from local DB by clientId OR id
      await db.otherExpenses.where('clientId').equals(clientId).delete().catch(() => {});
      await db.otherExpenses.where('id').equals(clientId).delete().catch(() => {});
      
      toast.success('Dépense supprimée avec succès');
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error('Erreur lors de la suppression: ' + (error.message || ''));
    }
  };

  return {
    expenses: expenses as OtherExpense[],
    loading,
    addExpense,
    validateExpense,
    deleteExpense,
    refresh: syncFromServer
  };
}
