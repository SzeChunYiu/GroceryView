export type AbTestVariant = {
  id: string;
  weight?: number;
};

export type AbTestConfig = {
  id: string;
  variants: readonly AbTestVariant[];
  salt?: string;
};

export type AbTestAssignment = {
  experimentId: string;
  subjectKey: string;
  variantId: string;
  bucket: number;
  assignedAt: string;
};

export type AbTestExposureEvent = {
  type: 'ab_exposure';
  experimentId: string;
  subjectKey: string;
  variantId: string;
  bucket: number;
  exposedAt: string;
  context?: Record<string, string | number | boolean>;
};

export type AbTestConversionEvent = {
  type: 'ab_conversion';
  experimentId: string;
  subjectKey: string;
  variantId: string;
  bucket: number;
  conversionId: string;
  value?: number;
  exposedAt?: string;
  convertedAt: string;
};

export type AbTestVariantMetrics = {
  variantId: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
  liftVsControl: number | null;
  zScoreVsControl: number | null;
  significantVsControl: boolean;
  note: string;
};

export type AbTestSummary = {
  experimentId: string;
  minSampleSize: number;
  confidenceLevel: '95%';
  totalExposures: number;
  enoughSampleForRead: boolean;
  variants: AbTestVariantMetrics[];
};

const DEFAULT_MIN_SAMPLE_SIZE = 100;
const SIGNIFICANT_Z_95 = 1.96;
const DEFAULT_ATTRIBUTION_WINDOW_MS = 1000 * 60 * 60 * 24 * 14;

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function assertUsableConfig(config: AbTestConfig) {
  if (!config.id.trim()) throw new Error('A/B test id is required.');
  if (config.variants.length < 2) throw new Error('A/B tests require at least two variants.');
  const ids = new Set<string>();
  for (const variant of config.variants) {
    if (!variant.id.trim()) throw new Error('A/B test variant id is required.');
    if (ids.has(variant.id)) throw new Error(`Duplicate A/B test variant id: ${variant.id}`);
    ids.add(variant.id);
    if (variant.weight !== undefined && (!Number.isFinite(variant.weight) || variant.weight <= 0)) {
      throw new Error(`A/B test variant ${variant.id} has an invalid weight.`);
    }
  }
}

export function assignAbTestVariant(config: AbTestConfig, subjectKey: string, now = new Date()): AbTestAssignment {
  assertUsableConfig(config);
  if (!subjectKey.trim()) throw new Error('A/B test subject key is required.');

  const totalWeight = config.variants.reduce((sum, variant) => sum + (variant.weight ?? 1), 0);
  const bucket = stableHash(`${config.salt ?? config.id}:${config.id}:${subjectKey}`) % 10000;
  const target = (bucket / 10000) * totalWeight;
  let cursor = 0;

  for (const variant of config.variants) {
    cursor += variant.weight ?? 1;
    if (target < cursor) {
      return {
        experimentId: config.id,
        subjectKey,
        variantId: variant.id,
        bucket,
        assignedAt: now.toISOString(),
      };
    }
  }

  const fallback = config.variants[config.variants.length - 1];
  return {
    experimentId: config.id,
    subjectKey,
    variantId: fallback.id,
    bucket,
    assignedAt: now.toISOString(),
  };
}

export function createAbTestExposure(
  assignment: AbTestAssignment,
  context?: AbTestExposureEvent['context'],
  now = new Date(),
): AbTestExposureEvent {
  return {
    type: 'ab_exposure',
    experimentId: assignment.experimentId,
    subjectKey: assignment.subjectKey,
    variantId: assignment.variantId,
    bucket: assignment.bucket,
    exposedAt: now.toISOString(),
    ...(context ? { context } : {}),
  };
}

export function attributeAbTestConversion(options: {
  assignment: AbTestAssignment;
  conversionId: string;
  exposure?: Pick<AbTestExposureEvent, 'exposedAt'>;
  value?: number;
  now?: Date;
  attributionWindowMs?: number;
}): AbTestConversionEvent | null {
  const now = options.now ?? new Date();
  const windowMs = options.attributionWindowMs ?? DEFAULT_ATTRIBUTION_WINDOW_MS;
  const exposedAt = options.exposure?.exposedAt;

  if (exposedAt) {
    const exposureTime = Date.parse(exposedAt);
    if (!Number.isFinite(exposureTime) || now.getTime() - exposureTime > windowMs) return null;
  }

  return {
    type: 'ab_conversion',
    experimentId: options.assignment.experimentId,
    subjectKey: options.assignment.subjectKey,
    variantId: options.assignment.variantId,
    bucket: options.assignment.bucket,
    conversionId: options.conversionId,
    ...(options.value !== undefined ? { value: options.value } : {}),
    ...(exposedAt ? { exposedAt } : {}),
    convertedAt: now.toISOString(),
  };
}

export function summarizeAbTestResults(options: {
  experimentId: string;
  exposuresByVariant: Record<string, number>;
  conversionsByVariant: Record<string, number>;
  controlVariantId?: string;
  minSampleSize?: number;
}): AbTestSummary {
  const minSampleSize = options.minSampleSize ?? DEFAULT_MIN_SAMPLE_SIZE;
  const variantIds = Array.from(new Set([...Object.keys(options.exposuresByVariant), ...Object.keys(options.conversionsByVariant)]));
  const controlVariantId = options.controlVariantId ?? variantIds[0];
  const controlExposures = options.exposuresByVariant[controlVariantId] ?? 0;
  const controlConversions = options.conversionsByVariant[controlVariantId] ?? 0;
  const controlRate = controlExposures > 0 ? controlConversions / controlExposures : 0;

  const variants = variantIds.map((variantId) => {
    const exposures = options.exposuresByVariant[variantId] ?? 0;
    const conversions = options.conversionsByVariant[variantId] ?? 0;
    const conversionRate = exposures > 0 ? conversions / exposures : 0;
    const hasEnoughSample = exposures >= minSampleSize && controlExposures >= minSampleSize;
    const liftVsControl = variantId === controlVariantId || controlRate === 0 ? null : (conversionRate - controlRate) / controlRate;
    const pooledRate = exposures + controlExposures > 0 ? (conversions + controlConversions) / (exposures + controlExposures) : 0;
    const standardError = pooledRate > 0 && pooledRate < 1
      ? Math.sqrt(pooledRate * (1 - pooledRate) * ((1 / Math.max(exposures, 1)) + (1 / Math.max(controlExposures, 1))))
      : 0;
    const zScoreVsControl = variantId === controlVariantId || standardError === 0 ? null : (conversionRate - controlRate) / standardError;
    const significantVsControl = hasEnoughSample && zScoreVsControl !== null && Math.abs(zScoreVsControl) >= SIGNIFICANT_Z_95;

    return {
      variantId,
      exposures,
      conversions,
      conversionRate,
      liftVsControl,
      zScoreVsControl,
      significantVsControl,
      note: hasEnoughSample
        ? (significantVsControl ? '95% z-test threshold met; still confirm the metric and experiment design.' : 'Sample size is adequate, but no 95% significant difference is detected.')
        : `Too early to call: needs at least ${minSampleSize} exposures per compared variant.`,
    };
  });

  return {
    experimentId: options.experimentId,
    minSampleSize,
    confidenceLevel: '95%',
    totalExposures: variants.reduce((sum, variant) => sum + variant.exposures, 0),
    enoughSampleForRead: variants.length > 1 && variants.every((variant) => variant.exposures >= minSampleSize),
    variants,
  };
}
