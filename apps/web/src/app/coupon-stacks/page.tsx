import { CouponLoyaltyActions } from '@/components/coupon-loyalty-actions';
import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { loyaltyPricePreferenceContract, memberOfferAggregationBoard } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/coupon-stacks');
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
  const route = 'coupon-stacks';
  return (
    <PageShell>
      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />
      <CouponLoyaltyActions />

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Member-offer aggregation</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{memberOfferAggregationBoard.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Public rows tagged as Lidl <code>memberOnly</code> or Matpriskollen <code>requiresMembershipCard</code> are normalized to <code>price_type='member'</code> ({memberOfferAggregationBoard.sourcePredicate}). Points remain account-bound: {memberOfferAggregationBoard.pointsStatus}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-5 text-right shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Total public member savings</p>
            <p className="mt-2 text-3xl font-black text-emerald-900">{memberOfferAggregationBoard.totalMemberSavingsLabel}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">pointsEarned: {memberOfferAggregationBoard.pointsEarned ?? 'blocked'}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {memberOfferAggregationBoard.rows.slice(0, 6).map((row) => (
            <div className="rounded-2xl border border-emerald-200 bg-white p-4" key={row.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{row.chain} · {row.priceType}</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{row.productName}</h3>
                  <p className="mt-1 text-xs font-bold text-slate-500">{row.packageText} · {row.storeScope}</p>
                </div>
                <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">{row.validTo}</p>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Member</dt>
                  <dd className="mt-1 font-black text-slate-950">{row.memberPriceLabel}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Shelf</dt>
                  <dd className="mt-1 font-black text-slate-950">{row.publicShelfPriceLabel}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Savings</dt>
                  <dd className="mt-1 font-black text-slate-950">{row.totalMemberSavingsLabel}</dd>
                </div>
              </dl>
              <p className="mt-3 rounded-2xl bg-white text-sm font-semibold text-slate-700">{row.evidence}</p>
              <p className="mt-2 rounded-2xl bg-emerald-100 p-3 text-sm font-bold text-emerald-950">
                pointsEarned: {row.pointsEarned ?? 'blocked'} · {row.pointsStatus}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {memberOfferAggregationBoard.sourceCounts.map((source) => (
            <p className="rounded-2xl bg-white p-4 text-sm font-black text-slate-950" key={source.source}>{source.source}: {source.rows} rows</p>
          ))}
        </div>
        <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
          {memberOfferAggregationBoard.guardrails.map((guardrail) => (
            <li key={guardrail}>• {guardrail}</li>
          ))}
          <li>• No anonymous point balances appear on this route.</li>
        </ul>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Account preferences</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Loyalty price preferences</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          GroceryView can remember chainToggles for member-price comparison, but the preference does not store retailer passwords or cards. No retailer credentials are stored, and authenticated loyalty prices stay hidden until a signed-in account offer response confirms eligibility.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {loyaltyPricePreferenceContract.chainToggles.map((toggle) => (
            <div className="rounded-2xl border border-amber-200 bg-white p-4" key={toggle.preferenceKey}>
              <p className="text-lg font-black text-slate-950">{toggle.chain}</p>
              <p className="mt-1 text-xs font-bold text-slate-600">chainToggles.{toggle.preferenceKey}</p>
              <p className="mt-3 rounded-2xl bg-amber-100 p-3 text-sm font-semibold text-amber-950">{toggle.evidenceStatus}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
          {loyaltyPricePreferenceContract.guardrails.map((guardrail) => (
            <li key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
