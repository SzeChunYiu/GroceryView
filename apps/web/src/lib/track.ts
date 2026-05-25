type TrackEventName = 'page_view' | 'cta_click' | 'search' | 'conversion';

type ConsentSnapshot = {
  policyVersion?: string;
  categories?: Partial<Record<'necessary' | 'analytics' | 'ads' | 'personalisation', boolean>>;
};

type TrackPayload = {
  name: TrackEventName;
  path?: string;
  target?: string;
  query?: string;
  conversion?: string;
  consentVersion: string;
  occurredAt: string;
};

declare global {
  interface Window {
    groceryviewConsent?: ConsentSnapshot;
  }
}

const consentPolicyVersion = '2026-05-22-consent-v1';
const consentStorageKey = 'groceryview:consent:state';
const clientEventName = 'groceryview_anonymous_client_event';

function storedConsent(): ConsentSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(consentStorageKey) || 'null') as ConsentSnapshot | null;
  } catch {
    return null;
  }
}

export function anonymousTrackingAllowed() {
  if (typeof window === 'undefined') return false;
  const consent = window.groceryviewConsent?.policyVersion === consentPolicyVersion ? window.groceryviewConsent : storedConsent();
  return consent?.policyVersion === consentPolicyVersion && consent.categories?.analytics === true;
}

function publishAnonymousEvent(payload: TrackPayload) {
  if (typeof window === 'undefined' || !anonymousTrackingAllowed()) return;
  window.dispatchEvent(new CustomEvent(clientEventName, { detail: payload }));
}

export function trackPageView(path = typeof window === 'undefined' ? '/' : window.location.pathname) {
  publishAnonymousEvent({ name: 'page_view', path, consentVersion: consentPolicyVersion, occurredAt: new Date().toISOString() });
}

export function trackCtaClick(target: string) {
  publishAnonymousEvent({ name: 'cta_click', target, consentVersion: consentPolicyVersion, occurredAt: new Date().toISOString() });
}

export function trackSearch(query: string) {
  publishAnonymousEvent({ name: 'search', query, consentVersion: consentPolicyVersion, occurredAt: new Date().toISOString() });
}

export function trackConversion(conversion: string) {
  publishAnonymousEvent({ name: 'conversion', conversion, consentVersion: consentPolicyVersion, occurredAt: new Date().toISOString() });
}
