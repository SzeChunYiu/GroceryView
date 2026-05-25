import Link from 'next/link';
import type { buildItemComparisonView } from '@/lib/verified-data';

type ItemComparisonView = ReturnType<typeof buildItemComparisonView>;
type ItemComparisonItem = ItemComparisonView['items'][number];

function itemColumnHeading(item: ItemComparisonItem) {
  return (
    <div className="min-w-56">
      <Link className="text-base font-black text-emerald-950 underline decoration-emerald-300 underline-offset-4" href={`/products/${item.slug}`}>
        {item.name}
      </Link>
      <p className="mt-1 text-xs font-semibold text-slate-500">{item.brand}</p>
      <p className="mt-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">{item.cheapestPriceLabel} · {item.cheapestStoreLabel}</p>
    </div>
  );
}

function NutritionCell({ item }: { item: ItemComparisonItem }) {
  return (
    <div className="grid gap-2 text-sm">
      <p className="font-black text-slate-950">Nutri-Score: {item.nutrition.nutriScore}</p>
      <p className="font-semibold text-slate-600">{item.nutrition.category} · {item.nutrition.quantity}</p>
      <p className="text-xs font-semibold leading-5 text-slate-500">{item.nutrition.labels.join(' · ') || 'No nutrition labels reported'}</p>
    </div>
  );
}

function StorePriceCell({ item }: { item: ItemComparisonItem }) {
  if (item.storePrices.length === 0) {
    return (
      <p className="rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
        No store price row has evidence for the selected fulfillment filters.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {item.storePrices.map((price) => (
        <div className="rounded-2xl bg-slate-50 p-3" key={`${item.slug}-${price.storeName}`}>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{price.storeName}</p>
          <p className="mt-1 text-lg font-black text-slate-950">{price.priceLabel}</p>
          <p className="text-xs font-semibold text-slate-500">{price.unitLabel}</p>
          <ComparisonSparkline item={item} label={`${item.name} at ${price.storeName}`} />
        </div>
      ))}
    </div>
  );
}

function comparisonSparklinePath(points: ItemComparisonItem['trendPoints'], width = 132, height = 36) {
  if (points.length < 2) return '';
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function ComparisonSparkline({ item, label }: { item: ItemComparisonItem; label: string }) {
  const path = comparisonSparklinePath(item.trendPoints);
  if (!path) {
    return <p className="mt-2 text-xs font-semibold text-slate-500">Price history sparkline waits for at least two observations.</p>;
  }

  const latest = item.trendPoints.at(-1);
  return (
    <div className="mt-3" data-comparison-price-history-sparkline={item.slug}>
      <svg
        aria-label={`${label} compact historical price sparkline`}
        className="h-10 w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 132 36"
      >
        <title>{`${label} price history sparkline`}</title>
        <path d={path} fill="none" stroke="#4f46e5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-1 text-[0.68rem] font-bold text-indigo-800">{item.trendSummary} · latest {latest?.priceLabel ?? item.cheapestPriceLabel}</p>
    </div>
  );
}

function TrendChartCell({ item }: { item: ItemComparisonItem }) {
  const maxPrice = Math.max(...item.trendPoints.map((point) => point.price), 1);

  return (
    <div className="grid gap-2">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{item.trendSummary}</p>
      <ComparisonSparkline item={item} label={item.name} />
      <div className="flex h-24 items-end gap-1 rounded-2xl bg-indigo-50 p-3" aria-label={`${item.name} trend charts`}>
        {item.trendPoints.map((point) => (
          <span
            className="min-w-5 flex-1 rounded-t bg-indigo-700"
            key={`${item.slug}-${point.label}-${point.price}`}
            style={{ height: `${Math.max(12, (point.price / maxPrice) * 100)}%` }}
            title={`${point.label}: ${point.priceLabel}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-[0.7rem] font-bold text-slate-600">
        {item.trendPoints.map((point) => (
          <span className="rounded-full bg-white px-2 py-1" key={`${item.slug}-${point.label}`}>{point.label}: {point.priceLabel}</span>
        ))}
      </div>
    </div>
  );
}

export function ItemComparisonTable({ activeFulfillmentFilterLabels, fulfillmentFilterSummary, items, maxItems, missingItemIds, sourceLabel, truncatedItemIds }: ItemComparisonView) {
  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm" data-item-comparison-table>
      <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-4">
        <h2 className="text-2xl font-black text-emerald-950">Item comparison table</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
          Select up to four items to compare nutrition, price across stores, and trend charts from verified GroceryView sources.
        </p>
        {activeFulfillmentFilterLabels.length > 0 ? (
          <p className="mt-2 text-xs font-bold text-emerald-800">
            Active filters: {activeFulfillmentFilterLabels.join(', ')} · {fulfillmentFilterSummary}
          </p>
        ) : null}
        <p className="mt-2 text-xs font-bold text-emerald-800">Source: {sourceLabel} · max {maxItems} items</p>
      </div>
      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left align-top">
            <caption className="sr-only">Side-by-side item comparison table for up to four items</caption>
            <thead>
              <tr className="bg-slate-950 text-white">
                <th className="w-44 px-4 py-3 text-sm font-black">Comparison</th>
                {items.map((item) => (
                  <th className="px-4 py-3 align-top" key={item.slug}>{itemColumnHeading(item)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100 align-top">
                <th className="px-4 py-4 text-sm font-black text-slate-950">Nutrition</th>
                {items.map((item) => <td className="px-4 py-4" key={`${item.slug}-nutrition`}><NutritionCell item={item} /></td>)}
              </tr>
              <tr className="border-t border-slate-100 align-top">
                <th className="px-4 py-4 text-sm font-black text-slate-950">Price across stores</th>
                {items.map((item) => <td className="px-4 py-4" key={`${item.slug}-prices`}><StorePriceCell item={item} /></td>)}
              </tr>
              <tr className="border-t border-slate-100 align-top">
                <th className="px-4 py-4 text-sm font-black text-slate-950">Trend charts</th>
                {items.map((item) => <td className="px-4 py-4" key={`${item.slug}-trend`}><TrendChartCell item={item} /></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-5 text-sm font-semibold text-slate-600">No matched items. Add item slugs with ?items=slug-1,slug-2.</p>
      )}
      {missingItemIds.length > 0 || truncatedItemIds.length > 0 ? (
        <div className="grid gap-2 border-t border-amber-100 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-950">
          {missingItemIds.length > 0 ? <p>Missing item ids: {missingItemIds.join(', ')}</p> : null}
          {truncatedItemIds.length > 0 ? <p>Ignored after the four-item limit: {truncatedItemIds.join(', ')}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
