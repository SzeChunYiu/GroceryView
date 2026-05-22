import { CouponLoyaltyActions } from '@/components/coupon-loyalty-actions';
import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { loyaltyPricePreferenceContract } from '@/lib/verified-data';
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
