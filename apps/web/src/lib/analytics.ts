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

type FunnelDeviceSegment = 'desktop' | 'mobile' | 'tablet' | 'unknown';
type FunnelAccountSegment = 'guest' | 'account' | 'unknown';

const impressionEndpoint = '/api/analytics/item-card-impressions';
const searchToSavingsFunnelEndpoint = '/api/analytics/search-to-savings-funnel';
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

export type ProductAnalyticsSignalId =
  | 'search_volume'
  | 'zero_result_queries'
  | 'list_adds'
  | 'alert_creates'
  | 'deal_clicks';

export type ProductAnalyticsMetric = {
  id: ProductAnalyticsSignalId;
  label: string;
  currentValueLabel: string;
  eventName: string;
  owner: string;
  priorityUse: string;
  sourceRoute: string;
  status: 'instrumented' | 'ready' | 'planned';
};

export const productAnalyticsDashboard = {
  title: 'Product analytics dashboard',
  windowLabel: 'Runtime aggregate window',
  privacyGuardrail: 'Dashboard metrics use aggregate event counts and route-level labels only; no search terms, user IDs, product IDs, or basket contents are rendered here.',
  summary: [
    {
      label: 'Tracked signals',
      value: '5',
      detail: 'Search volume, zero-result queries, list adds, alert creates, and deal clicks.'
    },
    {
      label: 'Live aggregate source',
      value: '/api/analytics/search-to-savings-funnel',
      detail: 'Existing funnel endpoint covers search, product, compare, alert, basket, and savings steps.'
    },
    {
      label: 'Personal data rendered',
      value: '0',
      detail: 'Only aggregate operational signals are displayed on the internal source dashboard.'
    }
  ],
  metrics: [
    {
      id: 'search_volume',
      label: 'Search volume',
      currentValueLabel: 'landing_search events',
      eventName: 'landing_search',
      owner: 'Catalogue growth',
      priorityUse: 'Prioritize broad catalogue coverage and ranking improvements.',
      sourceRoute: '/api/analytics/search-to-savings-funnel',
      status: 'instrumented'
    },
    {
      id: 'zero_result_queries',
      label: 'Zero-result queries',
      currentValueLabel: 'aggregate zero-result count',
      eventName: 'zero_result_query',
      owner: 'Search quality',
      priorityUse: 'Turn failed searches into aliases, missing categories, or ingestion targets.',
      sourceRoute: '/search',
      status: 'ready'
    },
    {
      id: 'list_adds',
      label: 'List adds',
      currentValueLabel: 'aggregate add-to-list count',
      eventName: 'list_add',
      owner: 'Shopping list activation',
      priorityUse: 'Find products and categories that convert from browsing into planning.',
      sourceRoute: '/list',
      status: 'ready'
    },
    {
      id: 'alert_creates',
      label: 'Alert creates',
      currentValueLabel: 'watchlist_alert events',
      eventName: 'watchlist_alert',
      owner: 'Retention',
      priorityUse: 'Measure price-drop and threshold alert creation as a repeat-use signal.',
      sourceRoute: '/api/alerts',
      status: 'instrumented'
    },
    {
      id: 'deal_clicks',
      label: 'Deal clicks',
      currentValueLabel: 'aggregate outbound deal clicks',
      eventName: 'deal_click',
      owner: 'Deal discovery',
      priorityUse: 'Rank deal cards and source partnerships by shopper intent.',
      sourceRoute: '/deals',
      status: 'ready'
    }
  ] satisfies ProductAnalyticsMetric[]
};
