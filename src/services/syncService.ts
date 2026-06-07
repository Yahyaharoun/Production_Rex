import { db, SyncQueueItem } from '../lib/dexie';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const LOCAL_ONLY_FIELDS = ['clientId', 'client_id', 'synced', 'syncStatus', 'createdAt', 'agenceId', 'vehicleImmat', 'lineName', 'vehicle_id', 'ligne', 'totalSeats'];

function sanitizeForServer(payload: Record<string, any>): Record<string, any> {
  const clean = { ...payload };
  for (const f of LOCAL_ONLY_FIELDS) {
    delete clean[f];
  }
  return clean;
}

export const syncAllPending = async () => {
  if (!navigator.onLine) return;

  const pending = await db.syncQueue
    .where('status').anyOf('PENDING', 'FAILED')
    .sortBy('createdAt');

  if (pending.length === 0) return;

  let successCount = 0;
  let errorCount = 0;
  let lastErrorMessage = '';

  for (const item of pending) {
    if ((item.retries || 0) >= 5) {
      await db.syncQueue.delete(item.id!);
      continue;
    }

    await db.syncQueue.update(item.id!, { status: 'SYNCING' });
    try {
      const payloadForServer = sanitizeForServer(item.payload);

      // Map clientId → id for Supabase primary key
      if (!payloadForServer.id && item.clientId) {
        payloadForServer.id = item.clientId;
      }

      if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
        if (item.table === 'vehicles' && payloadForServer.status === 'ACTIF') {
          // Drop silently: ACTIF is not allowed by DB constraint
          await db.syncQueue.update(item.id!, { status: 'SUCCESS' });
          continue;
        }

        const { data, error } = await supabase
          .from(item.table)
          .upsert(payloadForServer, { onConflict: 'id' })
          .select();
        
        if (error) {
          if (error.message?.includes('vehicles_immatriculation_key')) {
            console.warn('[SyncService] Duplicate immatriculation detected, dropping local duplicate.', item.payload);
            await db.syncQueue.update(item.id!, { status: 'SUCCESS' });
            if (item.table === 'vehicles' && payloadForServer.id) {
              await db.vehicles.delete(payloadForServer.id);
            }
            continue;
          }
          throw new Error(`DB Error: ${error.message} ${error.details || ''} ${error.hint || ''}`);
        }
        
        if (!data || data.length === 0) {
          throw new Error(`Permission refusée (RLS silencieux) pour enregistrer sur ${item.table}. Vérifiez vos droits.`);
        }
      } else if (item.operation === 'DELETE') {
        const deleteId = item.payload.id || item.clientId;
        const { data, error } = await supabase
          .from(item.table)
          .delete()
          .eq('id', deleteId)
          .select();
        if (error) throw new Error(`DB Delete Error: ${error.message} ${error.details || ''} ${error.hint || ''}`);
        
        if (!data || data.length === 0) {
          throw new Error(`Permission refusée (RLS silencieux) ou élément déjà supprimé sur ${item.table}.`);
        }
      }

      await db.syncQueue.update(item.id!, { status: 'SUCCESS', syncedAt: Date.now() });
      successCount++;
    } catch (err: any) {
      console.error(`[SyncService] Error syncing ${item.table}:`, err.message);
      const retries = (item.retries || 0) + 1;
      await db.syncQueue.update(item.id!, {
        status: retries >= 5 ? 'FAILED' : 'PENDING',
        retries,
        errorMessage: err.message,
      });
      lastErrorMessage = err.message;
      errorCount++;
    }
  }

  if (successCount > 0) {
    toast.success(`${successCount} élément(s) synchronisé(s) avec succès !`);
  }
  if (errorCount > 0 && lastErrorMessage) {
    toast.error(`Échec de synchronisation (${errorCount}): ${lastErrorMessage}`);
  } else if (errorCount > 0) {
    toast.error(`${errorCount} élément(s) n'ont pas pu être synchronisés.`);
  }
};

export const queueSync = async (
  table: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: Record<string, any>
): Promise<string> => {
  // Always generate a stable UUID as clientId
  const clientId = payload.id || crypto.randomUUID();

  const item: SyncQueueItem = {
    clientId,
    table,
    operation,
    payload: { ...payload, id: clientId },
    status: 'PENDING',
    retries: 0,
    createdAt: Date.now(),
  };

  await db.syncQueue.add(item);

  if (navigator.onLine) {
    // fire and forget
    syncAllPending().catch(console.error);
  } else {
    toast.info('Hors ligne — données sauvegardées localement et synchronisées dès le retour.');
  }

  return clientId;
};

export const logActivity = async (
  action: string,
  entityType: string,
  description: string,
  recordData?: any,
  userId?: string,
  userEmail?: string
) => {
  const clientId = crypto.randomUUID();
  const entry = {
    clientId,
    action,
    entity_type: entityType,
    table_name: entityType,
    description,
    record_data: recordData,
    user_id: userId,
    user_email: userEmail,
    created_at: new Date().toISOString(),
    synced: navigator.onLine,
  };

  // Save locally
  await db.activityLog.add(entry);

  // Also push to Supabase if online
  if (navigator.onLine) {
    try {
      const { clientId: _c, synced: _s, ...serverEntry } = entry;
      await supabase.from('activity_log').insert(serverEntry);
    } catch (e) {
      console.warn('[SyncService] Could not write activity log to Supabase:', e);
    }
  }
};
