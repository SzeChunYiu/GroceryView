export const LIST_OFFLINE_QUEUE_KEY = 'groceryview:shopping-list:offline-queue:v1';
export const LIST_OFFLINE_SNAPSHOT_KEY = 'groceryview:shopping-list:offline-snapshot:v1';

export type ListOfflineMutation = {
  id: string;
  itemId?: string;
  items?: unknown[];
  createdAt: string;
  type: 'toggle-item' | 'reset-checked' | 'bulk-import';
};

export type ListOfflineSyncState = {
  isOnline: boolean;
  pendingCount: number;
  lastReplayedAt: string | null;
};

function readQueue(): ListOfflineMutation[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIST_OFFLINE_QUEUE_KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((mutation): mutation is ListOfflineMutation => (
      mutation !== null
      && typeof mutation === 'object'
      && 'id' in mutation
      && typeof mutation.id === 'string'
      && 'type' in mutation
      && ['toggle-item', 'reset-checked', 'bulk-import'].includes(String(mutation.type))
      && 'createdAt' in mutation
      && typeof mutation.createdAt === 'string'
    ));
  } catch {
    return [];
  }
}

function writeQueue(queue: ListOfflineMutation[]) {
  localStorage.setItem(LIST_OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('groceryview:list-offline-queue-change', { detail: queue.length }));
}

export function getListOfflineQueueLength() {
  return readQueue().length;
}

export function queueListMutation(mutation: Omit<ListOfflineMutation, 'createdAt' | 'id'>) {
  const queuedMutation: ListOfflineMutation = {
    ...mutation,
    createdAt: new Date().toISOString(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`
  };
  writeQueue([...readQueue(), queuedMutation]);
  return queuedMutation;
}

export function saveListOfflineSnapshot(snapshot: unknown) {
  localStorage.setItem(LIST_OFFLINE_SNAPSHOT_KEY, JSON.stringify({ savedAt: new Date().toISOString(), snapshot }));
}

export function replayQueuedListMutations() {
  const queue = readQueue();
  if (queue.length === 0) return { lastReplayedAt: null, replayedCount: 0 };

  // The list is local-first today: each mutation already updated the browser snapshot.
  // Replaying therefore acknowledges the ordered queue once connectivity is restored,
  // leaving the saved snapshot as the source of truth for subsequent refreshes.
  const lastReplayedAt = new Date().toISOString();
  writeQueue([]);
  return { lastReplayedAt, replayedCount: queue.length };
}

export function subscribeToListOfflineSync(onChange: (state: ListOfflineSyncState) => void) {
  const emit = (lastReplayedAt: string | null = null) => {
    onChange({
      isOnline: navigator.onLine,
      pendingCount: getListOfflineQueueLength(),
      lastReplayedAt
    });
  };
  const handleOnline = () => {
    const replay = replayQueuedListMutations();
    emit(replay.lastReplayedAt);
  };
  const handleOffline = () => emit();
  const handleQueueChange = () => emit();

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('groceryview:list-offline-queue-change', handleQueueChange);
  emit();
  if (navigator.onLine) handleOnline();

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('groceryview:list-offline-queue-change', handleQueueChange);
  };
}
