import React, { useEffect, ReactNode } from 'react';
import { SyncEngine } from '../lib/sync';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from 'sonner';

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Initialize pending count
    SyncEngine.updatePendingCount();
    
    // Initial sync if online
    if (navigator.onLine) {
      SyncEngine.syncAll();
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      toast.success('Connexion Internet rétablie. Synchronisation des données...');
      SyncEngine.syncAll();
    } else {
      toast.warning('Vous êtes hors ligne. Les données seront sauvegardées localement.');
    }
  }, [isOnline]);

  return <>{children}</>;
};
