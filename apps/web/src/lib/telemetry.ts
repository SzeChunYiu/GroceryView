export type SearchTelemetryEventType =
  | 'search_suggestions_requested'
  | 'search_stream_event'
  | 'search_suggestions_returned'
  | 'search_first_result_time'
  | 'search_suggestion_clicked'
  | 'search_suggestions_dismissed';

export type SearchTelemetryEvent = {
  eventType: SearchTelemetryEventType;
  query: string;
  resultCount?: number;
  resultId?: string;
  resultRank?: number;
  elapsedMs?: number;
  streamEvent?: string;
  reason?: string;
  observedAt: string;
};

const consentPolicyVersion = '2026-05-22-consent-v1';
const consentStorageKey = 'groceryview:consent:state';

type ConsentCategories = Record<'necessary' | 'analytics' | 'ads' | 'personalisation', boolean>;

type ConsentSnapshot = {
  policyVersion?: string;
  categories?: Partial<ConsentCategories>;
};

function analyticsConsentGranted() {
  if (typeof window === 'undefined') return false;

  const runtimeConsent = (window as Window & { groceryviewConsent?: ConsentSnapshot }).groceryviewConsent;
  if (runtimeConsent?.policyVersion === consentPolicyVersion) {
    return runtimeConsent.categories?.analytics === true;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(consentStorageKey) || 'null') as ConsentSnapshot | null;
    return stored?.policyVersion === consentPolicyVersion && stored.categories?.analytics === true;
  } catch {
    return false;
  }
}

const searchTelemetryEndpoint = '/api/search/telemetry';
const maxBatchSize = 20;
const flushDelayMs = 1000;

let pendingSearchEvents: SearchTelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function clearFlushTimer() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function sendSearchTelemetryBatch(events: SearchTelemetryEvent[]) {
  if (events.length === 0 || typeof window === 'undefined' || !analyticsConsentGranted()) return;

  const payload = JSON.stringify({ events });
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(searchTelemetryEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(searchTelemetryEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export function flushSearchTelemetry() {
  clearFlushTimer();
  const events = pendingSearchEvents;
  pendingSearchEvents = [];
  sendSearchTelemetryBatch(events);
}

function scheduleFlush() {
  if (flushTimer || typeof window === 'undefined') return;
  flushTimer = setTimeout(flushSearchTelemetry, flushDelayMs);
}

export function trackSearchTelemetry(event: Omit<SearchTelemetryEvent, 'observedAt'>) {
  if (typeof window === 'undefined' || !analyticsConsentGranted()) return;

  pendingSearchEvents.push({
    ...event,
    observedAt: new Date().toISOString()
  });

  if (pendingSearchEvents.length >= maxBatchSize) {
    flushSearchTelemetry();
  } else {
    scheduleFlush();
  }
}

export function trackSearchStreamEvent(query: string, streamEvent: string, elapsedMs?: number) {
  trackSearchTelemetry({
    elapsedMs,
    eventType: 'search_stream_event',
    query,
    streamEvent
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSearchTelemetry);
}
