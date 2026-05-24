import { NextResponse } from 'next/server';
import { featureExperiments, type ExperimentExposureEvent } from '@/lib/feature-experiments';

type ExperimentExposurePayload = {
  events?: unknown;
};

const knownExperimentKeys: ReadonlySet<string> = new Set(featureExperiments.map((experiment) => experiment.key));
const knownVariantKeys: ReadonlySet<string> = new Set(featureExperiments.flatMap((experiment) => experiment.variants.map((variant) => variant.key)));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidGuardrailMetric(value: unknown) {
  return isRecord(value)
    && typeof value.key === 'string'
    && typeof value.label === 'string'
    && typeof value.target === 'string';
}

function isValidExposure(value: unknown): value is ExperimentExposureEvent {
  if (!isRecord(value)) return false;
  return typeof value.experimentKey === 'string'
    && knownExperimentKeys.has(value.experimentKey)
    && typeof value.variantKey === 'string'
    && knownVariantKeys.has(value.variantKey)
    && typeof value.bucket === 'number'
    && Number.isInteger(value.bucket)
    && value.bucket >= 0
    && value.bucket < 100
    && typeof value.route === 'string'
    && value.route.startsWith('/')
    && typeof value.observedAt === 'string'
    && value.analyticsConsent === true
    && Array.isArray(value.guardrailMetrics)
    && value.guardrailMetrics.length > 0
    && value.guardrailMetrics.every(isValidGuardrailMetric);
}

export async function POST(request: Request) {
  let payload: ExperimentExposurePayload;

  try {
    payload = await request.json() as ExperimentExposurePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  if (events.length === 0 || events.length > 20 || !events.every(isValidExposure)) {
    return NextResponse.json({ error: 'Invalid consented experiment exposure batch.' }, { status: 400 });
  }

  return NextResponse.json({
    accepted: events.length,
    guardrails: [
      'accepted only analytics-consented exposure events',
      'no price, ranking, product, or basket data is accepted by this endpoint',
      'kill switch and deterministic assignment live in the typed experiment registry'
    ]
  });
}
