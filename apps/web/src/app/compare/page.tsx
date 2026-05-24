import Link from 'next/link';

type StoreId = 'willys-odenplan' | 'lidl-sveavagen' | 'coop-odenplan';

type StoreMeta = {
  id: StoreId;
  name: string;
};

type ProductRow = {
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  prices: Record<StoreId, number>;
};

const STORES: StoreMeta[] = [
  { id: 'willys-odenplan', name: 'Willys Odenplan' },
  { id: 'lidl-sveavagen', name: 'Lidl Sveavägen' },
  { id: 'coop-odenplan', name: 'Coop Odenplan' }
];

const PRODUCT_ROWS: ProductRow[] = [
  {
    sku: 'coffee',
    name: 'Zoégas Coffee 450g',
    unit: '1 pack',
    quantity: 1,
    prices: {
      'willys-odenplan': 49.9,
      'lidl-sveavagen': 59.9,
      'coop-odenplan': 54.9
    }
  },
  {
    sku: 'milk',
    name: 'Arla Milk 1L',
    unit: '2 packs',
    quantity: 2,
    prices: {
      'willys-odenplan': 14.9,
      'lidl-sveavagen': 13.9,
      'coop-odenplan': 15.9
    }
  },
  {
    sku: 'eggs',
    name: 'Eggs 12-pack',
    unit: '1 pack',
    quantity: 1,
    prices: {
      'willys-odenplan': 36.9,
      'lidl-sveavagen': 34.9,
      'coop-odenplan': 39.9
    }
  }
];

type CompareSearchParams = {
  stores?: string | string[];
};

function parseSelectedStoreIds(raw?: CompareSearchParams['stores']): StoreId[] {
  if (!raw) return [];

  const parts = Array.isArray(raw) ? raw : raw.split(',');
  const requested = parts
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const parsed = requested
    .map((value) => value.toLowerCase())
    .filter((value): value is StoreId => STORES.some((store) => store.id === value));

  return [...new Set(parsed)];
}

function compareStoreTotals(stores: StoreMeta[]) {
  const totals = Object.fromEntries(stores.map((store) => [store.id, 0])) as Record<StoreId, number>;

  for (const product of PRODUCT_ROWS) {
    for (const store of stores) {
      totals[store.id] += product.prices[store.id] * product.quantity;
    }
  }

  return totals;
}

function formatPrice(value: number) {
  return `${value.toFixed(2)} SEK`;
}

export default function ComparePage({ searchParams }: { searchParams?: CompareSearchParams }) {
  const requestedStoreIds = parseSelectedStoreIds(searchParams?.stores);
  const selectedStores = STORES.filter((store) => requestedStoreIds.includes(store.id));
  const visibleStores = selectedStores.length === 0 ? STORES.slice(0, 2) : selectedStores;
  const storeTotals = compareStoreTotals(visibleStores);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black">Store comparison</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Compare selected stores side-by-side with prices from your local favorites.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-4">
        {STORES.map((store) => {
          const checked = visibleStores.some((item) => item.id === store.id);
          return (
            <label key={store.id} className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={checked} readOnly />
              {store.name}
            </label>
          );
        })}
      </div>

      <p className="mb-3 text-xs uppercase tracking-wide text-zinc-500">Showing {visibleStores.length} selected store(s)</p>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table aria-label="Store comparison table" className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Qty</th>
              {visibleStores.map((store) => (
                <th className="px-3 py-2" key={store.id}>
                  {store.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-zinc-900">
            {PRODUCT_ROWS.map((product) => (
              <tr className="border-t border-zinc-100" key={product.sku}>
                <td className="px-3 py-2">{product.name}</td>
                <td className="px-3 py-2 text-zinc-500">{product.unit}</td>
                {visibleStores.map((store) => (
                  <td className="px-3 py-2 font-semibold" key={`${product.sku}:${store.id}`}>
                    {formatPrice(product.prices[store.id] * product.quantity)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-50 font-bold">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2" aria-hidden="true" />
              {visibleStores.map((store) => (
                <td className="px-3 py-2" key={`${store.id}:total`}>
                  {formatPrice(storeTotals[store.id])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Adjusted from sample basket.{' '}
        <Link href="/stores" className="text-zinc-900 underline underline-offset-4">
          Open full store catalog
        </Link>
      </p>
    </main>
  );
}
