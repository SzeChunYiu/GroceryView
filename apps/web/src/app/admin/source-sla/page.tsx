import {
  formatMetricValue,
  getSlaSummary,
  getSourceHealthStatus,
  isMetricMeetingTarget,
  sourceHealthSla,
  type SourceHealthMetric,
  type SourceHealthStatus,
} from "../../../lib/source-health";

const statusStyles: Record<SourceHealthStatus, string> = {
  healthy: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  watch: "bg-amber-100 text-amber-800 ring-amber-200",
  breach: "bg-rose-100 text-rose-800 ring-rose-200",
};

function MetricCell({ metric }: { metric: SourceHealthMetric }) {
  const isPassing = isMetricMeetingTarget(metric);

  return (
    <div>
      <div className="font-medium text-slate-950">{formatMetricValue(metric)}</div>
      <div className={isPassing ? "text-xs text-emerald-700" : "text-xs text-rose-700"}>
        Target {metric.direction === "at-least" ? "≥" : "≤"}{" "}
        {formatMetricValue({ ...metric, value: metric.target })}
      </div>
    </div>
  );
}

export default function SourceSlaPage() {
  const summary = getSlaSummary();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin</p>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Source SLA</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Coverage, freshness, and ingestion success rates by source for leadership and operations.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-sm text-slate-500">Sources monitored</div>
              <div className="mt-1 text-3xl font-bold text-slate-950">{summary.total}</div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="SLA summary">
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Healthy</div>
            <div className="mt-2 text-3xl font-bold text-emerald-700">{summary.healthy}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Watch</div>
            <div className="mt-2 text-3xl font-bold text-amber-700">{summary.watch}</div>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Breach</div>
            <div className="mt-2 text-3xl font-bold text-rose-700">{summary.breach}</div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Per-source quality</h2>
            <p className="mt-1 text-sm text-slate-500">
              SLA status is calculated from coverage, freshness, and success-rate targets.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">Source</th>
                  <th className="px-6 py-3 font-semibold">Owner</th>
                  <th className="px-6 py-3 font-semibold">Cadence</th>
                  <th className="px-6 py-3 font-semibold">Coverage</th>
                  <th className="px-6 py-3 font-semibold">Freshness</th>
                  <th className="px-6 py-3 font-semibold">Success rate</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sourceHealthSla.map((source) => {
                  const status = getSourceHealthStatus(source);

                  return (
                    <tr key={source.source}>
                      <td className="px-6 py-4 font-medium text-slate-950">{source.source}</td>
                      <td className="px-6 py-4 text-slate-600">{source.owner}</td>
                      <td className="px-6 py-4 text-slate-600">{source.cadence}</td>
                      <td className="px-6 py-4">
                        <MetricCell metric={source.coverage} />
                      </td>
                      <td className="px-6 py-4">
                        <MetricCell metric={source.freshness} />
                      </td>
                      <td className="px-6 py-4">
                        <MetricCell metric={source.successRate} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
