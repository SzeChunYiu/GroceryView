export type PackageEvidence = {
  packageSize: number;
  packageUnit: 'g' | 'ml' | 'piece';
  confidence: 'exact' | 'converted' | 'estimated';
  confidenceLabel: string;
};

export type NormalizedUnitPrice = PackageEvidence & {
  value: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

function packageConfidence(unit: string, derivedFromMultipack: boolean): Pick<PackageEvidence, 'confidence' | 'confidenceLabel'> {
  if (derivedFromMultipack) {
    return {
      confidence: 'estimated',
      confidenceLabel: 'Estimated from parsed multipack package text'
    };
  }
  if (unit === 'kg' || unit === 'l') {
    return {
      confidence: 'converted',
      confidenceLabel: `Converted package size from ${unit}`
    };
  }
  return {
    confidence: 'exact',
    confidenceLabel: 'Package size parsed directly'
  };
}

function normalizePackageAmount(amount: number, unit: string, derivedFromMultipack = false): PackageEvidence | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const confidence = packageConfidence(unit, derivedFromMultipack);
  if (unit === 'kg') return { packageSize: amount * 1000, packageUnit: 'g', ...confidence };
  if (unit === 'l') return { packageSize: amount * 1000, packageUnit: 'ml', ...confidence };
  if (unit === 'st' || unit === 'piece') return { packageSize: amount, packageUnit: 'piece', ...confidence };
  if (unit === 'g' || unit === 'ml') return { packageSize: amount, packageUnit: unit, ...confidence };
  return null;
}

export function packageEvidenceFromText(text: string): PackageEvidence | null {
  const normalized = text.toLowerCase().replace(/,/g, '.');
  const multipackMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|st|piece)\b/);
  if (multipackMatch) {
    const packCount = Number(multipackMatch[1]);
    const packAmount = Number(multipackMatch[2]);
    return normalizePackageAmount(packCount * packAmount, multipackMatch[3]!, true);
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
