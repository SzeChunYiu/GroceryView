import Link from 'next/link';
import type { Metadata } from 'next';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { buildCartAssistantPlan } from '@/lib/cart-assistant';

export const metadata: Metadata = {
  title: 'AI cart assistant for meal-budget baskets | GroceryView',
  description: 'Generate a priced, editable grocery basket from budget, household size, dietary constraints, and meal ideas with explicit confirmation before saving.'
};

type CartAssistantSearchParams = {
  budget?: string | string[];
  diet?: string | string[];
  household?: string | string[];
  meals?: string | string[];
};

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function assistantListHref(plan: ReturnType<typeof buildCartAssistantPlan>) {
  return `/list?cartAssistant=${encodeURIComponent(JSON.stringify({
    source: 'cart-assistant',
    budget: plan.budget,
    items: plan.items.map((item) => ({ productId: item.productId, name: item.name, quantity: `${item.quantity} pack`, price: item.lineTotal }))
  }))}`;
}

export default async function CartAssistantPage({
  searchParams
}: Readonly<{ searchParams?: Promise<CartAssistantSearchParams> }>) {
  const resolvedSearchParams: CartAssistantSearchParams = searchParams ? await searchParams : {};
  const budget = Number(firstSearchValue(resolvedSearchParams.budget) || 500);
  const householdSize = Number(firstSearchValue(resolvedSearchParams.household) || 2);
  const dietaryTags = (firstSearchValue(resolvedSearchParams.diet) || 'vegetarian').split(',').map((tag) => tag.trim()).filter(Boolean);
  const mealIdeas = (firstSearchValue(resolvedSearchParams.meals) || 'pasta lunchboxes,tofu bowls,quick dinners').split(',').map((meal) => meal.trim()).filter(Boolean);
  const plan = buildCartAssistantPlan({ budget, dietaryTags, householdSize, mealIdeas });

  return (
    <PageShell>
      <Eyebrow>Cart assistant</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">AI cart assistant for meal-budget lists</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Ask for a budget, household size, dietary constraints, and meal ideas. The assistant grounds every suggested row in existing GroceryView deal products, shows coverage confidence, and waits for explicit confirmation before saving.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Budget</p>
          <p className="mt-2 text-5xl font-black text-emerald-950">{formatSek(plan.budget)}</p>
          <p className="mt-3 font-semibold text-emerald-900">{plan.householdSize} people · {plan.targetServings} target servings.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Priced basket</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSek(plan.total)}</p>
          <p className="mt-3 font-semibold text-slate-700">Remaining budget: {formatSek(plan.remaining)}.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Coverage</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{plan.coverage.pricedItems}/{plan.coverage.candidateItems}</p>
          <div className="mt-3"><ConfidenceBadge level={plan.coverage.confidence} label={`${plan.coverage.confidence} assistant confidence`} sampleSize={plan.coverage.pricedItems} /></div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">500 kr vegetarian week draft</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Diet: {plan.dietaryTags.join(', ')} · Meal ideas: {plan.mealIdeas.join(', ')}.</p>
          </div>
          <Link className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700" href={assistantListHref(plan)}>
            Review + confirm save
          </Link>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {plan.items.map((item) => (
            <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto]" key={item.productId}>
              <div>
                <p className="font-black text-slate-950">{item.quantity} × {item.name}</p>
                <p className="text-sm font-semibold text-slate-700">{item.category} · {item.source}</p>
              </div>
              <p className="font-black text-emerald-800">{formatSek(item.lineTotal)}</p>
              <ConfidenceBadge level={item.confidence} label={`${item.confidence} price confidence`} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">Confirmation and blockers</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">{plan.coverage.caveat}</p>
        {plan.blockedItems.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm font-bold text-amber-950">
            {plan.blockedItems.map((item) => <li key={item.productId}>{item.name}: {item.reason}</li>)}
          </ul>
        ) : null}
      </Card>
    </PageShell>
  );
}
