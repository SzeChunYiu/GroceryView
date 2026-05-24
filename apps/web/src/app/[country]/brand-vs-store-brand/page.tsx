import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const storeBrandFamilies = ['ICA Basic', 'Coop X-tra', 'Eldorado', 'Garant', 'Änglamark'];

export default function BrandVsStoreBrandPage() {
  return (
    <PageShell>
      <Eyebrow>Top-100 SKU savings analysis</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Brand vs store-brand savings</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page is reserved for verified top-100 SKU comparisons between name brands and store brands. It deliberately withholds averages until matched SKU pairs exist for the selected country.
      </p>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-slate-950">No verified aggregate yet</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Real numbers only: average savings, sample sizes, and winners stay hidden until GroceryView has verified name-brand and store-brand matches for the top-100 SKU set.
        </p>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black text-slate-950">Included store-brand families</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
            {storeBrandFamilies.map((family) => <li key={family}>• {family}</li>)}
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-black text-slate-950">Required evidence before showing savings</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
            <li>• Same canonical product and comparable unit.</li>
            <li>• Current verified prices for name brand and store brand.</li>
            <li>• Sample size and freshness shown next to every aggregate.</li>
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
