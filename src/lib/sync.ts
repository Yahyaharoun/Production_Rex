import { db } from './dexie';
import { supabase } from './supabase';
import { useSyncStore } from '../store/useSyncStore';
import { toast } from 'sonner';

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 3000, 10000, 30000, 60000];

export class SyncEngine {
  private static isRunning = false;

  static async syncAll() {
    if (this.isRunning || !navigator.onLine) return;
    this.isRunning = true;
    useSyncStore.getState().setSyncing(true);
    useSyncStore.getState().setError(null);

    try {
      await this.pushToServer();
      await this.pullFromServer();
      useSyncStore.getState().setLastSyncedAt(new Date().toISOString());
    } catch (err: unknown) {
      console.error('Sync error:', err);
      useSyncStore.getState().setError((err as Error).message || 'Erreur de synchronisation');
    } finally {
      this.isRunning = false;
      useSyncStore.getState().setSyncing(false);
      this.updatePendingCount();
    }
  }

  static async pushToServer() {
    const pendingItems = await db.syncQueue
      .where('status')
      .anyOf('PENDING', 'ERROR')
      .sortBy('createdAt');

    for (const item of pendingItems) {
      if (item.retries >= MAX_RETRIES) continue;

      try {
        await db.syncQueue.update(item.id!, { status: 'SYNCING' });

        if (item.action === 'INSERT' || item.action === 'UPDATE') {
          const { error } = await supabase.from(item.table).upsert({
            ...item.payload,
            client_id: item.clientId,
            updated_at: new Date().toISOString()
          }, { onConflict: 'client_id' });
          if (error) throw error;
        } else if (item.action === 'DELETE') {
          const { error } = await supabase.from(item.table).delete().eq('client_id', item.clientId);
          if (error) throw error;
        }

        await db.syncQueue.update(item.id!, { 
          status: 'SYNCED',
          syncedAt: new Date().toISOString()
        });
        
        // Update local entity synced status
        if (item.table === 'productions') await db.productions.where('clientId').equals(item.clientId).modify({ synced: true });
        else if (item.table === 'fuel_expenses') await db.fuelExpenses.where('clientId').equals(item.clientId).modify({ synced: true });
        else if (item.table === 'other_expenses') await db.otherExpenses.where('clientId').equals(item.clientId).modify({ synced: true });
        else if (item.table === 'washes') await db.washes.where('clientId').equals(item.clientId).modify({ synced: true });

      } catch (err: unknown) {
        console.error(`Sync error for item ${item.id}:`, err);
        await db.syncQueue.update(item.id!, {
          status: 'ERROR',
          retries: item.retries + 1,
          errorMessage: (err as Error).message
        });
        
        // Exponential backoff
        const delay = RETRY_DELAYS[Math.min(item.retries, RETRY_DELAYS.length - 1)];
        setTimeout(() => this.syncAll(), delay);
      }
    }
  }

  static async pullFromServer() {
    // Only basic pulling for read-only tables for now to avoid overwriting local changes.
    // Vehicles, Agencies, Drivers.
    try {
      const [vehiclesRes, agenciesRes, driversRes] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('agencies').select('*'),
        supabase.from('drivers').select('*')
      ]);

      if (vehiclesRes.data) {
        await db.vehicles.clear();
        await db.vehicles.bulkAdd(vehiclesRes.data);
      }
      if (agenciesRes.data) {
        await db.agencies.clear();
        await db.agencies.bulkAdd(agenciesRes.data);
      }
      if (driversRes.data) {
        await db.drivers.clear();
        await db.drivers.bulkAdd(driversRes.data);
      }
    } catch(err) {
      console.error('Error pulling from server:', err);
    }
  }

  static async enqueue(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any, clientId: string) {
    await db.syncQueue.add({
      clientId,
      table,
      action,
      payload,
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString()
    });
    this.updatePendingCount();
    
    if (navigator.onLine) {
      this.syncAll();
    }
  }

  static async updatePendingCount() {
    const count = await db.syncQueue.where('status').anyOf('PENDING', 'ERROR').count();
    useSyncStore.getState().setPendingCount(count);
  }
}

// Auto-sync listener
window.addEventListener('online', () => {
  toast.info('Connexion rétablie. Synchronisation en cours...');
  SyncEngine.syncAll();
});
