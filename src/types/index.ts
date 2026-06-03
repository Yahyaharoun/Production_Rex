export type Role = 'PDG' | 'CHEF_AGENCE' | 'CAISSIERE' | 'CHAUFFEUR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  agenceId?: string;
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  immatriculation: string;
  totalSeats: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'GARAGE';
  brand: string;
  model: string;
  lastMaintenance?: string;
  production_type?: 'VIP' | 'CLASSIQUE';
  driver_titulaire_name?: string;
  driver_titulaire_id?: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'REST';
}

export interface Production {
  id: string;
  date: string;
  vehicleId: string;
  driverId: string;
  agenceId: string;
  
  totalSeats: number;
  passengersAtDeparture: number;
  revenue: number; // Montant charger au depart
  
  expenses: {
    fuel: number;
    toll: number;
    washing: number;
    others: number;
  };
  
  netToDeposit: number;
  
  status: 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'REJECTED';
  production_type?: 'VIP' | 'CLASSIQUE';
  price_per_ticket?: number;
  comments?: string[];
  likes?: number;
  createdBy: string;
  createdAt: string;
}

export interface Agency {
  id: string;
  name: string;
  city: string;
  managerId: string;
}

export interface FuelExpense {
  id: string;
  date: string;
  time: string;
  user_id: string;
  user_name: string;
  ligne: string;
  agence_id?: string;
  vehicle_id?: string;
  immatriculation: string;
  category: 'VIP' | 'CLASSIQUE';
  amount: number;
  notes?: string;
  created_at?: string;
  clientId?: string;
  synced?: boolean;
}

export interface OtherExpense {
  id: string;
  date: string;
  time: string;
  author_id: string;
  author_name: string;
  agence_id?: string;
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
  created_at?: string;
  clientId?: string;
  synced?: boolean;
}

export interface Wash {
  id: string;
  date: string;
  time: string;
  vehicle_id: string;
  immatriculation: string;
  user_id: string;
  user_name: string;
  agence_id?: string;
  ligne?: string;
  amount: number;
  notes?: string;
  created_at?: string;
  clientId?: string;
  synced?: boolean;
}
