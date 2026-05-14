export type Role = 'ADMIN' | 'CHEF_AGENCE' | 'CAISSIERE';

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
