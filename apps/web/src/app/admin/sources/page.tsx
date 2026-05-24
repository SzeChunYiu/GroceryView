import { getDuplicateConflictAlerts } from "../../../lib/source-health";

const severityStyles = {
  critical: "border-red-200 bg-red-50 text-red-900",
  watch: "border-amber-200 bg-amber-50 text-amber-900",
};

export default function AdminSourcesPage() {
  const alerts = getDuplicateConflictAlerts();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Source health
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">
        Duplicate conflict alerts
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Operators are notified when duplicate-like matches spike for a single
        source during a short scrape window, so catalogue regressions can be
        paused before bad matches spread.
      </p>

      <section className="mt-8 grid gap-4" aria-label="Duplicate conflict alerts">
        {alerts.map((alert) => (
          <article
            key={`${alert.source}-${alert.sampledAt}`}
            className={`rounded-2xl border p-5 shadow-sm ${severityStyles[alert.severity]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">
                  {alert.severity === "critical" ? "Critical spike" : "Watch spike"}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{alert.source}</h2>
              </div>
              <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-semibold">
                {alert.spikeRatio.toFixed(1)}× baseline
              </span>
            </div>
            <p className="mt-4">{alert.message}</p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold">Current window</dt>
                <dd>{alert.currentDuplicateLikeMatches} matches</dd>
              </div>
              <div>
                <dt className="font-semibold">Expected baseline</dt>
                <dd>{alert.baselineDuplicateLikeMatches} matches</dd>
              </div>
              <div>
                <dt className="font-semibold">Window length</dt>
                <dd>{alert.windowMinutes} minutes</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}
