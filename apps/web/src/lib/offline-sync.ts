export type OfflineListSyncCopyTone = 'emerald' | 'amber' | 'sky';

export type OfflineListSyncCopy = {
  tone: OfflineListSyncCopyTone;
  label: string;
  helper: string;
  detail: string;
};

export type OfflineListSyncCopyInput = {
  isOnline: boolean;
  pendingEdits: number;
  lastSyncedAt?: string | null;
};

export const OFFLINE_LIST_EDIT_RECONCILIATION_STEPS = [
  'Every offline change is saved on this device first, so check marks and item edits remain visible after reload.',
  'Pending edits stay highlighted until GroceryView confirms the background sync completed.',
  'If another household member changed the same item, keep shopping with the local copy and review the conflict prompt before checkout.'
] as const;

export function offlineListSyncStatusCopy({ isOnline, lastSyncedAt, pendingEdits }: OfflineListSyncCopyInput): OfflineListSyncCopy {
  if (pendingEdits > 0) {
    return {
      tone: 'amber',
      label: `${pendingEdits} pending offline edit${pendingEdits === 1 ? '' : 's'}`,
      helper: isOnline ? 'Background sync is catching up.' : 'Offline mode is active; changes are queued locally.',
      detail: 'Keep shopping normally. GroceryView will reconcile these list edits when the connection is stable.'
    };
  }

  if (!isOnline) {
    return {
      tone: 'sky',
      label: 'Offline copy ready',
      helper: 'No unsynced edits are waiting right now.',
      detail: 'New edits will be marked pending and queued on this device until you are back online.'
    };
  }

  return {
    tone: 'emerald',
    label: 'List synced',
    helper: lastSyncedAt ? `Last confirmed ${lastSyncedAt}.` : 'No pending edits.',
    detail: 'Your shopping list is current; future offline edits will show a pending badge until sync completes.'
  };
}
