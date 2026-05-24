'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatSek } from '@/lib/verified-data';
import { usePriceStream } from '@/hooks/usePriceStream';
import type { ProductLatestPrice } from '@groceryview/api';

type StaticPriceRow = {
  chainName: string;
  storeName: string;
  price: number;
  observedAt: string | null;
};

type PriceStreamPanelProps = {
  productId: string;
  fallbackRows: StaticPriceRow[];
};

function formatObservedAt(value: string | null) {
  if (!value) return 'not observed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'invalid time';
  return date.toLocaleString('sv-SE', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function statusLabel(status: ReturnType<typeof usePriceStream>['status'], isConnected: boolean) {
  if (status === 'error') return 'Error';
  if (status === 'disconnected') return 'Disconnected';
  if (isConnected) return 'Live';
  return 'Connecting';
}

function statusClass(status: ReturnType<typeof usePriceStream>['status'], isConnected: boolean) {
  if (status === 'error') return 'bg-rose-100 text-rose-900';
  if (status === 'disconnected') return 'bg-amber-100 text-amber-900';
  if (isConnected) return 'bg-emerald-100 text-emerald-900';
  return 'bg-indigo-100 text-indigo-900';
}

function PriceRows({ rows }: { rows: ProductLatestPrice[] }) {
  if (rows.length === 0) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">No live rows yet. Waiting for first stream event.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[1.7fr_1.1fr_1fr_1fr] border-b bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
        <p>Store</p>
        <p>Chain</p>
        <p className="text-right">Price</p>
        <p className="text-right">Observed</p>
      </div>
      {rows.map((row) => (
        <div key={`${row.observationId}-${row.storeId}-${row.storeName}`} className="grid grid-cols-[1.7fr_1.1fr_1fr_1fr] gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
          <p className="font-black text-slate-950">{row.storeName}</p>
          <p className="text-slate-700">{row.chainName}</p>
          <p className="text-right font-black text-emerald-900">{formatSek(row.price)}</p>
          <p className="text-right text-slate-600">{formatObservedAt(row.observedAt ?? null)}</p>
        </div>
      ))}
    </div>
  );
}

function StaticRows({ rows }: { rows: StaticPriceRow[] }) {
  if (rows.length === 0) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">No static rows available yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[1.7fr_1.1fr_1fr_1fr] border-b bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
        <p>Store</p>
        <p>Chain</p>
        <p className="text-right">Price</p>
        <p className="text-right">Observed</p>
      </div>
      {rows.map((row) => (
        <div
          key={`${row.chainName}-${row.storeName}-${row.price}`}
          className="grid grid-cols-[1.7fr_1.1fr_1fr_1fr] gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
        >
          <p className="font-black text-slate-950">{row.storeName || 'Unknown store'}</p>
          <p className="text-slate-700">{row.chainName || 'Unknown chain'}</p>
          <p className="text-right font-black text-emerald-900">{formatSek(row.price)}</p>
          <p className="text-right text-slate-600">{formatObservedAt(row.observedAt)}</p>
        </div>
      ))}
    </div>
  );
}

export default function PriceStreamPanel({ productId, fallbackRows }: PriceStreamPanelProps) {
  const { status, isConnected, prices, lastSeenAt, sequence, error } = usePriceStream({ productId });
  const hasLiveRows = prices.length > 0;
  const formattedLastSeenAt = useMemo(() => formatObservedAt(lastSeenAt), [lastSeenAt]);

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">WebSocket stream</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Live price rows for this product</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
              The stream sends the latest verified prices every few seconds from <code className="rounded bg-white px-1">/api/ws/prices?productId=...</code>.
            </p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-black ${statusClass(status, isConnected)}`}>
            {statusLabel(status, isConnected)}{sequence ? ` · ${sequence}` : ''}
          </span>
        </div>
        <p className="mt-3 text-xs font-bold text-slate-700">
          Last observed: {formattedLastSeenAt || 'none'}
        </p>
        {error ? <p className="mt-3 rounded-xl bg-rose-100 p-3 text-sm font-black text-rose-900">{error}</p> : null}
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">Latest verified rows</h3>
        {hasLiveRows ? <PriceRows rows={prices} /> : <StaticRows rows={fallbackRows} />}
      </div>

      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700">
        If the stream cannot connect, this page keeps a static fallback snapshot for continuity.
        Confirm API connectivity and DATABASE_URL in your local environment so `/prices?productId=...` has rows.
      </p>

      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <span className="font-black text-slate-900">Dev check:</span>{' '}
        <Link className="underline" href="/products">Go back to verified product catalog</Link>.
      </p>
    </div>
  );
}
