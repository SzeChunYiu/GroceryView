import Link from 'next/link';

import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { DataGrid } from '@/components/data-grid';
import {
  getIngestionRunHistory,
  summarizeIngestionRuns,
  type IngestionRunHistoryEntry,
  type IngestionRunStatus,
} from '@/lib/source-health';
import { routeMetadata } from '@/lib/seo';

const statusStyles: Record<IngestionRunStatus, string> = {
  failed: 'bg-red-100 text-red-800 ring-red-200',
  running: 'bg-blue-100 text-blue-800 ring-blue-200',
  succeeded: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-900 ring-amber-200',
};

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/ingestion-runs',
    title: 'Ingestion run history | GroceryView',
    description: 'Admin run history for GroceryView ingestion jobs, statuses, durations, row counts, warnings, and diagnostics.',
    noIndex: true,
  });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatDuration(seconds?: number) {
  if (seconds === undefined) {
    return 'In progress';
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-SE').format(value);
}

function StatusBadge({ status }: { status: IngestionRunStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function WarningList({ run }: { run: IngestionRunHistoryEntry }) {
  if (run.warnings.length === 0) {
    return <span className="text-slate-500">No warnings</span>;
  }

  return (
    <ul className="space-y-1">
      {run.warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}

export default function AdminIngestionRunsPage() {
  const runs = getIngestionRunHistory();
  const summary = summarizeIngestionRuns(runs);

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Admin operations</p>
        <div className="mt-2 max-w-4xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Ingestion run history</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            Review pipeline status, runtime, accepted and rejected rows, warnings, and source-specific diagnostics from recent ingestion jobs.
          </p>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Ingestion run summary">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Runs</p>
            <p className="mt-2 text-3xl font-black">{formatNumber(summary.totalRuns)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Running</p>
            <p className="mt-2 text-3xl font-black">{formatNumber(summary.activeRuns)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Warnings</p>
            <p className="mt-2 text-3xl font-black">{formatNumber(summary.warningRuns)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Failed</p>
            <p className="mt-2 text-3xl font-black">{formatNumber(summary.failedRuns)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Accepted rows</p>
            <p className="mt-2 text-3xl font-black">{formatNumber(summary.acceptedRows)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rejected rows</p>
            <p className="mt-2 text-3xl font-black">{formatNumber(summary.rejectedRows)}</p>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="ingestion-runs-table-heading">
          <h2 className="sr-only" id="ingestion-runs-table-heading">Recent ingestion jobs</h2>
          <DataGrid density="compact">
            <table>
              <thead>
                <tr className="bg-slate-950 text-sm font-bold text-white">
                  <th scope="col">Job</th>
                  <th scope="col">Status</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Rows</th>
                  <th scope="col">Warnings</th>
                  <th scope="col">Diagnostics</th>
                </tr>
              </thead>
              <tbody className="align-top text-sm text-slate-700">
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <div className="font-bold text-slate-950">{run.jobName}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{run.source}</div>
                      <div className="mt-2 text-xs text-slate-500">
                        Started {formatDateTime(run.startedAt)}
                        {run.finishedAt ? ` - finished ${formatDateTime(run.finishedAt)}` : ''}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="font-semibold text-slate-900">{formatDuration(run.durationSeconds)}</td>
                    <td>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <dt className="font-semibold text-slate-500">Accepted</dt>
                        <dd className="text-right font-bold text-slate-900">{formatNumber(run.rowCounts.accepted)}</dd>
                        <dt className="font-semibold text-slate-500">Rejected</dt>
                        <dd className="text-right font-bold text-slate-900">{formatNumber(run.rowCounts.rejected)}</dd>
                        <dt className="font-semibold text-slate-500">Inserted</dt>
                        <dd className="text-right font-bold text-slate-900">{formatNumber(run.rowCounts.inserted)}</dd>
                        <dt className="font-semibold text-slate-500">Updated</dt>
                        <dd className="text-right font-bold text-slate-900">{formatNumber(run.rowCounts.updated)}</dd>
                      </dl>
                    </td>
                    <td>
                      <WarningList run={run} />
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-2">
                        {run.diagnostics.map((diagnostic) => (
                          <Link
                            className="text-sm font-bold text-emerald-800 underline-offset-4 hover:underline"
                            href={diagnostic.href}
                            key={`${run.id}-${diagnostic.source}-${diagnostic.href}`}
                          >
                            {diagnostic.label}
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataGrid>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
