'use client';

import { useState } from 'react';

type ReportPriceProps = Readonly<{
  listing?: string;
  store?: string;
}>;

type ReportState = 'idle' | 'submitting' | 'submitted' | 'error';

export function ReportPrice({ listing = '', store = '' }: ReportPriceProps) {
  const [state, setState] = useState<ReportState>('idle');
  const [message, setMessage] = useState('');

  async function submitCorrection(formData: FormData) {
    setState('submitting');
    setMessage('');
    const payload = {
      listing: String(formData.get('listing') ?? '').trim(),
      store: String(formData.get('store') ?? '').trim(),
      observed_price: Number(formData.get('observed_price')),
      photo: String(formData.get('photo') ?? '').trim() || undefined
    };

    try {
      const response = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to submit price correction.');
      setState('submitted');
      setMessage(body.message || 'Price correction sent to QA review.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to submit price correction.');
    }
  }

  return (
    <form action={submitCorrection} className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Report a shelf mismatch</p>
      <h2 className="mt-2 text-xl font-black text-slate-950">Crowdsourced price correction</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-slate-700">
          Listing
          <input className="rounded-2xl border border-emerald-100 px-4 py-3 font-semibold" defaultValue={listing} name="listing" required />
        </label>
        <label className="grid gap-2 text-sm font-black text-slate-700">
          Store
          <input className="rounded-2xl border border-emerald-100 px-4 py-3 font-semibold" defaultValue={store} name="store" required />
        </label>
        <label className="grid gap-2 text-sm font-black text-slate-700">
          Observed shelf price
          <input className="rounded-2xl border border-emerald-100 px-4 py-3 font-semibold" min="0" name="observed_price" required step="0.01" type="number" />
        </label>
        <label className="grid gap-2 text-sm font-black text-slate-700">
          Photo URL (optional)
          <input className="rounded-2xl border border-emerald-100 px-4 py-3 font-semibold" name="photo" placeholder="https://…" type="url" />
        </label>
      </div>
      <button className="mt-4 rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white disabled:opacity-60" disabled={state === 'submitting'} type="submit">
        {state === 'submitting' ? 'Submitting…' : 'Submit correction'}
      </button>
      {message ? <p className="mt-3 text-sm font-bold text-slate-700" role="status">{message}</p> : null}
    </form>
  );
}
