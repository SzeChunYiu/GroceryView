import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatPriceStat, geoPriceStatisticsByScope, geoPriceStatisticsThresholds, scopeLabel } from '@/lib/geo-price-statistics';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/price-statistics');
}

export default function PriceStatisticsPage() {
  const scopeGroups = (['region', 'city', 'district'] as const).map((scope) => ({
    areas: geoPriceStatisticsByScope(scope),
    scope
  }));
  const totalAreas = scopeGroups.reduce((sum, group) => sum + group.areas.length, 0);
  const publishedBasketAreas = scopeGroups.flatMap((group) => group.areas).filter((area) => area.basket.status === 'published').length;

  return (
    <PageShell>
      <Eyebrow>Local price statistics</Eyebrow>
      <h1 className="mt-2 text-4xl font-black">Regional, city, and district grocery price levels</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        These pages aggregate only visible branch observations from the GroceryView driver data. Sparse cohorts show coverage and confidence, but their product, category, or basket price levels stay withheld until the minimum observation thresholds are met.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Area pages</p>
          <p className="mt-2 text-4xl font-black text-emerald-950">{totalAreas}</p>
          <p className="mt-2 text-sm font-semibold text-emerald-900">Region, city, and district cohorts with source-backed branch rows.</p>
        </Card>
        <Card className="border-sky-200 bg-sky-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-800">Basket stats</p>
          <p className="mt-2 text-4xl font-black text-sky-950">{publishedBasketAreas}</p>
          <p className="mt-2 text-sm font-semibold text-sky-900">Areas clearing product and category coverage thresholds.</p>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">Minimum coverage</p>
          <p className="mt-2 text-4xl font-black text-amber-950">{geoPriceStatisticsThresholds.productObservationCount}</p>
          <p className="mt-2 text-sm font-semibold text-amber-900">Observed product rows before product-level price statistics publish.</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6">
        {scopeGroups.map((group) => (
          <Card key={group.scope}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>{scopeLabel(group.scope)} pages</Eyebrow>
                <h2 className="mt-2 text-2xl font-black">{scopeLabel(group.scope)} price statistics</h2>
              </div>
              <p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                {group.areas.length} cohorts
              </p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {group.areas.map((area) => (
                <Link className="rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-700 hover:bg-emerald-50/50" href={area.href} key={area.href}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{area.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{area.coverageLabel}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">{area.confidenceLabel}</span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Products</p>
                      <p className="mt-1 font-black text-slate-950">{formatPriceStat(area.product.medianObservedPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Basket</p>
                      <p className="mt-1 font-black text-slate-950">{formatPriceStat(area.basket.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Categories</p>
                      <p className="mt-1 font-black text-slate-950">{area.categoryRows.filter((row) => row.status === 'published').length} published</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
