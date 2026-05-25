import { buildPrivacyExport } from '@groceryview/core';
import Link from 'next/link';
import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { ConfidenceBadge } from '@/components/confidence-badge';
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

const privacyExportContract = buildPrivacyExport(
  {
    userId: 'signed-in-account',
    favoriteStoreIds: [],
    watchlistProductIds: [],
    receiptIds: [],
    householdIds: []
  },
  '2026-05-20T12:00:00.000Z'
);

export default function FeaturePage() {
  const route = 'privacy';
  return (
    <PageShell>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Integritetspolicy / Privacy policy</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Privacy policy and GDPR data subject rights</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView keeps private grocery data account-bound. Export my data, Delete my account, and ad-data opt-out requests require a signed-in session and never run as anonymous public actions.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-black text-emerald-800">
        <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/sv/privacy">Svensk integritetspolicy</Link>
        <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/en/privacy">English privacy policy</Link>
      </div>

      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />

      <Card className="mt-6 border-emerald-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Account data export</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Export my data uses the core GDPR export contract</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              The signed-in export action below returns account-owned data through the protected privacy endpoint, using the same buildPrivacyExport sections from @groceryview/core.
            </p>
          </div>
          <ConfidenceBadge level="high" label="Core export contract" sampleSize={privacyExportContract.sections.length} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {privacyExportContract.sections.map((section) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={section.name}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Section</p>
              <p className="mt-2 break-words text-sm font-black text-slate-950">{section.name}</p>
            </div>
          ))}
        </div>
      </Card>
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

        <Card>
          <h2 className="text-2xl font-black text-slate-950">Íslensk persónuverndaryfirlit (is-IS)</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Fyrir Ísland meðhöndlar GroceryView reiknings-, körfu-, vöktunar-, heimilis- og kvittanagögn eingöngu til að veita verðupplýsingar, notendastýringar, tilkynningar og lögbundin persónuverndarferli.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>Persónuvernd er íslenska eftirlitsstofnunin sem notendur geta leitað til vegna persónuverndarmála.</li>
            <li>Icelandic processing is documented as EEA-aligned GDPR: aðgangur/export, leiðrétting, eyðing, andmæli og takmörkun vinnslu eru account-bound réttindi.</li>
            <li>Engar nafnlausar beiðnir um persónugögn eru framkvæmdar; útflutningur og eyðing krefjast innskráningar og rekjanlegrar beiðni.</li>
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
