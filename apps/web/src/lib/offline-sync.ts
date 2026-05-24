export type OfflineListSyncState = {
  isOnline: boolean;
  pendingEditCount: number;
};

export type OfflineListSyncCopy = {
  badge: string;
  description: string;
  tone: 'synced' | 'pending' | 'offline';
};

export function listSyncCopy({ isOnline, pendingEditCount }: OfflineListSyncState): OfflineListSyncCopy {
  if (!isOnline) {
    return {
      badge: pendingEditCount > 0 ? `${pendingEditCount} pending offline ${pendingEditCount === 1 ? 'edit' : 'edits'}` : 'Offline mode',
      description: pendingEditCount > 0
        ? 'Your list changes are saved on this device and will reconcile when the connection returns.'
        : 'You can keep checking items off while offline. New edits will be queued on this device until sync resumes.',
      tone: 'offline'
    };
  }

  if (pendingEditCount > 0) {
    return {
      badge: `${pendingEditCount} ${pendingEditCount === 1 ? 'edit' : 'edits'} syncing`,
      description: 'Background sync is reconciling your latest shopping-list changes. Keep this tab open until the pending edits clear.',
      tone: 'pending'
    };
  }

  return {
    badge: 'Synced',
    description: 'Shopping-list edits are saved locally and ready for the next background sync check.',
    tone: 'synced'
  };
}
