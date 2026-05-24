'use client';

import { useMemo, useState } from 'react';

type MealPlanDayOption = {
  id: string;
  label: string;
  title: string;
  servings: number;
  ingredientCount: number;
};

type CheckoutLine = {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  quantityLabel: string;
  estimatedNeed: string;
  packageSize: string;
  unitPrice: number;
  estimatedLineCost: number;
  source: string;
  confidence: 'high' | 'medium';
};

type CheckoutDraftResponse = {
  dayId?: string;
  label?: string;
  title?: string;
  servings?: number;
  selectedProducts?: CheckoutLine[];
  selectedProductCount?: number;
  estimatedTotal?: number;
  currency?: string;
  nextAction?: string;
  guardrails?: string[];
  error?: string;
};

type MealPlanCheckoutActionProps = {
  days: MealPlanDayOption[];
};

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export function MealPlanCheckoutAction({ days }: Readonly<MealPlanCheckoutActionProps>) {
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id ?? '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('Choose a meal-plan day to draft product lines before anything touches a saved list.');
  const [draft, setDraft] = useState<CheckoutDraftResponse | null>(null);

  const selectedDay = useMemo(() => days.find((day) => day.id === selectedDayId) ?? days[0], [days, selectedDayId]);

  async function buildCheckoutDraft() {
    if (!selectedDayId) return;
    setStatus('loading');
    setMessage('Estimating package counts from the meal ingredients…');

    try {
      const response = await fetch('/api/meal-planner/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dayId: selectedDayId })
      });
      const body = (await response.json()) as CheckoutDraftResponse;

      if (!response.ok || body.error) {
        setStatus('error');
        setDraft(body);
        setMessage(body.error ?? 'Meal-plan checkout draft was rejected.');
        return;
      }

      setDraft(body);
      setStatus('ready');
      setMessage(`Drafted ${body.selectedProductCount ?? 0} shopping-list line(s) for ${body.label ?? selectedDay?.label ?? 'the selected day'}.`);
    } catch {
      setStatus('error');
      setMessage('Meal-plan checkout draft failed before the API responded.');
    }
  }

  const selectedProducts = draft?.selectedProducts ?? [];
  const guardrails = draft?.guardrails ?? [
    'No saved shopping list is changed until the shopper reviews the draft.',
    'No retailer checkout, payment, delivery slot, or stock reservation is attempted.'
  ];

  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-lime-200 bg-[radial-gradient(circle_at_top_left,_#ecfccb,_#f8fafc_42%,_#ffffff)] shadow-sm" aria-label="Meal plan checkout draft action">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-lime-200/80 p-6 lg:border-b-0 lg:border-r">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-lime-800">Mise en place action</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Turn a meal day into a list draft</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            Pick a planned day and GroceryView will select the meal products, estimate package counts from serving size, and keep the result in review mode instead of jumping to checkout.
          </p>

          <label className="mt-5 block">
            <span className="text-sm font-black text-slate-800">Meal-plan day</span>
            <select
              className="mt-2 w-full rounded-2xl border border-lime-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-lime-700"
              onChange={(event) => setSelectedDayId(event.target.value)}
              value={selectedDayId}
            >
              {days.map((day) => (
                <option key={day.id} value={day.id}>{day.label} · {day.title}</option>
              ))}
            </select>
          </label>

          {selectedDay ? (
            <div className="mt-4 rounded-3xl border border-white/80 bg-white/80 p-4 text-sm font-semibold text-slate-700 shadow-sm">
              <p className="font-black text-slate-950">{selectedDay.title}</p>
              <p className="mt-1">{selectedDay.servings} servings · {selectedDay.ingredientCount} product candidates</p>
            </div>
          ) : null}

          <button
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-lime-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!selectedDayId || status === 'loading'}
            onClick={buildCheckoutDraft}
            type="button"
          >
            {status === 'loading' ? 'Estimating quantities…' : 'Draft shopping list lines'}
          </button>

          <p className="mt-4 rounded-2xl bg-white/80 p-3 text-sm font-bold text-slate-800" data-status={status}>{message}</p>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Draft output</p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">{draft?.label ?? 'No draft yet'}</h3>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Estimated total</p>
              <p className="text-2xl font-black text-lime-800">{typeof draft?.estimatedTotal === 'number' ? formatSek(draft.estimatedTotal) : '—'}</p>
            </div>
          </div>

          {selectedProducts.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {selectedProducts.map((line) => (
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" key={line.productId}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{line.productName}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{line.category} · {line.estimatedNeed}</p>
                    </div>
                    <div className="rounded-2xl bg-lime-50 px-3 py-2 text-right">
                      <p className="text-sm font-black text-lime-900">{line.quantityLabel}</p>
                      <p className="text-xs font-bold text-lime-800">{formatSek(line.estimatedLineCost)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{line.packageSize} · confidence {line.confidence}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{line.source}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm font-semibold leading-6 text-slate-600">
              Quantity-estimated products will appear here after the API transforms the selected meal-plan day.
            </div>
          )}

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">Review guardrails</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
              {guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
