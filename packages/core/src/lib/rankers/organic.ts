const ORGANIC_SIGNAL_PATTERNS = [
  /\borganic\b/i,
  /\borg\b/i,
  /\beco\b/i,
  /\beko\b/i,
  /\bekologisk(?:t|a)?\b/i,
  /\bkrav\b/i,
  /\beu[-_\s]?ecological\b/i,
  /\beu[-_\s]?organic\b/i
] as const;

export type OrganicFlyerOfferInput = {
  productId: string;
  productName: string;
  currentPrice: number;
  regularPrice?: number;
  savingsPercent?: number;
  sourceConfidence?: number;
  tags?: readonly string[];
  labels?: readonly string[];
  certifications?: readonly string[];
  badges?: readonly string[];
  sponsoredPlacement?: boolean;
};

export type RankedOrganicFlyerOffer = OrganicFlyerOfferInput & {
  organicSignals: string[];
  computedSavingsPercent: number;
  rankScore: number;
};

export type RankOrganicFlyerOfferOptions = {
  minimumSavingsPercent?: number;
  minimumSourceConfidence?: number;
  includeSponsoredPlacements?: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function textSignals(offer: OrganicFlyerOfferInput): string[] {
  return [
    ...(offer.tags ?? []),
    ...(offer.labels ?? []),
    ...(offer.certifications ?? []),
    ...(offer.badges ?? [])
  ]
    .map((signal) => signal.trim())
    .filter(Boolean);
}

export function organicSignalsForFlyerOffer(offer: OrganicFlyerOfferInput): string[] {
  const signals = textSignals(offer).filter((signal) => ORGANIC_SIGNAL_PATTERNS.some((pattern) => pattern.test(signal)));
  return [...new Set(signals)];
}

export function isOrganicFlyerOffer(offer: OrganicFlyerOfferInput): boolean {
  return organicSignalsForFlyerOffer(offer).length > 0;
}

export function savingsPercentForFlyerOffer(offer: OrganicFlyerOfferInput): number {
  if (typeof offer.savingsPercent === 'number' && Number.isFinite(offer.savingsPercent)) {
    return roundPercent(clamp(offer.savingsPercent, 0, 100));
  }
  if (typeof offer.regularPrice !== 'number' || !Number.isFinite(offer.regularPrice) || offer.regularPrice <= 0) {
    return 0;
  }
  if (!Number.isFinite(offer.currentPrice) || offer.currentPrice < 0) {
    return 0;
  }
  return roundPercent(clamp(((offer.regularPrice - offer.currentPrice) / offer.regularPrice) * 100, 0, 100));
}

export function rankOrganicFlyerOffers(
  offers: readonly OrganicFlyerOfferInput[],
  options: RankOrganicFlyerOfferOptions = {}
): RankedOrganicFlyerOffer[] {
  const minimumSavingsPercent = options.minimumSavingsPercent ?? 0;
  const minimumSourceConfidence = options.minimumSourceConfidence ?? 0;

  return offers
    .flatMap((offer) => {
      if (offer.sponsoredPlacement && !options.includeSponsoredPlacements) return [];
      if ((offer.sourceConfidence ?? 1) < minimumSourceConfidence) return [];
      const organicSignals = organicSignalsForFlyerOffer(offer);
      if (organicSignals.length === 0) return [];
      const computedSavingsPercent = savingsPercentForFlyerOffer(offer);
      if (computedSavingsPercent < minimumSavingsPercent) return [];
      const rankScore = roundPercent(computedSavingsPercent * 100 + clamp(offer.sourceConfidence ?? 1, 0, 1) * 10 + organicSignals.length);
      return [{ ...offer, organicSignals, computedSavingsPercent, rankScore }];
    })
    .sort((left, right) =>
      right.computedSavingsPercent - left.computedSavingsPercent ||
      (right.sourceConfidence ?? 1) - (left.sourceConfidence ?? 1) ||
      right.organicSignals.length - left.organicSignals.length ||
      left.productName.localeCompare(right.productName, 'sv') ||
      left.productId.localeCompare(right.productId, 'sv')
    );
}
