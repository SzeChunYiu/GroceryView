import Link from 'next/link';
import { TrendingCategoryCarousel } from '@/components/TrendingCarousel';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { buildTrendingCategories } from '@/lib/trending-categories';
import { categoryDealLeaders, formatSek, homepageTrendingPriceChanges, seasonalProduceCalendar } from '@/lib/verified-data';
import { publicCatalogueRevalidateSeconds, routeMetadata } from '@/lib/seo';

export const revalidate = publicCatalogueRevalidateSeconds;

export function generateMetadata() {
  return routeMetadata('/discover');
}

export default function DiscoverPage() {
  const trendingCategories = buildTrendingCategories(10);
  const topCategory = trendingCategories[0];
  const priceMoveCount = homepageTrendingPriceChanges.reduce((sum, item) => sum + item.changeCount, 0);
  const seasonalSignalCount = seasonalProduceCalendar.topBestBuys.length;

  return (
    <PageShell>
      <Eyebrow>Discover</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Trending grocery categories</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Categories are ranked from recent observed price movement, verified shopper-savings leaders, and seasonal demand signals. GroceryView links every card back to category pages instead of inventing personalized demand.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Card className="border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-semibold text-violet-900">Top category</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{topCategory?.categoryLabel ?? 'No category signal'}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{topCategory?.evidenceLabel ?? 'No verified rows are available for ranking.'}</p>
        </Card>
        <Card className="border-cyan-200 bg-cyan-50 p-4">
          <p className="text-sm font-semibold text-cyan-900">Recent movement</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{priceMoveCount}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">observed product price moves feeding category discovery.</p>
        </Card>
        <Card className="border-lime-200 bg-lime-50 p-4">
          <p className="text-sm font-semibold text-lime-900">Seasonal demand</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{seasonalSignalCount}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">historical best-buy rows from the seasonal calendar, with no forecast claims.</p>
        </Card>
      </div>

      <TrendingCategoryCarousel items={trendingCategories} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Shopper saves</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Category deal leaders backing discovery</h2>
            </div>
            <Link className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white" href="/categories">
              Browse categories
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {categoryDealLeaders.slice(0, 6).map((leader) => (
              <Link className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700" href={`/categories/${leader.categorySlug}`} key={`${leader.categorySlug}-${leader.productSlug}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{leader.categoryLabel}</p>
                <h3 className="mt-2 font-black text-slate-950">{leader.productName}</h3>
                <p className="mt-2 text-xl font-black text-emerald-800">{leader.signal}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{leader.evidenceLabel}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Seasonal demand</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Historical best-buy categories</h2>
            </div>
            <Link className="rounded-full bg-lime-700 px-5 py-3 text-sm font-black text-white" href="/seasonal-calendar">
              Seasonal calendar
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {seasonalProduceCalendar.topBestBuys.slice(0, 6).map((row) => (
              <Link className="rounded-2xl border border-slate-200 bg-lime-50 p-4 hover:border-lime-700" href={`/products/${row.slug}`} key={row.slug}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">{row.categoryLabel}</p>
                <h3 className="mt-2 font-black text-slate-950">{row.productName}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-700">{row.bestBuyMonth} · {row.confidenceLabel}</p>
                <p className="mt-2 text-xl font-black text-lime-900">{row.historicalMonthlyAverageLabel || formatSek(row.historicalMonthlyAverage)}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
