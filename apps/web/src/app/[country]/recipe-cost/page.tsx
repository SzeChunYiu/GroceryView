import { calculateRecipeCost } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const demoRecipe = `400 g chicken
300 g rice
250 g broccoli
2 dl cream`;

function formatMoney(value: number, country: string) {
  return new Intl.NumberFormat(country === 'no' ? 'nb-NO' : 'sv-SE', {
    currency: country === 'no' ? 'NOK' : 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

export default async function RecipeCostPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const result = calculateRecipeCost({ country: country.toUpperCase(), portions: 4, recipeText: demoRecipe });
  const cheapest = result.cheapestStore;

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} recipe costing</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Cost-per-portion recipe calculator</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Paste a recipe or import a URL, match ingredients to canonical grocery products and portion sizes, then compare cost per portion at the cheapest covered stores.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Recipe input</p>
          <label className="mt-4 block text-sm font-black text-slate-800" htmlFor="recipe-url">Import URL</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700" id="recipe-url" placeholder="https://example.com/recipe" readOnly />
          <label className="mt-4 block text-sm font-black text-slate-800" htmlFor="recipe-text">Pasted recipe</label>
          <textarea className="mt-2 min-h-48 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700" id="recipe-text" readOnly value={demoRecipe} />
          <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Demo mode uses canonical product fixtures until live URL import is wired to recipe extraction.</p>
        </Card>

        <div className="grid gap-6">
          <Card className="border-emerald-200 bg-emerald-50">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Cheapest covered store</p>
            <p className="mt-2 text-5xl font-black text-emerald-950">{cheapest ? formatMoney(cheapest.costPerPortion, country) : 'Blocked'}</p>
            <p className="mt-3 font-semibold text-emerald-900">
              {cheapest ? `${cheapest.storeName} covers ${cheapest.matchedIngredients}/${result.matches.length || cheapest.matchedIngredients} matched ingredients for 4 portions.` : 'No store covers every matched ingredient yet.'}
            </p>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {result.storeOptions.map((store) => (
              <Card className="p-4" key={store.storeId}>
                <p className="text-lg font-black text-slate-950">{store.storeName}</p>
                <p className="mt-2 text-2xl font-black text-emerald-800">{formatMoney(store.costPerPortion, country)} / portion</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">Total {formatMoney(store.totalCost, country)} · coverage {Math.round(store.coverageShare * 100)}% · confidence {Math.round(store.averageConfidence * 100)}%</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">Ingredient matches</h2>
        <div className="mt-4 divide-y divide-slate-200">
          {result.matches.map((match) => (
            <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto]" key={match.raw}>
              <div>
                <p className="font-black text-slate-950">{match.raw}</p>
                <p className="text-sm font-semibold text-slate-600">Matched to {match.matchedProductName} at {match.storeName}</p>
              </div>
              <p className="text-lg font-black text-emerald-800">{formatMoney(match.ingredientCost, country)}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
