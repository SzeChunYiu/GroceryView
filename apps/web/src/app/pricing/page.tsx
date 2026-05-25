import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/pricing');
}

export const dynamic = 'force-static';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0 kr',
    summary: 'Verified public prices, product pages, source coverage, and manual scanner upload readiness.',
    features: ['Current product and chain comparison surfaces', 'Receipt upload processing when signed in', 'No OCR scan history storage']
  },
  {
    id: 'premium-ocr',
    name: 'Premium OCR history',
    price: '49 kr / month',
    summary: 'Power-user scan history and correction workflows for frequent barcode and receipt shoppers.',
    features: ['Private OCR scan history timeline', 'Advanced line-item correction tools', 'Exportable corrected receipt rows for repeat shops']
  }
];

const premiumGuardrails = [
  'OCR scan history requires a signed-in account with an active premium entitlement.',
  'Static public pages never render private receipt images, extracted line items, or correction drafts.',
  'Advanced corrections update only the shopper-owned scan review queue after explicit confirmation.'
];

export default function PricingPage() {
  return (
    <PageShell>
      <Eyebrow>Premium</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Plans for grocery price power users</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView keeps public price intelligence free. Premium adds account-bound OCR scan history and advanced correction tools for shoppers who scan receipts often.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card className={plan.id === 'premium-ocr' ? 'border-indigo-200 bg-indigo-50/80' : 'bg-white'} key={plan.id}>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">{plan.id === 'premium-ocr' ? 'Upgrade reason' : 'Included'}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{plan.name}</h2>
            <p className="mt-2 text-4xl font-black text-emerald-800">{plan.price}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{plan.summary}</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-slate-700">
              {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
            </ul>
          </Card>
        ))}
      </div>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">OCR premium gate</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Scan history stays private and premium-only</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The premium tier stores prior OCR scans so frequent shoppers can revisit corrections, fix recurring retailer aliases, and reuse cleaned receipt rows. Free accounts can still process a scan, but saved scan history and advanced corrections remain locked.
            </p>
          </div>
          <Link className="rounded-full bg-emerald-900 px-5 py-3 text-center text-sm font-black text-white shadow-sm" href="/scanner">
            Review scanner gate
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-emerald-950">
          {premiumGuardrails.map((guardrail) => <li key={guardrail}>• {guardrail}</li>)}
        </ul>
      </Card>
    </PageShell>
  );
}
