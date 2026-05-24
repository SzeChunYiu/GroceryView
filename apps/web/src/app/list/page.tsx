'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { useList } from '@/hooks/useList';
import {
  applyOptimisticListToggle,
  listItemStatesFromShoppingItems,
  mergeRealtimeListItems,
  type RealtimeListItemState,
  type RealtimeListSyncEvent
} from '@/lib/realtime';

const SHARED_LIST_ID = 'default-shopping-list';

export default function ShoppingListPage() {
  const { addImportedItems, items, resetCheckedState, toggleItemChecked, totalCount } = useList();
  const [clientId] = useState(() => `web-${Math.random().toString(36).slice(2)}`);
  const [realtimeItems, setRealtimeItems] = useState<RealtimeListItemState[]>([]);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  useEffect(() => {
    setRealtimeItems((currentItems) => mergeRealtimeListItems(listItemStatesFromShoppingItems(items), currentItems));
  }, [items]);

  useEffect(() => {
    const events = new EventSource(`/api/list/sync?listId=${encodeURIComponent(SHARED_LIST_ID)}`);
    events.addEventListener('list-sync', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as RealtimeListSyncEvent;
      setRealtimeItems((currentItems) => mergeRealtimeListItems(currentItems, payload.items));
      setSyncStatus('connected');
    });
    events.onerror = () => setSyncStatus('offline');
    events.onopen = () => setSyncStatus('connected');
    return () => events.close();
  }, []);

  const realtimeById = useMemo(() => new Map(realtimeItems.map((item) => [item.id, item])), [realtimeItems]);
  const sharedItems = useMemo(() => items.map((item) => ({
    ...item,
    checked: realtimeById.get(item.id)?.checked ?? item.checked
  })), [items, realtimeById]);
  const sharedCheckedCount = useMemo(() => sharedItems.filter((item) => item.checked).length, [sharedItems]);
  const sharedRemainingCount = sharedItems.length - sharedCheckedCount;
  const progress = sharedItems.length > 0 ? Math.round((sharedCheckedCount / sharedItems.length) * 100) : 0;

  function toggleSharedItemChecked(itemId: string) {
    const localChecked = items.find((item) => item.id === itemId)?.checked ?? false;
    const nextChecked = !(realtimeById.get(itemId)?.checked ?? localChecked);
    const updatedAt = new Date().toISOString();
    setRealtimeItems((currentItems) => applyOptimisticListToggle(currentItems, itemId, nextChecked, clientId, updatedAt));
    if (localChecked !== nextChecked) toggleItemChecked(itemId);
    void fetch('/api/list/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ actorId: clientId, checked: nextChecked, id: itemId, listId: SHARED_LIST_ID, updatedAt })
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('sync failed');
        const payload = await response.json() as RealtimeListSyncEvent;
        setRealtimeItems((currentItems) => mergeRealtimeListItems(currentItems, payload.items));
        setSyncStatus('connected');
      })
      .catch(() => setSyncStatus('offline'));
  }

  function resetSharedCheckedState() {
    const updatedAt = new Date().toISOString();
    const resetItems = sharedItems.map((item) => ({ actorId: clientId, checked: false, id: item.id, updatedAt }));
    setRealtimeItems((currentItems) => mergeRealtimeListItems(currentItems, resetItems));
    resetCheckedState();
    void Promise.all(resetItems.map((item) => fetch('/api/list/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...item, listId: SHARED_LIST_ID })
    })))
      .then(() => setSyncStatus('connected'))
      .catch(() => setSyncStatus('offline'));
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Local shopping trip</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">Shopping list</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Check items off while you shop. Checked state is saved in this browser with localStorage, so the same list stays crossed off after a refresh.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Trip progress</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{sharedCheckedCount}/{totalCount}</p>
            <p className="text-sm font-semibold text-slate-600">{sharedRemainingCount} left to collect</p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Live sync: {syncStatus}</p>
          </div>
        </div>

        <BulkImportDialog onImportItems={addImportedItems} />

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Today&apos;s basket</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Tap the checkbox once an item is in your basket. Optimistic edits sync over an SSE channel and resolve conflicts by the latest item timestamp.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900"
              onClick={resetSharedCheckedState}
              type="button"
            >
              Clear check marks
            </button>
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
            {sharedItems.map((item) => (
              <CheckableListItem item={item} key={item.id} onToggle={toggleSharedItemChecked} />
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
