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

export type AffiliateLinkMetadata = {
  placement: 'deal_card' | 'store_link' | 'source_link';
  surface: string;
  retailerName: string;
  destinationUrl: string;
  productId?: string;
  dealId?: string;
  campaignId?: string;
  sponsored?: boolean;
};

export type AffiliateOutboundClickEvent = AffiliateLinkMetadata & {
  disclosureLabel: string;
  observedAt: string;
};

const affiliateOutboundEndpoint = '/api/analytics/affiliate-outbound-clicks';
const groceryViewAffiliateSource = 'groceryview';

export function affiliateDisclosureLabel(metadata: Pick<AffiliateLinkMetadata, 'retailerName' | 'sponsored'>) {
  const prefix = metadata.sponsored === false ? 'Outbound store link' : 'Affiliate link';
  return `${prefix}: GroceryView may earn a commission from ${metadata.retailerName}; deal ranking and savings math stay independent.`;
}

export function buildAffiliateOutboundUrl(metadata: AffiliateLinkMetadata) {
  const url = new URL(metadata.destinationUrl);
  url.searchParams.set('utm_source', groceryViewAffiliateSource);
  url.searchParams.set('utm_medium', metadata.sponsored === false ? 'outbound_store' : 'affiliate');
  url.searchParams.set('utm_campaign', metadata.campaignId ?? metadata.surface);
  url.searchParams.set('gv_affiliate_disclosure', metadata.sponsored === false ? 'outbound' : 'affiliate');
  if (metadata.productId) url.searchParams.set('gv_product_id', metadata.productId);
  if (metadata.dealId) url.searchParams.set('gv_deal_id', metadata.dealId);
  return url.toString();
}

function sendAffiliateOutboundClick(event: AffiliateOutboundClickEvent) {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({ event });
  window.dispatchEvent(new CustomEvent('groceryview:affiliate-outbound-click', { detail: event }));
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(affiliateOutboundEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(affiliateOutboundEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export function trackAffiliateOutboundClick(metadata: AffiliateLinkMetadata) {
  sendAffiliateOutboundClick({
    ...metadata,
    disclosureLabel: affiliateDisclosureLabel(metadata),
    observedAt: new Date().toISOString()
  });
}

export function affiliateOutboundClickScript(metadata: AffiliateLinkMetadata) {
  const payload = JSON.stringify({
    ...metadata,
    disclosureLabel: affiliateDisclosureLabel(metadata)
  }).replace(/</g, '\\u003c');

  return `(() => {
    const event = { ...${payload}, observedAt: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent('groceryview:affiliate-outbound-click', { detail: event }));
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon && navigator.sendBeacon('${affiliateOutboundEndpoint}', new Blob([body], { type: 'application/json' }))) return;
    fetch('${affiliateOutboundEndpoint}', { body, headers: { 'content-type': 'application/json' }, keepalive: true, method: 'POST' }).catch(() => undefined);
  })();`;
}
