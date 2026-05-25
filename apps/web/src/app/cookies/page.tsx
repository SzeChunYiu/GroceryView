import Link from 'next/link';
import { Card, PageShell } from '@/components/data-ui';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { routeMetadata } from '@/lib/seo';
import { buildPrivacyExport, planAccountDeletion, planPrivacyRequestFulfillment, redactForAdvertisers } from '@groceryview/core';

export function generateMetadata() {
  return routeMetadata('/cookies');
}

const disclosureSnapshot = buildPrivacyExport({
  userId: 'cookie-disclosure-sample',
  favoriteStoreIds: ['willys-odenplan'],
  watchlistProductIds: ['coffee'],
  receiptIds: ['receipt-redacted'],
  householdIds: ['household-redacted']
});

const deletionPlan = planAccountDeletion(disclosureSnapshot.userId);

const advertiserPayload = redactForAdvertisers({
  userId: disclosureSnapshot.userId,
  district: 'Odenplan',
  categoryInterest: 'coffee',
  weeklyBudget: 800,
  receiptTotal: 642,
  receiptImageUrl: 'private://receipt'
});

const privacyFulfillmentPlan = planPrivacyRequestFulfillment({
  now: '2026-05-20T12:00:00.000Z',
  slaDays: 30,
  alertBeforeDays: 5,
  requests: [
    {
      id: 'cookie-consent-export',
      userId: disclosureSnapshot.userId,
      type: 'data_export',
      receivedAt: '2026-05-10T12:00:00.000Z',
      status: 'received'
    },
    {
      id: 'cookie-consent-ad-opt-out',
      userId: disclosureSnapshot.userId,
      type: 'ad_data_opt_out',
      receivedAt: '2026-05-18T12:00:00.000Z',
      status: 'in_progress'
    }
  ]
});

const cookieCategories = [
  {
    name: 'necessary',
    purpose: 'Security, consent proof, language, and core navigation cookies required to run GroceryView.',
    defaultState: 'always on',
    legalBasis: 'legitimate interest',
    retention: 'until consent is changed or policyVersion rotates',
    coreEvidence: `${deletionPlan.deleteFromTables.length} account tables are deletion-scoped in @groceryview/core.`
  },
  {
    name: 'analytics',
    purpose: 'Optional aggregated product and source-coverage measurement after consent.',
    defaultState: 'denied until opt-in',
    legalBasis: 'consent',
    retention: 'rolling aggregate window only',
    coreEvidence: `${privacyFulfillmentPlan.items.length} privacy request paths are SLA tracked before analytics exports are fulfilled.`
  },
  {
    name: 'ads',
    purpose: 'Optional ad storage. Ads stay non-personalised unless the user grants ad consent.',
    defaultState: 'denied until opt-in',
    legalBasis: 'consent',
    retention: 'disabled until the consent state grants ad storage',
    coreEvidence: `Advertiser payload keeps ${Object.keys(advertiserPayload).join(' and ')} only; receipt and budget fields are removed.`
  },
  {
    name: 'personalisation',
    purpose: 'Optional recommendation and ad-personalisation signals after explicit consent.',
    defaultState: 'denied until opt-in',
    legalBasis: 'consent',
    retention: 'disabled until personalisation consent is granted',
    coreEvidence: `Export disclosure exposes ${disclosureSnapshot.sections.length} user-facing sections without internal trust metadata.`
  }
] as const;

const consentModeSignals = [
  ['analytics_storage', 'analytics'],
  ['ad_storage', 'ads'],
  ['ad_user_data', 'ads'],
  ['ad_personalization', 'personalisation']
] as const;

export default function CookiePolicyPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Cookiepolicy / Cookie policy</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Cookie policy and consent settings</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            GroceryView uses a GDPR-style category disclosure with IAB TCF v2.2 wording and Google Consent Mode v2 defaults. Optional analytics, ads, and personalisation signals default to denied, and ads remain non-personalised until consent is granted.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-black text-emerald-800">
            <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/sv/cookies">Svensk cookiepolicy</Link>
            <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/en/cookies">English cookie policy</Link>
          </div>
        </div>
        <ConfidenceBadge level="high" label="core privacy primitives" sampleSize={privacyFulfillmentPlan.items.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-2xl font-black text-slate-950">Consent categories</h2>
          <div className="mt-4 grid gap-3">
            {cookieCategories.map((category) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={category.name}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-black capitalize text-slate-950">{category.name}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{category.defaultState}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{category.purpose}</p>
                <dl className="mt-3 grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="font-black uppercase tracking-[0.14em] text-slate-500">Legal basis</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{category.legalBasis}</dd>
                  </div>
                  <div>
                    <dt className="font-black uppercase tracking-[0.14em] text-slate-500">Retention</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{category.retention}</dd>
                  </div>
                </dl>
                <p className="mt-3 rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-700">{category.coreEvidence}</p>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black text-slate-950">Consent proof</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Managed choices are stored locally with policyVersion, timestamp, action, and category state so the banner can prove which policy text was accepted without sending private grocery data to public pages.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>policyVersion changes force a fresh consent choice.</li>
            <li>timestamp records when the shopper accepted, rejected, or managed categories.</li>
            <li>Google Consent Mode v2 maps analytics_storage, ad_storage, ad_user_data, and ad_personalization from the chosen categories.</li>
            <li>AdSense and marketing integrations must keep non-personalised behavior unless ads and personalisation are granted.</li>
          </ul>
          <div className="mt-5 grid gap-2">
            {consentModeSignals.map(([signal, category]) => (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700" key={signal}>
                <span>{signal}</span>
                <span className="rounded-full bg-white px-3 py-1 uppercase tracking-[0.14em] text-slate-500">{category}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">Svensk sammanfattning</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Nödvändiga cookies krävs för säkerhet och val av samtycke. Analys, ads och personalisation är frivilliga och avstängda tills du väljer dem. Du kan neka alla val utan att förlora kärnfunktioner för verifierade pris- och källdata.
        </p>
      </Card>
    </PageShell>
  );
}
