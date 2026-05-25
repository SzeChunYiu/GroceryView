import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { premiumEntitlementCatalog } from '@/lib/entitlements';
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
    summary: 'Verified public prices, product pages, source coverage, privacy, legal, confidence, and freshness information.',
    features: ['Core product and chain comparison surfaces', 'Basic price alerts with source confidence', 'Legal, privacy, freshness, and confidence pages stay public']
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '49 kr / month',
    summary: 'Account-bound power tools for shoppers who need advanced alerts, saved views, exports, and private scan history.',
    features: ['Advanced alerts and larger watchlists', 'Unlimited saved views after the free cap', 'CSV/API exports and private OCR history']
  }
];

const premiumGuardrails = [
  'Premium gates fail closed unless the server sees an active or trialing entitlement.',
  'Legal, privacy, source confidence, freshness, and core price comparison information are never paywalled.',
  'Coming-soon features are labelled before checkout and are not sold as active capabilities.'
];

const comingSoonFeatures = premiumEntitlementCatalog.filter((gate) => gate.status === 'coming_soon');

export default function PricingPage() {
  return (
    <PageShell>
      <Eyebrow>Premium</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Plans for grocery price power users</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView keeps public price intelligence, confidence, freshness, privacy, and legal information free. Premium adds account-bound workflow tools where server-side entitlement checks are already defined.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div className="scroll-mt-24" id={plan.id === 'premium' ? 'premium' : undefined} key={plan.id}>
            <Card className={plan.id === 'premium' ? 'h-full border-indigo-200 bg-indigo-50/80 ring-2 ring-indigo-300' : 'h-full bg-white'}>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">{plan.id === 'premium' ? 'Upgrade reason' : 'Included'}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{plan.name}</h2>
              <p className="mt-2 text-4xl font-black text-emerald-800">{plan.price}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{plan.summary}</p>
              <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-slate-700">
                {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
              </ul>
              {plan.id === 'premium' ? (
                <Link className="mt-4 inline-flex rounded-full bg-indigo-900 px-4 py-2 text-sm font-black text-white" href="/account">
                  Continue to account checkout
                </Link>
              ) : null}
            </Card>
          </div>
        ))}
      </div>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Trust boundary</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Premium gates do not hide public evidence</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The premium tier adds account-owned workflow depth. Public price evidence, confidence labels, freshness status, privacy rights, and legal terms stay outside the paywall.
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

      <Card className="mt-6 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">Entitlement gates</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Premium features fail closed until subscription access is active</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              The entitlement catalog defines server gates and UI copy for advanced alerts, saved views, export/API access, household sharing, pro terminal tools, and premium OCR history before Stripe subscriptions expand.
            </p>
          </div>
          <Link className="rounded-full bg-indigo-900 px-5 py-3 text-sm font-black text-white shadow-sm" href="/account">
            Check account access
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {premiumEntitlementCatalog.map((gate) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={gate.feature}>
              <p className="text-sm font-black text-slate-950">{gate.label}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{gate.status.replace('_', ' ')}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Free: {gate.freeLimit}</p>
              <p className="mt-2 rounded-xl bg-indigo-50 p-3 text-sm font-bold leading-6 text-indigo-950">Premium: {gate.premiumAccess}</p>
              <p className="mt-2 font-mono text-xs font-bold text-slate-500">{gate.enforcementReason}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">Coming soon</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Planned premium surfaces are labelled honestly</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              These premium surfaces are present in the entitlement model but are not represented as active paid capabilities until the product surface and billing path are ready.
            </p>
          </div>
          <p className="rounded-full bg-white px-5 py-3 text-sm font-black text-violet-900 shadow-sm">No fabricated savings claims</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {comingSoonFeatures.map((row) => (
            <div className="rounded-2xl bg-white p-4" key={row.feature}>
              <p className="text-sm font-black text-slate-950">{row.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{row.premiumAccess}</p>
              <p className="mt-2 font-mono text-xs font-bold text-slate-500">{row.enforcementReason}</p>
            </div>
          ))}
        </div>
        <Link className="mt-4 inline-flex rounded-full bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-sm" href="/account">
          Unlock forecast in account
        </Link>
      </Card>
    </PageShell>
  );
}
