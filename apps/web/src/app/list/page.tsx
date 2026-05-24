'use client';

import { useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import type { RecurringListFrequency } from '@/hooks/useList';
import { useList } from '@/hooks/useList';

const recurringFrequencyLabels: Record<RecurringListFrequency, string> = {
  biweekly: 'Biweekly',
  weekly: 'Weekly'
};

export default function ShoppingListPage() {
  const {
    addImportedItems,
    checkedCount,
    generateNextRecurringList,
    items,
    recurringTemplates,
    remainingCount,
    resetCheckedState,
    saveRecurringTemplate,
    toggleItemChecked,
    totalCount
  } = useList();
  const [templateFrequency, setTemplateFrequency] = useState<RecurringListFrequency>('weekly');
  const [templateName, setTemplateName] = useState('');
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  function saveTemplate() {
    saveRecurringTemplate(templateName, templateFrequency);
    setTemplateName('');
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

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Recurring templates</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Save this list for repeat shops</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
                Store the current basket as a weekly or biweekly template, then generate the next shopping-list instance in one click.
              </p>
            </div>
            <div className="grid gap-2 rounded-2xl bg-white p-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                aria-label="Recurring template name"
                className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-700"
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="Template name"
                value={templateName}
              />
              <select
                aria-label="Recurring template frequency"
                className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-700"
                onChange={(event) => setTemplateFrequency(event.target.value as RecurringListFrequency)}
                value={templateFrequency}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
              </select>
              <button
                className="inline-flex items-center justify-center rounded-full bg-emerald-800 px-5 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={totalCount === 0}
                onClick={saveTemplate}
                type="button"
              >
                Save template
              </button>
            </div>
          </div>

          {recurringTemplates.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {recurringTemplates.map((template) => (
                <article className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" key={template.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">{template.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {recurringFrequencyLabels[template.frequency]} · {template.items.length} item(s)
                      </p>
                      {template.lastGeneratedAt ? (
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          Last generated {new Date(template.lastGeneratedAt).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-700"
                      onClick={() => generateNextRecurringList(template.id)}
                      type="button"
                    >
                      Generate next list
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
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
              <CheckableListItem item={item} key={item.id} onToggle={toggleItemChecked} />
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
