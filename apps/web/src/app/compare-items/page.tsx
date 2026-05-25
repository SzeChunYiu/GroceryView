import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { ItemComparisonTable } from '@/components/ItemComparisonTable';
import { buildItemComparisonView, MAX_ITEM_COMPARISON_ITEMS } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/compare-items');
}

type SearchParams = {
  items?: string | string[];
  coupon?: string | string[];
  coupons?: string | string[];
  delivery?: string | string[];
  'home-delivery'?: string | string[];
  homeDelivery?: string | string[];
  pickup?: string | string[];
};

function selectedItemsValue(items: string | string[] | undefined) {
  return Array.isArray(items) ? items.join(',') : items ?? '';
}

export default async function CompareItemsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const comparison = buildItemComparisonView(resolvedSearchParams);
  const sampleItems = comparison.items.map((item) => item.slug).slice(0, MAX_ITEM_COMPARISON_ITEMS).join(',');
  const selectedItems = selectedItemsValue(resolvedSearchParams.items) || sampleItems;

  return (
    <PageShell>
      <Eyebrow>Item comparison</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Compare grocery items side by side</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Select up to four items to compare nutrition, price across stores, and trend charts. Missing products stay visible as blockers instead of inferred name matches.
      </p>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Choose up to four items</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Paste comma-separated product slugs or EAN/product ids. The comparison caps at {MAX_ITEM_COMPARISON_ITEMS} items and uses verified Axfood/OpenPrices rows.
            </p>
          </div>
          <Link className="rounded-full bg-emerald-900 px-4 py-2 text-center text-sm font-black text-white" href={`/compare-items?items=${sampleItems}`}>
            Try sample comparison
          </Link>
        </div>
        <form action="/compare-items" className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]" method="get">
          <label className="text-sm font-black text-slate-950" htmlFor="compare-items-input">
            Item slugs or ids
            <input
              className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold text-slate-950"
              defaultValue={selectedItemsValue(resolvedSearchParams.items)}
              id="compare-items-input"
              name="items"
              placeholder="havredryck-choklad-7340083494406,havregryn-extra-fylliga-101758934-st"
            />
          </label>
          <fieldset className="grid gap-2 rounded-2xl border border-emerald-100 bg-white/70 p-3 text-sm font-bold text-slate-700 md:col-span-2">
            <legend className="px-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900">Fulfillment filters</legend>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2">
                <input defaultChecked={comparison.fulfillmentFilters.coupons} name="coupons" type="checkbox" value="1" />
                Coupons
              </label>
              <label className="flex items-center gap-2">
                <input defaultChecked={comparison.fulfillmentFilters.homeDelivery} name="homeDelivery" type="checkbox" value="1" />
                Home delivery
              </label>
              <label className="flex items-center gap-2">
                <input defaultChecked={comparison.fulfillmentFilters.pickup} name="pickup" type="checkbox" value="1" />
                Pickup
              </label>
            </div>
            <p className="text-xs font-semibold text-slate-500">{comparison.fulfillmentFilterSummary}</p>
          </fieldset>
          <button className="self-end rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white" type="submit">Compare items</button>
        </form>
      </Card>
      <Card className="mt-4 border-violet-200 bg-violet-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-800">Premium CSV export</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-violet-950">
              Export the selected comparison set's price-history evidence for spreadsheet research and monthly budget planning.
            </p>
          </div>
          <Link className="rounded-full bg-violet-800 px-4 py-2 text-sm font-black text-white" href={`/compare-items?items=${encodeURIComponent(selectedItems)}&export=price-history-csv`}>
            Export comparison CSV
          </Link>
        </div>
      </Card>
      <ItemComparisonTable {...comparison} />
    </PageShell>
  );
}
