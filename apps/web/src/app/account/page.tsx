import { AccountBillingActions } from '@/components/account-billing-actions';
import { AccountMutationActions } from '@/components/account-mutation-actions';
import { AdDisclosureActions } from '@/components/ad-disclosure-actions';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { DietaryProfileOnboarding } from '@/components/diet-filter-picker';
import { listShareRoles, accountListSharePermissions } from '@/lib/list-permissions';
import { dietaryPreferenceOnboardingContract, demoPreferredBrandControls, groupPreferredBrandControls, savedSearchesStorageKey } from '@/lib/personalization';
import { buildPremiumSavingsForecast } from '@/lib/price-intelligence';
import { routeMetadata } from '@/lib/seo';
import { accountSavedShoppingContract, formatSek, savedBasketAutoReorderPlanner } from '@/lib/verified-data';
import { planAccountDeletion } from '@groceryview/core';

const notificationSubscriptionEndpoint = '/api/notifications/subscription';
const alertPreferencesEndpoint = '/api/alerts/preferences';
const notificationVapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const notificationChannelPreferences = ['price-drop-alerts', 'basket-reminders'];
const adaptiveAlertPreferences = {
  accountId: 'signed-in-user',
  cadenceOptions: [
    { value: 'immediate', label: 'Immediate', detail: 'Direct alerts with per-product dedupe.' },
    { value: 'daily_digest', label: 'Daily digest', detail: 'One planning bundle for noisy price movement.' },
    { value: 'weekly_digest', label: 'Weekly digest', detail: 'Aligned with flyer and basket planning cadence.' },
    { value: 'paused', label: 'Paused', detail: 'Keep the profile but suppress delivery.' }
  ],
  channels: [
    { value: 'email', label: 'Email' },
    { value: 'push', label: 'Push' },
    { value: 'in_app_digest', label: 'In-app digest' }
  ],
  sensitivityOptions: [
    { value: 'low', label: 'Low', detail: 'Only high-confidence drops and restock signals.' },
    { value: 'standard', label: 'Standard', detail: 'Balanced thresholds for weekly grocery planning.' },
    { value: 'high', label: 'High', detail: 'More responsive alerts for active watchlists.' }
  ]
};
const notificationSubscriptionScript = `(() => {
  const root = document.querySelector('[data-push-preferences]');
  if (!root) return;

  const endpoint = root.getAttribute('data-subscription-endpoint');
  const vapidPublicKey = root.getAttribute('data-vapid-public-key') || '';
  const accountId = root.getAttribute('data-account-id') || 'signed-in-user';
  const channels = (root.getAttribute('data-channels') || '').split(',').filter(Boolean);
  const status = root.querySelector('[data-push-status]');
  const token = root.querySelector('[data-push-token]');
  const enable = root.querySelector('[data-push-enable]');
  const disable = root.querySelector('[data-push-disable]');

  const setStatus = (message, tokenId) => {
    if (status) status.textContent = message;
    if (token) token.textContent = tokenId ? 'Active token: ' + tokenId : 'No active push token saved for this account.';
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from(Array.from(rawData).map((character) => character.charCodeAt(0)));
  };

  const saveConsent = async (payload) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId, channels, ...payload })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Unable to save push notification consent.');
    return body;
  };

  const getSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const registration = await navigator.serviceWorker.getRegistration('/');
    return registration ? registration.pushManager.getSubscription() : null;
  };

  const refreshState = async () => {
    if (!('Notification' in window)) {
      setStatus('This browser does not expose notification permissions.');
      return;
    }
    const subscription = await getSubscription();
    if (Notification.permission === 'granted' && subscription) {
      setStatus('Push notifications are enabled for this browser.', 'browser-managed');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('Notifications are blocked in this browser. Update browser settings to enable GroceryView alerts.');
      return;
    }
    setStatus('Notifications are not enabled yet. You can grant account-level consent below.');
  };

  enable?.addEventListener('click', async () => {
    enable.setAttribute('disabled', 'true');
    try {
      if (!('Notification' in window)) {
        const body = await saveConsent({ permission: 'unsupported', subscription: null, deliveryEnabled: false });
        setStatus('This browser cannot receive web push notifications.', body.tokenId);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        const body = await saveConsent({ permission, subscription: null, deliveryEnabled: false });
        setStatus('Notification consent was not granted, so no delivery token was stored.', body.tokenId);
        return;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !vapidPublicKey) {
        const body = await saveConsent({ permission, subscription: null, deliveryEnabled: false });
        setStatus('Consent saved. Delivery waits for service worker and VAPID configuration.', body.tokenId);
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        const body = await saveConsent({ permission, subscription: null, deliveryEnabled: false });
        setStatus('Consent saved. Delivery waits for the GroceryView service worker.', body.tokenId);
        return;
      }

      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      const body = await saveConsent({ permission, subscription: subscription.toJSON(), deliveryEnabled: true });
      setStatus('Push notifications are enabled for price drops and basket reminders.', body.tokenId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to enable push notifications.');
    } finally {
      enable.removeAttribute('disabled');
    }
  });

  disable?.addEventListener('click', async () => {
    disable.setAttribute('disabled', 'true');
    try {
      const subscription = await getSubscription();
      if (subscription) await subscription.unsubscribe();
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId, endpoint: subscription?.endpoint })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to remove push notification token.');
      setStatus('Push notifications are disabled for this account.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to disable push notifications.');
    } finally {
      disable.removeAttribute('disabled');
    }
  });

  refreshState();
})();`;

const premiumSavingsForecast = buildPremiumSavingsForecast();
const accountDeletionPlan = planAccountDeletion('signed-in-user');
const accountDeletionConfirmations = [
  'Confirm the active session belongs to the account owner.',
  'Review every account-owned table scheduled for deletion.',
  'Acknowledge that receipt, basket, watchlist, and preference history cannot be restored after execution.',
  'Type DELETE ACCOUNT before the destructive job can be queued.'
];
const bestTimeToBuyAlertRules = [
  { label: 'Favorite ICA + dairy', stores: ['ICA Nära', 'ICA Maxi'], categories: ['Dairy', 'Breakfast'], confidence: 0.82 },
  { label: 'Discount stores + pantry', stores: ['Willys', 'Lidl'], categories: ['Pantry', 'Frozen'], confidence: 0.78 },
  { label: 'Weekend produce watch', stores: ['Coop', 'Hemköp'], categories: ['Produce'], confidence: 0.74 }
];
const preferredBrandControlGroups = groupPreferredBrandControls();

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


      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>List sharing permissions</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">View-only, edit, and instant revoke controls</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Household lists can now be shared with explicit <code className="rounded bg-white/80 px-1 py-0.5 text-indigo-900">view</code> or <code className="rounded bg-white/80 px-1 py-0.5 text-indigo-900">edit</code> roles through <code className="rounded bg-white/80 px-1 py-0.5 text-indigo-900">/api/list/permissions</code>, and account settings expose a one-click revoke action for every active collaborator.
            </p>
          </div>
          <ConfidenceBadge level="high" label="Revocation available" sampleSize={accountListSharePermissions.length} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {Object.entries(listShareRoles).map(([role, config]) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={role}>
              <p className="text-sm font-black text-indigo-950">{config.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{config.description}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
                {config.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3">
          {accountListSharePermissions.map((permission) => (
            <form action="/api/list/permissions" className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" key={permission.id} method="post">
              <input name="action" type="hidden" value="revoke" />
              <input name="shareId" type="hidden" value={permission.id} />
              <div>
                <p className="font-black text-slate-950">{permission.listName} · {permission.collaboratorName}</p>
                <p className="mt-1 text-sm text-slate-600">{permission.collaboratorEmail} has {listShareRoles[permission.role].label.toLowerCase()} access.</p>
              </div>
              <button className="rounded-full bg-indigo-950 px-4 py-2 text-sm font-black text-white" type="submit">Revoke now</button>
            </form>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <Eyebrow>Purchase history import</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Seed recommendations from receipt CSVs</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          Paste loyalty or receipt exports with date, product, store, quantity, and total columns. GroceryView maps rows to known products, summarizes historical spend, and identifies recurring purchases before saving account recommendations.
        </p>
        <BulkImportDialog importMode="purchase-history" />
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Saved grocery searches</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Pinned header searches stay explicit</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          The header SearchBar stores recent searches locally and lets signed-in shoppers pin weekly grocery checks into <code className="rounded bg-white/80 px-1 py-0.5 text-violet-900">{savedSearchesStorageKey}</code>. Saved searches are user-triggered shortcuts, not inferred browsing profiles.
        </p>
      </Card>

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

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-800">Dietary onboarding</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Tell GroceryView which foods should be filtered first</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              New account setup now includes vegetarian, vegan, halal, and allergen preferences before search, recommendations, alerts, and weekly basket suggestions are personalized. The profile step keeps these preferences explicit so downstream features can filter products without inferring dietary needs from shopping history.
            </p>
            <ul className="mt-3 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
              {dietaryPreferenceOnboardingContract.guardrails.map((guardrail) => (
                <li className="rounded-2xl bg-white/80 p-3" key={guardrail}>{guardrail}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.5rem] border border-lime-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-slate-950">Profile preferences captured during onboarding</p>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
              {[
                ...dietaryPreferenceOnboardingContract.dietaryRestrictions,
                ...dietaryPreferenceOnboardingContract.avoidedIngredients,
                ...dietaryPreferenceOnboardingContract.certificationPreferences
              ].map((preference) => (
                <label className="flex items-start gap-2 rounded-2xl bg-lime-50 p-3" key={preference.value}>
                  <input aria-label={preference.label} className="mt-1 h-4 w-4 accent-lime-700" type="checkbox" />
                  <span>
                    <span className="block font-black text-slate-950">{preference.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{preference.helper}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-lime-900">
              Used by {dietaryPreferenceOnboardingContract.personalizationSurfaces.join(', ')}
            </p>
          </div>
        </div>
        <DietaryProfileOnboarding className="mt-4 border-lime-100" />
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">Brand personalization</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Preferred and avoided brands stay explicit</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Account settings now expose brand controls used by search ranking, recommendation rails, and substitution scoring. Favorite brands get a positive ranking signal while avoided brands are pushed down instead of being inferred from browsing history.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Preferred</span>
                <span className="mt-1 block text-3xl font-black text-fuchsia-900">{preferredBrandControlGroups.favorite.length}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Allowed</span>
                <span className="mt-1 block text-3xl font-black text-slate-950">{preferredBrandControlGroups.acceptable.length}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Avoided</span>
                <span className="mt-1 block text-3xl font-black text-rose-900">{preferredBrandControlGroups.excluded.length}</span>
              </p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-fuchsia-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-slate-950">Choose brand treatment</p>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
              {demoPreferredBrandControls.map((control) => (
                <label className="flex items-start gap-3 rounded-2xl bg-fuchsia-50 p-3" key={control.brand}>
                  <input
                    aria-label={`${control.brand} ${control.tolerance}`}
                    checked={control.tolerance !== 'acceptable'}
                    className="mt-1 h-4 w-4 accent-fuchsia-700"
                    readOnly
                    type="checkbox"
                  />
                  <span>
                    <span className="block font-black text-slate-950">{control.brand}</span>
                    <span className="mt-1 block text-xs font-black uppercase tracking-[0.14em] text-fuchsia-900">{control.tolerance}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{control.note}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-fuchsia-950">
              Stored preferences remain account-owned and are applied before automatic product substitutions can be suggested.
            </p>
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
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Best-time-to-buy alerts</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Target stores, categories, and confidence</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Signed-in shoppers can define notification rules through <code className="rounded bg-white/80 px-1 py-0.5 text-amber-900">/api/alerts/best-time</code>. Each rule requires target stores, watched categories, and a confidence threshold before a price-drop window can trigger an alert.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-slate-950">Default confidence guardrail</p>
            <p className="mt-2 text-3xl font-black text-amber-900">75%</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">Rules can raise or lower the threshold between 50% and 99% confidence.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {bestTimeToBuyAlertRules.map((rule) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={rule.label}>
              <p className="font-black text-slate-950">{rule.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">Stores: {rule.stores.join(', ')}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Categories: {rule.categories.join(', ')}</p>
              <p className="mt-3 rounded-full bg-amber-100 px-3 py-2 text-xs font-black text-amber-950">Notify at {(rule.confidence * 100).toFixed(0)}% confidence</p>
            </div>
          ))}
        </div>
        <form action="/api/alerts/best-time" className="mt-4 grid gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr_auto]" method="post">
          <input name="accountId" type="hidden" value="signed-in-user" />
          <label className="text-sm font-black text-slate-800" htmlFor="best-time-target-stores">
            Target stores
            <input
              className="mt-1 block w-full rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-slate-900"
              defaultValue="Willys, Lidl"
              id="best-time-target-stores"
              name="targetStores"
              required
            />
          </label>
          <label className="text-sm font-black text-slate-800" htmlFor="best-time-categories">
            Watched categories
            <input
              className="mt-1 block w-full rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-slate-900"
              defaultValue="Pantry, Frozen"
              id="best-time-categories"
              name="categories"
              required
            />
          </label>
          <label className="text-sm font-black text-slate-800" htmlFor="best-time-confidence-threshold">
            Confidence threshold
            <input
              className="mt-1 block w-full rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-slate-900"
              defaultValue="0.78"
              id="best-time-confidence-threshold"
              max="0.99"
              min="0.5"
              name="confidenceThreshold"
              step="0.01"
              type="number"
            />
          </label>
          <button className="rounded-full bg-amber-900 px-5 py-3 text-sm font-black text-white lg:col-start-3" type="submit">
            Save best-time rule
          </button>
          <p className="text-xs font-bold leading-5 text-amber-950 lg:col-span-2">
            The API accepts comma-separated stores and categories from this form, or JSON with product price history when clients want an immediate buy-now/wait recommendation preview.
          </p>
        </form>
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

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>Adaptive alert preferences</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Cadence, channel, and sensitivity profile</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Signed-in shoppers can store a delivery profile at <code className="rounded bg-white/80 px-1 py-0.5 text-cyan-900">{alertPreferencesEndpoint}</code>. The profile lets alert jobs cap daily interruptions, route delivery through selected channels, and raise confidence thresholds when the shopper chooses a quieter sensitivity.
            </p>
          </div>
          <ConfidenceBadge level="high" label="Over-notification guardrails" sampleSize={adaptiveAlertPreferences.cadenceOptions.length + adaptiveAlertPreferences.channels.length + adaptiveAlertPreferences.sensitivityOptions.length} />
        </div>
        <form action={alertPreferencesEndpoint} className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr]" method="post">
          <input name="accountId" type="hidden" value={adaptiveAlertPreferences.accountId} />
          <fieldset className="rounded-lg border border-cyan-100 bg-white p-4">
            <legend className="text-sm font-black text-slate-950">Cadence</legend>
            <div className="mt-3 grid gap-2">
              {adaptiveAlertPreferences.cadenceOptions.map((option) => (
                <label className="rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-slate-700" key={option.value}>
                  <input className="mr-2" defaultChecked={option.value === 'daily_digest'} name="cadence" type="radio" value={option.value} />
                  <span className="font-black text-slate-950">{option.label}</span>
                  <span className="mt-1 block">{option.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-cyan-100 bg-white p-4">
            <legend className="text-sm font-black text-slate-950">Channels</legend>
            <div className="mt-3 grid gap-2">
              {adaptiveAlertPreferences.channels.map((channel) => (
                <label className="rounded-lg bg-cyan-50 p-3 text-sm font-black text-slate-800" key={channel.value}>
                  <input className="mr-2" defaultChecked={channel.value !== 'push'} name="channels" type="checkbox" value={channel.value} />
                  {channel.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-cyan-100 bg-white p-4">
            <legend className="text-sm font-black text-slate-950">Sensitivity</legend>
            <div className="mt-3 grid gap-2">
              {adaptiveAlertPreferences.sensitivityOptions.map((option) => (
                <label className="rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-slate-700" key={option.value}>
                  <input className="mr-2" defaultChecked={option.value === 'standard'} name="sensitivity" type="radio" value={option.value} />
                  <span className="font-black text-slate-950">{option.label}</span>
                  <span className="mt-1 block">{option.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="lg:col-span-3">
            <button className="rounded-full bg-cyan-950 px-5 py-2.5 text-sm font-black text-white shadow-sm" type="submit">Save alert profile</button>
            <p className="mt-3 text-xs font-bold text-cyan-950">The API returns the persisted profile with derived maxDailyAlerts and minimumConfidence guardrails.</p>
          </div>
        </form>
      </Card>

      <Card
        className="mt-6 border-indigo-200 bg-indigo-50"
        data-account-id="signed-in-user"
        data-channels={notificationChannelPreferences.join(',')}
        data-push-preferences
        data-subscription-endpoint={notificationSubscriptionEndpoint}
        data-vapid-public-key={notificationVapidPublicKey}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>Push notification consent</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Price and reminder alerts need account-level consent</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              GroceryView only stores a browser push token after the signed-in shopper grants notification permission. Tokens are scoped to this account, can be removed from this page, and are limited to price-drop alerts and saved-basket reminders.
            </p>
          </div>
          <ConfidenceBadge level="high" label="Consent required" sampleSize={notificationChannelPreferences.length} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-lg border border-indigo-100 bg-white p-4">
            <p className="text-sm font-black text-slate-950">Subscription flow</p>
            <p className="mt-2 text-sm leading-6 text-slate-700" data-push-status>
              Notifications are not enabled yet. You can grant account-level consent below.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-full bg-indigo-900 px-4 py-2 text-sm font-black text-white shadow-sm" data-push-enable type="button">
                Enable push alerts
              </button>
              <button className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-black text-indigo-900 shadow-sm" data-push-disable type="button">
                Disable alerts
              </button>
            </div>
            <p className="mt-3 text-xs font-bold text-indigo-950" data-push-token>No active push token saved for this account.</p>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-white p-4">
            <p className="text-sm font-black text-slate-950">Token safeguards</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              <li className="rounded-lg bg-indigo-50 p-3">Permission is requested in the browser before any token is sent to GroceryView.</li>
              <li className="rounded-lg bg-indigo-50 p-3">The subscription endpoint stores one account-scoped token per signed-in shopper.</li>
              <li className="rounded-lg bg-indigo-50 p-3">Disabling alerts unsubscribes the browser and removes the saved account token.</li>
            </ul>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: notificationSubscriptionScript }} />
      </Card>

      <AccountMutationActions />
      <p className="mt-6 rounded-2xl bg-violet-50 p-4 text-sm font-bold text-violet-950">
        Premium forecast preview: {premiumSavingsForecast.monthlySavingsLabel} estimated monthly savings before checkout. Review the <a className="underline decoration-2 underline-offset-4" href="/pricing#premium-ocr-history">Premium OCR history plan</a> before opening checkout.
      </p>
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
