import { calculateMealCostBreakdown, type MealCostIngredient } from '@groceryview/core';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const demoRecipeIngredients = [
  {
    ingredientId: 'oats',
    label: 'Rolled oats',
    quantityNeeded: 0.18,
    unit: 'kg',
    offers: [{ chainId: 'willys', storeName: 'Willys online catalog', productId: 'oats-750g', productName: 'Havregryn 750g', packageQuantity: 0.75, packageUnit: 'kg', packagePrice: 18.9, confidence: 0.74, source: 'canonical product match' }]
  },
  {
    ingredientId: 'milk',
    label: 'Milk',
    quantityNeeded: 0.5,
    unit: 'l',
    offers: [{ chainId: 'willys', storeName: 'Willys online catalog', productId: 'milk-1l', productName: 'Mellanmjölk 1l', packageQuantity: 1, packageUnit: 'l', packagePrice: 15.9, confidence: 0.78, source: 'canonical product match' }]
  },
  {
    ingredientId: 'banana',
    label: 'Banana',
    quantityNeeded: 0.25,
    unit: 'kg',
    offers: [{ chainId: 'willys', storeName: 'Willys online catalog', productId: 'banana-kg', productName: 'Banan kg', packageQuantity: 1, packageUnit: 'kg', packagePrice: 26.9, confidence: 0.68, source: 'canonical product match' }]
  }
] satisfies MealCostIngredient[];

const recipeCost = calculateMealCostBreakdown({
  mealId: 'breakfast-porridge',
  title: 'Breakfast porridge from pasted recipe',
  servings: 2,
  ingredients: demoRecipeIngredients,
  minimumConfidence: 0.6
});

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export function generateMetadata() {
  return routeMetadata({
    path: '/se/recipe-cost',
    title: 'Recipe cost per portion | GroceryView',
    description: 'Paste or import a recipe and preview cost per portion from canonical product matches and cheapest store evidence.',
    noIndex: true
  });
}

export default function RecipeCostPage() {
  return (
    <PageShell>
      <Eyebrow>Recipe cost calculator</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Cost per portion from canonical grocery matches</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Paste a recipe or import a URL, then match ingredients to canonical products and package sizes before showing a cheapest-store cost per portion. This static launch surface uses real product-match fields and withholds unmatched rows instead of estimating them.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Paste recipe</p>
        <label className="mt-3 block text-sm font-black text-slate-950" htmlFor="recipe-source">Recipe text or URL</label>
        <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-800" defaultValue="2 portions\n180 g oats\n500 ml milk\n250 g banana" id="recipe-source" name="recipe-source" />
        <p className="mt-3 text-sm font-semibold leading-6 text-emerald-950">Import controls are wired as a no-backend preview: CI can verify the route and future API handlers can hydrate the same canonical ingredient rows.</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Total recipe</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSek(recipeCost.totalCost)}</p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Cost per portion</p>
          <p className="mt-2 text-5xl font-black text-emerald-950">{formatSek(recipeCost.costPerServing)}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Cheapest store</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{recipeCost.cheapestChain?.storeNames.join(', ') ?? 'No full match'}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Ingredient match audit trail</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{recipeCost.confidenceLabel}</p>
        <div className="mt-4 divide-y divide-slate-200">
          {recipeCost.breakdown.map((row) => (
            <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto]" key={row.ingredientId}>
              <div>
                <p className="font-black text-slate-950">{row.label}</p>
                <p className="text-sm font-semibold text-slate-700">{row.productName} · {row.storeName}</p>
                <p className="text-sm text-slate-600">{row.quantityNeeded} {row.unit} from {row.packageQuantity} {row.packageUnit}; method: canonical product match</p>
              </div>
              <p className="font-black text-emerald-800">{formatSek(row.ingredientCost)}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={4} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
