export type ShrinkflationPackUnit = 'g' | 'ml' | 'st';

export type ShrinkflationObservation = Readonly<{
  canonicalProductId: string;
  productName: string;
  observedAt: string;
  packSize: number;
  packUnit: ShrinkflationPackUnit | 'kg' | 'l';
  price: number;
  currency?: string;
  sourceLabel?: string;
  confidence?: number;
}>;

export type ParsedPackageSize = Readonly<{
  size: number;
  unit: ShrinkflationPackUnit;
  label: string;
}>;

export type ShrinkflationCandidate = Readonly<{
  canonicalProductId: string;
  productName: string;
  previousObservedAt: string;
  currentObservedAt: string;
  previousPackSize: number;
  currentPackSize: number;
  packUnit: ShrinkflationPackUnit;
  previousPrice: number;
  currentPrice: number;
  currency: string;
  packSizeDecreasePercent: number;
  priceChangePercent: number;
  unitPriceIncreasePercent: number;
  confidence: number;
  evidenceLabel: string;
}>;

export type ShrinkflationDetectorOptions = Readonly<{
  minPackSizeDecreasePercent?: number;
  priceTolerancePercent?: number;
  minConfidence?: number;
}>;

const unitMultipliers: Record<string, { unit: ShrinkflationPackUnit; multiplier: number }> = {
  g: { unit: 'g', multiplier: 1 },
  gram: { unit: 'g', multiplier: 1 },
  grams: { unit: 'g', multiplier: 1 },
  kg: { unit: 'g', multiplier: 1000 },
  ml: { unit: 'ml', multiplier: 1 },
  cl: { unit: 'ml', multiplier: 10 },
  l: { unit: 'ml', multiplier: 1000 },
  liter: { unit: 'ml', multiplier: 1000 },
  litre: { unit: 'ml', multiplier: 1000 },
  st: { unit: 'st', multiplier: 1 },
  pcs: { unit: 'st', multiplier: 1 },
  pack: { unit: 'st', multiplier: 1 }
};

function roundPercent(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function normalizeUnit(unit: ShrinkflationObservation['packUnit']): { unit: ShrinkflationPackUnit; multiplier: number } {
  const normalized = unit.toLocaleLowerCase('sv-SE');
  const result = unitMultipliers[normalized];
  if (!result) throw new Error(`Unsupported shrinkflation pack unit: ${unit}`);
  return result;
}

function normalizeObservation(observation: ShrinkflationObservation) {
  if (!observation.canonicalProductId.trim()) throw new Error('canonicalProductId is required.');
  if (!observation.productName.trim()) throw new Error('productName is required.');
  if (!Number.isFinite(observation.price) || observation.price < 0) throw new Error('price must be a non-negative finite number.');
  if (!Number.isFinite(observation.packSize) || observation.packSize <= 0) throw new Error('packSize must be a positive finite number.');
  const observedAtMs = Date.parse(observation.observedAt);
  if (!Number.isFinite(observedAtMs)) throw new Error('observedAt must be an ISO date.');
  const unit = normalizeUnit(observation.packUnit);
  return {
    ...observation,
    observedAtMs,
    normalizedPackSize: observation.packSize * unit.multiplier,
    normalizedPackUnit: unit.unit,
    currency: observation.currency ?? 'SEK',
    confidence: observation.confidence ?? 0.75
  };
}

export function parsePackageSizeText(value: string): ParsedPackageSize | null {
  const normalized = value.toLocaleLowerCase('sv-SE').replace(',', '.');
  const multiplied = /(?<count>\d+(?:\.\d+)?)\s*[x×]\s*(?<size>\d+(?:\.\d+)?)\s*(?<unit>kg|g|gram|grams|l|liter|litre|cl|ml|st|pcs|pack)\b/u.exec(normalized);
  const direct = /(?<size>\d+(?:\.\d+)?)\s*(?<unit>kg|g|gram|grams|l|liter|litre|cl|ml|st|pcs|pack)\b/u.exec(normalized);
  const match = multiplied ?? direct;
  if (!match?.groups) return null;

  const count = multiplied?.groups?.count ? Number(multiplied.groups.count) : 1;
  const size = Number(match.groups.size);
  if (!Number.isFinite(count) || !Number.isFinite(size) || count <= 0 || size <= 0) return null;
  const unit = unitMultipliers[match.groups.unit];
  if (!unit) return null;
  const normalizedSize = count * size * unit.multiplier;
  return {
    size: normalizedSize,
    unit: unit.unit,
    label: `${normalizedSize}${unit.unit}`
  };
}

export function detectShrinkflation(
  observations: readonly ShrinkflationObservation[],
  options: ShrinkflationDetectorOptions = {}
): ShrinkflationCandidate[] {
  const minPackSizeDecreasePercent = options.minPackSizeDecreasePercent ?? 3;
  const priceTolerancePercent = options.priceTolerancePercent ?? 0.5;
  const minConfidence = options.minConfidence ?? 0.5;
  const groups = new Map<string, ReturnType<typeof normalizeObservation>[]>();

  for (const observation of observations.map(normalizeObservation)) {
    if (observation.confidence < minConfidence) continue;
    const key = [observation.canonicalProductId, observation.normalizedPackUnit, observation.currency].join('|');
    const group = groups.get(key) ?? [];
    group.push(observation);
    groups.set(key, group);
  }

  const candidates: ShrinkflationCandidate[] = [];
  for (const group of groups.values()) {
    const sorted = group.sort((left, right) => left.observedAtMs - right.observedAtMs || left.price - right.price);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1]!;
      const current = sorted[index]!;
      const packSizeDecreasePercent = ((previous.normalizedPackSize - current.normalizedPackSize) / previous.normalizedPackSize) * 100;
      if (packSizeDecreasePercent < minPackSizeDecreasePercent) continue;

      const priceChangePercent = previous.price === 0 ? 0 : ((current.price - previous.price) / previous.price) * 100;
      if (priceChangePercent < -priceTolerancePercent) continue;

      const previousUnitPrice = previous.price / previous.normalizedPackSize;
      const currentUnitPrice = current.price / current.normalizedPackSize;
      const unitPriceIncreasePercent = previousUnitPrice === 0 ? 0 : ((currentUnitPrice - previousUnitPrice) / previousUnitPrice) * 100;
      candidates.push({
        canonicalProductId: current.canonicalProductId,
        productName: current.productName,
        previousObservedAt: previous.observedAt,
        currentObservedAt: current.observedAt,
        previousPackSize: previous.normalizedPackSize,
        currentPackSize: current.normalizedPackSize,
        packUnit: current.normalizedPackUnit,
        previousPrice: previous.price,
        currentPrice: current.price,
        currency: current.currency,
        packSizeDecreasePercent: roundPercent(packSizeDecreasePercent),
        priceChangePercent: roundPercent(priceChangePercent),
        unitPriceIncreasePercent: roundPercent(unitPriceIncreasePercent),
        confidence: Math.min(previous.confidence, current.confidence),
        evidenceLabel: `${previous.sourceLabel ?? 'previous source row'} → ${current.sourceLabel ?? 'current source row'}`
      });
    }
  }

  return candidates.sort((left, right) => right.unitPriceIncreasePercent - left.unitPriceIncreasePercent || left.productName.localeCompare(right.productName, 'sv'));
}
