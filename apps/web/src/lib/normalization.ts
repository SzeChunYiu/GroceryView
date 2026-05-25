export type PackageEvidence = {
  packageSize: number;
  packageUnit: 'g' | 'ml' | 'piece';
};

export type NormalizedUnitPrice = PackageEvidence & {
  value: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

export type PriceAnomalyCauseKind = 'unit_mismatch' | 'stale_feed' | 'promotion_parsing';

export type PriceAnomalyCause = {
  kind: PriceAnomalyCauseKind;
  label: string;
  reviewerHint: string;
  evidence: string;
};

export type PriceAnomalyExplanationInput = {
  previousPrice: number;
  reportedPrice: number;
  previousUnit?: NormalizedUnitPrice['comparableUnit'] | string | null;
  reportedUnit?: NormalizedUnitPrice['comparableUnit'] | string | null;
  previousObservedAt?: string | null;
  reportedObservedAt?: string | null;
  promotionText?: string | null;
  sourceLabel?: string | null;
};

function normalizePackageAmount(amount: number, unit: string): PackageEvidence | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 'kg') return { packageSize: amount * 1000, packageUnit: 'g' };
  if (unit === 'l') return { packageSize: amount * 1000, packageUnit: 'ml' };
  if (unit === 'st' || unit === 'piece') return { packageSize: amount, packageUnit: 'piece' };
  if (unit === 'g' || unit === 'ml') return { packageSize: amount, packageUnit: unit };
  return null;
}

export function packageEvidenceFromText(text: string): PackageEvidence | null {
  const normalized = text.toLowerCase().replace(/,/g, '.');
  const multipackMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|st|piece)\b/);
  if (multipackMatch) {
    const packCount = Number(multipackMatch[1]);
    const packAmount = Number(multipackMatch[2]);
    return normalizePackageAmount(packCount * packAmount, multipackMatch[3]!);
  }

  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|st|piece)\b/);
  if (!match) return null;
  return normalizePackageAmount(Number(match[1]), match[2]!);
}

export function normalizeUnitPrice(price: number, packageEvidence: PackageEvidence | null): NormalizedUnitPrice | null {
  if (!Number.isFinite(price) || price <= 0 || !packageEvidence) return null;
  if (packageEvidence.packageUnit === 'g') {
    return {
      ...packageEvidence,
      value: (price / packageEvidence.packageSize) * 1000,
      comparableUnit: 'kg'
    };
  }
  if (packageEvidence.packageUnit === 'ml') {
    return {
      ...packageEvidence,
      value: (price / packageEvidence.packageSize) * 1000,
      comparableUnit: 'l'
    };
  }
  return {
    ...packageEvidence,
    value: price / packageEvidence.packageSize,
    comparableUnit: 'piece'
  };
}

export function normalizeUnitPriceForPackageText(price: number, packageText: string): NormalizedUnitPrice | null {
  return normalizeUnitPrice(price, packageEvidenceFromText(packageText));
}

function daysBetween(left: string | null | undefined, right: string | null | undefined): number | null {
  if (!left || !right) return null;
  const leftMs = Date.parse(left);
  const rightMs = Date.parse(right);
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) return null;
  return Math.abs(rightMs - leftMs) / (24 * 60 * 60 * 1000);
}

function hasPromotionSignal(value: string | null | undefined): boolean {
  if (!value) return false;
  return /\b(kampanj|promo|promotion|erbjudande|rabatt|stammis|member|bonus|2\s*for|3\s*for|\d+\s*för)\b/i.test(value);
}

export function explainPriceAnomaly(input: PriceAnomalyExplanationInput): PriceAnomalyCause[] {
  const causes: PriceAnomalyCause[] = [];
  const previousPrice = input.previousPrice;
  const reportedPrice = input.reportedPrice;
  const absoluteDelta = Math.abs(reportedPrice - previousPrice);
  const deltaPercent = previousPrice > 0 ? (absoluteDelta / previousPrice) * 100 : 0;
  const previousUnit = input.previousUnit?.toString().toLowerCase() ?? null;
  const reportedUnit = input.reportedUnit?.toString().toLowerCase() ?? null;
  const ageDays = daysBetween(input.previousObservedAt, input.reportedObservedAt);

  if (previousUnit && reportedUnit && previousUnit !== reportedUnit) {
    causes.push({
      kind: 'unit_mismatch',
      label: 'Possible unit mismatch',
      reviewerHint: 'Check package size and unit-price normalization before accepting the reported price.',
      evidence: `Previous row is ${previousUnit}; report is ${reportedUnit}.`
    });
  }

  if (ageDays !== null && ageDays >= 14) {
    causes.push({
      kind: 'stale_feed',
      label: 'Possible stale feed',
      reviewerHint: 'Refresh the source row or confirm the report timestamp before treating the change as current.',
      evidence: `${Math.round(ageDays)} days between compared observations.`
    });
  }

  if (deltaPercent >= 25 && (hasPromotionSignal(input.promotionText) || hasPromotionSignal(input.sourceLabel))) {
    causes.push({
      kind: 'promotion_parsing',
      label: 'Possible promotion parsing',
      reviewerHint: 'Verify multibuy, member price, deposit, and limit text before rejecting the price jump.',
      evidence: `${Math.round(deltaPercent)}% price movement with promotion wording.`
    });
  }

  return causes;
}
