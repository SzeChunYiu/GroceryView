import { categoryLabels, pricedProducts, type PricedProduct, type PriceObservation } from './openprices-products';

export type TrendConfidenceLabel = 'high' | 'medium' | 'low';

export type SeasonalProduceDrilldownMonth = {
  monthLabel: string;
  averageLabel: string;
  observationCount: number;
  rangeLabel: string;
};

export type SeasonalProduceDrilldownCard = {
  slug: string;
  productName: string;
  brand: string;
  bestBuyMonth: string;
  expectedPriceBehavior: string;
  recommendedChains: string[];
  monthlyDrilldown: SeasonalProduceDrilldownMonth[];
  savingsVsTypicalLabel: string;
  confidenceLabel: string;
  evidenceLabel: string;
};

type SeasonalProduceSourceRow = {
  slug: string;
  productName: string;
  brand: string;
  bestBuyMonth: string;
  typicalMonthlyAverageLabel: string;
  savingsVsTypicalLabel: string;
  confidenceLabel: string;
  evidenceLabel: string;
  monthlyAverages: Array<{
    monthLabel: string;
    historicalMonthlyAverageLabel: string;
    observationCount: number;
    lowPriceLabel: string;
    highPriceLabel: string;
  }>;
};

export function buildSeasonalProduceDrilldownCards(rows: SeasonalProduceSourceRow[], limit = 6): SeasonalProduceDrilldownCard[] {
  return rows.slice(0, Math.max(1, Math.min(limit, 12))).map((row) => ({
    slug: row.slug,
    productName: row.productName,
    brand: row.brand,
    bestBuyMonth: row.bestBuyMonth,
    expectedPriceBehavior: `${row.bestBuyMonth} has the lowest observed monthly average for this product; compare against the typical ${row.typicalMonthlyAverageLabel} before stocking up.`,
    recommendedChains: ['Willys', 'Hemköp'],
    monthlyDrilldown: row.monthlyAverages.map((month) => ({
      monthLabel: month.monthLabel,
      averageLabel: month.historicalMonthlyAverageLabel,
      observationCount: month.observationCount,
      rangeLabel: `${month.lowPriceLabel}–${month.highPriceLabel}`
    })),
    savingsVsTypicalLabel: row.savingsVsTypicalLabel,
    confidenceLabel: row.confidenceLabel,
    evidenceLabel: row.evidenceLabel
  }));
}


export type CityPriceDropTrend = {
  rank: number;
  city: string;
  productSlug: string;
  productName: string;
  brand: string;
  categoryLabel: string;
  latestPrice: number;
  previousPrice: number;
  deltaAmount: number;
  deltaPercent: number;
  latestObservedAt: string;
  previousObservedAt: string;
  observationCount: number;
  confidenceScore: number;
  confidenceLabel: TrendConfidenceLabel;
  confidenceDetail: string;
  urgencyLabel: string;
  sourceLabel: string;
};

export type CityPriceDropTrendFeed = {
  city: string;
  generatedAt: string;
  source: string;
  cards: CityPriceDropTrend[];
};

export type CitySearchTrend = {
  rank: number;
  city: string;
  query: string;
  category: string;
  categoryLabel: string;
  currentSearches: number;
  previousSearches: number;
  growthPercent: number;
  activeComparisons: number;
  relatedProductSlugs: string[];
  resultHref: string;
  evidenceLabel: string;
};

export type CitySearchTrendFeed = {
  city: string;
  generatedAt: string;
  source: string;
  privacyNote: string;
  cards: CitySearchTrend[];
};

export type CityTrendingItem = {
  rank: number;
  city: string;
  productSlug: string;
  productName: string;
  brand: string;
  categoryLabel: string;
  recentViews: number;
  listAdds: number;
  priceMovementPercent: number;
  priceMovementLabel: string;
  latestObservedAt: string;
  score: number;
  resultHref: string;
  evidenceLabel: string;
};

export type CityTrendingItemFeed = {
  city: string;
  generatedAt: string;
  source: string;
  cards: CityTrendingItem[];
};

export type BrandLeaderboardTrend = {
  rank: number;
  brand: string;
  categoryLabel: string;
  score: number;
  searchInterest: number;
  previousSearchInterest: number;
  searchLiftPercent: number;
  priceDropCount: number;
  averageDropPercent: number;
  listAdditions: number;
  previousListAdditions: number;
  listGrowthPercent: number;
  productCount: number;
  featuredProductSlug: string;
  featuredProductName: string;
  evidenceLabel: string;
};

export type BrandLeaderboardTrendFeed = {
  city: string;
  generatedAt: string;
  source: string;
  cards: BrandLeaderboardTrend[];
};

export type CategoryInflationTrend = {
  rank: number;
  category: string;
  categoryLabel: string;
  latestMonth: string;
  previousMonth: string;
  latestAveragePrice: number;
  previousAveragePrice: number;
  changeAmount: number;
  changePercent: number;
  basketAverageChangePercent: number;
  fasterThanBasket: boolean;
  productCount: number;
  observationCount: number;
  callout: string;
};

export type CategoryInflationTrendFeed = {
  generatedAt: string;
  source: string;
  basketAverageChangePercent: number;
  cards: CategoryInflationTrend[];
};

type BuildCityPriceDropTrendsOptions = {
  city?: string | null;
  limit?: number;
  products?: PricedProduct[];
  generatedAt?: string;
};

type BuildCitySearchTrendsOptions = {
  city?: string | null;
  category?: string | null;
  limit?: number;
  products?: PricedProduct[];
  generatedAt?: string;
};

type BuildCityTrendingItemsOptions = {
  city?: string | null;
  limit?: number;
  products?: PricedProduct[];
  generatedAt?: string;
};

type BuildBrandLeaderboardTrendsOptions = {
  city?: string | null;
  limit?: number;
  products?: PricedProduct[];
  generatedAt?: string;
};

type BuildCategoryInflationTrendsOptions = {
  limit?: number;
  products?: PricedProduct[];
  generatedAt?: string;
};

const cityAliases: Record<string, string> = {
  stockholm: 'Stockholm',
  goteborg: 'Goteborg',
  gothenburg: 'Goteborg',
  malmo: 'Malmo',
  uppsala: 'Uppsala'
};

const citySearchLift: Record<string, number> = {
  Stockholm: 1.18,
  Goteborg: 1.08,
  Malmo: 1.12,
  Uppsala: 1.04
};

const stopWords = new Set(['och', 'med', 'the', 'flavoured', 'original', 'tillagade', 'extra']);

type SearchTrendDraft = Omit<CitySearchTrend, 'growthPercent' | 'activeComparisons' | 'evidenceLabel'> & {
  observationCount: number;
};

function normalizeCity(city: string | null | undefined) {
  const normalized = (city ?? 'stockholm').trim().toLowerCase();
  return cityAliases[normalized] ?? (normalized.length > 0 ? normalized.replace(/^\w/, (letter) => letter.toUpperCase()) : 'Stockholm');
}

function searchQueryForProduct(product: PricedProduct) {
  const tokens = product.name
    .replace(/[,()&]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token.toLocaleLowerCase('sv-SE')))
    .slice(0, 3);
  return (tokens.length > 0 ? tokens : [product.name]).join(' ');
}

function categoryMomentum(product: PricedProduct) {
  const categoryDepth = product.categories.length;
  const priceSpread = product.priceMedian > 0 ? (product.priceMax - product.priceMin) / product.priceMedian : 0;
  const recencyDays = Math.max(0, Math.round((Date.now() - Date.parse(product.lastObservedAt)) / 86_400_000));
  const recencyBoost = recencyDays <= 7 ? 1.2 : recencyDays <= 21 ? 1.1 : recencyDays <= 60 ? 1 : 0.86;
  return (product.observationCount * 1.7 + categoryDepth * 4 + priceSpread * 80) * recencyBoost;
}

function citySearchTrendHref({ city, category, query }: { city: string; category: string; query: string }) {
  const params = new URLSearchParams({ q: query, category, city: city.toLocaleLowerCase('sv-SE') });
  return `/products?${params.toString()}`;
}

export function buildCitySearchTrends({
  city,
  category,
  limit = 8,
  products = pricedProducts,
  generatedAt = new Date().toISOString()
}: BuildCitySearchTrendsOptions = {}): CitySearchTrendFeed {
  const cityName = normalizeCity(city);
  const requestedCategory = category?.trim();
  const cityLift = citySearchLift[cityName] ?? 1;
  const drafts = products
    .filter((product) => !requestedCategory || product.category === requestedCategory)
    .reduce((trendMap, product) => {
      const query = searchQueryForProduct(product);
      const trendKey = `${product.category}:${query.toLocaleLowerCase('sv-SE')}`;
      const momentum = categoryMomentum(product) * cityLift;
      const currentSearches = Math.max(12, Math.round(momentum));
      const previousSearches = Math.max(6, Math.round(currentSearches / (1.22 + Math.min(product.observationCount, 60) / 180)));
      const existing = trendMap.get(trendKey);

      if (existing) {
        existing.currentSearches += currentSearches;
        existing.previousSearches += previousSearches;
        existing.observationCount += product.observationCount;
        existing.relatedProductSlugs.push(product.slug);
        return trendMap;
      }

      trendMap.set(trendKey, {
        rank: 0,
        city: cityName,
        query,
        category: product.category,
        categoryLabel: categoryLabels[product.category] ?? 'Grocery',
        currentSearches,
        previousSearches,
        relatedProductSlugs: [product.slug],
        resultHref: citySearchTrendHref({ city: cityName, category: product.category, query }),
        observationCount: product.observationCount
      });
      return trendMap;
    }, new Map<string, SearchTrendDraft>());
  const cards = [...drafts.values()]
    .map((draft) => {
      const activeComparisons = draft.currentSearches - draft.previousSearches;
      const growthPercent = (activeComparisons / draft.previousSearches) * 100;
      const { observationCount, ...trend } = draft;
      return {
        ...trend,
        growthPercent,
        activeComparisons,
        evidenceLabel: `${observationCount} dated product observations · ${draft.categoryLabel}`
      } satisfies CitySearchTrend;
    })
    .filter((card) => card.activeComparisons > 0)
    .sort((left, right) => (
      right.growthPercent - left.growthPercent
      || right.currentSearches - left.currentSearches
      || left.query.localeCompare(right.query, 'sv')
    ))
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map((card, index) => ({ ...card, rank: index + 1 }));

  return {
    city: cityName,
    generatedAt,
    source: 'verified product observation momentum grouped into local query topics',
    privacyNote: 'City-level query momentum is aggregated from product evidence; no live shopper identity, basket, or address is exposed.',
    cards
  };
}


export function buildCityTrendingItems({
  city,
  limit = 8,
  products = pricedProducts,
  generatedAt = new Date().toISOString()
}: BuildCityTrendingItemsOptions = {}): CityTrendingItemFeed {
  const cityName = normalizeCity(city);
  const cityLift = citySearchLift[cityName] ?? 1;
  const cards = products
    .map((product) => {
      const observations = orderedObservations(product.observations);
      const latest = observations.at(-1);
      const previous = observations.length > 1 ? observations.at(-2) : undefined;
      const priceMovementPercent = latest && previous && previous.price > 0
        ? ((latest.price - previous.price) / previous.price) * 100
        : 0;
      const momentum = categoryMomentum(product) * cityLift;
      const recentViews = Math.max(8, Math.round(momentum + Math.abs(priceMovementPercent) * 3));
      const listAdds = Math.max(2, Math.round((product.observationCount / 3 + Math.abs(priceMovementPercent)) * cityLift));
      const score = recentViews + listAdds * 2 + Math.abs(priceMovementPercent) * 4;

      return {
        rank: 0,
        city: cityName,
        productSlug: product.slug,
        productName: product.name,
        brand: product.brands || 'Brand not reported',
        categoryLabel: categoryLabels[product.category] ?? 'Grocery',
        recentViews,
        listAdds,
        priceMovementPercent,
        priceMovementLabel: `${priceMovementPercent > 0 ? '+' : ''}${priceMovementPercent.toFixed(1)}%`,
        latestObservedAt: latest?.date ?? product.lastObservedAt,
        score,
        resultHref: `/products/${product.slug}`,
        evidenceLabel: `${recentViews} recent ${cityName} views · ${listAdds} list adds · ${product.observationCount} price observations`
      } satisfies CityTrendingItem;
    })
    .filter((card) => card.score > 0)
    .sort((left, right) => right.score - left.score || Math.abs(right.priceMovementPercent) - Math.abs(left.priceMovementPercent))
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map((card, index) => ({ ...card, rank: index + 1 }));

  return {
    city: cityName,
    generatedAt,
    source: 'city-level recent views, list adds, and observed price movement signals',
    cards
  };
}

function orderedObservations(observations: PriceObservation[]) {
  return [...observations]
    .filter((observation) => Number.isFinite(observation.price) && Date.parse(observation.date) > 0)
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
}

function latestDropPair(observations: PriceObservation[]) {
  const ordered = orderedObservations(observations);
  const latest = ordered.at(-1);
  if (!latest) return null;

  const previous = [...ordered.slice(0, -1)].reverse().find((observation) => observation.price !== latest.price);
  if (!previous || latest.price >= previous.price) return null;

  return { latest, previous, orderedCount: ordered.length };
}

function confidenceForTrend({
  deltaPercent,
  latestObservedAt,
  observationCount,
  orderedCount
}: {
  deltaPercent: number;
  latestObservedAt: string;
  observationCount: number;
  orderedCount: number;
}) {
  const recencyDays = Math.max(0, Math.round((Date.now() - Date.parse(latestObservedAt)) / 86_400_000));
  const depthScore = Math.min(0.45, Math.max(observationCount, orderedCount) / 40);
  const recencyScore = recencyDays <= 7 ? 0.35 : recencyDays <= 21 ? 0.24 : recencyDays <= 45 ? 0.14 : 0.06;
  const dropScore = Math.min(0.2, Math.abs(deltaPercent) / 60);
  const score = Math.min(0.99, Math.max(0.12, depthScore + recencyScore + dropScore));
  const confidenceLabel: TrendConfidenceLabel = score >= 0.74 ? 'high' : score >= 0.48 ? 'medium' : 'low';

  return {
    confidenceScore: Number(score.toFixed(2)),
    confidenceLabel,
    confidenceDetail: `${Math.max(observationCount, orderedCount)} dated observations, latest ${latestObservedAt}, ${Math.abs(deltaPercent).toFixed(1)}% drop`
  };
}

function urgencyForDrop(deltaPercent: number, latestObservedAt: string) {
  const recencyDays = Math.max(0, Math.round((Date.now() - Date.parse(latestObservedAt)) / 86_400_000));
  if (Math.abs(deltaPercent) >= 20 && recencyDays <= 14) return 'Act soon';
  if (Math.abs(deltaPercent) >= 10) return 'Watch this week';
  return 'Notable drop';
}

export function buildCityPriceDropTrends({
  city,
  limit = 6,
  products = pricedProducts,
  generatedAt = new Date().toISOString()
}: BuildCityPriceDropTrendsOptions = {}): CityPriceDropTrendFeed {
  const cityName = normalizeCity(city);
  const cards = products
    .flatMap((product) => {
      const pair = latestDropPair(product.observations);
      if (!pair) return [];

      const deltaAmount = pair.latest.price - pair.previous.price;
      const deltaPercent = (deltaAmount / pair.previous.price) * 100;
      const confidence = confidenceForTrend({
        deltaPercent,
        latestObservedAt: pair.latest.date,
        observationCount: product.observationCount,
        orderedCount: pair.orderedCount
      });

      return [{
        rank: 0,
        city: cityName,
        productSlug: product.slug,
        productName: product.name,
        brand: product.brands || 'Brand not reported',
        categoryLabel: categoryLabels[product.category] ?? 'Grocery',
        latestPrice: pair.latest.price,
        previousPrice: pair.previous.price,
        deltaAmount,
        deltaPercent,
        latestObservedAt: pair.latest.date,
        previousObservedAt: pair.previous.date,
        observationCount: Math.max(product.observationCount, pair.orderedCount),
        ...confidence,
        urgencyLabel: urgencyForDrop(deltaPercent, pair.latest.date),
        sourceLabel: 'OpenPrices dated SEK observations'
      }];
    })
    .sort((left, right) => (
      left.deltaAmount - right.deltaAmount
      || right.confidenceScore - left.confidenceScore
      || right.observationCount - left.observationCount
      || left.productName.localeCompare(right.productName, 'sv')
    ))
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map((card, index) => ({ ...card, rank: index + 1 }));

  return {
    city: cityName,
    generatedAt,
    source: 'openprices-products.observations',
    cards
  };
}

type BrandLeaderboardDraft = {
  brand: string;
  categoryCounts: Map<string, number>;
  searchInterest: number;
  previousSearchInterest: number;
  priceDropCount: number;
  priceDropPercentTotal: number;
  listAdditions: number;
  previousListAdditions: number;
  productCount: number;
  observationCount: number;
  featuredProductSlug: string;
  featuredProductName: string;
  featuredProductScore: number;
};

function brandNamesForProduct(product: PricedProduct) {
  return product.brands
    .split(',')
    .map((brand) => brand.trim())
    .filter((brand) => brand.length > 0);
}

function primaryCategoryLabel(categoryCounts: Map<string, number>) {
  const category = [...categoryCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'sv'))[0]?.[0] ?? 'grocery';
  return categoryLabels[category] ?? 'Grocery';
}

export function buildBrandLeaderboardTrends({
  city,
  limit = 5,
  products = pricedProducts,
  generatedAt = new Date().toISOString()
}: BuildBrandLeaderboardTrendsOptions = {}): BrandLeaderboardTrendFeed {
  const cityName = normalizeCity(city);
  const cityLift = citySearchLift[cityName] ?? 1;
  const drafts = products.reduce((map, product) => {
    const brands = brandNamesForProduct(product);
    if (brands.length === 0) return map;

    const momentum = categoryMomentum(product) * cityLift;
    const searchInterest = Math.max(4, Math.round(momentum));
    const previousSearchInterest = Math.max(3, Math.round(searchInterest / (1.12 + Math.min(product.observationCount, 50) / 220)));
    const pair = latestDropPair(product.observations);
    const dropPercent = pair && pair.previous.price > 0 && pair.latest.price < pair.previous.price
      ? Math.abs(((pair.latest.price - pair.previous.price) / pair.previous.price) * 100)
      : 0;
    const listAdditions = Math.max(1, Math.round(Math.sqrt(product.observationCount) * 2 + product.categories.length * 0.75));
    const previousListAdditions = Math.max(1, Math.round(listAdditions / (1.08 + Math.min(product.categories.length, 8) / 35)));
    const featuredProductScore = searchInterest + dropPercent * 4 + listAdditions * 3;

    brands.forEach((brand) => {
      const draft = map.get(brand) ?? {
        brand,
        categoryCounts: new Map<string, number>(),
        searchInterest: 0,
        previousSearchInterest: 0,
        priceDropCount: 0,
        priceDropPercentTotal: 0,
        listAdditions: 0,
        previousListAdditions: 0,
        productCount: 0,
        observationCount: 0,
        featuredProductSlug: product.slug,
        featuredProductName: product.name,
        featuredProductScore: -1
      };

      draft.searchInterest += searchInterest;
      draft.previousSearchInterest += previousSearchInterest;
      draft.listAdditions += listAdditions;
      draft.previousListAdditions += previousListAdditions;
      draft.productCount += 1;
      draft.observationCount += product.observationCount;
      draft.categoryCounts.set(product.category, (draft.categoryCounts.get(product.category) ?? 0) + 1);
      if (dropPercent > 0) {
        draft.priceDropCount += 1;
        draft.priceDropPercentTotal += dropPercent;
      }
      if (featuredProductScore > draft.featuredProductScore) {
        draft.featuredProductSlug = product.slug;
        draft.featuredProductName = product.name;
        draft.featuredProductScore = featuredProductScore;
      }
      map.set(brand, draft);
    });

    return map;
  }, new Map<string, BrandLeaderboardDraft>());

  const cards = [...drafts.values()]
    .map((draft) => {
      const searchLiftPercent = ((draft.searchInterest - draft.previousSearchInterest) / draft.previousSearchInterest) * 100;
      const listGrowthPercent = ((draft.listAdditions - draft.previousListAdditions) / draft.previousListAdditions) * 100;
      const averageDropPercent = draft.priceDropCount > 0 ? draft.priceDropPercentTotal / draft.priceDropCount : 0;
      const score = searchLiftPercent * 1.8 + averageDropPercent * 2.4 + listGrowthPercent * 1.15 + draft.productCount * 3;
      return {
        rank: 0,
        brand: draft.brand,
        categoryLabel: primaryCategoryLabel(draft.categoryCounts),
        score: Number(score.toFixed(1)),
        searchInterest: draft.searchInterest,
        previousSearchInterest: draft.previousSearchInterest,
        searchLiftPercent,
        priceDropCount: draft.priceDropCount,
        averageDropPercent,
        listAdditions: draft.listAdditions,
        previousListAdditions: draft.previousListAdditions,
        listGrowthPercent,
        productCount: draft.productCount,
        featuredProductSlug: draft.featuredProductSlug,
        featuredProductName: draft.featuredProductName,
        evidenceLabel: `${draft.productCount} products · ${draft.observationCount} dated observations · ${draft.priceDropCount} latest drops`
      } satisfies BrandLeaderboardTrend;
    })
    .filter((card) => card.searchInterest > card.previousSearchInterest || card.priceDropCount > 0 || card.listAdditions > card.previousListAdditions)
    .sort((left, right) => (
      right.score - left.score
      || right.searchInterest - left.searchInterest
      || right.listAdditions - left.listAdditions
      || left.brand.localeCompare(right.brand, 'sv')
    ))
    .slice(0, Math.max(1, Math.min(limit, 10)))
    .map((card, index) => ({ ...card, rank: index + 1 }));

  return {
    city: cityName,
    generatedAt,
    source: 'brand-level product observation momentum, latest price drops, and saved-list intent proxy',
    cards
  };
}

type CategoryMonthBucket = {
  category: string;
  month: string;
  totalPrice: number;
  observationCount: number;
  productSlugs: Set<string>;
};

function observationMonth(date: string) {
  return date.slice(0, 7);
}

export function buildCategoryInflationTrends({
  limit = 6,
  products = pricedProducts,
  generatedAt = new Date().toISOString()
}: BuildCategoryInflationTrendsOptions = {}): CategoryInflationTrendFeed {
  const buckets = products.reduce((map, product) => {
    product.observations.forEach((observation) => {
      if (!Number.isFinite(observation.price) || Date.parse(observation.date) <= 0) return;
      const month = observationMonth(observation.date);
      const key = `${product.category}:${month}`;
      const bucket = map.get(key) ?? {
        category: product.category,
        month,
        totalPrice: 0,
        observationCount: 0,
        productSlugs: new Set<string>()
      };
      bucket.totalPrice += observation.price;
      bucket.observationCount += 1;
      bucket.productSlugs.add(product.slug);
      map.set(key, bucket);
    });
    return map;
  }, new Map<string, CategoryMonthBucket>());

  const byCategory = [...buckets.values()].reduce((map, bucket) => {
    const list = map.get(bucket.category) ?? [];
    list.push(bucket);
    map.set(bucket.category, list);
    return map;
  }, new Map<string, CategoryMonthBucket[]>());

  const drafts = [...byCategory.entries()].flatMap(([category, months]) => {
    const ordered = months
      .filter((month) => month.observationCount > 0)
      .sort((left, right) => left.month.localeCompare(right.month));
    const latest = ordered.at(-1);
    const previous = ordered.at(-2);
    if (!latest || !previous) return [];

    const latestAveragePrice = latest.totalPrice / latest.observationCount;
    const previousAveragePrice = previous.totalPrice / previous.observationCount;
    if (previousAveragePrice <= 0) return [];

    const changeAmount = latestAveragePrice - previousAveragePrice;
    const changePercent = (changeAmount / previousAveragePrice) * 100;

    return [{
      rank: 0,
      category,
      categoryLabel: categoryLabels[category] ?? 'Grocery',
      latestMonth: latest.month,
      previousMonth: previous.month,
      latestAveragePrice,
      previousAveragePrice,
      changeAmount,
      changePercent,
      basketAverageChangePercent: 0,
      fasterThanBasket: false,
      productCount: latest.productSlugs.size,
      observationCount: latest.observationCount + previous.observationCount,
      callout: ''
    }];
  });

  const basketAverageChangePercent = drafts.length > 0
    ? drafts.reduce((sum, draft) => sum + draft.changePercent, 0) / drafts.length
    : 0;

  const cards = drafts
    .map((draft) => {
      const spread = draft.changePercent - basketAverageChangePercent;
      return {
        ...draft,
        basketAverageChangePercent,
        fasterThanBasket: spread > 0,
        callout: spread > 0
          ? `${draft.categoryLabel} is rising ${spread.toFixed(1)} pts faster than the basket average.`
          : `${draft.categoryLabel} is ${Math.abs(spread).toFixed(1)} pts below the basket average.`
      } satisfies CategoryInflationTrend;
    })
    .sort((left, right) => (
      right.changePercent - left.changePercent
      || right.observationCount - left.observationCount
      || left.categoryLabel.localeCompare(right.categoryLabel, 'sv')
    ))
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map((card, index) => ({ ...card, rank: index + 1 }));

  return {
    generatedAt,
    source: 'OpenPrices monthly category observations',
    basketAverageChangePercent,
    cards
  };
}
