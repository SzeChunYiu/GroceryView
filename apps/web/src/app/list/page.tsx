import type { Metadata } from 'next';
import Link from 'next/link';
import { ListCard, type MealPlanListImportSummary } from '@/components/list-card';
import { ListSharePreview } from '@/components/list-share-preview';
import { createPublicListShareToken, publicListSharePath, type PublicListShareItem } from '@/lib/list-permissions';
import { parseMealPlanShoppingListExport, type MealPlanShoppingListExport } from '@/lib/meal-budgets';
import { generateRecurringListInstance, recurringListTemplates } from '@/lib/recurring-lists';
import { storeLayoutDepartments, storeLayoutDepartmentsForOrder, type StoreLayoutChain, type StoreLayoutGroupOrder } from '@/lib/trip-planner';
import { metadataForShoppingListShare } from '@/lib/seo';
import { OFFLINE_LIST_EDIT_RECONCILIATION_STEPS, offlineListSyncStatusCopy } from '@/lib/offline-sync';

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
  groupOrder?: string | string[];
  mealPlan?: string | string[];
  share?: string | string[];
};

const storeChains = Object.keys(storeLayoutDepartments) as StoreLayoutChain[];

function normalizeChain(chain: string | string[] | undefined): StoreLayoutChain {
  const requested = Array.isArray(chain) ? chain[0] : chain;
  return storeChains.find((value) => value === requested) ?? 'ica';
}

function normalizeGroupOrder(groupOrder: string | string[] | undefined): StoreLayoutGroupOrder {
  const requested = Array.isArray(groupOrder) ? groupOrder[0] : groupOrder;
  return requested === 'reverse-layout' ? 'reverse-layout' : 'store-layout';
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function mealPlanExportFromParam(value: string | string[] | undefined): MealPlanShoppingListExport | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? parseMealPlanShoppingListExport(raw) : null;
}

function mealPlanImportSummary(exportPayload: MealPlanShoppingListExport): MealPlanListImportSummary {
  return {
    chainTotals: exportPayload.chainTotals.map((chain) => ({
      chain: chain.chain,
      estimatedTotalLabel: formatSek(chain.estimatedTotal),
      itemCount: chain.itemCount
    })),
    estimatedTotalLabel: formatSek(exportPayload.estimatedTotal),
    itemCount: exportPayload.items.length,
    mealTitle: exportPayload.mealTitle
  };
}

export async function generateMetadata({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }): Promise<Metadata> {
  const resolvedSearchParams: ListPageSearchParams = searchParams ? await searchParams : {};
  return metadataForShoppingListShare(resolvedSearchParams.share);
}

export default async function ShoppingListPage({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }) {
  const resolvedSearchParams: ListPageSearchParams = searchParams ? await searchParams : {};
  const selectedChain = normalizeChain(resolvedSearchParams.chain);
  const groupOrder = normalizeGroupOrder(resolvedSearchParams.groupOrder);
  const shareToken = Array.isArray(resolvedSearchParams.share) ? resolvedSearchParams.share[0] : resolvedSearchParams.share;
  const mealPlanExport = mealPlanExportFromParam(resolvedSearchParams.mealPlan);
  const mealPlanItems = mealPlanExport?.items.map((item) => ({
    id: item.id,
    name: item.name,
    ownerRole: 'guardian' as const,
    quantity: item.quantity
  })) ?? [];
  const listItems = [...mealPlanItems, ...demoItems.filter((item) => !mealPlanItems.some((mealItem) => mealItem.id === item.id))];
  const publicShareToken = shareToken ?? createPublicListShareToken({
    expiresAt: '2026-06-30T23:59:59.000Z',
    items: publicDemoShareItems,
    listId: 'weekly-staples'
  });
  const publicShareHref = publicListSharePath(publicShareToken);
  const pendingOfflineCopy = offlineListSyncStatusCopy({ isOnline: false, pendingEdits: 2 });
  const syncedOfflineCopy = offlineListSyncStatusCopy({ isOnline: true, pendingEdits: 0, lastSyncedAt: 'after background sync' });
  const recurringTemplatePreviews = recurringListTemplates.map((template) => ({
    template,
    instance: generateRecurringListInstance(template, new Date('2026-05-25T00:00:00.000Z'))
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-labelledby="offline-sync-title">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Offline edit reconciliation</p>
        <h2 id="offline-sync-title" className="mt-1 text-xl font-bold text-slate-950">Pending edits stay visible until sync finishes</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-white px-3 py-2" role="status">
            <p className="text-sm font-black text-amber-900">{pendingOfflineCopy.label}</p>
            <p className="mt-1 text-sm text-amber-950">{pendingOfflineCopy.helper} {pendingOfflineCopy.detail}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2" role="status">
            <p className="text-sm font-black text-emerald-900">{syncedOfflineCopy.label}</p>
            <p className="mt-1 text-sm text-emerald-950">{syncedOfflineCopy.helper} {syncedOfflineCopy.detail}</p>
          </div>
        </div>
        <ul className="mt-3 space-y-2 text-sm font-semibold text-amber-950">
          {OFFLINE_LIST_EDIT_RECONCILIATION_STEPS.map((step) => (
            <li key={step} className="rounded-xl bg-white/70 px-3 py-2">{step}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4" aria-labelledby="recurring-list-templates-title">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Recurring list templates</p>
        <h2 id="recurring-list-templates-title" className="mt-1 text-xl font-bold text-slate-950">Generate weekly or biweekly list instances with one click</h2>
        <p className="mt-2 text-sm text-violet-950">
          Saved templates keep habitual shopping lists out of manual setup. The API route accepts a templateId and returns the next dated list instance.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {recurringTemplatePreviews.map(({ template, instance }) => (
            <div className="rounded-xl border border-violet-200 bg-white p-3" key={template.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-violet-950">{template.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{template.frequency} · next {instance.shoppingDate} · {instance.itemCount} items</p>
                </div>
                <form action="/api/list/templates" method="post">
                  <input name="templateId" type="hidden" value={template.id} />
                  <button className="rounded-full bg-violet-700 px-4 py-2 text-sm font-black text-white" type="submit">Generate</button>
                </form>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">
                {template.items.map((item) => `${item.name} (${item.quantity})`).join(' · ')}
              </p>
            </div>
          ))}
        </div>
      </section>
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
          <label className="text-sm font-semibold text-slate-700" htmlFor="list-chain">
            Store chain
            <select className="mt-1 block rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-950" defaultValue={selectedChain} id="list-chain" name="chain">
              {storeChains.map((chain) => <option key={chain} value={chain}>{chain.toUpperCase()}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700" htmlFor="list-group-order">
            Group order
            <select className="mt-1 block rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-950" defaultValue={groupOrder} id="list-group-order" name="groupOrder">
              <option value="store-layout">Entrance to checkout</option>
              <option value="reverse-layout">Checkout to entrance</option>
            </select>
          </label>
          <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white" type="submit">Apply layout</button>
        </form>
        <p className="mt-3 text-sm text-emerald-950">
          Approximate route: {storeLayoutDepartmentsForOrder(selectedChain, groupOrder).map((department) => department.label).join(' → ')}.
        </p>
      </section>
      <ListCard
        currentRole="guardian"
        groupOrder={groupOrder}
        items={listItems}
        mealPlanImport={mealPlanExport ? mealPlanImportSummary(mealPlanExport) : undefined}
        publicShareHref={publicShareHref}
        selectedChain={selectedChain}
      />
    </div>
  );
}
