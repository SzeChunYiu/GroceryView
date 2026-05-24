'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ProductLatestPrice } from '@groceryview/api';

type StreamStatus = 'connecting' | 'streaming' | 'disconnected' | 'error';

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
  code: string;
  message: string;
};

type PriceStreamFrame = PriceStreamWelcomeFrame | PriceStreamDataFrame | PriceStreamErrorFrame;

type UsePriceStreamInput = {
  productId: string;
  enabled?: boolean;
};

type UsePriceStreamOutput = {
  status: StreamStatus;
  prices: ProductLatestPrice[];
  lastSeenAt: string | null;
  sequence: number;
  error: string | null;
  isConnected: boolean;
};

const defaultOutput: UsePriceStreamOutput = {
  status: 'connecting',
  prices: [],
  lastSeenAt: null,
  sequence: 0,
  error: null,
  isConnected: false
};

function buildWebSocketUrl(productId: string) {
  const envBase = typeof process === 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '').trim();

  const location = typeof window === 'undefined' ? null : new URL(window.location.href);
  const fallbackBase = location ? location.origin : 'http://127.0.0.1';
  const base = envBase ? new URL(envBase, fallbackBase) : new URL(fallbackBase);
  const websocketUrl = new URL('/api/ws/prices', base);
  websocketUrl.protocol = websocketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  websocketUrl.searchParams.set('productId', productId);
  return websocketUrl.toString();
}

function parsePriceFrame(raw: unknown): PriceStreamFrame | null {
  try {
    if (typeof raw !== 'string') return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    if ((parsed as { event?: unknown }).event === 'welcome') {
      const frame = parsed as PriceStreamWelcomeFrame;
      return typeof frame.productId === 'string' && typeof frame.refreshIntervalMs === 'number'
        ? frame
        : null;
    }

    if ((parsed as { event?: unknown }).event === 'snapshot' || (parsed as { event?: unknown }).event === 'update') {
      const frame = parsed as PriceStreamDataFrame;
      if (
        typeof frame.productId !== 'string' || !Number.isFinite(frame.sequence) || typeof frame.asOf !== 'string' ||
        !Array.isArray(frame.prices)
      ) {
        return null;
      }

      return frame;
    }

    if ((parsed as { event?: unknown }).event === 'error') {
      const frame = parsed as PriceStreamErrorFrame;
      return typeof frame.message === 'string' && typeof frame.code === 'string'
        ? frame
        : null;
    }

    return null;
  } catch {
    return null;
  }
}

function isProductRowArray(values: unknown): values is ProductLatestPrice[] {
  return Array.isArray(values);
}

function normalizeRows(rawRows: ProductLatestPrice[]) {
  return rawRows
    .filter((row) => typeof row.price === 'number' && Number.isFinite(row.price))
    .sort((left, right) => left.price - right.price)
    .map((row) => ({ ...row, price: Number(row.price.toFixed(6)) }));
}

function usePriceStream({ productId, enabled = true }: UsePriceStreamInput): UsePriceStreamOutput {
  const [state, setState] = useState<UsePriceStreamOutput>(defaultOutput);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!enabled) {
      setState((current) => ({
        ...current,
        status: 'disconnected',
        isConnected: false,
        error: null
      }));
      return;
    }

    const url = buildWebSocketUrl(productId);
    const socket = new WebSocket(url);
    let closed = false;
    const toText = async (raw: string | Blob | ArrayBuffer) => {
      if (typeof raw === 'string') return raw;
      if (raw instanceof Blob) return raw.text();
      return new TextDecoder().decode(raw);
    };

    setState((current) => ({
      ...current,
      status: 'connecting',
      error: null,
      isConnected: false
    }));

    const handleOpen = () => {
      setState((current) => ({
        ...current,
        status: 'streaming',
        isConnected: true,
        error: null
      }));
    };

    const handleMessage = async (event: MessageEvent<string | Blob | ArrayBuffer>) => {
      const raw = await toText(event.data);
      const frame = parsePriceFrame(raw);
      if (!frame) return;

      if (frame.event === 'welcome') {
        return;
      }

      if (frame.event === 'error') {
        setState((current) => ({
          ...current,
          status: 'error',
          error: frame.message,
          isConnected: false
        }));
        return;
      }

      const prices = isProductRowArray(frame.prices) ? normalizeRows(frame.prices) : [];
      setState((current) => ({
        ...current,
        status: 'streaming',
        prices,
        sequence: frame.sequence,
        lastSeenAt: frame.asOf
      }));
    };

    const handleError = () => {
      if (closed) return;
      setState((current) => ({
        ...current,
        status: 'error',
        error: 'WebSocket transport failed. Re-open this page to retry.',
        isConnected: false
      }));
    };

    const handleClose = () => {
      if (closed) return;
      closed = true;
      setState((current) => ({
        ...current,
        status: current.status === 'error' ? 'error' : 'disconnected',
        isConnected: false
      }));
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('message', handleMessage);
    socket.addEventListener('error', handleError);
    socket.addEventListener('close', handleClose);

    return () => {
      closed = true;
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('error', handleError);
      socket.removeEventListener('close', handleClose);
      if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) {
        socket.close(1000, 'component unmounted');
      }
    };
  }, [productId, enabled]);

  return useMemo(
    () => ({
      ...state,
      isConnected: state.status === 'streaming'
    }),
    [state]
  );
}

export { usePriceStream };
export type { UsePriceStreamOutput, StreamStatus };
