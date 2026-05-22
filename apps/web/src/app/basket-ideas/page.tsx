import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { retailerHandoffContract } from '@/lib/verified-data';

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
  const route = 'basket-ideas';
  return (
    <PageShell>
      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Retailer action layer</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Retailer handoff support matrix: {retailerHandoffContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The basket action API exposes <code className="rounded bg-white/80 px-1 py-0.5 text-amber-900">{retailerHandoffContract.endpoint}</code> so GroceryView can present honest retailer handoff actions without pretending that unsupported basket transfer or checkout confirmation is available.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerHandoffContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Support matrix</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerHandoffContract.supportedRetailers.map((retailer) => (
                <li key={retailer.retailerId}>{retailer.label}: product links {retailer.productLinks}, basket transfer {retailer.basketTransfer}, checkout confirmation {retailer.checkoutConfirmation}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerHandoffContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-amber-200 bg-white/70 p-4">
          <p className="font-black text-slate-950">Static snapshot remains closed</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {retailerHandoffContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
