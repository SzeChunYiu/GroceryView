import Link from 'next/link';
import { optimizeNutritionBasket, type NutritionOptimizerProduct, type NutritionTargets } from '../../../../../packages/core/src/lib/nutritionOptimizer';
import { openFoodFactsProducts } from '@/lib/ingested/openfoodfacts';
import { pricedProducts } from '@/lib/openprices-products';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/nutrition-value');
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(first(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

function packageGrams(quantity: string) {
  const normalized = quantity.toLocaleLowerCase('sv-SE').replace(',', '.');
  const multiplied = normalized.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl)\b/);
  const simple = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl)\b/);
  const amount = multiplied ? Number(multiplied[1]) * Number(multiplied[2]) : simple ? Number(simple[1]) : 100;
  const unit = multiplied?.[3] ?? simple?.[2] ?? 'g';
  if (!Number.isFinite(amount) || amount <= 0) return 100;
  if (unit === 'kg' || unit === 'l') return amount * 1000;
  if (unit === 'cl') return amount * 10;
  return amount;
}

const pricedByBarcode = new Map(pricedProducts.map((product) => [product.code, product]));

function optimizerProducts(): NutritionOptimizerProduct[] {
  return openFoodFactsProducts.flatMap((product) => {
    const price = pricedByBarcode.get(product.barcode)?.priceMedian;
    const nutrition = product.nutritionPer100g;
    if (!price || !nutrition.energyKcal || nutrition.proteins === null || nutrition.fiber === null) return [];

    const grams = packageGrams(product.quantity);
    const factor = grams / 100;
    const sodiumMilligramsPer100g = nutrition.sodium !== null
      ? nutrition.sodium * 1000
      : (nutrition.salt ?? 0) * 400;

    return [{
      id: product.barcode,
      name: product.name,
      brand: product.brands,
      price,
      packageLabel: product.quantity || '100 g nutrition basis',
      nutritionPerPackage: {
        calories: nutrition.energyKcal * factor,
        proteinGrams: nutrition.proteins * factor,
        fiberGrams: nutrition.fiber * factor,
        sodiumMilligrams: sodiumMilligramsPer100g * factor
      }
    }];
  });
}

export default async function DietOptimizerPage({
  params,
  searchParams
}: Readonly<{
  params: Promise<{ country: string }>;
  searchParams?: Promise<SearchParams>;
}>) {
  const [{ country }, resolvedSearchParams] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
  const targets: NutritionTargets = {
    calories: numberParam(resolvedSearchParams.calories, 2200),
    proteinGrams: numberParam(resolvedSearchParams.protein, 120),
    fiberGrams: numberParam(resolvedSearchParams.fiber, 30),
    maxSodiumMilligrams: numberParam(resolvedSearchParams.sodium, 2300)
  };
  const candidates = optimizerProducts();
  const result = optimizeNutritionBasket(candidates, targets, { candidateLimit: 8, maxPackagesPerProduct: 3 });
  const targetFields = [
    { name: 'calories', label: 'Calories', value: targets.calories },
    { name: 'protein', label: 'Protein g', value: targets.proteinGrams },
    { name: 'fiber', label: 'Fiber g', value: targets.fiberGrams },
    { name: 'sodium', label: 'Max sodium mg', value: targets.maxSodiumMilligrams }
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">{country.toUpperCase()} diet optimizer</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Cheapest nutrition target basket</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Set daily calories, protein, fiber, and max sodium. GroceryView joins observed OpenPrices median prices with OpenFoodFacts nutrition labels, then chooses the cheapest visible package combination that clears the targets.
      </p>

      <form className="mt-6 grid gap-3 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm md:grid-cols-5" method="get">
        {targetFields.map((field) => (
          <label className="text-sm font-black text-slate-950" htmlFor={`diet-${field.name}`} key={field.name}>
            {field.label}
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" defaultValue={field.value} id={`diet-${field.name}`} min="1" name={field.name} type="number" />
          </label>
        ))}
        <button className="self-end rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" type="submit">Optimize</button>
      </form>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Result</p>
            <h2 className="mt-2 text-2xl font-black">{result.feasible ? `${formatSek(result.totalCost)} daily basket` : 'No feasible labelled basket'}</h2>
          </div>
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950">{result.consideredProducts} candidates considered</p>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{result.guardrail}</p>

        {result.feasible ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.65fr]">
            <div className="grid gap-3">
              {result.selections.map((selection) => (
                <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={selection.product.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-black text-slate-950">{selection.product.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{selection.product.brand || 'Brand not reported'} · {selection.product.packageLabel}</p>
                    </div>
                    <p className="text-sm font-black text-emerald-900">{selection.quantity} × {formatSek(selection.product.price)} = {formatSek(selection.lineCost)}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <h3 className="font-black text-emerald-950">Nutrition totals</h3>
              <dl className="mt-3 grid gap-2 text-sm font-semibold text-emerald-950">
                <div className="flex justify-between"><dt>Calories</dt><dd>{result.totals.calories} / {targets.calories}</dd></div>
                <div className="flex justify-between"><dt>Protein</dt><dd>{result.totals.proteinGrams} g / {targets.proteinGrams} g</dd></div>
                <div className="flex justify-between"><dt>Fiber</dt><dd>{result.totals.fiberGrams} g / {targets.fiberGrams} g</dd></div>
                <div className="flex justify-between"><dt>Sodium</dt><dd>{result.totals.maxSodiumMilligrams} mg / max {targets.maxSodiumMilligrams} mg</dd></div>
              </dl>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
            Try lowering targets or increasing sodium allowance. Missing OpenFoodFacts nutrition rows and products without observed SEK prices are not estimated.
          </p>
        )}
      </section>

      <Link className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white" href="/nutrition-value">Open nutrition value rankings</Link>
    </main>
  );
}
