import { detectCoordinatedPriceMovements, type CoordinatedPriceObservation } from '@groceryview/core';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { formatPct, formatSek, matchedChainProducts, snapshot } from '@/lib/verified-data';

const currentOnlyObservations: CoordinatedPriceObservation[] = matchedChainProducts.slice(0, 24).flatMap((product) => {
  return Object.entries(product.chains).flatMap(([chainId, row]) => {
    if (!row?.price || row.price <= 0) return [];
    return [{
      sku: product.code,
      productName: product.name,
      chainId,
      observedAt: '2026-05-21T00:00:00.000Z',
      price: row.price,
      sourceLabel: snapshot.axfoodSource,
      sourceConfidence: 0.82
    }];
  });
});

const redFlagSignals = detectCoordinatedPriceMovements(currentOnlyObservations, { minimumChangePercent: 5 });
const chainCount = new Set(currentOnlyObservations.map((observation) => observation.chainId)).size;

export function generateMetadata() {
  return {
    title: 'Research-grade price movement red flags | GroceryView',
    description: 'Research-only detector for same-week, same-SKU price movements across chains. Not an accusation.'
  };
}

export default function PriceMovementRedFlagsPage() {
  return (
    <PageShell>
      <Eyebrow>Research signal · not an accusation</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Same-week chain price movement red flags</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page surfaces the coordinated-price-movement test from core: a SKU is flagged only when at least two chains move the same SKU in the same direction by the configured threshold within the same ISO week. It is a research-grade screen for review, never a claim of price fixing or intent.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Research red flags</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{redFlagSignals.length}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Requires repeated dated prices; current matched Axfood rows are single-snapshot.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Observed chain rows</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{currentOnlyObservations.length}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">{chainCount} chains from {snapshot.axfoodSource}.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Threshold</p>
          <p className="mt-2 text-5xl font-black text-slate-950">5%</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Same SKU, same ISO week, same direction, at least two chains.</p>
        </Card>
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">Detector output</h2>
        {redFlagSignals.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {redFlagSignals.map((signal) => (
              <div className="rounded-2xl bg-white/85 p-4" key={`${signal.sku}-${signal.weekStart}-${signal.direction}`}>
                <p className="text-lg font-black text-slate-950">{signal.productName}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">Week {signal.weekStart} · {signal.direction} · {signal.chains.join(', ')}</p>
                <p className="mt-3 rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950">
                  Average move {formatPct(signal.averageAbsoluteChangePercent)} · max {formatPct(signal.maxAbsoluteChangePercent)}
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{signal.researchGradeCopy}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-white/85 p-4 text-sm font-bold leading-6 text-amber-950">
            No research red flags are emitted for the current visible feed because these Axfood matched-product rows are one-date snapshots. The core detector is active, but the route refuses to infer coordinated movement without repeated dated observations.
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Single-snapshot matched SKU coverage</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {matchedChainProducts.slice(0, 8).map((product) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={product.code}>
              <p className="font-black text-slate-950">{product.name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">SKU {product.code} · spread {formatPct(product.spreadPct)}</p>
              <p className="mt-3 text-sm font-bold text-slate-700">Lowest {formatSek(product.lowestPrice)} at {product.lowestChain}; highest {formatSek(product.highestPrice)}.</p>
            </div>
          ))}
        </div>
      </Card>

      <SourceCoverage />
    </PageShell>
  );
}
