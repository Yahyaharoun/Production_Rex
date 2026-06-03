import { useAuthStore } from '../store/useAuthStore';

type Permission = 'read' | 'write' | 'validate' | 'delete';
type Module = 'production' | 'fuel' | 'other_expenses' | 'wash' | 'vehicle' | 'report' | 'user' | 'activity_log';

export function useRBAC() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.toUpperCase() || '';
  
  // PDG / Direction Générale
  const isPDG = role === 'PDG' || role === 'ADMIN';
  
  // Chef d'Agence
  const isChef = role === 'CHEF_AGENCE' || role === 'CHEF D\'AGENCE' || role === 'CHEF AGENCE';
  
  // Caissière
  const isCaissiere = role === 'CAISSIERE';
  
  const userAgenceId = user?.agenceId || '';

  const can = (permission: Permission, module: Module, targetAgenceId?: string): boolean => {
    if (isPDG) return true; // Accès complet

    if (isChef) {
      if (permission === 'read') return true; // Lecture toutes lignes
      if (permission === 'write' || permission === 'validate' || permission === 'delete') {
        // Validation / Écriture : uniquement sa ligne
        return targetAgenceId === userAgenceId; 
      }
    }

    if (isCaissiere) {
      if (module === 'activity_log') return false;
      if (permission === 'validate' || permission === 'delete') return false; // Jamais de validation/suppression
      if (permission === 'read' || permission === 'write') {
        // Lecture/Écriture : uniquement sa ligne
        return targetAgenceId === userAgenceId;
      }
    }

    return false;
  };

  return { can, isPDG, isChef, isCaissiere, userAgenceId, user };
}
