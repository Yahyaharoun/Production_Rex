import Dexie, { Table } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  clientId: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  status: 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED' | 'ERROR';
  retries: number;
  errorMessage?: string;
  createdAt: number;
  syncedAt?: number;
}

export interface OfflineProduction {
  id?: string;
  clientId: string;
  immatriculation: string;
  driver_name: string;
  total_seats: number;
  passengers_at_departure: number;
  revenue: number;
  expense_fuel: number;
  expense_toll: number;
  expense_washing: number;
  expense_others: number;
  net_to_deposit: number;
  production_type: 'VIP' | 'CLASSIQUE';
  price_per_ticket: number;
  date: string;
  status: string;
  ligne: string;
  agence_id?: string;
  caissiere_name: string;
  created_at: string;
  synced?: boolean;
  syncStatus?: string;
}

export interface OfflineFuelExpense {
  id?: string;
  clientId: string;
  date: string;
  vehicleImmat: string;
  vehicle_immat?: string;
  lineName?: string;
  line_name?: string;
  agenceId?: string;
  agence_id?: string;
  category: 'VIP' | 'CLASSIQUE';
  amount: number;
  notes?: string;
  caissiere_name?: string;
  created_by?: string;
  synced?: boolean;
  syncStatus?: string;
  createdAt: number;
}

export interface OfflineOtherExpense {
  id?: string;
  clientId: string;
  date: string;
  agence_id?: string;
  agenceId?: string;
  label: string;
  reason?: string;
  motif?: string;
  amount: number;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';
  caissiere_name?: string;
  author_name?: string;
  created_by?: string;
  validated_by?: string;
  validated_at?: string;
  rejection_note?: string;
  synced?: boolean;
  syncStatus?: string;
  createdAt?: number;
}

export interface OfflineWash {
  id?: string;
  clientId: string;
  date: string;
  vehicleImmat: string;
  vehicle_immat?: string;
  agenceId?: string;
  agence_id?: string;
  amount: number;
  caissiere_name?: string;
  created_by?: string;
  notes?: string;
  synced?: boolean;
  syncStatus?: string;
  createdAt: number;
}

export interface OfflineActivityLog {
  id?: number;
  clientId: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  user_id?: string;
  user_email?: string;
  description?: string;
  record_data?: any;
  table_name?: string;
  created_at: string;
  synced?: boolean;
}

export class RexDatabase extends Dexie {
  productions!: Table<OfflineProduction>;
  fuelExpenses!: Table<OfflineFuelExpense>;
  otherExpenses!: Table<OfflineOtherExpense>;
  washes!: Table<OfflineWash>;
  vehicles!: Table<any>;
  agencies!: Table<any>;
  drivers!: Table<any>;
  activityLog!: Table<OfflineActivityLog>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('RexOfflineDB');

    this.version(1).stores({
      productions:  'clientId, date, agence_id, synced, immatriculation',
      fuelExpenses: 'clientId, date, agence_id, category, synced',
      otherExpenses:'clientId, date, agence_id, status, synced',
      washes:       'clientId, date, vehicle_id, synced, [vehicle_id+date]',
      vehicles:     'id, immatriculation, status, production_type',
      agencies:     'id, name',
      drivers:      'id, name, status',
      activityLog:  'clientId, created_at, action, entity_type',
      syncQueue:    '++id, clientId, table, status, createdAt',
    });

    // Version 2: fix washes index to include vehicleImmat
    this.version(2).stores({
      productions:  'clientId, date, agence_id, synced, immatriculation',
      fuelExpenses: 'clientId, date, vehicleImmat, agenceId, category, synced',
      otherExpenses:'clientId, date, agence_id, status, synced',
      washes:       'clientId, date, vehicleImmat, agenceId, synced',
      vehicles:     'id, immatriculation, status, production_type',
      agencies:     'id, name',
      drivers:      'id, name, status',
      activityLog:  '++id, clientId, created_at, action, entity_type, synced',
      syncQueue:    '++id, clientId, table, status, createdAt',
    });
  }
}

export const db = new RexDatabase();
