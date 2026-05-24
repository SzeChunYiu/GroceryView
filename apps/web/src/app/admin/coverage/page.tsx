import { routeMetadata } from '@/lib/seo';

const ingestionAlertKinds = [
  { kind: 'zero_rows', description: 'Connector completed but produced no usable rows.' },
  { kind: 'price_swing', description: 'Observed price moved outside the configured swing tolerance.' },
  { kind: 'missing_chain', description: 'Expected chain coverage disappeared from a run.' },
  { kind: 'dup_ean', description: 'Duplicate EAN rows require dedupe review.' },
];

export function generateMetadata() {
  return routeMetadata('/admin/coverage');
}

export default function AdminCoveragePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Admin coverage</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Ingestion anomaly alerts</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        The ingestion_alert table stores one row per detected anomaly, keyed by UUID with connector, detection time, JSON payload evidence, and optional resolution time.
      </p>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Alert schema surfaced for triage</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {ingestionAlertKinds.map((alert) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={alert.kind}>
              <p className="text-lg font-black text-slate-950">{alert.kind}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{alert.description}</p>
            </div>
          ))}
        </div>
        <dl className="mt-5 grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-950">Primary key</dt><dd>id uuid</dd></div>
          <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-950">Connector</dt><dd>connector text</dd></div>
          <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-950">Evidence</dt><dd>payload jsonb</dd></div>
          <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-950">Detected</dt><dd>detected_at timestamptz</dd></div>
          <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-950">Resolved</dt><dd>resolved_at timestamptz nullable</dd></div>
          <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-950">Unresolved index</dt><dd>detected_at desc where resolved_at is null</dd></div>
        </dl>
      </section>
    </main>
  );
}
