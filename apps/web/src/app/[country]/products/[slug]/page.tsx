import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { pricedProducts } from '@/lib/openprices-products';
import { chainPriceRows, dataFreshnessBadges, findProduct, formatSek, labelFromSlug } from '@/lib/verified-data';
import { metadataForProduct } from '@/lib/seo';

const countries = ['se', 'no', 'is'] as const;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string; slug: string }> }>) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  return metadataForProduct(product);
}

export function generateStaticParams() {
  return countries.flatMap((country) => (
    [...axfoodProducts.slice(0, 20), ...pricedProducts.slice(0, 20)].map((product) => ({ country, slug: product.slug }))
  ));
}

function confidenceLevel(value: number): 'high' | 'medium' | 'low' {
  if (value >= 0.8) return 'high';
  if (value >= 0.45) return 'medium';
  return 'low';
}

export default async function CountryProductPage({ params }: Readonly<{ params: Promise<{ country: string; slug: string }> }>) {
  const { country, slug } = await params;
  if (!countries.includes(country as (typeof countries)[number])) notFound();
  const product = findProduct(slug);
  if (!product) notFound();

  const isChain = 'lowestPrice' in product;
  const rows = isChain ? chainPriceRows(product) : [];
  const freshnessBadge = dataFreshnessBadges.find((badge) => badge.sourceKind === (isChain ? 'axfood' : 'openprices')) ?? dataFreshnessBadges[0]!;
  const sourceRows = isChain
    ? rows.map((row) => ({
      chain: row.chain,
      priceLabel: formatSek(row.price),
      confidence: confidenceLevel(rows.length / 6),
      detail: row.priceUnit || 'Unit not reported',
    }))
    : [{
      chain: 'OpenPrices community',
      priceLabel: formatSek(product.priceMedian),
      confidence: confidenceLevel(product.observationCount / 30),
      detail: `${product.observationCount} observation(s)`,
    }];
  const chainList = sourceRows.map((row) => row.chain).join(', ');
  const lastObserved = isChain ? freshnessBadge.freshnessLabel : product.lastObservedAt;

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} product</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{product.name}</h1>
      <p className="mt-3 text-lg text-slate-700">{isChain ? product.brand : product.brands || 'Brand not reported'} · {labelFromSlug(product.category)}</p>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Country price table</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sourceRows.map((row) => (
            <div className="rounded-2xl border border-slate-200 p-4" key={row.chain}>
              <p className="font-black text-slate-950">{row.chain}</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{row.priceLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Per-chain source attribution</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Prices observed from: {chainList}, last {lastObserved}</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Each source below keeps its own confidence badge so country product pages do not merge chain evidence into an unsupported all-market claim.
            </p>
          </div>
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={`/coverage?country=${country}`}>
            View coverage
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sourceRows.map((row) => (
            <div className="rounded-2xl bg-white p-4" key={`${row.chain}-confidence`}>
              <p className="mb-3 font-black text-slate-950">{row.chain}</p>
              <ConfidenceBadge level={row.confidence} label={`${row.confidence} confidence`} sampleSize={isChain ? rows.length : product.observationCount} />
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
