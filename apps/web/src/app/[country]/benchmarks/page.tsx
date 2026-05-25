import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getBenchmarkCategories,
  getBenchmarksFor,
  type CountryCode,
  type EssentialsVertical,
  type OfficialBenchmarkSource
} from '@groceryview/core';
import { BenchmarkLayerBadge, layerLabel } from '@/components/benchmark-layer-badge';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const countries = ['SE', 'NO', 'IS'] as const satisfies readonly CountryCode[];
const verticals = ['grocery', 'pharmacy', 'fuel'] as const satisfies readonly EssentialsVertical[];
const countryNames = {
  SE: 'Sweden',
  NO: 'Norway',
  IS: 'Iceland'
} satisfies Record<CountryCode, string>;
const statusLabels = {
  registry_only: 'registry only',
  ingestion_planned: 'ingestion planned',
  ingestion_ready: 'ingestion ready',
  live: 'live'
} satisfies Record<OfficialBenchmarkSource['status'], string>;

export function generateStaticParams() {
  return countries.map((country) => ({ country: country.toLowerCase() }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country: countrySlug } = await params;
  const country = parseCountry(countrySlug);
  return {
    title: country ? `${countryNames[country]} benchmark registry | GroceryView` : 'Benchmark registry | GroceryView',
    description: 'Official consumer-index, regulated-reference, energy-context, and upstream agriculture sources documented without fabricated values.'
  };
}

function parseCountry(value: string): CountryCode | null {
  const normalized = value.toUpperCase();
  return countries.includes(normalized as CountryCode) ? normalized as CountryCode : null;
}

function statusBadgeClass(status: OfficialBenchmarkSource['status']) {
  if (status === 'live') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'ingestion_ready') return 'border-blue-200 bg-blue-50 text-blue-900';
  if (status === 'ingestion_planned') return 'border-amber-200 bg-amber-50 text-amber-950';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function verticalLabel(vertical: EssentialsVertical) {
  return vertical.charAt(0).toUpperCase() + vertical.slice(1);
}

function benchmarkNotice(source: OfficialBenchmarkSource) {
  if (source.status === 'live') return `Live benchmark source available as ${layerLabel(source.layer)}.`;
  if (source.status === 'registry_only') return 'Source documented, ingestion not yet implemented — no benchmark value is shown.';
  return 'Official benchmark exists for this category — ingestion planned.';
}

export default async function CountryBenchmarksPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country: countrySlug } = await params;
  const country = parseCountry(countrySlug);
  if (!country) notFound();

  const sources = verticals.flatMap((vertical) => getBenchmarksFor(country, vertical)).filter(
    (source, index, all) => all.findIndex((candidate) => candidate.id === source.id) === index
  );
  const sourceCountsByLayer = sources.reduce<Record<string, number>>((summary, source) => ({
    ...summary,
    [source.layer]: (summary[source.layer] ?? 0) + 1
  }), {});

  return (
    <PageShell>
      <Eyebrow>{countryNames[country]} official benchmark registry</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
        Official essentials benchmarks, separated from GroceryView retail observations.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
        This page is a registry, not a synthetic index dashboard. It documents which official sources exist for {countryNames[country]} across grocery, pharmacy, and fuel, and it refuses to render CPI, medicine, energy, or agriculture values until ingestion is explicitly live.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-950 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">Documented sources</p>
          <p className="mt-3 text-5xl font-black">{sources.length}</p>
          <p className="mt-3 text-sm font-semibold text-slate-200">All rows are metadata-only unless their status says live.</p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-900">Retail layer guardrail</p>
          <p className="mt-3 text-2xl font-black text-emerald-950">No fabricated values</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-900">Official indices, regulated references, upstream markets, and energy context are never merged into shelf prices.</p>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-900">Layer mix</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(sourceCountsByLayer).map(([layer, count]) => (
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-amber-950" key={layer}>{layer.replaceAll('_', ' ')} · {count}</span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-5">
        {sources.map((source) => (
          <Card className="overflow-hidden border-slate-200 bg-white" key={source.id}>
            <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
              <div>
                <div className="flex flex-wrap gap-2">
                  <BenchmarkLayerBadge layer={source.layer} />
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${statusBadgeClass(source.status)}`}>
                    {statusLabels[source.status]}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                    {source.frequency}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">{source.label}</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{source.notes}</p>
                <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-black leading-6 text-slate-800">
                  {benchmarkNotice(source)}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Source links</p>
                <Link className="mt-3 block rounded-2xl bg-white p-3 text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={source.homepageUrl ?? '#'}>
                  Homepage
                </Link>
                <Link className="mt-2 block rounded-2xl bg-white p-3 text-sm font-black text-slate-800 underline decoration-slate-300 underline-offset-4" href={source.apiUrl ?? source.homepageUrl ?? '#'}>
                  API / data access
                </Link>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {verticals.filter((vertical) => source.verticals.includes(vertical)).map((vertical) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${source.id}-${vertical}`}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{verticalLabel(vertical)}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{getBenchmarkCategories(source, vertical).length}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">mapped official categories</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
