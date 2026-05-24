import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type SubscriptionPageProps = {
  params: Promise<{ country: string }>;
};

const subscriptionRows = [
  { country: 'se', name: 'ICA Stammis', kind: 'loyalty', monthlyCost: 0, estimatedSavings: 86, benefit: 'Personal offers, Stammis prices, points and bonus.' },
  { country: 'se', name: 'Coop Medlem', kind: 'loyalty', monthlyCost: 0, estimatedSavings: 72, benefit: 'Member prices, points, ownership share benefits and partner offers.' },
  { country: 'se', name: 'Hemköp Klubb', kind: 'loyalty', monthlyCost: 0, estimatedSavings: 54, benefit: 'Club prices, points, bonus checks and personal offers.' },
  { country: 'se', name: 'Mathem Plus', kind: 'paid', monthlyCost: 99, estimatedSavings: 64, benefit: 'Delivery perks and subscriber-only grocery offers.' },
  { country: 'se', name: 'Costco Executive', kind: 'paid', monthlyCost: 108, estimatedSavings: 82, benefit: 'Warehouse rewards and bulk-buy member pricing.' },
  { country: 'no', name: 'Trumf', kind: 'loyalty', monthlyCost: 0, estimatedSavings: 68, benefit: 'Bonus across NorgesGruppen banners and partners.' },
  { country: 'no', name: 'Coop Medlem', kind: 'loyalty', monthlyCost: 0, estimatedSavings: 59, benefit: 'Purchase dividend, coupons, member deals and partner benefits.' },
  { country: 'dk', name: 'Coop Medlem', kind: 'loyalty', monthlyCost: 0, estimatedSavings: 61, benefit: 'Member bonus, member prices and co-op owner benefits.' },
  { country: 'fi', name: 'S-Etukortti', kind: 'loyalty', monthlyCost: 0, estimatedSavings: 74, benefit: 'Bonus cashback, benefits and household cards.' },
  { country: 'fi', name: 'K-Plussa', kind: 'loyalty', monthlyCost: 0, estimatedSavings: 58, benefit: 'Plussa prices, points and partner benefits.' }
] as const;

function formatCurrency(value: number, country: string) {
  const currency = country === 'no' ? 'NOK' : country === 'dk' ? 'DKK' : country === 'fi' ? 'EUR' : 'SEK';
  return new Intl.NumberFormat('sv-SE', { currency, maximumFractionDigits: 0, style: 'currency' }).format(value);
}

export default async function SubscriptionManagerPage({ params }: SubscriptionPageProps) {
  const { country } = await params;
  const countryCode = country.toLowerCase();
  const rows = subscriptionRows.filter((row) => row.country === countryCode);
  const totalCost = rows.reduce((sum, row) => sum + row.monthlyCost, 0);
  const totalSavings = rows.reduce((sum, row) => sum + row.estimatedSavings, 0);
  const negativeRows = rows.filter((row) => row.estimatedSavings - row.monthlyCost < 0);

  return (
    <PageShell>
      <Eyebrow>Account subscriptions</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Loyalty and paid subscription manager</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        Track grocery loyalty programs and paid subscriptions together, comparing monthly cost against estimated grocery savings before renewing.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black text-slate-600">Monthly cost</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatCurrency(totalCost, countryCode)}</p>
        </Card>
        <Card>
          <p className="text-sm font-black text-slate-600">Estimated savings</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{formatCurrency(totalSavings, countryCode)}</p>
        </Card>
        <Card className={totalSavings - totalCost < 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}>
          <p className="text-sm font-black text-slate-600">Net ROI</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatCurrency(totalSavings - totalCost, countryCode)}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {rows.map((row) => {
          const net = row.estimatedSavings - row.monthlyCost;
          return (
            <Card className={net < 0 ? 'border-rose-200 bg-rose-50' : ''} key={row.name}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{row.kind}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{row.name}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{row.benefit}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <p className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-950">Cost {formatCurrency(row.monthlyCost, countryCode)}</p>
                <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-950">Savings {formatCurrency(row.estimatedSavings, countryCode)}</p>
                <p className="rounded-2xl bg-white p-3 text-sm font-black text-slate-950">ROI {formatCurrency(net, countryCode)}</p>
              </div>
              {net < 0 ? <p className="mt-3 rounded-2xl bg-rose-100 p-3 text-sm font-black text-rose-950">Suggested cancellation: savings trail monthly cost.</p> : null}
            </Card>
          );
        })}
      </div>

      {negativeRows.length === 0 ? <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-950">No negative-ROI subscriptions detected for this country.</p> : null}
    </PageShell>
  );
}
