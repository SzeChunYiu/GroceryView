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
