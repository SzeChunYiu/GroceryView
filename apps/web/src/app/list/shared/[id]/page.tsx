import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicSharePreviewCard } from '@/components/list-card';
import { readPublicListShare, type PublicListShareItem } from '@/lib/list-permissions';
import { metadataForShoppingListShare } from '@/lib/seo';
import { cheapestSourceForProductSlug } from '@/lib/shopping-list-prices';
import { createPublicListSharePreview } from '@/lib/social';

export const dynamic = 'force-dynamic';

type PublicListPageProps = {
  params: Promise<{ id: string }>;
};

function priceFromLabel(priceLabel: string) {
  const normalized = priceLabel.replace(/\s/g, '').replace(',', '.').match(/\d+(\.\d+)?/);
  return normalized ? Number(normalized[0]) : null;
}

function formatSek(value: number) {
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: 0 })} kr`;
}

function cheapestChain(items: PublicListShareItem[]) {
  const totals = new Map<string, { itemCount: number; total: number }>();

  for (const item of items) {
    const source = cheapestSourceForProductSlug(item.matchedProductSlug);
    const price = source ? priceFromLabel(source.priceLabel) : null;
    if (!source || price === null) continue;
    const current = totals.get(source.chainLabel) ?? { itemCount: 0, total: 0 };
    totals.set(source.chainLabel, { itemCount: current.itemCount + 1, total: current.total + price });
  }

  return [...totals.entries()].sort(([, left], [, right]) => right.itemCount - left.itemCount || left.total - right.total)[0];
}

export async function generateMetadata({ params }: PublicListPageProps): Promise<Metadata> {
  const { id } = await params;
  return metadataForShoppingListShare(id);
}

export default async function PublicSharedShoppingListPage({ params }: PublicListPageProps) {
  const { id } = await params;
  const share = readPublicListShare(id);
  if (!share) notFound();

  const preview = createPublicListSharePreview(share.items, { updatedAt: share.updatedAt });
  const cheapest = cheapestChain(share.items);

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2rem] border border-emerald-200 bg-white/95 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Public read-only list</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <h1 className="text-4xl font-black tracking-tight">Shared shopping list</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
                This share-safe card previews total estimate, cheapest chain, and last updated time before anyone copies the list into their own browser.
              </p>
            </div>
            <div className={share.isExpired ? 'rounded-2xl bg-rose-50 p-4 text-rose-950' : 'rounded-2xl bg-emerald-50 p-4 text-emerald-950'}>
              <p className="text-xs font-black uppercase tracking-[0.18em]">{share.isExpired ? 'Expired link' : 'Active link'}</p>
              <p className="mt-1 text-sm font-bold">Expires: {share.expiresAt ?? 'No expiry set'}</p>
            </div>
          </div>
          {!share.isExpired ? (
            <Link className="mt-5 inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" href={`/list?share=${encodeURIComponent(id)}`}>
              Copy to my list
            </Link>
          ) : (
            <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-950">This share link is expired, so copying is disabled.</p>
          )}
        </section>

        <PublicSharePreviewCard preview={preview} />

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h2 className="text-2xl font-black">Cheapest chain</h2>
          {cheapest ? (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-950">{cheapest[0]}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(cheapest[1].total)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{cheapest[1].itemCount} matched item{cheapest[1].itemCount === 1 ? '' : 's'}</p>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">No shared items have public price matches yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
