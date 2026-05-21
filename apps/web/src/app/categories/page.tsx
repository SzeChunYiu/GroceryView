import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { categorySummaries, formatPct, formatSek } from '@/lib/verified-data';

export default function CategoriesIndexPage() {
  return (
    <PageShell>
      <Eyebrow>Categories</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Category coverage from verified product rows</h1>
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
