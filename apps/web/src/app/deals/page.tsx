import Link from 'next/link';
import { DealCard } from '@/components/deal-card';
import { buildPantryReplacementFilter, pantryReplacementMatches } from '@/lib/pantry';
import { routeMetadata } from '@/lib/seo';
import { formatPct, labelFromSlug, priceDropMoversBoard, snapshot, topChainSpreads } from '@/lib/verified-data';

type SearchParams = Record<string, string | string[] | undefined>;

type ReplacementDeal = {
  categoryLabel: string;
  categorySlug: string;
  currentPrice: number;
  dealId: string;
  imageUrl?: string | null;
  originalPrice?: number;
  productName: string;
  productSlug: string;
  sourceLabel: string;
};

export function generateMetadata() {
  return routeMetadata('/deals');
}

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function slugFromLabel(label: string) {
  return label.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const spreadDeals: ReplacementDeal[] = topChainSpreads.map((product) => ({
  categoryLabel: labelFromSlug(product.category),
  categorySlug: product.category,
  currentPrice: product.lowestPrice,
  dealId: `spread-${product.slug}`,
  imageUrl: product.image,
  originalPrice: product.highestPrice > product.lowestPrice ? product.highestPrice : undefined,
  productName: product.name,
  productSlug: product.slug,
  sourceLabel: `${product.lowestChain} lowest · ${formatPct(product.spreadPct)} spread across ${product.inChains.length} chains`
}));

const priceDropDeals: ReplacementDeal[] = priceDropMoversBoard.map((mover) => ({
  categoryLabel: mover.categoryLabel,
  categorySlug: slugFromLabel(mover.categoryLabel),
  currentPrice: mover.latestPrice,
  dealId: `drop-${mover.productSlug}`,
  imageUrl: mover.imageUrl,
  originalPrice: mover.previousPrice > mover.latestPrice ? mover.previousPrice : undefined,
  productName: mover.productName,
  productSlug: mover.productSlug,
  sourceLabel: `${formatPct(Math.abs(mover.changePercent))} latest drop · ${mover.legalCopy}`
}));

const replacementDeals = [...spreadDeals, ...priceDropDeals].filter((deal, index, deals) => (
  deals.findIndex((candidate) => candidate.productSlug === deal.productSlug) === index
));

export default async function DealsPage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const params = (await searchParams) ?? {};
  const replacementFilter = buildPantryReplacementFilter(paramValue(params.replace));
  const visibleDeals = (replacementFilter
    ? replacementDeals.filter((deal) => pantryReplacementMatches(replacementFilter, deal))
    : replacementDeals
  ).slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Deal radar</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_0.34fr] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">
            {replacementFilter ? `Replacement deals for ${replacementFilter.label}` : 'Verified grocery deals'}
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            {replacementFilter
              ? 'Expiry and low-stock pantry links now narrow this surface to replacement matches from observed deal rows.'
              : 'Browse observed cross-chain spreads and recent price drops without synthetic discounts.'}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-900">Snapshot</p>
          <p className="mt-2 text-2xl font-black">{snapshot.retrievedLabel}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{snapshot.axfoodSource}</p>
        </div>
      </div>

      {replacementFilter ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="text-sm font-black text-amber-950">Filtered by pantry replacement</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-900">{replacementFilter.label}</span>
          <Link className="text-sm font-black text-emerald-900 underline decoration-emerald-300 underline-offset-4" href="/deals">Show all deals</Link>
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {visibleDeals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:col-span-2">
            <h2 className="text-xl font-black">No replacement deals matched this pantry item</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Try all deals while the next source refresh collects more observed prices for this product or category.
            </p>
            <Link className="mt-4 inline-flex rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white" href="/deals">View all deals</Link>
          </div>
        ) : visibleDeals.map((deal) => (
          <DealCard
            categoryLabel={deal.categoryLabel}
            currentPrice={deal.currentPrice}
            dealId={deal.dealId}
            imageAlt={`${deal.productName} deal image`}
            imageUrl={deal.imageUrl}
            key={deal.dealId}
            originalPrice={deal.originalPrice}
            replacementLabel={replacementFilter ? `Replacement for ${replacementFilter.label}` : undefined}
            sharePath={`/products/${deal.productSlug}`}
            sourceLabel={deal.sourceLabel}
            title={deal.productName}
          />
        ))}
      </section>
    </main>
  );
}
