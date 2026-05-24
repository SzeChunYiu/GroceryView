export type StorePriceDrawerStore = {
  chainId: string;
  latestTimestamp: string | null;
  priceText: string;
  productName: string | null;
  productSlug: string | null;
  status: string;
  unitLabel: string;
};

export type StorePriceDrawerRow = {
  bestChainName: string;
  bestPriceText: string;
  latestTimestamp: string | null;
  matchLabel: string;
  packageLabel: string;
  productName: string;
  productSlug: string;
  stores: StorePriceDrawerStore[];
};

type StorePriceDrawerProps = {
  rows: StorePriceDrawerRow[];
  updatedAt: string | null;
};

function formatTimestamp(value: string | null) {
  return value ? value : 'No timestamp reported';
}

export function StorePriceDrawer({ rows, updatedAt }: StorePriceDrawerProps) {
  return (
    <details className="mt-5 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none bg-emerald-900 px-5 py-4 text-sm font-black text-white marker:hidden">
        Open side-by-side store price drawer
      </summary>
      <div className="grid gap-4 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Normalized unit price comparison</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Same item across stores</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Each drawer row keeps the requested product together, compares the store prices side by side, and repeats the latest snapshot timestamp available from the compare data.
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500">Latest compare timestamp: {formatTimestamp(updatedAt)}</p>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Add products to the query string to populate store drawer rows.</p>
        ) : (
          <div className="grid gap-3">
            {rows.map((row) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={row.productSlug}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-black text-slate-950">{row.productName}</h4>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.packageLabel} · {row.matchLabel}</p>
                  </div>
                  <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">
                    Best: {row.bestChainName} · {row.bestPriceText}
                  </p>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-xs">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-black">Store</th>
                        <th className="px-3 py-2 font-black">Price</th>
                        <th className="px-3 py-2 font-black">Normalized unit price</th>
                        <th className="px-3 py-2 font-black">Latest timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.stores.map((store) => (
                        <tr className="border-t border-white align-top" key={`${row.productSlug}-${store.chainId}`}>
                          <td className="px-3 py-2 font-black uppercase text-slate-950">{store.chainId}</td>
                          <td className={store.status === 'priced' ? 'px-3 py-2 font-black text-emerald-900' : 'px-3 py-2 font-black text-slate-400'}>{store.priceText}</td>
                          <td className="px-3 py-2 font-semibold text-slate-700">{store.unitLabel}</td>
                          <td className="px-3 py-2 font-semibold text-slate-500">{formatTimestamp(store.latestTimestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
