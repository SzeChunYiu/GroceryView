'use client';

import { FormEvent, useState } from 'react';

type HouseholdStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

function householdPayload(userId: string, weeklyBudget: number, approvalLimit: number, householdName: string) {
  return {
    householdId: `${userId}:primary-household`,
    name: householdName,
    weeklyBudget,
    approvalLimit,
    reviewer: userId,
    members: [{ userId, displayName: 'Signed-in shopper' }],
    basketItems: [],
    watchlistItems: [],
    sharedFavoriteStoreIds: []
  };
}

export function HouseholdPlanActions() {
  const [householdName, setHouseholdName] = useState('My grocery household');
  const [weeklyBudget, setWeeklyBudget] = useState('1200');
  const [approvalLimit, setApprovalLimit] = useState('300');
  const [inviteToken, setInviteToken] = useState('');
  const [joinHouseholdId, setJoinHouseholdId] = useState('');
  const [checkedProductId, setCheckedProductId] = useState('');
  const [status, setStatus] = useState<HouseholdStatus>('idle');
  const [message, setMessage] = useState('No anonymous household writes. Sign in first to load or save private household planning rows.');

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous household writes are sent to protected account endpoints.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  async function handleResponse(response: Response, successMessage: string) {
    if (!response.ok) {
      setStatus('error');
      setMessage('Household plan request was rejected by the production API.');
      return;
    }
    setStatus('ready');
    setMessage(successMessage);
  }

  async function loadHouseholdPlan() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/households/current?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    await handleResponse(response, 'Signed-in household plan loaded when one exists; missing plans remain hidden.');
  }

  async function saveHouseholdPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/households/current?userId=${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(householdPayload(userId, Number(weeklyBudget), Number(approvalLimit), householdName))
    });
    await handleResponse(response, 'Household plan saved for the signed-in account with private rows still hidden from the static snapshot.');
  }

  async function joinHousehold() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/households/join?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        householdId: joinHouseholdId,
        inviteToken,
        displayName: 'Signed-in shopper',
        role: 'editor'
      })
    });
    await handleResponse(response, 'Invite accepted only after the signed-in account joins as a household editor.');
  }

  async function checkBasketItem() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/households/current/basket/check?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        productId: checkedProductId,
        checked: true,
        checkedAt: new Date().toISOString()
      })
    });
    await handleResponse(response, 'Shopping-list item checkedBy the signed-in household member and totals re-synced.');
  }

  return (
    <section className="mt-6 rounded-3xl border border-violet-200 bg-white p-5 shadow-sm" aria-label="Household plan controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Signed-in household actions</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Private household budget and approval plan</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls use the sessionStorage token from the production session exchange. GroceryView keeps names, household members, baskets, watchlists, and favorite-store links private unless the signed-in API returns verified account rows.
      </p>
      <form className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3" onSubmit={saveHouseholdPlan}>
        <label className="text-sm font-black text-slate-950" htmlFor="household-name">
          Household name
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="household-name"
            onChange={(event) => setHouseholdName(event.target.value)}
            value={householdName}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="household-weekly-budget">
          weeklyBudget
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="household-weekly-budget"
            min="1"
            onChange={(event) => setWeeklyBudget(event.target.value)}
            type="number"
            value={weeklyBudget}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="household-approval-limit">
          approvalLimit
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="household-approval-limit"
            min="1"
            onChange={(event) => setApprovalLimit(event.target.value)}
            type="number"
            value={approvalLimit}
          />
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" onClick={loadHouseholdPlan} type="button">Load signed-in household</button>
          <button className="rounded-full bg-violet-800 px-4 py-2 text-sm font-black text-white" disabled={!householdName.trim() || Number(weeklyBudget) <= 0 || Number(approvalLimit) <= 0} type="submit">Save household plan</button>
        </div>
      </form>
      <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <label className="text-sm font-black text-slate-950" htmlFor="household-join-id">
          householdId to join
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="household-join-id"
            onChange={(event) => setJoinHouseholdId(event.target.value)}
            value={joinHouseholdId}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="household-invite-token">
          inviteToken
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="household-invite-token"
            onChange={(event) => setInviteToken(event.target.value)}
            value={inviteToken}
          />
        </label>
        <div className="flex items-end">
          <button className="rounded-full bg-indigo-700 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300" disabled={!joinHouseholdId.trim() || !inviteToken.trim()} onClick={joinHousehold} type="button">Join household</button>
        </div>
        <label className="text-sm font-black text-slate-950 md:col-span-2" htmlFor="household-check-product">
          Product id to check
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="household-check-product"
            onChange={(event) => setCheckedProductId(event.target.value)}
            value={checkedProductId}
          />
        </label>
        <div className="flex items-end">
          <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300" disabled={!checkedProductId.trim()} onClick={checkBasketItem} type="button">Check shared item</button>
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-950" data-status={status}>{message}</p>
    </section>
  );
}
