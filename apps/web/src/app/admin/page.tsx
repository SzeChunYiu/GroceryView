const connectorRuns = [
  { chain: 'Willys', lastRunAt: '2026-05-24T07:45:00Z', productCount: 18420, priceRows24h: 42810 },
  { chain: 'ICA', lastRunAt: '2026-05-24T06:55:00Z', productCount: 15680, priceRows24h: 31140 },
  { chain: 'Coop', lastRunAt: '2026-05-24T05:40:00Z', productCount: 12905, priceRows24h: 24670 },
];

const connectorRunsQuery = `
  select chain, max(finished_at) as last_run_at, max(product_count) as product_count,
         sum(price_rows_ingested) filter (where finished_at >= now() - interval '24 hours') as price_rows_24h
  from connector_runs
  group by chain
  order by last_run_at desc
`;

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Admin dashboard</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Connector health</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        V1 is unauthenticated and mirrors the connector_runs contract: last successful run, current product count per chain, and price rows ingested in the last 24 hours.
      </p>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Connector health summary">
        {connectorRuns.map((run) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={run.chain}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{run.chain}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{run.productCount.toLocaleString('sv-SE')} products</h2>
            <dl className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
              <div>
                <dt className="text-slate-500">Last run</dt>
                <dd>{new Date(run.lastRunAt).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Price rows ingested last 24h</dt>
                <dd>{run.priceRows24h.toLocaleString('sv-SE')}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
        <h2 className="text-lg font-black">connector_runs source query</h2>
        <pre className="mt-3 overflow-auto rounded-xl bg-black/30 p-4 text-xs leading-5 text-slate-100"><code>{connectorRunsQuery.trim()}</code></pre>
      </section>
    </main>
  );
}
