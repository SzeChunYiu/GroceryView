export type ItemCardImpression = {
  itemId: string;
  itemName: string;
  listId: string;
  listIndex: number;
  compareMode: string;
  observedAt: string;
};

const impressionEndpoint = '/api/analytics/item-card-impressions';
const maxBatchSize = 20;
const flushDelayMs = 1200;

let pendingImpressions: ItemCardImpression[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function clearFlushTimer() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function payloadFor(events: ItemCardImpression[]) {
  return JSON.stringify({ events });
}

function sendImpressionBatch(events: ItemCardImpression[]) {
  if (events.length === 0 || typeof window === 'undefined') return;

  const payload = payloadFor(events);
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(impressionEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(impressionEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export function flushItemCardImpressions() {
  clearFlushTimer();
  const events = pendingImpressions;
  pendingImpressions = [];
  sendImpressionBatch(events);
}

function scheduleFlush() {
  if (flushTimer || typeof window === 'undefined') return;
  flushTimer = setTimeout(flushItemCardImpressions, flushDelayMs);
}

export function trackItemCardImpression(event: Omit<ItemCardImpression, 'observedAt'>) {
  if (typeof window === 'undefined') return;

  pendingImpressions.push({
    ...event,
    observedAt: new Date().toISOString()
  });

  if (pendingImpressions.length >= maxBatchSize) {
    flushItemCardImpressions();
  } else {
    scheduleFlush();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushItemCardImpressions);
}
