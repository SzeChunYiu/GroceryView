import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import type { SeoLandingCity, SeoLandingProduct } from '@/lib/seo-landing-pages';

type SeoLandingKind = 'cheapest' | 'compare' | 'city';

type SeoLandingPageProps = {
  product: SeoLandingProduct;
  kind: SeoLandingKind;
  city?: SeoLandingCity;
};

function headingFor(product: SeoLandingProduct, kind: SeoLandingKind, city?: SeoLandingCity) {
  if (kind === 'compare') return `${product.name} prisjämförelse`;
  if (kind === 'city') return `Billigaste ${product.name} i ${city?.label ?? 'Stockholm'}`;
  return `Billigaste ${product.name}`;
}

function introFor(product: SeoLandingProduct, kind: SeoLandingKind, city?: SeoLandingCity) {
  if (kind === 'compare') return `Compare ${product.name} across verified Willys and Hemkop chain rows. Cheapest observed chain: ${product.cheapestChainLabel}.`;
  if (kind === 'city') return `${city?.evidence ?? 'City landing page'} Lowest verified chain row: ${product.cheapestChainLabel} at ${product.cheapestPriceLabel}.`;
  return `${product.cheapestChainLabel} is the cheapest verified chain row for ${product.name} at ${product.cheapestPriceLabel}.`;
}

export function SeoLandingPage({ product, kind, city }: SeoLandingPageProps) {
  const heading = headingFor(product, kind, city);
  return (
    <PageShell>
      <Eyebrow>Programmatic SEO · Verified price spread</Eyebrow>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">{heading}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">{introFor(product, kind, city)}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">
            <Link className="rounded-full bg-slate-950 px-4 py-2 text-white" href={`/products/${product.slug}`}>Open product ticker</Link>
            <Link className="rounded-full bg-emerald-700 px-4 py-2 text-white" href="/compare">Compare all matched products</Link>
            <Link className="rounded-full bg-white px-4 py-2 text-slate-800 ring-1 ring-slate-200" href={`/categories/${product.categorySlug}`}>{product.categoryLabel}</Link>
          </div>
        </div>
        <Card className="border-emerald-200 bg-emerald-50/70">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Cheapest verified chain</p>
          <p className="mt-3 text-4xl font-black text-emerald-900">{product.cheapestPriceLabel}</p>
          <p className="mt-2 text-lg font-black text-slate-950">{product.cheapestChainLabel}</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{product.priceGapLabel} gap vs {product.priciestChainLabel} · {product.spreadPctLabel} spread</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-tight">Product evidence</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Brand</dt><dd>{product.brand}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Package</dt><dd>{product.packageLabel}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Evidence</dt><dd>{product.evidenceLabel}</dd></div>
            <div className="rounded-2xl bg-amber-50 p-4 text-amber-950"><dt className="font-black">Claim boundary</dt><dd>{product.confidenceLabel} No synthetic prices.</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-2xl font-black tracking-tight">Chain price table</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-[0.18em] text-slate-600">
                <tr><th className="p-3">Chain</th><th className="p-3">Price</th><th className="p-3">Unit</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {product.chainRows.map((row) => (
                  <tr key={row.chain}>
                    <td className="p-3 font-black text-slate-950">{row.chainLabel}</td>
                    <td className="p-3 font-black text-emerald-800">{row.priceLabel}</td>
                    <td className="p-3 text-slate-600">{row.unitLabel}</td>
                    <td className="p-3 text-xs font-black text-slate-600">{row.chain === product.cheapestChain ? 'Cheapest verified row' : 'Matched comparison row'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
