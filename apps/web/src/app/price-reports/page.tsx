import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { PriceReportReviewActions } from '@/components/price-report-review-actions';
import { routeMetadata } from '@/lib/seo';
import { commodityMappingReviewPlan, crowdPriceSubmissionContract } from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/price-reports');
}

const titles: Record<string, string> = {
  'weekly-basket': 'Weekly basket planner',
  watchlist: 'Watchlist alerts',
  scanner: 'Receipt scanner',
  household: 'Household profile',
  account: 'Account and alerts',
  'basket-ideas': 'Basket ideas',
  'coupon-stacks': 'Coupon stacks',
  deals: 'Deal radar',
  'meal-planner': 'Meal planner',
  'nutrition-value': 'Nutrition value',
  'pantry-planner': 'Pantry planner',
  'price-reports': 'Price reports',
  'savings-dashboard': 'Savings dashboard',
  'shopping-trips': 'Shopping trips',
  privacy: 'Privacy controls'
};

export default function FeaturePage() {
  const route = 'price-reports';
  return (
    <PageShell>
      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />
      <Card className="mt-6 border-emerald-200 bg-emerald-50/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Account-gated intake</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Crowd price submissions</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              {crowdPriceSubmissionContract.title} defines the protected photo + price intake contract for shopper reports that can expand loose meat/veg coverage after manual review.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-emerald-950">
            <p>{crowdPriceSubmissionContract.status}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-700">{crowdPriceSubmissionContract.trustTable}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">Required evidence before submission</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {crowdPriceSubmissionContract.requiredEvidence.map((item) => (
                <div className="rounded-2xl bg-slate-50 p-3" key={item.field}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{item.field}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">Trust and manual review guardrails</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {crowdPriceSubmissionContract.guardrails.map((guardrail) => (
                <li key={guardrail}>• {guardrail}</li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              <p className="font-black">No anonymous price reports.</p>
              <p>
                Submissions to {crowdPriceSubmissionContract.protectedEndpoint} must remain account-bound, include reportedPrice and photoEvidence, and stay out of verified prices until a reviewer writes {crowdPriceSubmissionContract.reviewWritebacks.join(' or ')}.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-emerald-300 bg-white/70 p-4 text-sm leading-6 text-slate-700">
          <p className="font-black text-slate-950">community_reporter_trust default policy</p>
          <ul className="mt-2 space-y-1">
            {crowdPriceSubmissionContract.defaultTrustPolicy.map((policy) => (
              <li key={policy}>• {policy}</li>
            ))}
          </ul>
          <p className="mt-3 font-semibold text-slate-800">Next runtime step: {crowdPriceSubmissionContract.nextRuntimeStep}</p>
        </div>
      </Card>
      <Card className="mt-6 border-amber-200 bg-amber-50/80">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">Curator queue</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Commodity mapping review</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Low-confidence maps from loose produce, receipts, and community reports are not shown to shoppers until a curator validates the commodity_mapping task.
            </p>
            <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-amber-950">
              Queue source: human_review_assignments ({commodityMappingReviewPlan.queueTable}). Reporter trust gate: community_reporter_trust ({commodityMappingReviewPlan.trustTable}).
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Candidates</p>
              <p className="mt-2 text-3xl font-black text-amber-950">{commodityMappingReviewPlan.candidates.length}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Review items</p>
              <p className="mt-2 text-3xl font-black text-amber-950">{commodityMappingReviewPlan.queue.length}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Assignments</p>
              <p className="mt-2 text-3xl font-black text-amber-950">{commodityMappingReviewPlan.assignments.length}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {commodityMappingReviewPlan.queue.map((item) => (
            <div className="rounded-2xl bg-white/80 p-4 text-sm leading-6 text-slate-700" key={item.id}>
              <p className="font-black text-slate-950">{item.subjectType} · {item.priority}</p>
              <p className="mt-1">{item.reason}</p>
              <p className="mt-2 font-semibold text-amber-950">Writebacks: {commodityMappingReviewPlan.reviewWritebacks.join(' or ')}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-white/80 p-4">
          <p className="text-sm font-black text-slate-950">Review-only guardrails</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {commodityMappingReviewPlan.guardrails.map((guardrail) => (
              <li key={guardrail}>• {guardrail}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-bold text-amber-950">Next runtime step: {commodityMappingReviewPlan.nextRuntimeStep}</p>
        </div>
      </Card>
      <PriceReportReviewActions />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
