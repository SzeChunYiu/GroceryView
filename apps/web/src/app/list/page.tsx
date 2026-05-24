'use client';

import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { useList } from '@/hooks/useList';

export default function ShoppingListPage() {
  const {
    activityEvents,
    addImportedItems,
    checkedCount,
    items,
    remainingCount,
    removeCheckedItems,
    resetCheckedState,
    toggleItemChecked,
    totalCount
  } = useList();
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Today&apos;s basket</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Tap the checkbox once an item is in your basket. Completed rows are struck through immediately and restored from localStorage on reload.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900"
                onClick={resetCheckedState}
                type="button"
              >
                Clear check marks
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-black text-rose-800 transition hover:border-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                disabled={checkedCount === 0}
                onClick={removeCheckedItems}
                type="button"
              >
                Remove checked items
              </button>
            </div>
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
              <CheckableListItem item={item} key={item.id} onToggle={toggleItemChecked} />
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-indigo-200 bg-indigo-50/90 p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-800">Shared-list activity</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Collaborator changes</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Add and remove events keep the actor, time, and source list visible for asynchronous planning.
              </p>
            </div>
            <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-900">{activityEvents.length} event(s)</p>
          </div>

          {activityEvents.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {activityEvents.map((event) => (
                <li className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm" key={event.id}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p>
                      <span className="font-black text-slate-950">{event.actor}</span>{' '}
                      {event.action} <span className="font-black text-slate-950">{event.itemName}</span>
                    </p>
                    <time className="text-xs font-bold text-slate-500" dateTime={event.occurredAt}>
                      {new Date(event.occurredAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-800">source list: {event.sourceList}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700">
              No collaborator activity yet. Import items or remove checked rows to start the stream.
            </p>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
