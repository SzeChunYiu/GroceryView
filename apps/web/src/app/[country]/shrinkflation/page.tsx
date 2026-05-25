import type { Metadata } from 'next';
import { detectShrinkflation, parsePackageSizeText, type ShrinkflationObservation } from '@groceryview/core';
import { axfoodProducts } from '@/lib/axfood-products';

const axfoodRetrievedAt = '2026-05-21T00:00:00.000Z';

type ShrinkflationPageProps = Readonly<{ params: Promise<{ country: string }> }>;

export const metadata: Metadata = {
  title: 'Shrinkflation detector | GroceryView',
  description: 'Detect pack-size decreases where the observed product price stayed the same or rose.'
};

function titleCaseSegment(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function axfoodShrinkflationObservations(): ShrinkflationObservation[] {
  return axfoodProducts.flatMap((product) => {
    const parsedPack = parsePackageSizeText(`${product.subline} ${product.name}`);
    if (!parsedPack) return [];

    return Object.entries(product.chains).flatMap(([chainId, chainPrice]) => {
      if (typeof chainPrice.price !== 'number' || chainPrice.price <= 0) return [];
      return [{
        canonicalProductId: product.code,
        productName: `${product.brand} ${product.name}`.trim(),
        observedAt: axfoodRetrievedAt,
        packSize: parsedPack.size,
        packUnit: parsedPack.unit,
        price: chainPrice.price,
        currency: 'SEK',
        sourceLabel: `${chainId} Axfood price scrape · ${parsedPack.label}`,
        confidence: 0.78
      }];
    });
  });
}

function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatPack(size: number, unit: string) {
  return `${size.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}${unit}`;
}

export default async function ShrinkflationPage({ params }: ShrinkflationPageProps) {
  const { country } = await params;
  const marketName = titleCaseSegment(country || 'se');
  const observations = axfoodShrinkflationObservations();
  const canonicalProductCount = new Set(observations.map((observation) => observation.canonicalProductId)).size;
  const candidates = detectShrinkflation(observations);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <a className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700" href="/">GroceryView</a>
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-700">{marketName} shrinkflation detector</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Pack-size drops where price held or rose</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
            This page runs the core shrinkflation detector against real Axfood product rows only. A product is flagged only when a later dated row for the same canonical product has a smaller package while the total price stayed flat or increased.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Canonical products</p>
            <p className="mt-2 text-4xl font-black">{canonicalProductCount}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">with parseable package-size evidence</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Source observations</p>
            <p className="mt-2 text-4xl font-black">{observations.length}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">Willys/Hemköp Axfood rows retrieved 2026-05-20/21</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Confirmed shrinkflation</p>
            <p className="mt-2 text-4xl font-black">{candidates.length}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">requires two dated rows for the same canonical product</p>
          </div>
        </div>

        {candidates.length > 0 ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Shrinkflation candidates">
            {candidates.map((candidate) => (
              <article className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm" key={`${candidate.canonicalProductId}-${candidate.currentObservedAt}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Shrinkflation candidate</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{candidate.productName}</h2>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Pack changed from {formatPack(candidate.previousPackSize, candidate.packUnit)} to {formatPack(candidate.currentPackSize, candidate.packUnit)} while price moved from {candidate.previousPrice.toFixed(2)} {candidate.currency} to {candidate.currentPrice.toFixed(2)} {candidate.currency}.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <p className="rounded-2xl bg-rose-50 p-3 text-sm font-black text-rose-950">Pack {formatPercent(-candidate.packSizeDecreasePercent)}</p>
                  <p className="rounded-2xl bg-amber-50 p-3 text-sm font-black text-amber-950">Price {formatPercent(candidate.priceChangePercent)}</p>
                  <p className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-900">Unit {formatPercent(candidate.unitPriceIncreasePercent)}</p>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">{candidate.evidenceLabel}</p>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-6 shadow-sm" aria-label="No confirmed shrinkflation candidates">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">No confirmed candidates in current evidence</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Current Axfood rows are a single snapshot, not longitudinal pack-size history.</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              GroceryView is withholding shrinkflation claims until the same canonical product has at least two dated package-size observations. The detector is active, but this page does not infer shrinkflation from one current price scrape or from different product variants.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Detection guardrails</p>
          <ul className="mt-3 grid gap-3 text-sm font-semibold leading-6 text-emerald-950 md:grid-cols-3">
            <li className="rounded-2xl bg-white p-4">Groups by canonicalProductId, currency, and comparable pack unit before comparing rows.</li>
            <li className="rounded-2xl bg-white p-4">Requires a smaller later pack and a price that stayed flat or rose within tolerance.</li>
            <li className="rounded-2xl bg-white p-4">Shows source labels and confidence; no fabricated prices, pack sizes, or household savings.</li>
          </ul>
        </section>
      </section>
    </main>
  );
}
