'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type DealHunterDiscoveryAlert = {
  id: string;
  type: 'new_product' | 'price_drop';
  productSlug: string;
  productName: string;
  brand: string;
  categoryKey: string;
  categoryLabel: string;
  chainKey: string;
  chainLabel: string;
  href: string;
  currentPriceLabel: string;
  previousPriceLabel?: string;
  dropPercentLabel?: string;
  sourceLabel: string;
  freshnessLabel: string;
  freshnessDetail: string;
  observedAt: string;
  confidenceLabel: string;
  dedupeLabel: string;
};

export type DealHunterDiscoveryOption = {
  value: string;
  label: string;
};

type DealHunterDiscoveryAlertsProps = {
  alerts: DealHunterDiscoveryAlert[];
  categoryOptions: DealHunterDiscoveryOption[];
  chainOptions: DealHunterDiscoveryOption[];
  dedupedWatchlistCount: number;
};

const frequencyOptions = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
];

export function DealHunterDiscoveryAlerts({
  alerts,
  categoryOptions,
  chainOptions,
  dedupedWatchlistCount
}: Readonly<DealHunterDiscoveryAlertsProps>) {
  const [category, setCategory] = useState('all');
  const [chain, setChain] = useState('all');
  const [frequency, setFrequency] = useState('daily');

  const visibleAlerts = useMemo(() => alerts.filter((alert) => {
    const categoryMatches = category === 'all' || alert.categoryKey === category;
    const chainMatches = chain === 'all' || alert.chainKey === chain;
    return categoryMatches && chainMatches;
  }), [alerts, category, chain]);

  const newCount = visibleAlerts.filter((alert) => alert.type === 'new_product').length;
  const dropCount = visibleAlerts.filter((alert) => alert.type === 'price_drop').length;

  return (
    <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5" aria-label="Deal-hunter discovery alerts">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Deal-hunter discovery</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">New products and material drops</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Discovery rows come from dated OpenPrices observations and exclude products already covered by the normal watchlist alert board.
          </p>
        </div>
        <div className="grid gap-2 rounded-2xl bg-white p-3 text-sm font-black text-amber-950 sm:grid-cols-3">
          <p>{newCount} new</p>
          <p>{dropCount} drops</p>
          <p>{dedupedWatchlistCount} deduped</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-black text-slate-950" htmlFor="dealhunter-category">
          Category
          <select className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950" id="dealhunter-category" onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="all">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="dealhunter-chain">
          Chain/source
          <select className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950" id="dealhunter-chain" onChange={(event) => setChain(event.target.value)} value={chain}>
            <option value="all">All sources</option>
            {chainOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="dealhunter-frequency">
          Frequency
          <select className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950" id="dealhunter-frequency" onChange={(event) => setFrequency(event.target.value)} value={frequency}>
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold text-amber-950" data-dealhunter-frequency={frequency}>
        Preference preview: {frequencyOptions.find((option) => option.value === frequency)?.label ?? 'Daily'} alerts for {category === 'all' ? 'all watched categories' : categoryOptions.find((option) => option.value === category)?.label} from {chain === 'all' ? 'all eligible sources' : chainOptions.find((option) => option.value === chain)?.label}.
      </p>

      {visibleAlerts.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {visibleAlerts.map((alert) => (
            <Link className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition hover:border-amber-700" href={alert.href} key={alert.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">{alert.type === 'new_product' ? 'New product' : 'Price drop'}</p>
                  <h3 className="mt-2 text-lg font-black leading-6 text-slate-950">{alert.productName}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{alert.brand} · {alert.categoryLabel}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                  <p className="text-xs font-black text-emerald-800">{alert.dropPercentLabel ?? alert.freshnessLabel}</p>
                  <p className="text-lg font-black text-emerald-950">{alert.currentPriceLabel}</p>
                </div>
              </div>
              {alert.previousPriceLabel ? (
                <p className="mt-3 text-sm font-black text-emerald-800">Was {alert.previousPriceLabel}</p>
              ) : null}
              <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                <p className="rounded-2xl bg-amber-50 p-3">{alert.chainLabel}</p>
                <p className="rounded-2xl bg-slate-50 p-3">{alert.freshnessLabel} · {alert.observedAt}</p>
                <p className="rounded-2xl bg-slate-50 p-3">{alert.confidenceLabel}</p>
                <p className="rounded-2xl bg-slate-50 p-3">{alert.dedupeLabel}</p>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{alert.sourceLabel}. {alert.freshnessDetail}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-amber-200 bg-white p-5 text-sm font-semibold text-slate-600">
          No discovery rows match the selected category and source preferences.
        </p>
      )}
    </section>
  );
}
