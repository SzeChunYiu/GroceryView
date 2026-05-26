'use client';

import { useMemo, useState } from 'react';

const invitees = [
  { household: 'Anna household', units: 6 },
  { household: 'Khan household', units: 8 }
] as const;

const organizerUnits = 10;
const requiredUnits = 24;
const bulkPrice = '15.90 SEK/carton';
const shelfPrice = '18.90 SEK/carton';

type InviteState = Record<(typeof invitees)[number]['household'], boolean>;

const emptyInvites: InviteState = {
  'Anna household': false,
  'Khan household': false
};

export function GroupBuyCoordinator() {
  const [created, setCreated] = useState(false);
  const [invites, setInvites] = useState<InviteState>(emptyInvites);
  const [message, setMessage] = useState('Create a group buy before inviting households.');

  const committedUnits = useMemo(
    () => (created ? organizerUnits : 0) + invitees.reduce((sum, invitee) => sum + (invites[invitee.household] ? invitee.units : 0), 0),
    [created, invites]
  );
  const unlocked = committedUnits >= requiredUnits;
  const remaining = Math.max(0, requiredUnits - committedUnits);

  function createGroupBuy() {
    setCreated(true);
    setInvites(emptyInvites);
    setMessage('Group buy created with organizer household reserving 10 cartons.');
  }

  function invite(household: (typeof invitees)[number]['household']) {
    if (!created) {
      setMessage('Create a group buy before inviting households.');
      return;
    }
    setInvites((current) => ({ ...current, [household]: true }));
    setMessage(`${household} invited and reservation added.`);
  }

  return (
    <section className="mt-6 rounded-[1.5rem] border border-indigo-200 bg-indigo-50 p-5" aria-label="Create a group buy coordinator">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">Coordinator flow</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Create and unlock an oat milk group buy</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm font-black text-slate-950">Oat milk case unlock</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">Organizer household · {created ? organizerUnits : 0} cartons</p>
          {invitees.map((invitee) => (
            <p className="mt-1 text-sm font-semibold text-slate-700" key={invitee.household}>
              {invitee.household} · {invites[invitee.household] ? invitee.units : 0} cartons
            </p>
          ))}
          <p className="mt-3 text-sm font-black text-indigo-950">
            {committedUnits}/{requiredUnits} units committed · {unlocked ? 'bulk tier unlocked' : `${remaining} to unlock`}
          </p>
          <p className={unlocked ? 'mt-2 text-lg font-black text-emerald-800' : 'mt-2 text-lg font-black text-slate-700'}>
            {unlocked ? `Unlocked bulk-tier price: ${bulkPrice}` : `Current shelf price: ${shelfPrice}`}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={createGroupBuy} type="button">
              Create group buy
            </button>
            {invitees.map((invitee) => (
              <button
                className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-950 disabled:opacity-50"
                disabled={invites[invitee.household]}
                key={invitee.household}
                onClick={() => invite(invitee.household)}
                type="button"
              >
                Invite {invitee.household}
              </button>
            ))}
          </div>
          <button className="mt-3 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-900" onClick={() => invite('Anna household')} type="button">
            Invite before creating
          </button>
          <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700" role="status">{message}</p>
        </div>
      </div>
    </section>
  );
}
