import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const PRODUCTS = [
  { name: 'Milk 1 l', min: 15.9, max: 21.9, regions: [{ name: 'Stockholm', index: 0.82 }, { name: 'Skåne', index: 0.54 }, { name: 'Norrbotten', index: 1.0 }] },
  { name: 'Oats 1 kg', min: 18.5, max: 25.0, regions: [{ name: 'Stockholm', index: 0.71 }, { name: 'Skåne', index: 0.48 }, { name: 'Norrbotten', index: 0.95 }] },
  { name: 'Coffee 450 g', min: 49.0, max: 69.0, regions: [{ name: 'Stockholm', index: 0.65 }, { name: 'Skåne', index: 0.57 }, { name: 'Norrbotten', index: 1.0 }] }
];

export default async function RegionalDisparityPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const mostOvercharged = PRODUCTS.flatMap((product) => product.regions.map((region) => ({ ...region, product: product.name }))).sort((a, b) => b.index - a.index)[0];

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} regional prices</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Regional price disparity report</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Track price ranges for each canonical product across regions, then highlight overcharged areas and food-desert risk where the regional index is highest.
      </p>
      <Card className="mt-6 border-orange-200 bg-orange-50/80">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-800">Highest disparity</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">{mostOvercharged.product} in {mostOvercharged.name}</h2>
        <p className="mt-2 text-sm font-semibold text-slate-700">Regional heat index {Math.round(mostOvercharged.index * 100)} / 100. Prioritize store coverage and alert audits here.</p>
      </Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {PRODUCTS.map((product) => (
          <Card key={product.name}>
            <h2 className="text-xl font-black text-slate-950">{product.name}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">Range {formatSek(product.min)} - {formatSek(product.max)} · spread {formatSek(product.max - product.min)}</p>
            <div className="mt-4 grid gap-2">
              {product.regions.map((region) => (
                <div className="rounded-2xl bg-slate-50 p-3" key={region.name}>
                  <div className="flex items-center justify-between text-sm font-black text-slate-800">
                    <span>{region.name}</span>
                    <span>{Math.round(region.index * 100)}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
                    <div className={region.index > 0.9 ? 'h-full bg-rose-600' : region.index > 0.7 ? 'h-full bg-orange-500' : 'h-full bg-emerald-500'} style={{ width: `${region.index * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">Food-desert watchlist</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Regions with high heat index and sparse store coverage should be reviewed for overcharged staples before triggering shopper-facing alerts.</p>
      </Card>
    </PageShell>
  );
}

function formatSek(value: number) {
  return `${value.toFixed(2)} SEK`;
}
