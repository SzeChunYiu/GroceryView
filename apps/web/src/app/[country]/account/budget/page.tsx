import { buildBudgetTracker } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/se/account/budget',
    title: 'Monthly grocery budget tracker | GroceryView',
    description: 'Track monthly grocery spend from receipts and basket estimates with swap recommendations.'
  });
}

function formatSek(value: number) {
  return `${value.toFixed(0)} kr`;
}

export default async function CountryAccountBudgetPage({
  params,
  searchParams
}: {
  params: Promise<{ country: string }>;
  searchParams?: Promise<{ monthly_budget?: string }>;
}) {
  const [{ country }, resolvedSearchParams] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
  const monthlyBudget = Number.parseFloat(resolvedSearchParams.monthly_budget ?? '5200') || 5200;
  const tracker = buildBudgetTracker({
    monthlyBudget,
    receipts: [
      { label: 'Week 1 receipts', amount: 1180, source: 'receipt' },
      { label: 'Week 2 receipts', amount: 1265, source: 'receipt' }
    ],
    basket: [
      { label: 'Current basket estimate', amount: 740, source: 'basket' }
    ],
    swaps: [
      { from: 'Name-brand pasta', to: 'Store-brand pasta', savings: 18 },
      { from: 'Fresh berries', to: 'Frozen berries', savings: 32 },
      { from: 'Premium cereal', to: 'Oats', savings: 24 }
    ]
  });

  return (
    <PageShell>
      <header className="rounded-[2rem] bg-slate-950 p-6 text-white">
        <Eyebrow>Account budget · {country.toUpperCase()}</Eyebrow>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Monthly grocery budget tracker</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-200">
          Set a monthly grocery budget, combine receipt spend with the active basket estimate, and use recommended swaps to stay under budget.
        </p>
      </header>

      <Card className="border-emerald-200 bg-emerald-50">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" action={`/${country}/account/budget`}>
          <label className="text-sm font-black text-emerald-950" htmlFor="monthly-budget">
            Monthly budget
            <input className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 text-slate-950" id="monthly-budget" name="monthly_budget" defaultValue={String(monthlyBudget)} inputMode="decimal" />
          </label>
          <button className="rounded-full bg-emerald-900 px-5 py-3 text-sm font-black text-white" type="submit">Update budget</button>
        </form>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Budget" value={formatSek(tracker.monthly_budget)} />
        <Metric label="Spend to date" value={formatSek(tracker.spend_to_date)} />
        <Metric label="Basket estimate" value={formatSek(tracker.basket_estimate)} />
        <Metric label="Remaining" value={formatSek(tracker.remaining_budget)} tone={tracker.remaining_budget < 0 ? 'over' : 'under'} />
      </section>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-950">Budget progress</h2>
          <p className="text-sm font-black text-slate-600">{tracker.progress_percent}% used</p>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${tracker.progress_percent > 100 ? 'bg-rose-700' : 'bg-emerald-700'}`} style={{ width: `${Math.min(100, tracker.progress_percent)}%` }} />
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <Eyebrow>Recommended swaps</Eyebrow>
        <h2 className="mt-2 text-2xl font-black text-amber-950">Stay under budget</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tracker.recommended_swaps.map((swap) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={`${swap.from}-${swap.to}`}>
              <p className="text-sm font-black text-slate-950">Swap {swap.from}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">to {swap.to}</p>
              <p className="mt-3 text-2xl font-black text-emerald-800">Save {formatSek(swap.savings)}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'under' | 'over' }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone === 'over' ? 'text-rose-700' : tone === 'under' ? 'text-emerald-800' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}
