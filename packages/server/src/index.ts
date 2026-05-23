import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildFlyerOfferReport,
  basketImportReviewGuardrails,
  createBasketImportReviewItems,
  createGroceryViewApi,
  type BasketImportExportRequest,
  type BasketImportReviewDecisionRequest,
  type BasketImportReviewItem,
  type CategoryBudgetPatch,
  type FlyerOfferObservationInput,
  type FlyerOfferReport,
  type FlyerOfferStoreSummary,
  type HouseholdPlanRequest,
  type StoreFlyerOfferReport,
  type WatchlistPriceAlertReport,
  type WatchlistPriceAlertRequest
} from '@groceryview/api';
import { createSessionToken, parseBearerToken, verifySessionToken, type SessionPayload } from '@groceryview/auth';
import { buildCatalogCoverageReport, type CatalogCoverageInput, type CatalogCoverageReport } from '@groceryview/catalog';
import {
  checkPostgresIntegrationReadiness,
  checkSourceRunHealth,
  createPgQueryExecutor,
  createPostgresCatalogReader,
  createPostgresRepository,
  createPostgresSourceRecordReader,
  type BudgetRecord,
  type PgLikeClient,
  type PostgresIntegrationReadinessReport,
  type QueryExecutor,
  type SourceRunHealthCheckResult,
  type SourceRunHealthReport
} from '@groceryview/db';
import {
  buildSubscriptionCheckoutPlan,
  buildSubscriptionAccessPolicy,
  parseStripeCompatibleSubscriptionEvent,
  processBillingSubscriptionEvent,
  type BillingSubscriptionEntitlementMutation,
  type BillingSubscriptionEvent,
  type BillingSubscriptionEventType,
  type SubscriptionCheckoutPlan,
  type SubscriptionEntitlementSnapshot,
  type SubscriptionPlan
} from '@groceryview/monetization';
import {
  applyHumanReviewDecision,
  authorizeHumanReviewAction,
  buildPrivacyExport,
  planAccountDeletion,
  planPantryReplenishment,
  planPrivacyRequestFulfillment,
  summarizeHumanReviewSla,
  buildWatchlistAlerts,
  type HumanReviewAssignment,
  type HumanReviewDecision,
  type HumanReviewOperator,
  type PantryInventoryItem,
  type PrivacyRequest,
  type PrivacyRequestStatus,
  type PrivacyRequestType,
  type BasketTripCostTravelMode,
  type RecurringBasketCadence,
  type WatchlistItem,
  type WatchlistProductSnapshot,
  type WatchlistPriceType
} from '@groceryview/core';
import {
  createExpoPushProvider,
  createSendgridEmailProvider,
  createTelegramBotProvider,
  formatNotificationOperationsMetrics,
  parseNotificationSuppressionWebhook,
  processNotificationSuppressionEvent,
  runRepositoryNotificationWorkerCycle,
  type DeliveryChannel,
  type NotificationOperationsReport,
  type RepositoryNotificationWorkerCycleResult,
  type NotificationSuppressionWebhookProvider,
  type NotificationProviderFetch,
  type NotificationProviders,
  type NotificationSuppression,
  type NotificationSuppressionEventType,
  type NotificationSuppressionMutation,
  type PersistedNotificationTask
} from '@groceryview/notifications';
import {
  buildScanProviderReadinessReport,
  createOcrSpaceReceiptProvider,
  createOpenFoodFactsBarcodeProvider,
  planScanReviewWorkItems,
  prepareScanUploadTicket,
  processScanUpload,
  type ScanProviderReadinessReport,
  type ScanProviders,
  type ScanUpload,
  type ScanUploadStorage
} from '@groceryview/scanning';

export type HttpHandler = (request: Request) => Promise<Response>;

export type AuthOptions = {
  runtimeConfig?: RuntimeConfig;
  authSecret?: string;
  now?: Date;
  apiResponseCache?: ApiResponseCache;
  authSessionExchange?: AuthSessionExchangeVerifier;
  subscriptionEntitlementRepository?: {
    getSubscriptionEntitlement(userId: string): Promise<SubscriptionEntitlementLookupRecord | null>;
  };
  budgetRepository?: {
    upsertBudget(userId: string, budget: BudgetRecord): Promise<void>;
    getBudget(userId: string): Promise<BudgetRecord | null>;
  };
  humanReviewRepository?: {
    getHumanReviewer(reviewerId: string): Promise<HumanReviewOperator | null>;
    listOpenHumanReviewAssignments(): Promise<HumanReviewAssignment[]>;
    saveHumanReviewAssignment(assignment: HumanReviewAssignment): Promise<void>;
  };
  basketImportReviewRepository?: {
    saveBasketImportReviewItems(userId: string, items: BasketImportReviewItem[]): Promise<void>;
    listOpenBasketImportReviewItems(userId: string): Promise<BasketImportReviewItem[]>;
    resolveBasketImportReviewItem(userId: string, reviewItemId: string, resolution: {
      status: 'accepted' | 'dismissed';
      resolvedAt: string;
      resolvedProductId?: string;
      quantity?: number;
    }): Promise<BasketImportReviewItem>;
  };
  notificationWebhookSecret?: string;
  notificationSuppressionSink?: {
    upsertNotificationSuppression(suppression: NotificationSuppressionMutation): Promise<void>;
  };
  notificationInboxRepository?: {
    listDueNotificationTasks(now: string): Promise<PersistedNotificationTask[]>;
    listActiveNotificationSuppressions(): Promise<NotificationSuppression[]>;
  };
  billingWebhookSecret?: string;
  billingPriceIdPlanMap?: Partial<Record<string, SubscriptionPlan>>;
  billingSubscriptionSink?: {
    upsertSubscriptionEntitlement(entitlement: BillingSubscriptionEntitlementMutation): Promise<void>;
  };
  billingCheckoutPriceIds?: Partial<Record<SubscriptionPlan, string>>;
  billingCheckoutProvider?: BillingCheckoutProvider;
  billingPortalProvider?: BillingPortalProvider;
  notificationMetricsToken?: string;
  notificationMetricsProvider?: () => Promise<NotificationOperationsReport>;
  notificationWorkerRunner?: () => Promise<RepositoryNotificationWorkerCycleResult>;
  postgresReadinessProvider?: () => Promise<PostgresIntegrationReadinessReport>;
  sourceRunHealthProvider?: () => Promise<SourceRunHealthCheckResult>;
  catalogCoverageProvider?: () => Promise<CatalogCoverageReport>;
  scanProviderReadinessProvider?: () => Promise<ScanProviderReadinessReport>;
  scanUploadStorageReadinessProvider?: () => Promise<ScanUploadStorageReadinessReport>;
  scanUploadCorsReadinessProvider?: () => Promise<ScanUploadCorsReadinessReport>;
  scanUploadWriteReadinessProvider?: () => Promise<ScanUploadWriteReadinessReport>;
  flyerOffersProvider?: (query: FlyerOffersProviderQuery) => Promise<FlyerOfferReport>;
  storeFlyerOffersProvider?: (storeId: string, query: StoreFlyerOffersProviderQuery) => Promise<StoreFlyerOfferReport | null>;
  watchlistPriceAlertsProvider?: (userId: string) => Promise<WatchlistPriceAlertReport>;
  watchlistPriceAlertWriter?: (userId: string, request: WatchlistPriceAlertRequest) => Promise<WatchlistPriceAlertReport>;
  scanProviders?: ScanProviders;
  scanUploadStorage?: ScanUploadStorage;
};

export type AuthProvider = 'magic_link' | 'passkey' | 'oidc';

export type AuthProviderAssertion = {
  provider: AuthProvider;
  assertion: string;
  email?: string;
};

export type VerifiedAuthProviderUser = {
  userId: string;
  email?: string;
  expiresAt?: string;
};

export type AuthSessionExchangeVerifier = {
  verify(assertion: AuthProviderAssertion): Promise<VerifiedAuthProviderUser>;
};

export type SubscriptionEntitlementLookupRecord = SubscriptionEntitlementSnapshot & {
  userId: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
};

export type RuntimePersistenceRepository = {
  getSubscriptionEntitlement(userId: string): Promise<SubscriptionEntitlementLookupRecord | null>;
  upsertSubscriptionEntitlement(entitlement: BillingSubscriptionEntitlementMutation): Promise<void>;
  upsertBudget(userId: string, budget: BudgetRecord): Promise<void>;
  getBudget(userId: string): Promise<BudgetRecord | null>;
  getHumanReviewer(reviewerId: string): Promise<HumanReviewOperator | null>;
  listOpenHumanReviewAssignments(): Promise<HumanReviewAssignment[]>;
  saveHumanReviewAssignment(assignment: HumanReviewAssignment): Promise<void>;
  saveBasketImportReviewItems?(userId: string, items: BasketImportReviewItem[]): Promise<void>;
  listOpenBasketImportReviewItems?(userId: string): Promise<BasketImportReviewItem[]>;
  resolveBasketImportReviewItem?(userId: string, reviewItemId: string, resolution: {
    status: 'accepted' | 'dismissed';
    resolvedAt: string;
    resolvedProductId?: string;
    quantity?: number;
  }): Promise<BasketImportReviewItem>;
  upsertNotificationSuppression(suppression: NotificationSuppressionMutation): Promise<void>;
  listDueNotificationTasks?(now: string): Promise<PersistedNotificationTask[]>;
  listActiveNotificationSuppressions?(): Promise<NotificationSuppression[]>;
  upsertNotificationTask?(task: PersistedNotificationTask): Promise<void>;
};

type RuntimeWatchlistRepository = {
  getFavoriteStoreIds(userId: string): Promise<string[]>;
  addWatchlistItem(userId: string, item: WatchlistItem): Promise<void>;
  getWatchlist(userId: string): Promise<WatchlistItem[]>;
};

export type RuntimePgPool = PgLikeClient & {
  end(): Promise<void> | void;
};

export type RuntimePgPoolFactory = (databaseUrl: string) => RuntimePgPool;

export type ApiResponseCache = {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options: { ttlSeconds: number }): Promise<void> | void;
};

export type RuntimeHandlerOptions = {
  now?: Date;
  repository?: RuntimePersistenceRepository;
  apiResponseCache?: ApiResponseCache;
  notificationMetricsProvider?: () => Promise<NotificationOperationsReport>;
  notificationWorkerRunner?: () => Promise<RepositoryNotificationWorkerCycleResult>;
  postgresReadinessProvider?: () => Promise<PostgresIntegrationReadinessReport>;
  sourceRunHealthProvider?: () => Promise<SourceRunHealthCheckResult>;
  catalogCoverageProvider?: () => Promise<CatalogCoverageReport>;
  scanProviderReadinessProvider?: () => Promise<ScanProviderReadinessReport>;
  scanUploadStorageReadinessProvider?: () => Promise<ScanUploadStorageReadinessReport>;
  scanUploadCorsReadinessProvider?: () => Promise<ScanUploadCorsReadinessReport>;
  scanUploadWriteReadinessProvider?: () => Promise<ScanUploadWriteReadinessReport>;
  flyerOffersProvider?: (query: FlyerOffersProviderQuery) => Promise<FlyerOfferReport>;
  storeFlyerOffersProvider?: (storeId: string, query: StoreFlyerOffersProviderQuery) => Promise<StoreFlyerOfferReport | null>;
  watchlistPriceAlertsProvider?: (userId: string) => Promise<WatchlistPriceAlertReport>;
  watchlistPriceAlertWriter?: (userId: string, request: WatchlistPriceAlertRequest) => Promise<WatchlistPriceAlertReport>;
  pgPoolFactory?: RuntimePgPoolFactory;
  notificationProviderFetch?: NotificationProviderFetch;
  scanProviderFetch?: typeof fetch;
  scanUploadCorsFetch?: typeof fetch;
  scanUploadWriteFetch?: typeof fetch;
};

export type FlyerOffersProviderQuery = {
  asOf?: string;
  storeId?: string;
  chain?: string;
  category?: string;
  productId?: string;
};

export type StoreFlyerOffersProviderQuery = {
  asOf?: string;
};

type JsonRecord = Record<string, unknown>;

const require = createRequire(import.meta.url);
const jsonHeaders = { 'content-type': 'application/json; charset=utf-8' };
const requiredDailyChainIds = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'] as const;

export type BillingCheckoutSession = {
  sessionId: string;
  checkoutUrl: string;
};

export type BillingCheckoutProvider = {
  createCheckoutSession(request: Extract<SubscriptionCheckoutPlan, { status: 'ready' }>['checkoutRequest']): Promise<BillingCheckoutSession>;
};

export type BillingPortalRequest = {
  customerReference: string;
  returnUrl: string;
};

export type BillingPortalSession = {
  sessionId: string;
  portalUrl: string;
};

export type BillingPortalProvider = {
  createPortalSession(request: BillingPortalRequest): Promise<BillingPortalSession>;
};

function createStripeCompatibleCheckoutProvider(secretKey: string): BillingCheckoutProvider {
  return {
    async createCheckoutSession(request) {
      const body = new URLSearchParams();
      body.set('mode', 'subscription');
      body.set('client_reference_id', request.customerReference);
      body.set('line_items[0][price]', request.priceId);
      body.set('line_items[0][quantity]', '1');
      body.set('success_url', request.successUrl);
      body.set('cancel_url', request.cancelUrl);
      body.set('metadata[plan]', request.metadata.plan);

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: new Headers({
          authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded'
        }),
        body
      });
      const payload = await response.json() as unknown;
      if (!response.ok || payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Billing checkout provider rejected the session request.');
      }
      const record = payload as Record<string, unknown>;
      return {
        sessionId: requiredString(record.id, 'stripeCheckoutSession.id'),
        checkoutUrl: requiredString(record.url, 'stripeCheckoutSession.url')
      };
    }
  };
}

function createStripeCompatiblePortalProvider(secretKey: string): BillingPortalProvider {
  return {
    async createPortalSession(request) {
      const body = new URLSearchParams();
      body.set('customer', request.customerReference);
      body.set('return_url', request.returnUrl);

      const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: new Headers({
          authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded'
        }),
        body
      });
      const payload = await response.json() as unknown;
      if (!response.ok || payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Billing portal provider rejected the session request.');
      }
      const record = payload as Record<string, unknown>;
      return {
        sessionId: requiredString(record.id, 'stripeBillingPortalSession.id'),
        portalUrl: requiredString(record.url, 'stripeBillingPortalSession.url')
      };
    }
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers ?? {}) }
  });
}

function jsonTextResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers ?? {}) }
  });
}

const apiHotEndpointCacheTtlSeconds: Readonly<Record<string, number>> = {
  '/api/market/overview': 60,
  '/api/indices': 300,
  '/api/deals/flyer-offers': 300,
  '/api/deals/discounts': 300
};

function hotEndpointCacheKey(url: URL): string {
  const params = new URLSearchParams(url.search);
  params.sort();
  const query = params.toString();
  return `hot-endpoint:v1:${url.pathname}${query ? `?${query}` : ''}`;
}

async function cachedJsonResponse(cache: ApiResponseCache | undefined, url: URL, ttlSeconds: number, bodyFactory: () => Promise<unknown> | unknown): Promise<Response> {
  const cacheKey = hotEndpointCacheKey(url);
  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached !== null) {
      return jsonTextResponse(cached, {
        headers: {
          'cache-control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 5}`,
          'x-groceryview-cache': 'hit'
        }
      });
    }
  }

  const body = await bodyFactory();
  const serialized = JSON.stringify(body);
  if (cache) await cache.set(cacheKey, serialized, { ttlSeconds });
  return jsonTextResponse(serialized, {
    headers: {
      'cache-control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 5}`,
      'x-groceryview-cache': cache ? 'miss' : 'bypass'
    }
  });
}

function errorResponse(status: number, error: string): Response {
  return jsonResponse({ error }, { status });
}

async function readJson(request: Request): Promise<JsonRecord> {
  try {
    if (!request.body) return {};
    return parseJsonObject(await request.text());
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'parse failed'}`);
  }
}

function parseJsonObject(text: string): JsonRecord {
  const parsed = JSON.parse(text) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON body must be an object.');
  }
  return parsed as JsonRecord;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} is required.`);
  return value;
}

function requiredSubscriptionPlan(value: unknown): SubscriptionPlan {
  if (value === 'premium_monthly' || value === 'premium_yearly') return value;
  throw new Error('plan must be premium_monthly or premium_yearly.');
}

function requiredScanKind(value: unknown): ScanUpload['kind'] {
  if (value === 'barcode' || value === 'receipt') return value;
  throw new Error('kind must be barcode or receipt.');
}

function requiredPantryUnit(value: unknown): PantryInventoryItem['unit'] {
  if (value === 'each' || value === 'kg' || value === 'g' || value === 'l' || value === 'ml' || value === 'pack') return value;
  throw new Error('pantry unit must be each, kg, g, l, ml, or pack.');
}

function requiredRecurringCadence(value: unknown): RecurringBasketCadence {
  if (value === 'weekly' || value === 'biweekly' || value === 'monthly') return value;
  throw new Error('cadence must be weekly, biweekly, or monthly.');
}


function requiredTravelMode(value: unknown): BasketTripCostTravelMode {
  if (value === 'walk' || value === 'bike' || value === 'transit' || value === 'car' || value === 'delivery') return value;
  throw new Error('travelMode must be walk, bike, transit, car, or delivery.');
}

function optionalQueryNumber(url: URL, name: string): number | undefined {
  const raw = url.searchParams.get(name);
  if (raw === null || raw === '') return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number.`);
  return parsed;
}

function requiredAuthProvider(value: unknown): AuthProvider {
  if (value === 'magic_link' || value === 'passkey' || value === 'oidc') return value;
  throw new Error('provider must be magic_link, passkey, or oidc.');
}

function optionalDeliveryChannel(value: unknown): DeliveryChannel | undefined {
  if (value === undefined) return undefined;
  if (value === 'push' || value === 'email' || value === 'telegram') return value;
  throw new Error('channel must be push, email, or telegram.');
}

function optionalNutritionMetric(value: string | null): 'protein' | 'calories' | 'fiber' {
  if (value === null || value === '') return 'protein';
  if (value === 'protein' || value === 'calories' || value === 'fiber') return value;
  throw new Error('metric must be protein, calories, or fiber.');
}

function requiredSuppressionEventType(value: unknown): NotificationSuppressionEventType {
  if (value === 'unsubscribe' || value === 'bounce' || value === 'complaint' || value === 'resubscribe') return value;
  throw new Error('eventType must be unsubscribe, bounce, complaint, or resubscribe.');
}

function requiredSuppressionWebhookProvider(value: unknown): NotificationSuppressionWebhookProvider {
  if (value === 'sendgrid' || value === 'ses' || value === 'expo') return value;
  throw new Error('provider must be sendgrid, ses, or expo.');
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || Number.isNaN(value)) throw new Error(`${field} must be a number.`);
  return value;
}

function requiredNumber(value: unknown, field: string): number {
  const parsed = optionalNumber(value, field);
  if (parsed === undefined) throw new Error(`${field} is required.`);
  return parsed;
}

function optionalPositiveNumber(value: unknown, field: string, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = requiredNumber(value, field);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${field} must be positive.`);
  return parsed;
}

function optionalNonNegativeNumber(value: unknown, field: string, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = requiredNumber(value, field);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} must be non-negative.`);
  return parsed;
}

function requiredPrivacyRequestType(value: unknown): PrivacyRequestType {
  if (value === 'data_export' || value === 'account_deletion' || value === 'ad_data_opt_out') return value;
  throw new Error('privacy request type must be data_export, account_deletion, or ad_data_opt_out.');
}

function requiredPrivacyRequestStatus(value: unknown): PrivacyRequestStatus {
  if (value === 'received' || value === 'in_progress' || value === 'fulfilled' || value === 'rejected') return value;
  throw new Error('privacy request status must be received, in_progress, fulfilled, or rejected.');
}

function optionalHumanReviewDecision(value: unknown): HumanReviewDecision | undefined {
  if (value === undefined) return undefined;
  if (value === 'approve' || value === 'reject' || value === 'needs_more_info') return value;
  throw new Error('decision must be approve, reject, or needs_more_info.');
}

function requiredHumanReviewDecision(value: unknown): HumanReviewDecision {
  const parsed = optionalHumanReviewDecision(value);
  if (parsed === undefined) throw new Error('decision is required.');
  return parsed;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`${field} must be a string.`);
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function requiredIsoTimestamp(value: unknown, field: string): string {
  const text = requiredString(value, field);
  if (text.trim() !== text || !isoTimestampPattern.test(text) || !Number.isFinite(Date.parse(text))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
  return text;
}

function optionalIsoTimestamp(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  return requiredIsoTimestamp(value, field);
}


function requiredBasketBridgeSourceKind(value: unknown): BasketImportExportRequest['source']['sourceKind'] {
  if (value === 'bookmarklet' || value === 'browser_extension' || value === 'copy_paste') return value;
  throw new Error('sourceKind must be bookmarklet, browser_extension, or copy_paste.');
}

function basketImportExportRequestFromBody(body: JsonRecord): BasketImportExportRequest {
  const source = body.source;
  if (source === null || typeof source !== 'object' || Array.isArray(source)) throw new Error('source must be an object.');
  const sourceRecord = source as JsonRecord;
  return {
    source: {
      sourceKind: requiredBasketBridgeSourceKind(sourceRecord.sourceKind),
      retailerId: requiredString(sourceRecord.retailerId, 'source.retailerId'),
      origin: requiredString(sourceRecord.origin, 'source.origin'),
      capturedAt: requiredString(sourceRecord.capturedAt, 'source.capturedAt'),
      consentGranted: sourceRecord.consentGranted === true
    },
    capturedLines: requiredRecordArray(body.capturedLines, 'capturedLines').map((line, index) => ({
      rawName: requiredString(line.rawName, `capturedLines[${index}].rawName`),
      quantity: requiredNumber(line.quantity, `capturedLines[${index}].quantity`),
      ...(line.productId === undefined ? {} : { productId: requiredString(line.productId, `capturedLines[${index}].productId`) }),
      ...(line.productUrl === undefined ? {} : { productUrl: requiredString(line.productUrl, `capturedLines[${index}].productUrl`) })
    }))
  };
}

function basketImportReviewDecisionFromBody(body: JsonRecord): BasketImportReviewDecisionRequest {
  const decision = requiredString(body.decision, 'decision');
  if (decision !== 'accept_as_product' && decision !== 'dismiss') throw new Error('decision must be accept_as_product or dismiss.');
  return {
    decision,
    ...(body.productId === undefined ? {} : { productId: requiredString(body.productId, 'productId') }),
    ...(body.quantity === undefined ? {} : { quantity: requiredNumber(body.quantity, 'quantity') })
  };
}

function authProviderAssertionFromBody(body: JsonRecord): AuthProviderAssertion {
  const email = optionalString(body.email, 'email');
  return {
    provider: requiredAuthProvider(body.provider),
    assertion: requiredString(body.assertion, 'assertion'),
    ...(email ? { email } : {})
  };
}

function defaultSessionExpiresAt(now: Date): string {
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

function requiredRecordArray(value: unknown, field: string): JsonRecord[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  return value.map((item, index) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`${field}[${index}] must be an object.`);
    }
    return item as JsonRecord;
  });
}

function optionalRecordArray(value: unknown, field: string): JsonRecord[] | undefined {
  if (value === undefined) return undefined;
  return requiredRecordArray(value, field);
}

function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  return value.map((item, index) => requiredString(item, `${field}[${index}]`));
}

function parseCursorOffset(cursor: string | null): number {
  if (!cursor) return 0;
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;
    if (
      decoded === null ||
      typeof decoded !== 'object' ||
      Array.isArray(decoded) ||
      typeof (decoded as { offset?: unknown }).offset !== 'number' ||
      !Number.isInteger((decoded as { offset: number }).offset) ||
      (decoded as { offset: number }).offset < 0
    ) {
      throw new Error('invalid offset');
    }
    return (decoded as { offset: number }).offset;
  } catch {
    throw new Error('cursor must be a valid GroceryView cursor pagination token.');
  }
}

function encodeCursorOffset(offset: number): string {
  return Buffer.from(JSON.stringify({ offset })).toString('base64url');
}

function parseCursorLimit(value: string | null): number {
  if (value === null || value.trim() === '') return 25;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer.');
  return Math.min(limit, 100);
}

function cursorPaginatedEnvelope<T>(items: T[], params: URLSearchParams) {
  const limit = parseCursorLimit(params.get('limit'));
  const offset = parseCursorOffset(params.get('cursor'));
  const window = items.slice(offset, offset + limit);
  const nextOffset = offset + window.length;
  const hasMore = nextOffset < items.length;
  return {
    items: window,
    pagination: {
      limit,
      cursor: params.get('cursor'),
      nextCursor: hasMore ? encodeCursorOffset(nextOffset) : null,
      hasMore,
      totalReturned: window.length,
      totalItems: items.length,
      totalProductCount: items.length,
      source: 'cursor pagination over stable product search ordering'
    },
    guardrails: [
      'No offset page numbers are exposed in the public API; clients continue with nextCursor only.',
      'Search result order remains the API sort order before pagination, so cursors do not fabricate ranking changes.',
      'Missing or invalid cursor tokens fail closed instead of silently returning the first page.'
    ]
  };
}

const watchlistPriceTypes = ['shelf', 'member', 'promotion', 'estimated'] as const satisfies readonly WatchlistPriceType[];

function optionalWatchlistPriceTypes(value: unknown): WatchlistPriceType[] | undefined {
  const values = optionalStringArray(value, 'allowedPriceTypes');
  if (values === undefined) return undefined;
  const allowed = new Set<string>(watchlistPriceTypes);
  for (const priceType of values) {
    if (!allowed.has(priceType)) {
      throw new Error(`allowedPriceTypes must contain only: ${watchlistPriceTypes.join(', ')}.`);
    }
  }
  return values as WatchlistPriceType[];
}

type FlyerOfferSqlRow = {
  observation_id: string;
  source_run_id: string | null;
  raw_record_id: string | null;
  price_type: 'promotion' | 'member';
  price: string | number;
  regular_price: string | number;
  currency: 'SEK';
  promotion_text: string | null;
  promotion_starts_on: string | Date | null;
  promotion_ends_on: string | Date | null;
  member_required: boolean;
  observed_at: string | Date;
  valid_from: string | Date | null;
  valid_until: string | Date | null;
  confidence: string | number;
  provenance: Record<string, unknown> | string | null;
  product_id: string;
  product_slug: string;
  product_name: string;
  category_path: string[];
  chain_id: string;
  chain_slug: string;
  chain_name: string;
  store_id: string;
  store_slug: string;
  store_name: string;
  store_city: string | null;
};

type StoreFlyerSqlRow = {
  store_slug: string;
  store_name: string;
  chain_slug: string;
};

type WatchlistLatestPriceRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  store_slug: string;
  store_name: string;
  price: string | number;
  price_type: WatchlistPriceType;
  confidence: string | number;
  observed_at: string | Date;
};

type WatchlistProductIdentityRow = {
  product_id: string;
  product_slug: string;
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function optionalIso(value: string | Date | null): string | undefined {
  return value === null ? undefined : iso(value);
}

function provenanceRecord(value: Record<string, unknown> | string | null): Record<string, unknown> {
  if (!value) return {};
  return typeof value === 'string' ? JSON.parse(value) as Record<string, unknown> : value;
}

function flyerObservationFromSql(row: FlyerOfferSqlRow): FlyerOfferObservationInput {
  const promotionStartsOn = optionalIso(row.promotion_starts_on);
  const promotionEndsOn = optionalIso(row.promotion_ends_on);
  const validFrom = optionalIso(row.valid_from);
  const validUntil = optionalIso(row.valid_until);
  return {
    observationId: row.observation_id,
    ...(row.source_run_id ? { sourceRunId: row.source_run_id } : {}),
    ...(row.raw_record_id ? { rawRecordId: row.raw_record_id } : {}),
    priceType: row.price_type,
    price: Number(row.price),
    regularPrice: Number(row.regular_price),
    currency: row.currency,
    ...(row.promotion_text ? { promotionText: row.promotion_text } : {}),
    ...(promotionStartsOn ? { promotionStartsOn } : {}),
    ...(promotionEndsOn ? { promotionEndsOn } : {}),
    memberRequired: row.member_required,
    observedAt: iso(row.observed_at),
    ...(validFrom ? { validFrom } : {}),
    ...(validUntil ? { validUntil } : {}),
    confidence: Number(row.confidence),
    provenance: provenanceRecord(row.provenance),
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    categoryPath: row.category_path ?? [],
    chainId: row.chain_id,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    storeId: row.store_id,
    storeSlug: row.store_slug,
    storeName: row.store_name,
    ...(row.store_city ? { storeCity: row.store_city } : {})
  };
}

async function queryFlyerOffersFromPostgres(executor: QueryExecutor, query: FlyerOffersProviderQuery): Promise<FlyerOfferReport> {
  const asOf = query.asOf ?? new Date().toISOString();
  const rows = await executor.query<FlyerOfferSqlRow>(
    `select observations.id::text as observation_id,
            observations.source_run_id::text,
            observations.raw_record_id::text,
            observations.price_type,
            observations.price,
            observations.regular_price,
            observations.currency,
            observations.promotion_text,
            observations.promotion_starts_on,
            observations.promotion_ends_on,
            observations.member_required,
            observations.observed_at,
            observations.valid_from,
            observations.valid_until,
            observations.confidence,
            observations.provenance,
            products.id::text as product_id,
            products.slug as product_slug,
            products.canonical_name as product_name,
            products.category_path,
            chains.id::text as chain_id,
            chains.slug as chain_slug,
            chains.name as chain_name,
            stores.id::text as store_id,
            stores.slug as store_slug,
            stores.name as store_name,
            stores.city as store_city
     from observations
     join products on products.id = observations.product_id
     join chains on chains.id = observations.chain_id
     join stores on stores.id = observations.store_id
     where observations.price_type in ('promotion', 'member')
       and observations.regular_price is not null
       and observations.price < observations.regular_price
       and ($1::timestamptz >= coalesce(observations.valid_from, observations.promotion_starts_on::timestamptz, observations.observed_at))
       and ($1::timestamptz <= coalesce(observations.valid_until, (observations.promotion_ends_on::timestamptz + interval '1 day' - interval '1 millisecond'), observations.observed_at))
       and ($2::text is null or stores.slug = $2)
       and ($3::text is null or chains.slug = $3)
       and ($4::text is null or exists (select 1 from unnest(products.category_path) category where lower(category) = lower($4::text)))
       and ($5::text is null or products.slug = $5 or products.id::text = $5)
     order by observations.observed_at desc, stores.name, products.canonical_name`,
    [
      asOf,
      query.storeId ?? null,
      query.chain ?? null,
      query.category ?? null,
      query.productId ?? null
    ]
  );
  return buildFlyerOfferReport({
    asOf,
    filters: {
      ...(query.storeId ? { storeId: query.storeId } : {}),
      ...(query.chain ? { chain: query.chain } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.productId ? { productId: query.productId } : {})
    },
    observations: rows.map(flyerObservationFromSql)
  });
}

async function queryStoreFlyerOffersFromPostgres(
  executor: QueryExecutor,
  storeId: string,
  query: StoreFlyerOffersProviderQuery
): Promise<StoreFlyerOfferReport | null> {
  const stores = await executor.query<StoreFlyerSqlRow>(
    `select stores.slug as store_slug,
            stores.name as store_name,
            chains.slug as chain_slug
     from stores
     join chains on chains.id = stores.chain_id
     where stores.slug = $1`,
    [storeId]
  );
  const store = stores[0];
  if (!store) return null;
  const report = await queryFlyerOffersFromPostgres(executor, { asOf: query.asOf, storeId });
  return {
    storeId: store.store_slug,
    storeName: store.store_name,
    chain: store.chain_slug,
    asOf: report.asOf,
    offerCount: report.offerCount,
    categoryCount: new Set(report.offers.map((offer) => offer.category)).size,
    totalOneEachSavings: report.offers.reduce((sum, offer) => Math.round((sum + offer.savings + Number.EPSILON) * 100) / 100, 0),
    bestOffer: report.offers[0] ?? null,
    offers: report.offers,
    guardrails: report.guardrails
  };
}

async function watchlistProductsFromPostgres(executor: QueryExecutor, watchlist: readonly WatchlistItem[]): Promise<WatchlistProductSnapshot[]> {
  const productIds = [...new Set(watchlist.map((item) => item.productId))];
  if (productIds.length === 0) return [];
  const rows = await executor.query<WatchlistLatestPriceRow>(
    `select products.id::text as product_id,
            products.slug as product_slug,
            products.canonical_name as product_name,
            stores.slug as store_slug,
            stores.name as store_name,
            latest_prices.price,
            latest_prices.price_type,
            latest_prices.confidence,
            latest_prices.observed_at
     from latest_prices
     join products on products.id = latest_prices.product_id
     left join stores on stores.id = latest_prices.store_id
     where products.id::text = any($1::text[])
        or products.slug = any($1::text[])
     order by products.id::text, latest_prices.price asc, stores.name nulls last, latest_prices.observed_at desc`,
    [productIds]
  );

  const rowsByProduct = new Map<string, WatchlistLatestPriceRow[]>();
  for (const row of rows) {
    const keys = new Set([row.product_id, row.product_slug]);
    for (const key of keys) rowsByProduct.set(key, [...(rowsByProduct.get(key) ?? []), row]);
  }

  return productIds.flatMap((productId) => {
    const productRows = rowsByProduct.get(productId) ?? [];
    const best = productRows[0];
    if (!best) return [];
    return [{
      productId,
      productName: best.product_name,
      bestPrice: Number(best.price),
      bestStoreId: best.store_slug,
      bestPriceType: best.price_type,
      prices: productRows.map((row) => ({
        storeId: row.store_slug,
        storeName: row.store_name,
        price: Number(row.price),
        priceType: row.price_type
      })),
      dealScore: Math.round(Math.max(0, Math.min(1, Number(best.confidence))) * 100),
      isNew52WeekLow: false
    }];
  });
}

async function normalizeWatchlistProductIds(executor: QueryExecutor, watchlist: readonly WatchlistItem[]): Promise<WatchlistItem[]> {
  const productIds = [...new Set(watchlist.map((item) => item.productId))];
  if (productIds.length === 0) return [...watchlist];
  const rows = await executor.query<WatchlistProductIdentityRow>(
    `select id::text as product_id,
            slug as product_slug
     from products
     where id::text = any($1::text[])
        or slug = any($1::text[])`,
    [productIds]
  );
  const slugsByIdentifier = new Map<string, string>();
  for (const row of rows) {
    slugsByIdentifier.set(row.product_id, row.product_slug);
    slugsByIdentifier.set(row.product_slug, row.product_slug);
  }
  return watchlist.map((item) => ({
    ...item,
    productId: slugsByIdentifier.get(item.productId) ?? item.productId
  }));
}

async function queryWatchlistPriceAlertsFromPostgres(
  executor: QueryExecutor,
  repository: RuntimeWatchlistRepository,
  userId: string
): Promise<WatchlistPriceAlertReport> {
  const [rawWatchlist, favoriteStoreIds] = await Promise.all([
    repository.getWatchlist(userId),
    repository.getFavoriteStoreIds(userId)
  ]);
  const watchlist = await normalizeWatchlistProductIds(executor, rawWatchlist);
  const favoriteStoreRows = favoriteStoreIds.length === 0
    ? []
    : await executor.query<{ store_slug: string }>(
      'select slug as store_slug from stores where id::text = any($1::text[]) or slug = any($1::text[])',
      [favoriteStoreIds]
    );
  const favoriteStoreSlugs = favoriteStoreRows.length === 0 ? favoriteStoreIds : favoriteStoreRows.map((row) => row.store_slug);
  const products = await watchlistProductsFromPostgres(executor, watchlist);
  const alerts = buildWatchlistAlerts({ watchlist, products, favoriteStoreIds: favoriteStoreSlugs });
  const targetPriceItemCount = watchlist.filter((item) => item.targetPrice !== undefined).length;
  return {
    userId,
    trackedItemCount: targetPriceItemCount,
    alertCount: alerts.filter((alert) => alert.type === 'target_price').length,
    alerts: alerts.filter((alert) => alert.type === 'target_price'),
    guardrails: [
      'Watchlist target-price alerts are calculated from persisted latest_prices rows for saved watchlist items.',
      'Favorite-store alerts only fire when the current best eligible row belongs to a saved favorite store.',
      'Allowed price types filter eligible shelf, member, promotion, and estimated rows before threshold evaluation.'
    ]
  };
}

async function upsertWatchlistPriceAlertInPostgres(
  executor: QueryExecutor,
  repository: RuntimeWatchlistRepository,
  userId: string,
  request: WatchlistPriceAlertRequest
): Promise<WatchlistPriceAlertReport> {
  const existingRows = await executor.query<{ id: string }>(
    'select id::text from watchlist_items where user_id = $1 and (product_id::text = $2 or product_id::text in (select id::text from products where slug = $2)) order by id limit 1',
    [userId, request.productId]
  );
  if (existingRows[0]) {
    await executor.query(
      `update watchlist_items
       set target_price = $2,
           favorite_stores_only = $3,
           allowed_price_types = $4
       where id::text = $1`,
      [
        existingRows[0].id,
        request.targetPrice,
        request.favoriteStoresOnly ?? true,
        request.allowedPriceTypes ?? ['shelf']
      ]
    );
  } else {
    const productRows = await executor.query<WatchlistProductIdentityRow>(
      'select id::text as product_id, slug as product_slug from products where id::text = $1 or slug = $1 limit 1',
      [request.productId]
    );
    const productSlug = productRows[0]?.product_slug;
    if (!productSlug) throw new Error(`Unknown productId: ${request.productId}`);
    await repository.addWatchlistItem(userId, {
      productId: productSlug,
      targetPrice: request.targetPrice,
      favoriteStoresOnly: request.favoriteStoresOnly ?? true,
      allowedPriceTypes: request.allowedPriceTypes ?? ['shelf']
    });
  }
  return queryWatchlistPriceAlertsFromPostgres(executor, repository, userId);
}

function householdPlanRequestFromBody(body: JsonRecord): HouseholdPlanRequest {
  return {
    householdId: requiredString(body.householdId, 'householdId'),
    name: requiredString(body.name, 'name'),
    weeklyBudget: requiredNumber(body.weeklyBudget, 'weeklyBudget'),
    approvalLimit: requiredNumber(body.approvalLimit, 'approvalLimit'),
    reviewer: requiredString(body.reviewer, 'reviewer'),
    members: requiredRecordArray(body.members, 'members').map((member) => ({
      userId: requiredString(member.userId, 'members.userId'),
      displayName: requiredString(member.displayName, 'members.displayName')
    })),
    basketItems: (optionalRecordArray(body.basketItems, 'basketItems') ?? []).map((item) => ({
      productId: requiredString(item.productId, 'basketItems.productId'),
      quantity: requiredNumber(item.quantity, 'basketItems.quantity'),
      addedBy: requiredString(item.addedBy, 'basketItems.addedBy')
    })),
    watchlistItems: (optionalRecordArray(body.watchlistItems, 'watchlistItems') ?? []).map((item) => {
      const targetPrice = optionalNumber(item.targetPrice, 'watchlistItems.targetPrice');
      return {
        productId: requiredString(item.productId, 'watchlistItems.productId'),
        addedBy: requiredString(item.addedBy, 'watchlistItems.addedBy'),
        ...(targetPrice === undefined ? {} : { targetPrice })
      };
    }),
    sharedFavoriteStoreIds: optionalStringArray(body.sharedFavoriteStoreIds, 'sharedFavoriteStoreIds') ?? []
  };
}

function privacyRequestsFromBody(body: JsonRecord, userId: string): PrivacyRequest[] {
  return requiredRecordArray(body.requests, 'requests').map((request, index) => {
    const requestUserId = requiredString(request.userId, `requests[${index}].userId`);
    if (requestUserId !== userId) throw new Error(`requests[${index}].userId must match requested user.`);
    return {
      id: requiredString(request.id, `requests[${index}].id`),
      userId: requestUserId,
      type: requiredPrivacyRequestType(request.type),
      receivedAt: requiredIsoTimestamp(request.receivedAt, `requests[${index}].receivedAt`),
      status: requiredPrivacyRequestStatus(request.status)
    };
  });
}

function categoryBudgetPatchesFromBody(body: JsonRecord): CategoryBudgetPatch[] {
  return requiredRecordArray(body.categories, 'categories').map((category) => ({
    category: requiredString(category.category, 'categories.category'),
    weeklyBudget: requiredNumber(category.weeklyBudget, 'categories.weeklyBudget')
  }));
}

function pantryPlanRequestFromBody(body: JsonRecord, now: string) {
  return {
    now: optionalIsoTimestamp(body.now, 'now') ?? now,
    expiringSoonDays: optionalNonNegativeNumber(body.expiringSoonDays, 'expiringSoonDays', 3),
    pantry: requiredRecordArray(body.pantry, 'pantry').map((item, index) => {
      const targetQuantity = optionalNumber(item.targetQuantity, `pantry[${index}].targetQuantity`);
      const expiresAt = optionalIsoTimestamp(item.expiresAt, `pantry[${index}].expiresAt`);
      const lastPurchasedAt = optionalIsoTimestamp(item.lastPurchasedAt, `pantry[${index}].lastPurchasedAt`);
      return {
        productId: requiredString(item.productId, `pantry[${index}].productId`),
        name: requiredString(item.name, `pantry[${index}].name`),
        category: requiredString(item.category, `pantry[${index}].category`),
        quantity: requiredNumber(item.quantity, `pantry[${index}].quantity`),
        unit: requiredPantryUnit(item.unit),
        minimumQuantity: requiredNumber(item.minimumQuantity, `pantry[${index}].minimumQuantity`),
        ...(targetQuantity === undefined ? {} : { targetQuantity }),
        ...(expiresAt === undefined ? {} : { expiresAt }),
        ...(lastPurchasedAt === undefined ? {} : { lastPurchasedAt })
      };
    }),
    usage: (optionalRecordArray(body.usage, 'usage') ?? []).map((event, index) => ({
      productId: requiredString(event.productId, `usage[${index}].productId`),
      quantityUsed: requiredNumber(event.quantityUsed, `usage[${index}].quantityUsed`),
      usedAt: requiredIsoTimestamp(event.usedAt, `usage[${index}].usedAt`)
    })),
    deals: (optionalRecordArray(body.deals, 'deals') ?? []).map((deal, index) => {
      const dealScore = optionalNumber(deal.dealScore, `deals[${index}].dealScore`);
      return {
        productId: requiredString(deal.productId, `deals[${index}].productId`),
        storeId: requiredString(deal.storeId, `deals[${index}].storeId`),
        storeName: requiredString(deal.storeName, `deals[${index}].storeName`),
        price: requiredNumber(deal.price, `deals[${index}].price`),
        ...(dealScore === undefined ? {} : { dealScore })
      };
    })
  };
}

function userIdFrom(url: URL): string | Response {
  const userId = url.searchParams.get('userId');
  if (!userId) return errorResponse(400, 'userId query parameter is required.');
  return userId;
}

function signNotificationWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

function hasValidNotificationWebhookSignature(request: Request, body: string, secret: string): boolean {
  const provided = request.headers.get('x-groceryview-signature');
  if (!provided) return false;

  const expected = signNotificationWebhookBody(body, secret);
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

function signBillingWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

const STRIPE_WEBHOOK_SIGNATURE_TOLERANCE_SECONDS = 300;

function hasConstantTimeEqualSignature(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

function hasValidStripeBillingWebhookSignature(request: Request, body: string, secret: string, now: Date): boolean {
  const header = request.headers.get('stripe-signature');
  if (!header) return false;
  const parts = header.split(',').map((part) => part.trim()).filter(Boolean);
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isInteger(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Math.floor(now.getTime() / 1000) - timestampSeconds);
  if (ageSeconds > STRIPE_WEBHOOK_SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return signatures.some((signature) => hasConstantTimeEqualSignature(signature, expected));
}

function hasValidBillingWebhookSignature(request: Request, body: string, secret: string, now: Date): boolean {
  const provided = request.headers.get('x-groceryview-billing-signature');
  if (provided) {
    return hasConstantTimeEqualSignature(provided, signBillingWebhookBody(body, secret));
  }

  return hasValidStripeBillingWebhookSignature(request, body, secret, now);
}

function hasValidMetricsToken(request: Request, token: string): boolean {
  const provided = request.headers.get('x-groceryview-metrics-token');
  if (!provided) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(token);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export type PostgresReadinessDiagnostics = {
  blockers: {
    total: number;
    missingTables: number;
    missingMigrations: number;
    repositoryChecks: number;
  };
  evidence: {
    total: number;
    tables: number;
    migrations: number;
    repositoryChecks: number;
  };
};

export type HttpPostgresReadinessReport = PostgresIntegrationReadinessReport & {
  diagnostics: PostgresReadinessDiagnostics;
  target?: PostgresReadinessTarget;
};

export type PostgresReadinessTarget = {
  host: string;
  database: string;
  username: string;
  isSupabasePooler: boolean;
  poolerMode: 'direct' | 'session' | 'transaction';
};

export function summarizePostgresReadinessForHttp(report: PostgresIntegrationReadinessReport): PostgresReadinessDiagnostics {
  return {
    blockers: report.blockers.reduce<PostgresReadinessDiagnostics['blockers']>(
      (summary, blocker) => {
        summary.total += 1;
        if (blocker.startsWith('missing_table:')) summary.missingTables += 1;
        if (blocker.startsWith('missing_migration:')) summary.missingMigrations += 1;
        if (blocker.startsWith('repository_check_')) summary.repositoryChecks += 1;
        return summary;
      },
      { total: 0, missingTables: 0, missingMigrations: 0, repositoryChecks: 0 }
    ),
    evidence: report.evidence.reduce<PostgresReadinessDiagnostics['evidence']>(
      (summary, entry) => {
        summary.total += 1;
        if (entry.startsWith('table:')) summary.tables += 1;
        if (entry.startsWith('migration:')) summary.migrations += 1;
        if (entry.startsWith('repository_check:')) summary.repositoryChecks += 1;
        return summary;
      },
      { total: 0, tables: 0, migrations: 0, repositoryChecks: 0 }
    )
  };
}

export function postgresReadinessTargetFromDatabaseUrl(databaseUrl: string | undefined): PostgresReadinessTarget | undefined {
  if (!databaseUrl?.trim()) return undefined;
  const url = new URL(databaseUrl);
  const port = url.port ? Number.parseInt(url.port, 10) : 5432;
  const isSupabasePooler = url.hostname.endsWith('.pooler.supabase.com');
  return {
    host: url.hostname,
    database: url.pathname.replace(/^\//, '') || 'postgres',
    username: decodeURIComponent(url.username),
    isSupabasePooler,
    poolerMode: isSupabasePooler ? (port === 5432 ? 'session' : 'transaction') : 'direct'
  };
}

function postgresReadinessResponse(
  report: PostgresIntegrationReadinessReport,
  target?: PostgresReadinessTarget
): HttpPostgresReadinessReport {
  return {
    ...report,
    ...(target ? { target } : {}),
    diagnostics: summarizePostgresReadinessForHttp(report)
  };
}

function sourceRunHealthFailureResponse(): SourceRunHealthCheckResult {
  const report: SourceRunHealthReport = {
    status: 'blocked',
    blockers: ['source_run_health_probe_failed'],
    evidence: [],
    runningRunIds: [],
    staleRunIds: []
  };
  return {
    report,
    summary: {
      status: report.status,
      blockers: {
        total: 1,
        failed: 0,
        partial: 0,
        stale: 0,
        stuckRunning: 0,
        missingFinishedAt: 0,
        startedInFuture: 0,
        finishedInFuture: 0,
        noFreshRuns: 0,
        missingFreshChains: 0,
        insufficientAcceptedRows: 0
      },
      evidence: {
        total: 0,
        succeeded: 0
      },
      running: 0,
      stale: 0
    },
    runCount: 0,
    filter: { limit: 0 }
  };
}


function scanProviderReadinessFailureResponse(): ScanProviderReadinessReport {
  return {
    status: 'blocked',
    blockers: ['scan_provider_readiness_probe_failed'],
    evidence: [],
    warnings: [],
    summary: 'Scan provider readiness is blocked.'
  };
}

export type ScanUploadStorageReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  warnings: string[];
  summary: string;
};

export type ScanUploadCorsReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  warnings: string[];
  summary: string;
};

export type ScanUploadWriteReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  warnings: string[];
  summary: string;
};

function scanUploadStorageReadinessFailureResponse(): ScanUploadStorageReadinessReport {
  return {
    status: 'blocked',
    blockers: ['scan_upload_storage_readiness_probe_failed'],
    evidence: [],
    warnings: [],
    summary: 'Scan upload storage readiness is blocked.'
  };
}

function scanUploadCorsReadinessFailureResponse(): ScanUploadCorsReadinessReport {
  return {
    status: 'blocked',
    blockers: ['scan_upload_cors_readiness_probe_failed'],
    evidence: [],
    warnings: [],
    summary: 'Scan upload CORS readiness is blocked.'
  };
}

function scanUploadWriteReadinessFailureResponse(): ScanUploadWriteReadinessReport {
  return {
    status: 'blocked',
    blockers: ['scan_upload_write_readiness_probe_failed'],
    evidence: [],
    warnings: [],
    summary: 'Scan upload write readiness is blocked.'
  };
}

export async function buildScanUploadStorageReadinessReport(input: {
  storage?: ScanUploadStorage | undefined;
  now?: Date;
}): Promise<ScanUploadStorageReadinessReport> {
  const evidence: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.storage) {
    blockers.push('scan_upload_storage_not_configured');
    return {
      status: 'blocked',
      blockers,
      evidence,
      warnings,
      summary: 'Scan upload storage readiness is blocked.'
    };
  }
  evidence.push('scan_upload_storage_configured');

  const result = await prepareScanUploadTicket({
    request: {
      scanId: 'readiness-scan-upload-storage',
      kind: 'receipt',
      contentType: 'image/jpeg',
      byteLength: 1,
      requestedAt: (input.now ?? new Date()).toISOString()
    },
    storage: input.storage
  });

  if (result.status !== 'ready') {
    blockers.push('scan_upload_storage_ticket_not_created');
  } else {
    evidence.push('scan_upload_storage_ticket_created');
    if (result.ticket.payloadUri.startsWith('s3://') || result.ticket.payloadUri.startsWith('private-upload://')) {
      evidence.push('scan_upload_storage_private_payload_uri');
    } else {
      blockers.push('scan_upload_storage_payload_uri_not_private');
    }
    if (Object.keys(result.ticket.headers).length > 0) {
      evidence.push('scan_upload_storage_headers_present');
    } else {
      blockers.push('scan_upload_storage_headers_missing');
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    evidence,
    warnings,
    summary: blockers.length === 0 ? 'Scan upload storage is ready.' : 'Scan upload storage readiness is blocked.'
  };
}

function headerListIncludes(value: string | null, expected: string): boolean {
  if (!value) return false;
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .includes(expected.toLowerCase());
}

function corsOriginAllowed(value: string | null, expectedOrigin: string): boolean {
  if (!value) return false;
  return value === '*' || value.split(',').map((entry) => entry.trim()).includes(expectedOrigin);
}

export async function buildScanUploadCorsReadinessReport(input: {
  storage?: ScanUploadStorage | undefined;
  origin?: string | undefined;
  fetch?: typeof fetch | undefined;
  now?: Date;
}): Promise<ScanUploadCorsReadinessReport> {
  const evidence: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.storage) blockers.push('scan_upload_storage_not_configured');
  if (!input.origin?.trim()) {
    blockers.push('scan_upload_cors_origin_not_configured');
  } else {
    evidence.push('scan_upload_cors_origin_configured');
  }
  if (blockers.length > 0) {
    return {
      status: 'blocked',
      blockers,
      evidence,
      warnings,
      summary: 'Scan upload CORS readiness is blocked.'
    };
  }

  const result = await prepareScanUploadTicket({
    request: {
      scanId: 'readiness-scan-upload-cors',
      kind: 'receipt',
      contentType: 'image/jpeg',
      byteLength: 1,
      requestedAt: (input.now ?? new Date()).toISOString()
    },
    storage: input.storage
  });
  if (result.status !== 'ready') {
    blockers.push('scan_upload_storage_ticket_not_created');
  } else {
    const response = await (input.fetch ?? fetch)(result.ticket.uploadUrl, {
      method: 'OPTIONS',
      headers: new Headers({
        origin: input.origin!,
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'content-type'
      })
    });
    if (!response.ok) blockers.push('scan_upload_cors_preflight_failed');
    else evidence.push('scan_upload_cors_preflight_passed');

    if (corsOriginAllowed(response.headers.get('access-control-allow-origin'), input.origin!)) {
      evidence.push('scan_upload_cors_allows_origin');
    } else {
      blockers.push('scan_upload_cors_origin_not_allowed');
    }
    if (headerListIncludes(response.headers.get('access-control-allow-methods'), 'PUT')) {
      evidence.push('scan_upload_cors_allows_put');
    } else {
      blockers.push('scan_upload_cors_put_not_allowed');
    }
    if (headerListIncludes(response.headers.get('access-control-allow-headers'), 'content-type')) {
      evidence.push('scan_upload_cors_allows_content_type');
    } else {
      blockers.push('scan_upload_cors_content_type_header_not_allowed');
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    evidence,
    warnings,
    summary: blockers.length === 0 ? 'Scan upload CORS is ready.' : 'Scan upload CORS readiness is blocked.'
  };
}

export async function buildScanUploadWriteReadinessReport(input: {
  storage?: ScanUploadStorage | undefined;
  fetch?: typeof fetch | undefined;
  now?: Date;
}): Promise<ScanUploadWriteReadinessReport> {
  const evidence: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.storage) {
    blockers.push('scan_upload_storage_not_configured');
    return {
      status: 'blocked',
      blockers,
      evidence,
      warnings,
      summary: 'Scan upload write readiness is blocked.'
    };
  }

  const result = await prepareScanUploadTicket({
    request: {
      scanId: 'readiness-scan-upload-write',
      kind: 'receipt',
      contentType: 'image/jpeg',
      byteLength: 1,
      requestedAt: (input.now ?? new Date()).toISOString()
    },
    storage: input.storage
  });

  if (result.status !== 'ready') {
    blockers.push('scan_upload_storage_ticket_not_created');
  } else {
    evidence.push('scan_upload_write_ticket_created');
    const response = await (input.fetch ?? fetch)(result.ticket.uploadUrl, {
      method: 'PUT',
      headers: new Headers(result.ticket.headers),
      body: 'x'
    });
    if (response.ok) {
      evidence.push('scan_upload_write_put_succeeded');
    } else {
      blockers.push('scan_upload_write_put_failed');
    }
    if (result.ticket.payloadUri.startsWith('s3://') || result.ticket.payloadUri.startsWith('private-upload://')) {
      evidence.push('scan_upload_write_private_payload_uri');
    } else {
      blockers.push('scan_upload_write_payload_uri_not_private');
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    evidence,
    warnings,
    summary: blockers.length === 0 ? 'Scan upload write is ready.' : 'Scan upload write readiness is blocked.'
  };
}

async function providerHealthStatus(check: (() => Promise<unknown>) | undefined): Promise<'pass' | 'fail' | 'not_run'> {
  if (!check) return 'not_run';
  try {
    await check();
    return 'pass';
  } catch {
    return 'fail';
  }
}

async function buildRuntimeScanProviderReadinessReport(config: RuntimeConfig, options: RuntimeHandlerOptions = {}): Promise<ScanProviderReadinessReport> {
  const fetchOption = options.scanProviderFetch ? { fetch: options.scanProviderFetch } : {};
  const barcodeProvider = config.openFoodFactsUserAgent
    ? createOpenFoodFactsBarcodeProvider({ userAgent: config.openFoodFactsUserAgent, ...fetchOption })
    : undefined;
  const receiptProvider = config.ocrSpaceApiKey
    ? createOcrSpaceReceiptProvider({ apiKey: config.ocrSpaceApiKey, ...fetchOption })
    : undefined;

  const [barcodeHealth, receiptHealth] = await Promise.all([
    providerHealthStatus(barcodeProvider && config.openFoodFactsHealthcheckBarcode ? () => barcodeProvider.lookup(config.openFoodFactsHealthcheckBarcode!) : undefined),
    providerHealthStatus(receiptProvider && config.ocrSpaceHealthcheckImageUrl ? () => receiptProvider.parse(config.ocrSpaceHealthcheckImageUrl!) : undefined)
  ]);

  return buildScanProviderReadinessReport({
    requiredProviders: ['barcode', 'receiptOcr'],
    providers: [
      {
        kind: 'barcode',
        providerName: 'openfoodfacts',
        configured: Boolean(config.openFoodFactsUserAgent),
        credentialsPresent: Boolean(config.openFoodFactsUserAgent),
        healthStatus: barcodeHealth
      },
      {
        kind: 'receiptOcr',
        providerName: 'ocrspace',
        configured: Boolean(config.ocrSpaceApiKey),
        credentialsPresent: Boolean(config.ocrSpaceApiKey),
        healthStatus: receiptHealth
      }
    ]
  });
}

function catalogCoverageFailureResponse(): CatalogCoverageReport {
  return {
    status: 'incomplete',
    productCount: 0,
    coverage: {
      categories: { covered: 0, target: 0, percent: 100, missing: [] },
      chains: { covered: 0, target: 0, percent: 100, missing: [] },
      stores: { covered: 0, target: 0, percent: 100, missing: [] }
    },
    missingProductStorePairs: [],
    requiredActions: ['catalog_coverage_probe_failed']
  };
}

function notificationWorkerRunResponse(result: RepositoryNotificationWorkerCycleResult) {
  return {
    accepted: true,
    dueTaskCount: result.dueTasks.length,
    suppressionCount: result.suppressions.length,
    persistedTaskUpdateCount: result.persistedTaskUpdates.length,
    alertCount: result.alerts.length,
    worker: result.worker.summary,
    report: result.report
  };
}

function notificationWorkerFailureResponse() {
  return {
    accepted: false,
    dueTaskCount: 0,
    suppressionCount: 0,
    persistedTaskUpdateCount: 0,
    alertCount: 0,
    worker: {
      delivered: 0,
      notDue: 0,
      retryScheduled: 0,
      deadLettered: 0,
      suppressed: 0
    },
    report: {
      status: 'blocked',
      metrics: {
        delivered: 0,
        notDue: 0,
        retryScheduled: 0,
        deadLettered: 0,
        suppressed: 0,
        providerFailures: 0,
        staleDueTasks: 0
      },
      blockers: ['notification_worker_run_failed'],
      warnings: [],
      staleTaskIds: []
    }
  };
}

const sensitiveBillingEventFields = new Set([
  'cardnumber',
  'card',
  'cvc',
  'cvv',
  'clientsecret',
  'paymentintentclientsecret',
  'setupintentclientsecret',
  'rawcard',
  'paymentmethod'
]);

function rejectSensitiveBillingEventFields(body: JsonRecord): void {
  const blocked = Object.keys(body).filter((field) => sensitiveBillingEventFields.has(field.toLowerCase()));
  if (blocked.length > 0) throw new Error('Billing subscription events must not include sensitive payment fields.');
}

function requiredBillingEventType(value: unknown): BillingSubscriptionEventType {
  if (value === 'subscription.active' || value === 'subscription.past_due' || value === 'subscription.canceled') return value;
  throw new Error('type must be subscription.active, subscription.past_due, or subscription.canceled.');
}

function requiredBillingProvider(value: unknown): BillingSubscriptionEvent['provider'] {
  if (value === 'stripe_compatible') return value;
  throw new Error('provider must be stripe_compatible.');
}

function optionalSubscriptionPlan(value: unknown): SubscriptionPlan | undefined {
  if (value === undefined) return undefined;
  if (value === 'premium_monthly' || value === 'premium_yearly') return value;
  throw new Error('plan must be premium_monthly or premium_yearly.');
}

function parseBillingSubscriptionEvent(body: JsonRecord): BillingSubscriptionEvent {
  rejectSensitiveBillingEventFields(body);
  const type = requiredBillingEventType(body.type);
  const plan = optionalSubscriptionPlan(body.plan);
  const currentPeriodEndsAt = optionalIsoTimestamp(body.currentPeriodEndsAt, 'currentPeriodEndsAt');
  const providerCustomerId = optionalString(body.providerCustomerId, 'providerCustomerId');
  const providerSubscriptionId = optionalString(body.providerSubscriptionId, 'providerSubscriptionId');
  if (type !== 'subscription.canceled' && !plan) {
    throw new Error('plan is required for active or past_due billing subscription events.');
  }

  return {
    provider: requiredBillingProvider(body.provider),
    providerEventId: requiredString(body.providerEventId, 'providerEventId'),
    type,
    userId: requiredString(body.userId, 'userId'),
    ...(plan ? { plan } : {}),
    ...(currentPeriodEndsAt ? { currentPeriodEndsAt } : {}),
    ...(providerCustomerId ? { providerCustomerId } : {}),
    ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
    occurredAt: requiredIsoTimestamp(body.occurredAt, 'occurredAt')
  };
}

function parseBillingSubscriptionWebhookBody(body: JsonRecord, authOptions: AuthOptions): BillingSubscriptionEvent {
  rejectSensitiveBillingEventFields(body);
  if (body.provider !== undefined) return parseBillingSubscriptionEvent(body);

  const receivedAt = (authOptions.now ?? new Date()).toISOString();
  const event = parseStripeCompatibleSubscriptionEvent({
    payload: body,
    receivedAt,
    priceIdPlanMap: authOptions.billingPriceIdPlanMap
  });
  if (!event) throw new Error('Unsupported billing subscription webhook event.');
  return event;
}

export function createHttpHandler(api = createGroceryViewApi(), authOptions: AuthOptions = {}): HttpHandler {
  const requireSession = async (request: Request): Promise<SessionPayload | Response> => {
    if (!authOptions.authSecret) return errorResponse(503, 'Auth secret is not configured.');
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return errorResponse(401, 'Bearer session token is required.');
    return verifySessionToken(token, authOptions.authSecret, authOptions.now);
  };

  const requireHumanReviewer = async (request: Request): Promise<{ reviewer: HumanReviewOperator } | Response> => {
    const session = await requireSession(request);
    if (session instanceof Response) return session;
    const repository = authOptions.humanReviewRepository;
    if (!repository) return errorResponse(503, 'Human review repository is not configured.');
    const reviewer = await repository.getHumanReviewer(session.userId);
    if (!reviewer) return errorResponse(403, 'Session user is not a registered human reviewer.');
    return { reviewer };
  };

  const authorizeUser = async (request: Request, userId: string): Promise<Response | null> => {
    if (!authOptions.authSecret) return null;
    const session = await requireSession(request);
    if (session instanceof Response) return session;
    if (session.userId !== userId) return errorResponse(403, 'Session does not match requested user.');
    return null;
  };

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();

    try {
      if (method === 'GET' && path === '/api/health') {
        const runtimeConfig = authOptions.runtimeConfig;
        return jsonResponse(
          buildHealthReport({
            nodeEnv: runtimeConfig?.nodeEnv ?? ((process.env.NODE_ENV ?? 'development') as RuntimeConfig['nodeEnv']),
            port: runtimeConfig?.port ?? Number(process.env.PORT ?? '3000'),
            authSecret: authOptions.authSecret ?? runtimeConfig?.authSecret ?? process.env.AUTH_SECRET,
            databaseUrl: runtimeConfig?.databaseUrl ?? process.env.DATABASE_URL,
            publicWebUrl: runtimeConfig?.publicWebUrl ?? process.env.PUBLIC_WEB_URL,
            notificationWebhookSecret:
              authOptions.notificationWebhookSecret ?? runtimeConfig?.notificationWebhookSecret ?? process.env.NOTIFICATION_WEBHOOK_SECRET,
            billingWebhookSecret: authOptions.billingWebhookSecret ?? runtimeConfig?.billingWebhookSecret ?? process.env.BILLING_WEBHOOK_SECRET,
            metricsToken: authOptions.notificationMetricsToken ?? runtimeConfig?.metricsToken ?? process.env.METRICS_TOKEN,
            scanUploadStorageConfigured: Boolean(authOptions.scanUploadStorage)
          })
        );
      }

      if (path === '/api/auth/session') {
        if (method === 'POST') {
          if (!authOptions.authSecret) return errorResponse(503, 'Auth secret is not configured.');
          if (!authOptions.authSessionExchange) return errorResponse(503, 'Auth session exchange is not configured.');
          const assertion = authProviderAssertionFromBody(await readJson(request));
          let verified: VerifiedAuthProviderUser;
          try {
            verified = await authOptions.authSessionExchange.verify(assertion);
          } catch {
            return errorResponse(401, 'Auth provider assertion rejected.');
          }
          const userId = requiredString(verified.userId, 'verifiedUser.userId');
          const email = optionalString(verified.email, 'verifiedUser.email');
          const expiresAt = optionalIsoTimestamp(verified.expiresAt, 'verifiedUser.expiresAt') ?? defaultSessionExpiresAt(authOptions.now ?? new Date());
          const accessToken = await createSessionToken({ userId, ...(email ? { email } : {}), expiresAt }, authOptions.authSecret);
          return jsonResponse({
            userId,
            ...(email ? { email } : {}),
            tokenType: 'Bearer',
            accessToken,
            expiresAt
          });
        }
      }

      if (method === 'GET' && path === '/api/openapi.json') return jsonResponse(buildOpenApiDocument());
      if (method === 'GET' && path === '/api/market/overview') {
        return cachedJsonResponse(authOptions.apiResponseCache, url, apiHotEndpointCacheTtlSeconds[path], () => api.getMarketOverview());
      }
      if (method === 'GET' && (path === '/api/fuel' || path === '/fuel')) return jsonResponse(api.getFuelPrices());
      if (method === 'GET' && path === '/api/nutrition/value') return jsonResponse(api.getNutritionValueReport(optionalNutritionMetric(url.searchParams.get('metric'))));
      if (path === '/api/meal-plans/suggestions') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          return jsonResponse(api.getMealPlanSuggestionsReport(user, {
            maxMealCost: optionalPositiveNumber(url.searchParams.get('maxMealCost') === null ? undefined : Number(url.searchParams.get('maxMealCost')), 'maxMealCost', 120),
            servings: optionalPositiveNumber(url.searchParams.get('servings') === null ? undefined : Number(url.searchParams.get('servings')), 'servings', 4)
          }));
        }
      }
      if (path === '/api/expiry-deals/radar') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          const categoryFilter = url.searchParams.getAll('category').flatMap((category) =>
            category.split(',').map((item) => item.trim()).filter(Boolean)
          );
          const maxDistanceKm = url.searchParams.get('maxDistanceKm');
          return jsonResponse(api.getExpiryDealRadarReport(user, {
            now: url.searchParams.get('now') ?? undefined,
            categoryFilter,
            ...(maxDistanceKm === null ? {} : { maxDistanceKm: optionalPositiveNumber(Number(maxDistanceKm), 'maxDistanceKm', 0) })
          }));
        }
      }
      if (path === '/api/pantry/replenishment') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getPantryReplenishment(user, url.searchParams.get('asOf') ?? undefined));
        if (method === 'POST') {
          const body = await readJson(request);
          return jsonResponse({
            userId: user,
            ...planPantryReplenishment(pantryPlanRequestFromBody(body, (authOptions.now ?? new Date()).toISOString()))
          });
        }
      }
      if (path === '/api/loyalty/offers') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getLoyaltyOfferReport(user));
      }
      if (path === '/api/ads/disclosure') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          const entitlement = authOptions.subscriptionEntitlementRepository
            ? await authOptions.subscriptionEntitlementRepository.getSubscriptionEntitlement(user)
            : undefined;
          return jsonResponse(api.getAdDisclosureReport(user, entitlement));
        }
      }
      if (path === '/api/notifications/inbox') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          const now = (authOptions.now ?? new Date()).toISOString();
          const [tasks, suppressions] = authOptions.notificationInboxRepository
            ? await Promise.all([
                authOptions.notificationInboxRepository.listDueNotificationTasks(now),
                authOptions.notificationInboxRepository.listActiveNotificationSuppressions()
              ])
            : [undefined, undefined];
          return jsonResponse(api.getNotificationInboxReport(user, { now, tasks, suppressions }));
        }
      }
      if (path === '/api/receipts/review') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getReceiptReviewReport(user));
      }
      const categoryMarketMatch = path.match(/^\/api\/categories\/([^/]+)\/market$/);
      if (method === 'GET' && categoryMarketMatch) {
        const report = api.getCategoryMarket(decodeURIComponent(categoryMarketMatch[1]));
        if (!report) return errorResponse(404, 'Category market not found.');
        return jsonResponse(report);
      }
      if (method === 'GET' && path === '/api/stores') return jsonResponse(api.getStores());

      if (method === 'GET' && path === '/api/deals/flyer-offers') {
        const query = {
          asOf: url.searchParams.get('asOf') ?? undefined,
          storeId: url.searchParams.get('storeId') ?? undefined,
          chain: url.searchParams.get('chain') ?? undefined,
          category: url.searchParams.get('category') ?? undefined,
          productId: url.searchParams.get('productId') ?? undefined
        };
        if (!authOptions.flyerOffersProvider) return errorResponse(503, 'Flyer offers provider is not configured.');
        return cachedJsonResponse(authOptions.apiResponseCache, url, apiHotEndpointCacheTtlSeconds[path], () => authOptions.flyerOffersProvider!(query));
      }

      if (method === 'GET' && path === '/api/deals/discounts') {
        const query = {
          asOf: url.searchParams.get('asOf') ?? undefined,
          storeId: url.searchParams.get('storeId') ?? undefined,
          chain: url.searchParams.get('chain') ?? undefined,
          category: url.searchParams.get('category') ?? undefined,
          productId: url.searchParams.get('productId') ?? undefined
        };
        if (!authOptions.flyerOffersProvider) return errorResponse(503, 'Discounts provider is not configured.');
        return cachedJsonResponse(authOptions.apiResponseCache, url, apiHotEndpointCacheTtlSeconds[path], () => authOptions.flyerOffersProvider!(query));
      }

      if (method === 'GET' && path === '/api/account/subscription-access') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (authOptions.subscriptionEntitlementRepository) {
          return jsonResponse(
            buildSubscriptionAccessPolicy({
              entitlement: await authOptions.subscriptionEntitlementRepository.getSubscriptionEntitlement(user),
              now: (authOptions.now ?? new Date()).toISOString()
            })
          );
        }
        return jsonResponse(api.getSubscriptionAccess(user, (authOptions.now ?? new Date()).toISOString()));
      }

      if (method === 'POST' && path === '/api/billing/checkout-sessions') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        const body = await readJson(request);
        const plan = requiredSubscriptionPlan(body.plan);
        const publicWebUrl = authOptions.runtimeConfig?.publicWebUrl ?? process.env.PUBLIC_WEB_URL;
        const checkoutPlan = buildSubscriptionCheckoutPlan({
          userId: user,
          plan,
          billingProviderConfigured: Boolean(authOptions.billingCheckoutProvider),
          providerPriceId: authOptions.billingCheckoutPriceIds?.[plan],
          successUrl: publicWebUrl ? `${publicWebUrl}/account?checkout=success&plan=${encodeURIComponent(plan)}` : undefined,
          cancelUrl: publicWebUrl ? `${publicWebUrl}/account?checkout=cancel&plan=${encodeURIComponent(plan)}` : undefined
        });
        if (checkoutPlan.status !== 'ready') return errorResponse(503, checkoutPlan.reason);
        if (!authOptions.billingCheckoutProvider) return errorResponse(503, 'Billing checkout provider is not configured.');
        const session = await authOptions.billingCheckoutProvider.createCheckoutSession(checkoutPlan.checkoutRequest);
        return jsonResponse({
          provider: checkoutPlan.provider,
          sessionId: session.sessionId,
          checkoutUrl: session.checkoutUrl,
          plan
        }, { status: 201 });
      }

      if (method === 'POST' && path === '/api/billing/portal-sessions') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        const entitlement = authOptions.subscriptionEntitlementRepository
          ? await authOptions.subscriptionEntitlementRepository.getSubscriptionEntitlement(user)
          : api.getSubscriptionEntitlement(user);
        const providerCustomerId = entitlement && 'providerCustomerId' in entitlement && typeof entitlement.providerCustomerId === 'string'
          ? entitlement.providerCustomerId
          : undefined;
        if (
          !entitlement ||
          entitlement.provider !== 'stripe_compatible' ||
          !providerCustomerId ||
          !['active', 'past_due'].includes(entitlement.status)
        ) {
          return errorResponse(503, 'Billing portal requires an active provider customer for this account.');
        }
        const publicWebUrl = authOptions.runtimeConfig?.publicWebUrl ?? process.env.PUBLIC_WEB_URL;
        if (!publicWebUrl) return errorResponse(503, 'Billing portal return URL is not configured.');
        if (!authOptions.billingPortalProvider) return errorResponse(503, 'Billing portal provider is not configured.');
        const session = await authOptions.billingPortalProvider.createPortalSession({
          customerReference: providerCustomerId,
          returnUrl: `${publicWebUrl}/account?billing=return`
        });
        return jsonResponse({
          provider: 'stripe_compatible',
          sessionId: session.sessionId,
          portalUrl: session.portalUrl
        }, { status: 201 });
      }

      if (method === 'GET' && path === '/api/metrics/notifications') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'Notification metrics token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid notification metrics token is required.');
        }
        if (!authOptions.notificationMetricsProvider) return errorResponse(503, 'Notification metrics provider is not configured.');

        return new Response(
          formatNotificationOperationsMetrics(await authOptions.notificationMetricsProvider(), { service: 'groceryview-server' }),
          { status: 200, headers: { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' } }
        );
      }

      if (method === 'GET' && path === '/api/readiness/postgres') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'PostgreSQL readiness token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid PostgreSQL readiness token is required.');
        }
        if (!authOptions.postgresReadinessProvider) return errorResponse(503, 'PostgreSQL readiness provider is not configured.');

        try {
          const report = await authOptions.postgresReadinessProvider();
          return jsonResponse(
            postgresReadinessResponse(report, postgresReadinessTargetFromDatabaseUrl(authOptions.runtimeConfig?.databaseUrl ?? process.env.DATABASE_URL)),
            { status: report.status === 'ready' ? 200 : 503 }
          );
        } catch {
          return jsonResponse(
            postgresReadinessResponse({
              status: 'blocked',
              blockers: ['postgres_readiness_probe_failed'],
              evidence: [],
              summary: 'PostgreSQL integration contract is blocked.'
            }),
            { status: 503 }
          );
        }
      }

      if (method === 'GET' && path === '/api/readiness/source-runs') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'Source run readiness token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid source run readiness token is required.');
        }
        if (!authOptions.sourceRunHealthProvider) return errorResponse(503, 'Source run health provider is not configured.');

        try {
          const result = await authOptions.sourceRunHealthProvider();
          return jsonResponse(result, { status: result.report.status === 'healthy' ? 200 : 503 });
        } catch {
          return jsonResponse(sourceRunHealthFailureResponse(), { status: 503 });
        }
      }

      if (method === 'GET' && path === '/api/readiness/catalog-coverage') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'Catalog coverage readiness token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid catalog coverage readiness token is required.');
        }
        if (!authOptions.catalogCoverageProvider) return errorResponse(503, 'Catalog coverage provider is not configured.');

        try {
          const report = await authOptions.catalogCoverageProvider();
          return jsonResponse(report, { status: report.status === 'complete' ? 200 : 503 });
        } catch {
          return jsonResponse(catalogCoverageFailureResponse(), { status: 503 });
        }
      }

      if (method === 'GET' && path === '/api/readiness/scanning') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'Scan provider readiness token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid scan provider readiness token is required.');
        }
        if (!authOptions.scanProviderReadinessProvider) return errorResponse(503, 'Scan provider readiness provider is not configured.');

        try {
          const report = await authOptions.scanProviderReadinessProvider();
          return jsonResponse(report, { status: report.status === 'ready' ? 200 : 503 });
        } catch {
          return jsonResponse(scanProviderReadinessFailureResponse(), { status: 503 });
        }
      }

      if (method === 'GET' && path === '/api/readiness/scan-upload-storage') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'Scan upload storage readiness token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid scan upload storage readiness token is required.');
        }
        if (!authOptions.scanUploadStorageReadinessProvider) return errorResponse(503, 'Scan upload storage readiness provider is not configured.');

        try {
          const report = await authOptions.scanUploadStorageReadinessProvider();
          return jsonResponse(report, { status: report.status === 'ready' ? 200 : 503 });
        } catch {
          return jsonResponse(scanUploadStorageReadinessFailureResponse(), { status: 503 });
        }
      }

      if (method === 'GET' && path === '/api/readiness/scan-upload-cors') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'Scan upload CORS readiness token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid scan upload CORS readiness token is required.');
        }
        if (!authOptions.scanUploadCorsReadinessProvider) return errorResponse(503, 'Scan upload CORS readiness provider is not configured.');

        try {
          const report = await authOptions.scanUploadCorsReadinessProvider();
          return jsonResponse(report, { status: report.status === 'ready' ? 200 : 503 });
        } catch {
          return jsonResponse(scanUploadCorsReadinessFailureResponse(), { status: 503 });
        }
      }

      if (method === 'GET' && path === '/api/readiness/scan-upload-write') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'Scan upload write readiness token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid scan upload write readiness token is required.');
        }
        if (!authOptions.scanUploadWriteReadinessProvider) return errorResponse(503, 'Scan upload write readiness provider is not configured.');

        try {
          const report = await authOptions.scanUploadWriteReadinessProvider();
          return jsonResponse(report, { status: report.status === 'ready' ? 200 : 503 });
        } catch {
          return jsonResponse(scanUploadWriteReadinessFailureResponse(), { status: 503 });
        }
      }

      if (method === 'POST' && path === '/api/workers/notifications/run') {
        if (!authOptions.notificationMetricsToken) return errorResponse(503, 'Notification worker token is not configured.');
        if (!hasValidMetricsToken(request, authOptions.notificationMetricsToken)) {
          return errorResponse(401, 'A valid notification worker token is required.');
        }
        if (!authOptions.notificationWorkerRunner) return errorResponse(503, 'Notification worker runner is not configured.');

        try {
          const result = await authOptions.notificationWorkerRunner();
          return jsonResponse(notificationWorkerRunResponse(result), { status: result.report.status === 'healthy' ? 202 : 503 });
        } catch {
          return jsonResponse(notificationWorkerFailureResponse(), { status: 503 });
        }
      }

      if (method === 'GET' && path === '/api/human-review/assignments') {
        const result = await requireHumanReviewer(request);
        if (result instanceof Response) return result;
        const authorization = authorizeHumanReviewAction({ reviewer: result.reviewer, action: 'view_queue' });
        if (!authorization.allowed) return errorResponse(403, authorization.reason);
        const assignments = await authOptions.humanReviewRepository!.listOpenHumanReviewAssignments();
        return jsonResponse({
          assignments,
          sla: summarizeHumanReviewSla({
            assignments,
            now: (authOptions.now ?? new Date()).toISOString()
          })
        });
      }

      const humanReviewDecisionMatch = path.match(/^\/api\/human-review\/assignments\/([^/]+)\/decisions$/);
      if (method === 'POST' && humanReviewDecisionMatch) {
        const result = await requireHumanReviewer(request);
        if (result instanceof Response) return result;
        const repository = authOptions.humanReviewRepository!;
        const assignmentId = decodeURIComponent(humanReviewDecisionMatch[1]);
        const assignments = await repository.listOpenHumanReviewAssignments();
        const assignment = assignments.find((candidate) => candidate.id === assignmentId);
        if (!assignment) return errorResponse(404, 'Human review assignment not found.');
        const authorization = authorizeHumanReviewAction({ reviewer: result.reviewer, action: 'decide_review', assignment });
        if (!authorization.allowed) return errorResponse(403, authorization.reason);

        const body = await readJson(request);
        const decision = requiredHumanReviewDecision(body.decision);
        const decidedAt = optionalString(body.decidedAt, 'decidedAt') ?? (authOptions.now ?? new Date()).toISOString();
        const decisionResult = applyHumanReviewDecision({
          item: {
            id: assignment.reviewId,
            subjectType: assignment.subjectType,
            subjectId: assignment.subjectId,
            priority: assignment.priority,
            reason: assignment.reason
          },
          decision,
          reviewerId: result.reviewer.id,
          decidedAt,
          notes: optionalString(body.notes, 'notes')
        });

        const nextAssignment: HumanReviewAssignment = {
          ...assignment,
          status: decision === 'needs_more_info' ? 'in_progress' : 'completed'
        };
        await repository.saveHumanReviewAssignment(nextAssignment);
        return jsonResponse({ decision: decisionResult, assignment: nextAssignment }, { status: 202 });
      }

      if (method === 'POST' && path === '/api/notifications/suppression-events') {
        if (!authOptions.notificationWebhookSecret) return errorResponse(503, 'Notification webhook secret is not configured.');

        const rawBody = request.body ? await request.text() : '';
        if (!hasValidNotificationWebhookSignature(request, rawBody, authOptions.notificationWebhookSecret)) {
          return errorResponse(401, 'A valid notification webhook signature is required.');
        }

        const sink = authOptions.notificationSuppressionSink;
        if (!sink) return errorResponse(503, 'Notification suppression sink is not configured.');

        const body = parseJsonObject(rawBody);
        const suppression = processNotificationSuppressionEvent({
          provider: requiredString(body.provider, 'provider'),
          providerEventId: requiredString(body.providerEventId, 'providerEventId'),
          eventType: requiredSuppressionEventType(body.eventType),
          recipient: requiredString(body.recipient, 'recipient'),
          channel: optionalDeliveryChannel(body.channel),
          occurredAt: requiredString(body.occurredAt, 'occurredAt')
        });
        await sink.upsertNotificationSuppression(suppression);
        return jsonResponse(
          { accepted: true, persisted: true, suppressionId: suppression.id, active: suppression.active },
          { status: 202 }
        );
      }

      if (method === 'POST' && path === '/api/notifications/provider-suppression-events') {
        if (!authOptions.notificationWebhookSecret) return errorResponse(503, 'Notification webhook secret is not configured.');

        const rawBody = request.body ? await request.text() : '';
        if (!hasValidNotificationWebhookSignature(request, rawBody, authOptions.notificationWebhookSecret)) {
          return errorResponse(401, 'A valid notification webhook signature is required.');
        }

        const sink = authOptions.notificationSuppressionSink;
        if (!sink) return errorResponse(503, 'Notification suppression sink is not configured.');

        const provider = requiredSuppressionWebhookProvider(url.searchParams.get('provider'));
        const events = parseNotificationSuppressionWebhook({
          provider,
          payload: JSON.parse(rawBody) as unknown,
          receivedAt: (authOptions.now ?? new Date()).toISOString()
        });
        const suppressions = events.map((event) => processNotificationSuppressionEvent(event));
        for (const suppression of suppressions) {
          await sink.upsertNotificationSuppression(suppression);
        }
        return jsonResponse(
          {
            accepted: true,
            persisted: suppressions.length,
            suppressionIds: suppressions.map((suppression) => suppression.id)
          },
          { status: 202 }
        );
      }

      if (method === 'POST' && path === '/api/billing/subscription-events') {
        if (!authOptions.billingWebhookSecret) return errorResponse(503, 'Billing webhook secret is not configured.');

        const rawBody = request.body ? await request.text() : '';
        if (!hasValidBillingWebhookSignature(request, rawBody, authOptions.billingWebhookSecret, authOptions.now ?? new Date())) {
          return errorResponse(401, 'A valid billing webhook signature is required.');
        }

        const sink = authOptions.billingSubscriptionSink;
        if (!sink) return errorResponse(503, 'Billing subscription sink is not configured.');

        const entitlement = processBillingSubscriptionEvent(parseBillingSubscriptionWebhookBody(parseJsonObject(rawBody), authOptions));
        await sink.upsertSubscriptionEntitlement(entitlement);
        return jsonResponse(
          { accepted: true, persisted: true, userId: entitlement.userId, status: entitlement.status },
          { status: 202 }
        );
      }

      const storeMatch = path.match(/^\/api\/stores\/([^/]+)$/);
      if (method === 'GET' && storeMatch) {
        const storeDetail = api.getStoreDetail(decodeURIComponent(storeMatch[1]));
        return storeDetail ? jsonResponse(storeDetail) : errorResponse(404, 'Store not found.');
      }

      const storeDealsMatch = path.match(/^\/api\/stores\/([^/]+)\/deals$/);
      if (method === 'GET' && storeDealsMatch) {
        return jsonResponse(api.getStoreDeals(decodeURIComponent(storeDealsMatch[1])));
      }

      const storeDealSummaryMatch = path.match(/^\/api\/stores\/([^/]+)\/deal-summary$/);
      if (method === 'GET' && storeDealSummaryMatch) {
        const storeId = decodeURIComponent(storeDealSummaryMatch[1]);
        if (!api.getStore(storeId)) return errorResponse(404, 'Store not found.');
        return jsonResponse(api.getStoreDealSummary(storeId));
      }

      const storeFlyerOffersMatch = path.match(/^\/api\/stores\/([^/]+)\/flyer-offers$/);
      if (method === 'GET' && storeFlyerOffersMatch) {
        const storeId = decodeURIComponent(storeFlyerOffersMatch[1]);
        if (!authOptions.storeFlyerOffersProvider) return errorResponse(503, 'Store flyer offers provider is not configured.');
        const report = await authOptions.storeFlyerOffersProvider(storeId, { asOf: url.searchParams.get('asOf') ?? undefined });
        if (!report) return errorResponse(404, 'Store not found.');
        return jsonResponse(report);
      }

      const storeDiscountsMatch = path.match(/^\/api\/stores\/([^/]+)\/discounts$/);
      if (method === 'GET' && storeDiscountsMatch) {
        const storeId = decodeURIComponent(storeDiscountsMatch[1]);
        if (!authOptions.storeFlyerOffersProvider) return errorResponse(503, 'Store discounts provider is not configured.');
        const report = await authOptions.storeFlyerOffersProvider(storeId, { asOf: url.searchParams.get('asOf') ?? undefined });
        if (!report) return errorResponse(404, 'Store not found.');
        return jsonResponse(report);
      }

      const storePriceCoverageMatch = path.match(/^\/api\/stores\/([^/]+)\/price-coverage$/);
      if (method === 'GET' && storePriceCoverageMatch) {
        const storeId = decodeURIComponent(storePriceCoverageMatch[1]);
        if (!api.getStore(storeId)) return errorResponse(404, 'Store not found.');
        return jsonResponse(api.getStorePriceCoverage(storeId));
      }

      const storeCategoryCoverageMatch = path.match(/^\/api\/stores\/([^/]+)\/category-coverage$/);
      if (method === 'GET' && storeCategoryCoverageMatch) {
        const storeId = decodeURIComponent(storeCategoryCoverageMatch[1]);
        if (!api.getStore(storeId)) return errorResponse(404, 'Store not found.');
        return jsonResponse(api.getStoreCategoryCoverage(storeId));
      }

      if (method === 'GET' && path === '/api/prices/freshness') {
        return jsonResponse(api.getPriceFreshnessReport(url.searchParams.get('asOf') ?? undefined));
      }

      if (method === 'GET' && (path === '/api/products' || path === '/api/products/search')) {
        return jsonResponse(cursorPaginatedEnvelope(api.searchProducts(url.searchParams.get('q') ?? ''), url.searchParams));
      }

      const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
      if (method === 'GET' && productMatch) {
        const product = api.getProduct(decodeURIComponent(productMatch[1]));
        return product ? jsonResponse(product) : errorResponse(404, 'Product not found.');
      }

      const productPricesMatch = path.match(/^\/api\/products\/([^/]+)\/prices$/);
      if (method === 'GET' && productPricesMatch) {
        const productId = decodeURIComponent(productPricesMatch[1]);
        if (!api.getProduct(productId)) return errorResponse(404, 'Product not found.');
        return jsonResponse(api.getProductPrices(productId));
      }

      const productPriceSpreadMatch = path.match(/^\/api\/products\/([^/]+)\/price-spread$/);
      if (method === 'GET' && productPriceSpreadMatch) {
        const report = api.getProductPriceSpread(decodeURIComponent(productPriceSpreadMatch[1]));
        return report ? jsonResponse(report) : errorResponse(404, 'Product not found.');
      }

      const productCheapestNowMatch = path.match(/^\/api\/products\/([^/]+)\/cheapest-now$/);
      if (method === 'GET' && productCheapestNowMatch) {
        const report = api.getProductCheapestNow(decodeURIComponent(productCheapestNowMatch[1]));
        return report ? jsonResponse(report) : errorResponse(404, 'Product not found.');
      }

      const productStoreSavingsMatch = path.match(/^\/api\/products\/([^/]+)\/store-savings$/);
      if (method === 'GET' && productStoreSavingsMatch) {
        const report = api.getProductStoreSavings(decodeURIComponent(productStoreSavingsMatch[1]));
        return report ? jsonResponse(report) : errorResponse(404, 'Product not found.');
      }

      const productHistoryMatch = path.match(/^\/api\/products\/([^/]+)\/history$/);
      if (method === 'GET' && productHistoryMatch) {
        const productId = decodeURIComponent(productHistoryMatch[1]);
        if (!api.getProduct(productId)) return errorResponse(404, 'Product not found.');
        return jsonResponse(api.getProductHistory(productId));
      }

      const productHistorySummaryMatch = path.match(/^\/api\/products\/([^/]+)\/history-summary$/);
      if (method === 'GET' && productHistorySummaryMatch) {
        const report = api.getProductHistorySummary(decodeURIComponent(productHistorySummaryMatch[1]));
        return report ? jsonResponse(report) : errorResponse(404, 'Product not found.');
      }

      const productHistoryConfidenceMatch = path.match(/^\/api\/products\/([^/]+)\/history-confidence$/);
      if (method === 'GET' && productHistoryConfidenceMatch) {
        const report = api.getProductHistoryConfidence(decodeURIComponent(productHistoryConfidenceMatch[1]));
        return report ? jsonResponse(report) : errorResponse(404, 'Product not found.');
      }

      const productTerminalMatch = path.match(/^\/api\/products\/([^/]+)\/terminal$/);
      if (method === 'GET' && productTerminalMatch) {
        const report = api.getProductPriceTerminal(decodeURIComponent(productTerminalMatch[1]), {
          asOf: url.searchParams.get('asOf') ?? undefined
        });
        return report ? jsonResponse(report) : errorResponse(404, 'Product not found.');
      }

      const productDealScoreMatch = path.match(/^\/api\/products\/([^/]+)\/deal-score$/);
      if (method === 'GET' && productDealScoreMatch) {
        const report = api.getDealScore(decodeURIComponent(productDealScoreMatch[1]));
        return report ? jsonResponse(report) : errorResponse(404, 'Product not found.');
      }

      const productEquivalentsMatch = path.match(/^\/api\/products\/([^/]+)\/equivalents$/);
      if (method === 'GET' && productEquivalentsMatch) {
        const productId = decodeURIComponent(productEquivalentsMatch[1]);
        if (!api.getProduct(productId)) return errorResponse(404, 'Product not found.');
        return jsonResponse(api.getProductEquivalents(productId));
      }

      const favoriteStoreMatch = path.match(/^\/api\/users\/([^/]+)\/favorite-stores$/);
      if (favoriteStoreMatch) {
        const routeUserId = decodeURIComponent(favoriteStoreMatch[1]);
        const authError = await authorizeUser(request, routeUserId);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getFavoriteStores(routeUserId));
        if (method === 'POST') {
          const body = await readJson(request);
          api.addFavoriteStore(routeUserId, requiredString(body.storeId, 'storeId'));
          return jsonResponse(api.getFavoriteStores(routeUserId), { status: 201 });
        }
      }

      const favoriteStoreDeleteMatch = path.match(/^\/api\/users\/([^/]+)\/favorite-stores\/([^/]+)$/);
      if (favoriteStoreDeleteMatch && method === 'DELETE') {
        const routeUserId = decodeURIComponent(favoriteStoreDeleteMatch[1]);
        const authError = await authorizeUser(request, routeUserId);
        if (authError) return authError;
        api.removeFavoriteStore(routeUserId, decodeURIComponent(favoriteStoreDeleteMatch[2]));
        return jsonResponse(api.getFavoriteStores(routeUserId));
      }

      if (path === '/api/watchlist') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getWatchlist(user));
        if (method === 'POST') {
          const body = await readJson(request);
          api.addWatchlistItem(user, {
            productId: requiredString(body.productId, 'productId'),
            targetPrice: optionalNumber(body.targetPrice, 'targetPrice'),
            alertDealScoreAt: optionalNumber(body.alertDealScoreAt, 'alertDealScoreAt'),
            allowedPriceTypes: optionalWatchlistPriceTypes(body.allowedPriceTypes),
            favoriteStoresOnly: typeof body.favoriteStoresOnly === 'boolean' ? body.favoriteStoresOnly : true
          });
          return jsonResponse(api.getWatchlist(user), { status: 201 });
        }
      }

      if (path === '/api/watchlist/price-alerts') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          if (!authOptions.watchlistPriceAlertsProvider) return errorResponse(503, 'Watchlist price-alert provider is not configured.');
          return jsonResponse(await authOptions.watchlistPriceAlertsProvider(user));
        }
        if (method === 'POST') {
          const body = await readJson(request);
          const alert = {
            productId: requiredString(body.productId, 'productId'),
            targetPrice: requiredNumber(body.targetPrice, 'targetPrice'),
            favoriteStoresOnly: typeof body.favoriteStoresOnly === 'boolean' ? body.favoriteStoresOnly : undefined,
            allowedPriceTypes: optionalWatchlistPriceTypes(body.allowedPriceTypes)
          };
          if (!authOptions.watchlistPriceAlertWriter) return errorResponse(503, 'Watchlist price-alert writer is not configured.');
          return jsonResponse(
            await authOptions.watchlistPriceAlertWriter(user, alert),
            { status: 201 }
          );
        }
      }

      const watchlistItemMatch = path.match(/^\/api\/watchlist\/items\/([^/]+)$/);
      if (watchlistItemMatch) {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        const productId = decodeURIComponent(watchlistItemMatch[1]);
        if (method === 'PATCH') {
          const body = await readJson(request);
          api.updateWatchlistItem(user, productId, {
            targetPrice: optionalNumber(body.targetPrice, 'targetPrice'),
            alertDealScoreAt: optionalNumber(body.alertDealScoreAt, 'alertDealScoreAt'),
            allowedPriceTypes: optionalWatchlistPriceTypes(body.allowedPriceTypes),
            favoriteStoresOnly: typeof body.favoriteStoresOnly === 'boolean' ? body.favoriteStoresOnly : undefined
          });
          return jsonResponse(api.getWatchlist(user));
        }
        if (method === 'DELETE') {
          api.removeWatchlistItem(user, productId);
          return jsonResponse(api.getWatchlist(user));
        }
      }

      if (path === '/api/basket/current') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getBasket(user));
      }

      if (path === '/api/basket/items') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'POST') {
          const body = await readJson(request);
          api.addBasketItem(user, {
            productId: requiredString(body.productId, 'productId'),
            quantity: requiredNumber(body.quantity, 'quantity')
          });
          return jsonResponse(api.getBasket(user), { status: 201 });
        }
      }

      const basketItemMatch = path.match(/^\/api\/basket\/items\/([^/]+)$/);
      if (basketItemMatch) {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        const productId = decodeURIComponent(basketItemMatch[1]);
        if (method === 'PATCH') {
          const body = await readJson(request);
          api.updateBasketItem(user, productId, requiredNumber(body.quantity, 'quantity'));
          return jsonResponse(api.getBasket(user));
        }
        if (method === 'DELETE') {
          api.removeBasketItem(user, productId);
          return jsonResponse(api.getBasket(user));
        }
      }

      if (path === '/api/basket/compare') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'POST') return jsonResponse(api.compareBasket(user));
      }

      if (path === '/api/basket/comparison-report') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.compareBasketReport(user));
      }

      if (path === '/api/basket/local-offers') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getLocalOfferBasketReport(user, url.searchParams.get('asOf') ?? undefined));
      }

      if (path === '/api/basket/import-export') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'POST') {
          const body = await readJson(request);
          const report = api.importBasketFromRetailerPage(user, basketImportExportRequestFromBody(body));
          if (authOptions.basketImportReviewRepository && report.reviewItems.length > 0) {
            const existingOpen = await authOptions.basketImportReviewRepository.listOpenBasketImportReviewItems(user);
            await authOptions.basketImportReviewRepository.saveBasketImportReviewItems(
              user,
              createBasketImportReviewItems(user, report.source, report.reviewItems, existingOpen.length)
            );
          }
          return jsonResponse(report, { status: 201 });
        }
      }

      if (path === '/api/basket/import-review') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          if (authOptions.basketImportReviewRepository) {
            const items = await authOptions.basketImportReviewRepository.listOpenBasketImportReviewItems(user);
            return jsonResponse({ userId: user, openItemCount: items.length, items, guardrails: basketImportReviewGuardrails });
          }
          return jsonResponse(api.getBasketImportReviewQueue(user));
        }
      }

      const importReviewDecisionMatch = path.match(/^\/api\/basket\/import-review\/([^/]+)\/decisions$/);
      if (importReviewDecisionMatch) {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'POST') {
          const body = await readJson(request);
          const requestBody = basketImportReviewDecisionFromBody(body);
          const reviewItemId = decodeURIComponent(importReviewDecisionMatch[1]!);
          if (authOptions.basketImportReviewRepository) {
            const openItems = await authOptions.basketImportReviewRepository.listOpenBasketImportReviewItems(user);
            const reviewItem = openItems.find((item) => item.reviewItemId === reviewItemId);
            if (!reviewItem) return errorResponse(404, `Basket import review item not found: ${reviewItemId}`);
            if (requestBody.decision === 'accept_as_product') {
              if (!requestBody.productId) return errorResponse(400, 'productId is required when accepting an import review item.');
              if (!api.getProduct(requestBody.productId)) return errorResponse(400, `Unknown product: ${requestBody.productId}`);
              if (requestBody.quantity !== undefined) requiredNumber(requestBody.quantity, 'quantity');
              const quantity = requestBody.quantity ?? reviewItem.quantity;
              api.addBasketItem(user, { productId: requestBody.productId, quantity });
              return jsonResponse(await authOptions.basketImportReviewRepository.resolveBasketImportReviewItem(user, reviewItemId, {
                status: 'accepted',
                resolvedAt: (authOptions.now ?? new Date()).toISOString(),
                resolvedProductId: requestBody.productId,
                quantity
              }));
            }
            return jsonResponse(await authOptions.basketImportReviewRepository.resolveBasketImportReviewItem(user, reviewItemId, {
              status: 'dismissed',
              resolvedAt: (authOptions.now ?? new Date()).toISOString()
            }));
          }
          return jsonResponse(api.resolveBasketImportReviewItem(user, reviewItemId, requestBody));
        }
      }

      const fulfillmentSlotMatch = path.match(/^\/api\/basket\/fulfillment-slots\/([^/]+)\/([^/]+)$/);
      if (fulfillmentSlotMatch) {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getBasketFulfillmentSlots(user, decodeURIComponent(fulfillmentSlotMatch[1]!), decodeURIComponent(fulfillmentSlotMatch[2]!)));
      }

      const handoffMatch = path.match(/^\/api\/basket\/handoff\/([^/]+)$/);
      if (handoffMatch) {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getRetailerHandoffPlan(user, decodeURIComponent(handoffMatch[1])));
      }

      const transferMatch = path.match(/^\/api\/basket\/transfer\/([^/]+)$/);
      if (transferMatch) {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getRetailerBasketTransferSession(user, decodeURIComponent(transferMatch[1]!)));
      }

      if (path === '/api/basket/trip-cost') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          return jsonResponse(api.getBasketTripCostReport(user, {
            travelMode: requiredTravelMode(url.searchParams.get('travelMode')),
            valueOfTimePerHour: optionalQueryNumber(url, 'valueOfTimePerHour'),
            carCostPerKm: optionalQueryNumber(url, 'carCostPerKm'),
            transitFare: optionalQueryNumber(url, 'transitFare'),
            splitTripPenalty: optionalQueryNumber(url, 'splitTripPenalty')
          }));
        }
      }

      if (path === '/api/basket/recurring-digest') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          return jsonResponse(api.getRecurringBasketDigest(user, {
            templateId: requiredString(url.searchParams.get('templateId'), 'templateId'),
            templateName: requiredString(url.searchParams.get('templateName'), 'templateName'),
            cadence: requiredRecurringCadence(url.searchParams.get('cadence')),
            asOf: requiredString(url.searchParams.get('asOf'), 'asOf'),
            ...(url.searchParams.get('lastPurchasedAt')
              ? { lastPurchasedAt: requiredString(url.searchParams.get('lastPurchasedAt'), 'lastPurchasedAt') }
              : {})
          }));
        }
      }

      const basketStoreQuoteMatch = path.match(/^\/api\/basket\/stores\/([^/]+)\/quote$/);
      if (basketStoreQuoteMatch) {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.quoteBasketAtStore(user, decodeURIComponent(basketStoreQuoteMatch[1])));
      }

      if (path === '/api/budget') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'PATCH') {
          const body = await readJson(request);
          const budget = {
            weeklyBudget: requiredNumber(body.weeklyBudget, 'weeklyBudget'),
            monthlyBudget: requiredNumber(body.monthlyBudget, 'monthlyBudget')
          };
          api.updateBudget(user, budget);
          await authOptions.budgetRepository?.upsertBudget(user, budget);
          return jsonResponse(api.getBudgetSummary(user));
        }
      }

      if (path === '/api/budget/summary') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          const budget = await authOptions.budgetRepository?.getBudget(user);
          if (budget) api.updateBudget(user, budget);
          return jsonResponse(api.getBudgetSummary(user));
        }
      }

      if (path === '/api/budget/categories') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getCategoryBudgetSummary(user));
        if (method === 'PATCH') {
          const body = await readJson(request);
          api.updateCategoryBudgets(user, categoryBudgetPatchesFromBody(body));
          return jsonResponse(api.getCategoryBudgetSummary(user));
        }
      }

      if (path === '/api/households/current') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          const plan = api.getHouseholdPlan(user);
          return plan ? jsonResponse({ userId: user, ...plan }) : errorResponse(404, 'Household plan not found.');
        }
        if (method === 'PUT') {
          const body = await readJson(request);
          return jsonResponse({ userId: user, ...api.upsertHouseholdPlan(user, householdPlanRequestFromBody(body)) });
        }
      }

      if (path === '/api/privacy/export') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') {
          const householdPlan = api.getHouseholdPlan(user);
          return jsonResponse(
            buildPrivacyExport(
              {
                userId: user,
                favoriteStoreIds: api.getFavoriteStores(user).map((store) => store.id),
                watchlistProductIds: api.getWatchlist(user).items.map((item) => item.productId),
                receiptIds: [],
                householdIds: householdPlan ? [householdPlan.household.id] : []
              },
              (authOptions.now ?? new Date()).toISOString()
            )
          );
        }
      }

      if (path === '/api/privacy/deletion-plan') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'POST') return jsonResponse({ ...planAccountDeletion(user), destructiveAction: false, requiresReauthentication: true });
      }

      if (path === '/api/privacy/request-fulfillment') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'POST') {
          const body = await readJson(request);
          return jsonResponse(
            planPrivacyRequestFulfillment({
              now: (authOptions.now ?? new Date()).toISOString(),
              slaDays: optionalPositiveNumber(body.slaDays, 'slaDays', 30),
              alertBeforeDays: optionalNonNegativeNumber(body.alertBeforeDays, 'alertBeforeDays', 5),
              requests: privacyRequestsFromBody(body, user)
            })
          );
        }
      }

      if (path === '/api/scans/upload-url') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'POST') {
          const body = await readJson(request);
          const result = await prepareScanUploadTicket({
            request: {
              scanId: requiredString(body.scanId, 'scanId'),
              kind: requiredScanKind(body.kind),
              contentType: requiredString(body.contentType, 'contentType'),
              byteLength: requiredNumber(body.byteLength, 'byteLength'),
              requestedAt: optionalIsoTimestamp(body.requestedAt, 'requestedAt') ?? (authOptions.now ?? new Date()).toISOString()
            },
            storage: authOptions.scanUploadStorage
          });
          return jsonResponse({ userId: user, result });
        }
      }

      if (path === '/api/scans/process') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'POST') {
          const body = await readJson(request);
          const scanId = requiredString(body.scanId, 'scanId');
          const result = await processScanUpload({
            upload: {
              kind: requiredScanKind(body.kind),
              payload: requiredString(body.payload, 'payload'),
              uploadedAt: optionalIsoTimestamp(body.uploadedAt, 'uploadedAt') ?? (authOptions.now ?? new Date()).toISOString()
            },
            providers: authOptions.scanProviders ?? {}
          });
          return jsonResponse({
            userId: user,
            scanId,
            result,
            reviewWorkItems: planScanReviewWorkItems([{ scanId, result }])
          });
        }
      }

      if (method === 'GET' && path === '/api/indices') {
        return cachedJsonResponse(authOptions.apiResponseCache, url, apiHotEndpointCacheTtlSeconds[path], () => api.getIndices());
      }
      const indexMatch = path.match(/^\/api\/indices\/([^/]+)$/);
      if (method === 'GET' && indexMatch) {
        const index = api.getIndex(decodeURIComponent(indexMatch[1]));
        return index ? cachedJsonResponse(authOptions.apiResponseCache, url, 300, () => index) : errorResponse(404, 'Index not found.');
      }

      return errorResponse(404, `Route not found: ${method} ${path}`);
    } catch (error) {
      return errorResponse(400, error instanceof Error ? error.message : 'Bad request.');
    }
  };
}

export async function handleNodeHttpRequest(
  incoming: IncomingMessage,
  outgoing: ServerResponse,
  handler: HttpHandler = createHttpHandler()
): Promise<void> {
  const chunks: Buffer[] = [];
  for await (const chunk of incoming) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
  const protocol = incoming.headers['x-forwarded-proto'] ?? 'http';
  const request = new Request(`${Array.isArray(protocol) ? protocol[0] : protocol}://${incoming.headers.host ?? 'localhost'}${incoming.url ?? '/'}`, {
    method: incoming.method,
    headers: incoming.headers as HeadersInit,
    body: body && body.length > 0 ? body : undefined
  });
  const response = await handler(request);
  outgoing.statusCode = response.status;
  response.headers.forEach((value, key) => outgoing.setHeader(key, value));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}

export function createNodeServer(handler: HttpHandler = createHttpHandler()) {
  return createServer((incoming: IncomingMessage, outgoing: ServerResponse) => {
    void handleNodeHttpRequest(incoming, outgoing, handler);
  });
}

export type OpenApiOperation = {
  summary: string;
  security?: OpenApiSecurityRequirement[];
};

export type OpenApiSecurityRequirement = {
  bearerAuth?: never[];
  metricsToken?: never[];
  webhookSignature?: never[];
  billingWebhookSignature?: never[];
  stripeWebhookSignature?: never[];
};

export type OpenApiPathItem = Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', OpenApiOperation>>;

export type OpenApiDocument = {
  openapi: '3.1.0';
  info: { title: string; version: string };
  paths: Record<string, OpenApiPathItem>;
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http'; scheme: 'bearer' };
      metricsToken: { type: 'apiKey'; in: 'header'; name: 'x-groceryview-metrics-token' };
      webhookSignature: { type: 'apiKey'; in: 'header'; name: 'x-groceryview-signature' };
      billingWebhookSignature: { type: 'apiKey'; in: 'header'; name: 'x-groceryview-billing-signature' };
      stripeWebhookSignature: { type: 'apiKey'; in: 'header'; name: 'stripe-signature' };
    };
  };
};

const protectedOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ bearerAuth: [] }] });
const publicOperation = (summary: string): OpenApiOperation => ({ summary });
const metricsOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ metricsToken: [] }] });
const webhookOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ webhookSignature: [] }] });
const billingWebhookOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ billingWebhookSignature: [] }, { stripeWebhookSignature: [] }] });

export function buildOpenApiDocument(): OpenApiDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'GroceryView API', version: '0.1.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
        metricsToken: { type: 'apiKey', in: 'header', name: 'x-groceryview-metrics-token' },
        webhookSignature: { type: 'apiKey', in: 'header', name: 'x-groceryview-signature' },
        billingWebhookSignature: { type: 'apiKey', in: 'header', name: 'x-groceryview-billing-signature' },
        stripeWebhookSignature: { type: 'apiKey', in: 'header', name: 'stripe-signature' }
      }
    },
    paths: {
      '/api/health': { get: publicOperation('Get API runtime health without exposing secrets.') },
      '/api/openapi.json': { get: publicOperation('Get the public OpenAPI document for developer price and nutrition API integrations.') },
      '/api/auth/session': { post: publicOperation('Exchange a verified auth provider assertion for a short-lived bearer session.') },
      '/api/fuel': { get: publicOperation('Get per-grade fuel price observations with operator and crowd-source provenance.') },
      '/api/market/overview': { get: publicOperation('Get Stockholm grocery market overview.') },
      '/api/nutrition/value': { get: publicOperation('Get nutrition per krona rankings with sugar and salt warning guardrails.') },
      '/api/meal-plans/suggestions': { get: protectedOperation('Get deal-based meal suggestions with cost, serving, and household guardrails.') },
      '/api/expiry-deals/radar': { get: protectedOperation('Get expiry markdown radar by favorite store, category, distance, urgency, and verification guardrails.') },
      '/api/pantry/replenishment': {
        get: protectedOperation('Get pantry replenishment status with expiry, basket duplicate, and best-deal context.'),
        post: protectedOperation('Plan pantry replenishment from current stock, usage, expiry, and verified deal candidates.')
      },
      '/api/loyalty/offers': { get: protectedOperation('Get account-scoped loyalty offers with savings, coupon actions, and membership guardrails.') },
      '/api/ads/disclosure': { get: protectedOperation('Get ad disclosure status with placement labels, premium removal, and ranking separation guardrails.') },
      '/api/notifications/inbox': { get: protectedOperation('Get notification inbox delivery status, holds, suppressions, and alert guardrails.') },
      '/api/receipts/review': { get: protectedOperation('Get receipt review budget impact, match confidence, and writeback guardrails.') },
      '/api/categories/{category}/market': { get: publicOperation('Get category market report with current price, 1M move, 52-week range, and verified evidence.') },
      '/api/deals/discounts': { get: publicOperation('Get active weekly discounts by branch, chain, category, or product with source evidence.') },
      '/api/deals/flyer-offers': { get: publicOperation('Get active weekly flyer offers by branch, chain, category, or product with source evidence.') },
      '/api/stores': { get: publicOperation('List stores.') },
      '/api/account/subscription-access': { get: protectedOperation('Get subscription access policy for the signed-in account.') },
      '/api/billing/checkout-sessions': { post: protectedOperation('Create a provider-backed subscription checkout session for the signed-in account.') },
      '/api/billing/portal-sessions': { post: protectedOperation('Create a provider-backed billing portal session for the signed-in account.') },
      '/api/billing/subscription-events': { post: billingWebhookOperation('Accept signed billing subscription events and persist entitlement updates.') },
      '/api/stores/{id}': { get: publicOperation('Get store profile with opening hours and assortment overview.') },
      '/api/stores/{id}/category-coverage': { get: publicOperation('Get store price coverage grouped by product category.') },
      '/api/stores/{id}/deal-summary': { get: publicOperation('Get store deal summary with category leaders and score guardrails.') },
      '/api/stores/{id}/deals': { get: publicOperation('Get ranked in-store deals for one store.') },
      '/api/stores/{id}/discounts': { get: publicOperation('Get active weekly discounts captured for one branch.') },
      '/api/stores/{id}/flyer-offers': { get: publicOperation('Get active weekly flyer offers captured for one branch.') },
      '/api/stores/{id}/price-coverage': { get: publicOperation('Get store catalog price coverage with missing product guardrails.') },
      '/api/products': { get: publicOperation('List products with cursor pagination.') },
      '/api/products/search': { get: publicOperation('Search products.') },
      '/api/products/{id}': { get: publicOperation('Get product detail.') },
      '/api/products/{id}/deal-score': { get: publicOperation('Get Deal Score v1 report with customer-facing reasons.') },
      '/api/products/{id}/equivalents': { get: publicOperation('Get comparable products in the same category.') },
      '/api/products/{id}/price-spread': { get: publicOperation('Get product price spread across current verified store quotes.') },
      '/api/products/{id}/cheapest-now': { get: publicOperation('Get the cheapest current product quote by observed chain for retailer overlays.') },
      '/api/products/{id}/prices': { get: publicOperation('Get product prices by store.') },
      '/api/products/{id}/store-savings': { get: publicOperation('Get product store savings against the highest current verified quote.') },
      '/api/products/{id}/history': { get: publicOperation('Get product price history.') },
      '/api/products/{id}/history-confidence': { get: publicOperation('Get product price history confidence disclosure and claim guardrails.') },
      '/api/products/{id}/history-summary': { get: publicOperation('Get product price history summary and movement guardrails.') },
      '/api/products/{id}/terminal': { get: publicOperation('Get product price terminal distribution, quote, and chart data.') },
      '/api/prices/freshness': { get: publicOperation('Get price freshness and stale-price backfill queue.') },
      '/api/households/current': {
        get: protectedOperation('Get the signed-in user household plan.'),
        put: protectedOperation('Create or replace the signed-in user household plan and budget summary.')
      },
      '/api/privacy/export': { get: protectedOperation('Export signed-in user profile, favorite-store, watchlist, receipt, and household data.') },
      '/api/privacy/deletion-plan': { post: protectedOperation('Plan account deletion without performing a destructive delete.') },
      '/api/privacy/request-fulfillment': { post: protectedOperation('Classify privacy export, deletion, and ad opt-out requests by fulfillment deadline.') },
      '/api/scans/process': { post: protectedOperation('Process barcode or receipt scan payloads through configured providers and return review routing work.') },
      '/api/scans/upload-url': { post: protectedOperation('Create a private upload ticket for barcode or receipt scan payload storage.') },
      '/api/users/{userId}/favorite-stores': {
        get: protectedOperation('List favorite stores.'),
        post: protectedOperation('Add favorite store.')
      },
      '/api/users/{userId}/favorite-stores/{storeId}': {
        delete: protectedOperation('Remove favorite store.')
      },
      '/api/watchlist': {
        get: protectedOperation('Get watchlist and alerts.'),
        post: protectedOperation('Add watchlist item.')
      },
      '/api/watchlist/items/{productId}': {
        patch: protectedOperation('Update watchlist item.'),
        delete: protectedOperation('Remove watchlist item.')
      },
      '/api/watchlist/price-alerts': {
        get: protectedOperation('Get active watchlist target-price alerts.'),
        post: protectedOperation('Create or update a watchlist target-price alert.')
      },
      '/api/basket/current': { get: protectedOperation('Get current weekly basket.') },
      '/api/basket/items': { post: protectedOperation('Add basket item.') },
      '/api/basket/items/{productId}': {
        patch: protectedOperation('Update basket item quantity.'),
        delete: protectedOperation('Remove basket item.')
      },
      '/api/basket/compare': { post: protectedOperation('Compare basket strategies.') },
      '/api/basket/comparison-report': { get: protectedOperation('Get basket comparison strategies with assignment and trust labels.') },
      '/api/basket/local-offers': { get: protectedOperation('Get local offer basket coverage, freshness, confidence, and savings by selected stores.') },
      '/api/basket/fulfillment-slots/{retailerId}/{storeId}': { get: protectedOperation('Get fulfillment slot evidence without claiming delivery, pickup, or checkout reservations.') },
      '/api/basket/handoff/{retailerId}': { get: protectedOperation('Get retailer handoff actions, support matrix fallbacks, and checkout-confirmation guardrails.') },
      '/api/basket/import-export': { post: protectedOperation('Import consented bookmarklet or extension basket rows and return unmatched review items.') },
      '/api/basket/import-review': { get: protectedOperation('Get account-bound retailer basket import review rows.') },
      '/api/basket/import-review/{reviewItemId}/decisions': { post: protectedOperation('Resolve an account-bound retailer basket import review row.') },
      '/api/basket/trip-cost': { get: protectedOperation('Get basket totals ranked by branch product price plus explicit travel, time, delivery, and split-shop costs.') },
      '/api/basket/transfer/{retailerId}': { get: protectedOperation('Preflight secure retailer basket transfer and block unless capability is verified.') },
      '/api/basket/recurring-digest': { get: protectedOperation('Get recurring basket changes, missing-price blockers, and suggested review actions.') },
      '/api/basket/stores/{storeId}/quote': { get: protectedOperation('Quote the current basket at one store with missing-price labels.') },
      '/api/budget': { patch: protectedOperation('Update budget.') },
      '/api/budget/categories': {
        get: protectedOperation('Get category budget summary.'),
        patch: protectedOperation('Replace category budget limits.')
      },
      '/api/budget/summary': { get: protectedOperation('Get budget summary.') },
      '/api/indices': { get: publicOperation('List grocery indices.') },
      '/api/indices/{id}': { get: publicOperation('Get grocery index detail.') },
      '/api/human-review/assignments': { get: protectedOperation('List open human-review assignments and SLA status.') },
      '/api/human-review/assignments/{id}/decisions': { post: protectedOperation('Record a human-review decision.') },
      '/api/metrics/notifications': { get: metricsOperation('Export notification operations metrics.') },
      '/api/readiness/postgres': { get: metricsOperation('Check PostgreSQL schema and migration readiness without exposing database secrets.') },
      '/api/readiness/source-runs': { get: metricsOperation('Check source run freshness and terminal status without exposing source secrets.') },
      '/api/readiness/catalog-coverage': { get: metricsOperation('Check product, chain, store, and product-store catalog coverage without exposing database secrets.') },
      '/api/readiness/scanning': { get: metricsOperation('Check scan provider configuration and health evidence without exposing provider secrets.') },
      '/api/readiness/scan-upload-cors': { get: metricsOperation('Check scan upload CORS preflight behavior without exposing signed upload URL secrets.') },
      '/api/readiness/scan-upload-storage': { get: metricsOperation('Check scan upload storage ticket creation without exposing object-storage secrets.') },
      '/api/readiness/scan-upload-write': { get: metricsOperation('Check scan upload write behavior without exposing signed upload URL secrets.') },
      '/api/workers/notifications/run': { post: metricsOperation('Run the configured notification worker cycle for cron execution.') },
      '/api/notifications/suppression-events': { post: webhookOperation('Accept signed normalized notification suppression events.') },
      '/api/notifications/provider-suppression-events': { post: webhookOperation('Accept signed SendGrid, SES, or Expo suppression payloads.') }
    }
  };
}

export type RuntimeConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  authSecret?: string;
  databaseUrl?: string;
  publicWebUrl?: string;
  notificationWebhookSecret?: string;
  billingWebhookSecret?: string;
  stripeSecretKey?: string;
  stripePriceIds?: Partial<Record<SubscriptionPlan, string>>;
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  expoPushAccessToken?: string;
  telegramBotToken?: string;
  metricsToken?: string;
  ocrSpaceApiKey?: string;
  ocrSpaceHealthcheckImageUrl?: string;
  openFoodFactsUserAgent?: string;
  openFoodFactsHealthcheckBarcode?: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  scanUploadMaxBytes?: number;
  catalogCoverageTargets?: Omit<CatalogCoverageInput, 'products'>;
  sourceRunMinAcceptedRowsByChain?: Readonly<Record<string, number>>;
};

const defaultSourceRunMinAcceptedRowsByChain: Readonly<Record<(typeof requiredDailyChainIds)[number], number>> = {
  ica: 1,
  willys: 1,
  coop: 1,
  hemkop: 1,
  lidl: 1,
  city_gross: 1
};

function parseSourceRunMinAcceptedRowsByChain(value: string | undefined): Readonly<Record<string, number>> | undefined {
  if (!value?.trim()) return undefined;
  const parsed = JSON.parse(value) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN must be a JSON object.');
  }
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 0) {
    throw new Error('GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN must include at least one chain threshold.');
  }
  const knownChains = new Set<string>(requiredDailyChainIds);
  const thresholds: Record<string, number> = {};
  for (const [rawChainId, rawMinimum] of entries) {
    const chainId = rawChainId.trim();
    if (!knownChains.has(chainId)) {
      throw new Error(`GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN.${rawChainId} must be one of: ${requiredDailyChainIds.join(', ')}.`);
    }
    if (typeof rawMinimum !== 'number' || !Number.isInteger(rawMinimum) || rawMinimum < 1) {
      throw new Error(`GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN.${rawChainId} must be a positive integer.`);
    }
    thresholds[chainId] = rawMinimum;
  }
  return thresholds;
}

function parseCatalogCoverageTargets(value: string | undefined): Omit<CatalogCoverageInput, 'products'> | undefined {
  if (!value?.trim()) return undefined;
  const parsed = JSON.parse(value) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('CATALOG_COVERAGE_TARGETS_JSON must be a JSON object.');
  }
  const record = parsed as Record<string, unknown>;
  const readStringArray = (field: string): string[] => {
    const fieldValue = record[field];
    if (!Array.isArray(fieldValue) || fieldValue.length === 0 || !fieldValue.every((entry) => typeof entry === 'string' && entry.trim())) {
      throw new Error(`CATALOG_COVERAGE_TARGETS_JSON.${field} must be a non-empty string array.`);
    }
    return fieldValue.map((entry) => String(entry).trim());
  };
  const targetChains = readStringArray('targetChains');
  const targetPriceTypes = readStringArray('targetPriceTypes');
  if (!targetPriceTypes.includes('online')) {
    throw new Error('CATALOG_COVERAGE_TARGETS_JSON.targetPriceTypes must include online.');
  }
  const missingRequiredChains = requiredDailyChainIds.filter((chainId) => !targetChains.includes(chainId));
  if (missingRequiredChains.length > 0) {
    throw new Error(`CATALOG_COVERAGE_TARGETS_JSON.targetChains is missing required chains: ${missingRequiredChains.join(', ')}.`);
  }
  return {
    targetProducts: readStringArray('targetProducts'),
    targetCategories: readStringArray('targetCategories'),
    targetChains,
    targetStores: readStringArray('targetStores'),
    targetPriceTypes,
    requireEveryProductInEveryStore: record.requireEveryProductInEveryStore !== false,
    requireEveryStorePriceType: record.requireEveryStorePriceType === true
  };
}

function validatePublicWebUrl(publicWebUrl: string | undefined): void {
  if (!publicWebUrl) return;
  let parsed: URL;
  try {
    parsed = new URL(publicWebUrl);
  } catch {
    throw new Error('PUBLIC_WEB_URL must be a valid absolute URL.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('PUBLIC_WEB_URL must use http or https.');
  }
}

export function loadRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const nodeEnv = (env.NODE_ENV ?? 'development') as RuntimeConfig['nodeEnv'];
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error(`Unsupported NODE_ENV: ${nodeEnv}`);
  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port <= 0) throw new Error('PORT must be a positive integer.');
  if (nodeEnv === 'production') {
    if (!env.AUTH_SECRET) throw new Error('AUTH_SECRET is required in production.');
    if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required in production.');
    if (!env.PUBLIC_WEB_URL) throw new Error('PUBLIC_WEB_URL is required in production.');
    if (!env.NOTIFICATION_WEBHOOK_SECRET) throw new Error('NOTIFICATION_WEBHOOK_SECRET is required in production.');
    if (!env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY is required in production.');
    if (!env.SENDGRID_FROM_EMAIL) throw new Error('SENDGRID_FROM_EMAIL is required in production.');
    if (!env.EXPO_PUSH_ACCESS_TOKEN) throw new Error('EXPO_PUSH_ACCESS_TOKEN is required in production.');
    if (!env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is required in production.');
    if (!env.BILLING_WEBHOOK_SECRET) throw new Error('BILLING_WEBHOOK_SECRET is required in production.');
    if (!env.METRICS_TOKEN) throw new Error('METRICS_TOKEN is required in production.');
    if (!env.OCR_SPACE_API_KEY) throw new Error('OCR_SPACE_API_KEY is required in production.');
    if (!env.OCR_SPACE_HEALTHCHECK_IMAGE_URL) throw new Error('OCR_SPACE_HEALTHCHECK_IMAGE_URL is required in production.');
    if (!env.OPENFOODFACTS_USER_AGENT) throw new Error('OPENFOODFACTS_USER_AGENT is required in production.');
    if (!env.OPENFOODFACTS_HEALTHCHECK_BARCODE) throw new Error('OPENFOODFACTS_HEALTHCHECK_BARCODE is required in production.');
    if (!env.S3_ENDPOINT) throw new Error('S3_ENDPOINT is required in production.');
    if (!env.S3_REGION) throw new Error('S3_REGION is required in production.');
    if (!env.S3_BUCKET) throw new Error('S3_BUCKET is required in production.');
    if (!env.S3_ACCESS_KEY_ID) throw new Error('S3_ACCESS_KEY_ID is required in production.');
    if (!env.S3_SECRET_ACCESS_KEY) throw new Error('S3_SECRET_ACCESS_KEY is required in production.');
    if (!env.CATALOG_COVERAGE_TARGETS_JSON) throw new Error('CATALOG_COVERAGE_TARGETS_JSON is required in production.');
    if (!env.GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN) throw new Error('GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN is required in production.');
  }
  validatePublicWebUrl(env.PUBLIC_WEB_URL);
  const scanUploadMaxBytes = Number(env.SCAN_UPLOAD_MAX_BYTES ?? '5000000');
  if (!Number.isInteger(scanUploadMaxBytes) || scanUploadMaxBytes <= 0) throw new Error('SCAN_UPLOAD_MAX_BYTES must be a positive integer.');
  const catalogCoverageTargets = parseCatalogCoverageTargets(env.CATALOG_COVERAGE_TARGETS_JSON);
  const sourceRunMinAcceptedRowsByChain = parseSourceRunMinAcceptedRowsByChain(env.GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN);
  const stripePriceIds: Partial<Record<SubscriptionPlan, string>> = {
    ...(env.STRIPE_PRICE_PREMIUM_MONTHLY ? { premium_monthly: env.STRIPE_PRICE_PREMIUM_MONTHLY } : {}),
    ...(env.STRIPE_PRICE_PREMIUM_YEARLY ? { premium_yearly: env.STRIPE_PRICE_PREMIUM_YEARLY } : {})
  };
  return {
    nodeEnv,
    port,
    authSecret: env.AUTH_SECRET,
    databaseUrl: env.DATABASE_URL,
    publicWebUrl: env.PUBLIC_WEB_URL,
    notificationWebhookSecret: env.NOTIFICATION_WEBHOOK_SECRET,
    ...(env.SENDGRID_API_KEY ? { sendgridApiKey: env.SENDGRID_API_KEY } : {}),
    ...(env.SENDGRID_FROM_EMAIL ? { sendgridFromEmail: env.SENDGRID_FROM_EMAIL } : {}),
    ...(env.EXPO_PUSH_ACCESS_TOKEN ? { expoPushAccessToken: env.EXPO_PUSH_ACCESS_TOKEN } : {}),
    ...(env.TELEGRAM_BOT_TOKEN ? { telegramBotToken: env.TELEGRAM_BOT_TOKEN } : {}),
    billingWebhookSecret: env.BILLING_WEBHOOK_SECRET,
    ...(env.STRIPE_SECRET_KEY ? { stripeSecretKey: env.STRIPE_SECRET_KEY } : {}),
    ...(Object.keys(stripePriceIds).length > 0 ? { stripePriceIds } : {}),
    metricsToken: env.METRICS_TOKEN,
    ...(env.OCR_SPACE_API_KEY ? { ocrSpaceApiKey: env.OCR_SPACE_API_KEY } : {}),
    ...(env.OCR_SPACE_HEALTHCHECK_IMAGE_URL ? { ocrSpaceHealthcheckImageUrl: env.OCR_SPACE_HEALTHCHECK_IMAGE_URL } : {}),
    ...(env.OPENFOODFACTS_USER_AGENT ? { openFoodFactsUserAgent: env.OPENFOODFACTS_USER_AGENT } : {}),
    ...(env.OPENFOODFACTS_HEALTHCHECK_BARCODE ? { openFoodFactsHealthcheckBarcode: env.OPENFOODFACTS_HEALTHCHECK_BARCODE } : {}),
    ...(env.S3_ENDPOINT ? { s3Endpoint: env.S3_ENDPOINT } : {}),
    ...(env.S3_REGION ? { s3Region: env.S3_REGION } : {}),
    ...(env.S3_BUCKET ? { s3Bucket: env.S3_BUCKET } : {}),
    ...(env.S3_ACCESS_KEY_ID ? { s3AccessKeyId: env.S3_ACCESS_KEY_ID } : {}),
    ...(env.S3_SECRET_ACCESS_KEY ? { s3SecretAccessKey: env.S3_SECRET_ACCESS_KEY } : {}),
    scanUploadMaxBytes,
    ...(catalogCoverageTargets ? { catalogCoverageTargets } : {}),
    ...(sourceRunMinAcceptedRowsByChain ? { sourceRunMinAcceptedRowsByChain } : {})
  };
}


function buildRuntimeNotificationProviders(config: RuntimeConfig, options: RuntimeHandlerOptions = {}): NotificationProviders {
  return {
    ...(config.sendgridApiKey && config.sendgridFromEmail
      ? {
          email: createSendgridEmailProvider({
            apiKey: config.sendgridApiKey,
            fromEmail: config.sendgridFromEmail,
            ...(options.notificationProviderFetch ? { fetch: options.notificationProviderFetch } : {})
          })
        }
      : {}),
    ...(config.expoPushAccessToken
      ? {
          push: createExpoPushProvider({
            accessToken: config.expoPushAccessToken,
            ...(options.notificationProviderFetch ? { fetch: options.notificationProviderFetch } : {})
          })
        }
      : {}),
    ...(config.telegramBotToken
      ? {
          telegram: createTelegramBotProvider({
            botToken: config.telegramBotToken,
            ...(options.notificationProviderFetch ? { fetch: options.notificationProviderFetch } : {})
          })
        }
      : {})
  };
}

function buildRuntimeNotificationWorkerRunner(
  config: RuntimeConfig,
  repository: RuntimePersistenceRepository | undefined,
  options: RuntimeHandlerOptions = {}
): (() => Promise<RepositoryNotificationWorkerCycleResult>) | undefined {
  if (!repository?.listDueNotificationTasks || !repository.listActiveNotificationSuppressions || !repository.upsertNotificationTask) return undefined;
  const providers = buildRuntimeNotificationProviders(config, options);
  if (!providers.email && !providers.push && !providers.telegram) return undefined;
  return () => runRepositoryNotificationWorkerCycle({
    now: (options.now ?? new Date()).toISOString(),
    retryDelayMinutes: 15,
    staleAfterMinutes: 60,
    repository: {
      listDueNotificationTasks: (now) => repository.listDueNotificationTasks!(now),
      listActiveNotificationSuppressions: () => repository.listActiveNotificationSuppressions!(),
      upsertNotificationTask: (task) => repository.upsertNotificationTask!(task)
    },
    providers,
    alertRecipients: []
  });
}

function hashHex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmacBuffer(key: Buffer | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string): string {
  return createHmac('sha256', key).update(value).digest('hex');
}

function awsDateParts(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function encodeS3KeySegment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildRuntimeScanUploadStorage(config: RuntimeConfig, options: RuntimeHandlerOptions = {}): ScanUploadStorage | undefined {
  if (!config.s3Endpoint || !config.s3Region || !config.s3Bucket || !config.s3AccessKeyId || !config.s3SecretAccessKey) return undefined;
  const endpoint = new URL(config.s3Endpoint);
  const bucket = config.s3Bucket;
  const region = config.s3Region;
  const accessKeyId = config.s3AccessKeyId;
  const secretAccessKey = config.s3SecretAccessKey;

  return {
    async createUploadTicket(request) {
      const issuedAt = options.now ?? new Date(request.requestedAt);
      const expiresInSeconds = 600;
      const expiresAt = new Date(issuedAt.getTime() + expiresInSeconds * 1000).toISOString();
      const objectKey = ['scans', request.kind, request.scanId].map(encodeS3KeySegment).join('/');
      const path = `/${encodeS3KeySegment(bucket)}/${objectKey}`;
      const { amzDate, dateStamp } = awsDateParts(issuedAt);
      const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
      const signedHeaders = 'host';
      const params = new URLSearchParams({
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
        'X-Amz-Date': amzDate,
        'X-Amz-Expires': String(expiresInSeconds),
        'X-Amz-SignedHeaders': signedHeaders
      });
      const canonicalQuery = Array.from(params.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      const canonicalRequest = [
        'PUT',
        path,
        canonicalQuery,
        `host:${endpoint.host}\n`,
        signedHeaders,
        'UNSIGNED-PAYLOAD'
      ].join('\n');
      const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        hashHex(canonicalRequest)
      ].join('\n');
      const signingKey = hmacBuffer(hmacBuffer(hmacBuffer(hmacBuffer(`AWS4${secretAccessKey}`, dateStamp), region), 's3'), 'aws4_request');
      params.set('X-Amz-Signature', hmacHex(signingKey, stringToSign));
      const uploadUrl = new URL(path, endpoint);
      uploadUrl.search = params.toString();
      return {
        scanId: request.scanId,
        uploadUrl: uploadUrl.toString(),
        payloadUri: `s3://${bucket}/${objectKey}`,
        expiresAt,
        maxBytes: config.scanUploadMaxBytes ?? 5_000_000,
        headers: { 'content-type': request.contentType }
      };
    }
  };
}

export function buildRuntimeAuthOptions(config: RuntimeConfig, options: RuntimeHandlerOptions = {}): AuthOptions {
  const scanProviders: ScanProviders = {
    ...(config.openFoodFactsUserAgent
      ? {
          barcode: createOpenFoodFactsBarcodeProvider({
            userAgent: config.openFoodFactsUserAgent,
            ...(options.scanProviderFetch ? { fetch: options.scanProviderFetch } : {})
          })
        }
      : {}),
    ...(config.ocrSpaceApiKey
      ? {
          receiptOcr: createOcrSpaceReceiptProvider({
            apiKey: config.ocrSpaceApiKey,
            ...(options.scanProviderFetch ? { fetch: options.scanProviderFetch } : {})
          })
        }
      : {})
  };
  const scanUploadStorage = buildRuntimeScanUploadStorage(config, options);
  return {
    runtimeConfig: config,
    authSecret: config.authSecret,
    now: options.now,
    apiResponseCache: options.apiResponseCache,
    notificationWebhookSecret: config.notificationWebhookSecret,
    billingWebhookSecret: config.billingWebhookSecret,
    billingCheckoutPriceIds: config.stripePriceIds,
    ...(config.stripeSecretKey
      ? {
          billingCheckoutProvider: createStripeCompatibleCheckoutProvider(config.stripeSecretKey),
          billingPortalProvider: createStripeCompatiblePortalProvider(config.stripeSecretKey)
        }
      : {}),
    notificationMetricsToken: config.metricsToken,
    notificationMetricsProvider: options.notificationMetricsProvider,
    notificationWorkerRunner: options.notificationWorkerRunner,
    postgresReadinessProvider: options.postgresReadinessProvider,
    sourceRunHealthProvider: options.sourceRunHealthProvider,
    catalogCoverageProvider: options.catalogCoverageProvider,
    scanProviderReadinessProvider: options.scanProviderReadinessProvider ?? (() => buildRuntimeScanProviderReadinessReport(config, options)),
    scanUploadStorageReadinessProvider: options.scanUploadStorageReadinessProvider ?? (() => buildScanUploadStorageReadinessReport({
      storage: scanUploadStorage,
      now: options.now
    })),
    scanUploadCorsReadinessProvider: options.scanUploadCorsReadinessProvider ?? (() => buildScanUploadCorsReadinessReport({
      storage: scanUploadStorage,
      origin: config.publicWebUrl,
      fetch: options.scanUploadCorsFetch,
      now: options.now
    })),
    scanUploadWriteReadinessProvider: options.scanUploadWriteReadinessProvider ?? (() => buildScanUploadWriteReadinessReport({
      storage: scanUploadStorage,
      fetch: options.scanUploadWriteFetch,
      now: options.now
    })),
    flyerOffersProvider: options.flyerOffersProvider,
    storeFlyerOffersProvider: options.storeFlyerOffersProvider,
    watchlistPriceAlertsProvider: options.watchlistPriceAlertsProvider,
    watchlistPriceAlertWriter: options.watchlistPriceAlertWriter,
    ...(Object.keys(scanProviders).length > 0 ? { scanProviders } : {}),
    ...(scanUploadStorage ? { scanUploadStorage } : {})
  };
}

function createDefaultPgPool(databaseUrl: string): RuntimePgPool {
  const pg = require('pg') as { Pool?: new (config: { connectionString: string }) => RuntimePgPool };
  if (!pg.Pool) throw new Error('pg Pool export is not available.');
  return new pg.Pool({ connectionString: databaseUrl });
}

function noopClose(): Promise<void> {
  return Promise.resolve();
}

export function buildRepositoryBackedAuthOptions(
  config: RuntimeConfig,
  repository: RuntimePersistenceRepository,
  options: RuntimeHandlerOptions = {}
): AuthOptions {
  return {
    ...buildRuntimeAuthOptions(config, options),
    subscriptionEntitlementRepository: {
      getSubscriptionEntitlement: (userId) => repository.getSubscriptionEntitlement(userId)
    },
    budgetRepository: {
      upsertBudget: (userId, budget) => repository.upsertBudget(userId, budget),
      getBudget: (userId) => repository.getBudget(userId)
    },
    humanReviewRepository: {
      getHumanReviewer: (reviewerId) => repository.getHumanReviewer(reviewerId),
      listOpenHumanReviewAssignments: () => repository.listOpenHumanReviewAssignments(),
      saveHumanReviewAssignment: (assignment) => repository.saveHumanReviewAssignment(assignment)
    },
    ...(repository.saveBasketImportReviewItems && repository.listOpenBasketImportReviewItems && repository.resolveBasketImportReviewItem
      ? {
          basketImportReviewRepository: {
            saveBasketImportReviewItems: (userId, items) => repository.saveBasketImportReviewItems!(userId, items),
            listOpenBasketImportReviewItems: (userId) => repository.listOpenBasketImportReviewItems!(userId),
            resolveBasketImportReviewItem: (userId, reviewItemId, resolution) => repository.resolveBasketImportReviewItem!(userId, reviewItemId, resolution)
          }
        }
      : {}),
    notificationSuppressionSink: {
      upsertNotificationSuppression: (suppression) => repository.upsertNotificationSuppression(suppression)
    },
    ...(repository.listDueNotificationTasks && repository.listActiveNotificationSuppressions
      ? {
          notificationInboxRepository: {
            listDueNotificationTasks: (now) => repository.listDueNotificationTasks!(now),
            listActiveNotificationSuppressions: () => repository.listActiveNotificationSuppressions!()
          }
        }
      : {}),
    billingSubscriptionSink: {
      upsertSubscriptionEntitlement: (entitlement) => repository.upsertSubscriptionEntitlement(entitlement)
    }
  };
}

export function buildRuntimeRequestAuthOptions(config: RuntimeConfig, options: RuntimeHandlerOptions = {}): AuthOptions {
  return options.repository ? buildRepositoryBackedAuthOptions(config, options.repository, options) : buildRuntimeAuthOptions(config, options);
}

function createRuntimeRepositoryResource(config: RuntimeConfig, options: RuntimeHandlerOptions): {
  repository?: RuntimePersistenceRepository;
  postgresReadinessProvider?: () => Promise<PostgresIntegrationReadinessReport>;
  sourceRunHealthProvider?: () => Promise<SourceRunHealthCheckResult>;
  catalogCoverageProvider?: () => Promise<CatalogCoverageReport>;
  flyerOffersProvider?: (query: FlyerOffersProviderQuery) => Promise<FlyerOfferReport>;
  storeFlyerOffersProvider?: (storeId: string, query: StoreFlyerOffersProviderQuery) => Promise<StoreFlyerOfferReport | null>;
  watchlistPriceAlertsProvider?: (userId: string) => Promise<WatchlistPriceAlertReport>;
  watchlistPriceAlertWriter?: (userId: string, request: WatchlistPriceAlertRequest) => Promise<WatchlistPriceAlertReport>;
  close(): Promise<void>;
} {
  if (options.repository || !config.databaseUrl) return { close: noopClose };

  const pool = (options.pgPoolFactory ?? createDefaultPgPool)(config.databaseUrl);
  const executor: QueryExecutor = createPgQueryExecutor(pool);
  const sourceRecordReader = createPostgresSourceRecordReader(executor);
  const catalogReader = createPostgresCatalogReader(executor);
  const repository = createPostgresRepository(executor);
  return {
    repository,
    postgresReadinessProvider: () => checkPostgresIntegrationReadiness({ executor, repositoryProbes: [] }),
    sourceRunHealthProvider: () =>
      checkSourceRunHealth({
        reader: sourceRecordReader,
        now: new Date().toISOString(),
        maxRunningMinutes: 120,
        staleAfterMinutes: 24 * 60,
        requiredFreshChainIds: requiredDailyChainIds,
        requiredAcceptedCountByChain: config.sourceRunMinAcceptedRowsByChain ?? defaultSourceRunMinAcceptedRowsByChain,
        filter: { limit: 100 }
      }),
    ...(config.catalogCoverageTargets
      ? {
          catalogCoverageProvider: async () =>
            buildCatalogCoverageReport({
              ...config.catalogCoverageTargets!,
              products: await catalogReader.listProductCoverageRows({ limit: 50_000 })
            })
        }
      : {}),
    flyerOffersProvider: (query) => queryFlyerOffersFromPostgres(executor, query),
    storeFlyerOffersProvider: (storeId, query) => queryStoreFlyerOffersFromPostgres(executor, storeId, query),
    watchlistPriceAlertsProvider: (userId) => queryWatchlistPriceAlertsFromPostgres(executor, repository, userId),
    watchlistPriceAlertWriter: (userId, request) => upsertWatchlistPriceAlertInPostgres(executor, repository, userId, request),
    async close() {
      await pool.end();
    }
  };
}

function createRuntimeHttpServiceFromConfig(config: RuntimeConfig, options: RuntimeHandlerOptions = {}): RuntimeHttpService {
  const resource = createRuntimeRepositoryResource(config, options);
  const runtimeOptions: RuntimeHandlerOptions = {
    ...options,
    ...(resource.repository ? { repository: resource.repository } : {}),
    postgresReadinessProvider: options.postgresReadinessProvider ?? resource.postgresReadinessProvider,
    sourceRunHealthProvider: options.sourceRunHealthProvider ?? resource.sourceRunHealthProvider,
    notificationWorkerRunner: options.notificationWorkerRunner ?? buildRuntimeNotificationWorkerRunner(config, options.repository ?? resource.repository, options),
    catalogCoverageProvider: options.catalogCoverageProvider ?? resource.catalogCoverageProvider,
    scanProviderReadinessProvider: options.scanProviderReadinessProvider,
    flyerOffersProvider: options.flyerOffersProvider ?? resource.flyerOffersProvider,
    storeFlyerOffersProvider: options.storeFlyerOffersProvider ?? resource.storeFlyerOffersProvider,
    watchlistPriceAlertsProvider: options.watchlistPriceAlertsProvider ?? resource.watchlistPriceAlertsProvider,
    watchlistPriceAlertWriter: options.watchlistPriceAlertWriter ?? resource.watchlistPriceAlertWriter
  };
  const authOptions = buildRuntimeRequestAuthOptions(config, runtimeOptions);
  return {
    handler: createHttpHandler(undefined, authOptions),
    close: resource.close
  };
}

export type RuntimeHttpService = {
  handler: HttpHandler;
  close(): Promise<void>;
};

export function createRuntimeHttpService(
  env: Record<string, string | undefined> = process.env,
  options: RuntimeHandlerOptions = {}
): RuntimeHttpService {
  return createRuntimeHttpServiceFromConfig(loadRuntimeConfig(env), options);
}

export function createRuntimeHttpHandler(
  env: Record<string, string | undefined> = process.env,
  options: RuntimeHandlerOptions = {}
): HttpHandler {
  return createRuntimeHttpService(env, options).handler;
}

export function createRuntimeNodeServer(env: Record<string, string | undefined> = process.env, options: RuntimeHandlerOptions = {}) {
  const service = createRuntimeHttpService(env, options);
  const server = createNodeServer(service.handler);
  server.on('close', () => {
    void service.close();
  });
  return server;
}

export function startNodeServerFromEnv(env: Record<string, string | undefined> = process.env, options: RuntimeHandlerOptions = {}) {
  const config = loadRuntimeConfig(env);
  const service = createRuntimeHttpServiceFromConfig(config, options);
  const server = createNodeServer(service.handler);
  server.on('close', () => {
    void service.close();
  });
  server.listen(config.port);
  return server;
}

export function isDirectServerEntrypoint(moduleUrl: string, argvEntry: string | undefined = process.argv[1]): boolean {
  if (!argvEntry) return false;
  return pathToFileURL(resolve(argvEntry)).href === moduleUrl;
}

export type HealthReport = {
  status: 'ok';
  service: 'groceryview-server';
  environment: RuntimeConfig['nodeEnv'];
  hasDatabase: boolean;
  hasPublicWebUrl: boolean;
  hasAuthSecret: boolean;
  hasNotificationWebhookSecret: boolean;
  hasBillingWebhookSecret: boolean;
  hasMetricsToken: boolean;
  hasScanUploadStorage: boolean;
};

export type HealthReportInput = RuntimeConfig & {
  scanUploadStorageConfigured?: boolean;
};

export function buildHealthReport(config: HealthReportInput): HealthReport {
  return {
    status: 'ok',
    service: 'groceryview-server',
    environment: config.nodeEnv,
    hasDatabase: Boolean(config.databaseUrl),
    hasPublicWebUrl: Boolean(config.publicWebUrl),
    hasAuthSecret: Boolean(config.authSecret),
    hasNotificationWebhookSecret: Boolean(config.notificationWebhookSecret),
    hasBillingWebhookSecret: Boolean(config.billingWebhookSecret),
    hasMetricsToken: Boolean(config.metricsToken),
    hasScanUploadStorage: Boolean(config.scanUploadStorageConfigured)
  };
}

if (isDirectServerEntrypoint(import.meta.url)) {
  startNodeServerFromEnv();
}
