'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { PullRefreshWrapper } from '@/components/PullRefreshWrapper';
import { useList } from '@/hooks/useList';
import { listSyncCopy } from '@/lib/offline-sync';

export default function ShoppingListPage() {
  const { addImportedItems, checkedCount, items, remainingCount, resetCheckedState, toggleItemChecked, totalCount } = useList();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOfflineEdits, setPendingOfflineEdits] = useState(0);
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const syncCopy = useMemo(() => listSyncCopy({ isOnline, pendingEditCount: pendingOfflineEdits }), [isOnline, pendingOfflineEdits]);
  const syncToneClassName = syncCopy.tone === 'offline'
    ? 'border-amber-300 bg-amber-50 text-amber-950'
    : syncCopy.tone === 'pending'
      ? 'border-sky-300 bg-sky-50 text-sky-950'
      : 'border-emerald-200 bg-emerald-50 text-emerald-950';

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || pendingOfflineEdits === 0) return;
    const syncTimer = window.setTimeout(() => setPendingOfflineEdits(0), 1200);
    return () => window.clearTimeout(syncTimer);
  }, [isOnline, pendingOfflineEdits]);

  const noteListEdit = useCallback(() => {
    if (!isOnline) setPendingOfflineEdits((count) => count + 1);
  }, [isOnline]);

  const handleToggleItemChecked = useCallback((itemId: string) => {
    toggleItemChecked(itemId);
    noteListEdit();
  }, [noteListEdit, toggleItemChecked]);

  const handleResetCheckedState = useCallback(() => {
    resetCheckedState();
    noteListEdit();
  }, [noteListEdit, resetCheckedState]);

  const handleImportItems = useCallback((importedItems: Parameters<typeof addImportedItems>[0]) => {
    addImportedItems(importedItems);
    noteListEdit();
  }, [addImportedItems, noteListEdit]);

  const refreshLatestPrices = useCallback(async () => {
    const productUrls = items
      .map((item) => item.matchedProductSlug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
      .map((slug) => `/products/${encodeURIComponent(slug)}`);
    const refreshUrls = productUrls.length > 0 ? productUrls : [window.location.pathname];

    await Promise.all(refreshUrls.map((url) => fetch(url, { cache: 'no-store' })));
  }, [items]);

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <PullRefreshWrapper onRefresh={refreshLatestPrices}>
        <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Local shopping trip</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">Shopping list</h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
                Check items off while you shop. Changes are saved in this browser first, with pending offline edits called out until background sync catches up.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Trip progress</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{checkedCount}/{totalCount}</p>
              <p className="text-sm font-semibold text-slate-600">{remainingCount} left to collect</p>
            </div>
          </div>

          <div className={`mt-5 rounded-[1.5rem] border px-4 py-3 shadow-sm ${syncToneClassName}`} role="status">
            <p className="text-sm font-black uppercase tracking-[0.18em]">{syncCopy.badge}</p>
            <p className="mt-1 text-sm font-semibold leading-6">{syncCopy.description}</p>
          </div>

          <BulkImportDialog onImportItems={handleImportItems} />

          <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Today&apos;s basket</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                  Tap the checkbox once an item is in your basket. Completed rows update immediately; if you are offline, pending edits stay visible here until sync resumes.
                </p>
              </div>
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900"
                onClick={handleResetCheckedState}
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
                <CheckableListItem item={item} key={item.id} onToggle={handleToggleItemChecked} />
              ))}
            </ul>
          </section>
        </main>
      </PullRefreshWrapper>
      <BottomNav />
    </div>
  );
}
