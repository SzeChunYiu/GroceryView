import Link from 'next/link';
import { MarketShell } from '@/components/market-shell';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}

type SearchParams = {
  neighborhood?: string | string[];
  region?: string | string[];
};

const homepageTrendRows = [
  { item: 'Oat milk', neighborhood: 'Möllevången', region: 'Skåne', liftPct: 18, signal: 'breakfast baskets' },
  { item: 'Fresh coriander', neighborhood: 'Möllevången', region: 'Skåne', liftPct: 14, signal: 'weeknight tacos' },
  { item: 'Rye crispbread', neighborhood: 'Södermalm', region: 'Stockholm', liftPct: 16, signal: 'pantry restocks' },
  { item: 'Frozen blueberries', neighborhood: 'Södermalm', region: 'Stockholm', liftPct: 11, signal: 'smoothie baskets' },
  { item: 'Halloumi', neighborhood: 'Linné', region: 'Västra Götaland', liftPct: 13, signal: 'grill lists' },
  { item: 'Baby spinach', neighborhood: 'Linné', region: 'Västra Götaland', liftPct: 9, signal: 'lunch salads' }
];

function firstParam(value: string | string[] | undefined, fallback: string) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || fallback;
}

export default async function HomePage({ searchParams }: { searchParams?: Promise<SearchParams> } = {}) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const neighborhood = firstParam(resolvedSearchParams.neighborhood, 'Möllevången');
  const region = firstParam(resolvedSearchParams.region, 'Skåne');
  const exactRows = homepageTrendRows.filter((trend) => trend.neighborhood === neighborhood && trend.region === region);
  const regionalRows = homepageTrendRows.filter((trend) => trend.region === region && !exactRows.includes(trend));
  const trendRows = [...exactRows, ...regionalRows, ...homepageTrendRows.filter((trend) => !exactRows.includes(trend) && !regionalRows.includes(trend))].slice(0, 4);

  return (
    <>
      <MarketShell />
      <section className="mx-auto mt-8 max-w-6xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="neighborhood-trends-heading">
        <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Neighborhood trend board</p>
              <h2 id="neighborhood-trends-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Trending in {neighborhood}, {region}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                Ranks local basket signals before regional fallbacks, so discovery reflects the chosen neighborhood instead of country-level averages.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-black">
              <Link className="rounded-full bg-emerald-900 px-4 py-2 text-white" href="/?neighborhood=M%C3%B6llev%C3%A5ngen&region=Sk%C3%A5ne">Möllevången</Link>
              <Link className="rounded-full bg-white px-4 py-2 text-emerald-900 shadow-sm" href="/?neighborhood=S%C3%B6dermalm&region=Stockholm">Södermalm</Link>
              <Link className="rounded-full bg-white px-4 py-2 text-emerald-900 shadow-sm" href="/?neighborhood=Linn%C3%A9&region=V%C3%A4stra%20G%C3%B6taland">Linné</Link>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {trendRows.map((trend, index) => (
              <article className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" key={`${trend.neighborhood}-${trend.item}`}>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">#{index + 1} · {trend.neighborhood}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{trend.item}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{trend.region} · {trend.signal}</p>
                <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-2xl font-black text-emerald-950">+{trend.liftPct}%</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
