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
const CONSENT_STORAGE_KEY = 'groceryview:consent:state';
const CONSENT_POLICY_VERSION = '2026-05-22-consent-v1';

type StoredConsent = { policyVersion?: string; categories?: { analytics?: boolean; ads?: boolean; personalisation?: boolean; necessary?: boolean } };

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

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.policyVersion !== CONSENT_POLICY_VERSION) return false;
    return parsed.categories?.analytics === true;
  } catch {
    return false;
  }
}

function sendImpressionBatch(events: ItemCardImpression[]) {
  if (events.length === 0 || typeof window === 'undefined' || !hasAnalyticsConsent()) return;

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
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

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
