import { Card, Eyebrow, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { HouseholdPlanActions } from '@/components/household-plan-actions';
import { demoPantryStockLevels, getRecurringPantryTopUps, recurringPantryTemplates } from '@/lib/recurring-lists';
import { formatPct, formatSek, shareableHouseholdListContract, sourceCoverage, topChainSpreads } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/household');
}

const titles: Record<string, string> = {
  'weekly-basket': 'Weekly basket planner',
  watchlist: 'Watchlist alerts',
  scanner: 'Receipt scanner',
  household: 'Household profile',
  account: 'Account and alerts',
  'basket-ideas': 'Basket ideas',
  'coupon-stacks': 'Coupon stacks',
  deals: 'Deal radar',
  'meal-planner': 'Meal planner',
  'nutrition-value': 'Nutrition value',
  'pantry-planner': 'Pantry planner',
  'price-reports': 'Price reports',
  'savings-dashboard': 'Savings dashboard',
  'shopping-trips': 'Shopping trips',
  privacy: 'Privacy controls'
};

const householdEvidence = [
  {
    label: 'Verified sources',
    value: sourceCoverage.length.toLocaleString('sv-SE'),
    detail: 'Only generated public source modules are used on this static route.'
  },
  {
    label: 'Comparable chain rows',
    value: topChainSpreads.length.toLocaleString('sv-SE'),
    detail: 'Household planning can compare Willys/Hemköp spreads without private profiles.'
  },
  {
    label: 'Private records rendered',
    value: '0',
    detail: 'Names, budgets, receipt queues, and dietary rules stay hidden until verified account data exists.'
  }
];

export default function FeaturePage() {
  const route = 'household';
  const planningRows = topChainSpreads.slice(0, 4);
  const duePantryTopUps = getRecurringPantryTopUps(demoPantryStockLevels);

  return (
    <PageShell>
      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />
      <HouseholdPlanActions />

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {householdEvidence.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-sm font-semibold text-slate-600">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-6">
        <Eyebrow>Shareable household lists</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">role-based permissions before any shared grocery list can edit account state</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {shareableHouseholdListContract.corePlanner} keeps shared lists account-bound: viewers can open an expiring list, editors must already be signed-in household members, and missing-price blockers stay visible to everyone. No anonymous household edits are allowed.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {shareableHouseholdListContract.roles.map((role) => (
            <div key={role.role} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{role.role}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{role.label}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 md:grid-cols-2">
          {shareableHouseholdListContract.guardrails.map((guardrail) => <li key={guardrail}>• {guardrail}</li>)}
        </ul>
      </Card>


      <Card className="mt-6">
        <Eyebrow>Recurring pantry top-ups</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">templates auto-add low-stock essentials on their configured interval</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Pantry templates keep staples on a recurring cadence, but only add items when the tracked pantry count is at or below the template threshold.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {duePantryTopUps.map((template) => (
            <div key={template.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Auto-add today</p>
              <h3 className="mt-2 font-black text-slate-950">{template.title}</h3>
              <p className="mt-1 text-sm text-slate-600">Every {template.intervalDays} days · last added {template.lastAddedOn}</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {template.items.map((item) => (
                  <li key={item.name}>• {item.addQuantity} {item.name} when stock is ≤ {item.lowStockThreshold}</li>
                ))}
              </ul>
            </div>
          ))}
          {recurringPantryTemplates.map((template) => (
            <div key={template.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Template</p>
              <h3 className="mt-2 font-black text-slate-950">{template.title}</h3>
              <p className="mt-1 text-sm text-slate-600">Runs every {template.intervalDays} days · next run {template.nextAddOn}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <Eyebrow>Household planning evidence</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Verified price context without private rows</h2>
          <div className="mt-5 divide-y divide-slate-200">
            {planningRows.map((product) => (
              <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto]" key={product.slug}>
                <div>
                  <p className="font-black text-slate-950">{product.name}</p>
                  <p className="text-sm text-slate-600">{product.brand || 'Brand not reported'} · {product.subline || 'Size not reported'}</p>
                </div>
                <p className="font-black text-emerald-800">{formatSek(product.lowestPrice)}</p>
                <p className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950">{formatPct(product.spreadPct)} spread</p>
              </div>
            ))}
          </div>
        </Card>

        <TopSpreads limit={4} />
      </section>

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
