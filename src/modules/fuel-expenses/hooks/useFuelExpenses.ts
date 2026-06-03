import { useState, useEffect } from 'react';
import { db } from '../../../lib/dexie';
import { SyncEngine } from '../../../lib/sync';
import { FuelExpense } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';

export function useFuelExpenses() {
  const [expenses, setExpenses] = useState<FuelExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const fetchExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = db.fuelExpenses.orderBy('date').reverse();
      
      // RBAC: Caissière/Chef see only their agence
      if (user.role !== 'PDG') {
        query = db.fuelExpenses.where('agence_id').equals(user.agenceId!);
      }
      
      const data = await query.toArray();
      // Sort by date and time
      data.sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare === 0) {
          return b.time.localeCompare(a.time);
        }
        return dateCompare;
      });
      
      setExpenses(data as FuelExpense[]);
    } catch (error) {
      console.error('Error fetching fuel expenses:', error);
      toast.error('Erreur lors du chargement des dépenses de carburant');
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData: Omit<FuelExpense, 'id' | 'user_id' | 'user_name' | 'clientId' | 'synced' | 'created_at'>) => {
    if (!user) return;
    
    const clientId = uuidv4();
    const newExpense = {
      ...expenseData,
      clientId,
      user_id: user.id,
      user_name: user.name,
      vehicle_id: expenseData.vehicle_id || '',
      agence_id: user.agenceId || '',
      synced: false,
      created_at: new Date().toISOString()
    };

    try {
      // 1. Save locally
      await db.fuelExpenses.add(newExpense);
      
      // 2. Add to sync queue
      await SyncEngine.enqueue('fuel_expenses', 'INSERT', newExpense, clientId);
      
      toast.success('Dépense de carburant ajoutée');
      fetchExpenses();
    } catch (error) {
      console.error('Error adding fuel expense:', error);
      toast.error('Erreur lors de l\'ajout de la dépense');
      throw error;
    }
  };

  return {
    expenses,
    loading,
    addExpense,
    refresh: fetchExpenses
  };
}
