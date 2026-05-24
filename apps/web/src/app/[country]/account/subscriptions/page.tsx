import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const SUBSCRIPTIONS = [
  { name: 'ICA Stammis', type: 'Loyalty', monthlyCost: 0, estimatedSavings: 42, status: 'Keep' },
  { name: 'Coop Medlem', type: 'Loyalty', monthlyCost: 0, estimatedSavings: 35, status: 'Keep' },
  { name: 'Lidl Plus', type: 'Loyalty', monthlyCost: 0, estimatedSavings: 28, status: 'Keep' },
  { name: 'Mathem Plus', type: 'Paid subscription', monthlyCost: 59, estimatedSavings: 44, status: 'Cancel candidate' },
  { name: 'Costco Executive', type: 'Paid subscription', monthlyCost: 120, estimatedSavings: 86, status: 'Cancel candidate' }
];

export default async function SubscriptionsPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const totals = SUBSCRIPTIONS.reduce(
    (sum, item) => ({ cost: sum.cost + item.monthlyCost, savings: sum.savings + item.estimatedSavings }),
    { cost: 0, savings: 0 }
  );
  const roi = totals.savings - totals.cost;

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} account</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Subscription manager</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Track grocery loyalty programs and paid subscriptions, then compare monthly fees against estimated savings to find negative-ROI memberships.
      </p>
      <Card className="mt-6 border-violet-200 bg-violet-50/80">
        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Monthly cost" value={formatSek(totals.cost)} />
          <Metric label="Estimated savings" value={formatSek(totals.savings)} />
          <Metric label="Net ROI" value={formatSek(roi)} tone={roi >= 0 ? 'positive' : 'negative'} />
        </div>
      </Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {SUBSCRIPTIONS.map((item) => {
          const net = item.estimatedSavings - item.monthlyCost;
          const negative = net < 0;
          return (
            <Card className={negative ? 'border-rose-200 bg-rose-50/80' : 'border-emerald-200 bg-emerald-50/80'} key={item.name}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">{item.type}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{item.name}</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <p className="rounded-xl bg-white p-3 font-black text-slate-950">Cost {formatSek(item.monthlyCost)}</p>
                <p className="rounded-xl bg-white p-3 font-black text-emerald-900">Savings {formatSek(item.estimatedSavings)}</p>
                <p className="rounded-xl bg-white p-3 font-black text-slate-950">Net {formatSek(net)}</p>
              </div>
              <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-slate-700">
                {negative ? 'Suggested cancellation: estimated monthly savings do not cover the fee.' : 'Keep: estimated savings are positive or the program is free.'}
              </p>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

function Metric({ label, value, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'positive' | 'negative'; value: string }) {
  const color = tone === 'positive' ? 'text-emerald-800' : tone === 'negative' ? 'text-rose-800' : 'text-slate-950';
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function formatSek(value: number) {
  return `${value.toFixed(0)} SEK`;
}
