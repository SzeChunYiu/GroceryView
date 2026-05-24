export type ExperimentKey = 'home-hero-copy-layout-v1';
export type ExperimentVariantKey = 'control' | 'source-first';

export type ExperimentGuardrailMetric = {
  key: string;
  label: string;
  target: string;
};

export type ExperimentVariant = {
  key: ExperimentVariantKey;
  label: string;
  weight: number;
  headline: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  layout: 'compact' | 'source-led';
};

export type FeatureExperiment = {
  key: ExperimentKey;
  enabled: boolean;
  killSwitch: boolean;
  description: string;
  salt: string;
  consentCategory: 'analytics';
  deterministicUnit: 'anonymous-device-or-user-id';
  scope: 'ui-copy-layout-only';
  guardrailMetrics: ExperimentGuardrailMetric[];
  variants: readonly ExperimentVariant[];
};

export type ExperimentAssignment = {
  experimentKey: ExperimentKey;
  variantKey: ExperimentVariantKey;
  variant: ExperimentVariant;
  reason: 'assigned' | 'control-kill-switch' | 'control-disabled';
  bucket: number;
  guardrailMetrics: ExperimentGuardrailMetric[];
};

export type ExperimentExposureEvent = {
  experimentKey: ExperimentKey;
  variantKey: ExperimentVariantKey;
  bucket: number;
  route: string;
  observedAt: string;
  analyticsConsent: boolean;
  guardrailMetrics: ExperimentGuardrailMetric[];
};

export const featureExperiments: readonly FeatureExperiment[] = [
  {
    key: 'home-hero-copy-layout-v1',
    enabled: true,
    killSwitch: false,
    description: 'Homepage hero copy/layout experiment. It changes calls-to-action and source-proof presentation only; price, ranking, and data logic are unchanged.',
    salt: '2026-05-home-hero-copy-layout',
    consentCategory: 'analytics',
    deterministicUnit: 'anonymous-device-or-user-id',
    scope: 'ui-copy-layout-only',
    guardrailMetrics: [
      { key: 'no_price_data_logic', label: 'No price/data logic mutation', target: 'variant changes copy, CTA order, and layout only' },
      { key: 'analytics_consent_required', label: 'Consent-gated exposure logging', target: 'exposures post only after analytics consent' },
      { key: 'deterministic_assignment', label: 'Stable assignment', target: 'same unit and salt resolve to same variant' },
      { key: 'kill_switch_ready', label: 'Kill switch', target: 'killSwitch true forces control before logging' }
    ],
    variants: [
      {
        key: 'control',
        label: 'Control',
        weight: 50,
        headline: 'Readable prices, explicit sources, zero placeholder rows.',
        body: 'GroceryView renders verified prices and source evidence first, while private or unavailable features fail closed.',
        primaryCtaLabel: 'Compare chain prices',
        primaryCtaHref: '/compare',
        secondaryCtaLabel: 'Browse stores',
        secondaryCtaHref: '/stores',
        layout: 'compact'
      },
      {
        key: 'source-first',
        label: 'Source-first',
        weight: 50,
        headline: 'Compare groceries with source proof before every click.',
        body: 'A copy/layout experiment highlights verified source trails and confidence guardrails without changing prices, rankings, or coverage.',
        primaryCtaLabel: 'Inspect data sources',
        primaryCtaHref: '/data-sources',
        secondaryCtaLabel: 'Compare chain prices',
        secondaryCtaHref: '/compare',
        layout: 'source-led'
      }
    ]
  }
] as const;

export function experimentByKey(key: ExperimentKey): FeatureExperiment {
  const experiment = featureExperiments.find((candidate) => candidate.key === key);
  if (!experiment) throw new Error(`Unknown experiment: ${key}`);
  return experiment;
}

export function deterministicExperimentBucket(experiment: FeatureExperiment, assignmentUnit: string): number {
  const input = `${experiment.salt}:${experiment.key}:${assignmentUnit}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 100;
}

export function assignFeatureExperiment(experiment: FeatureExperiment, assignmentUnit: string): ExperimentAssignment {
  const control = experiment.variants[0];
  const bucket = deterministicExperimentBucket(experiment, assignmentUnit || 'anonymous');

  if (!experiment.enabled) {
    return { experimentKey: experiment.key, variantKey: control.key, variant: control, reason: 'control-disabled', bucket, guardrailMetrics: experiment.guardrailMetrics };
  }

  if (experiment.killSwitch) {
    return { experimentKey: experiment.key, variantKey: control.key, variant: control, reason: 'control-kill-switch', bucket, guardrailMetrics: experiment.guardrailMetrics };
  }

  let cumulativeWeight = 0;
  const selected = experiment.variants.find((variant) => {
    cumulativeWeight += variant.weight;
    return bucket < cumulativeWeight;
  }) ?? control;

  return { experimentKey: experiment.key, variantKey: selected.key, variant: selected, reason: 'assigned', bucket, guardrailMetrics: experiment.guardrailMetrics };
}

export function buildExperimentExposureEvent(assignment: ExperimentAssignment, route: string, analyticsConsent: boolean): ExperimentExposureEvent {
  return {
    experimentKey: assignment.experimentKey,
    variantKey: assignment.variantKey,
    bucket: assignment.bucket,
    route,
    observedAt: new Date().toISOString(),
    analyticsConsent,
    guardrailMetrics: assignment.guardrailMetrics
  };
}
