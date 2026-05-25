const scraperRunColumns = [
  { field: 'retailerId', label: 'Retailer ID', dbColumn: 'retailer_id' },
  { field: 'startedAt', label: 'Started', dbColumn: 'started_at' },
  { field: 'finishedAt', label: 'Finished', dbColumn: 'finished_at' },
  { field: 'itemsScraped', label: 'Items scraped', dbColumn: 'items_scraped' },
  { field: 'status', label: 'Status', dbColumn: 'status' }
] as const;

const statusContract = [
  { status: 'running', description: 'Scraper has started and has not recorded a terminal timestamp.' },
  { status: 'succeeded', description: 'Scraper finished and accepted the run as complete.' },
  { status: 'partial', description: 'Scraper finished with accepted rows and recoverable source gaps.' },
  { status: 'failed', description: 'Scraper finished without enough accepted rows for downstream health checks.' }
] as const;

export default function AdminScrapersPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Source health</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">Scraper run audit</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        The health dashboard reads scraper_runs records so operators can compare retailer execution windows, terminal status, and accepted item volume before stale source issues reach shoppers.
      </p>

      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="scraper-runs-schema-heading">
        <h2 className="text-xl font-bold text-emerald-950" id="scraper-runs-schema-heading">scraper_runs table contract</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-emerald-800">
              <tr>
                <th className="px-3 py-2">Dashboard field</th>
                <th className="px-3 py-2">Database column</th>
                <th className="px-3 py-2">Health use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 bg-white/80 text-slate-700">
              {scraperRunColumns.map((column) => (
                <tr key={column.field}>
                  <td className="px-3 py-3 font-bold text-slate-950">{column.label}</td>
                  <td className="px-3 py-3 font-mono text-xs">{column.dbColumn}</td>
                  <td className="px-3 py-3">{healthUseForColumn(column.field)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Scraper status contract">
        {statusContract.map((entry) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={entry.status}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{entry.status}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{entry.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite">
        <h2 className="text-xl font-bold text-slate-950">Latest run rows</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Live scraper rows stay empty in the static admin shell until production connects this dashboard to the database-backed scraper_runs query.
        </p>
      </section>
    </main>
  );
}

function healthUseForColumn(field: (typeof scraperRunColumns)[number]['field']): string {
  const copy = {
    retailerId: 'Groups health checks by retailer connector.',
    startedAt: 'Orders runs and highlights stalled execution windows.',
    finishedAt: 'Separates active runs from terminal runs.',
    itemsScraped: 'Flags unusually low accepted row counts.',
    status: 'Drives success, partial, failed, and running badges.'
  };
  return copy[field];
}
