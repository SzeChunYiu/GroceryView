export type ItemCardImpression = {
  itemId: string;
  itemName: string;
  listId: string;
  listIndex: number;
  compareMode: string;
  observedAt: string;
};

export type SearchToSavingsFunnelStepId =
  | 'landing_search'
  | 'product_view'
  | 'compare_view'
  | 'watchlist_alert'
  | 'basket_view'
  | 'savings_action';

export type CoreProductFunnelId =
  | 'search_to_product'
  | 'product_to_alert'
  | 'list_to_store'
  | 'deal_click';

export type CoreProductFunnelEventName = 'entry' | 'success';

export type CoreProductFunnelDefinition = {
  id: CoreProductFunnelId;
  label: string;
  entryEvent: string;
  successEvent: string;
  strategyQuestion: string;
};

export const coreProductFunnelDefinitions: CoreProductFunnelDefinition[] = [
  {
    id: 'search_to_product',
    label: 'Search to product',
    entryEvent: 'landing_search',
    successEvent: 'product_view',
    strategyQuestion: 'Which search paths create product detail engagement?'
  },
  {
    id: 'product_to_alert',
    label: 'Product to alert',
    entryEvent: 'product_view',
    successEvent: 'watchlist_alert',
    strategyQuestion: 'Which product pages motivate shoppers to save a price target?'
  },
  {
    id: 'list_to_store',
    label: 'List to store',
    entryEvent: 'basket_view',
    successEvent: 'store_directions_click',
    strategyQuestion: 'Which shopping-list flows lead to store intent?'
  },
  {
    id: 'deal_click',
    label: 'Deal click',
    entryEvent: 'deal_card_view',
    successEvent: 'savings_action',
    strategyQuestion: 'Which deal modules create measurable savings actions?'
  }
];

export function getCoreProductFunnelDashboardRows() {
  return coreProductFunnelDefinitions.map((funnel) => ({
    ...funnel,
    status: 'tracking-ready' as const,
    currentWindow: 'Awaiting aggregate event export',
    privacyGuardrail: 'Uses aggregate event names only; no product ids, user ids, search terms, or prices are displayed in admin.'
  }));
}

type FunnelDeviceSegment = 'desktop' | 'mobile' | 'tablet' | 'unknown';
type FunnelAccountSegment = 'guest' | 'account' | 'unknown';

const impressionEndpoint = '/api/analytics/item-card-impressions';
const searchToSavingsFunnelEndpoint = '/api/analytics/search-to-savings-funnel';
const coreProductFunnelEndpoint = '/api/analytics/core-product-funnels';
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

function currentFunnelDevice(): FunnelDeviceSegment {
  if (typeof window === 'undefined') return 'unknown';
  if (window.matchMedia('(max-width: 640px)').matches) return 'mobile';
  if (window.matchMedia('(max-width: 1024px)').matches) return 'tablet';
  return 'desktop';
}

function currentFunnelMarket() {
  if (typeof document === 'undefined') return 'unknown';
  const locale = document.documentElement.lang || navigator.language || 'unknown';
  const region = locale.toLocaleLowerCase('en-US').startsWith('sv') ? 'se' : (locale.split('-')[1] ?? locale);
  return /^[a-z]{2}$/i.test(region) ? region.toLocaleLowerCase('en-US') : 'unknown';
}

function currentFunnelAccountState(): FunnelAccountSegment {
  if (typeof window === 'undefined') return 'unknown';
  try {
    return window.sessionStorage.getItem('groceryview:accessToken') || window.sessionStorage.getItem('groceryview:userId')
      ? 'account'
      : 'guest';
  } catch {
    return 'unknown';
  }
}

export function trackSearchToSavingsFunnelStep(step: SearchToSavingsFunnelStepId) {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({
    events: [{
      step,
      count: 1,
      market: currentFunnelMarket(),
      device: currentFunnelDevice(),
      accountState: currentFunnelAccountState()
    }]
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(searchToSavingsFunnelEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(searchToSavingsFunnelEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export function trackCoreProductFunnelEvent(funnelId: CoreProductFunnelId, eventName: CoreProductFunnelEventName) {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({
    events: [{
      funnelId,
      eventName,
      market: currentFunnelMarket(),
      device: currentFunnelDevice(),
      accountState: currentFunnelAccountState(),
      count: 1
    }]
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(coreProductFunnelEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(coreProductFunnelEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export type StoreEngagementEvent = {
  action: 'store_page_view' | 'store_directions_click';
  brand: string;
  observedAt: string;
  storeName: string;
  storeSlug: string;
};

type StoreEngagementInput = Omit<StoreEngagementEvent, 'action' | 'observedAt'>;

const storeEngagementEndpoint = '/api/analytics/store-engagement';

function dispatchStoreEngagementEvent(event: StoreEngagementEvent) {
  window.dispatchEvent(new CustomEvent('groceryview:store-engagement', { detail: event }));
}

function sendStoreEngagementEvent(event: StoreEngagementEvent) {
  if (typeof window === 'undefined') return;

  dispatchStoreEngagementEvent(event);
  const payload = JSON.stringify({ event });
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(storeEngagementEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(storeEngagementEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export function trackStorePageView(event: StoreEngagementInput) {
  sendStoreEngagementEvent({
    ...event,
    action: 'store_page_view',
    observedAt: new Date().toISOString()
  });
}

export function trackStoreDirectionsClick(event: StoreEngagementInput) {
  sendStoreEngagementEvent({
    ...event,
    action: 'store_directions_click',
    observedAt: new Date().toISOString()
  });
}

export function storePageViewScript(event: StoreEngagementInput) {
  const payload = JSON.stringify(event).replace(/</g, '\\u003c');

  return `(() => {
    const event = { ...${payload}, action: 'store_page_view', observedAt: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent('groceryview:store-engagement', { detail: event }));
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon && navigator.sendBeacon('${storeEngagementEndpoint}', new Blob([body], { type: 'application/json' }))) return;
    fetch('${storeEngagementEndpoint}', { body, headers: { 'content-type': 'application/json' }, keepalive: true, method: 'POST' }).catch(() => undefined);
  })();`;
}
