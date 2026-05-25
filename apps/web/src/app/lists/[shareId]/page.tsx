import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readPublicListShare, type PublicListShareItem } from '@/lib/list-permissions';
import { metadataForShoppingListShare } from '@/lib/seo';
import { cheapestSourceForProductSlug } from '@/lib/shopping-list-prices';

export const dynamic = 'force-dynamic';

type PublicListPageProps = {
  params: Promise<{ shareId: string }>;
};

type StoreSummary = {
  chainLabel: string;
  itemCount: number;
  total: number;
};

function priceFromLabel(priceLabel: string) {
  const normalized = priceLabel.replace(/\s/g, '').replace(',', '.').match(/\d+(\.\d+)?/);
  return normalized ? Number(normalized[0]) : null;
}

function formatSek(value: number) {
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: 0 })} kr`;
}

function cheapestStoreSummaries(items: PublicListShareItem[]) {
  const summaries = new Map<string, StoreSummary>();

  for (const item of items) {
    const source = cheapestSourceForProductSlug(item.matchedProductSlug);
    if (!source) continue;
    const price = priceFromLabel(source.priceLabel);
    const existing = summaries.get(source.chainLabel) ?? { chainLabel: source.chainLabel, itemCount: 0, total: 0 };
    summaries.set(source.chainLabel, {
      ...existing,
      itemCount: existing.itemCount + 1,
      total: existing.total + (price ?? 0)
    });
  }

  return [...summaries.values()].sort((left, right) => right.itemCount - left.itemCount || left.total - right.total);
}

export async function generateMetadata({ params }: PublicListPageProps): Promise<Metadata> {
  const { shareId } = await params;
  return metadataForShoppingListShare(shareId);
}

export default async function PublicShoppingListPage({ params }: PublicListPageProps) {
  const { shareId } = await params;
  const share = readPublicListShare(shareId);
  if (!share) notFound();

  const summaries = cheapestStoreSummaries(share.items);

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2rem] border border-emerald-200 bg-white/95 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Public read-only list</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <h1 className="text-4xl font-black tracking-tight">Shared shopping list</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
                This page shows a read-only snapshot of {share.items.length} shared grocery item{share.items.length === 1 ? '' : 's'}. Viewers can copy the list into their own browser list, but cannot edit the sender&apos;s household data.
              </p>
            </div>
            <div className={share.isExpired ? 'rounded-2xl bg-rose-50 p-4 text-rose-950' : 'rounded-2xl bg-emerald-50 p-4 text-emerald-950'}>
              <p className="text-xs font-black uppercase tracking-[0.18em]">{share.isExpired ? 'Expired link' : 'Active link'}</p>
              <p className="mt-1 text-sm font-bold">Expires: {share.expiresAt ?? 'No expiry set'}</p>
            </div>
          </div>
          {!share.isExpired ? (
            <Link className="mt-5 inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" href={`/list?share=${encodeURIComponent(shareId)}`}>
              Copy to my list
            </Link>
          ) : (
            <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-950">This share link is expired, so copying is disabled.</p>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h2 className="text-2xl font-black">Cheapest-store summary</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Summaries use public product matches only; unmatched private or manual rows stay visible without fabricated prices.</p>
          {summaries.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {summaries.map((summary) => (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4" key={summary.chainLabel}>
                  <p className="text-sm font-black text-emerald-950">{summary.chainLabel}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(summary.total)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{summary.itemCount} matched item{summary.itemCount === 1 ? '' : 's'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">No shared items have public price matches yet.</p>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h2 className="text-2xl font-black">Items</h2>
          <ul className="mt-4 divide-y divide-slate-200">
            {share.items.map((item) => {
              const source = cheapestSourceForProductSlug(item.matchedProductSlug);
              return (
                <li className="py-4" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{item.quantity} · {item.detail}</p>
                    </div>
                    {source ? <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-900">{source.chainLabel} {source.priceLabel}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
