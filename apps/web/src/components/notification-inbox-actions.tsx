'use client';

import { useState } from 'react';

type NotificationInboxStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
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

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function NotificationInboxActions() {
  const [status, setStatus] = useState<NotificationInboxStatus>('idle');
  const [report, setReport] = useState<NotificationInboxReport | null>(null);
  const [message, setMessage] = useState('No anonymous notification inbox. Sign in first to load delivery state, quiet-hour holds, and suppressions.');

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
    </section>
  );
}
