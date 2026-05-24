"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type DecimalCurrency = 'SEK';

type PriceType = 'shelf';

type Confidence = 'high' | 'medium' | 'low';

export type PriceStreamUpdate = {
  productId: string;
  storeId: string;
  storeName: string;
  price: number;
  currency: DecimalCurrency;
  priceType: PriceType;
  confidence: Confidence;
  observedAt: string;
  sourceType: string;
  provenance: string;
};

export type PriceStreamTransport = 'websocket' | 'sse';

export type UsePriceStreamOptions = {
  apiBase?: string;
  productId?: string;
  enabled?: boolean;
  transport?: PriceStreamTransport;
  onUpdate?: (update: PriceStreamUpdate) => void;
};

type UsePriceStreamResult = {
  transport: PriceStreamTransport | null;
  latest: PriceStreamUpdate | null;
  connected: boolean;
};

const DEFAULT_ENDPOINT = '/prices/stream';

function buildStreamUrl(apiBase: string, productId?: string): string {
  const url = new URL(DEFAULT_ENDPOINT, apiBase || 'http://localhost:3001');
  if (productId) {
    url.searchParams.set('productId', productId);
  }
  return url.toString();
}

function isPriceStreamUpdate(value: unknown): value is PriceStreamUpdate {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as PriceStreamUpdate;
  return (
    typeof candidate.productId === 'string' &&
    typeof candidate.storeId === 'string' &&
    typeof candidate.storeName === 'string' &&
    typeof candidate.price === 'number' &&
    candidate.currency === 'SEK' &&
    candidate.priceType === 'shelf' &&
    (candidate.confidence === 'high' || candidate.confidence === 'medium' || candidate.confidence === 'low') &&
    typeof candidate.observedAt === 'string' &&
    typeof candidate.sourceType === 'string' &&
    typeof candidate.provenance === 'string'
  );
}

function parsePriceStreamPayload(raw: string): PriceStreamUpdate | null {
  try {
    const parsed = JSON.parse(raw);
    const eventPayload = isNestedSseEvent(parsed) ? parsed.data : parsed;
    return isPriceStreamUpdate(eventPayload) ? eventPayload : null;
  } catch {
    return null;
  }
}

function isNestedSseEvent(payload: unknown): payload is { type: string; data: unknown } {
  return typeof payload === 'object' && payload !== null && typeof (payload as { type?: unknown }).type === 'string' &&
    Object.prototype.hasOwnProperty.call(payload, 'data');
}

function hasWebSocket(): boolean {
  return typeof window !== 'undefined' && typeof window.WebSocket === 'function';
}

function hasEventSource(): boolean {
  return typeof window !== 'undefined' && typeof window.EventSource === 'function';
}

function toWebSocketUrl(streamUrl: string): string {
  return streamUrl.replace(/^http/i, 'ws');
}

export function usePriceStream({
  apiBase = '',
  productId,
  enabled = true,
  transport = 'sse',
  onUpdate
}: UsePriceStreamOptions): UsePriceStreamResult {
  const [latest, setLatest] = useState<PriceStreamUpdate | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeTransport, setActiveTransport] = useState<PriceStreamTransport | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const applyUpdate = useCallback(
    (update: PriceStreamUpdate | null) => {
      if (!update) return;
      setLatest(update);
      onUpdate?.(update);
    },
    [onUpdate]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const streamUrl = buildStreamUrl(apiBase, productId);
    const preferredWs = transport === 'websocket' && hasWebSocket();
    const useWebSocket = preferredWs;

    const stop = () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      setConnected(false);
      setActiveTransport(null);
    };

    const startSse = () => {
      if (!hasEventSource()) return;
      const es = new EventSource(streamUrl);
      sourceRef.current = es;
      setActiveTransport('sse');

      es.addEventListener('open', () => {
        setConnected(true);
      });

      es.addEventListener('message', (event) => {
        applyUpdate(parsePriceStreamPayload(event.data));
      });

      es.addEventListener('error', () => {
        setConnected(false);
      });
    };

    const startWebSocket = () => {
      const ws = new WebSocket(toWebSocketUrl(streamUrl));
      wsRef.current = ws;
      setActiveTransport('websocket');

      ws.addEventListener('open', () => {
        setConnected(true);
      });

      ws.addEventListener('message', (event) => {
        applyUpdate(parsePriceStreamPayload(event.data));
      });

      ws.addEventListener('close', (event) => {
        setConnected(false);
        if (transport === 'websocket' && !event.wasClean) {
          startSse();
        }
      });

      ws.addEventListener('error', () => {
        setConnected(false);
        startSse();
      });
    };

    if (useWebSocket) {
      startWebSocket();
    } else {
      startSse();
    }

    return () => {
      stop();
    };
  }, [apiBase, enabled, onUpdate, productId, transport, applyUpdate]);

  return {
    transport: activeTransport,
    latest,
    connected
  };
}
