export type PriceDropReasonKind = 'promotion' | 'supplier_update' | 'temporary_stock_event' | 'clearance' | 'unusual_drop';

export interface PriceDropReasonInput {
  currentPrice?: number | null;
  previousPrice?: number | null;
  priceType?: string | null;
  campaignLabel?: string | null;
  productName?: string | null;
  source?: string | null;
  stockStatus?: string | null;
  inStock?: boolean | null;
  stockDelta?: number | null;
}

export interface PriceDropReason {
  kind: PriceDropReasonKind;
  icon: string;
  label: string;
  detail: string;
}

export type PriceDropDiscoveryObservation = {
  date: string;
  price: number;
};

export type PriceDropDiscoveryProduct = {
  slug: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  observations: PriceDropDiscoveryObservation[];
};

export type PriceDropDiscoveryRailItem = {
  rank: number;
  productSlug: string;
  productName: string;
  brand: string;
  category: string;
  latestPrice: number;
  previousWeekPrice: number;
  dropAmount: number;
  dropPercent: number;
  latestObservedAt: string;
  previousObservedAt: string;
  evidenceLabel: string;
};

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function normalizeText(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(' ').toLocaleLowerCase('sv-SE');
}

export function getPriceDropPercent({ currentPrice, previousPrice }: PriceDropReasonInput): number | null {
  if (!currentPrice || !previousPrice || currentPrice >= previousPrice) return null;
  return (previousPrice - currentPrice) / previousPrice;
}

export function getPriceDropReasons(input: PriceDropReasonInput): PriceDropReason[] {
  const text = normalizeText(input.priceType, input.campaignLabel, input.productName, input.source, input.stockStatus);
  const dropPercent = getPriceDropPercent(input);
  const reasons: PriceDropReason[] = [];

  if (includesAny(text, ['kampanj', 'promotion', 'promo', 'rabatt', 'erbjudande', 'deal'])) {
    reasons.push({
      kind: 'promotion',
      icon: '🏷️',
      label: 'Promotion likely',
      detail: 'The price event carries campaign or discount wording, so the drop is likely promotional.',
    });
  }

  if (includesAny(text, ['supplier', 'leverantör', 'vendor', 'base price', 'list price', 'article update'])) {
    reasons.push({
      kind: 'supplier_update',
      icon: '📦',
      label: 'Supplier update',
      detail: 'Supplier or list-price metadata changed around this alert, which can move the shelf price without a shopper-facing campaign.',
    });
  }

  if (input.inStock === false || (input.stockDelta ?? 0) < 0 || includesAny(text, ['limited stock', 'low stock', 'out of stock', 'slut'])) {
    reasons.push({
      kind: 'temporary_stock_event',
      icon: '⏱️',
      label: 'Temporary stock event',
      detail: 'Fresh stock signals changed near the price drop, so availability may be temporary or store-specific.',
    });
  }

  if (includesAny(text, ['clearance', 'utförsäljning', 'utgår', 'short date', 'kort datum'])) {
    reasons.push({
      kind: 'clearance',
      icon: '⚡',
      label: 'Clearance or short date',
      detail: 'Clearance wording suggests the lower price may be tied to expiring or discontinued stock.',
    });
  }

  if (reasons.length === 0 && (dropPercent === null || dropPercent >= 0.2)) {
    reasons.push({
      kind: 'unusual_drop',
      icon: '🔎',
      label: 'Large unexplained drop',
      detail: 'No campaign, supplier, or stock clue explains the change yet; verify the shelf price before acting.',
    });
  }

  return reasons;
}

function weekComparisonFor(observations: PriceDropDiscoveryObservation[]) {
  const ordered = observations
    .filter((observation) => Number.isFinite(observation.price) && Number.isFinite(Date.parse(`${observation.date}T00:00:00.000Z`)))
    .sort((left, right) => left.date.localeCompare(right.date));
  const latest = ordered.at(-1);
  if (!latest) return null;
  const latestTime = Date.parse(`${latest.date}T00:00:00.000Z`);
  const weekStart = latestTime - 9 * 86_400_000;
  const weekEnd = latestTime - 5 * 86_400_000;
  const previousWeek = [...ordered]
    .reverse()
    .find((observation) => {
      const observedTime = Date.parse(`${observation.date}T00:00:00.000Z`);
      return observedTime >= weekStart && observedTime <= weekEnd;
    });
  if (!previousWeek || latest.price >= previousWeek.price) return null;
  return { latest, previousWeek, observationCount: ordered.length };
}

export function buildPriceDropDiscoveryRail(products: PriceDropDiscoveryProduct[], limit = 6): PriceDropDiscoveryRailItem[] {
  return products
    .flatMap((product) => {
      const comparison = weekComparisonFor(product.observations);
      if (!comparison) return [];
      const dropAmount = comparison.previousWeek.price - comparison.latest.price;
      const dropPercent = dropAmount / comparison.previousWeek.price;

      return [{
        rank: 0,
        productSlug: product.slug,
        productName: product.name,
        brand: product.brand || 'Brand not reported',
        category: product.category || 'grocery',
        latestPrice: comparison.latest.price,
        previousWeekPrice: comparison.previousWeek.price,
        dropAmount,
        dropPercent,
        latestObservedAt: comparison.latest.date,
        previousObservedAt: comparison.previousWeek.date,
        evidenceLabel: `${comparison.observationCount} dated observations; week-over-week compares ${comparison.previousWeek.date} to ${comparison.latest.date}`
      }];
    })
    .sort((left, right) => (
      right.dropPercent - left.dropPercent
      || right.dropAmount - left.dropAmount
      || left.productName.localeCompare(right.productName, 'sv')
    ))
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
