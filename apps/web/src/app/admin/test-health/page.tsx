import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type TestType = 'Install' | 'Unit' | 'Integration' | 'Build' | 'Typecheck';
type TestStatus = 'passed' | 'failed';

type DailyTestRun = {
  date: string;
  type: TestType;
  status: TestStatus;
  passed: number;
  failed: number;
  flaky: number;
  durationMinutes: number;
  workflow: string;
};

const testRuns: DailyTestRun[] = [
  {
    date: '2026-05-21',
    type: 'Install',
    status: 'passed',
    passed: 1,
    failed: 0,
    flaky: 0,
    durationMinutes: 2.4,
    workflow: 'npm ci'
  },
  {
    date: '2026-05-21',
    type: 'Unit',
    status: 'failed',
    passed: 13,
    failed: 2,
    flaky: 1,
    durationMinutes: 7.8,
    workflow: 'npm test'
  },
  {
    date: '2026-05-21',
    type: 'Integration',
    status: 'passed',
    passed: 4,
    failed: 0,
    flaky: 0,
    durationMinutes: 3.2,
    workflow: 'schema tests'
  },
  {
    date: '2026-05-21',
    type: 'Build',
    status: 'passed',
    passed: 15,
    failed: 0,
    flaky: 0,
    durationMinutes: 11.6,
    workflow: 'npm run build'
  },
  {
    date: '2026-05-21',
    type: 'Typecheck',
    status: 'passed',
    passed: 1,
    failed: 0,
    flaky: 0,
    durationMinutes: 4.1,
    workflow: 'npm run typecheck'
  },
  {
    date: '2026-05-22',
    type: 'Install',
    status: 'passed',
    passed: 1,
    failed: 0,
    flaky: 0,
    durationMinutes: 2.2,
    workflow: 'npm ci'
  },
  {
    date: '2026-05-22',
    type: 'Unit',
    status: 'passed',
    passed: 15,
    failed: 0,
    flaky: 1,
    durationMinutes: 7.1,
    workflow: 'npm test'
  },
  {
    date: '2026-05-22',
    type: 'Integration',
    status: 'passed',
    passed: 4,
    failed: 0,
    flaky: 0,
    durationMinutes: 3.1,
    workflow: 'schema tests'
  },
  {
    date: '2026-05-22',
    type: 'Build',
    status: 'passed',
    passed: 15,
    failed: 0,
    flaky: 0,
    durationMinutes: 10.9,
    workflow: 'npm run build'
  },
  {
    date: '2026-05-22',
    type: 'Typecheck',
    status: 'passed',
    passed: 1,
    failed: 0,
    flaky: 0,
    durationMinutes: 3.9,
    workflow: 'npm run typecheck'
  },
  {
    date: '2026-05-23',
    type: 'Install',
    status: 'passed',
    passed: 1,
    failed: 0,
    flaky: 0,
    durationMinutes: 2.3,
    workflow: 'npm ci'
  },
  {
    date: '2026-05-23',
    type: 'Unit',
    status: 'passed',
    passed: 16,
    failed: 0,
    flaky: 0,
    durationMinutes: 7.4,
    workflow: 'npm test'
  },
  {
    date: '2026-05-23',
    type: 'Integration',
    status: 'passed',
    passed: 4,
    failed: 0,
    flaky: 0,
    durationMinutes: 3.0,
    workflow: 'schema tests'
  },
  {
    date: '2026-05-23',
    type: 'Build',
    status: 'passed',
    passed: 15,
    failed: 0,
    flaky: 0,
    durationMinutes: 10.4,
    workflow: 'npm run build'
  },
  {
    date: '2026-05-23',
    type: 'Typecheck',
    status: 'passed',
    passed: 1,
    failed: 0,
    flaky: 0,
    durationMinutes: 3.8,
    workflow: 'npm run typecheck'
  },
  {
    date: '2026-05-24',
    type: 'Install',
    status: 'passed',
    passed: 1,
    failed: 0,
    flaky: 0,
    durationMinutes: 2.1,
    workflow: 'npm ci'
  },
  {
    date: '2026-05-24',
    type: 'Unit',
    status: 'passed',
    passed: 16,
    failed: 0,
    flaky: 0,
    durationMinutes: 6.9,
    workflow: 'npm test'
  },
  {
    date: '2026-05-24',
    type: 'Integration',
    status: 'passed',
    passed: 4,
    failed: 0,
    flaky: 0,
    durationMinutes: 3.0,
    workflow: 'schema tests'
  },
  {
    date: '2026-05-24',
    type: 'Build',
    status: 'passed',
    passed: 15,
    failed: 0,
    flaky: 0,
    durationMinutes: 10.1,
    workflow: 'npm run build'
  },
  {
    date: '2026-05-24',
    type: 'Typecheck',
    status: 'passed',
    passed: 1,
    failed: 0,
    flaky: 0,
    durationMinutes: 3.7,
    workflow: 'npm run typecheck'
  }
];

const testTypes: TestType[] = ['Install', 'Unit', 'Integration', 'Build', 'Typecheck'];
const latestRuns = testTypes.map((type) => latestRunFor(type));
const totals = latestRuns.reduce(
  (summary, run) => ({
    passed: summary.passed + run.passed,
    failed: summary.failed + run.failed,
    flaky: summary.flaky + run.flaky,
    durationMinutes: summary.durationMinutes + run.durationMinutes
  }),
  { passed: 0, failed: 0, flaky: 0, durationMinutes: 0 }
);
const latestStatus = totals.failed === 0 ? 'green' : 'red';
const latestDate = latestRuns.map((run) => run.date).sort().at(-1) ?? 'unknown';
const dailyTotals = Array.from(new Set(testRuns.map((run) => run.date))).map((date) => {
  const runsForDate = testRuns.filter((run) => run.date === date);
  return {
    date,
    failed: runsForDate.reduce((total, run) => total + run.failed, 0),
    passed: runsForDate.reduce((total, run) => total + run.passed, 0),
    flaky: runsForDate.reduce((total, run) => total + run.flaky, 0),
    durationMinutes: runsForDate.reduce((total, run) => total + run.durationMinutes, 0)
  };
});
const maxTrendDuration = Math.max(...dailyTotals.map((day) => day.durationMinutes));

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/test-health',
    title: 'Operator test health dashboard | GroceryView',
    description: 'Operator-only daily aggregate of release-safe test results, latest run outcomes, flakiness, and duration trend.',
    noIndex: true
  });
}

function latestRunFor(type: TestType) {
  return testRuns
    .filter((run) => run.type === type)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1)!;
}

function formatMinutes(minutes: number) {
  return `${minutes.toFixed(1)} min`;
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator === 0) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function statusClass(status: TestStatus) {
  return status === 'passed' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900';
}

export default function AdminTestHealthPage() {
  return (
    <PageShell>
      <Eyebrow>Operator-only test health</Eyebrow>
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Daily aggregated test-results dashboard</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Latest release-safe validation health by test type with pass/fail counts, flaky-test signal, and run-time trend for GroceryView operators.
          </p>
        </div>
        <a className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white" href="/docs/test-health.md">
          Runbook
        </a>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Current daily test health summary">
        <Card className={latestStatus === 'green' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <p className="text-sm font-bold text-slate-600">Latest daily rollup</p>
          <p className={latestStatus === 'green' ? 'mt-2 text-3xl font-black text-emerald-900' : 'mt-2 text-3xl font-black text-red-900'}>
            {latestStatus === 'green' ? 'Green' : 'Needs attention'}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">{latestDate}</p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-slate-600">Pass / fail</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{totals.passed}/{totals.failed}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">latest test assertions and jobs</p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-slate-600">Flakiness</p>
          <p className="mt-2 text-3xl font-black text-amber-900">{formatPercent(totals.flaky, totals.passed + totals.failed)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">{totals.flaky} flaky runs in latest rollup</p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-slate-600">Wall time</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatMinutes(totals.durationMinutes)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">install + test + build + typecheck</p>
        </Card>
      </section>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Latest run per type</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Release-safe candidate checks</h2>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">Source: daily CI aggregate</p>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-[0.18em] text-slate-600">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pass</th>
                <th className="px-4 py-3">Fail</th>
                <th className="px-4 py-3">Flaky</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Run date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {latestRuns.map((run) => (
                <tr key={run.type}>
                  <td className="px-4 py-4 font-black text-slate-950">{run.type}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{run.workflow}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${statusClass(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-black text-emerald-900">{run.passed}</td>
                  <td className="px-4 py-4 font-black text-red-900">{run.failed}</td>
                  <td className="px-4 py-4 font-black text-amber-900">{run.flaky}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{formatMinutes(run.durationMinutes)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{run.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <Eyebrow>Time trend</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Daily validation duration and failures</h2>
          <div className="mt-5 space-y-4" aria-label="Daily test duration trend">
            {dailyTotals.map((day) => (
              <div key={day.date}>
                <div className="flex items-center justify-between gap-4 text-sm font-bold text-slate-700">
                  <span>{day.date}</span>
                  <span>{formatMinutes(day.durationMinutes)} · {day.failed} failures</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-slate-100">
                  <div
                    aria-label={`${day.date} duration ${formatMinutes(day.durationMinutes)}`}
                    className={day.failed > 0 ? 'h-3 rounded-full bg-red-500' : 'h-3 rounded-full bg-emerald-500'}
                    style={{ width: `${Math.max(8, (day.durationMinutes / maxTrendDuration) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <Eyebrow>Operator access</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">Keep the surface private</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-amber-950">
            The route is intentionally no-indexed and omitted from public navigation. Production deployments should expose it only behind Vercel Deployment Protection, VPN, or an operator session gate before real CI artifacts are connected.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-bold leading-6 text-amber-950">
            <li>Open after the daily CI aggregation job completes.</li>
            <li>Treat any failed latest run as a release blocker.</li>
            <li>Escalate flakiness above 5% to the test owner before merging release PRs.</li>
          </ul>
        </Card>
      </section>
    </PageShell>
  );
}
