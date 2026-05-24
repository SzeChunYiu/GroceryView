import { notFound } from 'next/navigation';
import {
  estimateNutritionFromOpenFoodFactsProduct,
  optimizeDietNutrition,
  type NutritionProductCandidate,
  type NutritionTargets
} from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { openFoodFactsCatalog } from '@/lib/openfoodfacts-catalog';

const countries = ['se', 'no', 'is'] as const;
type Country = (typeof countries)[number];

const countryLabels: Record<Country, string> = {
  se: 'Sweden',
  no: 'Norway',
  is: 'Iceland'
};

const defaultTargets: NutritionTargets = {
  calories: 650,
  proteinG: 35,
  fiberG: 12,
  maxSodiumMg: 900
};

const foodSignals = [
  'en:plant-based-foods',
  'en:farming-products',
  'en:eggs',
  'en:cereals-and-potatoes',
  'en:legumes',
  'en:fruits-and-vegetables-based-foods',
  'en:dairies',
  'en:breads',
  'en:vegetables',
  'en:protein-powders'
];

const blockedSignals = ['suncare', 'household', 'fitness-equipment', 'dishwasher', 'toilet-papers', 'body-butters'];

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function numericParam(value: string | string[] | undefined, fallback: number, min: number, max: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function targetsFrom(searchParams: Record<string, string | string[] | undefined>): NutritionTargets {
  return {
    calories: numericParam(searchParams.calories, defaultTargets.calories, 100, 3000),
    proteinG: numericParam(searchParams.protein, defaultTargets.proteinG, 0, 220),
    fiberG: numericParam(searchParams.fiber, defaultTargets.fiberG, 0, 80),
    maxSodiumMg: numericParam(searchParams.sodium, defaultTargets.maxSodiumMg, 50, 5000)
  };
}

function deterministicPrice(index: number, grade: string) {
  const gradeDiscount = grade === 'a' ? -2 : grade === 'b' ? -1 : grade === 'e' ? 3 : 0;
  return 9 + (index % 7) * 4 + gradeDiscount;
}

function candidateProducts(): NutritionProductCandidate[] {
  return openFoodFactsCatalog
    .filter((product) => {
      const categories = product.categories.join(' ').toLowerCase();
      return foodSignals.some((signal) => categories.includes(signal)) && !blockedSignals.some((signal) => categories.includes(signal));
    })
    .slice(0, 18)
    .map((product, index) => estimateNutritionFromOpenFoodFactsProduct(product, deterministicPrice(index, product.nutriscoreGrade)));
}

export function generateStaticParams() {
  return countries.map((country) => ({ country }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  if (!countries.includes(country as Country)) notFound();
  return {
    title: `Diet optimizer ${country.toUpperCase()} | GroceryView`,
    description: 'Cheapest OpenFoodFacts-backed product combination for calorie, protein, fiber, and sodium targets.'
  };
}

export default async function DietOptimizerPage({
  params,
  searchParams
}: Readonly<{
  params: Promise<{ country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const [{ country }, query] = await Promise.all([params, searchParams]);
  if (!countries.includes(country as Country)) notFound();

  const targets = targetsFrom(query);
  const candidates = candidateProducts();
  const optimized = optimizeDietNutrition(targets, candidates, { maxCandidates: 14, maxItems: 4, maxQuantity: 3 });

  return (
    <PageShell>
      <Eyebrow>{countryLabels[country as Country]} · OpenFoodFacts nutrition optimizer</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Cheapest basket that meets nutrition targets</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Enter daily targets for calories, protein, fiber, and maximum sodium. GroceryView searches OpenFoodFacts catalog rows and returns the cheapest candidate combination that satisfies the constraints, using category and Nutri-Score metadata where exact label nutrients are not yet present.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <form className="grid gap-4 md:grid-cols-5">
          <label className="text-sm font-black text-slate-700">
            Calories
            <input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={targets.calories} min="100" name="calories" type="number" />
          </label>
          <label className="text-sm font-black text-slate-700">
            Protein g
            <input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={targets.proteinG} min="0" name="protein" type="number" />
          </label>
          <label className="text-sm font-black text-slate-700">
            Fiber g
            <input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={targets.fiberG} min="0" name="fiber" type="number" />
          </label>
          <label className="text-sm font-black text-slate-700">
            Max sodium mg
            <input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={targets.maxSodiumMg} min="50" name="sodium" type="number" />
          </label>
          <button className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white" type="submit">
            Optimize
          </button>
        </form>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        <Card className="border-emerald-200 bg-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-2 text-4xl font-black text-emerald-800">{optimized.status === 'met' ? 'Met' : 'Partial'}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{optimized.status === 'met' ? 'All targets satisfied within the sodium cap.' : optimized.unmet.join(' · ')}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Cheapest total</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{formatSek(optimized.totalPrice)}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Deterministic demo prices let the optimizer rank basket cost until retailer-priced nutrition rows are joined.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Protein / fiber</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{optimized.totals.proteinG}g / {optimized.totals.fiberG}g</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Targets: {targets.proteinG}g protein and {targets.fiberG}g fiber.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Calories / sodium</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{optimized.totals.calories} / {optimized.totals.maxSodiumMg}mg</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Target: at least {targets.calories} calories and at most {targets.maxSodiumMg}mg sodium.</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Optimized products</h2>
        <div className="mt-4 divide-y divide-slate-200">
          {optimized.lines.length > 0 ? optimized.lines.map((line) => (
            <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto]" key={line.productId}>
              <div>
                <p className="font-black text-slate-950">{line.productName}</p>
                <p className="mt-1 text-sm text-slate-600">{line.source}</p>
              </div>
              <p className="font-black text-slate-900">× {line.quantity}</p>
              <p className="font-black text-emerald-800">{formatSek(line.linePrice)}</p>
            </div>
          )) : (
            <p className="py-4 text-sm font-semibold text-slate-700">No OpenFoodFacts candidates available for these constraints.</p>
          )}
        </div>
      </Card>

      <Card className="mt-6 border-slate-200 bg-slate-50">
        <h2 className="text-2xl font-black">Candidate pool</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This page uses {candidates.length} OpenFoodFacts catalog products from the local metadata snapshot. Nutrition values are transparent estimates derived from category tags and Nutri-Score because this compact catalog does not yet include per-100g nutrient labels.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {candidates.slice(0, 8).map((candidate) => (
            <div className="rounded-2xl border border-slate-200 bg-white p-4" key={candidate.productId}>
              <p className="font-black text-slate-950">{candidate.productName}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{candidate.calories} cal · {candidate.proteinG}g protein · {candidate.fiberG}g fiber · {candidate.maxSodiumMg}mg sodium</p>
              <p className="mt-2 text-sm font-black text-emerald-800">{formatSek(candidate.price)}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
