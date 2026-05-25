import type { Metadata } from 'next';
import Link from 'next/link';
import { ListCard } from '@/components/list-card';
import { ListSharePreview } from '@/components/list-share-preview';
import { createPublicListShareToken, publicListSharePath, type PublicListShareItem } from '@/lib/list-permissions';
import { parseMealPlanShoppingListExport } from '@/lib/meal-budgets';
import { storeLayoutDepartments, type StoreLayoutChain } from '@/lib/trip-planner';
import { metadataForShoppingListShare } from '@/lib/seo';

const demoItems = [
  { id: 'bananas', name: 'Bananas', quantity: '1 bunch', ownerRole: 'guardian' as const },
  { id: 'oat-milk', name: 'Oat milk', quantity: '2 cartons', ownerRole: 'partner' as const, matchedProductSlug: 'havregryn-extra-fylliga-101758934-st' },
  { id: 'pasta-sauce', name: 'Pasta sauce', quantity: '1 jar', ownerRole: 'teen' as const, matchedProductSlug: 'makaroner-pasta-101302991-st' },
  { id: 'sparkling-water', name: 'Sparkling water', quantity: '6-pack', ownerRole: 'guest' as const }
];

const publicDemoShareItems: PublicListShareItem[] = demoItems.map((item) => ({
  detail: `${item.ownerRole} item shared from the family grocery list`,
  id: item.id,
  importSource: 'item-detail',
  matchedProductName: item.name,
  matchedProductSlug: 'matchedProductSlug' in item ? item.matchedProductSlug : undefined,
  name: item.name,
  quantity: item.quantity
}));

type ListPageSearchParams = {
  chain?: string | string[];
  mealPlan?: string | string[];
  share?: string | string[];
};

const storeChains = Object.keys(storeLayoutDepartments) as StoreLayoutChain[];

function normalizeChain(chain: string | string[] | undefined): StoreLayoutChain {
  const requested = Array.isArray(chain) ? chain[0] : chain;
  return storeChains.find((value) => value === requested) ?? 'ica';
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  return metadataForShoppingListShare(resolvedSearchParams.share);
}

export default async function ShoppingListPage({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const selectedChain = normalizeChain(resolvedSearchParams.chain);
  const shareToken = firstParam(resolvedSearchParams.share);
  const mealPlanParam = firstParam(resolvedSearchParams.mealPlan);
  const mealPlanExport = mealPlanParam ? parseMealPlanShoppingListExport(mealPlanParam) : null;
  const mealPlanTotal = mealPlanExport?.items.reduce((sum, item) => sum + item.estimatedPrice, 0) ?? 0;
  const mealPlanListItems = mealPlanExport?.items.map((item) => ({
    id: item.id,
    name: item.name,
    ownerRole: 'guardian' as const,
    quantity: `${item.quantity} · ${item.estimatedPriceLabel}`
  })) ?? [];
  const publicShareToken = shareToken ?? createPublicListShareToken({
    expiresAt: '2026-06-30T23:59:59.000Z',
    items: publicDemoShareItems,
    listId: 'weekly-staples'
  });
  const publicShareHref = publicListSharePath(publicShareToken);
  const visibleItems = mealPlanExport ? [...mealPlanListItems, ...demoItems] : demoItems;

  return (
    <div className="space-y-6">
      <ListSharePreview />
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Public share page</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">Open the read-only public list view</h2>
        <p className="mt-2 text-sm text-sky-950">
            This signed share can be reviewed on a public page with expiry status, cheapest-store summaries, and a copy-to-my-list action.
          </p>
        <Link className="mt-3 inline-flex rounded-full bg-sky-800 px-4 py-2 text-sm font-black text-white" href={publicShareHref}>
            View public list page
        </Link>
      </section>
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Smart store order</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">Reorder this list by chain layout</h2>
        <form action="/list" className="mt-3 flex flex-wrap items-end gap-3" method="get">
          {mealPlanParam ? <input name="mealPlan" type="hidden" value={mealPlanParam} /> : null}
          <label className="text-sm font-semibold text-slate-700" htmlFor="list-chain">
            Store chain
            <select className="mt-1 block rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-950" defaultValue={selectedChain} id="list-chain" name="chain">
              {storeChains.map((chain) => <option key={chain} value={chain}>{chain.toUpperCase()}</option>)}
            </select>
          </label>
          <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white" type="submit">Apply layout</button>
        </form>
        <p className="mt-3 text-sm text-emerald-950">
          Approximate route: {storeLayoutDepartments[selectedChain].map((department) => department.label).join(' → ')}.
        </p>
      </section>
      {mealPlanExport ? (
        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm" data-meal-plan-grocery-list>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Meal plan import</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{mealPlanExport.mealTitle}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Added {mealPlanExport.items.length} grouped grocery list entr{mealPlanExport.items.length === 1 ? 'y' : 'ies'} from the selected meal plan with estimated spend of {mealPlanTotal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 })}.
          </p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {mealPlanExport.items.map((item) => (
              <li className="rounded-xl border border-emerald-100 bg-emerald-50 p-3" key={item.id}>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">{item.category}</p>
                <p className="mt-1 font-black text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{item.quantity} · {item.estimatedPriceLabel}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ListCard currentRole="guardian" items={visibleItems} publicShareHref={publicShareHref} selectedChain={selectedChain} />
    </div>
  );
}
