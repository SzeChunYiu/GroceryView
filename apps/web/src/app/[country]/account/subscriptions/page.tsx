import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type Subscription = {
  id: string;
  name: string;
  kind: 'loyalty' | 'paid';
  monthlyCost: number;
  estimatedMonthlySavings: number;
  renewalLabel: string;
  country: string;
  evidence: string;
};

const subscriptions: Subscription[] = [
  {
    id: 'ica-stammis',
    name: 'ICA Stammis',
    kind: 'loyalty',
    monthlyCost: 0,
    estimatedMonthlySavings: 86,
    renewalLabel: 'free membership',
    country: 'sweden',
    evidence: 'Member prices and bonus vouchers from recent ICA baskets.'
  },
  {
    id: 'coop-medlem',
    name: 'Coop Medlem',
    kind: 'loyalty',
    monthlyCost: 0,
    estimatedMonthlySavings: 64,
    renewalLabel: 'free membership',
    country: 'sweden',
    evidence: 'Observed member-price matches across pantry staples.'
  },
  {
    id: 'mathem-plus',
    name: 'Mathem Plus',
    kind: 'paid',
    monthlyCost: 99,
    estimatedMonthlySavings: 72,
    renewalLabel: 'renews monthly',
    country: 'sweden',
    evidence: 'Delivery-fee savings are lower than the current subscription cost.'
  },
  {
    id: 'costco-gold-star',
    name: 'Costco Gold Star',
    kind: 'paid',
    monthlyCost: 54,
    estimatedMonthlySavings: 118,
    renewalLabel: 'annual membership normalized monthly',
    country: 'sweden',
    evidence: 'Bulk pantry savings from matched basket comparisons exceed the fee.'
  }
];

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 0, style: 'currency' }).format(value);
}

function roi(subscription: Subscription) {
  return subscription.estimatedMonthlySavings - subscription.monthlyCost;
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;

  return {
    title: `Subscription manager | GroceryView ${country.toUpperCase()}`,
    description: 'Track loyalty programs and paid grocery subscriptions by monthly cost, estimated savings, and cancellation recommendations.'
  };
}

export function generateStaticParams() {
  return [{ country: 'sweden' }];
}

export default async function CountrySubscriptionsPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country: requestedCountry } = await params;
  const country = requestedCountry.toLowerCase();
  const visibleSubscriptions = subscriptions.filter((subscription) => subscription.country === country);
  const monthlyCost = visibleSubscriptions.reduce((sum, subscription) => sum + subscription.monthlyCost, 0);
  const monthlySavings = visibleSubscriptions.reduce((sum, subscription) => sum + subscription.estimatedMonthlySavings, 0);
  const cancellationCandidates = visibleSubscriptions.filter((subscription) => roi(subscription) < 0);

  return (
    <PageShell>
      <Eyebrow>Account subscriptions</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Loyalty and paid subscription ROI</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Track free loyalty programs and paid grocery memberships in one place. Monthly cost is compared with estimated savings so negative ROI subscriptions are easy to cancel before renewal.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Monthly cost</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{formatSek(monthlyCost)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Estimated savings</p>
          <p className="mt-2 text-4xl font-black text-emerald-800">{formatSek(monthlySavings)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Net ROI</p>
          <p className={`mt-2 text-4xl font-black ${monthlySavings >= monthlyCost ? 'text-emerald-800' : 'text-rose-800'}`}>{formatSek(monthlySavings - monthlyCost)}</p>
        </Card>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {visibleSubscriptions.map((subscription) => {
          const net = roi(subscription);
          const shouldCancel = net < 0;
          return (
            <Card className={shouldCancel ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'} key={subscription.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{subscription.kind}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{subscription.name}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{subscription.evidence}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${shouldCancel ? 'bg-white text-rose-800' : 'bg-white text-emerald-800'}`}>
                  {shouldCancel ? 'Cancel suggested' : 'Keep'}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-700"><span className="block text-xs uppercase text-slate-500">Cost</span>{formatSek(subscription.monthlyCost)}</p>
                <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-700"><span className="block text-xs uppercase text-slate-500">Savings</span>{formatSek(subscription.estimatedMonthlySavings)}</p>
                <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-700"><span className="block text-xs uppercase text-slate-500">Net</span>{formatSek(net)}</p>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{subscription.renewalLabel}</p>
            </Card>
          );
        })}
      </section>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black tracking-tight text-amber-950">Cancellation watchlist</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          {cancellationCandidates.length > 0
            ? `${cancellationCandidates.map((subscription) => subscription.name).join(', ')} currently cost more than their estimated monthly savings.`
            : 'No tracked subscription has negative ROI this month.'}
        </p>
        <Link className="mt-4 inline-flex rounded-full bg-amber-900 px-4 py-2 text-sm font-black text-white" href={`/${country}/account`}>
          Back to account
        </Link>
      </Card>
    </PageShell>
  );
}
