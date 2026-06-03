import { useState, useEffect } from 'react';
import { db } from '../../../lib/dexie';
import { SyncEngine } from '../../../lib/sync';
import { Wash } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '../../../store/useAuthStore';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export function useWashingControl() {
  const [washes, setWashes] = useState<Wash[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    fetchWashes();
  }, [user]);

  const fetchWashes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = db.washes.orderBy('date').reverse();
      
      if (user.role !== 'PDG') {
        query = db.washes.where('agence_id').equals(user.agenceId!);
      }
      
      const data = await query.toArray();
      data.sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare === 0) {
          return b.time.localeCompare(a.time);
        }
        return dateCompare;
      });
      
      setWashes(data as Wash[]);
    } catch (error) {
      console.error('Error fetching washes:', error);
      toast.error('Erreur lors du chargement des lavages');
    } finally {
      setLoading(false);
    }
  };

  const checkWashAllowed = async (vehicleId: string, date: string): Promise<boolean> => {
    // Check locally first
    const existing = await db.washes
      .where('[vehicle_id+date]')
      .equals([vehicleId, date])
      .first();

    if (existing) return false;

    // Check on server if online
    if (navigator.onLine) {
      try {
        const { data } = await supabase
          .from('washes')
          .select('id')
          .eq('vehicle_id', vehicleId)
          .eq('date', date)
          .limit(1);

        if (data && data.length > 0) return false;
      } catch (err) {
        console.error('Error checking server for washes', err);
        // Fallback to local decision if server query fails
      }
    }

    return true;
  };

  const addWash = async (washData: Omit<Wash, 'id' | 'user_id' | 'user_name' | 'clientId' | 'synced' | 'created_at'>) => {
    if (!user) return;
    
    // Check constraint before saving
    const isAllowed = await checkWashAllowed(washData.vehicle_id, washData.date);
    if (!isAllowed) {
      toast.error('Le lavage de ce véhicule a déjà été enregistré pour aujourd\'hui.');
      throw new Error('Already washed today');
    }

    const clientId = uuidv4();
    const newWash = {
      ...washData,
      clientId,
      user_id: user.id,
      user_name: user.name,
      ligne: washData.ligne || '',
      agence_id: user.agenceId || '',
      synced: false,
      created_at: new Date().toISOString()
    };

    try {
      await db.washes.add(newWash);
      await SyncEngine.enqueue('washes', 'INSERT', newWash, clientId);
      toast.success('Lavage enregistré');
      fetchWashes();
    } catch (error) {
      console.error('Error adding wash:', error);
      toast.error('Erreur lors de l\'enregistrement');
      throw error;
    }
  };

  return {
    washes,
    loading,
    addWash,
    refresh: fetchWashes,
    checkWashAllowed
  };
}
