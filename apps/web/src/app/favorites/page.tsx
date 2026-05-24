import Image from 'next/image';
import Link from 'next/link';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatSek, watchlistHeartProducts } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

type SearchParams = {
  sort?: string | string[];
};

type SortMode = 'name' | 'price';

const productNameCollator = new Intl.Collator('sv-SE', { sensitivity: 'base' });

const favoriteItems = watchlistHeartProducts.map((product) => ({
  ...product,
  favoriteId: product.sourceProductSlug,
  cheapestPrice: product.currentPrice,
  cheapestPriceLabel: formatSek(product.currentPrice),
  cheapestStoreName: product.bestStoreLabel,
  productHref: `/products/${product.sourceProductSlug}`
}));

export function generateMetadata() {
  return routeMetadata('/favorites');
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSort(value: string | string[] | undefined): SortMode {
  return firstValue(value) === 'price' ? 'price' : 'name';
}

function sortFavorites(items: typeof favoriteItems, sort: SortMode) {
  return [...items].sort((left, right) => {
    if (sort === 'price') {
      return left.cheapestPrice - right.cheapestPrice
        || productNameCollator.compare(left.productName, right.productName);
    }
    return productNameCollator.compare(left.productName, right.productName)
      || left.cheapestPrice - right.cheapestPrice;
  });
}

function sortLinkClass(isActive: boolean) {
  return isActive
    ? 'rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white shadow-sm'
    : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900';
}

export default async function FavoritesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const sort = normalizeSort(resolvedSearchParams.sort);
  const sortedFavoriteItems = sortFavorites(favoriteItems, sort);
  const lowestFavorite = sortedFavoriteItems[0];

  return (
    <PageShell>
      <Eyebrow>Favorites</Eyebrow>
      <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Signed-in favorite grocery items</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            This private-style page mirrors account-bound watchlist hearts and lists each bookmarked item with its current cheapest price and store.
            No anonymous favorites are read from localStorage, cookies, or sample people.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Bookmarked items</p>
          <p className="mt-1 text-4xl font-black text-slate-950">{sortedFavoriteItems.length}</p>
          <p className="text-sm font-semibold text-slate-600">account-bound products</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Sort controls</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className={sortLinkClass(sort === 'name')} href="/favorites?sort=name">Sort by name</Link>
            <Link className={sortLinkClass(sort === 'price')} href="/favorites?sort=price">Sort by price</Link>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Current cheapest price</p>
          <p className="mt-2 text-2xl font-black text-emerald-800">{lowestFavorite?.cheapestPriceLabel ?? 'No prices'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{lowestFavorite?.productName ?? 'No favorite rows yet'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Privacy guardrail</p>
          <p className="mt-2 text-xl font-black text-slate-950">No anonymous favorites</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">signed-in account id is the persistence boundary.</p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Favorite items</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Rows are derived from watchlistHeartProducts until production auth can hydrate the same /users/{'{'}userId{'}'}/favorites API. Missing prices would remain empty instead of being estimated.
            </p>
          </div>
          <ConfidenceBadge level="medium" label="signed-in favorites contract" sampleSize={sortedFavoriteItems.length} />
        </div>

        {sortedFavoriteItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <caption className="sr-only">Favorite grocery items sorted by {sort} with their current cheapest price and store</caption>
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3 font-black">Item</th>
                  <th className="px-4 py-3 font-black">Current cheapest price</th>
                  <th className="px-4 py-3 font-black">Cheapest store</th>
                  <th className="px-4 py-3 font-black">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {sortedFavoriteItems.map((product) => (
                  <tr className="border-t border-slate-100 align-top" key={product.favoriteId}>
                    <th className="px-4 py-4">
                      <Link className="flex min-w-72 items-start gap-3 hover:text-emerald-900" href={product.productHref}>
                        {product.imageUrl ? (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-slate-200">
                            <Image alt={`${product.productName} favorite product image`} className="max-h-full max-w-full object-contain" height={64} sizes="64px" src={product.imageUrl} width={64} />
                          </span>
                        ) : null}
                        <span>
                          <span className="block text-base font-black text-slate-950">{product.productName}</span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">{product.brand} · {product.categoryLabel}</span>
                          <span className="mt-2 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-800">account-bound heart</span>
                        </span>
                      </Link>
                    </th>
                    <td className="px-4 py-4">
                      <p className="text-xl font-black text-emerald-800">{product.cheapestPriceLabel}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{product.unitPriceLabel} · {product.priceTypeLabel}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">{product.cheapestStoreName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">cheapestStoreName from verified chain rows</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-700">{product.sourceLabel}</p>
                      <p className="mt-2 rounded-2xl bg-emerald-50 p-3 text-xs font-black leading-5 text-emerald-950">{product.authRequirement}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">
            No signed-in favorites are available in the current verified snapshot.
          </p>
        )}
      </Card>
    </PageShell>
  );
}
