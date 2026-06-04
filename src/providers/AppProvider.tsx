import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode, useEffect } from 'react';
import { Toaster } from 'sonner';
import { prefetchForOffline } from '../services/offlineService';
import { SyncEngine } from '../lib/sync';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

interface AppProviderProps {
  children: ReactNode;
}

// Inner component that has access to auth store
const OfflineManager: React.FC = () => {
  const isOnline = useOnlineStatus();
  const user = useAuthStore((s) => s.user);

  // On mount: initial sync + prefetch
  useEffect(() => {
    SyncEngine.updatePendingCount();
    if (navigator.onLine) {
      SyncEngine.syncAll();
      prefetchForOffline(user?.agenceId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On connectivity change
  useEffect(() => {
    if (isOnline) {
      toast.success('Connexion rétablie. Synchronisation en cours...');
      SyncEngine.syncAll();
      prefetchForOffline(user?.agenceId);
    } else {
      toast.warning('Hors ligne. Les données locales sont disponibles.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return null;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineManager />
      {children}
      <Toaster position="top-right" richColors theme="dark" />
    </QueryClientProvider>
  );
};
