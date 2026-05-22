import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import type { seoLandingProducts } from '@/lib/seo-landing-pages';

type SeoLandingProduct = (typeof seoLandingProducts)[number];

type SeoProductLandingProps = {
  product: SeoLandingProduct;
  mode: 'cheapest' | 'comparison' | 'city';
  cityName?: string;
  cityEvidence?: string;
};

export function SeoProductLanding({ product, mode, cityName, cityEvidence }: Readonly<SeoProductLandingProps>) {
  const heading = mode === 'cheapest'
    ? `Billigaste ${product.name}`
    : mode === 'comparison'
      ? `${product.name} pris jämförelse`
      : `${product.name} i ${cityName ?? 'Stockholm'}`;

  return (
    <PageShell>
      <Eyebrow>Verified SEO landing</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">{heading}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This landing page is generated from GroceryView verified product price drivers, not from generated marketing estimates. It links search demand for Billigaste products, pris jämförelse, and Stockholm-style city discovery back to auditable product evidence.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Lowest verified signal</p>
          <p className="mt-2 text-4xl font-black text-emerald-800">{product.lowestPriceLabel}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Highest visible signal: {product.highestPriceLabel}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Evidence</p>
          <p className="mt-2 text-xl font-black text-slate-950">{product.sourceLabel}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Driver: {product.priceDriver}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Category</p>
          <p className="mt-2 text-xl font-black text-slate-950">{product.categoryLabel}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{product.brand} · {product.packageLabel}</p>
        </Card>
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">No fabricated numbers</h2>
        <p className="mt-3 leading-7 text-amber-950">
          GroceryView does not create city-level, branch-level, stock, delivery, or checkout claims on this landing page. {cityEvidence ?? 'No branch-specific city price is inferred without matching branch evidence.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={`/products/${product.slug}`}>Open product evidence</Link>
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950" href={`/categories/${product.category}`}>Browse category</Link>
        </div>
      </Card>
    </PageShell>
  );
}
