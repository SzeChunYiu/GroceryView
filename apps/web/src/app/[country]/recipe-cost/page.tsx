import { calculateRecipeCostPerPortion, type RecipeCostMatchedIngredient } from '@groceryview/core/src/lib/recipeCost';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const demoRecipeIngredients = [
  {
    ingredientId: 'oats',
    label: 'Rolled oats',
    quantityNeeded: 180,
    unit: 'g',
    canonicalProductId: 'willys-oats-750g',
    productName: 'Havregryn 750g',
    storeName: 'Willys',
    packageQuantity: 750,
    packageUnit: 'g',
    packagePrice: 18.9,
    confidence: 0.74
  },
  {
    ingredientId: 'oats',
    label: 'Rolled oats',
    quantityNeeded: 180,
    unit: 'g',
    canonicalProductId: 'hemkop-oats-1kg',
    productName: 'Havregryn 1kg',
    storeName: 'Hemköp',
    packageQuantity: 1,
    packageUnit: 'kg',
    packagePrice: 24.9,
    confidence: 0.7
  },
  {
    ingredientId: 'milk',
    label: 'Milk',
    quantityNeeded: 500,
    unit: 'ml',
    canonicalProductId: 'willys-milk-1l',
    productName: 'Mellanmjölk 1l',
    storeName: 'Willys',
    packageQuantity: 1,
    packageUnit: 'l',
    packagePrice: 15.9,
    confidence: 0.78
  },
  {
    ingredientId: 'milk',
    label: 'Milk',
    quantityNeeded: 500,
    unit: 'ml',
    canonicalProductId: 'coop-milk-1l',
    productName: 'Mellanmjölk 1l',
    storeName: 'Coop',
    packageQuantity: 1,
    packageUnit: 'l',
    packagePrice: 14.9,
    confidence: 0.76
  },
  {
    ingredientId: 'banana',
    label: 'Banana',
    quantityNeeded: 250,
    unit: 'g',
    canonicalProductId: 'willys-banana-kg',
    productName: 'Banan kg',
    storeName: 'Willys',
    packageQuantity: 1,
    packageUnit: 'kg',
    packagePrice: 26.9,
    confidence: 0.68
  },
  {
    ingredientId: 'banana',
    label: 'Banana',
    quantityNeeded: 250,
    unit: 'g',
    canonicalProductId: 'ica-banana-kg',
    productName: 'Banan kg',
    storeName: 'ICA',
    packageQuantity: 1,
    packageUnit: 'kg',
    packagePrice: 24.9,
    confidence: 0.66
  }
] satisfies RecipeCostMatchedIngredient[];

const recipeCost = calculateRecipeCostPerPortion({
  recipeId: 'breakfast-porridge',
  title: 'Breakfast porridge from pasted recipe',
  portions: 2,
  ingredientCount: 3,
  matchedIngredients: demoRecipeIngredients
});

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  return routeMetadata({
    path: `/${country}/recipe-cost`,
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
        Paste a recipe or import a URL, then match ingredients to canonical products and portion sizes before showing the cheapest matched store for each ingredient. This static launch surface withholds unmatched rows instead of estimating them.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Paste or import recipe</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.8fr]">
          <label className="block text-sm font-black text-slate-950" htmlFor="recipe-source">
            Recipe text
            <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-800" defaultValue="2 portions\n180 g oats\n500 ml milk\n250 g banana" id="recipe-source" name="recipe-source" />
          </label>
          <label className="block text-sm font-black text-slate-950" htmlFor="recipe-url">
            Import URL
            <input className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-800" id="recipe-url" name="recipe-url" placeholder="https://example.com/recipe" type="url" />
            <span className="mt-3 block text-sm font-semibold leading-6 text-emerald-950">Preview mode: the same canonical match rows can be hydrated by a future parser or import API.</span>
          </label>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Total recipe</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSek(recipeCost.totalCost)}</p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Cost per portion</p>
          <p className="mt-2 text-5xl font-black text-emerald-950">{formatSek(recipeCost.costPerPortion)}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Cheapest stores</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{recipeCost.cheapestStoreNames.join(', ') || 'No full match'}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{recipeCost.candidateCount} canonical product candidates compared.</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Ingredient match audit trail</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{recipeCost.confidenceLabel}</p>
        <div className="mt-4 divide-y divide-slate-200">
          {recipeCost.rows.map((row) => (
            <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto]" key={row.ingredientId}>
              <div>
                <p className="font-black text-slate-950">{row.label}</p>
                <p className="text-sm font-semibold text-slate-700">{row.productName} · {row.storeName}</p>
                <p className="text-sm text-slate-600">{row.quantityNeeded} {row.unit} from {row.packageQuantity} {row.packageUnit}; canonical product {row.canonicalProductId}</p>
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
