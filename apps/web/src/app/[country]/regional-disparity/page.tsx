import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const regionalRows = [
  {
    product: 'Milk 1L',
    lowRegion: 'Skåne',
    highRegion: 'Norrbotten',
    lowPrice: 12.9,
    highPrice: 18.5,
    heat: 'high',
    desertSignal: 'Long travel distance and sparse discount coverage in northern rural stores'
  },
  {
    product: 'Eggs 12-pack',
    lowRegion: 'Västra Götaland',
    highRegion: 'Gotland',
    lowPrice: 29.9,
    highPrice: 43.5,
    heat: 'high',
    desertSignal: 'Island logistics and fewer competing chains raise the observed range'
  },
  {
    product: 'Sourdough bread',
    lowRegion: 'Stockholm',
    highRegion: 'Jämtland',
    lowPrice: 24.0,
    highPrice: 35.0,
    heat: 'medium',
    desertSignal: 'Smaller assortment and fewer bakery promotions outside metro corridors'
  },
  {
    product: 'Oats 1kg',
    lowRegion: 'Uppsala',
    highRegion: 'Västerbotten',
    lowPrice: 16.9,
    highPrice: 25.9,
    heat: 'medium',
    desertSignal: 'Staple remains available but discount depth is lower in remote pickup zones'
  }
] as const;

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

function spreadPercent(low: number, high: number) {
  return Math.round(((high - low) / low) * 100);
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;

  return routeMetadata({
    path: `/${country}/regional-disparity`,
    title: 'Regional price disparity report | GroceryView',
    description: 'Map canonical grocery price ranges across regions to identify food deserts and overcharged areas.'
  });
}

export default async function RegionalDisparityPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const widestSpread = regionalRows.reduce((winner, row) => (row.highPrice - row.lowPrice > winner.highPrice - winner.lowPrice ? row : winner), regionalRows[0]);

  return (
    <PageShell>
      <Eyebrow>Regional disparity</Eyebrow>
      <div className="mt-2 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Canonical grocery price ranges by region</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            This {country.replace(/-/g, ' ')} report compares canonical staples across regions, highlights the lowest and highest observed prices, and flags possible food deserts where fewer chains or longer travel distances leave shoppers overcharged.
          </p>
        </div>
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-800">Largest spread</p>
          <p className="mt-2 text-3xl font-black text-rose-950">{widestSpread.product}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-rose-950">
            {formatSek(widestSpread.lowPrice)} in {widestSpread.lowRegion} to {formatSek(widestSpread.highPrice)} in {widestSpread.highRegion} ({spreadPercent(widestSpread.lowPrice, widestSpread.highPrice)}% spread).
          </p>
        </Card>
      </div>

      <Card className="mt-6 border-slate-200 bg-slate-950 text-white">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Heatmap preview</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {regionalRows.map((row) => (
            <div className={`rounded-2xl p-4 ${row.heat === 'high' ? 'bg-rose-500/80' : 'bg-amber-400/80 text-slate-950'}`} key={row.product}>
              <p className="text-sm font-black">{row.product}</p>
              <p className="mt-2 text-xs font-bold">Hotspot: {row.highRegion}</p>
              <p className="mt-1 text-2xl font-black">{spreadPercent(row.lowPrice, row.highPrice)}%</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="mt-6 grid gap-4" aria-label="Regional product price disparities">
        {regionalRows.map((row) => (
          <Card key={row.product}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{row.product}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{row.desertSignal}</p>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-black text-rose-900">{spreadPercent(row.lowPrice, row.highPrice)}% range</span>
            </div>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Lowest region</dt>
                <dd className="mt-1 text-lg font-black text-emerald-950">{row.lowRegion} · {formatSek(row.lowPrice)}</dd>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-rose-800">Overcharged hotspot</dt>
                <dd className="mt-1 text-lg font-black text-rose-950">{row.highRegion} · {formatSek(row.highPrice)}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
