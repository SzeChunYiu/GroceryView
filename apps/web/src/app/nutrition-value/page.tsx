import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { nutritionPerKrona } from '@/lib/demo-data';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export default function NutritionValuePage() {
  return (
    <PageShell>
      <Eyebrow>Nutrition per krona</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Best protein value per 10 SEK</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This route uses the real rankNutritionPerKrona core ranking on visible product rows that also have package nutrition-label fixtures. Products without label coverage are excluded instead of estimated.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Ranked labels</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{nutritionPerKrona.coverage.labelledProducts}</p>
          <p className="mt-3 font-semibold text-slate-700">of {nutritionPerKrona.coverage.visibleProducts} visible products have nutrition-label coverage.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Metric</p>
          <p className="mt-2 text-5xl font-black text-slate-950">Protein</p>
          <p className="mt-3 font-semibold text-slate-700">Ranked as grams per 10 SEK using current visible price rows.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Confidence</p>
          <p className="mt-2 text-5xl font-black capitalize text-slate-950">{nutritionPerKrona.coverage.confidence}</p>
          <p className="mt-3 font-semibold text-slate-700">{nutritionPerKrona.coverage.caveat}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Protein value leaderboard</h2>
        <div className="mt-4 space-y-3">
          {nutritionPerKrona.rows.map((row, index) => (
            <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${row.productId}`} key={row.productId}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">#{index + 1}</p>
                  <p className="text-xl font-black text-slate-950">{row.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{row.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-800">{row.valuePer10Sek.toFixed(2)}g</p>
                  <p className="text-sm font-semibold text-slate-600">protein / 10 SEK · price {formatSek(row.price)}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Calories: {row.nutritionPerPackage.calories}</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Sugar: {row.sugarPerPackage}g</p>
                <p className={`rounded-2xl p-3 font-semibold ${row.saltWarning ? 'bg-amber-50 text-amber-950' : 'bg-emerald-50 text-emerald-950'}`}>{row.saltWarning ? 'Salt warning' : 'No salt warning'}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
