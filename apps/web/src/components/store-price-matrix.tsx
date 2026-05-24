import Link from 'next/link';

export type StorePriceMatrixChain = {
  id: string;
  label: string;
};

type StorePriceMatrixCell = {
  chainId: string;
  priceText?: string;
  productName?: string | null;
  productSlug?: string | null;
  status: string;
  unitLabel?: string | null;
};

export type StorePriceMatrixProduct = {
  brand?: string | null;
  cells: ReadonlyArray<StorePriceMatrixCell>;
  packageLabel?: string | null;
  productName: string;
  productSlug: string;
};

type StorePriceMatrixProps = {
  chains: ReadonlyArray<StorePriceMatrixChain>;
  products: ReadonlyArray<StorePriceMatrixProduct>;
};

function formatStoreUnit(cell: StorePriceMatrixCell | undefined) {
  if (!cell || cell.status !== 'priced') {
    return 'Not available';
  }

  return cell.unitLabel || 'Unit not reported';
}

export function StorePriceMatrix({ chains, products }: StorePriceMatrixProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <div className="border-b border-emerald-100 bg-white px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Store price matrix</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">Selected products across stores</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Prices are shown side by side with the comparable unit label so shoppers can compare normalized store prices without opening each store detail page.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">Selected product prices across stores with comparable per-unit labels</caption>
          <thead className="bg-emerald-950 text-white">
            <tr>
              <th className="px-4 py-3 font-black">Product</th>
              {chains.map((chain) => (
                <th className="px-4 py-3 font-black" key={chain.id}>{chain.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr className="border-t border-slate-100 align-top" key={product.productSlug}>
                <th className="min-w-64 px-4 py-4 font-black text-slate-950">
                  <Link className="underline decoration-emerald-300 underline-offset-4" href={`/products/${product.productSlug}`}>{product.productName}</Link>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">{product.brand || 'Brand not reported'} · {product.packageLabel || 'Package not reported'}</span>
                </th>
                {chains.map((chain) => {
                  const cell = product.cells.find((item) => item.chainId === chain.id);
                  return (
                    <td className="min-w-48 px-4 py-4" key={`${product.productSlug}-${chain.id}`}>
                      <p className={cell?.status === 'priced' ? 'font-black text-emerald-900' : 'font-black text-slate-400'}>{cell?.priceText ?? 'Missing'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{formatStoreUnit(cell)}</p>
                      {cell?.productSlug ? (
                        <Link className="mt-2 block text-xs font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={`/products/${cell.productSlug}`}>
                          {cell.productName ?? cell.productSlug}
                        </Link>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
