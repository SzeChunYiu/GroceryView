type ChainConfidencePageProps = {
  params: Promise<{ country: string; chain: string }>;
};

const confidenceSignals = [
  { label: 'Last observed at', value: 'Updated by latest ingestion snapshot' },
  { label: 'Stores covered', value: 'Compared against known store registry count' },
  { label: 'SKUs covered', value: 'Current priced SKU rows with source timestamps' },
  { label: 'Ingestion freshness', value: 'Fresh, stale, or missing based on connector SLA' },
  { label: 'Audit findings', value: 'Open data gaps and manual review notes' }
];

export async function generateMetadata({ params }: ChainConfidencePageProps) {
  const { country, chain } = await params;
  return {
    title: `${chain} data confidence in ${country.toUpperCase()}`,
    description: 'Transparent chain-level coverage, freshness, and audit findings.'
  };
}

export default async function ChainConfidencePage({ params }: ChainConfidencePageProps) {
  const { country, chain } = await params;
  const chainLabel = chain.replaceAll('-', ' ');

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {country.toUpperCase()} · {chainLabel}
        </p>
        <h1 className="text-3xl font-bold text-slate-950">Public data-confidence report</h1>
        <p className="max-w-3xl text-slate-700">
          Maximum transparency for this chain: what we last observed, how much of the store and SKU surface is
          covered, how fresh ingestion is, and which audit findings still need work.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {confidenceSignals.map((signal) => (
          <article key={signal.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">{signal.label}</h2>
            <p className="mt-2 text-slate-700">{signal.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-amber-950">Audit findings</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-amber-900">
          <li>Flag connector gaps when store coverage falls below the known chain footprint.</li>
          <li>Flag stale price data when `last_observed_at` exceeds the freshness SLA.</li>
          <li>Flag SKU coverage drops when current priced rows fall below the previous successful ingestion.</li>
        </ul>
      </section>
    </main>
  );
}
