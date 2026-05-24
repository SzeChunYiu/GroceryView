export type WebAbVariant = { key: string; weight: number };
export type WebAbAssignment = { experiment: string; subject: string; variant: string; bucket: number };

function hash(input: string) {
  let value = 2166136261;
  for (const char of input) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function assignWebAbBucket(experiment: string, subject: string, variants: WebAbVariant[]): WebAbAssignment {
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

export function exposurePayload(assignment: WebAbAssignment) {
  return { ...assignment, event: 'exposure' as const, exposedAt: new Date().toISOString() };
}

export function conversionPayload(assignment: WebAbAssignment, conversion: string) {
  return { ...assignment, event: 'conversion' as const, conversion, convertedAt: new Date().toISOString() };
}

export function significanceCopy(exposures: number, conversions: number) {
  if (exposures < 100 || conversions < 20) return 'Early read only — not enough sample for significance.';
  return 'Do not call a winner until the experiment has been checked with a statistical test.';
}
