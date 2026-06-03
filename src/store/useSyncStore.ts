import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  error: string | null;
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSyncedAt: (date: string) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  error: null,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setError: (error) => set({ error }),
}));
