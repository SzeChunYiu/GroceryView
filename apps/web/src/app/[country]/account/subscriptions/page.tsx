import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const subscriptionRows = [
  { program: 'ICA Stammis', type: 'loyalty', country: 'se', monthlyCost: 0, estimatedSavings: 90 },
  { program: 'Coop Medlem', type: 'loyalty', country: 'se', monthlyCost: 0, estimatedSavings: 75 },
  { program: 'Lidl Plus', type: 'loyalty', country: 'se', monthlyCost: 0, estimatedSavings: 45 },
  { program: 'Mathem Plus', type: 'paid subscription', country: 'se', monthlyCost: 99, estimatedSavings: 70 },
  { program: 'Costco membership', type: 'paid subscription', country: 'se', monthlyCost: 42, estimatedSavings: 58 },
  { program: 'Trumf', type: 'loyalty', country: 'no', monthlyCost: 0, estimatedSavings: 85 },
  { program: 'Coop Norge Medlem', type: 'loyalty', country: 'no', monthlyCost: 0, estimatedSavings: 65 }
] as const;

export function generateMetadata() {
  return routeMetadata('/account/subscriptions');
}

export default async function SubscriptionsPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const normalizedCountry = country.toLowerCase();
  const rows = subscriptionRows.filter((row) => row.country === normalizedCountry || row.country === 'se');

  return (
    <PageShell>
      <Eyebrow>Account ROI</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Subscription manager</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Track free loyalty programs and paid subscriptions side by side. Negative ROI rows are cancellation candidates.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {rows.map((row) => {
          const netSavings = row.estimatedSavings - row.monthlyCost;
          return (
            <Card className={netSavings < 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'} key={`${row.country}-${row.program}`}>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-600">{row.type}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{row.program}</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <p className="rounded-2xl bg-white p-3 font-black text-slate-950">Cost {row.monthlyCost} kr/mo</p>
                <p className="rounded-2xl bg-white p-3 font-black text-emerald-950">Savings {row.estimatedSavings} kr/mo</p>
                <p className={netSavings < 0 ? 'rounded-2xl bg-rose-100 p-3 font-black text-rose-950' : 'rounded-2xl bg-emerald-100 p-3 font-black text-emerald-950'}>
                  Net {netSavings} kr/mo
                </p>
              </div>
              {netSavings < 0 ? (
                <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-rose-950">Cancellation suggested: estimated monthly savings do not cover the subscription cost.</p>
              ) : (
                <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-emerald-950">Keep active: estimated savings cover the monthly cost.</p>
              )}
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
