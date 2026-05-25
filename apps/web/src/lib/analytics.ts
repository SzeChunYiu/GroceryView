export type PwaInstallAnalyticsAction =
  | 'prompt_impression'
  | 'banner_dismissed'
  | 'install_prompt_accepted'
  | 'install_prompt_dismissed'
  | 'app_installed'
  | 'standalone_launch';

export type PwaInstallAnalyticsEvent = {
  action: PwaInstallAnalyticsAction;
  platform: 'android' | 'desktop' | 'ios';
  canInstall: boolean;
  source: 'beforeinstallprompt' | 'install_banner' | 'appinstalled' | 'standalone_display';
  observedAt: string;
  launchSource?: string;
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
    const stored = JSON.parse(window.localStorage.getItem(consentStorageKey) || 'null') as ConsentSnapshot | null;
    return stored?.policyVersion === consentPolicyVersion && stored.categories?.analytics === true;
  } catch {
    return false;
  }
}

function publishConsentAwareAnalyticsEvent(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined' || !analyticsConsentGranted()) return;

  window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
  const analyticsWindow = window as Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.dataLayer.push({ event: eventName, ...payload });
  analyticsWindow.gtag?.('event', eventName, payload);
}

export function trackPwaInstallAnalytics(event: Omit<PwaInstallAnalyticsEvent, 'observedAt'>) {
  publishConsentAwareAnalyticsEvent('groceryview_pwa_install', {
    ...event,
    observedAt: new Date().toISOString()
  });
}

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

export type ProductConversionGoal =
  | 'search_to_product'
  | 'product_to_list'
  | 'alert_creation'
  | 'outbound_click';

export type ProductConversionEvent = {
  goal: ProductConversionGoal;
  route: string;
  count: number;
  observedAt: string;
};

export type ProductConversionRouteRollup = {
  route: string;
  searchToProductCount: number;
  productToListCount: number;
  alertCreationCount: number;
  outboundClickCount: number;
  listConversionRate: number | null;
  alertConversionRate: number | null;
  outboundClickRate: number | null;
};

export type ProductConversionDashboard = {
  available: boolean;
  generatedAt: string;
  observationCount: number;
  routes: ProductConversionRouteRollup[];
  totals: Omit<ProductConversionRouteRollup, 'route'>;
  guardrail: string;
};

export type RecentProductSearch = {
  query: string;
  href: string;
  resultCount: number;
  searchedAt: string;
};

export type VoiceSearchInputEvent = {
  query?: string;
  status: 'started' | 'submitted' | 'unsupported' | 'error';
  surface: string;
  observedAt: string;
};

export function trackVoiceSearchInput(event: Omit<VoiceSearchInputEvent, 'observedAt'>) {
  publishConsentAwareAnalyticsEvent('groceryview_voice_search_input', {
    ...event,
    observedAt: new Date().toISOString()
  });
}

export type ProductSearchPerformanceTelemetry = {
  cacheHit: boolean;
  cacheHitRate: number;
  latencyMs: number;
  observedAt: string;
  query: string;
  resultCount: number;
  source: string;
  timedOut: boolean;
  timeoutRate: number;
};

export type ProductSearchPerformanceSummary = {
  averageLatencyMs: number;
  averageResultCount: number;
  cacheHitRate: number;
  sampleSize: number;
  timeoutRate: number;
};

type FunnelDeviceSegment = 'desktop' | 'mobile' | 'tablet' | 'unknown';
type FunnelAccountSegment = 'guest' | 'account' | 'unknown';

const impressionEndpoint = '/api/analytics/item-card-impressions';
const searchToSavingsFunnelEndpoint = '/api/analytics/search-to-savings-funnel';
const productConversionGoals = ['search_to_product', 'product_to_list', 'alert_creation', 'outbound_click'] as const;
const funnelStepConversionGoals: Partial<Record<SearchToSavingsFunnelStepId, ProductConversionGoal>> = {
  basket_view: 'product_to_list',
  product_view: 'search_to_product',
  watchlist_alert: 'alert_creation'
};
export const recentProductSearchesStorageKey = 'groceryview:recent-product-searches';
const maxBatchSize = 20;
const flushDelayMs = 1200;
const maxRecentSearches = 10;
const maxProductSearchTelemetrySamples = 100;

let pendingImpressions: ItemCardImpression[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const recentProductSearchPerformanceTelemetry: ProductSearchPerformanceTelemetry[] = [];
const productConversionBuckets = new Map<string, ProductConversionEvent>();

function rate(count: number, total: number) {
  return total === 0 ? 0 : count / total;
}

function productConversionBucketKey(event: Pick<ProductConversionEvent, 'goal' | 'route'>) {
  return `${event.route}::${event.goal}`;
}

function normalizedProductConversionGoal(value: unknown): ProductConversionGoal | null {
  return typeof value === 'string' && productConversionGoals.includes(value as ProductConversionGoal)
    ? value as ProductConversionGoal
    : null;
}

function normalizedProductConversionRoute(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 160) return null;

  try {
    const parsed = trimmed.startsWith('http') ? new URL(trimmed).pathname : trimmed;
    return parsed.startsWith('/') ? parsed : `/${parsed}`;
  } catch {
    return null;
  }
}

function normalizedProductConversionCount(value: unknown) {
  if (value === undefined) return 1;
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 100 ? value : null;
}

function normalizeProductConversionEvent(value: unknown, observedAt: string): ProductConversionEvent | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const event = value as { count?: unknown; goal?: unknown; route?: unknown };
  const goal = normalizedProductConversionGoal(event.goal);
  const route = normalizedProductConversionRoute(event.route);
  const count = normalizedProductConversionCount(event.count);

  if (!goal || !route || count === null) return null;
  return { goal, route, count, observedAt };
}

function emptyProductConversionCounts(route = 'All routes'): ProductConversionRouteRollup {
  return {
    route,
    searchToProductCount: 0,
    productToListCount: 0,
    alertCreationCount: 0,
    outboundClickCount: 0,
    listConversionRate: null,
    alertConversionRate: null,
    outboundClickRate: null
  };
}

function productConversionRollup(route: string, events: ProductConversionEvent[]): ProductConversionRouteRollup {
  const rollup = emptyProductConversionCounts(route);
  for (const event of events) {
    if (event.goal === 'search_to_product') rollup.searchToProductCount += event.count;
    if (event.goal === 'product_to_list') rollup.productToListCount += event.count;
    if (event.goal === 'alert_creation') rollup.alertCreationCount += event.count;
    if (event.goal === 'outbound_click') rollup.outboundClickCount += event.count;
  }

  rollup.listConversionRate = rollup.searchToProductCount > 0 ? rollup.productToListCount / rollup.searchToProductCount : null;
  rollup.alertConversionRate = rollup.searchToProductCount > 0 ? rollup.alertCreationCount / rollup.searchToProductCount : null;
  rollup.outboundClickRate = rollup.searchToProductCount > 0 ? rollup.outboundClickCount / rollup.searchToProductCount : null;
  return rollup;
}

export function recordProductConversionEvents(values: unknown[]) {
  const observedAt = new Date().toISOString();
  const normalized = values
    .map((value) => normalizeProductConversionEvent(value, observedAt))
    .filter((event): event is ProductConversionEvent => event !== null);

  for (const event of normalized) {
    const key = productConversionBucketKey(event);
    const existing = productConversionBuckets.get(key);
    productConversionBuckets.set(key, {
      ...event,
      count: (existing?.count ?? 0) + event.count,
      observedAt
    });
  }

  return {
    accepted: normalized.length,
    rejected: values.length - normalized.length
  };
}

export function getProductConversionDashboard(generatedAt = new Date().toISOString()): ProductConversionDashboard {
  const events = [...productConversionBuckets.values()];
  const routes = [...new Set(events.map((event) => event.route))]
    .map((route) => productConversionRollup(route, events.filter((event) => event.route === route)))
    .sort((left, right) => right.searchToProductCount - left.searchToProductCount || left.route.localeCompare(right.route));

  const totalsRollup = productConversionRollup('All routes', events);
  return {
    available: events.length > 0,
    generatedAt,
    observationCount: events.reduce((sum, event) => sum + event.count, 0),
    routes,
    totals: {
      alertConversionRate: totalsRollup.alertConversionRate,
      alertCreationCount: totalsRollup.alertCreationCount,
      listConversionRate: totalsRollup.listConversionRate,
      outboundClickCount: totalsRollup.outboundClickCount,
      outboundClickRate: totalsRollup.outboundClickRate,
      productToListCount: totalsRollup.productToListCount,
      searchToProductCount: totalsRollup.searchToProductCount
    },
    guardrail: 'Product conversion analytics stores aggregate counts by route and goal only; it does not accept product ids, prices, user ids, or free-text search terms.'
  };
}

export function resetProductConversionDashboardForTests() {
  productConversionBuckets.clear();
}

export function summarizeProductSearchPerformanceTelemetry(): ProductSearchPerformanceSummary {
  const sampleSize = recentProductSearchPerformanceTelemetry.length;
  const totalLatencyMs = recentProductSearchPerformanceTelemetry.reduce((sum, event) => sum + event.latencyMs, 0);
  const totalResultCount = recentProductSearchPerformanceTelemetry.reduce((sum, event) => sum + event.resultCount, 0);

  return {
    averageLatencyMs: sampleSize === 0 ? 0 : Math.round(totalLatencyMs / sampleSize),
    averageResultCount: sampleSize === 0 ? 0 : Number((totalResultCount / sampleSize).toFixed(2)),
    cacheHitRate: rate(recentProductSearchPerformanceTelemetry.filter((event) => event.cacheHit).length, sampleSize),
    sampleSize,
    timeoutRate: rate(recentProductSearchPerformanceTelemetry.filter((event) => event.timedOut).length, sampleSize)
  };
}

export function recordProductSearchPerformanceTelemetry(
  event: Omit<ProductSearchPerformanceTelemetry, 'cacheHitRate' | 'observedAt' | 'timeoutRate'>
) {
  const telemetry: ProductSearchPerformanceTelemetry = {
    ...event,
    cacheHitRate: 0,
    observedAt: new Date().toISOString(),
    timeoutRate: 0
  };

  recentProductSearchPerformanceTelemetry.push(telemetry);
  if (recentProductSearchPerformanceTelemetry.length > maxProductSearchTelemetrySamples) {
    recentProductSearchPerformanceTelemetry.shift();
  }

  const summary = summarizeProductSearchPerformanceTelemetry();
  telemetry.cacheHitRate = summary.cacheHitRate;
  telemetry.timeoutRate = summary.timeoutRate;
  return telemetry;
}

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

function currentAnalyticsRoute() {
  if (typeof window === 'undefined') return 'unknown';
  const pathname = window.location.pathname || 'unknown';
  if (/^\/products\/[^/]+$/.test(pathname)) return '/products/[slug]';
  if (/^\/product\/[^/]+$/.test(pathname)) return '/product/[id]';
  return pathname;
}

function sendSearchToSavingsAnalytics(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(searchToSavingsFunnelEndpoint, new Blob([body], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(searchToSavingsFunnelEndpoint, {
    body,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export function trackProductConversion(goal: ProductConversionGoal, route = currentAnalyticsRoute()) {
  sendSearchToSavingsAnalytics({
    productConversionEvents: [{
      goal,
      route,
      count: 1
    }]
  });
}

export function trackSearchToSavingsFunnelStep(step: SearchToSavingsFunnelStepId) {
  if (typeof window === 'undefined') return;

  const conversionGoal = funnelStepConversionGoals[step];
  sendSearchToSavingsAnalytics({
    events: [{
      step,
      count: 1,
      market: currentFunnelMarket(),
      device: currentFunnelDevice(),
      accountState: currentFunnelAccountState()
    }],
    productConversionEvents: conversionGoal ? [{
      goal: conversionGoal,
      route: currentAnalyticsRoute(),
      count: 1
    }] : []
  });
}

export function readRecentProductSearches(): RecentProductSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentProductSearchesStorageKey) || '[]') as RecentProductSearch[];
    return Array.isArray(parsed)
      ? parsed
        .filter((entry) => typeof entry.query === 'string' && entry.query.trim().length > 0)
        .slice(0, maxRecentSearches)
      : [];
  } catch {
    return [];
  }
}

export function rememberRecentProductSearch(query: string, resultCount: number): RecentProductSearch[] {
  if (typeof window === 'undefined') return [];
  const trimmedQuery = query.trim();
  if (!trimmedQuery || resultCount <= 0) return readRecentProductSearches();

  const next = [
    {
      query: trimmedQuery,
      href: `/products?q=${encodeURIComponent(trimmedQuery)}`,
      resultCount,
      searchedAt: new Date().toISOString()
    },
    ...readRecentProductSearches().filter((entry) => entry.query.toLocaleLowerCase('sv-SE') !== trimmedQuery.toLocaleLowerCase('sv-SE'))
  ].slice(0, maxRecentSearches);

  window.localStorage.setItem(recentProductSearchesStorageKey, JSON.stringify(next));
  return next;
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


export type DealShareChannel = 'copy_link' | 'web_share';

export type DealShareEvent = {
  channel: DealShareChannel;
  dealId: string;
  observedAt: string;
  referrer?: string;
  shareUrl: string;
};

const dealShareEndpoint = '/api/analytics/deal-shares';

export function trackDealShare(event: Omit<DealShareEvent, 'observedAt' | 'referrer'>) {
  if (typeof window === 'undefined') return;

  const payloadEvent: DealShareEvent = {
    ...event,
    observedAt: new Date().toISOString(),
    referrer: document.referrer || undefined
  };

  window.dispatchEvent(new CustomEvent('groceryview:deal-share', { detail: payloadEvent }));
  const payload = JSON.stringify({ event: payloadEvent });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(dealShareEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(dealShareEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export type SponsoredPlacementImpression = {
  label: string;
  observedAt: string;
  placementId: string;
  provider: string;
  separatedFromOrganicRankings: boolean;
  surface: string;
};

const sponsoredPlacementImpressionEndpoint = '/api/analytics/sponsored-placement-impressions';

export function trackSponsoredPlacementImpression(event: Omit<SponsoredPlacementImpression, 'observedAt'>) {
  if (typeof window === 'undefined') return;

  const payloadEvent: SponsoredPlacementImpression = {
    ...event,
    observedAt: new Date().toISOString()
  };

  window.dispatchEvent(new CustomEvent('groceryview:sponsored-placement-impression', { detail: payloadEvent }));
  const payload = JSON.stringify({ event: payloadEvent });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(sponsoredPlacementImpressionEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(sponsoredPlacementImpressionEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export type AffiliateDisclosureKind = 'affiliate' | 'outbound' | 'sponsored';

export type AffiliateLinkMetadata = {
  placement: 'deal_card' | 'store_link' | 'source_link';
  surface: string;
  retailerName: string;
  destinationUrl: string;
  productId?: string;
  dealId?: string;
  campaignId?: string;
  disclosureKind?: AffiliateDisclosureKind;
  sponsored?: boolean;
};

export type AffiliateOutboundClickEvent = AffiliateLinkMetadata & {
  consentGranted: boolean;
  disclosureKind: AffiliateDisclosureKind;
  disclosureLabel: string;
  observedAt: string;
};

const affiliateOutboundEndpoint = '/api/analytics/affiliate-outbound-clicks';
const groceryViewAffiliateSource = 'groceryview';

export function affiliateDisclosureKind(metadata: Pick<AffiliateLinkMetadata, 'disclosureKind' | 'sponsored'>): AffiliateDisclosureKind {
  if (metadata.disclosureKind) return metadata.disclosureKind;
  if (metadata.sponsored === false) return 'outbound';
  if (metadata.sponsored) return 'sponsored';
  return 'affiliate';
}

export function affiliateDisclosureLabel(metadata: Pick<AffiliateLinkMetadata, 'disclosureKind' | 'retailerName' | 'sponsored'>) {
  const disclosureKind = affiliateDisclosureKind(metadata);
  const prefix = disclosureKind === 'outbound'
    ? 'Outbound store link'
    : disclosureKind === 'sponsored'
      ? 'Sponsored deal link'
      : 'Affiliate link';
  return `${prefix}: GroceryView may earn a commission from ${metadata.retailerName}; deal ranking and savings math stay independent.`;
}

export function buildAffiliateOutboundUrl(metadata: AffiliateLinkMetadata) {
  try {
    const url = new URL(metadata.destinationUrl);
    const disclosureKind = affiliateDisclosureKind(metadata);
    url.searchParams.set('utm_source', groceryViewAffiliateSource);
    url.searchParams.set('utm_medium', disclosureKind === 'outbound' ? 'outbound_store' : disclosureKind);
    url.searchParams.set('utm_campaign', metadata.campaignId ?? metadata.surface);
    url.searchParams.set('gv_affiliate_disclosure', disclosureKind);
    url.searchParams.set('gv_sponsored_link', String(disclosureKind === 'sponsored'));
    if (metadata.productId) url.searchParams.set('gv_product_id', metadata.productId);
    if (metadata.dealId) url.searchParams.set('gv_deal_id', metadata.dealId);
    return url.toString();
  } catch {
    return metadata.destinationUrl;
  }
}

function hasAnalyticsConsent() {
  try {
    return window.localStorage.getItem('groceryview:analytics-consent') === 'granted';
  } catch {
    return false;
  }
}

function sendAffiliateOutboundClick(event: AffiliateOutboundClickEvent) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent('groceryview:affiliate-outbound-click', { detail: event }));
  if (!event.consentGranted) return;

  const payload = JSON.stringify({ event });
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
  trackProductConversion('outbound_click');
  sendAffiliateOutboundClick({
    ...metadata,
    consentGranted: hasAnalyticsConsent(),
    disclosureKind: affiliateDisclosureKind(metadata),
    disclosureLabel: affiliateDisclosureLabel(metadata),
    observedAt: new Date().toISOString()
  });
}

export function affiliateOutboundClickScript(metadata: AffiliateLinkMetadata) {
  const payload = JSON.stringify({
    ...metadata,
    disclosureKind: affiliateDisclosureKind(metadata),
    disclosureLabel: affiliateDisclosureLabel(metadata)
  }).replace(/</g, '\\u003c');

  return `(() => {
    const consentGranted = (() => { try { return window.localStorage.getItem('groceryview:analytics-consent') === 'granted'; } catch { return false; } })();
    const event = { ...${payload}, consentGranted, observedAt: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent('groceryview:affiliate-outbound-click', { detail: event }));
    if (!consentGranted) return;
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon && navigator.sendBeacon('${affiliateOutboundEndpoint}', new Blob([body], { type: 'application/json' }))) return;
    fetch('${affiliateOutboundEndpoint}', { body, headers: { 'content-type': 'application/json' }, keepalive: true, method: 'POST' }).catch(() => undefined);
  })();`;
}
