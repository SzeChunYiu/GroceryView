import Link from 'next/link';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { RecipeImporter } from '@/components/recipe-importer';
import { dealBasedMealInputs, dealBasedMeals, familyMealPlannerFromDeals, freezerBatchCookPlanner, products, studentDealRecipes } from '@/lib/demo-data';
import { buildMealPlanShoppingListItems, extractIngredientsFromMealPlans, mealPlanShoppingListHref, suggestBudgetAlternativesFromMealPlans, type MealBudgetPlan } from '@/lib/meal-budgets';
import { mergeMealPlanIngredientsForWeeklyBasket } from '@/lib/unit-normalizer';
import { dietarySubstitutionAssistantContract } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

const COPY = {
  hero: {
    eyebrow: 'Deal-based meals',
    title: 'Meals assembled from current visible deals',
    description:
      'This route calls suggestDealBasedMeals with visible product prices and deal scores, then shows the meal only when protein, pantry, and vegetable ingredients fit the configured budget.',
  },
  metrics: {
    suggestions: {
      label: 'Meal suggestions',
      fromPrefix: 'from',
      fromSuffix: 'visible deal candidates.',
    },
    budget: {
      label: 'Budget',
      forPrefix: 'for',
      forSuffix: 'servings; anything above budget is excluded by core.',
    },
    confidence: {
      label: 'Confidence',
      labelSuffix: ' confidence',
    },
  },
  suggestedMeals: {
    title: 'Suggested meals',
  },
  student: {
    title: 'Student deal recipes',
    description:
      'This board calls suggestDealBasedMeals again with a two-serving student budget, then turns the selected deal ingredients into simple cookSteps without inventing unavailable prices.',
  },
  family: {
    title: 'Family weekly meal planner',
    description:
      'This family lens calls suggestDealBasedMeals for four-serving dinners and labels which deal-built meals are cheap enough to become lunchboxLeftovers.',
    lunchboxReady: 'lunchboxLeftovers ready',
    dinnerOnly: 'dinner only',
  },
  freezer: {
    title: 'Freezer batch-cook planner',
    description:
      'This large-household lens calls suggestDealBasedMeals with an eight-serving batch budget, then exposes freezerPortions and batchCookSteps only from visible deal prices.',
    portionsLabel: 'freezerPortions:',
  },
  dietary: {
    eyebrow: 'Account-safe substitutions',
    title: 'Dietary substitution assistant',
    descriptionPrefix: 'The planner contract calls',
    descriptionSuffix:
      'after a signed-in shopper saves dietary preferences. No dietary swap is auto-applied; requiredDietaryTags and allergenAvoidanceTags must match verified label evidence, and medical or infant diet categories require professional confirmation.',
    preferenceFieldsTitle: 'Preference fields',
    exampleEvidenceTitle: 'Example evidence',
    statusLabel: 'status:',
    intentLabel: 'intent:',
    recommendationsLabel: 'recommendations:',
    guardrailsTitle: 'Guardrails',
  },
  units: {
    perServing: '/ serving',
  },
  separators: {
    dealScore: ' · deal score ',
    dot: ' · ',
  },
} as const;

type MealPlannerSearchParams = {
  ingredient?: string | string[];
};

type MealWithIngredients = {
  ingredients: Array<{ productId: string; name: string } | null | undefined>;
};

export function generateMetadata() {
  return routeMetadata('/meal-planner');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function confidenceLevel(value: string): 'high' | 'medium' | 'low' {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'low';
}

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function mealUsesIngredient(meal: MealWithIngredients, productId: string) {
  return productId.length > 0 && meal.ingredients.some((ingredient) => ingredient?.productId === productId);
}

function mealCardClass(meal: MealWithIngredients, productId: string, defaultClasses: string) {
  return mealUsesIngredient(meal, productId)
    ? `${defaultClasses} border-amber-400 bg-amber-50 shadow-sm`
    : defaultClasses;
}

const mealPlanBasketIngredients = mergeMealPlanIngredientsForWeeklyBasket([
  { mealTitle: 'Taco night', name: 'Tomatoes', quantity: 400, unit: 'g' },
  { mealTitle: 'Pasta lunchboxes', name: 'Tomatoes', quantity: 0.6, unit: 'kg' },
  { mealTitle: 'Pancake breakfast', name: 'Milk', quantity: 5, unit: 'dl' },
  { mealTitle: 'Family stew', name: 'Milk', quantity: 500, unit: 'ml' },
  { mealTitle: 'Freezer curry', name: 'Onion', quantity: 3, unit: 'st' }
]);

function MealPlanShoppingListExport({ meal }: Readonly<{ meal: MealBudgetPlan }>) {
  const exportItems = buildMealPlanShoppingListItems([meal]);
  const categories = [...new Set(exportItems.map((item) => item.category))];

  return (
    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4" data-meal-plan-shopping-list-export={meal.title}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Shopping-list export</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            Converts this recipe into {exportItems.length} categorized item{exportItems.length === 1 ? '' : 's'} with quantities: {categories.join(', ')}.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
          href={mealPlanShoppingListHref([meal], meal.title)}
        >
          Add recipe to shopping list
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {exportItems.map((item) => (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-950 shadow-sm" key={item.id}>
            {item.category}: {item.quantity} {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const recipeProductCandidates = [
  ...dealBasedMealInputs.map((product) => ({
    productId: product.productId,
    name: product.name,
    price: product.price,
    source: product.source
  })),
  ...products.map((product) => ({
    productId: product.slug,
    name: product.name,
    price: product.price,
    unitPrice: product.unitPrice,
    store: product.store,
    source: product.source
  }))
];

export default async function MealPlannerPage({
  searchParams
}: Readonly<{ searchParams?: Promise<MealPlannerSearchParams> }>) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const selectedIngredientId = firstSearchValue(resolvedSearchParams.ingredient).trim();
  const dealMealConfidenceLevel = confidenceLevel(dealBasedMeals.coverage.confidence);
  const mealBudgetPlans = [
    ...dealBasedMeals.suggestions,
    ...studentDealRecipes.recipes,
    ...familyMealPlannerFromDeals.meals,
    ...freezerBatchCookPlanner.meals
  ];
  const extractedMealIngredients = extractIngredientsFromMealPlans(mealBudgetPlans);
  const budgetAlternatives = suggestBudgetAlternativesFromMealPlans(mealBudgetPlans);
  const selectedIngredient = dealBasedMealInputs.find((ingredient) => ingredient.productId === selectedIngredientId);
  const selectedIngredientMatchCount = selectedIngredientId.length > 0
    ? mealBudgetPlans.filter((meal) => mealUsesIngredient(meal, selectedIngredientId)).length
    : 0;

  if (dealBasedMeals.suggestions.length === 0) {
    return (
      <PageShell>
        <Card className="text-center">
          <p className="text-5xl" aria-hidden="true">🍲</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">No deal-based meals yet</h1>
          <p className="mt-3 font-semibold text-slate-700">Check back when products, deals, and stores are available to build a meal plan.</p>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Eyebrow>{COPY.hero.eyebrow}</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{COPY.hero.title}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{COPY.hero.description}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{COPY.metrics.suggestions.label}</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{dealBasedMeals.suggestions.length}</p>
          <p className="mt-3 font-semibold text-slate-700">
            {COPY.metrics.suggestions.fromPrefix} {dealBasedMeals.coverage.dealCount} {COPY.metrics.suggestions.fromSuffix}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{COPY.metrics.budget.label}</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSek(dealBasedMeals.maxMealCost)}</p>
          <p className="mt-3 font-semibold text-slate-700">
            {COPY.metrics.budget.forPrefix} {dealBasedMeals.servings} {COPY.metrics.budget.forSuffix}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{COPY.metrics.confidence.label}</p>
          <div className="mt-4">
            <ConfidenceBadge level={dealMealConfidenceLevel} label={`${dealBasedMeals.coverage.confidence}${COPY.metrics.confidence.labelSuffix}`} sampleSize={dealBasedMeals.coverage.dealCount} />
          </div>
          <p className="mt-3 font-semibold text-slate-700">{dealBasedMeals.coverage.caveat}</p>
        </Card>
      </div>

      <RecipeImporter candidates={recipeProductCandidates} />

      {selectedIngredientId.length > 0 ? (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <div data-use-soon-meal-filter>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Use-soon pantry match</p>
            {selectedIngredient ? (
              <>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Recipes using {selectedIngredient.name}</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
                  Pantry reminder links highlight {selectedIngredientMatchCount} deal-backed recipe view{selectedIngredientMatchCount === 1 ? '' : 's'} that consume this expiring item before suggesting replacement shopping.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-2xl font-black text-slate-950">No matching deal recipe yet</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
                  The selected pantry item is not in the visible meal-deal fixtures, so the planner keeps the route filtered without inventing unavailable recipe evidence.
                </p>
              </>
            )}
          </div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <h2 className="text-2xl font-black">{COPY.suggestedMeals.title}</h2>
        <div className="mt-4 space-y-4">
          {dealBasedMeals.suggestions.map((meal) => (
            <div
              className={mealCardClass(meal, selectedIngredientId, 'rounded-3xl border border-slate-200 p-5')}
              data-use-soon-meal-match={mealUsesIngredient(meal, selectedIngredientId) ? selectedIngredientId : undefined}
              key={meal.title}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-slate-950">{meal.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{meal.reason}</p>
                  {mealUsesIngredient(meal, selectedIngredientId) ? <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-amber-800">Uses use-soon pantry item</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-800">{formatSek(meal.estimatedCost)}</p>
                  <p className="text-sm font-semibold text-slate-600">{formatSek(meal.estimatedCostPerServing)} {COPY.units.perServing}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {meal.ingredients.map((ingredient) => ingredient ? (
                  <Link className="rounded-2xl bg-slate-50 p-4 hover:bg-emerald-50" href={`/products/${ingredient.productId}`} key={ingredient.productId}>
                    <p className="font-black">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{ingredient.category}{COPY.separators.dealScore}{ingredient.dealScore}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatSek(ingredient.price)}{COPY.separators.dot}{ingredient.source}</p>
                  </Link>
                ) : null)}
              </div>
              <MealPlanShoppingListExport meal={meal} />
            </div>
          ))}
        </div>
      </Card>


      <Card className="mt-6 border-lime-200 bg-lime-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Eyebrow>Weekly basket handoff</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Merged meal-plan ingredients</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Duplicate meal ingredients are consolidated with mergeMealPlanIngredientsForWeeklyBasket before they become weekly basket rows, so grams, kilograms, deciliters, and milliliters roll up into one shopping quantity.
            </p>
          </div>
          <Link className="rounded-full bg-lime-700 px-4 py-2 text-sm font-black text-white" href="/weekly-basket#meal-plan-ingredient-basket">Open weekly basket</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {mealPlanBasketIngredients.map((ingredient) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={`${ingredient.name}-${ingredient.unit}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">{ingredient.quantityLabel}</p>
              <p className="mt-2 font-black text-slate-950">{ingredient.name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{ingredient.mealTitles.join(', ')}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Budget alternatives</p>
        <h2 className="mt-2 text-2xl font-black">Meal kit extraction</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          The meal budget service extracts {extractedMealIngredients.length} ingredients from saved meal plans and automatically compares prices inside each category before suggesting cheaper swaps.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {budgetAlternatives.slice(0, 3).map((alternative) => (
            <div className="rounded-3xl border border-amber-200 bg-white p-5" key={`${alternative.mealTitle}-${alternative.ingredientName}`}>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">{alternative.mealTitle}</p>
              <p className="mt-2 font-black text-slate-950">{alternative.ingredientName} → {alternative.alternativeName}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Save {formatSek(alternative.estimatedSavings)} by switching from {formatSek(alternative.currentPrice)} to {formatSek(alternative.alternativePrice)}.
              </p>
              <p className="mt-2 text-sm text-slate-600">{alternative.reason}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">{studentDealRecipes.persona}</p>
        <h2 className="mt-2 text-2xl font-black">{COPY.student.title}</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{COPY.student.description}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {studentDealRecipes.recipes.map((recipe) => (
            <div
              className={mealCardClass(recipe, selectedIngredientId, 'rounded-3xl border border-emerald-200 bg-white p-5')}
              data-use-soon-meal-match={mealUsesIngredient(recipe, selectedIngredientId) ? selectedIngredientId : undefined}
              key={recipe.title}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-slate-950">{recipe.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{recipe.reason}</p>
                  {mealUsesIngredient(recipe, selectedIngredientId) ? <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-amber-800">Uses use-soon pantry item</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-800">{formatSek(recipe.estimatedCost)}</p>
                  <p className="text-sm font-semibold text-slate-600">{formatSek(recipe.estimatedCostPerServing)} {COPY.units.perServing}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {recipe.ingredients.map((ingredient) => ingredient ? (
                  <Link className="rounded-2xl bg-emerald-50 p-4 hover:bg-emerald-100" href={`/products/${ingredient.productId}`} key={ingredient.productId}>
                    <p className="font-black">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{ingredient.category}{COPY.separators.dealScore}{ingredient.dealScore}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatSek(ingredient.price)}</p>
                  </Link>
                ) : null)}
              </div>
              <MealPlanShoppingListExport meal={recipe} />
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold text-slate-700">
                {recipe.cookSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{studentDealRecipes.coverage.caveat}</p>
      </Card>

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-800">{familyMealPlannerFromDeals.persona}</p>
        <h2 className="mt-2 text-2xl font-black">{COPY.family.title}</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{COPY.family.description}</p>
        <div className="mt-4 space-y-4">
          {familyMealPlannerFromDeals.meals.map((meal) => (
            <div
              className={mealCardClass(meal, selectedIngredientId, 'rounded-3xl border border-blue-200 bg-white p-5')}
              data-use-soon-meal-match={mealUsesIngredient(meal, selectedIngredientId) ? selectedIngredientId : undefined}
              key={meal.weeknightSlot}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-800">{meal.weeknightSlot}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{meal.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{meal.reason}</p>
                  {mealUsesIngredient(meal, selectedIngredientId) ? <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-amber-800">Uses use-soon pantry item</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-blue-800">{formatSek(meal.estimatedCost)}</p>
                  <p className="text-sm font-semibold text-slate-600">{meal.lunchboxLeftovers ? COPY.family.lunchboxReady : COPY.family.dinnerOnly}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {meal.ingredients.map((ingredient) => ingredient ? (
                  <Link className="rounded-2xl bg-blue-50 p-4 hover:bg-blue-100" href={`/products/${ingredient.productId}`} key={ingredient.productId}>
                    <p className="font-black">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{ingredient.category}{COPY.separators.dealScore}{ingredient.dealScore}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatSek(ingredient.price)}{COPY.separators.dot}{ingredient.source}</p>
                  </Link>
                ) : null)}
              </div>
              <MealPlanShoppingListExport meal={meal} />
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{familyMealPlannerFromDeals.coverage.caveat}</p>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">{freezerBatchCookPlanner.persona}</p>
        <h2 className="mt-2 text-2xl font-black">{COPY.freezer.title}</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{COPY.freezer.description}</p>
        <div className="mt-4 space-y-4">
          {freezerBatchCookPlanner.meals.map((meal) => (
            <div
              className={mealCardClass(meal, selectedIngredientId, 'rounded-3xl border border-cyan-200 bg-white p-5')}
              data-use-soon-meal-match={mealUsesIngredient(meal, selectedIngredientId) ? selectedIngredientId : undefined}
              key={meal.title}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-slate-950">{meal.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{meal.reason}</p>
                  {mealUsesIngredient(meal, selectedIngredientId) ? <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-amber-800">Uses use-soon pantry item</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-cyan-800">{formatSek(meal.estimatedCost)}</p>
                  <p className="text-sm font-semibold text-slate-600">{COPY.freezer.portionsLabel} {meal.freezerPortions}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {meal.ingredients.map((ingredient) => ingredient ? (
                  <Link className="rounded-2xl bg-cyan-50 p-4 hover:bg-cyan-100" href={`/products/${ingredient.productId}`} key={ingredient.productId}>
                    <p className="font-black">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{ingredient.category}{COPY.separators.dealScore}{ingredient.dealScore}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatSek(ingredient.price)}{COPY.separators.dot}{ingredient.source}</p>
                  </Link>
                ) : null)}
              </div>
              <MealPlanShoppingListExport meal={meal} />
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold text-slate-700">
                {meal.batchCookSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{freezerBatchCookPlanner.coverage.caveat}</p>
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">{COPY.dietary.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black">{COPY.dietary.title}</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          {COPY.dietary.descriptionPrefix}{' '}
          <code className="rounded bg-white/80 px-1 py-0.5 text-violet-900">{dietarySubstitutionAssistantContract.corePlanner}</code>{' '}
          {COPY.dietary.descriptionSuffix}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-violet-200 bg-white p-5">
            <p className="font-black text-slate-950">{COPY.dietary.preferenceFieldsTitle}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
              {dietarySubstitutionAssistantContract.preferenceFields.map((field) => <li key={field}>{field}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-violet-200 bg-white p-5">
            <p className="font-black text-slate-950">{COPY.dietary.exampleEvidenceTitle}</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{COPY.dietary.statusLabel} {dietarySubstitutionAssistantContract.examplePlan.status}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{COPY.dietary.intentLabel} {dietarySubstitutionAssistantContract.examplePlan.substitutionIntent}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{COPY.dietary.recommendationsLabel} {dietarySubstitutionAssistantContract.examplePlan.recommendations.length}</p>
          </div>
          <div className="rounded-3xl border border-violet-200 bg-white p-5">
            <p className="font-black text-slate-950">{COPY.dietary.guardrailsTitle}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
              {dietarySubstitutionAssistantContract.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
