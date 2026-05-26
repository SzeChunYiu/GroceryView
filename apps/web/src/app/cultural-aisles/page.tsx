import Link from 'next/link';
import { Card, PageShell } from '@/components/data-ui';
import {
  culturalAisleCoverageGaps,
  culturalAisleCoverageSummary,
  culturalAisleFilterCount,
  culturalAisleFilters,
  culturalAisleRowsForFilter,
  normalizeCulturalAisleFilter
} from '@/lib/cultural-aisles';
import { routeMetadata } from '@/lib/seo';

type CulturalAisleSearchParams = Readonly<{ filter?: string | string[] }>;

export function generateMetadata() {
  return routeMetadata('/cultural-aisles');
}

export default async function CulturalAislesPage({ searchParams }: Readonly<{ searchParams?: Promise<CulturalAisleSearchParams> }>) {
  const params = (await searchParams) ?? {};
  const activeFilter = normalizeCulturalAisleFilter(params.filter);
  const rows = culturalAisleRowsForFilter(activeFilter);
  const summary = culturalAisleCoverageSummary(rows);

  return (
    <PageShell>
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Verified cultural aisles</p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Halal, kosher, and ethnic aisle finder</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-emerald-950">
              Browse only source-backed specialty grocery rows. Religious suitability is shown only where the source evidence explicitly supports it; cultural aisle rows do not become halal or kosher by name matching.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <p className="rounded-2xl bg-white p-3 text-sm font-black text-emerald-950">{summary.rowCount}<span className="block text-xs font-bold text-emerald-700">rows</span></p>
            <p className="rounded-2xl bg-white p-3 text-sm font-black text-emerald-950">{summary.operatorCount}<span className="block text-xs font-bold text-emerald-700">operators</span></p>
            <p className="rounded-2xl bg-white p-3 text-sm font-black text-emerald-950">{summary.cityCount}<span className="block text-xs font-bold text-emerald-700">city labels</span></p>
            <p className="rounded-2xl bg-white p-3 text-sm font-black text-emerald-950">{summary.sourceCount}<span className="block text-xs font-bold text-emerald-700">sources</span></p>
          </div>
        </div>
      </section>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Cultural aisle filters">
        {culturalAisleFilters.map((filter) => {
          const isActive = filter.value === activeFilter;
          const href = filter.value === 'all' ? '/cultural-aisles' : `/cultural-aisles?filter=${encodeURIComponent(filter.value)}`;
          return (
            <Link
              className={`rounded-full border px-4 py-2 text-sm font-black ${isActive ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700 hover:text-emerald-900'}`}
              href={href}
              key={filter.value}
            >
              {filter.label} ({culturalAisleFilterCount(filter.value)})
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <Card className="border-slate-200 bg-white" key={row.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{row.retailerType}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{row.name}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-700">{row.operatorName} · {row.category}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900">{row.status.replace(/_/g, ' ')}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {row.tags.map((tag) => (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-700" key={tag}>{tag.replace(/-/g, ' ')}</span>
              ))}
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="font-black text-slate-950">Confidence</dt>
                <dd className="mt-1 font-semibold leading-6 text-slate-700">{row.confidenceLabel}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="font-black text-slate-950">Availability</dt>
                <dd className="mt-1 font-semibold leading-6 text-slate-700">{row.availabilityLabel}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">{row.caveat}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{row.evidenceText}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={row.productSearchHref}>Search source terms</Link>
              <a className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:border-emerald-700" href={row.sourceUrl}>Open source</a>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{row.sourceLabel} · {row.parserVersion} · {row.cities.join(', ')}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Coverage boundaries</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Skipped and partial evidence stays visible</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {culturalAisleCoverageGaps.map((gap) => (
            <div className="rounded-2xl bg-white p-4" key={gap.id}>
              <p className="text-sm font-black text-slate-950">{gap.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{gap.confidenceLabel}. {gap.evidenceLabel}.</p>
              <a className="mt-3 inline-flex rounded-full border border-amber-200 px-4 py-2 text-sm font-black text-amber-900" href={gap.sourceUrl}>Review source</a>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
