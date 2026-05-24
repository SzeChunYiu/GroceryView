const ingestionFailures = [
  {
    dataset: "open-prices",
    source: "Open Prices feed",
    failedAt: "2026-05-24 08:12 UTC",
    reason: "Upstream export returned malformed price rows",
  },
  {
    dataset: "store-catalog",
    source: "Store catalog sync",
    failedAt: "2026-05-23 22:41 UTC",
    reason: "Checksum mismatch while importing source payload",
  },
  {
    dataset: "receipt-ocr",
    source: "Receipt OCR backfill",
    failedAt: "2026-05-23 17:05 UTC",
    reason: "Worker timeout before ingestion finished",
  },
];

export default function AdminSourcesPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Source operations
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Ingestion failure replay
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Review recent source ingestion failures and replay a dataset when the
          upstream issue is resolved.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Failure timeline
          </h2>
        </div>
        <ol className="divide-y divide-slate-200">
          {ingestionFailures.map((failure) => (
            <li
              className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_auto] md:items-center"
              key={`${failure.dataset}-${failure.failedAt}`}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                    Failed
                  </span>
                  <time className="text-sm text-slate-500">
                    {failure.failedAt}
                  </time>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {failure.source}
                  </h3>
                  <p className="text-sm text-slate-600">{failure.reason}</p>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Dataset: {failure.dataset}
                </p>
              </div>

              <form action="/api/ops/reprocess" method="post">
                <input name="dataset" type="hidden" value={failure.dataset} />
                <input name="source" type="hidden" value={failure.source} />
                <button
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  type="submit"
                >
                  Replay dataset
                </button>
              </form>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
