import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { apohemProducts, type ApohemIngestedProduct } from '@/lib/ingested/apohem';
import { formatSek } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

const activeIngredientMatches = [
  { ingredient: 'paracetamol', branded: /\b(alvedon|panodil)\b/i, generic: /\bparacetamol\b/i },
  { ingredient: 'ibuprofen', branded: /\b(ipren|ibumetin)\b/i, generic: /\bibuprofen\b/i },
  { ingredient: 'loratadine', branded: /\bclarityn\b/i, generic: /\bloratadin(e)?\b/i }
];

function slugFor(product: ApohemIngestedProduct) {
  return (product.code || product.ean || product.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function average(rows: ApohemIngestedProduct[]) {
  return rows.length === 0 ? null : rows.reduce((sum, row) => sum + row.price, 0) / rows.length;
}

function comparisonFor(product: ApohemIngestedProduct) {
  const match = activeIngredientMatches.find((candidate) => candidate.branded.test(product.name));
  if (!match) return null;
  const genericRows = apohemProducts.filter((row) => row.category === 'otc' && match.generic.test(row.name) && !match.branded.test(row.name));
  const brandedRows = apohemProducts.filter((row) => row.category === 'otc' && match.branded.test(row.name));
  const genericAverage = average(genericRows);
  const brandedAverage = average(brandedRows);
  if (genericAverage === null || brandedAverage === null) return null;
  return {
    ingredient: match.ingredient,
    genericRows,
    brandedRows,
    genericAverage,
    brandedAverage,
    savings: brandedAverage - genericAverage,
    savingsPercent: brandedAverage > 0 ? ((brandedAverage - genericAverage) / brandedAverage) * 100 : 0
  };
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string; product: string }> }>) {
  const { country, product } = await params;
  return routeMetadata({
    path: `/${country}/pharmacy/${product}`,
    title: 'Generic medication comparison | GroceryView',
    description: 'Compare branded OTC products with matching generics by active ingredient using public pharmacy evidence.'
  });
}

export default async function PharmacyProductPage({ params }: Readonly<{ params: Promise<{ country: string; product: string }> }>) {
  const { country, product: productSlug } = await params;
  if (country.toLowerCase() !== 'se') notFound();
  const product = apohemProducts.find((row) => slugFor(row) === productSlug || row.code === productSlug || row.ean === productSlug);
  if (!product) notFound();
  const comparison = comparisonFor(product);

  return (
    <PageShell>
      <Eyebrow>OTC active ingredient comparison</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{product.name}</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        Public OTC catalog evidence only. This page compares branded and generic rows by active ingredient; it is not medical advice and excludes prescription products.
      </p>

      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <h2 className="text-2xl font-black text-indigo-950">Generic alternative signal</h2>
        {comparison ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Active ingredient</p>
              <p className="mt-2 text-xl font-black text-slate-950">{comparison.ingredient}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">Linked from branded OTC name evidence.</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Average branded price</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(comparison.brandedAverage)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{comparison.brandedRows.length} public rows</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Average generic savings</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{formatSek(Math.max(0, comparison.savings))}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{comparison.savingsPercent.toFixed(0)}% vs branded average · {comparison.genericRows.length} generic rows</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-white p-4 text-sm font-semibold text-slate-700">
            No verified generic active-ingredient match is available for this OTC row yet.
          </p>
        )}
      </Card>
    </PageShell>
  );
}
