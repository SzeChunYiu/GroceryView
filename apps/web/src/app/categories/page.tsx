import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { categorySummaries, formatPct, formatSek, immigrantAisleFinder } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/categories');
}

export default function CategoriesIndexPage() {
  return (
    <PageShell>
      <Eyebrow>Categories</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Category coverage from verified product rows</h1>
      <Card className="mt-6 border-orange-200 bg-orange-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-800">Immigrants / new arrivals</p>
        <h2 className="mt-2 text-2xl font-black">Halal, kosher & ethnic aisle finder</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          These aisle entry points map dietaryTags to verifiedCategorySlug values and keep certification as a package-label or store-confirmation step, not an inferred claim.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {immigrantAisleFinder.map((aisle) => (
            <Link className="rounded-2xl border border-orange-200 bg-white p-4 hover:border-orange-700" href={`/categories/${aisle.verifiedCategorySlug}`} key={aisle.label}>
              <p className="font-black text-slate-950">{aisle.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">verifiedCategorySlug: {aisle.verifiedCategorySlug}</p>
              <p className="mt-2 text-sm font-bold text-orange-900">dietaryTags: {aisle.dietaryTags.join(', ')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{aisle.caveat}</p>
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categorySummaries.map((category) => (
          <Link href={`/categories/${category.slug}`} key={category.slug}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-emerald-700">
              <h2 className="text-2xl font-black">{category.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{category.openPriceRows} OpenPrices rows and {category.chainRows} Axfood rows.</p>
              <div className="mt-4 flex justify-between gap-3 text-sm font-black"><span>{formatSek(category.medianPrice)}</span><span>{formatPct(category.strongestSpread)} max spread</span></div>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
