export type QueuedListEdit = {
  id: string;
  itemId: string;
  action: 'toggle';
  createdAt: string;
};

export type QueuedScanEvent = {
  id: string;
  barcode: string;
  createdAt: string;
};

type QueueStore = 'listEdits' | 'scanEvents';

const DB_NAME = 'groceryview-offline';
const DB_VERSION = 1;
const LIST_STORE: QueueStore = 'listEdits';
const SCAN_STORE: QueueStore = 'scanEvents';

function canUseIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function createQueueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function openOfflineDb(): Promise<IDBDatabase> {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(LIST_STORE)) {
        db.createObjectStore(LIST_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(SCAN_STORE)) {
        db.createObjectStore(SCAN_STORE, { keyPath: 'id' });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(storeName: QueueStore, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T> | void) {
  const db = await openOfflineDb();

  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = callback(store);

    tx.oncomplete = () => {
      db.close();
      resolve(request ? request.result : undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function cacheListEdit(edit: Omit<QueuedListEdit, 'id' | 'createdAt'>) {
  const queued: QueuedListEdit = {
    ...edit,
    id: createQueueId('list'),
    createdAt: new Date().toISOString(),
  };

  await withStore(LIST_STORE, 'readwrite', (store) => store.put(queued));
  return queued;
}

export async function cacheScanEvent(scan: Omit<QueuedScanEvent, 'id' | 'createdAt'>) {
  const queued: QueuedScanEvent = {
    ...scan,
    id: createQueueId('scan'),
    createdAt: new Date().toISOString(),
  };

  await withStore(SCAN_STORE, 'readwrite', (store) => store.put(queued));
  return queued;
}

export async function getCachedListEdits() {
  return (await withStore<QueuedListEdit[]>(LIST_STORE, 'readonly', (store) => store.getAll())) ?? [];
}

export async function getCachedScanEvents() {
  return (await withStore<QueuedScanEvent[]>(SCAN_STORE, 'readonly', (store) => store.getAll())) ?? [];
}

async function clearStore(storeName: QueueStore) {
  await withStore(storeName, 'readwrite', (store) => store.clear());
}

export async function getOfflineQueueCounts() {
  const [listEdits, scanEvents] = await Promise.all([getCachedListEdits(), getCachedScanEvents()]);

  return {
    listEdits: listEdits.length,
    scanEvents: scanEvents.length,
  };
}

export async function syncOfflineQueue() {
  const counts = await getOfflineQueueCounts();

  if (counts.listEdits > 0) {
    await clearStore(LIST_STORE);
  }

  if (counts.scanEvents > 0) {
    await clearStore(SCAN_STORE);
  }

  return counts;
}
