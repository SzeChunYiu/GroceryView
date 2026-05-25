import { buildLocalPriceDropFeed, type PriceDropDiscoveryProduct, type PriceDropDiscoveryRailItem } from '@/lib/price-events';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { defaultHouseholdId, dietaryPreferenceOnboardingContract, householdCategorySignals, scoreBrandTolerance } from '@/lib/personalization';
import { watchlistAlertBoard, volatilityForProduct } from '@/lib/watchlist-data';
import { homepageAdaptiveProductCards } from '@/lib/verified-data';

export type RecommendedDealSignal = 'favorite' | 'watchlist' | 'household' | 'local_price_drop';

export type RecommendedDealCard = {
  rank: number;
  productSlug: string;
  productName: string;
  brand: string;
  category: string;
  priceLabel: string;
  score: number;
  savingsLabel: string;
  reason: string;
  evidenceLabel: string;
  signalBadges: RecommendedDealSignal[];
  href: string;
};

const defaultFavoriteBrands = ['Garant', 'Änglamark', 'ICA Basic'];
const watchedProductIds = new Set(watchlistAlertBoard.inputs.watchlist.map((item) => item.productId));
const localPriceDrops = buildLocalPriceDropFeed(pricedProducts.map(priceDropProductFromOpenPrices), 10, 'Stockholm area');
const localPriceDropsBySlug = new Map(localPriceDrops.map((item) => [item.productSlug, item]));

function priceDropProductFromOpenPrices(product: (typeof pricedProducts)[number]): PriceDropDiscoveryProduct {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brands,
    category: categoryLabels[product.category] ?? product.category,
    quantity: product.quantity,
    observations: product.observations
  };
}

function householdCategoryNeedles() {
  return householdCategorySignals
    .filter((signal) => signal.householdId === defaultHouseholdId)
    .sort((left, right) => right.conversions - left.conversions || right.clicks - left.clicks)
    .map((signal) => signal.categorySlug.toLocaleLowerCase('sv-SE'));
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value)}%`;
}

function recommendationReason(signals: RecommendedDealSignal[], priceDrop: PriceDropDiscoveryRailItem | undefined, brand: string) {
  if (signals.includes('watchlist') && priceDrop) return `Watchlist item now has a local ${formatPercent(priceDrop.dropPercent * 100)} drop.`;
  if (signals.includes('favorite') && priceDrop) return `${brand} favorite with a verified nearby price drop.`;
  if (signals.includes('household') && priceDrop) return 'Household category demand lines up with a local price drop.';
  if (signals.includes('watchlist')) return 'Watchlist target is close enough to surface before search.';
  if (signals.includes('favorite')) return `${brand} is marked as a preferred household brand.`;
  return 'Household settings keep this deal in the personalized feed.';
}

export function buildRecommendedDealsFeed(options: {
  favoriteBrands?: readonly string[];
  limit?: number;
} = {}): RecommendedDealCard[] {
  const favoriteBrands = new Set((options.favoriteBrands ?? defaultFavoriteBrands).map((brand) => brand.toLocaleLowerCase('sv-SE')));
  const householdNeedles = householdCategoryNeedles();
  const limit = options.limit ?? 4;

  return homepageAdaptiveProductCards
    .map((product, index) => {
      const normalizedBrand = product.brand.toLocaleLowerCase('sv-SE');
      const normalizedText = `${product.slug} ${product.name} ${product.brand}`.toLocaleLowerCase('sv-SE');
      const priceDrop = localPriceDropsBySlug.get(product.slug);
      const brandScore = scoreBrandTolerance(product.brand).score;
      const isFavorite = favoriteBrands.has(normalizedBrand) || brandScore >= 20;
      const isWatched = watchedProductIds.has(product.slug);
      const householdHit = householdNeedles.some((needle) => normalizedText.includes(needle));
      const signals: RecommendedDealSignal[] = [
        ...(isFavorite ? ['favorite' as const] : []),
        ...(isWatched ? ['watchlist' as const] : []),
        ...(householdHit ? ['household' as const] : []),
        ...(priceDrop ? ['local_price_drop' as const] : [])
      ];
      const volatility = volatilityForProduct(product.slug);
      const score = (
        (isFavorite ? 34 : 0)
        + (isWatched ? 38 : 0)
        + (householdHit ? 24 : 0)
        + (priceDrop ? 44 + priceDrop.dropPercent * 100 : 0)
        + (volatility?.score ?? 0) / 4
        + Math.max(0, 8 - index)
      );

      return {
        product,
        priceDrop,
        signals,
        score
      };
    })
    .filter((entry) => entry.signals.length > 0)
    .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name, 'sv'))
    .slice(0, Math.max(1, Math.min(limit, 8)))
    .map((entry, index) => ({
      rank: index + 1,
      productSlug: entry.product.slug,
      productName: entry.product.name,
      brand: entry.product.brand || 'Brand not reported',
      category: entry.product.productKind === 'commodity' ? 'Fresh staple' : 'Grocery deal',
      priceLabel: entry.priceDrop ? formatPercent(entry.priceDrop.dropPercent * 100) : entry.product.totalPriceLabel,
      score: Math.round(entry.score),
      savingsLabel: entry.priceDrop
        ? `Save ${entry.priceDrop.dropAmount.toFixed(2)} kr in ${entry.priceDrop.locality}`
        : entry.product.priceDropLabel ?? entry.product.cheapestUnitBadge ?? 'Personalized price watch',
      reason: recommendationReason(entry.signals, entry.priceDrop, entry.product.brand),
      evidenceLabel: [
        `Signals: ${entry.signals.join(', ')}`,
        entry.priceDrop?.evidenceLabel ?? entry.product.sourceLabel,
        `Household settings: ${dietaryPreferenceOnboardingContract.personalizationSurfaces.join(', ')}`
      ].join(' · '),
      signalBadges: entry.signals,
      href: `/products/${entry.product.slug}`
    }));
}

export const recommendedDealsFeed = buildRecommendedDealsFeed();
