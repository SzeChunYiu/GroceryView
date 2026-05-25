'use client';

import { useState } from 'react';
import {
  findSubstitutionSavings,
  type SubstitutionSavingsProduct
} from '@/lib/deduplicate-products';

type PriceAlertDialogProps = {
  productName?: string;
  product?: SubstitutionSavingsProduct;
  comparableProducts?: SubstitutionSavingsProduct[];
  activeAlertCount?: number;
  freeAlertLimit?: number;
  initialChain?: string;
  initialTargetPrice?: string;
  priceChartContext?: string;
  premiumFeaturesEnabled?: boolean;
};

const demoProduct: SubstitutionSavingsProduct = {
  id: 'alert-demo-oats',
  name: 'Havregryn 1kg',
  brand: 'Axa',
  category: 'breakfast',
  size: '1 kg',
  price: 34.9
};

const demoComparableProducts: SubstitutionSavingsProduct[] = [
  { id: 'alert-demo-oats-store', name: 'Havregryn 1kg', brand: 'Garant', category: 'breakfast', size: '1 kg', price: 24.9 },
  { id: 'alert-demo-muesli', name: 'Müsli 750g', brand: 'Eldorado', category: 'breakfast', size: '750 g', price: 29.9 },
  { id: 'alert-demo-coffee', name: 'Bryggkaffe 450g', brand: 'Zoegas', category: 'coffee', size: '450 g', price: 59.9 }
];

export function PriceAlertDialog({
  productName,
  product = demoProduct,
  comparableProducts = demoComparableProducts,
  activeAlertCount = 0,
  freeAlertLimit = 3,
  initialChain,
  initialTargetPrice = '',
  priceChartContext,
  premiumFeaturesEnabled = false
}: PriceAlertDialogProps) {
  const freeLimitReached = !premiumFeaturesEnabled && activeAlertCount >= freeAlertLimit;
  const [targetPrice, setTargetPrice] = useState(initialTargetPrice);
  const [error, setError] = useState<string | null>(null);
  const alertProductName = productName ?? product.name;
  const substitutions = findSubstitutionSavings(product, comparableProducts);

  const validateTargetPrice = () => {
    if (freeLimitReached) {
      setError(`Free accounts can keep up to ${freeAlertLimit} active price alerts. Upgrade to premium for unlimited alerts and faster deal monitoring.`);
      return false;
    }

    const parsed = Number(targetPrice.replace(',', '.'));
    if (!targetPrice.trim()) {
      setError('Enter a target price before saving this price alert.');
      return false;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Target price must be a positive number.');
      return false;
    }
    setError(null);
    return true;
  };

  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        validateTargetPrice();
      }}
    >
      <h2 className="text-xl font-black text-slate-950">Create a price alert for {alertProductName}</h2>
      {initialChain || priceChartContext ? (
        <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
          Prefilled from price chart{initialChain ? ` · ${initialChain}` : ''}{priceChartContext ? ` · ${priceChartContext}` : ''}.
        </p>
      ) : null}
      <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
        Free accounts include {freeAlertLimit} active price alerts. Premium unlocks unlimited alerts, priority checks, and earlier deal notifications.
      </p>
      {initialChain ? (
        <>
          <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="price-alert-chain">
            Chain
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950"
            id="price-alert-chain"
            readOnly
            value={initialChain}
          />
        </>
      ) : null}
      <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="price-alert-target">
        Target price
      </label>
      <input
        aria-describedby={error ? 'price-alert-target-error' : undefined}
        aria-invalid={error ? 'true' : undefined}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        id="price-alert-target"
        inputMode="decimal"
        onChange={(event) => setTargetPrice(event.target.value)}
        value={targetPrice}
      />
      {error ? (
        <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800" id="price-alert-target-error" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
      {substitutions.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-900">If this alert misses</p>
          <div className="mt-3 space-y-2">
            {substitutions.map((suggestion) => (
              <div className="rounded-xl bg-white p-3" key={suggestion.product.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-950">{suggestion.product.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{suggestion.reason}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-800">Save {suggestion.savingsPercent}%</p>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-700">
                  {suggestion.product.price.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })} · {suggestion.unitPrice.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}/{suggestion.normalizedSizeLabel.split(' ')[1]}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <button className="mt-4 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={freeLimitReached} type="submit">
        Save alert
      </button>
    </form>
  );
}
