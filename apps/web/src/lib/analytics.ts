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

export type RecentProductSearch = {
  query: string;
  href: string;
  resultCount: number;
  searchedAt: string;
};

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
export const recentProductSearchesStorageKey = 'groceryview:recent-product-searches';
const maxBatchSize = 20;
const flushDelayMs = 1200;
const maxRecentSearches = 10;
const maxProductSearchTelemetrySamples = 100;

let pendingImpressions: ItemCardImpression[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const recentProductSearchPerformanceTelemetry: ProductSearchPerformanceTelemetry[] = [];

function rate(count: number, total: number) {
  return total === 0 ? 0 : count / total;
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

export type SponsoredDiscoveryPlacement = {
  categoryLabel: string;
  disclosure: string;
  href: string;
  keywords: string[];
  label: string;
  placementId: string;
  provider: string;
  relevanceCategories: string[];
  surface: string;
  title: string;
};

export type SponsoredDiscoveryPlacementDecision = SponsoredDiscoveryPlacement & {
  relevanceScore: number;
  separatedFromOrganicRankings: true;
};

type SponsoredDiscoveryPlacementContext = {
  organicCategoryLabels: string[];
  organicProductNames: string[];
};

type SponsoredDiscoveryPlacementOptions = {
  maxPlacements?: number;
  minRelevanceScore?: number;
};

function normalizedDiscoveryTerms(values: string[]) {
  return values
    .map((value) => value.trim().toLocaleLowerCase('sv-SE'))
    .filter(Boolean);
}

export function sponsoredDiscoveryPlacementRelevanceScore(
  placement: Pick<SponsoredDiscoveryPlacement, 'keywords' | 'relevanceCategories'>,
  context: SponsoredDiscoveryPlacementContext
) {
  const organicNames = normalizedDiscoveryTerms(context.organicProductNames);
  const organicCategories = new Set(normalizedDiscoveryTerms(context.organicCategoryLabels));
  const keywordMatches = normalizedDiscoveryTerms(placement.keywords).filter((keyword) =>
    organicNames.some((name) => name.includes(keyword))
  ).length;
  const categoryMatches = normalizedDiscoveryTerms(placement.relevanceCategories).filter((category) =>
    organicCategories.has(category)
  ).length;

  return keywordMatches + categoryMatches;
}

export function selectSponsoredDiscoveryPlacements(
  placements: SponsoredDiscoveryPlacement[],
  context: SponsoredDiscoveryPlacementContext,
  { maxPlacements = 1, minRelevanceScore = 1 }: SponsoredDiscoveryPlacementOptions = {}
): SponsoredDiscoveryPlacementDecision[] {
  if (maxPlacements <= 0) return [];

  return placements
    .map((placement) => ({
      ...placement,
      relevanceScore: sponsoredDiscoveryPlacementRelevanceScore(placement, context),
      separatedFromOrganicRankings: true as const
    }))
    .filter((placement) => placement.relevanceScore >= minRelevanceScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || a.placementId.localeCompare(b.placementId))
    .slice(0, maxPlacements);
}

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
  consentGranted: boolean;
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
  try {
    const url = new URL(metadata.destinationUrl);
    url.searchParams.set('utm_source', groceryViewAffiliateSource);
    url.searchParams.set('utm_medium', metadata.sponsored === false ? 'outbound_store' : 'affiliate');
    url.searchParams.set('utm_campaign', metadata.campaignId ?? metadata.surface);
    url.searchParams.set('gv_affiliate_disclosure', metadata.sponsored === false ? 'outbound' : 'affiliate');
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
  sendAffiliateOutboundClick({
    ...metadata,
    consentGranted: hasAnalyticsConsent(),
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
    const consentGranted = (() => { try { return window.localStorage.getItem('groceryview:analytics-consent') === 'granted'; } catch { return false; } })();
    const event = { ...${payload}, consentGranted, observedAt: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent('groceryview:affiliate-outbound-click', { detail: event }));
    if (!consentGranted) return;
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon && navigator.sendBeacon('${affiliateOutboundEndpoint}', new Blob([body], { type: 'application/json' }))) return;
    fetch('${affiliateOutboundEndpoint}', { body, headers: { 'content-type': 'application/json' }, keepalive: true, method: 'POST' }).catch(() => undefined);
  })();`;
}
