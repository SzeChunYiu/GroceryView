import Link from 'next/link';
import type { ReactNode } from 'react';
import type { RoutePerformanceBudgetReport } from '@/lib/telemetry';
import { AppNav } from './app-nav';
import { BottomNav } from './bottom-nav';
import {
  formatPct,
  formatSek,
  keyMetrics,
  privateFeatureCopy,
  sourceCoverage,
  topChainSpreads,
  unavailablePanels
} from '@/lib/verified-data';
import type { PrivateFeatureRoute } from '@/lib/verified-data';
import { freshnessCopy, sourceLimitationCopy } from '@/lib/content-style';
import type { SourceHealthDashboardRow, SourceManagementAction } from '@/lib/source-health';

export function PageShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      <footer className="mx-auto w-full max-w-7xl px-4 pb-28 pt-2 text-sm font-bold text-slate-600 sm:px-6 lg:px-8 lg:pb-8">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
          <span className="font-black text-slate-950">Legal</span>
          <Link className="underline decoration-emerald-300 underline-offset-4" href="/sv/privacy">Integritetspolicy</Link>
          <Link className="underline decoration-emerald-300 underline-offset-4" href="/en/privacy">Privacy policy</Link>
          <Link className="underline decoration-emerald-300 underline-offset-4" href="/sv/cookies">Cookiepolicy</Link>
          <Link className="underline decoration-emerald-300 underline-offset-4" href="/en/cookies">Cookie policy</Link>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}

export function Eyebrow({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">{children}</p>;
}

export function Card({ children, className = '' }: Readonly<{ children: ReactNode; className?: string }>) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white/88 p-5 shadow-sm ${className}`}>{children}</section>;
}

export function DashboardHero({
  actions,
  children,
  eyebrow,
  title
}: Readonly<{ actions?: ReactNode; children: ReactNode; eyebrow: string; title: string }>) {
  return (
    <section className="rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h1>
          <div className="mt-4 text-lg leading-8 text-slate-700">{children}</div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AdminMetricCard({
  detail,
  label,
  value
}: Readonly<{ detail: ReactNode; label: string; value: string }>) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <div className="mt-2 text-sm leading-6 text-slate-600">{detail}</div>
    </Card>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: Readonly<{ children: ReactNode; tone?: 'neutral' | 'success' | 'warning' }>) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${toneClass}`}>{children}</span>;
}

export function SearchRecoveryPanel({
  didYouMean,
  popularAlternatives,
  query,
  searchPath = '/search'
}: Readonly<{
  didYouMean: string[];
  popularAlternatives: string[];
  query: string;
  searchPath?: string;
}>) {
  const suggestions = [
    ...didYouMean.map((value) => ({ value, label: 'Did you mean' })),
    ...popularAlternatives.map((value) => ({ value, label: 'Popular alternative' }))
  ].filter((suggestion, index, values) => values.findIndex((value) => value.value.toLocaleLowerCase('sv-SE') === suggestion.value.toLocaleLowerCase('sv-SE')) === index);

  if (!query.trim() || suggestions.length === 0) return null;

  return (
    <Card className="mt-4 border-amber-200 bg-amber-50">
      <Eyebrow>Search recovery</Eyebrow>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">No exact matches for “{query}”</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">Try a corrected spelling or a common grocery term from the verified catalogue.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Link className="rounded-full bg-white px-3 py-2 text-xs font-black text-amber-950 shadow-sm" href={`${searchPath}?q=${encodeURIComponent(suggestion.value)}`} key={`${suggestion.label}-${suggestion.value}`}>
            {suggestion.label}: {suggestion.value}
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function MetricGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {keyMetrics.map((metric) => (
        <Card key={metric.label} className="p-4">
          <p className="text-sm font-semibold text-slate-600">{metric.label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{metric.value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{metric.detail}</p>
        </Card>
      ))}
    </div>
  );
}

export function SourceFreshnessStatusBadge({
  status,
}: Readonly<{ status: 'within-sla' | 'watch' | 'breached' }>) {
  const labels = {
    'within-sla': 'Within SLA',
    watch: 'Watch',
    breached: 'SLA breached'
  };
  const classNames = {
    'within-sla': 'bg-emerald-100 text-emerald-950',
    watch: 'bg-amber-100 text-amber-950',
    breached: 'bg-rose-100 text-rose-950'
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${classNames[status]}`}>
      {labels[status]}
    </span>
  );
}

function sourceFailureStateClassName(state: SourceHealthDashboardRow['failureState']) {
  if (state === 'failed') return 'bg-rose-100 text-rose-950';
  if (state === 'warning') return 'bg-amber-100 text-amber-950';
  return 'bg-emerald-100 text-emerald-950';
}

function sourceFailureStateLabel(state: SourceHealthDashboardRow['failureState']) {
  if (state === 'failed') return 'Failed';
  if (state === 'warning') return 'Warning';
  return 'Healthy';
}

function formatSourceDelta(value: number) {
  if (value === 0) return '±0';
  return `${value > 0 ? '+' : ''}${value.toLocaleString('sv-SE')}`;
}

export function SourceHealthDashboardTable({
  sources
}: Readonly<{ sources: SourceHealthDashboardRow[] }>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Ingestion source</th>
            <th className="px-4 py-3">Last refresh</th>
            <th className="px-4 py-3">Rows</th>
            <th className="px-4 py-3">Failure state</th>
            <th className="px-4 py-3">Stale threshold</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-700">
          {sources.map((source) => (
            <tr key={source.sourceName}>
              <td className="px-4 py-4 align-top">
                <p className="font-black text-slate-950">{source.sourceName}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{source.chain} · {source.dataSource}</p>
              </td>
              <td className="px-4 py-4 align-top">
                <p className="font-semibold text-slate-950">{source.lastRefreshAt}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Lag {source.ingestLagHours}h</p>
              </td>
              <td className="px-4 py-4 align-top">
                <p className="font-black text-slate-950">{source.rowCount.toLocaleString('sv-SE')}</p>
                <p className={`mt-1 text-xs font-black ${source.rowCountDelta < 0 ? 'text-rose-700' : source.rowCountDelta > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {formatSourceDelta(source.rowCountDelta)} since previous ingest
                </p>
              </td>
              <td className="px-4 py-4 align-top">
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${sourceFailureStateClassName(source.failureState)}`}>
                  {sourceFailureStateLabel(source.failureState)}
                </span>
                <p className="mt-2 max-w-xs text-xs font-semibold leading-5 text-slate-600">
                  {source.failureCount.toLocaleString('sv-SE')} failure{source.failureCount === 1 ? '' : 's'} · {source.failureStatus}
                </p>
              </td>
              <td className="px-4 py-4 align-top">
                <SourceFreshnessStatusBadge status={source.status} />
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  Stale after {source.staleDataThresholdHours.toLocaleString('sv-SE')}h
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SourceManagementActionsPanel({
  actions
}: Readonly<{ actions: SourceManagementAction[] }>) {
  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      {actions.map((source) => (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={source.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{source.chain}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{source.dataSource}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {source.owner}</p>
            </div>
            <span className={source.state === 'paused' ? 'rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-950' : 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-950'}>
              {source.state}
            </span>
          </div>
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700">{source.note}</p>
          <div className="mt-4 flex flex-wrap gap-2" aria-label={`${source.dataSource} management actions`}>
            <button className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 disabled:opacity-40" data-source-action="pause" disabled={!source.allowedActions.includes('pause')} type="button">
              Pause
            </button>
            <button className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-40" data-source-action="resume" disabled={!source.allowedActions.includes('resume')} type="button">
              Resume
            </button>
            <button className="rounded-full bg-sky-50 px-3 py-2 text-xs font-black text-sky-800" data-source-action="annotate" type="button">
              Annotate
            </button>
            <Link className="rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white" href={source.runbookUrl}>
              Runbook
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
}

export function SourceCoverage() {
  return (
    <Card>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Data provenance</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Only verified snapshot data is rendered</h2>
        </div>
        <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/data-sources">
          Data source notes live in docs/data-sources.md
        </Link>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {sourceCoverage.map((source) => (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={source.name}>
            <p className="text-sm font-black text-slate-950">{source.name}</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{source.rows.toLocaleString('sv-SE')}</p>
            <p className="text-sm font-semibold text-slate-700">{source.coverage}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Source: {source.source}. {freshnessCopy(source.freshness)}.</p>
            <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">{sourceLimitationCopy(source.caveat)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TopSpreads({ limit = 6 }: Readonly<{ limit?: number }>) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Eyebrow>Comparable prices</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Largest verified Willys/Hemköp spreads</h2>
        </div>
        <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/compare">Compare all</Link>
      </div>
      <div className="mt-5 divide-y divide-slate-200">
        {topChainSpreads.slice(0, limit).map((product) => (
          <Link className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]" href={`/products/${product.slug}`} key={product.slug}>
            <div>
              <p className="font-black text-slate-950">{product.name}</p>
              <p className="text-sm text-slate-600">{product.brand || 'Brand not reported'} · {product.subline || 'Size not reported'}</p>
            </div>
            <p className="font-black text-emerald-800">{formatSek(product.lowestPrice)}</p>
            <p className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950">{formatPct(product.spreadPct)} spread</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function RoutePerformanceBudgetPanel({ reports }: Readonly<{ reports: RoutePerformanceBudgetReport[] }>) {
  const failingMetrics = reports.flatMap((report) => report.metrics.filter((metric) => metric.failing).map((metric) => ({ ...metric, route: report.route })));

  return (
    <Card className="border-violet-200 bg-violet-50">
      <div data-internal-performance-page="route-budgets">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>Internal performance</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Route performance budgets</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-violet-950">
              Recent Lighthouse route snapshots are grouped here so performance regressions are visible outside CI logs. Failing metrics are called out before shoppers feel slower grocery searches.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-950 shadow-sm">
            {failingMetrics.length} failing metric{failingMetrics.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {reports.map((report) => (
            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm" key={report.route}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-black text-slate-950">{report.route}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{report.measuredAt}</p>
                </div>
                <p className={report.status === 'fail' ? 'rounded-full bg-rose-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-rose-950' : 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-950'}>
                  {report.status}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {report.metrics.map((metric) => (
                  <div className={metric.failing ? 'rounded-xl border border-rose-200 bg-rose-50 p-3' : 'rounded-xl bg-slate-50 p-3'} key={`${report.route}-${metric.metric}`}>
                    <p className="font-mono text-xs font-black text-slate-950">{metric.metric}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">Budget {metric.budget} · observed {metric.observed}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{metric.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-500">Source: {report.source}</p>
            </section>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function NoVerifiedData({
  route,
  title = 'No verified records for this feature yet'
}: Readonly<{ route?: PrivateFeatureRoute; title?: string }>) {
  const routeCopy = route ? privateFeatureCopy[route] : null;
  return (
    <Card className="border-amber-200 bg-amber-50">
      <Eyebrow>Fail-closed UI</Eyebrow>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-950">
        This page intentionally avoids sample people, fake receipts, estimated coupons, and placeholder workflow rows. It shows only what the current generated data modules can support.
      </p>
      {routeCopy ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Verified surface</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{routeCopy.verifiedSurface}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Gate before launch</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{routeCopy.gatedBy}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Next verified step</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{routeCopy.nextStep}</p>
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {unavailablePanels.map((panel) => (
          <div className="rounded-2xl bg-white/70 p-4" key={panel.title}>
            <p className="font-black text-amber-950">{panel.title}</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">{panel.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
