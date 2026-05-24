import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const testHealthRows = [
  { type: 'unit', latestRun: '2026-05-24 17:42 UTC', passed: 1842, failed: 0, flaky: 3, durationMinutes: 11 },
  { type: 'component', latestRun: '2026-05-24 17:46 UTC', passed: 214, failed: 1, flaky: 5, durationMinutes: 9 },
  { type: 'e2e', latestRun: '2026-05-24 17:55 UTC', passed: 72, failed: 0, flaky: 2, durationMinutes: 18 },
  { type: 'ingestion', latestRun: '2026-05-24 18:05 UTC', passed: 96, failed: 0, flaky: 1, durationMinutes: 14 }
];

function statusFor(row: (typeof testHealthRows)[number]) {
  if (row.failed > 0) return { label: 'Action needed', className: 'bg-rose-50 text-rose-950' };
  if (row.flaky > 0) return { label: 'Watch flake', className: 'bg-amber-50 text-amber-950' };
  return { label: 'Healthy', className: 'bg-emerald-50 text-emerald-950' };
}

export default function AdminTestHealthPage() {
  const totals = testHealthRows.reduce((sum, row) => ({
    passed: sum.passed + row.passed,
    failed: sum.failed + row.failed,
    flaky: sum.flaky + row.flaky
  }), { passed: 0, failed: 0, flaky: 0 });
  const maxDuration = Math.max(...testHealthRows.map((row) => row.durationMinutes), 1);

  return (
    <PageShell>
      <Eyebrow>Operator only</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Daily test-results health</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Aggregated latest runs by test type, pass/fail counts, flakiness, and duration trend for release operators.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Passed</p><p className="mt-2 text-4xl font-black text-emerald-800">{totals.passed}</p></Card>
        <Card><p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Failed</p><p className="mt-2 text-4xl font-black text-rose-800">{totals.failed}</p></Card>
        <Card><p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Flaky</p><p className="mt-2 text-4xl font-black text-amber-800">{totals.flaky}</p></Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">Latest run per test type</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <caption className="sr-only">Latest test health by test type</caption>
            <thead>
              <tr className="border-b border-slate-200 text-sm font-black text-slate-600">
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Latest run</th>
                <th className="px-3 py-3">Pass / fail</th>
                <th className="px-3 py-3">Flaky</th>
                <th className="px-3 py-3">Time trend</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {testHealthRows.map((row) => {
                const status = statusFor(row);
                return (
                  <tr className="border-b border-slate-100" key={row.type}>
                    <th className="px-3 py-4 font-black text-slate-950">{row.type}</th>
                    <td className="px-3 py-4 text-sm font-semibold text-slate-700">{row.latestRun}</td>
                    <td className="px-3 py-4 font-semibold">{row.passed} / {row.failed}</td>
                    <td className="px-3 py-4 font-semibold">{row.flaky}</td>
                    <td className="px-3 py-4">
                      <div className="h-3 rounded-full bg-slate-100">
                        <div className="h-3 rounded-full bg-indigo-700" style={{ width: `${Math.max(10, (row.durationMinutes / maxDuration) * 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{row.durationMinutes} min</p>
                    </td>
                    <td className="px-3 py-4"><span className={`rounded-full px-3 py-1 text-sm font-black ${status.className}`}>{status.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
