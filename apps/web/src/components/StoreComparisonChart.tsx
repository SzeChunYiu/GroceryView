export type StoreComparisonChartRow = {
  storeId: string;
  storeName: string;
  currentPrice: number;
  currentPriceLabel: string;
  unitLabel?: string;
};

type StoreComparisonChartProps = {
  productName: string;
  rows: StoreComparisonChartRow[];
};

export function StoreComparisonChart({ productName, rows }: Readonly<StoreComparisonChartProps>) {
  const pricedRows = rows
    .filter((row) => Number.isFinite(row.currentPrice) && row.currentPrice > 0)
    .sort((left, right) => left.currentPrice - right.currentPrice || left.storeName.localeCompare(right.storeName, 'sv-SE'));

  if (pricedRows.length < 2) return null;

  const cheapestPrice = pricedRows[0]!.currentPrice;
  const highestPrice = Math.max(...pricedRows.map((row) => row.currentPrice));

  return (
    <section aria-labelledby="store-comparison-chart-title" className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/90 p-5 shadow-sm" data-store-comparison-chart>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Multi-store price comparison</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950" id="store-comparison-chart-title">Current store prices</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Bar lengths compare verified current prices for {productName}. The cheapest available store row is highlighted in green.
          </p>
        </div>
        <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900">
          {pricedRows.length} stores
        </p>
      </div>
      <div className="mt-5 grid gap-3" role="list">
        {pricedRows.map((row) => {
          const isCheapest = row.currentPrice === cheapestPrice;
          const widthPercent = highestPrice > 0 ? Math.max((row.currentPrice / highestPrice) * 100, 8) : 8;
          const barClassName = isCheapest ? 'bg-emerald-700' : 'bg-slate-700';
          const priceClassName = isCheapest ? 'text-emerald-900' : 'text-slate-950';

          return (
            <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[minmax(9rem,14rem)_1fr_auto] md:items-center" key={row.storeId} role="listitem">
              <div>
                <p className="font-black text-slate-950">{row.storeName}</p>
                {row.unitLabel ? <p className="mt-1 text-xs font-bold text-slate-500">{row.unitLabel}</p> : null}
              </div>
              <div aria-hidden="true" className="h-4 overflow-hidden rounded-full bg-white shadow-inner">
                <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${widthPercent}%` }} />
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <p className={`text-lg font-black ${priceClassName}`}>{row.currentPriceLabel}</p>
                {isCheapest ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-950">Cheapest</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
