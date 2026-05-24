'use client';

import { useState } from 'react';

type ReportPriceProps = {
  listing: string;
  store: string;
};

export function ReportPrice({ listing, store }: Readonly<ReportPriceProps>) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  async function submitCorrection(formData: FormData) {
    setStatus('submitting');
    await fetch('/api/corrections', {
      method: 'POST',
      body: formData
    });
    setStatus('submitted');
  }

  return (
    <form action={submitCorrection} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <input name="listing" type="hidden" value={listing} />
      <input name="store" type="hidden" value={store} />
      <label className="block text-sm font-black text-amber-950">
        Correct shelf price
        <input
          className="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-slate-950"
          min="0"
          name="observed_price"
          required
          step="0.01"
          type="number"
        />
      </label>
      <label className="mt-3 block text-sm font-black text-amber-950">
        Optional tag photo URL
        <input className="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-slate-950" name="photo" type="url" />
      </label>
      <button className="mt-3 rounded-full bg-amber-700 px-4 py-2 text-sm font-black text-white" disabled={status === 'submitting'} type="submit">
        {status === 'submitting' ? 'Submitting…' : 'Submit correction'}
      </button>
      {status === 'submitted' ? <p className="mt-2 text-sm font-bold text-amber-900">Sent to QA findings for review.</p> : null}
    </form>
  );
}
