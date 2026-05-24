export type QueueLevel = 'quiet' | 'steady' | 'busy';

export type StoreQueueInput = {
  brand?: string | null;
  district?: string | null;
  name?: string | null;
  slug: string;
};

export type StoreQueueEstimate = {
  color: string;
  label: string;
  level: QueueLevel;
  minutes: number;
  refreshedAt: string;
};

export const STORE_QUEUE_REFRESH_INTERVAL_MS = 45_000;

function hashStore(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }
  return hash;
}

function demandForHour(hour: number): number {
  if (hour >= 16 && hour <= 18) return 10;
  if (hour >= 11 && hour <= 13) return 6;
  if (hour >= 8 && hour <= 10) return 4;
  if (hour >= 19 && hour <= 21) return 5;
  return 2;
}

function chainDemand(store: StoreQueueInput): number {
  const label = `${store.brand ?? ''} ${store.name ?? ''}`.toLowerCase();
  if (/maxi|city gross|stora coop/.test(label)) return 4;
  if (/ica|willys|lidl|hemk[oö]p|coop/.test(label)) return 2;
  return 1;
}

function queueLevel(minutes: number): QueueLevel {
  if (minutes >= 14) return 'busy';
  if (minutes >= 7) return 'steady';
  return 'quiet';
}

function queueColor(level: QueueLevel): string {
  if (level === 'busy') return '#D94F3D';
  if (level === 'steady') return '#F59E0B';
  return '#1D8649';
}

export function estimateStoreQueue(store: StoreQueueInput, now = new Date()): StoreQueueEstimate {
  const rollingWindow = Math.floor(now.getTime() / STORE_QUEUE_REFRESH_INTERVAL_MS);
  const jitter = hashStore(`${store.slug}:${rollingWindow}`) % 5;
  const minutes = Math.min(24, demandForHour(now.getHours()) + chainDemand(store) + jitter);
  const level = queueLevel(minutes);

  return {
    color: queueColor(level),
    label: `${minutes}-${minutes + 3} min wait`,
    level,
    minutes,
    refreshedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export function buildStoreQueueSnapshot<T extends StoreQueueInput>(stores: readonly T[], now = new Date()) {
  return Object.fromEntries(stores.map((store) => [store.slug, estimateStoreQueue(store, now)]));
}
