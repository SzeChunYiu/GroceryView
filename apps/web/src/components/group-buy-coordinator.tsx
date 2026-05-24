'use client';

import { type FormEvent, useMemo, useState } from 'react';

const unlockHouseholdThreshold = 3;
const ownerHouseholdLabel = 'Your household';

function normalizeHousehold(value: string) {
  return value.trim().toLowerCase();
}

export function GroupBuyCoordinator() {
  const [isCreated, setIsCreated] = useState(false);
  const [householdEmail, setHouseholdEmail] = useState('');
  const [invitedHouseholds, setInvitedHouseholds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const participantCount = (isCreated ? 1 : 0) + invitedHouseholds.length;
  const isBulkTierUnlocked = participantCount >= unlockHouseholdThreshold;

  const normalizedInvites = useMemo(
    () => new Set(invitedHouseholds.map((household) => normalizeHousehold(household))),
    [invitedHouseholds]
  );

  function createGroupBuy() {
    setIsCreated(true);
    setError(null);
  }

  function inviteHousehold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedHousehold = normalizeHousehold(householdEmail);

    if (!isCreated) {
      setError('Create a group buy before inviting households.');
      return;
    }

    if (!normalizedHousehold) {
      setError('Enter a household email.');
      return;
    }

    if (normalizedInvites.has(normalizedHousehold)) {
      setError('Household already invited');
      return;
    }

    setInvitedHouseholds((current) => [...current, householdEmail.trim()]);
    setHouseholdEmail('');
    setError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 shadow-sm" aria-label="Group buy setup">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Group buy setup</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Create the shared basket</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
          Start a coordinator-led group buy, invite households, and unlock the bulk tier once the buyer plus two invited households are participating.
        </p>
        <button
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isCreated}
          onClick={createGroupBuy}
          type="button"
        >
          {isCreated ? 'Group buy created' : 'Create group buy'}
        </button>

        <form aria-label="Invite households" className="mt-6 grid gap-3" onSubmit={inviteHousehold}>
          <label className="grid gap-2 text-sm font-black text-slate-800" htmlFor="group-buy-household-email">
            Household email
            <input
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-950 outline-none ring-emerald-400 transition focus:ring-4"
              id="group-buy-household-email"
              onChange={(event) => setHouseholdEmail(event.target.value)}
              placeholder="andersson@example.test"
              type="email"
              value={householdEmail}
            />
          </label>
          <button
            className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!isCreated}
            type="submit"
          >
            Invite household
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-black text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm" aria-label="Group buy progress">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Bulk tier progress</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Household commitments</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Participants</p>
            <p className="mt-2 text-4xl font-black text-emerald-900">{participantCount}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-950">{unlockHouseholdThreshold} households needed for the bulk tier.</p>
          </div>
          <div
            aria-label="Bulk tier status"
            className={`rounded-2xl p-4 ${isBulkTierUnlocked ? 'bg-emerald-900 text-white' : 'bg-amber-50 text-amber-950'}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">Status</p>
            <p className="mt-2 text-2xl font-black">
              {isBulkTierUnlocked ? 'Bulk-tier price unlocked' : 'Tier locked'}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {isBulkTierUnlocked
                ? `${participantCount} households are ready to share the order.`
                : `Invite ${Math.max(unlockHouseholdThreshold - participantCount, 0)} more households.`}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Current households</p>
          <ul aria-label="Invited households" className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
            {isCreated ? <li className="rounded-xl bg-white p-3 shadow-sm">{ownerHouseholdLabel}</li> : null}
            {invitedHouseholds.map((household) => (
              <li className="rounded-xl bg-white p-3 shadow-sm" key={normalizeHousehold(household)}>
                {household}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
