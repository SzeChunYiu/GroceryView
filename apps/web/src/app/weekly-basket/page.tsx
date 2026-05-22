import { Card, Eyebrow, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { recurringBasketDigestContract } from '@/lib/verified-data';

const route = 'weekly-basket';

export default function WeeklyBasketPage() {
  return (
    <PageShell>
      <NoVerifiedData route={route} title="Weekly basket still has no private production records in this static snapshot" />
      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <Eyebrow>Changed since last shop</Eyebrow>
        <div className="mt-2 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-emerald-950">
              Recurring basket digest: {recurringBasketDigestContract.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-950">
              The account API now exposes <code className="rounded bg-white/80 px-1 py-0.5 font-bold">{recurringBasketDigestContract.endpoint}</code> for
              recurring weekly baskets. It turns saved basket quantities plus verified price history into price-up, price-down,
              substitute-available, new-item, and missing-price blockers before a shopper plans checkout.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-black text-emerald-950">Static snapshot boundary</p>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              This page still does not render private basket rows until a production session supplies user-owned data.
              The product contract is visible here so the route can graduate from fail-closed to account-backed without fake rows.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="font-black text-emerald-950">Required inputs</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
              {recurringBasketDigestContract.requiredInputs.map((input) => <li key={input}>• {input}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="font-black text-emerald-950">Shipped behaviours</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
              {recurringBasketDigestContract.shippedBehaviors.map((behavior) => <li key={behavior}>• {behavior}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="font-black text-emerald-950">Blocked from static rendering</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
              {recurringBasketDigestContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>• {blocker}</li>)}
            </ul>
          </div>
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
