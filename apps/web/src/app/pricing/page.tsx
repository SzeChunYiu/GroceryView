import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const premiumOcrHistoryPlan = {
  name: 'Premium OCR history',
  price: '99 kr / month',
  yearlyPrice: '990 kr / year',
  checkoutPlans: ['premium_monthly', 'premium_yearly'],
  highlights: [
    'Signed-in receipt OCR history for comparing past grocery scans.',
    'Private scan timeline stays tied to the account entitlement.',
    'Upgrade path uses account-bound Stripe checkout before any redirect.'
  ]
};

export function generateMetadata() {
  return routeMetadata('/pricing');
}

export default function PricingPage() {
  return (
    <PageShell>
      <Eyebrow>Pricing</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Upgrade for receipt OCR history</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Premium keeps GroceryView shopping history account-bound: signed-in shoppers can review receipt scans, compare older OCR results, and manage checkout from the account billing controls.
      </p>

      <Card className="mt-6 border-violet-300 bg-violet-50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Highlighted plan</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{premiumOcrHistoryPlan.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Choose this plan before checkout when OCR scan history is the upgrade goal. The account page starts {premiumOcrHistoryPlan.checkoutPlans.join(' or ')} checkout only after a production session is loaded.
            </p>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-violet-950">
              {premiumOcrHistoryPlan.highlights.map((highlight) => (
                <li className="rounded-2xl bg-white p-3 shadow-sm" key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.5rem] border border-violet-200 bg-white p-5 shadow-sm lg:min-w-72">
            <p className="text-sm font-black text-slate-500">Monthly</p>
            <p className="mt-1 text-4xl font-black text-violet-900">{premiumOcrHistoryPlan.price}</p>
            <p className="mt-3 text-sm font-bold text-slate-600">Yearly option: {premiumOcrHistoryPlan.yearlyPrice}</p>
            <Link className="mt-5 inline-flex rounded-full bg-violet-700 px-5 py-3 text-sm font-black text-white" href="/account">
              Open account billing controls
            </Link>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-slate-200 bg-white">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">Checkout stays signed-in</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Pricing is public, but Stripe checkout is launched from the account page with the sessionStorage bearer token. Anonymous visitors can review the Premium OCR history plan here without creating billing sessions.
        </p>
      </Card>
    </PageShell>
  );
}
