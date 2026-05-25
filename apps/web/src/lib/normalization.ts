import { unitNormalizationQaSeverity, type UnitNormalizationQaIssueKind, type UnitNormalizationQaSeverity } from './unit-normalizer';

export type PackageEvidence = {
  packageSize: number;
  packageUnit: 'g' | 'ml' | 'piece';
};

export type NormalizedUnitPrice = PackageEvidence & {
  value: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

export type UnitNormalizationQaProductInput = {
  productId: string;
  productName: string;
  packageText: string | null | undefined;
  price: number | null | undefined;
  reportedUnitPrice?: number | null;
};

export type UnitNormalizationQaIssue = {
  kind: UnitNormalizationQaIssueKind;
  severity: UnitNormalizationQaSeverity;
  productId: string;
  productName: string;
  packageText: string;
  detail: string;
};

export type UnitNormalizationQaReport = {
  issueCount: number;
  missingUnitCount: number;
  suspiciousPackSizeCount: number;
  inconsistentUnitPriceCount: number;
  issues: UnitNormalizationQaIssue[];
  guardrails: string[];
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

function qaIssue(
  kind: UnitNormalizationQaIssueKind,
  product: UnitNormalizationQaProductInput,
  detail: string
): UnitNormalizationQaIssue {
  return {
    kind,
    severity: unitNormalizationQaSeverity(kind),
    productId: product.productId,
    productName: product.productName,
    packageText: product.packageText || 'Package text missing',
    detail
  };
}

export function unitNormalizationQaIssuesForProduct(product: UnitNormalizationQaProductInput): UnitNormalizationQaIssue[] {
  const packageText = product.packageText?.trim() ?? '';
  const evidence = packageText ? packageEvidenceFromText(packageText) : null;
  if (!evidence) {
    return [qaIssue('missing_unit', product, 'No parseable package unit was found, so comparable unit price must stay withheld.')];
  }

  const normalized = typeof product.price === 'number' ? normalizeUnitPrice(product.price, evidence) : null;
  const issues: UnitNormalizationQaIssue[] = [];
  const suspiciousPackSize =
    (evidence.packageUnit === 'g' && (evidence.packageSize < 5 || evidence.packageSize > 10000))
    || (evidence.packageUnit === 'ml' && (evidence.packageSize < 5 || evidence.packageSize > 10000))
    || (evidence.packageUnit === 'piece' && (evidence.packageSize < 1 || evidence.packageSize > 100));

  if (suspiciousPackSize) {
    issues.push(qaIssue('suspicious_pack_size', product, `Parsed ${evidence.packageSize} ${evidence.packageUnit}, which is outside the expected grocery package range.`));
  }

  if (!normalized || normalized.value <= 0 || normalized.value > 10000) {
    issues.push(qaIssue('inconsistent_unit_price', product, 'Normalized unit-price conversion is missing, non-positive, or implausibly high.'));
  } else if (typeof product.reportedUnitPrice === 'number' && product.reportedUnitPrice > 0) {
    const ratio = normalized.value / product.reportedUnitPrice;
    if (ratio < 0.5 || ratio > 2) {
      issues.push(qaIssue('inconsistent_unit_price', product, `Normalized value ${normalized.value.toFixed(2)} differs sharply from reported unit price ${product.reportedUnitPrice.toFixed(2)}.`));
    }
  }

  return issues;
}

export function buildUnitNormalizationQaReport(products: UnitNormalizationQaProductInput[]): UnitNormalizationQaReport {
  const issues = products.flatMap(unitNormalizationQaIssuesForProduct);
  return {
    issueCount: issues.length,
    missingUnitCount: issues.filter((issue) => issue.kind === 'missing_unit').length,
    suspiciousPackSizeCount: issues.filter((issue) => issue.kind === 'suspicious_pack_size').length,
    inconsistentUnitPriceCount: issues.filter((issue) => issue.kind === 'inconsistent_unit_price').length,
    issues: issues.slice(0, 12),
    guardrails: [
      'Products with missing units must not receive synthetic comparable prices.',
      'Suspicious pack sizes stay visible for ingestion QA before basket comparison uses them.',
      'Inconsistent unit-price conversions require source review before cheapest-per-unit badges are trusted.'
    ]
  };
}
