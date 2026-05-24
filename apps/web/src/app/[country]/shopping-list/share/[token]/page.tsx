'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';

type HouseholdRole = 'me' | 'partner' | 'kid' | 'guest';

type SharedListItem = {
  addedBy: HouseholdRole;
  checked: boolean;
  detail: string;
  id: string;
  name: string;
  quantity: string;
  updatedAt: string;
};

type SharedListEvent = {
  actor: HouseholdRole;
  item?: Partial<SharedListItem> & Pick<SharedListItem, 'id'>;
  message?: string;
  type: 'item:add' | 'item:check' | 'item:update' | 'presence' | 'snapshot';
};

type ActivityEvent = {
  actor: HouseholdRole;
  id: string;
  message: string;
  receivedAt: string;
  source: 'local' | 'sse' | 'tab-sync';
};

type CountryCopy = {
  currency: string;
  marketName: string;
  starterItems: Array<Omit<SharedListItem, 'updatedAt'>>;
};

const countryCopy: Record<string, CountryCopy> = {
  se: {
    currency: 'SEK',
    marketName: 'Sweden',
    starterItems: [
      { id: 'milk', name: 'Mjölk', quantity: '2 cartons', detail: 'Dairy shelf', checked: false, addedBy: 'me' },
      { id: 'coffee', name: 'Kaffe', quantity: '1 pack', detail: 'Household staple', checked: false, addedBy: 'partner' },
      { id: 'fruit', name: 'Fruit for lunchboxes', quantity: '1 bag', detail: 'Kids can add preferences live', checked: false, addedBy: 'kid' }
    ]
  },
  no: {
    currency: 'NOK',
    marketName: 'Norway',
    starterItems: [
      { id: 'melk', name: 'Melk', quantity: '2 cartons', detail: 'Dairy shelf', checked: false, addedBy: 'me' },
      { id: 'brod', name: 'Brød', quantity: '1 loaf', detail: 'Bakery', checked: false, addedBy: 'partner' },
      { id: 'snacks', name: 'After-school snacks', quantity: '3 packs', detail: 'Kids can add preferences live', checked: false, addedBy: 'kid' }
    ]
  },
  is: {
    currency: 'ISK',
    marketName: 'Iceland',
    starterItems: [
      { id: 'mjolk', name: 'Mjólk', quantity: '2 cartons', detail: 'Dairy shelf', checked: false, addedBy: 'me' },
      { id: 'skyr', name: 'Skyr', quantity: '4 cups', detail: 'Breakfast', checked: false, addedBy: 'partner' },
      { id: 'fruit', name: 'Fruit for school bags', quantity: '1 bag', detail: 'Kids can add preferences live', checked: false, addedBy: 'kid' }
    ]
  }
};

const roleLabel: Record<HouseholdRole, string> = {
  guest: 'Guest',
  kid: 'Kids',
  me: 'You',
  partner: 'Partner'
};

const roleClasses: Record<HouseholdRole, string> = {
  guest: 'bg-slate-100 text-slate-700',
  kid: 'bg-amber-100 text-amber-950',
  me: 'bg-emerald-100 text-emerald-950',
  partner: 'bg-sky-100 text-sky-950'
};

function firstParam(value: string | string[] | undefined, fallback: string) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function normalizeCountry(value: string) {
  return value.toLocaleLowerCase('en-US');
}

function seededTimestamp(offsetMinutes: number) {
  return new Date(Date.now() - offsetMinutes * 60_000).toISOString();
}

function initialItemsForCountry(country: string): SharedListItem[] {
  const copy = countryCopy[country] ?? countryCopy.se;
  return copy.starterItems.map((item, index) => ({ ...item, updatedAt: seededTimestamp(20 - index * 5) }));
}

function readableTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function makeItemId(name: string) {
  const slug = name
    .toLocaleLowerCase('sv-SE')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `${slug || 'item'}-${Date.now().toString(36)}`;
}

function eventMessage(event: SharedListEvent) {
  if (event.message) return event.message;
  if (event.type === 'presence') return `${roleLabel[event.actor]} joined the shared list.`;
  if (event.type === 'item:check') return `${roleLabel[event.actor]} updated ${event.item?.name ?? 'an item'}.`;
  if (event.type === 'item:update') return `${roleLabel[event.actor]} edited ${event.item?.name ?? 'an item'}.`;
  if (event.type === 'snapshot') return 'SSE snapshot loaded for this household.';
  return `${roleLabel[event.actor]} added ${event.item?.name ?? 'an item'}.`;
}

function mergeEventIntoItems(items: SharedListItem[], event: SharedListEvent): SharedListItem[] {
  if (!event.item) return items;

  const now = new Date().toISOString();
  const nextItem: SharedListItem = {
    addedBy: event.item.addedBy ?? event.actor,
    checked: event.item.checked ?? false,
    detail: event.item.detail ?? 'Added from the shared household stream',
    id: event.item.id,
    name: event.item.name ?? 'Shared list item',
    quantity: event.item.quantity ?? '1 item',
    updatedAt: event.item.updatedAt ?? now
  };

  const existingIndex = items.findIndex((item) => item.id === nextItem.id);
  if (existingIndex === -1) return [nextItem, ...items];

  return items.map((item, index) => (
    index === existingIndex
      ? { ...item, ...nextItem, updatedAt: nextItem.updatedAt }
      : item
  ));
}

export default function SharedHouseholdShoppingListPage() {
  const params = useParams<{ country?: string; token?: string }>();
  const country = normalizeCountry(firstParam(params.country, 'se'));
  const token = firstParam(params.token, 'demo-household');
  const copy = countryCopy[country] ?? countryCopy.se;
  const [items, setItems] = useState<SharedListItem[]>(() => initialItemsForCountry(country));
  const [activity, setActivity] = useState<ActivityEvent[]>(() => [
    {
      actor: 'partner',
      id: 'seed-partner-presence',
      message: 'Partner joined the household list.',
      receivedAt: seededTimestamp(6),
      source: 'sse'
    },
    {
      actor: 'kid',
      id: 'seed-kid-add',
      message: 'Kids added fruit for lunchboxes.',
      receivedAt: seededTimestamp(3),
      source: 'sse'
    }
  ]);
  const [connectionState, setConnectionState] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [draftName, setDraftName] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('1 item');
  const [draftRole, setDraftRole] = useState<HouseholdRole>('me');
  const channelRef = useRef<BroadcastChannel | null>(null);

  const completedCount = items.filter((item) => item.checked).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const streamUrl = useMemo(() => `/api/list/share/stream?token=${encodeURIComponent(token)}&country=${encodeURIComponent(country)}`, [country, token]);

  function recordActivity(event: SharedListEvent, source: ActivityEvent['source']) {
    setActivity((current) => [
      {
        actor: event.actor,
        id: `${source}-${event.type}-${event.item?.id ?? Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        message: eventMessage(event),
        receivedAt: new Date().toISOString(),
        source
      },
      ...current
    ].slice(0, 8));
  }

  function applySharedEvent(event: SharedListEvent, source: ActivityEvent['source']) {
    setItems((current) => mergeEventIntoItems(current, event));
    recordActivity(event, source);
  }

  useEffect(() => {
    setItems(initialItemsForCountry(country));
  }, [country, token]);

  useEffect(() => {
    const channelName = `groceryview-household-list:${country}:${token}`;
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;
    channelRef.current = channel;

    if (channel) {
      channel.onmessage = (message: MessageEvent<SharedListEvent>) => {
        if (message.data?.type) applySharedEvent(message.data, 'tab-sync');
      };
    }

    return () => {
      channel?.close();
      channelRef.current = null;
    };
  }, [country, token]);

  useEffect(() => {
    if (typeof EventSource === 'undefined') {
      setConnectionState('offline');
      return;
    }

    const source = new EventSource(streamUrl);
    source.onopen = () => setConnectionState('live');
    source.onerror = () => setConnectionState('offline');
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as SharedListEvent;
        if (event?.type) applySharedEvent(event, 'sse');
      } catch {
        recordActivity({ actor: 'guest', type: 'presence', message: 'Received an unreadable household update.' }, 'sse');
      }
    };

    return () => source.close();
  }, [streamUrl]);

  function broadcast(event: SharedListEvent) {
    channelRef.current?.postMessage(event);
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;

    const sharedEvent: SharedListEvent = {
      actor: draftRole,
      item: {
        addedBy: draftRole,
        checked: false,
        detail: 'Added by household member during a shared trip',
        id: makeItemId(name),
        name,
        quantity: draftQuantity.trim() || '1 item',
        updatedAt: new Date().toISOString()
      },
      type: 'item:add'
    };

    applySharedEvent(sharedEvent, 'local');
    broadcast(sharedEvent);
    setDraftName('');
    setDraftQuantity('1 item');
  }

  function toggleItem(item: SharedListItem) {
    const sharedEvent: SharedListEvent = {
      actor: 'me',
      item: { ...item, checked: !item.checked, updatedAt: new Date().toISOString() },
      type: 'item:check'
    };
    applySharedEvent(sharedEvent, 'local');
    broadcast(sharedEvent);
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Shared household trip · {copy.marketName}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Household shopping list</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Share token <span className="font-black text-slate-950">{token}</span> lets partners and kids add items while you shop.
              This page listens for Server-Sent Events and mirrors local tab updates for live household collaboration.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Realtime status</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{connectionState === 'live' ? 'Live SSE' : connectionState === 'connecting' ? 'Connecting' : 'Offline'}</p>
            <p className="text-sm font-semibold text-slate-600">{completedCount}/{items.length} collected · {copy.currency} market</p>
          </div>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Live basket</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                  Partner and kid changes appear as SSE <code className="rounded bg-slate-100 px-1 py-0.5">item:add</code> or <code className="rounded bg-slate-100 px-1 py-0.5">item:check</code> events.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-950">{progress}% complete</span>
            </div>

            <div
              aria-label={`${progress}% complete`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress}
              className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
            >
              <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${progress}%` }} />
            </div>

            <ul className="mt-5 space-y-3">
              {items.map((item) => (
                <li className={`rounded-2xl border p-4 transition ${item.checked ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-white'}`} key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      checked={item.checked}
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                      onChange={() => toggleItem(item)}
                      type="checkbox"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-lg font-black ${item.checked ? 'text-slate-500 line-through decoration-2 decoration-emerald-700' : 'text-slate-950'}`}>{item.name}</span>
                      <span className={`mt-1 block text-sm font-semibold ${item.checked ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                        {item.quantity} · {item.detail}
                      </span>
                      <span className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black text-slate-500">
                        <span className={`rounded-full px-3 py-1 ${roleClasses[item.addedBy]}`}>Added by {roleLabel[item.addedBy]}</span>
                        <span>Updated {readableTime(item.updatedAt)}</span>
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-6">
            <form className="rounded-[1.75rem] border border-sky-200 bg-sky-50/90 p-5 shadow-sm" onSubmit={addItem}>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">Household add</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add from any device</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Use this form to emulate a partner or kid adding an item; production SSE messages with the same schema update the list automatically.
              </p>

              <label className="mt-4 block text-sm font-black text-slate-700">
                Item name
                <input
                  className="mt-2 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-700"
                  onChange={(input) => setDraftName(input.target.value)}
                  placeholder="Bananas"
                  value={draftName}
                />
              </label>
              <label className="mt-4 block text-sm font-black text-slate-700">
                Quantity
                <input
                  className="mt-2 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-700"
                  onChange={(input) => setDraftQuantity(input.target.value)}
                  placeholder="1 bunch"
                  value={draftQuantity}
                />
              </label>
              <label className="mt-4 block text-sm font-black text-slate-700">
                Added by
                <select
                  className="mt-2 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-700"
                  onChange={(input) => setDraftRole(input.target.value as HouseholdRole)}
                  value={draftRole}
                >
                  <option value="me">You</option>
                  <option value="partner">Partner</option>
                  <option value="kid">Kids</option>
                  <option value="guest">Guest</option>
                </select>
              </label>
              <button className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!draftName.trim()} type="submit">
                Add live item
              </button>
            </form>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">SSE activity</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Household feed</h2>
              <p className="mt-2 break-all rounded-2xl bg-slate-100 p-3 text-xs font-bold text-slate-600">EventSource: {streamUrl}</p>
              <ul className="mt-4 space-y-3">
                {activity.map((event) => (
                  <li className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-700" key={event.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${roleClasses[event.actor]}`}>{roleLabel[event.actor]}</span>
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{event.source}</span>
                    </div>
                    <p className="mt-2">{event.message}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{readableTime(event.receivedAt)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
