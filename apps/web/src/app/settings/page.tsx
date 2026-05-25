import { buildPrivacyExport } from '@groceryview/core';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { SettingsDataExportActions } from '@/components/settings-data-export-actions';
import { DietaryProfileOnboarding } from '@/components/diet-filter-picker';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { groupPreferredBrandControls, personalizationTransparencySignals } from '@/lib/personalization';
import { routeMetadata } from '@/lib/seo';

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

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Personalization setup</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Dietary profile for onboarding and settings edits</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          Save allergies, diets, and avoided ingredients before recommendations are trusted. The same durable profile can be updated later from settings.
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
