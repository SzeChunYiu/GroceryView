export type StoreComparisonChartRow = {
  storeName: string;
  price: number;
  priceLabel: string;
  evidenceLabel: string;
  isAvailable?: boolean;
};

export type StoreComparisonChartProps = {
  productName: string;
  rows: StoreComparisonChartRow[];
  sourceLabel: string;
};

export function StoreComparisonChart({ productName, rows, sourceLabel }: StoreComparisonChartProps) {
  const availableRows = rows.filter((row) => row.isAvailable !== false && Number.isFinite(row.price));
  const cheapestPrice = availableRows.length > 0 ? Math.min(...availableRows.map((row) => row.price)) : null;
  const highestPrice = availableRows.length > 0 ? Math.max(...availableRows.map((row) => row.price)) : null;

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8" aria-labelledby="store-comparison-heading">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">store comparison</p>
            <h2 id="store-comparison-heading" className="mt-2 text-2xl font-black text-slate-950">Current price across stores</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              {sourceLabel} for {productName}. The cheapest available bar is highlighted in green.
            </p>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">{availableRows.length} verified price rows</p>
        </div>

        {availableRows.length > 0 && highestPrice !== null ? (
          <div className="mt-5 grid gap-3">
            {rows.map((row) => {
              const unavailable = row.isAvailable === false || !Number.isFinite(row.price);
              const isCheapest = !unavailable && cheapestPrice !== null && row.price === cheapestPrice;
              const width = unavailable || highestPrice <= 0 ? 0 : Math.max(6, (row.price / highestPrice) * 100);

              return (
                <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-[10rem_1fr_7rem] md:items-center" key={row.storeName}>
                  <div>
                    <p className="text-sm font-black text-slate-950">{row.storeName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.evidenceLabel}</p>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner" aria-hidden="true">
                    <div
                      className={`h-full rounded-full ${isCheapest ? 'bg-emerald-600' : unavailable ? 'bg-slate-300' : 'bg-sky-600'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <p className={`text-sm font-black md:text-right ${isCheapest ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {unavailable ? 'Unavailable' : row.priceLabel}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">
            No store-specific current price rows are available for this item, so GroceryView does not invent a store comparison chart.
          </p>
        )}
      </div>
    </section>
  );
}
