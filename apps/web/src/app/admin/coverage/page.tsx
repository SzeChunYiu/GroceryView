import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

type CountryCoverage = Readonly<{
  chainCount: number;
  country: string;
  observationCount: number;
  perChainConfidence: Record<string, number>;
  skuCount: number;
  storeCount: number;
  updatedAt: string;
}>;

type ConnectorIngest = Readonly<{
  connectorId: string;
  lastIngestAt: string;
}>;

type CoverageSnapshot = Readonly<{
  connectors?: ConnectorIngest[];
  countries?: CountryCoverage[];
}>;

function loadCoverageSnapshot(): CoverageSnapshot {
  try {
    return JSON.parse(process.env.ADMIN_COVERAGE_JSON ?? '{}') as CoverageSnapshot;
  } catch {
    return {};
  }
}

async function isAdmin() {
  const expectedToken = process.env.ADMIN_COVERAGE_TOKEN;
  if (!expectedToken) return false;

  const headerStore = await headers();
  const bearerToken = headerStore.get('authorization')?.replace(/^Bearer\s+/i, '');
  const headerToken = headerStore.get('x-admin-token');

  return bearerToken === expectedToken || headerToken === expectedToken;
}

export default async function AdminCoveragePage() {
  const authorized = await isAdmin();
  if (!authorized) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 text-slate-950">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-800">Admin only</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Coverage dashboard locked</h1>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">Set ADMIN_COVERAGE_TOKEN and send it as a bearer token or x-admin-token header to view real coverage telemetry.</p>
      </main>
    );
  }

  const snapshot = loadCoverageSnapshot();
  const countries = snapshot.countries ?? [];
  const connectors = snapshot.connectors ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-slate-950">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Operator coverage</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Admin coverage dashboard</h1>
      <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-700">
        Real data only: this page renders the hourly ADMIN_COVERAGE_JSON snapshot with per-country chain, store, SKU, observation counts, live perChainConfidence values, and last-ingest timestamps per connector.
      </p>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black">Country coverage</h2>
        {countries.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">No tracked country coverage rows are present in ADMIN_COVERAGE_JSON.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {countries.map((row) => (
              <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={row.country}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-black">{row.country}</h3>
                  <p className="text-xs font-bold text-slate-500">updated {row.updatedAt}</p>
                </div>
                <dl className="mt-3 grid gap-3 md:grid-cols-4">
                  <div><dt className="text-xs font-black uppercase text-slate-500">Chains</dt><dd className="text-2xl font-black">{row.chainCount}</dd></div>
                  <div><dt className="text-xs font-black uppercase text-slate-500">Stores</dt><dd className="text-2xl font-black">{row.storeCount}</dd></div>
                  <div><dt className="text-xs font-black uppercase text-slate-500">SKUs</dt><dd className="text-2xl font-black">{row.skuCount}</dd></div>
                  <div><dt className="text-xs font-black uppercase text-slate-500">Observations</dt><dd className="text-2xl font-black">{row.observationCount}</dd></div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(row.perChainConfidence).map(([chain, confidence]) => (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900" key={chain}>{chain}: {confidence}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black">Last ingest per connector</h2>
        {connectors.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">No connector ingest timestamps are present in ADMIN_COVERAGE_JSON.</p>
        ) : (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {connectors.map((connector) => (
              <li className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700" key={connector.connectorId}>{connector.connectorId}: {connector.lastIngestAt}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
