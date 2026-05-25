import type { Metadata } from 'next';
import { ListCard } from '@/components/list-card';
import { ListSharePreview } from '@/components/list-share-preview';
import { dealBasedMeals, familyMealPlannerFromDeals, freezerBatchCookPlanner, pantryReplenishmentInput, studentDealRecipes } from '@/lib/demo-data';
import { buildMealPlanGroceryExport } from '@/lib/pantry';
import { storeLayoutDepartments, type StoreLayoutChain } from '@/lib/trip-planner';
import { metadataForShoppingListShare } from '@/lib/seo';

const demoItems = [
  { id: 'bananas', name: 'Bananas', quantity: '1 bunch', ownerRole: 'guardian' as const },
  { id: 'oat-milk', name: 'Oat milk', quantity: '2 cartons', ownerRole: 'partner' as const },
  { id: 'pasta-sauce', name: 'Pasta sauce', quantity: '1 jar', ownerRole: 'teen' as const },
  { id: 'sparkling-water', name: 'Sparkling water', quantity: '6-pack', ownerRole: 'guest' as const }
];

type ListPageSearchParams = {
  chain?: string | string[];
  mealPlan?: string | string[];
  share?: string | string[];
};

const storeChains = Object.keys(storeLayoutDepartments) as StoreLayoutChain[];

function normalizeChain(chain: string | string[] | undefined): StoreLayoutChain {
  const requested = Array.isArray(chain) ? chain[0] : chain;
  return storeChains.find((value) => value === requested) ?? 'ica';
}

function selectedMealPlans(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value : value ? [value] : [])
    .map((item) => item.trim())
    .filter(Boolean);
}

function mealPlanExportPlans() {
  return [
    ...dealBasedMeals.suggestions.map((meal) => ({ ...meal, title: `Suggested: ${meal.title}` })),
    ...studentDealRecipes.recipes.map((meal) => ({ ...meal, title: `Student: ${meal.title}` })),
    ...familyMealPlannerFromDeals.meals.map((meal) => ({ ...meal, title: `Family: ${meal.title}` })),
    ...freezerBatchCookPlanner.meals.map((meal) => ({ ...meal, title: `Freezer: ${meal.title}` }))
  ];
}

export async function generateMetadata({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  return metadataForShoppingListShare(resolvedSearchParams.share);
}

export default async function ShoppingListPage({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const selectedChain = normalizeChain(resolvedSearchParams.chain);
  const selectedMealTitles = selectedMealPlans(resolvedSearchParams.mealPlan);
  const pantryExclusionIds = pantryReplenishmentInput.pantry
    .filter((item) => item.quantity > item.minimumQuantity)
    .map((item) => item.productId);
  const mealPlanExport = buildMealPlanGroceryExport(mealPlanExportPlans(), selectedMealTitles, pantryExclusionIds);
  const listItems = mealPlanExport.items.length > 0
    ? mealPlanExport.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      ownerRole: 'guardian' as const
    }))
    : demoItems;

  return (
    <div className="space-y-6">
      <ListSharePreview />
      {selectedMealTitles.length > 0 ? (
        <section className="rounded-2xl border border-lime-100 bg-lime-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">Meal plan export</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Consolidated grocery list from selected recipes</h2>
          <p className="mt-2 text-sm text-lime-950">
            {mealPlanExport.items.length} shopping items from {selectedMealTitles.length} selected recipes now flow into store-layout ordering and comparison prep.
          </p>
          {mealPlanExport.excludedPantryItems.length > 0 ? (
            <div className="mt-3 rounded-xl bg-white p-3">
              <p className="text-sm font-black text-slate-900">Pantry exclusions</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {mealPlanExport.excludedPantryItems.map((item) => (
                  <li key={item.productId}>
                    {item.name} skipped for {item.mealTitles.join(', ')} — {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Smart store order</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">Reorder this list by chain layout</h2>
        <form action="/list" className="mt-3 flex flex-wrap items-end gap-3" method="get">
          <label className="text-sm font-semibold text-slate-700" htmlFor="list-chain">
            Store chain
            <select className="mt-1 block rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-950" defaultValue={selectedChain} id="list-chain" name="chain">
              {storeChains.map((chain) => <option key={chain} value={chain}>{chain.toUpperCase()}</option>)}
            </select>
          </label>
          <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white" type="submit">Apply layout</button>
        </form>
        <p className="mt-3 text-sm text-emerald-950">
          Approximate route: {storeLayoutDepartments[selectedChain].map((department) => department.label).join(' → ')}.
        </p>
      </section>
      <ListCard currentRole="guardian" items={listItems} selectedChain={selectedChain} />
    </div>
  );
}
