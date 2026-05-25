'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { PullRefreshWrapper } from '@/components/PullRefreshWrapper';
import { PrintButton } from '@/components/PrintButton';
import { useList } from '@/hooks/useList';
import { cheapestSourceForProductSlug } from '@/lib/shopping-list-prices';

const OFFLINE_SHOPPING_LIST_CACHE_KEY = 'groceryview:shopping-list:offline-cache:v1';

export default function ShoppingListPage() {
  const { addImportedItems, checkedCount, hasLoadedBrowserState, items, remainingCount, resetCheckedState, shareLink, toggleItemChecked, totalCount } = useList();
  const [generatedShareUrl, setGeneratedShareUrl] = useState('');
  const [offlineCacheStatus, setOfflineCacheStatus] = useState('Offline copy is prepared after the list loads.');
  const [shareStatus, setShareStatus] = useState('Create a read-only shopping list link after your basket is ready.');
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const offlineShoppingListSnapshot = useMemo(() => {
    const lastKnownPrices = items
      .map((item) => item.matchedProductSlug ? cheapestSourceForProductSlug(item.matchedProductSlug) : null)
      .filter((source): source is NonNullable<ReturnType<typeof cheapestSourceForProductSlug>> => source !== null);

    return {
      cachedAt: new Date().toISOString(),
      checkedCount,
      items,
      lastKnownPrices,
      remainingCount,
      totalCount
    };
  }, [checkedCount, items, remainingCount, totalCount]);

  useEffect(() => {
    if (!hasLoadedBrowserState || shareLink?.isValid) return;

    try {
      window.localStorage.setItem(OFFLINE_SHOPPING_LIST_CACHE_KEY, JSON.stringify(offlineShoppingListSnapshot));
      setOfflineCacheStatus(`Offline copy saved with ${offlineShoppingListSnapshot.lastKnownPrices.length} last known price${offlineShoppingListSnapshot.lastKnownPrices.length === 1 ? '' : 's'}.`);
    } catch {
      setOfflineCacheStatus('Offline copy could not be saved in this browser.');
    }
  }, [hasLoadedBrowserState, offlineShoppingListSnapshot, shareLink?.isValid]);

  const refreshLatestPrices = useCallback(async () => {
    const productUrls = items
      .map((item) => item.matchedProductSlug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
      .map((slug) => `/products/${encodeURIComponent(slug)}`);
    const refreshUrls = productUrls.length > 0 ? productUrls : [window.location.pathname];

    await Promise.all(refreshUrls.map((url) => fetch(url, { cache: 'no-store' })));
  }, [items]);

  const createShareLink = useCallback(async () => {
    setShareStatus('Creating read-only share link…');
    const response = await fetch('/api/list/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        listId: 'local-shopping-list',
        items: items.map(({ checked: _checked, ...item }) => item)
      })
    });
    if (!response.ok) {
      setShareStatus('Could not create share link. Try again when the list API is reachable.');
      return;
    }
    const payload = await response.json() as { shareUrl?: string };
    setGeneratedShareUrl(payload.shareUrl ?? '');
    setShareStatus(payload.shareUrl ? 'Read-only share link ready.' : 'Share API returned no link.');
  }, [items]);

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <div data-print-hidden="true"><AppNav /></div>
      <div data-print-hidden="true"><PullRefreshWrapper onRefresh={refreshLatestPrices}>
        <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Local shopping trip</p>
          <div className="shopping-list-print-header mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
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

          {shareLink ? (
            <div className={`mt-5 rounded-2xl border p-4 text-sm font-black ${shareLink.isValid ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-red-200 bg-red-50 text-red-950'}`} role="status">
              {shareLink.isValid ? 'Read-only shared list link verified.' : shareLink.error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3" data-print-hidden="true">
            <PrintButton />
            <button
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-700"
              onClick={createShareLink}
              type="button"
            >
              Create share link
            </button>
            <p className="text-sm font-semibold text-slate-600">Print view uses A4 spacing and hides navigation, import controls, and mobile chrome.</p>
          </div>
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950" data-print-hidden="true" role="status">
            {offlineCacheStatus}
          </div>
          <div className="mt-3 rounded-2xl bg-white/80 p-4 text-sm font-semibold text-slate-700" data-print-hidden="true" role="status">
            <p>{shareStatus}</p>
            {generatedShareUrl ? (
              <label className="mt-2 block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Share via link</span>
                <input aria-label="Share link" className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm font-bold text-slate-800" readOnly value={generatedShareUrl} />
              </label>
            ) : null}
          </div>

          <div data-print-hidden="true"><BulkImportDialog onImportItems={addImportedItems} /></div>

          <section className="shopping-list-print-card mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Today&apos;s basket</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                  Tap the checkbox once an item is in your basket. Completed rows are struck through immediately and restored from localStorage on reload.
                </p>
              </div>
              <button
                data-print-hidden="true"
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

            <ul className="shopping-list-print-items mt-5 space-y-3">
              {items.map((item) => (
                <CheckableListItem item={item} key={item.id} onToggle={toggleItemChecked} />
              ))}
            </ul>
          </section>
        </main>
      </PullRefreshWrapper></div>
      <main className="shopping-list-print-page mx-auto hidden w-full max-w-7xl px-4 pb-20 pt-6 print:block sm:px-6 lg:px-8 lg:pb-6">
        <section className="shopping-list-print-card rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
          <div className="shopping-list-print-header flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">GroceryView shopping list</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Today&apos;s basket</h1>
              <p className="mt-2 text-sm font-semibold text-slate-700">{checkedCount}/{totalCount} complete · {remainingCount} left to collect</p>
            </div>
            <p className="text-right text-xs font-bold uppercase tracking-[0.18em] text-slate-500">A4 print view</p>
          </div>
          <ul className="shopping-list-print-items mt-5 space-y-3">
            {items.map((item) => (
              <CheckableListItem item={item} key={`print-${item.id}`} onToggle={toggleItemChecked} />
            ))}
          </ul>
        </section>
      </main>
      <div data-print-hidden="true"><BottomNav /></div>
    </div>
  );
}
