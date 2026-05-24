'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { PullRefreshWrapper } from '@/components/PullRefreshWrapper';
import { useList } from '@/hooks/useList';
import {
  defaultRecurringListTemplates,
  generateRecurringListInstance,
  normalizeRecurringFrequency,
  recurringListFrequencies,
  recurringTemplateFromItems,
  type RecurringListFrequency,
  type RecurringListTemplate
} from '@/lib/recurring-lists';

const RECURRING_TEMPLATE_STORAGE_KEY = 'groceryview:shopping-list:recurring-templates:v1';

export default function ShoppingListPage() {
  const { addImportedItems, checkedCount, items, remainingCount, resetCheckedState, toggleItemChecked, totalCount } = useList();
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringListTemplate[]>(defaultRecurringListTemplates);
  const [templateName, setTemplateName] = useState('My recurring staples');
  const [templateFrequency, setTemplateFrequency] = useState<RecurringListFrequency>('weekly');
  const [lastGeneratedTemplate, setLastGeneratedTemplate] = useState<string | null>(null);
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const activeRecurringItems = useMemo(() => items.filter((item) => !item.checked), [items]);

  useEffect(() => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem(RECURRING_TEMPLATE_STORAGE_KEY) ?? '[]') as RecurringListTemplate[];
      if (Array.isArray(savedTemplates) && savedTemplates.length > 0) {
        setRecurringTemplates([...savedTemplates, ...defaultRecurringListTemplates]);
      }
    } catch {
      // Keep the shopping list usable if localStorage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      const customTemplates = recurringTemplates.filter((template) => !defaultRecurringListTemplates.some((defaultTemplate) => defaultTemplate.id === template.id));
      localStorage.setItem(RECURRING_TEMPLATE_STORAGE_KEY, JSON.stringify(customTemplates));
    } catch {
      // Keep recurring list generation usable even if template persistence fails.
    }
  }, [recurringTemplates]);

  const saveCurrentListAsTemplate = useCallback(() => {
    const template = recurringTemplateFromItems({
      frequency: normalizeRecurringFrequency(templateFrequency),
      items: activeRecurringItems.length > 0 ? activeRecurringItems : items,
      name: templateName
    });
    setRecurringTemplates((currentTemplates) => [template, ...currentTemplates.filter((candidate) => candidate.id !== template.id)]);
    setLastGeneratedTemplate(`Saved ${template.name}`);
  }, [activeRecurringItems, items, templateFrequency, templateName]);

  const generateTemplateInstance = useCallback((template: RecurringListTemplate) => {
    const instance = generateRecurringListInstance(template);
    addImportedItems(instance.items);
    setLastGeneratedTemplate(`${template.name} generated · next ${new Date(instance.nextRunAt).toLocaleDateString('sv-SE')}`);
  }, [addImportedItems]);

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

          <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-amber-200 bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.4fr]">
              <div className="bg-amber-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Recurring templates</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Save this shop once, regenerate it in one click</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Templates keep item names, quantities, matched product slugs, and either a weekly or biweekly cadence. Generated instances are added as fresh unchecked rows.
                </p>
                <div className="mt-4 grid gap-3">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Template name</span>
                    <input
                      className="mt-1 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold outline-none ring-amber-200 transition focus:border-amber-700 focus:ring-4"
                      onChange={(event) => setTemplateName(event.target.value)}
                      value={templateName}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Frequency</span>
                    <select
                      className="mt-1 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black"
                      onChange={(event) => setTemplateFrequency(normalizeRecurringFrequency(event.target.value))}
                      value={templateFrequency}
                    >
                      {(Object.keys(recurringListFrequencies) as RecurringListFrequency[]).map((frequency) => (
                        <option key={frequency} value={frequency}>{recurringListFrequencies[frequency].label}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-amber-800"
                    onClick={saveCurrentListAsTemplate}
                    type="button"
                  >
                    Save current list as template
                  </button>
                  {lastGeneratedTemplate ? (
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-amber-900">{lastGeneratedTemplate}</p>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-2">
                {recurringTemplates.map((template) => (
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4" key={template.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{recurringListFrequencies[template.frequency].label}</p>
                        <h3 className="mt-1 text-lg font-black text-slate-950">{template.name}</h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{template.items.length} rows</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{recurringListFrequencies[template.frequency].description}</p>
                    <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
                      {template.items.slice(0, 3).map((item) => (
                        <li key={item.id}>• {item.quantity} · {item.name}</li>
                      ))}
                    </ul>
                    <button
                      className="mt-4 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-700 hover:bg-emerald-50"
                      onClick={() => generateTemplateInstance(template)}
                      type="button"
                    >
                      Generate this {template.frequency === 'weekly' ? 'week' : 'fortnight'}
                    </button>
                  </article>
                ))}
              </div>
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
                <CheckableListItem item={item} key={item.id} onToggle={toggleItemChecked} />
              ))}
            </ul>
          </section>
        </main>
      </PullRefreshWrapper>
      <BottomNav />
    </div>
  );
}
