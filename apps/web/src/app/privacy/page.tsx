import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { PrivacyRequestActions } from '@/components/privacy-request-actions';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/privacy');
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
  const route = 'privacy';
  return (
    <PageShell>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Integritetspolicy / Privacy policy</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Privacy policy and GDPR data subject rights</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView keeps private grocery data account-bound. Export my data, Delete my account, and ad-data opt-out requests require a signed-in session and never run as anonymous public actions.
      </p>

      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />
      <PrivacyRequestActions />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-black text-slate-950">Svensk sammanfattning</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Vi behandlar konto, hushåll, varukorg, bevakningar, kvitton och skanningsdata endast för att leverera prisjämförelse, historik, aviseringar och datarättigheter. Ingen privat rad visas i den statiska publika versionen.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>GDPR data subject rights: åtkomst/export, rättelse via konto, radering, invändning mot annonsdata och begränsning när data inte längre behövs.</li>
            <li>Kvitto- och scannerbilder är känsliga: receipt retention är begränsad till matchning, granskning och lagstadgad audit, därefter raderas eller anonymiseras underlaget.</li>
            <li>Receipt encryption gäller för uppladdad bild och extraherade rader i lagring; åtkomst kräver signerad bearer-session och kontoägarskap.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl font-black text-slate-950">English policy summary</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            GroceryView uses account, household, basket, watchlist, receipt, and scanner records only to provide grocery price intelligence, account controls, notifications, and legal privacy workflows.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>Export my data returns account-owned records only after a verified session identifies the user.</li>
            <li>Delete my account creates a destructive deletion plan for account, receipt, basket, notification, and subscription records before execution.</li>
            <li>No anonymous privacy requests are accepted; every data-subject workflow must be account-bound and auditable.</li>
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
