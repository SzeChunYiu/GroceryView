import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brandedMedicationSlugs, buildGenericMedicationComparison } from '@/lib/generic-medication';
import { routeMetadata } from '@/lib/seo';
import { Card, DashboardHero, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';

type PageParams = {
  country: string;
  product: string;
};

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    currency: 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value);
}

export function generateStaticParams() {
  return brandedMedicationSlugs.map((product) => ({ country: 'sweden', product }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<PageParams> }>) {
  const { country, product } = await params;
  const comparison = buildGenericMedicationComparison(product);
  if (!comparison) return routeMetadata('/pharmacy');

  return routeMetadata({
    path: `/${country}/pharmacy/${product}`,
    title: `${comparison.brandedProduct.name} generic comparison | GroceryView`,
    description: `Compare ${comparison.brandedProduct.name} with generic OTC products linked by active ingredient and average price evidence.`,
    noIndex: true
  });
}

export default async function PharmacyProductComparisonPage({ params }: Readonly<{ params: Promise<PageParams> }>) {
  const { country, product } = await params;
  const comparison = buildGenericMedicationComparison(product);
  if (!comparison) notFound();

  const { brandedProduct, genericProducts } = comparison;

  return (
    <PageShell>
      <DashboardHero
        actions={
          <>
            <StatusBadge tone="success">Active ingredient match</StatusBadge>
            <StatusBadge tone="warning">OTC only</StatusBadge>
          </>
        }
        eyebrow={`${country.toUpperCase()} pharmacy OTC comparison`}
        title={`${brandedProduct.name} vs matching generics`}
      >
        <p>
          This page links branded OTC products to generic alternatives by active ingredient, strength, and package size, then shows average savings from public catalog price evidence. It does not rank prescription products, start checkout, or provide medical advice.
        </p>
      </DashboardHero>

      <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Generic medication savings summary">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Active ingredient</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{comparison.activeIngredient}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{brandedProduct.strength} - {brandedProduct.packageLabel}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Brand average</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(brandedProduct.averagePrice)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Generic average</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{formatSek(comparison.averageGenericPrice)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Average savings</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{formatSek(comparison.averageSavings)}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{formatPercent(comparison.averageSavingsPercent)}% vs brand average</p>
        </Card>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <Eyebrow>Branded OTC</Eyebrow>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{brandedProduct.name}</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <ComparisonFact label="Brand" value={brandedProduct.brand} />
            <ComparisonFact label="Average price" value={formatSek(brandedProduct.averagePrice)} />
            <ComparisonFact label="Evidence" value={`${brandedProduct.observationCount} observations`} />
            <ComparisonFact label="Source" value={brandedProduct.sourceLabel} />
          </dl>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <Eyebrow>Generic alternatives</Eyebrow>
          <div className="mt-4 grid gap-3">
            {genericProducts.map((generic) => (
              <div className="rounded-2xl border border-emerald-100 bg-white p-4" key={generic.slug}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">{generic.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{generic.brand} - {generic.strength} - {generic.packageLabel}</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-800">{formatSek(generic.averagePrice)}</p>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                  Linked by active ingredient {generic.activeIngredient}; {generic.observationCount} public OTC observations.
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <Eyebrow>Safety boundary</Eyebrow>
        <p className="mt-2 text-sm font-semibold leading-6 text-sky-950">
          Generic matching is limited to active ingredient, strength, and package size. Always follow the package leaflet and pharmacist guidance; this page is price evidence only, not substitution advice for a specific patient.
        </p>
        <Link className="mt-4 inline-flex rounded-full bg-sky-900 px-4 py-2 text-sm font-black text-white" href="/pharmacy">
          Back to pharmacy evidence board
        </Link>
      </Card>
    </PageShell>
  );
}

function ComparisonFact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-black text-slate-950">{value}</dd>
    </div>
  );
}
