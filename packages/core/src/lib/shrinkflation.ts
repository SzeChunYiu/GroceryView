export type ShrinkflationObservation = {
  canonicalProductId: string;
  productName: string;
  observedAt: string;
  price: number;
  packageSize: number;
  packageUnit: string;
  chainId?: string;
  sourceLabel?: string;
  sourceConfidence?: number;
};

export type NormalizedPackageSize = {
  value: number;
  unit: 'g' | 'ml' | 'each';
  label: string;
};

export type ShrinkflationSignal = {
  canonicalProductId: string;
  productName: string;
  chainId?: string;
  sourceLabel?: string;
  previous: ShrinkflationSignalPoint;
  current: ShrinkflationSignalPoint;
  packageDecreasePercent: number;
  priceChangePercent: number;
  unitPriceChangePercent: number;
  severity: 'watch' | 'likely' | 'high';
  confidence: 'low' | 'medium' | 'high';
  reasonCodes: Array<'package_size_down' | 'price_same' | 'price_up' | 'unit_price_up'>;
};

export type ShrinkflationSignalPoint = {
  observedAt: string;
  price: number;
  packageSize: number;
  packageUnit: string;
  normalizedPackageSize: NormalizedPackageSize;
  unitPrice: number;
};

export type DetectShrinkflationOptions = {
  /** Allows tiny shelf-price differences, e.g. rounding from campaign math. */
  priceTolerancePercent?: number;
  /** Ignore very small packaging moves that are usually data noise. */
  minimumPackageDecreasePercent?: number;
};

type ParsedObservation = ShrinkflationObservation & {
  observedAtMs: number;
  normalizedPackageSize: NormalizedPackageSize;
  unitPrice: number;
  comparisonScope: string;
};

const UNIT_NORMALIZERS: Record<string, { unit: NormalizedPackageSize['unit']; factor: number }> = {
  g: { unit: 'g', factor: 1 },
  gram: { unit: 'g', factor: 1 },
  grams: { unit: 'g', factor: 1 },
  kg: { unit: 'g', factor: 1000 },
  hg: { unit: 'g', factor: 100 },
  ml: { unit: 'ml', factor: 1 },
  cl: { unit: 'ml', factor: 10 },
  dl: { unit: 'ml', factor: 100 },
  l: { unit: 'ml', factor: 1000 },
  liter: { unit: 'ml', factor: 1000 },
  litre: { unit: 'ml', factor: 1000 },
  st: { unit: 'each', factor: 1 },
  styck: { unit: 'each', factor: 1 },
  each: { unit: 'each', factor: 1 },
  pack: { unit: 'each', factor: 1 },
  frp: { unit: 'each', factor: 1 }
};

export function normalizePackageSize(packageSize: number, packageUnit: string): NormalizedPackageSize | null {
  const unit = UNIT_NORMALIZERS[packageUnit.trim().toLowerCase().replace(/\./g, '')];
  if (!unit || !Number.isFinite(packageSize) || packageSize <= 0) return null;
  const value = round(packageSize * unit.factor, 4);
  return { value, unit: unit.unit, label: `${formatNumber(value)} ${unit.unit}` };
}

export function detectShrinkflation(
  observations: readonly ShrinkflationObservation[],
  options: DetectShrinkflationOptions = {}
): ShrinkflationSignal[] {
  const priceTolerancePercent = options.priceTolerancePercent ?? 0;
  const minimumPackageDecreasePercent = options.minimumPackageDecreasePercent ?? 1;
  const parsed = observations.flatMap((observation): ParsedObservation[] => {
    const observedAtMs = Date.parse(observation.observedAt);
    const normalizedPackageSize = normalizePackageSize(observation.packageSize, observation.packageUnit);
    if (
      !observation.canonicalProductId.trim() ||
      !observation.productName.trim() ||
      !Number.isFinite(observedAtMs) ||
      !Number.isFinite(observation.price) ||
      observation.price <= 0 ||
      normalizedPackageSize == null
    ) {
      return [];
    }

    return [{
      ...observation,
      observedAtMs,
      normalizedPackageSize,
      unitPrice: observation.price / normalizedPackageSize.value,
      comparisonScope: observation.chainId?.trim() || observation.sourceLabel?.trim() || 'market'
    }];
  });

  const groups = new Map<string, ParsedObservation[]>();
  for (const observation of parsed) {
    const key = `${observation.canonicalProductId}::${observation.comparisonScope}::${observation.normalizedPackageSize.unit}`;
    const rows = groups.get(key) ?? [];
    rows.push(observation);
    groups.set(key, rows);
  }

  const signals: ShrinkflationSignal[] = [];
  for (const rows of groups.values()) {
    const sorted = rows.sort((a, b) => a.observedAtMs - b.observedAtMs);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const packageDecreasePercent = percentChange(previous.normalizedPackageSize.value, current.normalizedPackageSize.value) * -1;
      const priceChangePercent = percentChange(previous.price, current.price);
      const unitPriceChangePercent = percentChange(previous.unitPrice, current.unitPrice);
      const priceFloor = previous.price * (1 - Math.max(0, priceTolerancePercent) / 100);

      if (
        packageDecreasePercent < minimumPackageDecreasePercent ||
        current.price < priceFloor ||
        unitPriceChangePercent <= 0
      ) {
        continue;
      }

      signals.push({
        canonicalProductId: current.canonicalProductId,
        productName: current.productName,
        chainId: current.chainId,
        sourceLabel: current.sourceLabel,
        previous: signalPoint(previous),
        current: signalPoint(current),
        packageDecreasePercent: round(packageDecreasePercent),
        priceChangePercent: round(priceChangePercent),
        unitPriceChangePercent: round(unitPriceChangePercent),
        severity: severityFor(packageDecreasePercent, priceChangePercent),
        confidence: confidenceFor(previous.sourceConfidence, current.sourceConfidence),
        reasonCodes: [
          'package_size_down',
          current.price > previous.price ? 'price_up' : 'price_same',
          'unit_price_up'
        ]
      });
    }
  }

  return signals.sort((a, b) => b.unitPriceChangePercent - a.unitPriceChangePercent);
}

function signalPoint(observation: ParsedObservation): ShrinkflationSignalPoint {
  return {
    observedAt: observation.observedAt,
    price: round(observation.price),
    packageSize: observation.packageSize,
    packageUnit: observation.packageUnit,
    normalizedPackageSize: observation.normalizedPackageSize,
    unitPrice: round(observation.unitPrice, 4)
  };
}

function percentChange(previous: number, current: number): number {
  if (previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

function severityFor(packageDecreasePercent: number, priceChangePercent: number): ShrinkflationSignal['severity'] {
  if (packageDecreasePercent >= 12 || priceChangePercent >= 5) return 'high';
  if (packageDecreasePercent >= 5 || priceChangePercent > 0) return 'likely';
  return 'watch';
}

function confidenceFor(previous?: number, current?: number): ShrinkflationSignal['confidence'] {
  const score = Math.min(previous ?? 0.5, current ?? 0.5);
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
