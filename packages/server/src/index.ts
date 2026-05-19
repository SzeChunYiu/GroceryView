import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createGroceryViewApi } from '@groceryview/api';

export type HttpHandler = (request: Request) => Promise<Response>;

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
    const parsed = (await request.json()) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('JSON body must be an object.');
    }
    return parsed as JsonRecord;
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'parse failed'}`);
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} is required.`);
  return value;
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

export function createHttpHandler(api = createGroceryViewApi()): HttpHandler {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();

    try {
      if (method === 'GET' && path === '/api/market/overview') return jsonResponse(api.getMarketOverview());
      if (method === 'GET' && path === '/api/stores') return jsonResponse(api.getStores());

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
        if (method === 'GET') return jsonResponse(api.getBasket(user));
      }

      if (path === '/api/basket/items') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
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
        if (method === 'POST') return jsonResponse(api.compareBasket(user));
      }

      if (path === '/api/budget') {
        const user = userIdFrom(url);
        if (user instanceof Response) return user;
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
