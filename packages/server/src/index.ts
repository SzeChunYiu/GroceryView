import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createGroceryViewApi } from '@groceryview/api';
import { parseBearerToken, verifySessionToken } from '@groceryview/auth';
import {
  processNotificationSuppressionEvent,
  type DeliveryChannel,
  type NotificationSuppressionEventType,
  type NotificationSuppressionMutation
} from '@groceryview/notifications';

export type HttpHandler = (request: Request) => Promise<Response>;

export type AuthOptions = {
  authSecret?: string;
  now?: Date;
  notificationWebhookSecret?: string;
  notificationSuppressionSink?: {
    upsertNotificationSuppression(suppression: NotificationSuppressionMutation): Promise<void>;
  };
};

type JsonRecord = Record<string, unknown>;

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

function optionalDeliveryChannel(value: unknown): DeliveryChannel | undefined {
  if (value === undefined) return undefined;
  if (value === 'push' || value === 'email') return value;
  throw new Error('channel must be push or email.');
}

function requiredSuppressionEventType(value: unknown): NotificationSuppressionEventType {
  if (value === 'unsubscribe' || value === 'bounce' || value === 'complaint' || value === 'resubscribe') return value;
  throw new Error('eventType must be unsubscribe, bounce, complaint, or resubscribe.');
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

export function createHttpHandler(api = createGroceryViewApi(), authOptions: AuthOptions = {}): HttpHandler {
  const authorizeUser = async (request: Request, userId: string): Promise<Response | null> => {
    if (!authOptions.authSecret) return null;
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) return errorResponse(401, 'Bearer session token is required.');
    const session = await verifySessionToken(token, authOptions.authSecret, authOptions.now);
    if (session.userId !== userId) return errorResponse(403, 'Session does not match requested user.');
    return null;
  };

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();

    try {
      if (method === 'GET' && path === '/api/market/overview') return jsonResponse(api.getMarketOverview());
      if (method === 'GET' && path === '/api/stores') return jsonResponse(api.getStores());

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

      const storeMatch = path.match(/^\/api\/stores\/([^/]+)$/);
      if (method === 'GET' && storeMatch) {
        const store = api.getStore(decodeURIComponent(storeMatch[1]));
        return store ? jsonResponse(store) : errorResponse(404, 'Store not found.');
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
      if (method === 'GET' && productPricesMatch) return jsonResponse(api.getProductPrices(decodeURIComponent(productPricesMatch[1])));

      const productHistoryMatch = path.match(/^\/api\/products\/([^/]+)\/history$/);
      if (method === 'GET' && productHistoryMatch) return jsonResponse(api.getProductHistory(decodeURIComponent(productHistoryMatch[1])));

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
  webhookSignature?: never[];
};

export type OpenApiPathItem = Partial<Record<'get' | 'post' | 'patch' | 'delete', OpenApiOperation>>;

export type OpenApiDocument = {
  openapi: '3.1.0';
  info: { title: string; version: string };
  paths: Record<string, OpenApiPathItem>;
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http'; scheme: 'bearer' };
      webhookSignature: { type: 'apiKey'; in: 'header'; name: 'x-groceryview-signature' };
    };
  };
};

const protectedOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ bearerAuth: [] }] });
const publicOperation = (summary: string): OpenApiOperation => ({ summary });
const webhookOperation = (summary: string): OpenApiOperation => ({ summary, security: [{ webhookSignature: [] }] });

export function buildOpenApiDocument(): OpenApiDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'GroceryView API', version: '0.1.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
        webhookSignature: { type: 'apiKey', in: 'header', name: 'x-groceryview-signature' }
      }
    },
    paths: {
      '/api/market/overview': { get: publicOperation('Get Stockholm grocery market overview.') },
      '/api/stores': { get: publicOperation('List stores.') },
      '/api/stores/{id}': { get: publicOperation('Get store profile.') },
      '/api/products/search': { get: publicOperation('Search products.') },
      '/api/products/{id}': { get: publicOperation('Get product detail.') },
      '/api/products/{id}/prices': { get: publicOperation('Get product prices by store.') },
      '/api/products/{id}/history': { get: publicOperation('Get product price history.') },
      '/api/users/{userId}/favorite-stores': {
        get: protectedOperation('List favorite stores.'),
        post: protectedOperation('Add favorite store.')
      },
      '/api/watchlist': {
        get: protectedOperation('Get watchlist and alerts.'),
        post: protectedOperation('Add watchlist item.')
      },
      '/api/basket/current': { get: protectedOperation('Get current weekly basket.') },
      '/api/basket/items': { post: protectedOperation('Add basket item.') },
      '/api/basket/compare': { post: protectedOperation('Compare basket strategies.') },
      '/api/budget': { patch: protectedOperation('Update budget.') },
      '/api/budget/summary': { get: protectedOperation('Get budget summary.') },
      '/api/indices': { get: publicOperation('List grocery indices.') },
      '/api/indices/{id}': { get: publicOperation('Get grocery index detail.') },
      '/api/notifications/suppression-events': { post: webhookOperation('Accept signed notification suppression provider events.') }
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
};

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
  }
  return {
    nodeEnv,
    port,
    authSecret: env.AUTH_SECRET,
    databaseUrl: env.DATABASE_URL,
    publicWebUrl: env.PUBLIC_WEB_URL,
    notificationWebhookSecret: env.NOTIFICATION_WEBHOOK_SECRET
  };
}

export type HealthReport = {
  status: 'ok';
  service: 'groceryview-server';
  environment: RuntimeConfig['nodeEnv'];
  hasDatabase: boolean;
  hasAuthSecret: boolean;
  hasNotificationWebhookSecret: boolean;
};

export function buildHealthReport(config: RuntimeConfig): HealthReport {
  return {
    status: 'ok',
    service: 'groceryview-server',
    environment: config.nodeEnv,
    hasDatabase: Boolean(config.databaseUrl),
    hasAuthSecret: Boolean(config.authSecret),
    hasNotificationWebhookSecret: Boolean(config.notificationWebhookSecret)
  };
}
