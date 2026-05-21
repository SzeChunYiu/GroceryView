import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { pricedProducts } from '@/lib/openprices-products';
import { chainPriceRows, findProduct, formatPct, formatSek, labelFromSlug } from '@/lib/verified-data';

export function generateStaticParams() {
  return [...axfoodProducts.slice(0, 40), ...pricedProducts.slice(0, 40)].map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const isChain = 'lowestPrice' in product;
  return (
    <PageShell>
      <Eyebrow>{isChain ? 'Axfood chain product' : 'OpenPrices product'}</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">{product.name}</h1>
      <p className="mt-3 text-lg text-slate-700">{isChain ? product.brand : product.brands || 'Brand not reported'} · {isChain ? product.subline : product.quantity || 'Quantity not reported'}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-2xl font-black">Primary price evidence</h2>
          {isChain ? (
            <div className="mt-4 grid gap-3">
              <p className="text-5xl font-black text-emerald-800">{formatSek(product.lowestPrice)}</p>
              <p className="font-semibold text-slate-700">Lowest chain: {product.lowestChain}. Highest observed chain price: {formatSek(product.highestPrice)}.</p>
              <p className="rounded-2xl bg-amber-50 p-4 font-black text-amber-950">Comparable spread: {formatPct(product.spreadPct)}. This is chain-wide catalogue evidence, not per-branch shelf evidence.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <p className="text-5xl font-black text-emerald-800">{formatSek(product.priceMedian)}</p>
              <p className="font-semibold text-slate-700">Observed {product.observationCount} time(s); latest observation {product.lastObservedAt}.</p>
              <p className="rounded-2xl bg-amber-50 p-4 font-black text-amber-950">Range: {formatSek(product.priceMin)} to {formatSek(product.priceMax)}. Community OpenPrices data is displayed with explicit count and date.</p>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-2xl font-black">Source fields</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Code</dt><dd>{product.code}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Category</dt><dd>{labelFromSlug(product.category)}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Source</dt><dd>{isChain ? 'Willys/Hemköp public search snapshot' : 'OpenPrices / Open Food Facts SEK observation'}</dd></div>
          </dl>
        </Card>
      </div>
      {isChain ? (
        <Card className="mt-6">
          <h2 className="text-2xl font-black">Chain price rows</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {chainPriceRows(product).map((row) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={row.chain}>
                <p className="text-lg font-black capitalize">{row.chain}</p>
                <p className="mt-1 text-3xl font-black text-emerald-800">{formatSek(row.price)}</p>
                <p className="text-sm text-slate-600">{row.priceUnit || 'Unit not reported'}{row.savings ? ` · listed saving ${formatSek(row.savings)}` : ''}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </PageShell>
  );
}
