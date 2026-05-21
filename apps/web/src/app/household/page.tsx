import { Card, Eyebrow, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { formatPct, formatSek, sourceCoverage, topChainSpreads } from '@/lib/verified-data';

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

  return (
    <PageShell>
      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {householdEvidence.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-sm font-semibold text-slate-600">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </Card>
        ))}
      </section>

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
