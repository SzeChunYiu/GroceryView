import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createGroceryViewApi, type CategoryBudgetPatch, type HouseholdPlanRequest } from '@groceryview/api';
import { createSessionToken, parseBearerToken, verifySessionToken, type SessionPayload } from '@groceryview/auth';
import {
  checkPostgresIntegrationReadiness,
  createPgQueryExecutor,
  createPostgresRepository,
  type PgLikeClient,
  type PostgresIntegrationReadinessReport,
  type QueryExecutor
} from '@groceryview/db';
import {
  buildSubscriptionAccessPolicy,
  parseStripeCompatibleSubscriptionEvent,
  processBillingSubscriptionEvent,
  type BillingSubscriptionEntitlementMutation,
  type BillingSubscriptionEvent,
  type BillingSubscriptionEventType,
  type SubscriptionEntitlementSnapshot,
  type SubscriptionPlan
} from '@groceryview/monetization';
import {
  applyHumanReviewDecision,
  authorizeHumanReviewAction,
  buildPrivacyExport,
  planAccountDeletion,
  planPrivacyRequestFulfillment,
  summarizeHumanReviewSla,
  type HumanReviewAssignment,
  type HumanReviewDecision,
  type HumanReviewOperator,
  type PrivacyRequest,
  type PrivacyRequestStatus,
  type PrivacyRequestType
} from '@groceryview/core';
import {
  formatNotificationOperationsMetrics,
  parseNotificationSuppressionWebhook,
  processNotificationSuppressionEvent,
  type DeliveryChannel,
  type NotificationOperationsReport,
  type NotificationSuppressionWebhookProvider,
  type NotificationSuppressionEventType,
  type NotificationSuppressionMutation
} from '@groceryview/notifications';
import {
  planScanReviewWorkItems,
  prepareScanUploadTicket,
  processScanUpload,
  type ScanProviders,
  type ScanUpload,
  type ScanUploadStorage
} from '@groceryview/scanning';

export type HttpHandler = (request: Request) => Promise<Response>;

export type AuthOptions = {
  runtimeConfig?: RuntimeConfig;
  authSecret?: string;
  now?: Date;
  authSessionExchange?: AuthSessionExchangeVerifier;
  subscriptionEntitlementRepository?: {
    getSubscriptionEntitlement(userId: string): Promise<SubscriptionEntitlementLookupRecord | null>;
  };
  humanReviewRepository?: {
    getHumanReviewer(reviewerId: string): Promise<HumanReviewOperator | null>;
    listOpenHumanReviewAssignments(): Promise<HumanReviewAssignment[]>;
    saveHumanReviewAssignment(assignment: HumanReviewAssignment): Promise<void>;
  };
  notificationWebhookSecret?: string;
  notificationSuppressionSink?: {
    upsertNotificationSuppression(suppression: NotificationSuppressionMutation): Promise<void>;
  };
  billingWebhookSecret?: string;
  billingPriceIdPlanMap?: Partial<Record<string, SubscriptionPlan>>;
  billingSubscriptionSink?: {
    upsertSubscriptionEntitlement(entitlement: BillingSubscriptionEntitlementMutation): Promise<void>;
  };
  notificationMetricsToken?: string;
  notificationMetricsProvider?: () => Promise<NotificationOperationsReport>;
  postgresReadinessProvider?: () => Promise<PostgresIntegrationReadinessReport>;
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
  getHumanReviewer(reviewerId: string): Promise<HumanReviewOperator | null>;
  listOpenHumanReviewAssignments(): Promise<HumanReviewAssignment[]>;
  saveHumanReviewAssignment(assignment: HumanReviewAssignment): Promise<void>;
  upsertNotificationSuppression(suppression: NotificationSuppressionMutation): Promise<void>;
};

export type RuntimePgPool = PgLikeClient & {
  end(): Promise<void> | void;
};

export type RuntimePgPoolFactory = (databaseUrl: string) => RuntimePgPool;

export type RuntimeHandlerOptions = {
  now?: Date;
  repository?: RuntimePersistenceRepository;
  notificationMetricsProvider?: () => Promise<NotificationOperationsReport>;
  postgresReadinessProvider?: () => Promise<PostgresIntegrationReadinessReport>;
  pgPoolFactory?: RuntimePgPoolFactory;
};

type JsonRecord = Record<string, unknown>;

const require = createRequire(import.meta.url);
const jsonHeaders = { 'content-type': 'application/json; charset=utf-8' };

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers ?? {}) }
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

function requiredScanKind(value: unknown): ScanUpload['kind'] {
  if (value === 'barcode' || value === 'receipt') return value;
  throw new Error('kind must be barcode or receipt.');
}

function requiredAuthProvider(value: unknown): AuthProvider {
  if (value === 'magic_link' || value === 'passkey' || value === 'oidc') return value;
  throw new Error('provider must be magic_link, passkey, or oidc.');
}

function optionalDeliveryChannel(value: unknown): DeliveryChannel | undefined {
  if (value === undefined) return undefined;
  if (value === 'push' || value === 'email') return value;
  throw new Error('channel must be push or email.');
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

function hasValidBillingWebhookSignature(request: Request, body: string, secret: string): boolean {
  const provided = request.headers.get('x-groceryview-billing-signature');
  if (!provided) return false;

  const expected = signBillingWebhookBody(body, secret);
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
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

function postgresReadinessResponse(report: PostgresIntegrationReadinessReport): HttpPostgresReadinessReport {
  return {
    ...report,
    diagnostics: summarizePostgresReadinessForHttp(report)
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

      if (method === 'GET' && path === '/api/market/overview') return jsonResponse(api.getMarketOverview());
      if (method === 'GET' && path === '/api/nutrition/value') return jsonResponse(api.getNutritionValueReport(optionalNutritionMetric(url.searchParams.get('metric'))));
      if (path === '/api/pantry/replenishment') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getPantryReplenishment(user, url.searchParams.get('asOf') ?? undefined));
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
          return jsonResponse(postgresReadinessResponse(report), { status: report.status === 'ready' ? 200 : 503 });
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
        if (!hasValidBillingWebhookSignature(request, rawBody, authOptions.billingWebhookSecret)) {
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
        const store = api.getStore(decodeURIComponent(storeMatch[1]));
        return store ? jsonResponse(store) : errorResponse(404, 'Store not found.');
      }

      const storeDealsMatch = path.match(/^\/api\/stores\/([^/]+)\/deals$/);
      if (method === 'GET' && storeDealsMatch) {
        return jsonResponse(api.getStoreDeals(decodeURIComponent(storeDealsMatch[1])));
      }

      if (method === 'GET' && path === '/api/prices/freshness') {
        return jsonResponse(api.getPriceFreshnessReport(url.searchParams.get('asOf') ?? undefined));
      }

      if (method === 'GET' && path === '/api/products/search') {
        return jsonResponse(api.searchProducts(url.searchParams.get('q') ?? ''));
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

      const productHistoryMatch = path.match(/^\/api\/products\/([^/]+)\/history$/);
      if (method === 'GET' && productHistoryMatch) {
        const productId = decodeURIComponent(productHistoryMatch[1]);
        if (!api.getProduct(productId)) return errorResponse(404, 'Product not found.');
        return jsonResponse(api.getProductHistory(productId));
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
            favoriteStoresOnly: typeof body.favoriteStoresOnly === 'boolean' ? body.favoriteStoresOnly : true
          });
          return jsonResponse(api.getWatchlist(user), { status: 201 });
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

      if (path === '/api/budget') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'PATCH') {
          const body = await readJson(request);
          api.updateBudget(user, {
            weeklyBudget: requiredNumber(body.weeklyBudget, 'weeklyBudget'),
            monthlyBudget: requiredNumber(body.monthlyBudget, 'monthlyBudget')
          });
          return jsonResponse(api.getBudgetSummary(user));
        }
      }

      if (path === '/api/budget/summary') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
        const authError = await authorizeUser(request, user);
        if (authError) return authError;
        if (method === 'GET') return jsonResponse(api.getBudgetSummary(user));
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

      if (method === 'GET' && path === '/api/indices') return jsonResponse(api.getIndices());
      const indexMatch = path.match(/^\/api\/indices\/([^/]+)$/);
      if (method === 'GET' && indexMatch) {
        const index = api.getIndex(decodeURIComponent(indexMatch[1]));
        return index ? jsonResponse(index) : errorResponse(404, 'Index not found.');
      }

      return errorResponse(404, `Route not found: ${method} ${path}`);
    } catch (error) {
      return errorResponse(400, error instanceof Error ? error.message : 'Bad request.');
    }
  };
}

export function createNodeServer(handler: HttpHandler = createHttpHandler()) {
  return createServer(async (incoming: IncomingMessage, outgoing: ServerResponse) => {
    const chunks: Buffer[] = [];
    for await (const chunk of incoming) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://${incoming.headers.host ?? 'localhost'}${incoming.url ?? '/'}`, {
      method: incoming.method,
      headers: incoming.headers as HeadersInit,
      body: body && body.length > 0 ? body : undefined
    });
    const response = await handler(request);
    outgoing.statusCode = response.status;
    response.headers.forEach((value, key) => outgoing.setHeader(key, value));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
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
    };
  };
};

const protectedOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ bearerAuth: [] }] });
const publicOperation = (summary: string): OpenApiOperation => ({ summary });
const metricsOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ metricsToken: [] }] });
const webhookOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ webhookSignature: [] }] });
const billingWebhookOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ billingWebhookSignature: [] }] });

export function buildOpenApiDocument(): OpenApiDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'GroceryView API', version: '0.1.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
        metricsToken: { type: 'apiKey', in: 'header', name: 'x-groceryview-metrics-token' },
        webhookSignature: { type: 'apiKey', in: 'header', name: 'x-groceryview-signature' },
        billingWebhookSignature: { type: 'apiKey', in: 'header', name: 'x-groceryview-billing-signature' }
      }
    },
    paths: {
      '/api/health': { get: publicOperation('Get API runtime health without exposing secrets.') },
      '/api/auth/session': { post: publicOperation('Exchange a verified auth provider assertion for a short-lived bearer session.') },
      '/api/market/overview': { get: publicOperation('Get Stockholm grocery market overview.') },
      '/api/nutrition/value': { get: publicOperation('Get nutrition per krona rankings with sugar and salt warning guardrails.') },
      '/api/pantry/replenishment': { get: protectedOperation('Get pantry replenishment status with expiry, basket duplicate, and best-deal context.') },
      '/api/loyalty/offers': { get: protectedOperation('Get account-scoped loyalty offers with savings, coupon actions, and membership guardrails.') },
      '/api/ads/disclosure': { get: protectedOperation('Get ad disclosure status with placement labels, premium removal, and ranking separation guardrails.') },
      '/api/receipts/review': { get: protectedOperation('Get receipt review budget impact, match confidence, and writeback guardrails.') },
      '/api/categories/{category}/market': { get: publicOperation('Get category market report with current price, 1M move, 52-week range, and verified evidence.') },
      '/api/stores': { get: publicOperation('List stores.') },
      '/api/account/subscription-access': { get: protectedOperation('Get subscription access policy for the signed-in account.') },
      '/api/billing/subscription-events': { post: billingWebhookOperation('Accept signed billing subscription events and persist entitlement updates.') },
      '/api/stores/{id}': { get: publicOperation('Get store profile.') },
      '/api/stores/{id}/deals': { get: publicOperation('Get ranked in-store deals for one store.') },
      '/api/products/search': { get: publicOperation('Search products.') },
      '/api/products/{id}': { get: publicOperation('Get product detail.') },
      '/api/products/{id}/deal-score': { get: publicOperation('Get Deal Score v1 report with customer-facing reasons.') },
      '/api/products/{id}/equivalents': { get: publicOperation('Get comparable products in the same category.') },
      '/api/products/{id}/prices': { get: publicOperation('Get product prices by store.') },
      '/api/products/{id}/history': { get: publicOperation('Get product price history.') },
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
      '/api/basket/current': { get: protectedOperation('Get current weekly basket.') },
      '/api/basket/items': { post: protectedOperation('Add basket item.') },
      '/api/basket/items/{productId}': {
        patch: protectedOperation('Update basket item quantity.'),
        delete: protectedOperation('Remove basket item.')
      },
      '/api/basket/compare': { post: protectedOperation('Compare basket strategies.') },
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
  metricsToken?: string;
};

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
    if (!env.BILLING_WEBHOOK_SECRET) throw new Error('BILLING_WEBHOOK_SECRET is required in production.');
    if (!env.METRICS_TOKEN) throw new Error('METRICS_TOKEN is required in production.');
  }
  validatePublicWebUrl(env.PUBLIC_WEB_URL);
  return {
    nodeEnv,
    port,
    authSecret: env.AUTH_SECRET,
    databaseUrl: env.DATABASE_URL,
    publicWebUrl: env.PUBLIC_WEB_URL,
    notificationWebhookSecret: env.NOTIFICATION_WEBHOOK_SECRET,
    billingWebhookSecret: env.BILLING_WEBHOOK_SECRET,
    metricsToken: env.METRICS_TOKEN
  };
}

export function buildRuntimeAuthOptions(config: RuntimeConfig, options: RuntimeHandlerOptions = {}): AuthOptions {
  return {
    runtimeConfig: config,
    authSecret: config.authSecret,
    now: options.now,
    notificationWebhookSecret: config.notificationWebhookSecret,
    billingWebhookSecret: config.billingWebhookSecret,
    notificationMetricsToken: config.metricsToken,
    notificationMetricsProvider: options.notificationMetricsProvider,
    postgresReadinessProvider: options.postgresReadinessProvider
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
    humanReviewRepository: {
      getHumanReviewer: (reviewerId) => repository.getHumanReviewer(reviewerId),
      listOpenHumanReviewAssignments: () => repository.listOpenHumanReviewAssignments(),
      saveHumanReviewAssignment: (assignment) => repository.saveHumanReviewAssignment(assignment)
    },
    notificationSuppressionSink: {
      upsertNotificationSuppression: (suppression) => repository.upsertNotificationSuppression(suppression)
    },
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
  close(): Promise<void>;
} {
  if (options.repository || !config.databaseUrl) return { close: noopClose };

  const pool = (options.pgPoolFactory ?? createDefaultPgPool)(config.databaseUrl);
  const executor: QueryExecutor = createPgQueryExecutor(pool);
  return {
    repository: createPostgresRepository(executor),
    postgresReadinessProvider: () => checkPostgresIntegrationReadiness({ executor, repositoryProbes: [] }),
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
    postgresReadinessProvider: options.postgresReadinessProvider ?? resource.postgresReadinessProvider
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
