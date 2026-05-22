import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { dealBasedMeals, studentDealRecipes } from '@/lib/demo-data';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export default function MealPlannerPage() {
  return (
    <PageShell>
      <Eyebrow>Deal-based meals</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Meals assembled from current visible deals</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This route calls suggestDealBasedMeals with visible product prices and deal scores, then shows the meal only when protein, pantry, and vegetable ingredients fit the configured budget.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Meal suggestions</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{dealBasedMeals.suggestions.length}</p>
          <p className="mt-3 font-semibold text-slate-700">from {dealBasedMeals.coverage.dealCount} visible deal candidates.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Budget</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSek(dealBasedMeals.maxMealCost)}</p>
          <p className="mt-3 font-semibold text-slate-700">for {dealBasedMeals.servings} servings; anything above budget is excluded by core.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Confidence</p>
          <p className="mt-2 text-5xl font-black capitalize text-slate-950">{dealBasedMeals.coverage.confidence}</p>
          <p className="mt-3 font-semibold text-slate-700">{dealBasedMeals.coverage.caveat}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Suggested meals</h2>
        <div className="mt-4 space-y-4">
          {dealBasedMeals.suggestions.map((meal) => (
            <div className="rounded-3xl border border-slate-200 p-5" key={meal.title}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-slate-950">{meal.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{meal.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-800">{formatSek(meal.estimatedCost)}</p>
                  <p className="text-sm font-semibold text-slate-600">{formatSek(meal.estimatedCostPerServing)} / serving</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {meal.ingredients.map((ingredient) => ingredient ? (
                  <Link className="rounded-2xl bg-slate-50 p-4 hover:bg-emerald-50" href={`/products/${ingredient.productId}`} key={ingredient.productId}>
                    <p className="font-black">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{ingredient.category} · deal score {ingredient.dealScore}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatSek(ingredient.price)} · {ingredient.source}</p>
                  </Link>
                ) : null)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">{studentDealRecipes.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Student deal recipes</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          This board calls suggestDealBasedMeals again with a two-serving student budget, then turns the selected deal ingredients into simple cookSteps without inventing unavailable prices.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {studentDealRecipes.recipes.map((recipe) => (
            <div className="rounded-3xl border border-emerald-200 bg-white p-5" key={recipe.title}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-slate-950">{recipe.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{recipe.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-800">{formatSek(recipe.estimatedCost)}</p>
                  <p className="text-sm font-semibold text-slate-600">{formatSek(recipe.estimatedCostPerServing)} / serving</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {recipe.ingredients.map((ingredient) => ingredient ? (
                  <Link className="rounded-2xl bg-emerald-50 p-4 hover:bg-emerald-100" href={`/products/${ingredient.productId}`} key={ingredient.productId}>
                    <p className="font-black">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{ingredient.category} · deal score {ingredient.dealScore}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatSek(ingredient.price)}</p>
                  </Link>
                ) : null)}
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold text-slate-700">
                {recipe.cookSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{studentDealRecipes.coverage.caveat}</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
