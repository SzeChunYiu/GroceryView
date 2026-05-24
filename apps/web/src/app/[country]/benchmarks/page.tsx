import Link from 'next/link';
import { benchmarkRegistry, type CountryCode } from '@groceryview/core';
import { BenchmarkLayerBadge } from '@/components/benchmark-layer-badge';

const countryCodes = new Set<CountryCode>(['SE', 'NO', 'IS']);

function countryFromParam(value: string): CountryCode {
  const normalized = value.toUpperCase() as CountryCode;
  return countryCodes.has(normalized) ? normalized : 'SE';
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ');
}

export default async function CountryBenchmarksPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: countryParam } = await params;
  const country = countryFromParam(countryParam);
  const sources = benchmarkRegistry.filter((source) => source.countries.includes(country));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{country} benchmarks</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Official essentials benchmark registry</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Official benchmark sources are documented separately from GroceryView retail observations. Registry-only rows show source metadata only; no index value is invented.</p>

      <div className="mt-8 space-y-4">
        {sources.map((source) => (
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={source.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{source.label}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{source.notes}</p>
              </div>
              <BenchmarkLayerBadge layer={source.layer} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.14em]">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{statusLabel(source.status)}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{source.frequency}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{source.verticals.join(' · ')}</span>
            </div>
            {source.status === 'registry_only' ? <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-black text-amber-950">Source documented, ingestion not yet implemented.</p> : null}
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              {source.homepageUrl ? <Link className="text-emerald-800 underline" href={source.homepageUrl}>Homepage</Link> : null}
              {source.apiUrl ? <Link className="text-emerald-800 underline" href={source.apiUrl}>API</Link> : null}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
