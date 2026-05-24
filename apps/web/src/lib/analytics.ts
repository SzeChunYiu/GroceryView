export type ItemCardImpression = {
  itemId: string;
  itemName: string;
  listId: string;
  listIndex: number;
  compareMode: string;
  observedAt: string;
};

export type PriceAlertFunnelStep = 'button_click' | 'dialog_open' | 'form_submit' | 'success';

export type PriceAlertFunnelEvent = {
  productId: string;
  source: string;
  step: PriceAlertFunnelStep;
  targetPrice?: number;
  occurredAt: string;
};

const impressionEndpoint = '/api/analytics/item-card-impressions';
const priceAlertFunnelEndpoint = '/api/analytics/price-alert-funnel';
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

function sendAnalyticsPayload(endpoint: string, payload: string) {
  if (typeof window === 'undefined') return;

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(endpoint, {
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

export function trackPriceAlertFunnelStep(event: Omit<PriceAlertFunnelEvent, 'occurredAt'>) {
  if (typeof window === 'undefined') return;

  sendAnalyticsPayload(priceAlertFunnelEndpoint, JSON.stringify({
    events: [{
      ...event,
      occurredAt: new Date().toISOString()
    }]
  }));
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushItemCardImpressions);
}
