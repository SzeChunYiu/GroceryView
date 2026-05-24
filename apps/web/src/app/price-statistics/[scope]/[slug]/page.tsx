import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { findGeoPriceStatistic, formatPriceStat, geoPriceStaticParams, scopeLabel } from '@/lib/geo-price-statistics';
import { routeMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return geoPriceStaticParams();
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ scope: string; slug: string }> }>) {
  const { scope, slug } = await params;
  const area = findGeoPriceStatistic(scope, slug);
  if (!area) notFound();
  return routeMetadata({
    path: area.href,
    title: `${area.label} grocery price statistics | GroceryView`,
    description: `${scopeLabel(area.scope)} product, category, and basket price levels for ${area.label}, with source-backed coverage and confidence labels.`
  });
}

function statusTone(status: 'published' | 'withheld') {
  return status === 'published'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
    : 'border-amber-200 bg-amber-50 text-amber-950';
}

export default async function GeoPriceStatisticPage({ params }: Readonly<{ params: Promise<{ scope: string; slug: string }> }>) {
  const { scope, slug } = await params;
  const area = findGeoPriceStatistic(scope, slug);
  if (!area) notFound();

  return (
    <PageShell>
      <Eyebrow>{scopeLabel(area.scope)} price statistics</Eyebrow>
      <h1 className="mt-2 text-4xl font-black">{area.label} grocery price levels</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Product, category, and basket statistics use observed branch rows only. When coverage is thin, GroceryView shows the blocker and confidence label instead of inventing a local price rank.
      </p>
      <div className="mt-4">
        <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/price-statistics">
          Back to all local price statistics
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className={statusTone(area.product.status)}>
          <p className="text-sm font-black uppercase tracking-[0.18em] opacity-75">Product price level</p>
          <p className="mt-2 text-4xl font-black">{formatPriceStat(area.product.medianObservedPrice)}</p>
          <p className="mt-2 text-sm font-semibold">{area.product.observationCount} observed branch product rows · {area.product.status}</p>
        </Card>
        <Card className={statusTone(area.basket.status)}>
          <p className="text-sm font-black uppercase tracking-[0.18em] opacity-75">Basket price level</p>
          <p className="mt-2 text-4xl font-black">{formatPriceStat(area.basket.totalPrice)}</p>
          <p className="mt-2 text-sm font-semibold">{area.basket.coverageLabel} · {area.basket.status}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Coverage / confidence</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{area.confidenceLabel}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{area.coverageLabel}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">Source: {area.sourceLabel}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Category price levels</Eyebrow>
            <h2 className="mt-2 text-2xl font-black">Observed category cohorts</h2>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            {area.categoryRows.length} categories with top-deal mapping
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {area.categoryRows.map((row) => (
            <div className={`rounded-2xl border p-4 ${statusTone(row.status)}`} key={row.categorySlug}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link className="font-black underline decoration-transparent underline-offset-4 hover:decoration-current" href={`/categories/${row.categorySlug}`}>
                    {row.categoryLabel}
                  </Link>
                  <p className="mt-1 text-sm font-semibold opacity-80">{row.coverageLabel}</p>
                </div>
                <p className="rounded-full bg-white/75 px-3 py-1 text-xs font-black uppercase">{row.status}</p>
              </div>
              <p className="mt-4 text-3xl font-black">{formatPriceStat(row.medianPrice)}</p>
              <p className="mt-2 text-sm font-semibold opacity-80">{row.confidenceLabel}</p>
            </div>
          ))}
          {area.categoryRows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-700">
              No category price rows are mapped for this area yet.
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Product price levels</Eyebrow>
            <h2 className="mt-2 text-2xl font-black">Observed product cohorts</h2>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            {area.productRows.filter((row) => row.status === 'published').length} published products
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {area.productRows.slice(0, 12).map((row) => (
            <div className={`rounded-2xl border p-4 ${statusTone(row.status)}`} key={row.productSlug}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{row.productName}</p>
                  <p className="mt-1 text-sm font-semibold opacity-80">{row.coverageLabel}</p>
                </div>
                <p className="rounded-full bg-white/75 px-3 py-1 text-xs font-black uppercase">{row.status}</p>
              </div>
              <p className="mt-4 text-3xl font-black">{formatPriceStat(row.medianPrice)}</p>
              <p className="mt-2 text-sm font-semibold opacity-80">{row.confidenceLabel}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-slate-200 bg-slate-50">
        <Eyebrow>Consumer-org guardrails</Eyebrow>
        <h2 className="mt-2 text-2xl font-black">What is published and what is withheld</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="font-black text-slate-950">Real data only</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">Every number on this page comes from visible product and store driver rows; no absent branch price is filled in.</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="font-black text-slate-950">Coverage thresholds</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">Product, category, and basket levels publish independently, so a partial district can show products while withholding baskets.</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="font-black text-slate-950">Comparable claims</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">These are local observed price levels, not a full cost-of-living index or route recommendation.</p>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
