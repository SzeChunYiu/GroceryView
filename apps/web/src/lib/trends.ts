import { categoryLabels, pricedProducts, type PricedProduct, type PriceObservation } from './openprices-products';

export type TrendConfidenceLabel = 'high' | 'medium' | 'low';

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

export type SeasonalDiscoveryCard = {
  rank: number;
  productSlug: string;
  productName: string;
  brand: string;
  categoryLabel: string;
  cardType: 'in-season produce' | 'holiday staple' | 'price movement window';
  monthLabel: string;
  windowLabel: string;
  historicalMonthlyAverage: number;
  historicalMonthlyAverageLabel: string;
  typicalMonthlyAverage: number;
  typicalMonthlyAverageLabel: string;
  expectedPriceMovementLabel: string;
  evidenceLabel: string;
  sourceLabel: string;
};

export type SeasonalDiscoveryFeed = {
  generatedAt: string;
  cards: SeasonalDiscoveryCard[];
  guardrails: string[];
  source: string;
};

type BuildCityPriceDropTrendsOptions = {
  city?: string | null;
  limit?: number;
  products?: PricedProduct[];
  generatedAt?: string;
};

type BuildSeasonalDiscoveryCardsOptions = {
  generatedAt?: string;
  limit?: number;
  now?: Date;
  products?: PricedProduct[];
};

const cityAliases: Record<string, string> = {
  stockholm: 'Stockholm',
  goteborg: 'Goteborg',
  gothenburg: 'Goteborg',
  malmo: 'Malmo',
  uppsala: 'Uppsala'
};
const seasonalMonthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const holidayStapleRules = [
  { monthIndex: 5, label: 'Midsommar', pattern: /jordgubb|strawberr|potatis|potato|gräddfil|sill|herring/i },
  { monthIndex: 7, label: 'Late-summer grilling', pattern: /majs|corn|tomat|tomato|paprika|grill|halloumi/i },
  { monthIndex: 11, label: 'Jul pantry', pattern: /risgryn|jul|saffran|skinka|must|pepparkak|cinnamon|potatis/i }
];
const seasonalProducePattern = /äpple|apple|banan|banana|bär|berry|gurka|cucumber|kål|cabbage|morot|carrot|paprika|pepper|potatis|potato|sallad|lettuce|spenat|spinach|tomat|tomato/i;

function normalizeCity(city: string | null | undefined) {
  const normalized = (city ?? 'stockholm').trim().toLowerCase();
  return cityAliases[normalized] ?? (normalized.length > 0 ? normalized.replace(/^\w/, (letter) => letter.toUpperCase()) : 'Stockholm');
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

function formatSek(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 'Not reported';
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

function monthDistance(fromMonth: number, toMonth: number) {
  return (toMonth - fromMonth + 12) % 12;
}

function nextHolidayWindow(currentMonth: number) {
  return [...holidayStapleRules].sort((left, right) => monthDistance(currentMonth, left.monthIndex) - monthDistance(currentMonth, right.monthIndex))[0]!;
}

function seasonalMonthlyAverages(product: PricedProduct) {
  const buckets = product.observations.reduce<Map<number, number[]>>((acc, observation) => {
    const observedAt = Date.parse(`${observation.date}T00:00:00.000Z`);
    if (!Number.isFinite(observedAt) || !Number.isFinite(observation.price) || observation.price <= 0) return acc;
    const monthIndex = new Date(observedAt).getUTCMonth();
    const prices = acc.get(monthIndex) ?? [];
    prices.push(observation.price);
    acc.set(monthIndex, prices);
    return acc;
  }, new Map<number, number[]>());

  return [...buckets.entries()].map(([monthIndex, prices]) => ({
    monthIndex,
    average: Math.round((prices.reduce((sum, price) => sum + price, 0) / prices.length) * 100) / 100,
    observationCount: prices.length
  }));
}

function seasonalCandidateType(product: PricedProduct, targetMonth: number, holidayWindow: (typeof holidayStapleRules)[number]) {
  const haystack = `${product.category} ${product.categories.join(' ')} ${product.name}`;
  const isProduce = product.category === 'produce'
    || /fruits-and-vegetables|vegetables|fruits|fresh-foods/i.test(haystack)
    || seasonalProducePattern.test(product.name);
  const isHolidayStaple = holidayWindow.pattern.test(product.name);

  if (isHolidayStaple) return { cardType: 'holiday staple' as const, monthIndex: holidayWindow.monthIndex, windowLabel: holidayWindow.label };
  if (isProduce) return { cardType: 'in-season produce' as const, monthIndex: targetMonth, windowLabel: `${seasonalMonthLabels[targetMonth]} produce planning` };
  return { cardType: 'price movement window' as const, monthIndex: targetMonth, windowLabel: `${seasonalMonthLabels[targetMonth]} price window` };
}

function expectedMovementLabel(monthAverage: number, typicalAverage: number) {
  if (typicalAverage <= 0) return 'Historical movement unavailable';
  const percent = ((monthAverage - typicalAverage) / typicalAverage) * 100;
  const formatted = `${Math.abs(percent).toFixed(1)}%`;
  if (percent <= -5) return `Historically ${formatted} below the product average`;
  if (percent >= 5) return `Historically ${formatted} above the product average`;
  return 'Historically close to the product average';
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

export function buildSeasonalDiscoveryCards({
  generatedAt = new Date().toISOString(),
  limit = 6,
  now = new Date(),
  products = pricedProducts
}: BuildSeasonalDiscoveryCardsOptions = {}): SeasonalDiscoveryFeed {
  const targetMonth = now.getUTCMonth();
  const holidayWindow = nextHolidayWindow(targetMonth);

  const cards = products
    .flatMap((product) => {
      const monthlyAverages = seasonalMonthlyAverages(product);
      if (monthlyAverages.length < 2) return [];

      const candidate = seasonalCandidateType(product, targetMonth, holidayWindow);
      const targetAverage = monthlyAverages.find((row) => row.monthIndex === candidate.monthIndex);
      if (!targetAverage) return [];

      const typicalMonthlyAverage = Math.round((monthlyAverages.reduce((sum, row) => sum + row.average, 0) / monthlyAverages.length) * 100) / 100;
      const monthObservationCount = targetAverage.observationCount;
      const score = (
        (candidate.cardType === 'holiday staple' ? 40 : candidate.cardType === 'in-season produce' ? 28 : 10)
        + Math.min(24, monthlyAverages.length * 3)
        + Math.min(20, monthObservationCount * 4)
        + Math.max(0, typicalMonthlyAverage - targetAverage.average)
      );

      return [{
        rank: 0,
        productSlug: product.slug,
        productName: product.name,
        brand: product.brands || 'Brand not reported',
        categoryLabel: categoryLabels[product.category] ?? 'Grocery',
        cardType: candidate.cardType,
        monthLabel: seasonalMonthLabels[candidate.monthIndex]!,
        windowLabel: candidate.windowLabel,
        historicalMonthlyAverage: targetAverage.average,
        historicalMonthlyAverageLabel: formatSek(targetAverage.average),
        typicalMonthlyAverage,
        typicalMonthlyAverageLabel: formatSek(typicalMonthlyAverage),
        expectedPriceMovementLabel: expectedMovementLabel(targetAverage.average, typicalMonthlyAverage),
        evidenceLabel: `${monthObservationCount} dated observations in ${seasonalMonthLabels[candidate.monthIndex]} across ${monthlyAverages.length} observed month buckets.`,
        sourceLabel: 'OpenPrices dated SEK observations',
        score
      }];
    })
    .sort((left, right) => (
      right.score - left.score
      || left.productName.localeCompare(right.productName, 'sv')
    ))
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map(({ score: _score, ...card }, index) => ({ ...card, rank: index + 1 }));

  return {
    generatedAt,
    cards,
    source: 'openprices-products.observations',
    guardrails: [
      'Seasonal discovery cards use historical monthly averages only; they are not forecasts.',
      'Holiday staples are promoted only when product names match an explicit seasonal rule and have dated price rows for that month.',
      'Expected movement describes the product history versus its own average, not a guaranteed future shelf price.'
    ]
  };
}
