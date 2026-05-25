import { createPgQueryExecutor } from '@groceryview/db';
import { listIngestionRunHistoryFromDatabase, type IngestionRunHistoryItem } from '@/lib/source-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function executorForDatabaseUrl(databaseUrl: string) {
  if (!cachedPool || cachedDatabaseUrl !== databaseUrl) {
    if (cachedPool) await cachedPool.end();
    const pg = await importPgModule();
    cachedPool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    cachedDatabaseUrl = databaseUrl;
  }
  return createPgQueryExecutor(cachedPool);
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined) return '—';
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function statusStyle(status: IngestionRunHistoryItem['status']) {
  if (status === 'succeeded') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'failed') return 'border-red-200 bg-red-50 text-red-800';
  if (status === 'partial') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-sky-200 bg-sky-50 text-sky-800';
}

async function loadIngestionRuns() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {
      runs: [] as IngestionRunHistoryItem[],
      error: 'DATABASE_URL is not configured, so persisted ingestion runs cannot be loaded.',
    };
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    return { runs: await listIngestionRunHistoryFromDatabase(executor, { limit: 25 }) };
  } catch (error) {
    console.error('Ingestion run history query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return {
      runs: [] as IngestionRunHistoryItem[],
      error: 'Ingestion run history query failed. Check source_runs/raw_records connectivity and migrations.',
    };
  }
}

export default async function AdminIngestionRunsPage() {
  const { runs, error } = await loadIngestionRuns();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Source health
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">
        Ingestion run history
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Recent source_runs are joined with raw_records so operators can review status, duration,
        persisted row counts, warnings, and diagnostics from the ingestion evidence store.
      </p>

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Ingestion runs">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Row counts</th>
              <th className="px-4 py-3">Warnings</th>
              <th className="px-4 py-3">Diagnostics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.map((run) => (
              <tr key={run.sourceRunId} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-950">{run.sourceName}</div>
                  <div className="mt-1 text-xs text-slate-500">{run.sourceType}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(run.status)}`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {formatDate(run.startedAt)}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {formatDuration(run.durationMs)}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  <div className="font-semibold text-slate-900">{run.rowCounts.total} total</div>
                  <div className="mt-1 text-xs">
                    price {run.rowCounts.price} · product {run.rowCounts.product} · store {run.rowCounts.store} · promo {run.rowCounts.promotion}
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {run.warnings.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-4">
                      {run.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  ) : (
                    <span className="text-emerald-700">No warnings</span>
                  )}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  <dl className="space-y-1">
                    {run.diagnostics.map((diagnostic) => (
                      <div key={diagnostic.label}>
                        <dt className="inline font-semibold text-slate-700">{diagnostic.label}: </dt>
                        <dd className="inline break-all">{diagnostic.value}</dd>
                      </div>
                    ))}
                  </dl>
                </td>
              </tr>
            ))}
            {runs.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  No persisted ingestion runs were found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
