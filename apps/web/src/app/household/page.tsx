import { Card, Eyebrow, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { HouseholdPlanActions } from '@/components/household-plan-actions';
import { DEFAULT_HOUSEHOLD_PRICE_PREFERENCES, HOUSEHOLD_PRICE_PREFERENCE_STORAGE_KEY, sortByHouseholdPricePreferences } from '@/lib/user-preferences';
import { formatPct, formatSek, shareableHouseholdListContract, sourceCoverage, topChainSpreads } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/household');
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

const friendInviteOnboarding = {
  deepLink: '/household?invite=preview&role=viewer&utm_source=household_friend_invite',
  smsLink: 'sms:?&body=Join%20my%20GroceryView%20household%20to%20plan%20one%20shared%20list%20before%20the%20next%20shop.%20/household%3Finvite%3Dpreview%26role%3Dviewer%26utm_source%3Dhousehold_friend_invite',
  emailLink: 'mailto:?subject=Join%20my%20GroceryView%20household&body=Join%20my%20GroceryView%20household%20to%20plan%20one%20shared%20list%20before%20the%20next%20shop.%20/household%3Finvite%3Dpreview%26role%3Dviewer%26utm_source%3Dhousehold_friend_invite',
  message: 'Join my GroceryView household to plan one shared list before the next shop.',
  detail: 'Open the invite, confirm your role, and GroceryView will keep prices, blockers, and trip context in sync.'
};

const householdEvidence = [
  {
    label: 'Verified sources',
    value: sourceCoverage.length.toLocaleString('sv-SE'),
    detail: 'Only generated public source modules are used on this static route.'
  },
  {
    label: 'Comparable chain rows',
    value: topChainSpreads.length.toLocaleString('sv-SE'),
    detail: 'Household planning can compare Willys/Hemköp spreads without private profiles.'
  },
  {
    label: 'Private records rendered',
    value: '0',
    detail: 'Names, budgets, receipt queues, and dietary rules stay hidden until verified account data exists.'
  }
];

export default function FeaturePage() {
  const route = 'household';
  const householdPricePreferences = DEFAULT_HOUSEHOLD_PRICE_PREFERENCES;
  const planningRows = sortByHouseholdPricePreferences(topChainSpreads.slice(0, 4), householdPricePreferences);

  return (
    <PageShell>
      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />
      <HouseholdPlanActions />

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <Eyebrow>Friend invite onboarding</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">One-tap household invites with deep links</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{friendInviteOnboarding.message} {friendInviteOnboarding.detail}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white" href={friendInviteOnboarding.deepLink}>Open invite preview</a>
          <a className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-black text-emerald-800" href={friendInviteOnboarding.smsLink}>Share by SMS</a>
          <a className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-black text-emerald-800" href={friendInviteOnboarding.emailLink}>Share by email</a>
        </div>
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {householdEvidence.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-sm font-semibold text-slate-600">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-6">
        <Eyebrow>Household preference learning</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">preferred stores and brands bias household price ordering</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Store and brand choices are persisted per household under <span className="font-black">{HOUSEHOLD_PRICE_PREFERENCE_STORAGE_KEY}</span>, then used to lift matching products in search and compare surfaces without hiding cheaper verified alternatives.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Preferred stores</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{householdPricePreferences.preferredStores.join(', ')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Preferred brands</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{householdPricePreferences.preferredBrands.join(', ')}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <Eyebrow>Shareable household lists</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">role-based permissions before any shared grocery list can edit account state</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {shareableHouseholdListContract.corePlanner} keeps shared lists account-bound: viewers can open an expiring list, editors must already be signed-in household members, and missing-price blockers stay visible to everyone. No anonymous household edits are allowed.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {shareableHouseholdListContract.roles.map((role) => (
            <div key={role.role} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{role.role}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{role.label}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 md:grid-cols-2">
          {shareableHouseholdListContract.guardrails.map((guardrail) => <li key={guardrail}>• {guardrail}</li>)}
        </ul>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <Eyebrow>Household planning evidence</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Verified price context without private rows</h2>
          <div className="mt-5 divide-y divide-slate-200">
            {planningRows.map((product) => (
              <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto]" key={product.slug}>
                <div>
                  <p className="font-black text-slate-950">{product.name}</p>
                  <p className="text-sm text-slate-600">{product.brand || 'Brand not reported'} · {product.subline || 'Size not reported'}</p>
                </div>
                <p className="font-black text-emerald-800">{formatSek(product.lowestPrice)}</p>
                <p className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950">{formatPct(product.spreadPct)} spread</p>
              </div>
            ))}
          </div>
        </Card>

        <TopSpreads limit={4} />
      </section>

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
