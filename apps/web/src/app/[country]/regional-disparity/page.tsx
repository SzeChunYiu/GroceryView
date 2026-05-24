import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const regionalRows = [
  { product: 'Milk 1L', lowRegion: 'Skåne', highRegion: 'Norrbotten', lowPrice: 14.9, highPrice: 19.9, desertRisk: 'medium' },
  { product: 'Coffee 450g', lowRegion: 'Stockholm', highRegion: 'Gotland', lowPrice: 49.9, highPrice: 68.9, desertRisk: 'high' },
  { product: 'Oats 1kg', lowRegion: 'Västra Götaland', highRegion: 'Jämtland', lowPrice: 18.9, highPrice: 24.9, desertRisk: 'medium' },
  { product: 'Bananas 1kg', lowRegion: 'Skåne', highRegion: 'Västerbotten', lowPrice: 22.9, highPrice: 29.9, desertRisk: 'high' }
] as const;

export function generateMetadata() {
  return routeMetadata('/regional-disparity');
}

export default async function RegionalDisparityPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} regional pricing</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Regional price disparity report</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Compare canonical products across regions to spot high price ranges, food-desert risk, and overcharged areas.
      </p>
      <Card className="mt-6 border-sky-200 bg-sky-50/70">
        <div className="grid gap-3 md:grid-cols-4">
          {regionalRows.map((row) => {
            const range = row.highPrice - row.lowPrice;
            const rangePct = (range / row.lowPrice) * 100;
            return (
              <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm" key={row.product}>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-800">{row.desertRisk} risk</p>
                <h2 className="mt-2 text-lg font-black text-slate-950">{row.product}</h2>
                <div className="mt-4 h-24 rounded-2xl bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-300 p-3 text-xs font-black text-slate-900" aria-label={`${row.product} regional heatmap`}>
                  <span className="block">Low: {row.lowRegion}</span>
                  <span className="mt-8 block text-right">High: {row.highRegion}</span>
                </div>
                <p className="mt-3 rounded-xl bg-sky-50 p-3 text-sm font-black text-sky-950">
                  Range {range.toFixed(2)} kr · {rangePct.toFixed(0)}%
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </PageShell>
  );
}
