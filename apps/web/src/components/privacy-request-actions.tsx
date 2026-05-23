'use client';

import { useState } from 'react';

type PrivacyAction = 'export' | 'deletion-plan' | 'fulfillment';
type PrivacyStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

function privacyRequests(userId: string) {
  const receivedAt = new Date().toISOString();
  return [
    { id: `${userId}:data-export`, userId, type: 'data_export', receivedAt, status: 'received' },
    { id: `${userId}:account-deletion`, userId, type: 'account_deletion', receivedAt, status: 'received' },
    { id: `${userId}:ad-opt-out`, userId, type: 'ad_data_opt_out', receivedAt, status: 'received' }
  ];
}

export function PrivacyRequestActions() {
  const [status, setStatus] = useState<PrivacyStatus>('idle');
  const [activeAction, setActiveAction] = useState<PrivacyAction | null>(null);
  const [message, setMessage] = useState('No anonymous privacy requests. Sign in first to export data, plan deletion, or classify privacy deadlines.');

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous privacy requests are sent to protected account endpoints.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  async function handleResponse(response: Response, successMessage: string) {
    if (!response.ok) {
      setStatus('error');
      setMessage('Privacy request was rejected by the production API.');
      return;
    }
    setStatus('ready');
    setMessage(successMessage);
  }

  async function requestExport() {
    setActiveAction('export');
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/privacy/export?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    await handleResponse(response, 'Privacy export prepared for the signed-in account.');
  }

  async function requestDeletionPlan() {
    setActiveAction('deletion-plan');
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/privacy/deletion-plan?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    await handleResponse(response, 'Deletion plan prepared with destructiveAction: false and reauthentication required.');
  }

  async function requestFulfillmentPlan() {
    setActiveAction('fulfillment');
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/privacy/request-fulfillment?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ slaDays: 30, alertBeforeDays: 5, requests: privacyRequests(userId) })
    });
    await handleResponse(response, 'Privacy fulfillment deadlines classified for data_export, account_deletion, and ad_data_opt_out.');
  }

  return (
    <section className="mt-6 rounded-3xl border border-sky-200 bg-white p-5 shadow-sm" aria-label="Privacy request controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Signed-in privacy controls</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Export, deletion planning, and ad data opt-out deadlines</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls use the sessionStorage token created by the production session exchange. The public snapshot keeps private records hidden, and every action fails closed until a signed-in account session is available.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-sky-800 px-4 py-2 text-sm font-black text-white" onClick={requestExport} type="button">Prepare data export</button>
        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" onClick={requestDeletionPlan} type="button">Plan account deletion</button>
        <button className="rounded-full border border-sky-700 px-4 py-2 text-sm font-black text-sky-900" onClick={requestFulfillmentPlan} type="button">Classify privacy request deadlines</button>
      </div>
      <p className="mt-4 rounded-2xl bg-sky-50 p-3 text-sm font-bold text-sky-950" data-active-action={activeAction ?? 'none'} data-status={status}>{message}</p>
    </section>
  );
}
