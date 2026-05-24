export type AbVariant = { key: string; weight: number };
export type AbAssignment = { experiment: string; subject: string; variant: string; bucket: number };
export type AbExposure = AbAssignment & { event: 'exposure'; exposedAt: string };
export type AbConversion = AbAssignment & { event: 'conversion'; conversion: string; convertedAt: string };

function hash(input: string) {
  let value = 2166136261;
  for (const char of input) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function assignAbBucket(experiment: string, subject: string, variants: AbVariant[]): AbAssignment {
  const totalWeight = variants.reduce((sum, variant) => sum + Math.max(0, variant.weight), 0);
  if (!experiment || !subject || totalWeight <= 0) throw new Error('experiment, subject, and positive variant weights are required');

  const bucket = hash(`${experiment}:${subject}`) / 0xffffffff;
  let cursor = 0;
  for (const variant of variants) {
    cursor += Math.max(0, variant.weight) / totalWeight;
    if (bucket <= cursor) return { experiment, subject, variant: variant.key, bucket };
  }
  return { experiment, subject, variant: variants[variants.length - 1]!.key, bucket };
}

export function logAbExposure(assignment: AbAssignment, exposedAt = new Date().toISOString()): AbExposure {
  return { ...assignment, event: 'exposure', exposedAt };
}

export function attributeAbConversion(assignment: AbAssignment, conversion: string, convertedAt = new Date().toISOString()): AbConversion {
  return { ...assignment, event: 'conversion', conversion, convertedAt };
}

export function summarizeSignificance(conversions: number, exposures: number) {
  if (exposures < 100 || conversions < 20) return 'directional only: sample size is below the minimum for significance claims';
  return 'review with a statistical test before claiming significance';
}
