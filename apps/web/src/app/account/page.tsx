import { AccountBillingActions } from '@/components/account-billing-actions';
import { AccountMutationActions } from '@/components/account-mutation-actions';
import { AdDisclosureActions } from '@/components/ad-disclosure-actions';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { accountSavedShoppingContract, formatSek, savedBasketAutoReorderPlanner } from '@/lib/verified-data';
import { planAccountDeletion } from '@groceryview/core';

const accountDeletionPlan = planAccountDeletion('signed-in-user');
const accountDeletionConfirmations = [
  'Confirm the active session belongs to the account owner.',
  'Review every account-owned table scheduled for deletion.',
  'Acknowledge that receipt, basket, watchlist, and preference history cannot be restored after execution.',
  'Type DELETE ACCOUNT before the destructive job can be queued.'
];
const stalePriceWarningContract = {
  endpoint: '/api/alerts?staleAfterHours=48',
  warningSource: 'price_alerts joined to latest_prices',
  channel: 'push',
  staleAfterHours: 48,
  guardrails: [
    'Only products already watched by the signed-in alert email are evaluated.',
    'Warnings fire when no grocery latest_prices row has been observed inside the configured window.',
    'Missing observations are reported as reliability warnings, not synthetic prices or price-change claims.'
  ]
};

export function generateMetadata() {
  return routeMetadata('/account');
}

export default function AccountPage() {
  return (
    <PageShell>
      <Eyebrow>Account shopping state</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Saved baskets & favorite stores</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView now surfaces the real account API contract for saved shopping state while keeping private rows available to signed-in shoppers only. The public static build describes the production contract and stays closed when authenticated account records are absent.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Account-bound contract</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">{accountSavedShoppingContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Favorite stores are managed through <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">{accountSavedShoppingContract.favoriteStoresEndpoint}</code> and removals use <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">{accountSavedShoppingContract.favoriteStoreDeleteEndpoint}</code>. Saved recurring baskets persist to <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">weekly_baskets</code> with line items in <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">basket_items</code> so basket, alert, and digest features share account-owned state.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {accountSavedShoppingContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {accountSavedShoppingContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Static snapshot remains closed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {accountSavedShoppingContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">{savedBasketAutoReorderPlanner.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Saved basket auto-reorder</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The account page now turns a recurring saved basket into an auto-reorder planning checklist through <code className="rounded bg-white/80 px-1 py-0.5 text-sky-900">{savedBasketAutoReorderPlanner.corePlanner}</code> and <code className="rounded bg-white/80 px-1 py-0.5 text-sky-900">{savedBasketAutoReorderPlanner.endpoint}</code>. It still requires signed-in shopper confirmation, is not automatic purchase, and keeps missing-price blockers visible before any handoff can be prepared.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">autoReorderDecision</span>
                <span className="mt-1 block text-lg font-black text-sky-900">{savedBasketAutoReorderPlanner.autoReorderDecision.label}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Current comparable</span>
                <span className="mt-1 block text-2xl font-black text-sky-900">{formatSek(savedBasketAutoReorderPlanner.autoReorderDecision.comparableCurrentTotal)}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Missing-price blockers</span>
                <span className="mt-1 block text-2xl font-black text-slate-950">{savedBasketAutoReorderPlanner.autoReorderDecision.missingPriceBlockerCount}</span>
              </p>
            </div>
            <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-2">
              {savedBasketAutoReorderPlanner.reviewLines.map((line) => (
                <div className="rounded-2xl bg-white p-3 shadow-sm" key={line.productId}>
                  <p className="font-black text-slate-950">{line.productName}</p>
                  <p className="mt-1">{line.changeType} · current {formatSek(line.currentUnitPrice)} · previous {formatSek(line.previousUnitPrice)}</p>
                  <p className="mt-1 text-xs font-bold text-sky-950">{line.recommendedAction}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Account guardrails</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">Auto-reorder stays a signed-in planning step, not a public static basket or retail purchase claim.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {savedBasketAutoReorderPlanner.guardrails.map((guardrail) => (
                <li className="rounded-2xl bg-sky-50 p-3" key={guardrail}>{guardrail}</li>
              ))}
            </ul>
            <div className="mt-3 space-y-2">
              {savedBasketAutoReorderPlanner.missingPriceBlockers.map((blocker) => (
                <p className="rounded-2xl border border-sky-100 p-3 text-sm font-bold text-sky-950" key={blocker.productId}>{blocker.productName}: {blocker.blocker}</p>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Push reliability warnings</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Stale watched prices are flagged before alerts lose trust</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The alert API now returns <code className="rounded bg-white/80 px-1 py-0.5 text-amber-900">stalePriceWarnings</code> alongside active price alerts from <code className="rounded bg-white/80 px-1 py-0.5 text-amber-900">{stalePriceWarningContract.endpoint}</code>. It checks watched products against <code className="rounded bg-white/80 px-1 py-0.5 text-amber-900">{stalePriceWarningContract.warningSource}</code> and marks stale entries for {stalePriceWarningContract.channel} delivery after {stalePriceWarningContract.staleAfterHours} hours without verified grocery price evidence.
            </p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-white p-4">
            <p className="text-sm font-black text-slate-950">Reliability guardrails</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {stalePriceWarningContract.guardrails.map((guardrail) => (
                <li className="rounded-lg bg-amber-50 p-3" key={guardrail}>{guardrail}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-rose-200 bg-rose-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>Account deletion</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Deletion plan requires owner confirmation</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              The page now uses <code className="rounded bg-white/80 px-1 py-0.5 text-rose-900">planAccountDeletion</code> from <code className="rounded bg-white/80 px-1 py-0.5 text-rose-900">@groceryview/core</code> for the signed-in shopper deletion preview. It only presents the plan and confirmation gates; the destructive delete is still blocked until the account owner reauthenticates and completes the final typed confirmation.
            </p>
          </div>
          <ConfidenceBadge level="high" label="Destructive action gated" sampleSize={accountDeletionPlan.deleteFromTables.length + accountDeletionPlan.anonymizeTables.length} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-lg border border-rose-100 bg-white p-4">
            <p className="text-sm font-black text-slate-950">Core deletion plan</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{accountDeletionPlan.reason}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">Delete records from</p>
                <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-700">
                  {accountDeletionPlan.deleteFromTables.map((table) => <li key={table}>{table}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">Anonymize records in</p>
                <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-700">
                  {accountDeletionPlan.anonymizeTables.map((table) => <li key={table}>{table}</li>)}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-rose-100 bg-white p-4">
            <p className="text-sm font-black text-slate-950">Required confirmations</p>
            <ol className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {accountDeletionConfirmations.map((confirmation) => (
                <li className="rounded-lg bg-rose-50 p-3" key={confirmation}>{confirmation}</li>
              ))}
            </ol>
          </div>
        </div>
      </Card>

      <AccountMutationActions />
      <AccountBillingActions />
      <AdDisclosureActions />

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <Eyebrow>Favorite stores</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Account routes, not anonymous preferences</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            The favorite stores surface is intentionally described as account-only: a production session supplies the userId, the selected store must come from verified GroceryView store records, and favorite stores can then drive watchlists, nearby comparisons, recurring digests, and basket trip-cost ranking.
          </p>
        </Card>
        <Card>
          <Eyebrow>Saved weekly baskets</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">weekly_baskets + basket_items</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Saved templates stay in weekly_baskets while each product quantity stays in basket_items. This keeps the account record auditable, lets the server recompute prices from verified product rows, and avoids showing private basket lines in the static public snapshot.
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
