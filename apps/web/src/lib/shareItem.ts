export type ItemDealCandidate = {
  sourceId: string;
  sourceName: string;
  price: number | null;
  currency?: string;
  observedAt?: string | null;
  isAvailable?: boolean;
};

export type ShareableItemDealInput = {
  itemId: string;
  itemName: string;
  baseUrl: string;
  candidates: ItemDealCandidate[];
};

export type ShareableItemDeal = {
  itemId: string;
  itemName: string;
  sourceId: string;
  sourceName: string;
  price: number;
  currency: string;
  observedAt: string | null;
  sharePath: string;
  shareUrl: string;
  guardrail: string;
};

export const shareableItemDealGuardrail =
  'Anyone can open this public item deal URL without logging in; it contains only item, source, and visible current-price evidence.';

export const shareableItemDealMode = 'share=deal';

function isPositivePrice(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function formatPriceParam(price: number) {
  return price.toFixed(2);
}

function buildSharePath(deal: {
  itemId: string;
  sourceId: string;
  price: number;
  currency: string;
  observedAt: string | null;
}) {
  const params = new URLSearchParams({
    share: 'deal',
    source: deal.sourceId,
    price: formatPriceParam(deal.price),
    currency: deal.currency
  });
  if (deal.observedAt) params.set('observedAt', deal.observedAt);
  return `/items/${encodeURIComponent(deal.itemId)}?${params.toString()}`;
}

export function cheapestCurrentDealForItem(input: ShareableItemDealInput): ShareableItemDeal | null {
  const cheapest = input.candidates
    .filter((candidate): candidate is ItemDealCandidate & { price: number } => candidate.isAvailable !== false && isPositivePrice(candidate.price))
    .sort((left, right) => {
      const priceDelta = left.price - right.price;
      if (priceDelta !== 0) return priceDelta;
      return left.sourceName.localeCompare(right.sourceName);
    })[0];

  if (!cheapest) return null;

  const currency = cheapest.currency ?? 'SEK';
  const observedAt = cheapest.observedAt ?? null;
  const sharePath = buildSharePath({
    itemId: input.itemId,
    sourceId: cheapest.sourceId,
    price: cheapest.price,
    currency,
    observedAt
  });
  return {
    itemId: input.itemId,
    itemName: input.itemName,
    sourceId: cheapest.sourceId,
    sourceName: cheapest.sourceName,
    price: cheapest.price,
    currency,
    observedAt,
    sharePath,
    shareUrl: new URL(sharePath, input.baseUrl).toString(),
    guardrail: shareableItemDealGuardrail
  };
}
