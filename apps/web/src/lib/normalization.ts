export type PackageEvidence = {
  packageSize: number;
  packageUnit: 'g' | 'ml' | 'piece';
};

export type NormalizedUnitPrice = PackageEvidence & {
  value: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

export type UnitNormalizationAuditInput = {
  id: string;
  name: string;
  source: string;
  packageText: string;
  totalPrice?: number | null;
  observedUnitPrice?: number | null;
  observedComparableUnit?: NormalizedUnitPrice['comparableUnit'] | null;
  category?: string;
  brand?: string;
  href?: string;
};

export type UnitNormalizationAuditIssueType =
  | 'missing-package-size'
  | 'suspicious-package-size'
  | 'reported-unit-mismatch'
  | 'unit-price-outlier';

export type UnitNormalizationAuditIssue = {
  type: UnitNormalizationAuditIssueType;
  severity: 'warning' | 'critical';
  message: string;
};

export type UnitNormalizationAuditRow = UnitNormalizationAuditInput & {
  packageEvidence: PackageEvidence | null;
  normalizedUnitPrice: NormalizedUnitPrice | null;
  auditUnitPrice: number | null;
  auditUnit: NormalizedUnitPrice['comparableUnit'] | null;
  medianPeerUnitPrice: number | null;
  issues: UnitNormalizationAuditIssue[];
};

export type UnitNormalizationAuditReport = {
  rowCount: number;
  parsedPackageCount: number;
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  issueRows: UnitNormalizationAuditRow[];
  issueTypeCounts: Record<UnitNormalizationAuditIssueType, number>;
  unitCoverage: Array<{
    unit: NormalizedUnitPrice['comparableUnit'];
    rows: number;
    medianUnitPrice: number | null;
    issueRows: number;
  }>;
  guardrails: string[];
};

function normalizePackageAmount(amount: number, unit: string): PackageEvidence | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 'kg') return { packageSize: amount * 1000, packageUnit: 'g' };
  if (unit === 'l') return { packageSize: amount * 1000, packageUnit: 'ml' };
  if (unit === 'cl') return { packageSize: amount * 10, packageUnit: 'ml' };
  if (['st', 'piece', 'pieces', 'pcs', 'pack', 'x'].includes(unit)) return { packageSize: amount, packageUnit: 'piece' };
  if (unit === 'g' || unit === 'ml') return { packageSize: amount, packageUnit: unit };
  return null;
}

export function packageEvidenceFromText(text: string): PackageEvidence | null {
  const normalized = text.toLowerCase().replace(/,/g, '.');
  const multipackMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(kg|g|l|cl|ml|st|piece|pieces|pcs)\b/);
  if (multipackMatch) {
    const packCount = Number(multipackMatch[1]);
    const packAmount = Number(multipackMatch[2]);
    return normalizePackageAmount(packCount * packAmount, multipackMatch[3]!);
  }

  const slashPackMatch = normalized.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(kg|g|l|cl|ml)\b/);
  if (slashPackMatch) {
    const drainedOrNetAmount = Number(slashPackMatch[2]);
    return normalizePackageAmount(drainedOrNetAmount, slashPackMatch[3]!);
  }

  const matches = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g|l|cl|ml|st|piece|pieces|pcs)\b/g)];
  const match = matches.at(-1);
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

function median(values: number[]) {
  const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function packageSizeIssue(packageEvidence: PackageEvidence): UnitNormalizationAuditIssue | null {
  if (packageEvidence.packageUnit === 'g' && (packageEvidence.packageSize < 5 || packageEvidence.packageSize > 25000)) {
    return {
      type: 'suspicious-package-size',
      severity: packageEvidence.packageSize > 50000 || packageEvidence.packageSize < 1 ? 'critical' : 'warning',
      message: `Parsed ${round(packageEvidence.packageSize)} g, outside the normal grocery package range.`
    };
  }
  if (packageEvidence.packageUnit === 'ml' && (packageEvidence.packageSize < 10 || packageEvidence.packageSize > 50000)) {
    return {
      type: 'suspicious-package-size',
      severity: packageEvidence.packageSize > 100000 || packageEvidence.packageSize < 1 ? 'critical' : 'warning',
      message: `Parsed ${round(packageEvidence.packageSize)} ml, outside the normal grocery package range.`
    };
  }
  if (packageEvidence.packageUnit === 'piece' && (!Number.isInteger(packageEvidence.packageSize) || packageEvidence.packageSize > 120)) {
    return {
      type: 'suspicious-package-size',
      severity: packageEvidence.packageSize > 500 ? 'critical' : 'warning',
      message: `Parsed ${round(packageEvidence.packageSize)} pieces, which needs pack-count review.`
    };
  }
  return null;
}

function relativeDifference(left: number, right: number) {
  if (!Number.isFinite(left) || !Number.isFinite(right) || left <= 0 || right <= 0) return null;
  return Math.abs(left - right) / Math.max(left, right);
}

function emptyIssueCounts(): Record<UnitNormalizationAuditIssueType, number> {
  return {
    'missing-package-size': 0,
    'suspicious-package-size': 0,
    'reported-unit-mismatch': 0,
    'unit-price-outlier': 0
  };
}

export function auditUnitNormalization(inputs: UnitNormalizationAuditInput[]): UnitNormalizationAuditReport {
  const baseRows = inputs.map((input) => {
    const packageEvidence = packageEvidenceFromText(input.packageText);
    const normalizedUnitPrice = normalizeUnitPrice(input.totalPrice ?? Number.NaN, packageEvidence);
    const observedUnitPrice = typeof input.observedUnitPrice === 'number' && Number.isFinite(input.observedUnitPrice) && input.observedUnitPrice > 0
      ? input.observedUnitPrice
      : null;
    const observedComparableUnit = input.observedComparableUnit ?? null;
    const auditUnitPrice = observedUnitPrice ?? normalizedUnitPrice?.value ?? null;
    const auditUnit = observedComparableUnit ?? normalizedUnitPrice?.comparableUnit ?? null;
    const issues: UnitNormalizationAuditIssue[] = [];

    if (!packageEvidence) {
      issues.push({
        type: 'missing-package-size',
        severity: 'warning',
        message: 'No parseable package quantity was found in the product text.'
      });
    } else {
      const sizeIssue = packageSizeIssue(packageEvidence);
      if (sizeIssue) issues.push(sizeIssue);
    }

    if (observedUnitPrice && observedComparableUnit && normalizedUnitPrice && observedComparableUnit === normalizedUnitPrice.comparableUnit) {
      const difference = relativeDifference(observedUnitPrice, normalizedUnitPrice.value);
      if (difference !== null && difference > 0.35) {
        issues.push({
          type: 'reported-unit-mismatch',
          severity: difference > 0.75 ? 'critical' : 'warning',
          message: `Reported unit price differs from package-derived unit price by ${Math.round(difference * 100)}%.`
        });
      }
    }

    return {
      ...input,
      packageEvidence,
      normalizedUnitPrice,
      auditUnitPrice,
      auditUnit,
      medianPeerUnitPrice: null,
      issues
    } satisfies UnitNormalizationAuditRow;
  });

  const peerMedians = new Map<string, number>();
  for (const unit of ['kg', 'l', 'piece'] as const) {
    const prices = baseRows
      .filter((row) => row.auditUnit === unit && typeof row.auditUnitPrice === 'number' && row.auditUnitPrice > 0)
      .map((row) => row.auditUnitPrice!);
    const unitMedian = median(prices);
    if (unitMedian !== null) peerMedians.set(unit, unitMedian);
  }

  const rows = baseRows.map((row) => {
    const medianPeerUnitPrice = row.auditUnit ? peerMedians.get(row.auditUnit) ?? null : null;
    const issues = [...row.issues];
    if (row.auditUnitPrice && medianPeerUnitPrice && medianPeerUnitPrice > 0) {
      const ratio = row.auditUnitPrice / medianPeerUnitPrice;
      if (ratio >= 6 || ratio <= 0.12) {
        issues.push({
          type: 'unit-price-outlier',
          severity: ratio >= 10 || ratio <= 0.05 ? 'critical' : 'warning',
          message: `Unit price ${round(row.auditUnitPrice)} kr/${row.auditUnit} is ${round(ratio)}× the ${row.auditUnit} peer median.`
        });
      }
    }
    return { ...row, medianPeerUnitPrice, issues } satisfies UnitNormalizationAuditRow;
  });

  const issueRows = rows
    .filter((row) => row.issues.length > 0)
    .sort((left, right) => {
      const criticalDelta = Number(right.issues.some((issue) => issue.severity === 'critical')) - Number(left.issues.some((issue) => issue.severity === 'critical'));
      if (criticalDelta !== 0) return criticalDelta;
      return right.issues.length - left.issues.length || left.name.localeCompare(right.name);
    });
  const issueTypeCounts = emptyIssueCounts();
  for (const row of issueRows) {
    for (const issue of row.issues) {
      issueTypeCounts[issue.type] += 1;
    }
  }

  const unitCoverage = (['kg', 'l', 'piece'] as const).map((unit) => ({
    unit,
    rows: rows.filter((row) => row.auditUnit === unit).length,
    medianUnitPrice: peerMedians.get(unit) ?? null,
    issueRows: issueRows.filter((row) => row.auditUnit === unit).length
  }));

  return {
    rowCount: rows.length,
    parsedPackageCount: rows.filter((row) => row.packageEvidence !== null).length,
    issueCount: issueRows.length,
    criticalCount: issueRows.filter((row) => row.issues.some((issue) => issue.severity === 'critical')).length,
    warningCount: issueRows.filter((row) => row.issues.every((issue) => issue.severity === 'warning')).length,
    issueRows,
    issueTypeCounts,
    unitCoverage,
    guardrails: [
      'Rows are audit candidates only; suspicious unit evidence is not hidden from shopper routes until a human or connector fix lands.',
      'Package-derived unit prices are compared only when a parseable package text and positive SEK price are present.',
      'Peer outliers use broad kg/l/piece medians to catch obvious data-quality regressions, not to rank deals.'
    ]
  };
}
