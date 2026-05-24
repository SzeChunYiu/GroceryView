import { createHash } from 'node:crypto';
import type { QueryExecutor } from '../database/postgres-query-executor.service.js';

export const FEATURE_FLAG_QUERY_KEY = 'feature';
export const FEATURE_FLAG_HEADER_KEY = 'x-groceryview-feature';

export type FeatureFlag = {
  featureKey: string;
  enabled: boolean;
  rolloutPercent: number;
};

export type FeatureFlagRow = {
  feature_key: string;
  enabled: boolean;
  rollout_percent: number;
};

export type FeatureCohortInput = {
  ip?: string;
  authorization?: string;
  userId?: string;
  requestId?: string;
  forwardedFor?: string;
};

export type FeatureGateDecision = {
  allowed: boolean;
  reason: 'feature-missing' | 'feature-disabled' | 'outside-rollout' | 'rollout-granted';
};

const DEFAULT_FEATURE_TTL_MS = 5_000;

type CachedFeatureFlag = {
  value: FeatureFlag | null;
  expiresAt: number;
};

const featureCache = new Map<string, CachedFeatureFlag>();

function percentBucket(input: string): number {
  const digest = createHash('sha256').update(input).digest('hex');
  return Number.parseInt(digest.slice(0, 8), 16) % 100;
}

export function resolveFeatureIdentifier(searchParams: URLSearchParams, headers: Record<string, string | string[] | undefined>): string | null {
  const headerFeature = headers[FEATURE_FLAG_HEADER_KEY];
  if (typeof headerFeature === 'string' && headerFeature.trim()) {
    return headerFeature.trim();
  }

  if (Array.isArray(headerFeature) && headerFeature.length > 0) {
    const candidate = headerFeature[0]?.trim();
    return candidate ? candidate : null;
  }

  const queryFeature = searchParams.get(FEATURE_FLAG_QUERY_KEY);
  return queryFeature && queryFeature.trim().length > 0 ? queryFeature.trim() : null;
}

export function resolveFeatureCohort(input: FeatureCohortInput): string {
  if (input.userId?.trim()) {
    return `user:${input.userId}`;
  }
  if (input.authorization?.trim()) {
    return `auth:${input.authorization}`;
  }
  if (input.requestId?.trim()) {
    return `request:${input.requestId}`;
  }
  if (input.forwardedFor?.trim()) {
    return `ip:${input.forwardedFor.split(',')[0]?.trim()}`;
  }
  if (input.ip?.trim()) {
    return `ip:${input.ip}`;
  }

  return 'anonymous';
}

function isInRollout(featureKey: string, rolloutPercent: number, cohort: string): boolean {
  if (rolloutPercent <= 0) return false;
  if (rolloutPercent >= 100) return true;

  const bucket = percentBucket(`${featureKey}::${cohort}`);
  return bucket < rolloutPercent;
}

async function fetchFeatureFlag(db: QueryExecutor, featureKey: string): Promise<FeatureFlag | null> {
  const now = Date.now();
  const cached = featureCache.get(featureKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const rows = await db.query<FeatureFlagRow>(
    `select feature_key, enabled, rollout_percent
       from feature_flags
      where feature_key = $1`,
    [featureKey]
  );

  const row = rows[0];
  const parsed = row
    ? {
        featureKey: row.feature_key,
        enabled: Boolean(row.enabled),
        rolloutPercent: Math.max(0, Math.min(100, Number(row.rollout_percent) || 0))
      }
    : null;

  featureCache.set(featureKey, {
    value: parsed,
    expiresAt: now + DEFAULT_FEATURE_TTL_MS
  });

  return parsed;
}

export async function evaluateFeatureFlagRequest(
  db: QueryExecutor,
  featureKey: string,
  cohort: FeatureCohortInput
): Promise<FeatureGateDecision> {
  if (!featureKey) {
    return { allowed: true, reason: 'feature-missing' };
  }

  const feature = await fetchFeatureFlag(db, featureKey);
  if (!feature || !feature.enabled) {
    return { allowed: false, reason: 'feature-disabled' };
  }

  const allowed = isInRollout(feature.featureKey, feature.rolloutPercent, resolveFeatureCohort(cohort));
  return {
    allowed,
    reason: allowed ? 'rollout-granted' : 'outside-rollout'
  };
}

export async function isFeatureEnabled(db: QueryExecutor, featureKey: string, cohort: FeatureCohortInput): Promise<boolean> {
  const decision = await evaluateFeatureFlagRequest(db, featureKey, cohort);
  return decision.allowed;
}
