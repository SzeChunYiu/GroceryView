import { auditIngestedUnitFields, type IngestUnitFields, type UnitNormalizationAuditConfidence } from './ingest/transform';
import { unitNormalizationQaSeverity, type UnitNormalizationQaIssueKind, type UnitNormalizationQaSeverity } from './unit-normalizer';

export type PackageEvidence = {
  packageSize: number;
  packageUnit: 'g' | 'ml' | 'piece';
};

export type UnitNormalizationOutlierBucket = 'kg' | 'l' | 'piece';

export type NormalizedUnitPrice = PackageEvidence & {
  value: number;
  comparableUnit: UnitNormalizationOutlierBucket;
};

export type RecipeProductCandidate = {
  productId?: string;
  slug?: string;
  name: string;
  price?: number | string;
  nutritionPerKronaLabel?: string;
  unitPrice?: string;
  store?: string;
  source?: string;
};

export type ParsedRecipeIngredient = {
  rawText: string;
  quantityText: string;
  normalizedName: string;
};

export type RecipeProductMatch = ParsedRecipeIngredient & {
  productId: string;
  productName: string;
  price: number | null;
  priceLabel: string;
  nutritionPerKronaLabel: string | null;
  unitPriceLabel: string;
  storeLabel: string;
  sourceLabel: string;
  matchScore: number;
};

export type PurchaseHistoryProductCandidate = {
  productId?: string;
  slug?: string;
  name: string;
  aliases?: string[];
};

export type PurchaseHistoryProductMatch = {
  productId: string;
  productName: string;
  matchScore: number;
  normalizedQuery: string;
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
  outlierBucket?: UnitNormalizationOutlierBucket;
};

export type UnitNormalizationQaReport = {
  issueCount: number;
  missingUnitCount: number;
  suspiciousPackSizeCount: number;
  suspiciousPackSizeBuckets: Record<UnitNormalizationOutlierBucket, number>;
  inconsistentUnitPriceCount: number;
  issues: UnitNormalizationQaIssue[];
  guardrails: string[];
};

export type DuplicateProductMatchInput = {
  name: string;
  brand?: string | null;
  size?: string | null;
  unit?: string | null;
  ean?: string | null;
  upc?: string | null;
};

export type DuplicateProductMatchKey = {
  ean: string;
  normalizedName: string;
  normalizedBrand: string;
  normalizedSize: string;
  normalizedUnit: string;
};

const recipeQuantityPattern = /^((?:\d+(?:[.,/]\d+)?|\d+\s+\d+\/\d+)\s*(?:kg|g|l|dl|ml|msk|tsk|st|pcs?|cups?|tbsp|tsp)?\s+)/i;
const recipeStopWords = new Set([
  'and',
  'with',
  'for',
  'fresh',
  'chopped',
  'sliced',
  'diced',
  'crushed',
  'organic',
  'ekologisk',
  'hackad',
  'skivad',
  'krossade',
  'färsk'
]);

function normalizePackageAmount(amount: number, unit: string): PackageEvidence | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 'kg') return { packageSize: amount * 1000, packageUnit: 'g' };
  if (unit === 'l') return { packageSize: amount * 1000, packageUnit: 'ml' };
  if (['st', 'pc', 'pcs', 'piece', 'pieces', 'each'].includes(unit)) return { packageSize: amount, packageUnit: 'piece' };
  if (unit === 'g' || unit === 'ml') return { packageSize: amount, packageUnit: unit };
  return null;
}

export function packageEvidenceFromText(text: string): PackageEvidence | null {
  const normalized = text.toLowerCase().replace(/,/g, '.');
  const packageUnitPattern = 'kg|g|l|ml|st|pc|pcs|piece|pieces|each';
  const multipackMatch = normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:x|×)\\s*(\\d+(?:\\.\\d+)?)\\s*(${packageUnitPattern})\\b`));
  if (multipackMatch) {
    const packCount = Number(multipackMatch[1]);
    const packAmount = Number(multipackMatch[2]);
    return normalizePackageAmount(packCount * packAmount, multipackMatch[3]!);
  }

  const match = normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${packageUnitPattern})\\b`));
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

export function normalizeDuplicateProductText(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9åäöæø]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizedDuplicatePackage(size?: string | null, unit?: string | null) {
  const packageEvidence = size ? packageEvidenceFromText(size) : null;
  if (packageEvidence) {
    return {
      normalizedSize: String(packageEvidence.packageSize),
      normalizedUnit: packageEvidence.packageUnit
    };
  }
  return {
    normalizedSize: normalizeDuplicateProductText(size),
    normalizedUnit: normalizeDuplicateProductText(unit)
  };
}

export function duplicateProductMatchKey(input: DuplicateProductMatchInput): DuplicateProductMatchKey {
  const normalizedPackage = normalizedDuplicatePackage(input.size, input.unit);
  return {
    ean: (input.ean ?? input.upc ?? '').replace(/\D/g, ''),
    normalizedName: normalizeDuplicateProductText(input.name),
    normalizedBrand: normalizeDuplicateProductText(input.brand),
    ...normalizedPackage
  };
}

function wordsFromText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9åäöæø]+/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !recipeStopWords.has(word));
}

function ingredientNameFromLine(line: string) {
  return line
    .replace(recipeQuantityPattern, '')
    .replace(/^[-*•\d.)\s]+/, '')
    .trim();
}

function ingredientHintsFromUrl(value: string) {
  const urlMatch = value.match(/https?:\/\/\S+/i);
  if (!urlMatch) return [];

  try {
    const url = new URL(urlMatch[0]);
    return url.pathname
      .split(/[/-]+/)
      .map((part) => part.replace(/\.(html?|php|aspx)$/i, '').trim())
      .filter((part) => part.length > 2);
  } catch {
    return [];
  }
}

export function parseRecipeIngredients(input: string): ParsedRecipeIngredient[] {
  const sourceLines = input
    .split(/\r?\n/)
    .flatMap((line) => line.split(/;|\|/))
    .map((line) => line.trim())
    .filter(Boolean);
  const lines = sourceLines.length > 0 ? sourceLines : ingredientHintsFromUrl(input);
  const parsed = lines
    .filter((line) => !/^https?:\/\//i.test(line))
    .map((line) => {
      const quantityText = line.match(recipeQuantityPattern)?.[0]?.trim() ?? '';
      const normalizedName = ingredientNameFromLine(line);
      return { rawText: line, quantityText, normalizedName };
    })
    .filter((ingredient) => wordsFromText(ingredient.normalizedName).length > 0);

  return parsed.length > 0 ? parsed : ingredientHintsFromUrl(input).map((hint) => ({ rawText: hint, quantityText: '', normalizedName: hint }));
}

export function normalizePurchaseHistoryProductName(value: string) {
  return wordsFromText(value).join(' ');
}

export function matchPurchaseHistoryRowToProduct(productName: string, candidates: readonly PurchaseHistoryProductCandidate[]): PurchaseHistoryProductMatch | null {
  const normalizedQuery = normalizePurchaseHistoryProductName(productName);
  if (!normalizedQuery) return null;
  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  const ranked = candidates
    .map((candidate, index) => {
      const candidateWords = wordsFromText([candidate.name, ...(candidate.aliases ?? [])].join(' '));
      const candidateKey = candidateWords.join(' ');
      const overlap = queryWords.filter((word) => candidateWords.some((candidateWord) => candidateWord.includes(word) || word.includes(candidateWord))).length;
      const directHit = candidateKey.includes(normalizedQuery) || normalizedQuery.includes(candidateKey) ? 5 : 0;
      return { candidate, index, score: overlap * 10 + directHit };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const best = ranked[0];
  if (!best) return null;
  return {
    productId: best.candidate.productId ?? best.candidate.slug ?? normalizedQuery.replace(/\s+/g, '-'),
    productName: best.candidate.name,
    matchScore: best.score,
    normalizedQuery
  };
}

function priceLabelFor(candidate: RecipeProductCandidate) {
  if (typeof candidate.price === 'number') {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(candidate.price);
  }
  return candidate.price || 'price pending';
}

export function suggestRecipeProductMatches(
  ingredients: readonly ParsedRecipeIngredient[],
  candidates: readonly RecipeProductCandidate[],
): RecipeProductMatch[] {
  return ingredients.map((ingredient) => {
    const ingredientWords = wordsFromText(ingredient.normalizedName);
    const ranked = candidates
      .map((candidate, index) => {
        const productWords = wordsFromText(candidate.name);
        const overlap = ingredientWords.filter((word) => productWords.some((productWord) => productWord.includes(word) || word.includes(productWord))).length;
        const directNameHit = productWords.join(' ').includes(ingredientWords.join(' ')) ? 2 : 0;
        return { candidate, index, score: overlap * 10 + directNameHit };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const best = ranked[0]?.candidate ?? candidates[0];
    const bestScore = ranked[0]?.score ?? 0;

    return {
      ...ingredient,
      productId: best?.productId ?? best?.slug ?? ingredient.normalizedName.toLowerCase().replace(/\s+/g, '-'),
      productName: best?.name ?? ingredient.normalizedName,
      price: typeof best?.price === 'number' && Number.isFinite(best.price) ? best.price : null,
      priceLabel: best ? priceLabelFor(best) : 'price pending',
      nutritionPerKronaLabel: best?.nutritionPerKronaLabel ?? null,
      unitPriceLabel: best?.unitPrice ?? 'unit price pending',
      storeLabel: best?.store ?? 'store pending',
      sourceLabel: best?.source ?? 'recipe parser match',
      matchScore: bestScore
    };
  });
}

function qaIssue(
  kind: UnitNormalizationQaIssueKind,
  product: UnitNormalizationQaProductInput,
  detail: string,
  outlierBucket?: UnitNormalizationOutlierBucket
): UnitNormalizationQaIssue {
  return {
    kind,
    severity: unitNormalizationQaSeverity(kind),
    productId: product.productId,
    productName: product.productName,
    packageText: product.packageText || 'Package text missing',
    detail,
    ...(outlierBucket ? { outlierBucket } : {})
  };
}

function packageOutlierBucket(evidence: PackageEvidence): UnitNormalizationOutlierBucket {
  if (evidence.packageUnit === 'g') return 'kg';
  if (evidence.packageUnit === 'ml') return 'l';
  return 'piece';
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
    issues.push(qaIssue(
      'suspicious_pack_size',
      product,
      `Parsed ${evidence.packageSize} ${evidence.packageUnit}, which is outside the expected grocery package range.`,
      packageOutlierBucket(evidence)
    ));
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
  const suspiciousPackSizeIssues = issues.filter((issue) => issue.kind === 'suspicious_pack_size');
  const suspiciousPackSizeBuckets: Record<UnitNormalizationOutlierBucket, number> = { kg: 0, l: 0, piece: 0 };
  for (const issue of suspiciousPackSizeIssues) {
    if (issue.outlierBucket) suspiciousPackSizeBuckets[issue.outlierBucket] += 1;
  }

  return {
    issueCount: issues.length,
    missingUnitCount: issues.filter((issue) => issue.kind === 'missing_unit').length,
    suspiciousPackSizeCount: suspiciousPackSizeIssues.length,
    suspiciousPackSizeBuckets,
    inconsistentUnitPriceCount: issues.filter((issue) => issue.kind === 'inconsistent_unit_price').length,
    issues: issues.slice(0, 12),
    guardrails: [
      'Products with missing units must not receive synthetic comparable prices.',
      'Suspicious pack sizes stay visible for ingestion QA before basket comparison uses them.',
      'Inconsistent unit-price conversions require source review before cheapest-per-unit badges are trusted.'
    ]
  };
}

export type UnitNormalizationAuditInput = IngestUnitFields & {
  sourceName: string;
  productId: string;
  productName: string;
};

export type UnitNormalizationAuditRow = {
  sourceName: string;
  confidence: UnitNormalizationAuditConfidence;
  totalProductCount: number;
  affectedProductCount: number;
  unresolvedConversionCount: number;
  examples: string[];
};

export function buildUnitNormalizationAuditRows(inputs: UnitNormalizationAuditInput[]): UnitNormalizationAuditRow[] {
  const groups = new Map<string, UnitNormalizationAuditInput[]>();
  for (const input of inputs) {
    groups.set(input.sourceName, [...(groups.get(input.sourceName) ?? []), input]);
  }

  return [...groups.entries()].map(([sourceName, rows]) => {
    const unresolved = rows
      .map((row) => ({ row, audit: auditIngestedUnitFields(row) }))
      .filter(({ audit }) => audit.unresolvedReasons.length > 0);
    const affectedProducts = new Set(unresolved.map(({ row }) => row.productId));
    const unresolvedConversionCount = unresolved.reduce((count, { audit }) => count + audit.unresolvedReasons.length, 0);
    const lowConfidenceCount = unresolved.filter(({ audit }) => audit.confidence === 'low').length;
    const unresolvedShare = rows.length === 0 ? 0 : affectedProducts.size / rows.length;
    const confidence: UnitNormalizationAuditConfidence = unresolvedConversionCount === 0
      ? 'high'
      : lowConfidenceCount === 0 && unresolvedShare <= 0.02
        ? 'medium'
        : 'low';

    return {
      sourceName,
      confidence,
      totalProductCount: rows.length,
      affectedProductCount: affectedProducts.size,
      unresolvedConversionCount,
      examples: unresolved.slice(0, 3).map(({ row, audit }) => `${row.productName}: ${audit.unresolvedReasons.join('; ')}`)
    };
  }).sort((a, b) => b.unresolvedConversionCount - a.unresolvedConversionCount || a.sourceName.localeCompare(b.sourceName));
}
