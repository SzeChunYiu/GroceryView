import { PriceDropDigest, type PriceDropDigestGroup, type PriceDropDigestItem } from '@/components/price-drop-digest';
import { buildPriceDropDiscoveryRail, type PriceDropDiscoveryRailItem } from '@/lib/price-events';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { routeMetadata } from '@/lib/seo';
import { watchlistHeartProducts } from '@/lib/verified-data';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value * 100)}% drop`;
}

const digestDrops = buildPriceDropDiscoveryRail(pricedProducts.map((product) => ({
  slug: product.slug,
  name: product.name,
  brand: product.brands,
  category: categoryLabels[product.category] ?? product.category,
  observations: product.observations
})), 12);

const favoriteNameTokens = new Set(
  watchlistHeartProducts
    .flatMap((product) => product.productName.toLocaleLowerCase('sv-SE').split(/\s+/))
    .filter((token) => token.length >= 5)
);

function toDigestItem(item: PriceDropDiscoveryRailItem, matchReason: string): PriceDropDigestItem {
  return {
    productSlug: item.productSlug,
    productName: item.productName,
    brand: item.brand,
    category: item.category,
    currentPriceLabel: formatSek(item.latestPrice),
    previousPriceLabel: formatSek(item.previousWeekPrice),
    dropPercentLabel: formatPercent(item.dropPercent),
    savingsLabel: formatSek(item.dropAmount),
    evidenceLabel: item.evidenceLabel,
    matchReason
  };
}

function pickDrops(predicate: (item: PriceDropDiscoveryRailItem) => boolean, fallbackStart: number, reason: string) {
  const matches = digestDrops.filter(predicate).slice(0, 3);
  const source = matches.length > 0 ? matches : digestDrops.slice(fallbackStart, fallbackStart + 3);
  return source.map((item) => toDigestItem(item, matches.length > 0 ? reason : `${reason} No exact verified match was available, so this lane shows the next strongest verified drop.`));
}

const savedSearchDrops = pickDrops(
  (item) => /kaffe|mjölk|ost|frukt|grönt|pasta|ris/i.test(`${item.productName} ${item.category}`),
  0,
  'Matches saved search filters for staple categories and common grocery queries.'
);

const favoriteDrops = pickDrops(
  (item) => item.productName.toLocaleLowerCase('sv-SE').split(/\s+/).some((token) => favoriteNameTokens.has(token)),
  3,
  'Overlaps with account-bound favorites or close watchlist product names.'
);

const dietaryDrops = pickDrops(
  (item) => /vegan|vegansk|gluten|laktos|havre|soja|eko|ekologisk/i.test(`${item.productName} ${item.brand} ${item.category}`),
  6,
  'Matches explicit dietary or label preference terms; no diet claim is inferred without text evidence.'
);

const storeDrops = pickDrops(
  (item) => /stockholm|openprices|nearby/i.test(`${item.locality} ${item.evidenceLabel}`),
  9,
  'Prioritised for usual-store review using locality and source coverage signals.'
);

const digestGroups: PriceDropDigestGroup[] = [
  {
    id: 'saved-searches',
    title: 'Saved searches',
    description: 'Drops are grouped under the filters shoppers already saved, making recurring searches actionable without scanning every deal.',
    preferenceSignal: 'Saved filters',
    href: '/alerts',
    items: savedSearchDrops
  },
  {
    id: 'favorites',
    title: 'Favorites',
    description: 'Watchlist and favorite-product signals get their own lane so bookmarked staples are checked before broader discovery.',
    preferenceSignal: 'Account-bound hearts',
    href: '/favorites',
    items: favoriteDrops
  },
  {
    id: 'dietary',
    title: 'Dietary preferences',
    description: 'Dietary and label terms are matched from product text only, with unmatched rows kept visible as verified drops rather than inferred food-safety claims.',
    preferenceSignal: 'Explicit preferences',
    href: '/account',
    items: dietaryDrops
  },
  {
    id: 'usual-stores',
    title: 'Usual stores',
    description: 'A store-focused lane keeps nearby or routinely checked sources together for a quick pre-shop review.',
    preferenceSignal: 'Preferred sources',
    href: '/stores',
    items: storeDrops
  }
];

export function generateMetadata() {
  return routeMetadata({
    path: '/digest',
    title: 'Price-drop digest | GroceryView',
    description: 'Personalized price drops grouped by saved searches, favorites, dietary preferences, and usual stores.'
  });
}

export default function DigestPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Weekly digest</p>
      <div className="mt-3 max-w-3xl">
        <h1 className="text-4xl font-black tracking-tight">Personalized price-drop digest</h1>
        <p className="mt-3 text-lg leading-8 text-slate-700">
          A single digest page groups verified price drops by saved searches, account favorites, dietary preference terms, and usual-store review lanes so shoppers can start with the savings most relevant to them.
        </p>
      </div>
      <PriceDropDigest groups={digestGroups} generatedAtLabel="from the latest verified observation snapshot" />
    </main>
  );
}
