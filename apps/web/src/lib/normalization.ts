export type PackageEvidence = {
  packageSize: number;
  packageUnit: 'g' | 'ml' | 'piece';
};

export type NormalizedUnitPrice = PackageEvidence & {
  value: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

export function comparableUnitLabel(unit: NormalizedUnitPrice['comparableUnit']) {
  if (unit === 'kg') return 'kr/kg';
  if (unit === 'l') return 'kr/l';
  return 'kr/st';
}

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
