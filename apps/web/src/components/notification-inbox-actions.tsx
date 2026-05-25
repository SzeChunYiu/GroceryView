'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { defaultPushNotificationPreferences, type PushNotificationPreferenceKey, type PushNotificationPreferences } from '@/lib/alert-scheduler';

type NotificationInboxStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BestTimeRuleStatus = 'idle' | 'blocked' | 'saving' | 'saved' | 'error';
type AlertChannel = 'push' | 'email';
type NotificationInboxQueueItem = {
  id: string;
  title: string;
  channel: 'push' | 'email';
  status: 'delivered' | 'held' | 'suppressed';
  reason: string;
  action: string;
  priority: 'normal' | 'high';
  productId?: string;
};
type NotificationInboxReport = {
  trackedItemCount: number;
  activeAlertCount: number;
  deliveredCount: number;
  heldCount: number;
  suppressedCount: number;
  quietHoursWindow: string;
  guardrails: string[];
  queue: NotificationInboxQueueItem[];
  deliveryGuardrails?: string[];
};
type BrowserSession = { accessToken: string; userId: string };
type BestTimeToBuyRuleRequest = {
  userId: string;
  storeId: string;
  categoryId: string;
  channel: AlertChannel;
  alertType: 'best_time_to_buy';
  minimumConfidence: number;
};

const BEST_TIME_STORES = [
  { id: 'willys-odenplan', label: 'Willys Odenplan' },
  { id: 'ica-kvantum-kungsholmen', label: 'ICA Kvantum Kungsholmen' },
  { id: 'coop-medborgarplatsen', label: 'Coop Medborgarplatsen' },
  { id: 'lidl-folkungagatan', label: 'Lidl Folkungagatan' }
] as const;

const BEST_TIME_CATEGORIES = [
  { id: 'coffee', label: 'Coffee & breakfast' },
  { id: 'dairy', label: 'Dairy staples' },
  { id: 'baby_diapers', label: 'Baby & diapers' },
  { id: 'fresh_produce', label: 'Fresh produce' }
] as const;

const PUSH_NOTIFICATION_PREFERENCES: { key: PushNotificationPreferenceKey; label: string; description: string }[] = [
  { key: 'priceDrops', label: 'Price drops', description: 'Push when a watched item or saved search gets a verified lower price.' },
  { key: 'stockChanges', label: 'Stock changes', description: 'Push when unavailable basket staples return to stock.' },
  { key: 'listCollaboration', label: 'List collaboration', description: 'Push when household members add, claim, or complete shared list items.' },
  { key: 'budgetWarnings', label: 'Budget warnings', description: 'Push before baskets or recurring shops cross a weekly budget limit.' }
];

function readSession(): BrowserSession {
  if (typeof window === 'undefined') return { accessToken: '', userId: '' };
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function PushNotificationPreferenceControls() {
  const [preferences, setPreferences] = useState<PushNotificationPreferences>(defaultPushNotificationPreferences);
  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <section className="mt-4 rounded-3xl border border-indigo-200 bg-white/85 p-5" aria-label="Push notification preference controls">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">Push notification preferences</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Choose which high-value mobile alerts can interrupt you</h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Granular toggles keep price drops, stock changes, list collaboration, and budget warnings independently controllable before notification delivery.
          </p>
        </div>
        <p className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-black text-indigo-900">{enabledCount}/4 enabled</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {PUSH_NOTIFICATION_PREFERENCES.map((preference) => (
          <label className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4" key={preference.key}>
            <input
              checked={preferences[preference.key]}
              className="mt-1 h-5 w-5 accent-indigo-700"
              onChange={(event) => setPreferences((current) => ({ ...current, [preference.key]: event.target.checked }))}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-black text-slate-950">{preference.label}</span>
              <span className="mt-1 block text-sm font-semibold leading-6 text-slate-700">{preference.description}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

export function NotificationInboxActions() {
  const [status, setStatus] = useState<NotificationInboxStatus>('idle');
  const [report, setReport] = useState<NotificationInboxReport | null>(null);
  const [message, setMessage] = useState('No anonymous notification inbox. Sign in first to load delivery state, quiet-hour holds, and suppressions.');
  const [bestTimeStatus, setBestTimeStatus] = useState<BestTimeRuleStatus>('idle');
  const [bestTimeMessage, setBestTimeMessage] = useState('Choose a store, category, channel, and confidence floor before saving a best-time-to-buy rule.');
  const [storeId, setStoreId] = useState<string>(BEST_TIME_STORES[0].id);
  const [categoryId, setCategoryId] = useState<string>(BEST_TIME_CATEGORIES[0].id);
  const [channel, setChannel] = useState<AlertChannel>('push');
  const [minimumConfidence, setMinimumConfidence] = useState('0.70');
  const contractPreview = useMemo<BestTimeToBuyRuleRequest>(() => ({
    userId: readSession().userId || 'signed-in-user-id',
    storeId,
    categoryId,
    channel,
    alertType: 'best_time_to_buy',
    minimumConfidence: Number(minimumConfidence)
  }), [categoryId, channel, minimumConfidence, storeId]);

  async function loadInbox() {
    const { accessToken, userId } = readSession();
    if (!accessToken || !userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous notification inbox delivery state is loaded.');
      return;
    }

    setStatus('loading');
    const response = await fetch(`/api/notifications/inbox?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Notification inbox was rejected by the production API.');
      return;
    }

    const body = (await response.json()) as NotificationInboxReport;
    setReport({ ...body, deliveryGuardrails: body.guardrails });
    setStatus('ready');
    setMessage(`Loaded notification inbox with ${body.deliveredCount} delivered, ${body.heldCount} quiet-hour holds, and ${body.suppressedCount} suppression rows.`);
  }

  async function saveBestTimeToBuyRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { accessToken, userId } = readSession();
    const confidence = Number(minimumConfidence);
    if (!accessToken || !userId) {
      setBestTimeStatus('blocked');
      setBestTimeMessage('Sign in first. Best-time-to-buy alert rules are account-bound and are not written anonymously.');
      return;
    }
    if (!storeId || !categoryId || !channel || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      setBestTimeStatus('blocked');
      setBestTimeMessage('Pick a target store, category, delivery channel, and a minimum confidence between 0 and 1.');
      return;
    }

    const payload: BestTimeToBuyRuleRequest = {
      userId,
      storeId,
      categoryId,
      channel,
      alertType: 'best_time_to_buy',
      minimumConfidence: confidence
    };

    setBestTimeStatus('saving');
    const response = await fetch('/api/notification-alert-rules', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      setBestTimeStatus('error');
      setBestTimeMessage('The alert-rule API rejected the best-time-to-buy rule.');
      return;
    }

    setBestTimeStatus('saved');
    setBestTimeMessage(`Saved best-time-to-buy ${channel} rule for ${categoryId} at ${storeId} with minimumConfidence ${confidence.toFixed(2)}.`);
  }

  return (
    <section className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-5" aria-label="Notification inbox controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Signed-in notification inbox</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Delivery state, quiet-hour holds, and suppressions</h2>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        These controls call the protected notification inbox endpoint with the sessionStorage bearer token. Delivery state stays account-bound, quiet-hour holds remain explicit, and provider suppression rows require device or email refresh before future sends resume.
      </p>
      <button className="mt-4 rounded-full bg-cyan-800 px-4 py-2 text-sm font-black text-white" onClick={loadInbox} type="button">Load notification inbox</button>
      <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-cyan-950" data-status={status}>{message}</p>

      {report ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">deliveryGuardrails</p>
            <p className="mt-2 text-3xl font-black text-cyan-900">{report.trackedItemCount} tracked</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{report.activeAlertCount} active alerts · quiet hours {report.quietHoursWindow}</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{report.deliveredCount} delivered · {report.heldCount} held · {report.suppressedCount} suppression rows</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {(report.deliveryGuardrails ?? report.guardrails).map((guardrail) => <li key={guardrail}>• {guardrail}</li>)}
            </ul>
          </div>
          <div className="space-y-3">
            {report.queue.map((item) => (
              <div className="rounded-2xl bg-white p-4 shadow-sm" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{item.channel} · {item.priority} · {item.reason}</p>
                  </div>
                  <p className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-900">{item.status}</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">Action: {item.action}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-950 bg-slate-950 text-white shadow-xl" aria-label="Best time to buy alert rule controls">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative p-5">
            <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-emerald-400/30 blur-2xl" aria-hidden="true" />
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Best time to buy</p>
            <h3 className="mt-2 max-w-sm text-3xl font-black tracking-tight">Create store/category timing rules before prices move.</h3>
            <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-slate-300">
              This form submits the explicit API contract for rule creation: storeId, categoryId, channel, alertType=best_time_to_buy, and minimumConfidence.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs font-bold leading-5 text-emerald-100">
              {JSON.stringify(contractPreview, null, 2)}
            </pre>
          </div>

          <form className="grid gap-4 bg-white p-5 text-slate-950 md:grid-cols-2" onSubmit={saveBestTimeToBuyRule}>
            <label className="text-sm font-black" htmlFor="best-time-store">
              Target store
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
                id="best-time-store"
                onChange={(event) => setStoreId(event.target.value)}
                value={storeId}
              >
                {BEST_TIME_STORES.map((store) => <option key={store.id} value={store.id}>{store.label}</option>)}
              </select>
            </label>

            <label className="text-sm font-black" htmlFor="best-time-category">
              Category
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
                id="best-time-category"
                onChange={(event) => setCategoryId(event.target.value)}
                value={categoryId}
              >
                {BEST_TIME_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </label>

            <fieldset className="rounded-2xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-black">Channel</legend>
              <div className="mt-2 flex gap-2">
                {(['push', 'email'] as const).map((option) => (
                  <label className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-black ${channel === option ? 'bg-cyan-900 text-white' : 'bg-slate-100 text-slate-700'}`} key={option}>
                    <input
                      checked={channel === option}
                      className="sr-only"
                      name="best-time-channel"
                      onChange={() => setChannel(option)}
                      type="radio"
                      value={option}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="text-sm font-black" htmlFor="best-time-confidence">
              Minimum confidence
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
                id="best-time-confidence"
                max="1"
                min="0"
                onChange={(event) => setMinimumConfidence(event.target.value)}
                step="0.05"
                type="number"
                value={minimumConfidence}
              />
            </label>

            <div className="md:col-span-2">
              <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white" type="submit">Save best-time-to-buy rule</button>
              <p className="mt-3 rounded-2xl bg-cyan-50 p-3 text-sm font-bold text-cyan-950" data-status={bestTimeStatus}>{bestTimeMessage}</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
