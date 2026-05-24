type TrackEventName = 'page_view' | 'cta_click' | 'search' | 'conversion';

type TrackPayload = {
  name: TrackEventName;
  path?: string;
  meta?: Record<string, string | number | boolean>;
};

const CONSENT_STORAGE_KEY = 'groceryview:consent:state';
const EVENT_ENDPOINT = '/api/events/anonymous';

function analyticsConsentGranted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || 'null') as { categories?: { analytics?: boolean } } | null;
    return parsed?.categories?.analytics === true;
  } catch {
    return false;
  }
}

function cleanMeta(meta: TrackPayload['meta']): TrackPayload['meta'] {
  if (!meta) return undefined;
  return Object.fromEntries(Object.entries(meta).filter(([key]) => !/email|user|name|phone|token|session/i.test(key))) as Record<string, string | number | boolean>;
}

export function trackAnonymousEvent(payload: TrackPayload): void {
  if (!analyticsConsentGranted()) return;
  const body = JSON.stringify({
    name: payload.name,
    path: payload.path ?? window.location.pathname,
    timestamp: new Date().toISOString(),
    ...(cleanMeta(payload.meta) ? { meta: cleanMeta(payload.meta) } : {})
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(EVENT_ENDPOINT, new Blob([body], { type: 'application/json' }));
    return;
  }

  void fetch(EVENT_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true });
}

export function trackPageView(path?: string): void {
  trackAnonymousEvent({ name: 'page_view', path });
}

export function trackCtaClick(cta: string): void {
  trackAnonymousEvent({ name: 'cta_click', meta: { cta } });
}

export function trackSearch(queryLength: number): void {
  trackAnonymousEvent({ name: 'search', meta: { queryLength } });
}

export function trackConversion(kind: string): void {
  trackAnonymousEvent({ name: 'conversion', meta: { kind } });
}
