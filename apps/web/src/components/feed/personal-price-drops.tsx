import Link from 'next/link';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow } from '@/components/data-ui';
import { buildPersonalizedPriceDropFeed, defaultHouseholdId } from '@/lib/personalization';
import { formatSek, priceDropMoversBoard } from '@/lib/verified-data';
import { watchlistAlertBoard } from '@/lib/watchlist-data';

const demoFavoriteProductSlugs = [
  'kaffe',
  'havregryn-extra-fylliga-101758934-st',
  'svensk-honung-101550069-st'
];

export function PersonalPriceDrops() {
  const personalizedDrops = buildPersonalizedPriceDropFeed(priceDropMoversBoard, {
    favoriteProductSlugs: demoFavoriteProductSlugs,
    watchlistProductSlugs: watchlistAlertBoard.inputs.watchlist.map((item) => item.productId),
    householdId: defaultHouseholdId,
    limit: 4
  });

  if (personalizedDrops.length === 0) return null;

  return (
    <Card className="mt-6 border-emerald-200 bg-emerald-50" data-personal-price-drops>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Eyebrow>Personalized price-drop feed</Eyebrow>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Relevant savings from favorites, watchlist, and household categories</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-emerald-950">
            Current price drops are ranked against demo favorite products, watchlist items, and household category history. Every card still links to a verified product page and uses observed price-change evidence only.
          </p>
        </div>
        <ConfidenceBadge level="high" label={`${personalizedDrops.length} ranked drops`} sampleSize={priceDropMoversBoard.length} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {personalizedDrops.map((drop) => (
          <Link
            className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm hover:border-emerald-700"
            data-personal-price-drop-card={drop.productSlug}
            href={drop.href}
            key={drop.productSlug}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Personal score {drop.personalizationScore}</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">{drop.productName}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-700">{drop.categoryLabel} · {drop.savingsLabel}</p>
            <p className="mt-2 text-sm font-black text-emerald-900">
              {formatSek(drop.previousPrice)} to {formatSek(drop.latestPrice)}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {drop.observedCount} observed points · latest {drop.latestObservedAt}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {drop.relevanceReasons.map((reason) => (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950" key={reason}>{reason}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
