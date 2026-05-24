import { type IncomingMessage, type Server as HttpServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { type ProductLatestPrice } from '@groceryview/api';
import { LatestPricesService } from './latest-prices.service.js';

type PriceStreamWelcomeFrame = {
  event: 'welcome';
  productId: string;
  refreshIntervalMs: number;
};

type PriceStreamDataFrame = {
  event: 'snapshot' | 'update';
  productId: string;
  sequence: number;
  asOf: string;
  prices: ProductLatestPrice[];
};

type PriceStreamErrorFrame = {
  event: 'error';
  productId?: string;
  code: 'missing-product-id' | 'invalid-product-id' | 'product-not-found' | 'server-unavailable' | 'unexpected-error';
  message: string;
};

export type PriceStreamFrame = PriceStreamWelcomeFrame | PriceStreamDataFrame | PriceStreamErrorFrame;

const streamPath = '/api/ws/prices';
const refreshIntervalMs = 5000;
const maxProductIdLength = 128;
const validProductId = /^[A-Za-z0-9:_-]+$/;

function normalizeProductId(rawProductId: string | null): string | null {
  if (!rawProductId) return null;
  const trimmed = rawProductId.trim();
  if (!trimmed || trimmed.length > maxProductIdLength) return null;
  if (!validProductId.test(trimmed)) return null;
  return trimmed;
}

function buildPayload(event: PriceStreamDataFrame['event'], productId: string, sequence: number, prices: ProductLatestPrice[]): PriceStreamDataFrame {
  return {
    event,
    productId,
    sequence,
    asOf: new Date().toISOString(),
    prices
  };
}

function sendError(socket: WebSocket, error: Omit<PriceStreamErrorFrame, 'event'>) {
  if (socket.readyState !== socket.OPEN) return;
  const payload = JSON.stringify({ event: 'error', ...error });
  socket.send(payload);
}

function buildWelcomeFrame(productId: string): PriceStreamWelcomeFrame {
  return {
    event: 'welcome',
    productId,
    refreshIntervalMs
  };
}

function buildErrorFrame(code: PriceStreamErrorFrame['code'], message: string, productId?: string): PriceStreamErrorFrame {
  return { event: 'error', code, message, ...(productId ? { productId } : {}) };
}

export function configurePriceStream(httpServer: HttpServer, latestPricesService: LatestPricesService): void {
  const wss = new WebSocketServer({ server: httpServer, path: streamPath });

  wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');
    const rawProductId = requestUrl.searchParams.get('productId');
    const productId = normalizeProductId(rawProductId);

    if (!rawProductId) {
      sendError(socket, buildErrorFrame('missing-product-id', 'Missing required productId query parameter.'));
      socket.close(1008, 'Missing productId');
      return;
    }

    if (!productId) {
      sendError(socket, buildErrorFrame('invalid-product-id', 'Invalid productId. Allowed characters: A-Z, a-z, 0-9, :, _, -.'));
      socket.close(1008, 'Invalid productId');
      return;
    }

    let sequence = 0;
    const sendFrame = async () => {
      if (socket.readyState !== socket.OPEN) return;
      try {
        const prices = await latestPricesService.getProductLatestPrices(productId);
        if (prices === null) {
          sendError(socket, buildErrorFrame('product-not-found', 'No latest prices available for this product yet.', productId));
          return;
        }

        sequence += 1;
        socket.send(JSON.stringify(buildPayload(sequence === 1 ? 'snapshot' : 'update', productId, sequence, prices)));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to read latest prices right now.';
        sendError(socket, buildErrorFrame('server-unavailable', message, productId));
      }
    };

    socket.send(JSON.stringify(buildWelcomeFrame(productId)));
    void sendFrame();

    const interval = setInterval(() => {
      if (socket.readyState !== socket.OPEN) {
        clearInterval(interval);
        return;
      }

      void sendFrame();
    }, refreshIntervalMs);

    socket.on('close', () => {
      clearInterval(interval);
    });

    socket.on('error', (error) => {
      sendError(socket, buildErrorFrame('unexpected-error', error instanceof Error ? error.message : 'WebSocket transport error', productId));
    });
  });
}
