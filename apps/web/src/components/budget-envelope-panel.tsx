import { Card } from '@/components/data-ui';
import { formatSek } from '@/lib/verified-data';
import type { BudgetEnvelopePlan } from '@/lib/trip-planner';

type BudgetEnvelopePanelProps = {
  plans: BudgetEnvelopePlan[];
};

export function BudgetEnvelopePanel({ plans }: BudgetEnvelopePanelProps) {
  return (
    <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">Budget envelopes</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight">Weekly category budgets before checkout</h2>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        Each active shopping trip is compared with household weekly category envelopes so shoppers can see whether planned shelf totals fit the remaining budget before they leave for the store.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div className="rounded-2xl bg-white p-4" key={plan.listId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-800">{plan.overBudgetCategoryCount === 0 ? 'inside envelopes' : 'needs adjustment'}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{plan.listName}</h3>
              </div>
              <p className="rounded-full bg-fuchsia-100 px-3 py-1 text-sm font-black text-fuchsia-900">{formatSek(plan.plannedTripTotalSek)}</p>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">remaining before trip</dt>
                <dd className="font-black text-slate-950">{formatSek(plan.totalRemainingBeforeTripSek)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-fuchsia-100 pt-2">
                <dt className="font-black text-slate-950">remaining after planned trip</dt>
                <dd className="font-black text-fuchsia-900">{formatSek(plan.totalRemainingAfterTripSek)}</dd>
              </div>
            </dl>
            <div className="mt-3 divide-y divide-fuchsia-100 overflow-hidden rounded-xl border border-fuchsia-100">
              {plan.balances.filter((balance) => balance.plannedTripSpendSek > 0 || balance.status === 'over-budget').map((balance) => (
                <div className="bg-white px-3 py-2 text-xs" key={balance.category}>
                  <div className="flex justify-between gap-3">
                    <p className="font-black text-slate-900">{balance.label}</p>
                    <p className={balance.status === 'over-budget' ? 'font-black text-rose-700' : 'font-black text-emerald-700'}>
                      {balance.status === 'over-budget' ? `${formatSek(balance.overBudgetSek)} over` : `${formatSek(balance.remainingAfterTripSek)} left`}
                    </p>
                  </div>
                  <p className="mt-1 font-semibold text-slate-600">
                    planned {formatSek(balance.plannedTripSpendSek)} · envelope remaining {formatSek(balance.remainingBeforeTripSek)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
