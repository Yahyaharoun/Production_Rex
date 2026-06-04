import { SyncEngine } from '../lib/sync';
import { db } from '../lib/dexie';
import { supabase } from '../lib/supabase';

/**
 * Fetches data from Supabase and stores it in IndexedDB for offline use.
 * Call this at startup when online.
 */
export async function prefetchForOffline(agenceId?: string) {
  if (!navigator.onLine) return;

  try {
    // Pull reference data: vehicles, agencies, drivers
    const [vehiclesRes, agenciesRes, driversRes] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('agencies').select('*'),
      supabase.from('drivers').select('*'),
    ]);

    if (vehiclesRes.data) {
      await db.vehicles.clear();
      await db.vehicles.bulkPut(vehiclesRes.data);
    }
    if (agenciesRes.data) {
      await db.agencies.clear();
      await db.agencies.bulkPut(agenciesRes.data);
    }
    if (driversRes.data) {
      await db.drivers.clear();
      await db.drivers.bulkPut(driversRes.data);
    }

    // Pull transactional data (last 90 days)
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const sinceStr = since.toISOString().slice(0, 10);

    let prodsQuery = supabase
      .from('productions')
      .select('*')
      .gte('date', sinceStr)
      .order('date', { ascending: false });

    let fuelQuery = supabase
      .from('fuel_expenses')
      .select('*')
      .gte('date', sinceStr)
      .order('date', { ascending: false });

    let washQuery = supabase
      .from('washes')
      .select('*')
      .gte('date', sinceStr)
      .order('date', { ascending: false });

    let otherQuery = supabase
      .from('other_expenses')
      .select('*')
      .gte('date', sinceStr)
      .order('date', { ascending: false });

    if (agenceId) {
      prodsQuery  = prodsQuery.eq('agence_id', agenceId);
      fuelQuery   = fuelQuery.eq('agence_id', agenceId);
      washQuery   = washQuery.eq('agence_id', agenceId);
      otherQuery  = otherQuery.eq('agence_id', agenceId);
    }

    const [prodsRes, fuelRes, washRes, otherRes] = await Promise.all([
      prodsQuery,
      fuelQuery,
      washQuery,
      otherQuery,
    ]);

    // Store productions
    if (prodsRes.data && prodsRes.data.length > 0) {
      // Map server fields to local schema
      const local = prodsRes.data.map((p: any) => ({
        clientId:               p.client_id || p.id,
        date:                   p.date,
        immatriculation:        p.immatriculation,
        driver_name:            p.driver_name,
        total_seats:            p.total_seats,
        passengers_at_departure:p.passengers_at_departure,
        revenue:                p.revenue,
        expense_fuel:           p.expense_fuel,
        expense_toll:           p.expense_toll,
        expense_washing:        p.expense_washing,
        expense_others:         p.expense_others,
        net_to_deposit:         p.net_to_deposit,
        production_type:        p.production_type,
        price_per_ticket:       p.price_per_ticket,
        status:                 p.status,
        ligne:                  p.ligne,
        agence_id:              p.agence_id,
        caissiere_name:         p.caissiere_name,
        created_at:             p.created_at,
        synced:                 true,
      }));
      await db.productions.bulkPut(local);
    }

    // Store fuel expenses
    if (fuelRes.data && fuelRes.data.length > 0) {
      const local = fuelRes.data.map((f: any) => ({
        clientId:      f.client_id || f.id,
        date:          f.date,
        time:          f.time || '',
        user_id:       f.user_id || '',
        user_name:     f.user_name || '',
        ligne:         f.ligne || '',
        agence_id:     f.agence_id,
        vehicle_id:    f.vehicle_id || '',
        immatriculation: f.immatriculation || '',
        category:      f.category,
        amount:        f.amount,
        notes:         f.notes,
        synced:        true,
      }));
      await db.fuelExpenses.bulkPut(local);
    }

    // Store washes
    if (washRes.data && washRes.data.length > 0) {
      const local = washRes.data.map((w: any) => ({
        clientId:       w.client_id || w.id,
        date:           w.date,
        time:           w.time || '',
        vehicle_id:     w.vehicle_id || '',
        immatriculation:w.immatriculation || '',
        user_id:        w.user_id || '',
        user_name:      w.user_name || '',
        agence_id:      w.agence_id,
        ligne:          w.ligne || '',
        amount:         w.amount,
        notes:          w.notes,
        synced:         true,
      }));
      await db.washes.bulkPut(local);
    }

    // Store other expenses
    if (otherRes.data && otherRes.data.length > 0) {
      const local = otherRes.data.map((o: any) => ({
        clientId:         o.client_id || o.id,
        date:             o.date,
        time:             o.time || '',
        author_id:        o.author_id || '',
        author_name:      o.author_name || '',
        agence_id:        o.agence_id,
        ligne:            o.ligne || '',
        label:            o.label || '',
        motif:            o.motif || '',
        unit_price:       o.unit_price || o.amount || 0,
        quantity:         o.quantity || 1,
        total:            o.total || o.amount || 0,
        status:           o.status || 'EN_ATTENTE',
        synced:           true,
      }));
      await db.otherExpenses.bulkPut(local);
    }

    console.log('[Offline] Prefetch complete');
  } catch (err) {
    console.warn('[Offline] Prefetch failed (will retry when online):', err);
  }
}

// Re-export SyncEngine for convenience
export { SyncEngine };
