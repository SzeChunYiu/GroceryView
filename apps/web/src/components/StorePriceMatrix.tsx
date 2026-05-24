import Link from 'next/link';
import type { buildItemComparisonView } from '@/lib/verified-data';

type ItemComparisonView = ReturnType<typeof buildItemComparisonView>;
type MatrixItem = ItemComparisonView['items'][number];
type StorePrice = MatrixItem['storePrices'][number];

function normalizedUnitPrice(price: StorePrice) {
  if (typeof price.normalizedUnitPrice === 'number' && Number.isFinite(price.normalizedUnitPrice)) return price.normalizedUnitPrice;
  return null;
}

function bestUnitPricesByItem(items: MatrixItem[]) {
  return new Map(
    items.map((item) => {
      const values = item.storePrices
        .map(normalizedUnitPrice)
        .filter((value): value is number => value !== null)
        .sort((left, right) => left - right);

      return [item.slug, values[0] ?? null];
    })
  );
}

export function StorePriceMatrix({ items, sourceLabel }: Pick<ItemComparisonView, 'items' | 'sourceLabel'>) {
  const storeNames = [...new Set(items.flatMap((item) => item.storePrices.map((price) => price.storeName)))];
  const bestUnitPrices = bestUnitPricesByItem(items);

  if (items.length === 0 || storeNames.length === 0) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-sm" data-store-price-matrix>
      <div className="border-b border-cyan-100 bg-cyan-50 px-5 py-4">
        <h2 className="text-2xl font-black text-cyan-950">Store price matrix</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-cyan-900">
          Compare selected products side by side across stores. Each cell shows the package price plus the normalized per-unit price when package size evidence is available.
        </p>
        <p className="mt-2 text-xs font-bold text-cyan-800">Source: {sourceLabel}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left align-top">
          <caption className="sr-only">Store-by-product price matrix with normalized unit prices</caption>
          <thead>
            <tr className="bg-slate-950 text-white">
              <th className="w-44 px-4 py-3 text-sm font-black">Store</th>
              {items.map((item) => (
                <th className="min-w-56 px-4 py-3 align-top" key={item.slug}>
                  <Link className="font-black underline decoration-cyan-300 underline-offset-4" href={`/products/${item.slug}`}>
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs font-semibold text-cyan-100">{item.brand}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {storeNames.map((storeName) => (
              <tr className="border-t border-slate-100 align-top" key={storeName}>
                <th className="px-4 py-4 text-sm font-black capitalize text-slate-950">{storeName}</th>
                {items.map((item) => {
                  const price = item.storePrices.find((row) => row.storeName === storeName);
                  const unitPrice = price ? normalizedUnitPrice(price) : null;
                  const bestUnitPrice = bestUnitPrices.get(item.slug);
                  const isBest = unitPrice !== null && bestUnitPrice !== null && unitPrice === bestUnitPrice;

                  return (
                    <td className="px-4 py-4" key={`${storeName}-${item.slug}`}>
                      {price ? (
                        <div className={isBest ? 'rounded-2xl border border-emerald-200 bg-emerald-50 p-3' : 'rounded-2xl bg-slate-50 p-3'}>
                          <p className="text-lg font-black text-slate-950">{price.normalizedUnitPriceLabel}</p>
                          <p className="mt-1 text-xs font-bold text-slate-600">{price.priceLabel} package price</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{price.normalizationLabel}</p>
                          {isBest ? <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Best unit price</p> : null}
                        </div>
                      ) : (
                        <p className="rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-900">No price row for this store</p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
