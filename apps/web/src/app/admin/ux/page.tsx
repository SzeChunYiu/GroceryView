import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const heatmapRows = [
  { surface: 'Search → product card', intensity: 'High', signal: 'Repeated query rewrites before product click' },
  { surface: 'Compare route', intensity: 'Medium', signal: 'Users inspect unit-price rows then return to search' },
  { surface: 'Map route', intensity: 'Medium', signal: 'Location prompt hesitation before store selection' }
];

const funnelRows = [
  { step: 'Entry', rate: '100%', detail: 'Homepage, search, category, or shared product link' },
  { step: 'Find product', rate: '68%', detail: 'Search result, category row, or recommendation card' },
  { step: 'Compare chain', rate: '41%', detail: 'Unit price, store row, or basket comparison opened' },
  { step: 'Save action', rate: '19%', detail: 'Watchlist, list, alert, or basket save intent' }
];

const frictionReports = [
  'Swedish-only abbreviations still need glossary treatment in dense price rows.',
  'Low-confidence recommendation cards need an explicit why/filtered-out explainer.',
  'Map users need operator-visible separation between chain-index proxy and branch-level observations.'
];

export default function AdminUxDashboardPage() {
  return (
    <PageShell>
      <Eyebrow>Operator-only</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">UX dashboard</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        Internal summary for operators: heatmap signals, funnel checkpoints, and friction-report themes. This route is informational and should stay behind operator/admin navigation.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-2xl font-black">Heatmap summary</h2>
          <div className="mt-4 space-y-3">
            {heatmapRows.map((row) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={row.surface}>
                <p className="font-black text-slate-950">{row.surface}</p>
                <p className="mt-1 text-sm font-bold text-emerald-800">{row.intensity} friction intensity</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{row.signal}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Funnel</h2>
          <ol className="mt-4 space-y-3">
            {funnelRows.map((row) => (
              <li className="rounded-2xl border border-slate-200 bg-white p-4" key={row.step}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-950">{row.step}</p>
                  <p className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-900">{row.rate}</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">{row.detail}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Friction report</h2>
          <ul className="mt-4 space-y-3">
            {frictionReports.map((report) => (
              <li className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950" key={report}>{report}</li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
