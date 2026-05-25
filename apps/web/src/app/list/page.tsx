import type { Metadata } from 'next';
import Link from 'next/link';
import { ListCard } from '@/components/list-card';
import { ListSharePreview } from '@/components/list-share-preview';
import { publicListSharePath } from '@/lib/list-permissions';
import { storeLayoutDepartments, type StoreLayoutChain } from '@/lib/trip-planner';
import { metadataForShoppingListShare } from '@/lib/seo';

const demoItems = [
  { id: 'bananas', name: 'Bananas', quantity: '1 bunch', ownerRole: 'guardian' as const },
  { id: 'oat-milk', name: 'Oat milk', quantity: '2 cartons', ownerRole: 'partner' as const },
  { id: 'pasta-sauce', name: 'Pasta sauce', quantity: '1 jar', ownerRole: 'teen' as const },
  { id: 'sparkling-water', name: 'Sparkling water', quantity: '6-pack', ownerRole: 'guest' as const }
];

type ListPageSearchParams = {
  chain?: string | string[];
  share?: string | string[];
};

const storeChains = Object.keys(storeLayoutDepartments) as StoreLayoutChain[];

function normalizeChain(chain: string | string[] | undefined): StoreLayoutChain {
  const requested = Array.isArray(chain) ? chain[0] : chain;
  return storeChains.find((value) => value === requested) ?? 'ica';
}

export async function generateMetadata({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  return metadataForShoppingListShare(resolvedSearchParams.share);
}

export default async function ShoppingListPage({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const selectedChain = normalizeChain(resolvedSearchParams.chain);
  const shareToken = Array.isArray(resolvedSearchParams.share) ? resolvedSearchParams.share[0] : resolvedSearchParams.share;

  return (
    <div className="space-y-6">
      <ListSharePreview />
      {shareToken ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Public share page</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Open the read-only public list view</h2>
          <p className="mt-2 text-sm text-sky-950">
            This signed share can be reviewed on a public page with expiry status, cheapest-store summaries, and a copy-to-my-list action.
          </p>
          <Link className="mt-3 inline-flex rounded-full bg-sky-800 px-4 py-2 text-sm font-black text-white" href={publicListSharePath(shareToken)}>
            View public list page
          </Link>
        </section>
      ) : null}
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
          <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white" type="submit">Apply layout</button>
        </form>
        <p className="mt-3 text-sm text-emerald-950">
          Approximate route: {storeLayoutDepartments[selectedChain].map((department) => department.label).join(' → ')}.
        </p>
      </section>
      <ListCard currentRole="guardian" items={demoItems} selectedChain={selectedChain} />
    </div>
  );
}
