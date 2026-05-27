import Link from 'next/link';
import { Card, DashboardHero, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';
import {
  buildIcelandLaunchPlanSummary,
  icelandCompetitorTeardown,
  icelandLaunchCandidates,
  icelandLaunchGuardrails,
  icelandLaunchPhases,
  icelandLaunchSources
} from '@/lib/iceland-launch-plan';
import { routeMetadata } from '@/lib/seo';

const statusLabels = {
  verified_reference: 'Verified reference',
  needs_access_review: 'Access review',
  blocked_until_connector: 'Connector gated'
} as const;

const statusTones = {
  verified_reference: 'success',
  needs_access_review: 'warning',
  blocked_until_connector: 'neutral'
} as const;

export function generateMetadata() {
  return routeMetadata({
    path: '/iceland/launch-plan',
    noIndex: true,
    noIndexFollow: true,
    title: 'Iceland market launch plan | GroceryView',
    description:
      'Evidence-backed Iceland market launch plan covering Verdgattin, ASÍ, Nappið, Icelandic grocery chains, source access, and terminal UX wedge.'
  });
}

export default function IcelandLaunchPlanPage() {
  const summary = buildIcelandLaunchPlanSummary();

  return (
    <PageShell>
      <DashboardHero
        actions={
          <>
            <StatusBadge tone="warning">No live ISK claims</StatusBadge>
            <StatusBadge tone="success">Evidence backed</StatusBadge>
          </>
        }
        eyebrow="Iceland launch plan"
        title="Terminal UX over an 80-staple comparator"
      >
        <p>
          GroceryView should enter Iceland by matching the public staple-comparison mental model first, then win on a richer terminal workflow: source readiness, freshness, chain/category views, and explicit claim boundaries.
        </p>
      </DashboardHero>

      <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Iceland launch summary">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Sources mapped</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{summary.sourceCount}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">references, apps, and retailers</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Verified references</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{summary.verifiedReferenceCount}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">usable as planning evidence</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Access reviews</p>
          <p className="mt-2 text-3xl font-black text-amber-800">{summary.accessReviewCount}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">before ingestion work</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Candidate work</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{summary.candidateCount}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">proof-gated, not auto-opened</p>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" aria-label="Competitor teardown">
        <Card>
          <Eyebrow>Competitor teardown</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Why the wedge is workflow depth</h2>
          <div className="mt-4 grid gap-4">
            {icelandCompetitorTeardown.map((competitor) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={competitor.name}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-slate-950">{competitor.name}</h3>
                  <StatusBadge>{competitor.format}</StatusBadge>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700"><span className="font-black text-slate-950">Strength:</span> {competitor.strength}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700"><span className="font-black text-slate-950">Gap:</span> {competitor.gap}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900"><span className="font-black">GroceryView wedge:</span> {competitor.groceryViewWedge}</p>
              </article>
            ))}
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <Eyebrow>Claim guardrails</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">Launch only what the evidence supports</h2>
          <ul className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-amber-950">
            {icelandLaunchGuardrails.map((guardrail) => (
              <li className="rounded-2xl bg-white/80 p-3" key={guardrail}>{guardrail}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-6" aria-label="Iceland launch phases">
        <div className="mb-3">
          <Eyebrow>Launch scope</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Phased path to Iceland coverage</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {icelandLaunchPhases.map((phase) => (
            <Card className="p-4" key={phase.phase}>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-800">{phase.phase}</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{phase.objective}</h3>
              <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-slate-700">
                {phase.exitCriteria.map((criterion) => (
                  <li className="rounded-xl bg-slate-50 p-3" key={criterion}>{criterion}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Iceland evidence sources">
        {icelandLaunchSources.map((source) => (
          <Card className="p-4" key={source.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Eyebrow>{source.id}</Eyebrow>
                <h2 className="mt-2 text-xl font-black text-slate-950">{source.label}</h2>
              </div>
              <StatusBadge tone={statusTones[source.status]}>{statusLabels[source.status]}</StatusBadge>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{source.evidence}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{source.launchUse}</p>
            <Link className="mt-3 inline-flex text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={source.url}>
              Review source
            </Link>
          </Card>
        ))}
      </section>

      <section className="mt-6" aria-label="Proof-gated candidate work">
        <div className="mb-3">
          <Eyebrow>Candidate work</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Evidence requirements before any source or feature ticket</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {icelandLaunchCandidates.map((candidate) => (
            <Card className="p-4" key={candidate.title}>
              <h3 className="text-xl font-black text-slate-950">{candidate.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{candidate.evidence}</p>
              <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700">
                <span className="font-black text-slate-950">Proof gate:</span> {candidate.requiredProofBeforeTicket}
              </p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Evidence: {candidate.evidenceSourceIds.join(', ')}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
