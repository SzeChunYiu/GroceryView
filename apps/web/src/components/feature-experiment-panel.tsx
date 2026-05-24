'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  assignFeatureExperiment,
  buildExperimentExposureEvent,
  experimentByKey,
  type ExperimentAssignment
} from '@/lib/feature-experiments';

const consentStorageKey = 'groceryview:consent:state';
const experimentUnitStorageKey = 'groceryview:experiments:assignment-unit';
const exposureEndpoint = '/api/analytics/experiment-exposures';

function assignmentUnit() {
  let unit = window.localStorage.getItem(experimentUnitStorageKey);
  if (unit) return unit;
  unit = crypto.randomUUID();
  window.localStorage.setItem(experimentUnitStorageKey, unit);
  return unit;
}

function hasAnalyticsConsent() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(consentStorageKey) || 'null') as { categories?: { analytics?: boolean } } | null;
    return parsed?.categories?.analytics === true;
  } catch {
    return false;
  }
}

function postExposure(assignment: ExperimentAssignment, analyticsConsent: boolean) {
  if (!analyticsConsent) return;
  const payload = JSON.stringify({
    events: [buildExperimentExposureEvent(assignment, '/', analyticsConsent)]
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(exposureEndpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(exposureEndpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

export function FeatureExperimentPanel() {
  const experiment = useMemo(() => experimentByKey('home-hero-copy-layout-v1'), []);
  const controlAssignment = useMemo(() => assignFeatureExperiment(experiment, 'server-control'), [experiment]);
  const [assignment, setAssignment] = useState<ExperimentAssignment>(controlAssignment);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    const consent = hasAnalyticsConsent();
    const assigned = assignFeatureExperiment(experiment, assignmentUnit());
    setAnalyticsConsent(consent);
    setAssignment(assigned);
    postExposure(assigned, consent);
  }, [experiment]);

  const variant = assignment.variant;
  const isSourceLed = variant.layout === 'source-led';

  return (
    <section
      aria-label="Feature experiment guardrails"
      className={`mt-6 rounded-[1.75rem] border p-5 shadow-sm ${isSourceLed ? 'border-cyan-200 bg-cyan-50' : 'border-emerald-200 bg-white/90'}`}
      data-experiment={assignment.experimentKey}
      data-experiment-reason={assignment.reason}
      data-experiment-variant={assignment.variantKey}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Typed feature experiment</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{variant.headline}</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{variant.body}</p>
          <p className="mt-2 text-xs font-bold text-slate-600">
            Variant {variant.label} · bucket {assignment.bucket} · {analyticsConsent ? 'analytics-consented exposure logged' : 'analytics consent missing, exposure not posted'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={variant.primaryCtaHref}>{variant.primaryCtaLabel}</Link>
          <Link className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800" href={variant.secondaryCtaHref}>{variant.secondaryCtaLabel}</Link>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {assignment.guardrailMetrics.map((metric) => (
          <div className="rounded-2xl bg-white/80 p-3" key={metric.key}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-700">{metric.target}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
