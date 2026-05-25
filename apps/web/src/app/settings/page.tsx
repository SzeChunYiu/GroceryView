import { buildPrivacyExport } from '@groceryview/core';
import Link from 'next/link';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { ChainSelector } from '@/components/chain-selector';
import { PushNotificationPreferenceControls } from '@/components/notification-inbox-actions';
import { SettingsDataExportActions } from '@/components/settings-data-export-actions';
import { DietaryProfileOnboarding } from '@/components/diet-filter-picker';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { groupPreferredBrandControls, personalizationTransparencySignals } from '@/lib/personalization';
import { routeMetadata } from '@/lib/seo';
import { DEFAULT_PREFERRED_STORE_SETTINGS } from '@/lib/user-preferences';
import { storeUniverse } from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/settings');
}

const settingsValidationErrorAnnouncements = [
  'Email and export request validation errors render in role="alert" live regions.',
  'Screen readers are notified immediately when settings form errors appear.'
];

const dataExportContract = buildPrivacyExport(
  {
    userId: 'signed-in-account',
    lists: [],
    alerts: [],
    preferences: [],
    analyticsEvents: [],
    favoriteStoreIds: [],
    watchlistProductIds: [],
    receiptIds: [],
    householdIds: []
  },
  '2026-05-20T12:00:00.000Z'
);

const preferredStoreSettings = DEFAULT_PREFERRED_STORE_SETTINGS;
const supportedChains = ['ICA', 'Willys', 'Hemköp', 'Coop', 'Lidl', 'City Gross'];
const homeStoreChoices = storeUniverse.slice(0, 6);
const selectedHomeStoreId = homeStoreChoices.some((store) => store.slug === preferredStoreSettings.homeStoreId)
  ? preferredStoreSettings.homeStoreId
  : homeStoreChoices[0]?.slug;
const homeStoreOptions = homeStoreChoices.map((store) => ({
  id: store.slug,
  label: store.name,
  value: store.slug,
  description: `${store.brand} · ${store.city || store.district || 'Sweden'}`,
  selected: store.slug === selectedHomeStoreId
}));
const favoriteChainOptions = supportedChains.map((chain) => ({
  id: `favorite-${chain.toLowerCase().replace(/\s+/g, '-')}`,
  label: chain,
  value: chain,
  selected: preferredStoreSettings.favoriteChains.includes(chain)
}));
const blockedChainOptions = supportedChains.map((chain) => ({
  id: `blocked-${chain.toLowerCase().replace(/\s+/g, '-')}`,
  label: chain,
  value: chain,
  selected: preferredStoreSettings.blockedChains.includes(chain),
  disabled: preferredStoreSettings.favoriteChains.includes(chain)
}));

export default function SettingsPage() {
  const brandControls = groupPreferredBrandControls();

  return (
    <PageShell>
      <Eyebrow>Account settings</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Settings and GDPR account export</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Download my data and Delete my account are signed-in account actions. The export includes lists, alerts, preferences, and analytics events alongside legacy privacy sections, and the page never renders anonymous private rows.
      </p>

      <SettingsDataExportActions />

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Legal policies</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Privacy and cookie policy links</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          Review how account data, receipts, analytics, ads, retention, deletion, processors, and consent categories are handled in Swedish or English.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-black text-emerald-900">
          <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/sv/privacy">Integritetspolicy</Link>
          <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/en/privacy">Privacy policy</Link>
          <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/sv/cookies">Cookiepolicy</Link>
          <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/en/cookies">Cookie policy</Link>
          <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/settings/hidden">Hidden products and stores</Link>
        </div>
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Preferred stores</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Shopper chain and travel settings</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Recommendations can prefer favorite chains, suppress blocked chains, anchor comparisons to a home store, and cap travel suggestions to a practical radius.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-900">{preferredStoreSettings.maxTravelRadiusKm} km max</p>
        </div>
        <form className="mt-5 grid gap-4 lg:grid-cols-2">
          <ChainSelector
            className="rounded-3xl border border-violet-100 bg-white/85 p-4 shadow-sm"
            description="Favorite chains are ranked first when equivalent verified prices are available."
            interactive
            label="Favorite chains"
            name="favoriteChains"
            options={favoriteChainOptions}
          />
          <ChainSelector
            className="rounded-3xl border border-violet-100 bg-white/85 p-4 shadow-sm"
            description="Blocked chains are excluded from recommendation copy unless a user explicitly re-enables them."
            interactive
            label="Blocked chains"
            name="blockedChains"
            options={blockedChainOptions}
          />
          <ChainSelector
            className="rounded-3xl border border-violet-100 bg-white/85 p-4 shadow-sm"
            description="The home store anchors nearby-store comparisons and trip planning defaults."
            interactive
            label="Home store"
            name="homeStoreId"
            options={homeStoreOptions}
            selectionMode="single"
          />
          <div className="rounded-3xl border border-violet-100 bg-white/85 p-4 shadow-sm">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800" htmlFor="maxTravelRadiusKm">Max travel radius</label>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Caps store recommendations to shops the household is willing to visit.</p>
            <div className="mt-4 flex items-center gap-3">
              <input
                className="w-full accent-violet-800"
                defaultValue={preferredStoreSettings.maxTravelRadiusKm}
                id="maxTravelRadiusKm"
                max="50"
                min="1"
                name="maxTravelRadiusKm"
                type="range"
              />
              <output className="rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-950">{preferredStoreSettings.maxTravelRadiusKm} km</output>
            </div>
          </div>
        </form>
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Personalization transparency</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Recommendation signals and reset controls</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              GroceryView recommendations use only explicit account, list, search, brand, and dietary signals. Use the controls above to clear local history or disable an entire signal category.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-900">{personalizationTransparencySignals.length} signal categories</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {personalizationTransparencySignals.map((signal) => (
            <div className="rounded-2xl border border-violet-100 bg-white/85 p-4" key={signal.id}>
              <p className="text-sm font-black text-slate-950">{signal.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Source: {signal.source}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-violet-900">Use: {signal.recommendationUse}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-violet-700">{signal.clearAction}</p>
            </div>
          ))}
        </div>
      </Card>

            <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">Notification volume</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Granular push preferences</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          Keep mobile alerts useful by independently enabling price drops, stock changes, list collaboration, and budget warning notifications.
        </p>
        <PushNotificationPreferenceControls />
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Personalization setup</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Dietary profile for onboarding and settings edits</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          Save dietary exclusions, certification preferences, and nutrition priorities before recommendations are trusted. The same durable profile can be updated later from settings.
        </p>
        <DietaryProfileOnboarding className="mt-4" />
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Brand substitution controls</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Favorite, acceptable, and excluded brands</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Savings recommendations can rank favorite brands first, keep acceptable brands as fallback substitutions, and suppress excluded brands from automatic swaps.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-cyan-900">{brandControls.favorite.length} favorites</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {Object.entries(brandControls).map(([tolerance, controls]) => (
            <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4" key={tolerance}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">{tolerance}</p>
              <ul className="mt-3 space-y-3">
                {controls.map((control) => (
                  <li className="text-sm font-semibold leading-5 text-slate-700" key={control.brand}>
                    <span className="block font-black text-slate-950">{control.brand}</span>
                    {control.note}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Cold-start personalization</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Import purchase history for recommendations and budgets</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          CSV imports map past grocery rows into recurring basket candidates, recommendation seeds, and budget history. Expected columns are <code className="rounded bg-white/80 px-1 py-0.5 text-sky-900">date</code>, <code className="rounded bg-white/80 px-1 py-0.5 text-sky-900">product</code>, <code className="rounded bg-white/80 px-1 py-0.5 text-sky-900">store</code>, <code className="rounded bg-white/80 px-1 py-0.5 text-sky-900">quantity</code>, and <code className="rounded bg-white/80 px-1 py-0.5 text-sky-900">total</code>.
        </p>
        <BulkImportDialog importMode="purchase-history" />
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-900">Form error announcements</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Validation errors use live alert regions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {settingsValidationErrorAnnouncements.map((message) => (
            <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700" key={message} role="alert" aria-live="assertive">
              {message}
            </p>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Download my data contract</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">JSON sections returned from /api/settings/data-export</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              The browser action requests <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">/api/settings/data-export</code> with the signed-in bearer token and writes the response to a local JSON file only after the API confirms ownership.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900">{dataExportContract.sections.length} sections</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {dataExportContract.sections.map((section) => (
            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4" key={section.name}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Section</p>
              <p className="mt-2 break-words text-sm font-black text-slate-950">{section.name}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={4} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
