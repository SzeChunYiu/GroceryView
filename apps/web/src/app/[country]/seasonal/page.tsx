import Link from 'next/link';
import { buildNordicSeasonalProduceCalendar } from '../../../../../../packages/core/src/lib/seasonalProduce';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type SeasonalCountryPageProps = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: SeasonalCountryPageProps) {
  const { country } = await params;
  return routeMetadata({
    path: `/${country}/seasonal`,
    title: `Seasonal Nordic produce calendar | GroceryView`,
    description: 'Educational monthly guide for Nordic produce seasonality, local cheap windows, and chains to compare.',
    noIndex: true
  });
}

export default async function SeasonalCountryPage({ params }: SeasonalCountryPageProps) {
  const { country } = await params;
  const months = buildNordicSeasonalProduceCalendar(country);
  const activeMonths = months.filter((month) => month.produce.length > 0);

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} seasonal produce</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Nordic seasonal-produce calendar</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Educational month-by-month produce timing with observed seasonal price behavior and chains to compare. This is planning guidance from historical source rows, not a live price claim.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeMonths.map((month) => (
          <Card className="border-emerald-200 bg-emerald-50/70" key={month.monthLabel}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{month.monthLabel}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{month.produce.length} seasonal pick{month.produce.length === 1 ? '' : 's'}</h2>
            <div className="mt-4 grid gap-3">
              {month.produce.map((item) => (
                <div className="rounded-2xl bg-white p-4 shadow-sm" key={`${month.monthLabel}-${item.name}`}>
                  <h3 className="text-lg font-black text-slate-950">{item.name}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.expectedPriceBehavior}</p>
                  <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-black text-emerald-950">Compare: {item.recommendedChains.join(' · ')}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{item.educationNote}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Link className="mt-6 inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" href="/seasonal-calendar">
        Open observed price seasonality
      </Link>
    </PageShell>
  );
}
