import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { AdminMetricCard, Card, Eyebrow, StatusBadge } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const alertKinds = [
  { kind: 'zero_rows', detail: 'Connector produced no rows for a scheduled run.' },
  { kind: 'price_swing', detail: 'Observed price delta exceeded the connector threshold.' },
  { kind: 'missing_chain', detail: 'Ingested data referenced a chain that is not present in the catalogue.' },
  { kind: 'dup_ean', detail: 'Multiple product records share an EAN that needs review.' }
] as const;

const schemaColumns = [
  { name: 'id', detail: 'uuid primary key, generated with pgcrypto' },
  { name: 'kind', detail: 'zero_rows | price_swing | missing_chain | dup_ean' },
  { name: 'connector', detail: 'connector name that detected the anomaly' },
  { name: 'detected_at', detail: 'timestamp when the anomaly was detected' },
  { name: 'payload', detail: 'jsonb evidence payload for counts, thresholds, EANs, chains, or source URLs' },
  { name: 'resolved_at', detail: 'nullable timestamp used to hide resolved alerts from the open queue' }
] as const;

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/coverage',
    title: 'Ingestion coverage alerts | GroceryView',
    description: 'Admin coverage queue for ingestion anomaly alerts such as zero-row runs, price swings, missing chains, and duplicate EANs.',
    noIndex: true
  });
}

export default function AdminCoveragePage() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-800">Admin coverage</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Ingestion anomaly alerts</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              The server migration creates an append-only <code>ingestion_alert</code> table for one row per detected anomaly, with resolution tracked by <code>resolved_at</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="warning">Open queue backed by SQL</StatusBadge>
            <StatusBadge>packages/server/migrations</StatusBadge>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4" aria-label="Ingestion alert kinds">
          {alertKinds.map((alert) => (
            <AdminMetricCard detail={alert.detail} key={alert.kind} label={alert.kind.replace('_', ' ')} value="0" />
          ))}
        </section>

        <Card className="mt-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Schema contract</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight">ingestion_alert columns</h2>
            </div>
            <p className="text-sm font-black text-slate-600">20260525144000_create_ingestion_alert_table.sql</p>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Column</th>
                  <th className="px-4 py-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {schemaColumns.map((column) => (
                  <tr key={column.name}>
                    <td className="px-4 py-4 font-black text-slate-950">{column.name}</td>
                    <td className="px-4 py-4 font-semibold text-slate-700">{column.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mt-6 border-amber-200 bg-amber-50">
          <Eyebrow>Empty state</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">No unresolved ingestion alerts in the static preview</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
            Production readers should query <code>where resolved_at is null</code> and display the JSON payload beside connector and detection time.
          </p>
          <Link className="mt-4 inline-flex rounded-full bg-amber-800 px-5 py-3 text-sm font-black text-white" href="/admin">
            Back to admin dashboard
          </Link>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
