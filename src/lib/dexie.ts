import Dexie, { Table } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  clientId: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';
  retries: number;
  errorMessage?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface OfflineProduction {
  id?: string;
  clientId?: string;
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
  agence_id: string;
  caissiere_name: string;
  created_at: string;
  synced?: boolean;
}

export interface OfflineFuelExpense {
  id?: string;
  clientId?: string;
  date: string;
  time: string;
  user_id: string;
  user_name: string;
  ligne: string;
  agence_id: string;
  vehicle_id: string;
  immatriculation: string;
  category: 'VIP' | 'CLASSIQUE';
  amount: number;
  notes?: string;
  synced?: boolean;
}

export interface OfflineOtherExpense {
  id?: string;
  clientId?: string;
  date: string;
  time: string;
  author_id: string;
  author_name: string;
  agence_id: string;
  ligne: string;
  label: string;
  motif: string;
  unit_price: number;
  quantity: number;
  total: number;
  status: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';
  validator_id?: string;
  validator_name?: string;
  validated_at?: string;
  rejection_reason?: string;
  synced?: boolean;
}

export interface OfflineWash {
  id?: string;
  clientId?: string;
  date: string;
  time: string;
  vehicle_id: string;
  immatriculation: string;
  user_id: string;
  user_name: string;
  agence_id: string;
  ligne: string;
  amount: number;
  notes?: string;
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
  activityLog!: Table<any>;
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
  }
}

export const db = new RexDatabase();
