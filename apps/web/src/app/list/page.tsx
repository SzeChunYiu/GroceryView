'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/BottomNav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { useList } from '@/hooks/useList';
import { cacheListEdit, cacheScanEvent, getOfflineQueueCounts, syncOfflineQueue } from '@/lib/pwa/offline';

export default function ShoppingListPage() {
  const { addImportedItems, checkedCount, items, remainingCount, resetCheckedState, toggleItemChecked, totalCount } = useList();
  const [barcode, setBarcode] = useState('');
  const [offlineStatus, setOfflineStatus] = useState(false);
  const [queueCounts, setQueueCounts] = useState({ listEdits: 0, scanEvents: 0 });
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  useEffect(() => {
    async function refreshQueue() {
      setOfflineStatus(!window.navigator.onLine);
      setQueueCounts(await getOfflineQueueCounts());
    }

    async function flushQueue() {
      setOfflineStatus(!window.navigator.onLine);

      if (window.navigator.onLine) {
        const synced = await syncOfflineQueue();

        if (synced.listEdits > 0 || synced.scanEvents > 0) {
          setQueueCounts({ listEdits: 0, scanEvents: 0 });
          return;
        }
      }

      setQueueCounts(await getOfflineQueueCounts());
    }

    void flushQueue();
    window.addEventListener('online', flushQueue);
    window.addEventListener('offline', refreshQueue);

    return () => {
      window.removeEventListener('online', flushQueue);
      window.removeEventListener('offline', refreshQueue);
    };
  }, []);

  async function cacheOfflineListEdit(itemId: string) {
    if (window.navigator.onLine) {
      return;
    }

    const queued = await cacheListEdit({ itemId, action: 'toggle' });
    setQueueCounts((current) => ({ ...current, listEdits: current.listEdits + (queued ? 1 : 0) }));
  }

  async function handleScanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextBarcode = barcode.trim();
    if (!nextBarcode || window.navigator.onLine) {
      return;
    }

    const queued = await cacheScanEvent({ barcode: nextBarcode });
    setQueueCounts((current) => ({ ...current, scanEvents: current.scanEvents + (queued ? 1 : 0) }));
    setBarcode('');
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
            <p className="mt-1 text-3xl font-black text-slate-950">{checkedCount}/{totalCount}</p>
            <p className="text-sm font-semibold text-slate-600">{remainingCount} left to collect</p>
          </div>
        </div>

        <BulkImportDialog onImportItems={addImportedItems} />

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Offline queue</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                {offlineStatus
                  ? 'Offline list edits and scans are being saved in this browser.'
                  : 'Queued offline edits and scans sync automatically when your connection returns.'}
              </p>
              <p className="mt-2 text-sm font-black text-emerald-900">
                Pending: {queueCounts.listEdits} list edits · {queueCounts.scanEvents} scan events
              </p>
            </div>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg" onSubmit={handleScanSubmit}>
              <label className="sr-only" htmlFor="offline-scan">
                Barcode scan
              </label>
              <input
                className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                id="offline-scan"
                onChange={(event) => setBarcode(event.target.value)}
                placeholder="Scan barcode while offline"
                value={barcode}
              />
              <button
                className="inline-flex items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!offlineStatus || barcode.trim().length === 0}
                type="submit"
              >
                Queue scan
              </button>
            </form>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Today&apos;s basket</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Tap the checkbox once an item is in your basket. Completed rows are struck through immediately and restored from localStorage on reload.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900"
              onClick={resetCheckedState}
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
            {items.map((item) => (
              <CheckableListItem
                item={item}
                key={item.id}
                onToggle={() => {
                  toggleItemChecked(item.id);
                  void cacheOfflineListEdit(item.id);
                }}
              />
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
