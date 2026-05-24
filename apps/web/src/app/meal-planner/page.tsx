import Link from 'next/link';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { dealBasedMeals, familyMealPlannerFromDeals, freezerBatchCookPlanner, studentDealRecipes } from '@/lib/demo-data';
import { MEAL_LIST_SYNC_EVENT, MEAL_LIST_SYNC_STORAGE_KEY, mealListSyncPlans } from '@/lib/meal-list-sync';
import { dietarySubstitutionAssistantContract } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/meal-planner');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function confidenceLevel(value: string): 'high' | 'medium' | 'low' {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'low';
}

export default function MealPlannerPage() {
  const dealMealConfidenceLevel = confidenceLevel(dealBasedMeals.coverage.confidence);
  const mealListSyncScript = `
    (() => {
      const script = document.currentScript;
      const root = script && script.closest('[data-meal-list-sync-root]');
      if (!root) return;

      const plans = ${JSON.stringify(mealListSyncPlans)};
      const storageKey = root.getAttribute('data-storage-key');
      const eventName = root.getAttribute('data-event-name');
      const checkboxes = Array.from(root.querySelectorAll('[data-meal-plan-checkbox]'));
      const count = root.querySelector('[data-meal-list-sync-count]');
      const preview = root.querySelector('[data-meal-list-sync-preview]');
      const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const read = () => {
        try {
          const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
          return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
        } catch {
          return [];
        }
      };
      const write = (ids) => {
        window.localStorage.setItem(storageKey, JSON.stringify(ids));
        window.dispatchEvent(new CustomEvent(eventName));
      };
      const getDeltas = (ids) => {
        const selected = new Set(ids);
        const deltas = new Map();
        plans.filter((plan) => selected.has(plan.id)).forEach((plan) => {
          plan.ingredients.forEach((ingredient) => {
            const id = ingredient.productId || slug(ingredient.name);
            const existing = deltas.get(id);
            if (existing) {
              if (!existing.mealTitles.includes(plan.title)) existing.mealTitles.push(plan.title);
              return;
            }
            deltas.set(id, { id, name: ingredient.name, category: ingredient.category, mealTitles: [plan.title] });
          });
        });
        return Array.from(deltas.values()).sort((a, b) => a.name.localeCompare(b.name, 'sv'));
      };
      const render = () => {
        const selected = read();
        const deltas = getDeltas(selected);
        checkboxes.forEach((checkbox) => {
          checkbox.checked = selected.includes(checkbox.value);
        });
        if (count) count.textContent = String(deltas.length);
        if (!preview) return;
        preview.replaceChildren();
        if (!deltas.length) {
          preview.textContent = 'Select meal plans above to add their ingredients to the shopping list sync.';
          return;
        }
        deltas.slice(0, 8).forEach((delta) => {
          const item = document.createElement('li');
          item.textContent = delta.name + ' · ' + delta.mealTitles.join(', ');
          preview.appendChild(item);
        });
      };

      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          const selected = new Set(read());
          if (checkbox.checked) selected.add(checkbox.value);
          else selected.delete(checkbox.value);
          write(Array.from(selected));
          render();
        });
      });
      window.addEventListener('storage', (event) => {
        if (event.key === storageKey) render();
      });
      render();
    })();
  `;

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
          <div className="mt-4">
            <ConfidenceBadge level={dealMealConfidenceLevel} label={`${dealBasedMeals.coverage.confidence} confidence`} sampleSize={dealBasedMeals.coverage.dealCount} />
          </div>
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
        <h2 className="text-2xl font-black">Shopping list auto-sync</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Tick meal plans to add their ingredients to the shopping list sync. Untick a plan to remove that meal&apos;s planned ingredients from the generated deltas.
        </p>
        <div
          className="mt-4"
          data-event-name={MEAL_LIST_SYNC_EVENT}
          data-meal-list-sync-root
          data-storage-key={MEAL_LIST_SYNC_STORAGE_KEY}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {mealListSyncPlans.map((plan) => (
              <label className="flex gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-700" key={plan.id}>
                <input className="mt-1 h-4 w-4 accent-emerald-700" data-meal-plan-checkbox type="checkbox" value={plan.id} />
                <span>
                  <span className="block font-black text-slate-950">{plan.title}</span>
                  <span className="mt-1 block">{plan.source} · {plan.ingredients.length} ingredients</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800"><span data-meal-list-sync-count>0</span> synced ingredients</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700" data-meal-list-sync-preview />
          </div>
          <script dangerouslySetInnerHTML={{ __html: mealListSyncScript }} />
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

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-800">{familyMealPlannerFromDeals.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Family weekly meal planner</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          This family lens calls suggestDealBasedMeals for four-serving dinners and labels which deal-built meals are cheap enough to become lunchboxLeftovers.
        </p>
        <div className="mt-4 space-y-4">
          {familyMealPlannerFromDeals.meals.map((meal) => (
            <div className="rounded-3xl border border-blue-200 bg-white p-5" key={meal.weeknightSlot}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-800">{meal.weeknightSlot}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{meal.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{meal.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-blue-800">{formatSek(meal.estimatedCost)}</p>
                  <p className="text-sm font-semibold text-slate-600">{meal.lunchboxLeftovers ? 'lunchboxLeftovers ready' : 'dinner only'}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {meal.ingredients.map((ingredient) => ingredient ? (
                  <Link className="rounded-2xl bg-blue-50 p-4 hover:bg-blue-100" href={`/products/${ingredient.productId}`} key={ingredient.productId}>
                    <p className="font-black">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{ingredient.category} · deal score {ingredient.dealScore}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatSek(ingredient.price)} · {ingredient.source}</p>
                  </Link>
                ) : null)}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{familyMealPlannerFromDeals.coverage.caveat}</p>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">{freezerBatchCookPlanner.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Freezer batch-cook planner</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          This large-household lens calls suggestDealBasedMeals with an eight-serving batch budget, then exposes freezerPortions and batchCookSteps only from visible deal prices.
        </p>
        <div className="mt-4 space-y-4">
          {freezerBatchCookPlanner.meals.map((meal) => (
            <div className="rounded-3xl border border-cyan-200 bg-white p-5" key={meal.title}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-slate-950">{meal.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{meal.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-cyan-800">{formatSek(meal.estimatedCost)}</p>
                  <p className="text-sm font-semibold text-slate-600">freezerPortions: {meal.freezerPortions}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {meal.ingredients.map((ingredient) => ingredient ? (
                  <Link className="rounded-2xl bg-cyan-50 p-4 hover:bg-cyan-100" href={`/products/${ingredient.productId}`} key={ingredient.productId}>
                    <p className="font-black">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{ingredient.category} · deal score {ingredient.dealScore}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatSek(ingredient.price)} · {ingredient.source}</p>
                  </Link>
                ) : null)}
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold text-slate-700">
                {meal.batchCookSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{freezerBatchCookPlanner.coverage.caveat}</p>
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Account-safe substitutions</p>
        <h2 className="mt-2 text-2xl font-black">Dietary substitution assistant</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          The planner contract calls <code className="rounded bg-white/80 px-1 py-0.5 text-violet-900">{dietarySubstitutionAssistantContract.corePlanner}</code> after a signed-in shopper saves dietary preferences. No dietary swap is auto-applied; requiredDietaryTags and allergenAvoidanceTags must match verified label evidence, and medical or infant diet categories require professional confirmation.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-violet-200 bg-white p-5">
            <p className="font-black text-slate-950">Preference fields</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
              {dietarySubstitutionAssistantContract.preferenceFields.map((field) => <li key={field}>{field}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-violet-200 bg-white p-5">
            <p className="font-black text-slate-950">Example evidence</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">status: {dietarySubstitutionAssistantContract.examplePlan.status}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">intent: {dietarySubstitutionAssistantContract.examplePlan.substitutionIntent}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">recommendations: {dietarySubstitutionAssistantContract.examplePlan.recommendations.length}</p>
          </div>
          <div className="rounded-3xl border border-violet-200 bg-white p-5">
            <p className="font-black text-slate-950">Guardrails</p>
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
