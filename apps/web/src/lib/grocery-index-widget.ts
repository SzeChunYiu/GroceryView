import { siteUrl } from '@/lib/seo';
import { categoryLabels, pricedProducts, type PricedProduct } from '@/lib/openprices-products';
import { householdCategoryExposureWeights } from '@/lib/chain-index-data';
import { buildCategoryInflationTrends } from '@/lib/trends';

export type GroceryIndexTickerWidget = {
  route: '/widgets/grocery-index-ticker';
  title: string;
  sourceConfidence: Record<'high' | 'medium' | 'low', number>;
  embedCode: string;
};

export function buildGroceryIndexTickerWidget(sourceConfidence: Record<'high' | 'medium' | 'low', number>): GroceryIndexTickerWidget {
  return {
    route: '/widgets/grocery-index-ticker',
    title: 'Embeddable Grocery Index ticker',
    sourceConfidence,
    embedCode: `<iframe src="${siteUrl}/widgets/grocery-index-ticker" title="Grocery Index ticker" loading="lazy" width="100%" height="320"></iframe>`
  };
}

export const groceryIndexTickerWidget = buildGroceryIndexTickerWidget({ high: 0, medium: 0, low: 0 });

export type CategoryInflationExposureCard = {
  categoryLabel: string;
  changePercent: number;
  exposureLabel: string;
  monthlyImpactSek: number;
  pressureLabel: string;
};

export function buildCategoryInflationExposureCards(limit = 4): CategoryInflationExposureCard[] {
  return buildCategoryInflationTrends({ limit: limit * 2 }).cards
    .map((trend) => {
      const exposure = householdCategoryExposureWeights[trend.categoryLabel] ?? { monthlySpend: 120, sharePercent: 5 };
      const monthlyImpactSek = Math.round((exposure.monthlySpend * trend.changePercent / 100) * 100) / 100;
      return {
        categoryLabel: trend.categoryLabel,
        changePercent: trend.changePercent,
        exposureLabel: `${exposure.sharePercent}% household basket exposure`,
        monthlyImpactSek,
        pressureLabel: trend.fasterThanBasket ? 'above basket pressure' : 'below basket pressure'
      };
    })
    .sort((left, right) => Math.abs(right.monthlyImpactSek) - Math.abs(left.monthlyImpactSek))
    .slice(0, limit);
}

export type CategoryShelfProduct = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  metric: string;
};

export type CategoryTrendingShelf = {
  slug: string;
  label: string;
  fastRising: CategoryShelfProduct[];
  newlyDiscounted: CategoryShelfProduct[];
  stableLowPriceStaples: CategoryShelfProduct[];
};

function latestPair(product: PricedProduct) {
  const observations = [...product.observations].sort((left, right) => right.date.localeCompare(left.date));
  const latest = observations[0];
  const previousDifferent = observations.slice(1).find((observation) => observation.price !== latest?.price);
  if (!latest || !previousDifferent) return null;
  return { latest, previousDifferent };
}

function shelfProduct(product: PricedProduct, metric: string): CategoryShelfProduct {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brands || 'Verified product',
    price: product.priceMedian,
    metric
  };
}

export function buildCategoryTrendingShelves(limit = 6): CategoryTrendingShelf[] {
  return Object.entries(categoryLabels)
    .map(([slug, label]) => {
      const products = pricedProducts.filter((product) => product.category === slug);
      const fastRising = [...products]
        .sort((left, right) => right.observationCount - left.observationCount || right.lastObservedAt.localeCompare(left.lastObservedAt))
        .slice(0, 3)
        .map((product) => shelfProduct(product, `${product.observationCount} observed prices`));
      const newlyDiscounted = products
        .map((product) => ({ product, pair: latestPair(product) }))
        .filter((row): row is { product: PricedProduct; pair: NonNullable<ReturnType<typeof latestPair>> } => Boolean(row.pair && row.pair.latest.price < row.pair.previousDifferent.price))
        .sort((left, right) => (right.pair.previousDifferent.price - right.pair.latest.price) - (left.pair.previousDifferent.price - left.pair.latest.price))
        .slice(0, 3)
        .map(({ product, pair }) => shelfProduct(product, `down ${(pair.previousDifferent.price - pair.latest.price).toFixed(2)} kr since ${pair.previousDifferent.date}`));
      const stableLowPriceStaples = [...products]
        .filter((product) => product.observationCount >= 4 && product.priceMedian <= product.priceMin * 1.08)
        .sort((left, right) => left.priceMedian - right.priceMedian || right.observationCount - left.observationCount)
        .slice(0, 3)
        .map((product) => shelfProduct(product, `${product.observationCount} checks near the low`));

      return { slug, label, fastRising, newlyDiscounted, stableLowPriceStaples };
    })
    .filter((shelf) => shelf.fastRising.length > 0 || shelf.newlyDiscounted.length > 0 || shelf.stableLowPriceStaples.length > 0)
    .slice(0, limit);
}
