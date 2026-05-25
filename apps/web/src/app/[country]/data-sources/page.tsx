import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { perCountryCoverage } from '@/lib/verified-data';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ country: 'se' }, { country: 'no' }, { country: 'is' }];
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const coverage = perCountryCoverage(country);
  if (!coverage) notFound();
  return {
    title: `${coverage.label} data sources | GroceryView`,
    description: `Country-scoped GroceryView data source ledger for ${coverage.label}, listing only actual verified chains and connectors in the current snapshot.`
  };
}

export default async function CountryDataSourcesPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const coverage = perCountryCoverage(country);
  if (!coverage) notFound();
  const totalRows = coverage.sources.reduce((sum, source) => sum + source.rows, 0);

  return (
    <PageShell>
      <Eyebrow>{coverage.country} data sources</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{coverage.label} verified source ledger</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This country page is generated from <code className="rounded bg-slate-100 px-1 py-0.5">perCountryCoverage</code> and lists only chains/connectors present in the verified snapshot. Markets without verified connector rows stay explicitly blocked instead of showing fabricated sources.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Country" value={coverage.country} />
        <Metric label="Currency" value={coverage.currency} />
        <Metric label="Verified rows" value={totalRows.toLocaleString('sv-SE')} />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Actual chains and connectors</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Status: <span className="font-black">{coverage.status}</span>. Each row carries source, freshness, coverage, and caveat evidence.
            </p>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-800">
            {coverage.sources.length.toLocaleString('sv-SE')} connector group(s)
          </p>
        </div>

        {coverage.sources.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {coverage.sources.map((source) => (
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${source.chain}-${source.connector}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{source.chain}</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{source.connector}</h3>
                <p className="mt-2 text-3xl font-black text-emerald-800">{source.rows.toLocaleString('sv-SE')}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{source.coverage}</p>
                <p className="mt-3 break-words text-sm leading-6 text-slate-600">Source: {source.source}</p>
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">
                  Freshness: {source.freshness}. {source.caveat}
                </p>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <p className="text-lg font-black">No verified country-scoped connectors are active for {coverage.label}.</p>
            <p className="mt-2 text-sm font-semibold leading-6">
              This is an explicit coverage blocker, not a missing UI state. Add verified connector rows before publishing chain/source claims for {coverage.country}.
            </p>
          </div>
        )}
      </Card>

      <Card className="mt-6 border-slate-200 bg-slate-50">
        <h2 className="text-2xl font-black tracking-tight">Guardrails</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {coverage.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
