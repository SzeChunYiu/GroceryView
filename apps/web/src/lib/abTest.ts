export type WebAbTestVariant = {
  id: string;
  weight?: number;
};

export type WebAbTestConfig = {
  id: string;
  variants: readonly WebAbTestVariant[];
  salt?: string;
};

export type WebAbTestAssignment = {
  experimentId: string;
  subjectKey: string;
  variantId: string;
  bucket: number;
  assignedAt: string;
};

export type WebAbTestEvent = {
  type: 'ab_exposure' | 'ab_conversion';
  experimentId: string;
  subjectKey: string;
  variantId: string;
  bucket: number;
  eventId: string;
  occurredAt: string;
  conversionId?: string;
  value?: number;
};

export type WebAbTestReadiness = {
  enoughSampleForDecision: boolean;
  note: string;
};

const ASSIGNMENT_KEY_PREFIX = 'groceryview:ab-assignment:';
const EXPOSURE_KEY_PREFIX = 'groceryview:ab-exposure:';
const ANONYMOUS_SUBJECT_KEY = 'groceryview:ab-subject';
const DEFAULT_MIN_SAMPLE_SIZE = 100;

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
}

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomId(prefix: string) {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

export function getOrCreateAbTestSubjectKey() {
  const store = storage();
  if (!store) return 'server-render';
  const existing = store.getItem(ANONYMOUS_SUBJECT_KEY);
  if (existing) return existing;
  const created = randomId('visitor');
  store.setItem(ANONYMOUS_SUBJECT_KEY, created);
  return created;
}

function pickVariant(config: WebAbTestConfig, subjectKey: string) {
  const totalWeight = config.variants.reduce((sum, variant) => sum + (variant.weight ?? 1), 0);
  const bucket = stableHash(`${config.salt ?? config.id}:${config.id}:${subjectKey}`) % 10000;
  const target = (bucket / 10000) * totalWeight;
  let cursor = 0;

  for (const variant of config.variants) {
    cursor += variant.weight ?? 1;
    if (target < cursor) return { variantId: variant.id, bucket };
  }

  return { variantId: config.variants[config.variants.length - 1].id, bucket };
}

export function getAbTestAssignment(
  config: WebAbTestConfig,
  subjectKey = getOrCreateAbTestSubjectKey(),
  now = new Date(),
): WebAbTestAssignment {
  if (!config.id || config.variants.length < 2) throw new Error('A/B tests require an id and at least two variants.');

  const store = storage();
  const assignmentKey = `${ASSIGNMENT_KEY_PREFIX}${config.id}:${subjectKey}`;
  const saved = store?.getItem(assignmentKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as WebAbTestAssignment;
      if (parsed.experimentId === config.id && parsed.subjectKey === subjectKey && config.variants.some((variant) => variant.id === parsed.variantId)) {
        return parsed;
      }
    } catch {
      store?.removeItem(assignmentKey);
    }
  }

  const picked = pickVariant(config, subjectKey);
  const assignment = {
    experimentId: config.id,
    subjectKey,
    variantId: picked.variantId,
    bucket: picked.bucket,
    assignedAt: now.toISOString(),
  };
  store?.setItem(assignmentKey, JSON.stringify(assignment));
  return assignment;
}

export function logAbTestExposure(
  assignment: WebAbTestAssignment,
  emit?: (event: WebAbTestEvent) => void,
  now = new Date(),
) {
  const event: WebAbTestEvent = {
    type: 'ab_exposure',
    experimentId: assignment.experimentId,
    subjectKey: assignment.subjectKey,
    variantId: assignment.variantId,
    bucket: assignment.bucket,
    eventId: randomId('exposure'),
    occurredAt: now.toISOString(),
  };
  storage()?.setItem(`${EXPOSURE_KEY_PREFIX}${assignment.experimentId}:${assignment.subjectKey}`, event.occurredAt);
  emit?.(event);
  return event;
}

export function logAbTestConversion(
  assignment: WebAbTestAssignment,
  conversionId: string,
  options: { value?: number; emit?: (event: WebAbTestEvent) => void; now?: Date; attributionWindowMs?: number } = {},
) {
  const now = options.now ?? new Date();
  const exposedAt = storage()?.getItem(`${EXPOSURE_KEY_PREFIX}${assignment.experimentId}:${assignment.subjectKey}`);
  const windowMs = options.attributionWindowMs ?? 1000 * 60 * 60 * 24 * 14;
  if (exposedAt && now.getTime() - Date.parse(exposedAt) > windowMs) return null;

  const event: WebAbTestEvent = {
    type: 'ab_conversion',
    experimentId: assignment.experimentId,
    subjectKey: assignment.subjectKey,
    variantId: assignment.variantId,
    bucket: assignment.bucket,
    eventId: randomId('conversion'),
    occurredAt: now.toISOString(),
    conversionId,
    ...(options.value !== undefined ? { value: options.value } : {}),
  };
  options.emit?.(event);
  return event;
}

export function describeAbTestReadiness(exposuresByVariant: Record<string, number>, minSampleSize = DEFAULT_MIN_SAMPLE_SIZE): WebAbTestReadiness {
  const exposureCounts = Object.values(exposuresByVariant);
  const enoughSampleForDecision = exposureCounts.length > 1 && exposureCounts.every((count) => count >= minSampleSize);
  return {
    enoughSampleForDecision,
    note: enoughSampleForDecision
      ? 'Enough exposed users for a first read; require a preselected metric and significance check before launch decisions.'
      : `Too early to call: each variant needs at least ${minSampleSize} exposures before judging significance.`,
  };
}
