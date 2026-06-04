import { useAuthStore } from '../store/useAuthStore';

export const useRBAC = () => {
  const user = useAuthStore(s => s.user);
  const role = String(user?.role || '').toUpperCase();
  
  const can = (action: string, resource: string, agenceId?: string) => {
    if (role === 'PDG' || role === 'ADMIN') return true;
    if (role === 'CHEF_AGENCE') {
      if (agenceId && user?.agenceId !== agenceId) return false;
      return true; 
    }
    if (role === 'CAISSIERE') {
      if (action === 'write') return true;
      if (action === 'read') return true;
      return false;
    }
    // Agent de Recette : peut seulement saisir des productions
    if (role === 'AGENT_RECETTE') {
      if (resource === 'productions' && action === 'write') return true;
      if (resource === 'productions' && action === 'read') return true;
      return false;
    }
    if (role === 'CHAUFFEUR') {
      return false;
    }
    return false;
  };

  const isAdmin = role === 'PDG' || role === 'ADMIN';
  const isChef = role === 'CHEF_AGENCE';
  const isCaissier = role === 'CAISSIERE';
  const isChauffeur = role === 'CHAUFFEUR';
  const isAgentRecette = role === 'AGENT_RECETTE';

  return {
    user,
    can,
    isPDG: role === 'PDG',
    isAdmin,
    isChef,
    isCaissier,
    isChauffeur,
    isAgentRecette,
    canValidate: isAdmin || isChef,
    canDelete: isAdmin || isChef,
    canViewAllLines: isAdmin || isChef,
    canManageFuel: role !== 'CHAUFFEUR',
    canViewLogs: isAdmin || isChef,
    canAccessReports: isAdmin || isChef,
  };
};
