import { useState, useEffect } from 'react';
import { db } from '../../../lib/dexie';

export function useVehicleAutocomplete() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      const v = await db.vehicles.toArray();
      setVehicles(v);
    };
    fetchVehicles();
  }, []);

  const searchVehicles = (query: string) => {
    if (!query) return [];
    const q = query.toLowerCase().replace(/\s/g, '');
    return vehicles.filter(v => v.immatriculation.toLowerCase().replace(/\s/g, '').includes(q)).slice(0, 5);
  };

  const getVehicleByImmat = (immat: string) => {
    return vehicles.find(v => v.immatriculation.toLowerCase().replace(/\s/g, '') === immat.toLowerCase().replace(/\s/g, ''));
  };

  return {
    vehicles,
    searchVehicles,
    getVehicleByImmat
  };
}
