'use client';

import { FormEvent, useState } from 'react';

type ReportPriceStatus = 'idle' | 'loading' | 'ready' | 'error';

type CorrectionResponse = {
  correction?: { id: string; status: string };
  queue?: string;
  confirmationCount?: number;
  observationUpdated?: boolean;
  error?: string;
};

type ReportPriceProps = Readonly<{
  listing?: string;
  store?: string;
  currentPrice?: number;
}>;

function readReporterId() {
  const sessionUserId = sessionStorage.getItem('groceryview:userId');
  if (sessionUserId) return sessionUserId;
  const cachedReporterId = localStorage.getItem('groceryview:correctionReporterId');
  if (cachedReporterId) return cachedReporterId;
  const reporterId = `anonymous-${crypto.randomUUID()}`;
  localStorage.setItem('groceryview:correctionReporterId', reporterId);
  return reporterId;
}

export function ReportPrice({ listing = '', store = '', currentPrice }: ReportPriceProps) {
  const [listingValue, setListingValue] = useState(listing);
  const [storeValue, setStoreValue] = useState(store);
  const [observedPrice, setObservedPrice] = useState(currentPrice ? String(currentPrice) : '');
  const [photo, setPhoto] = useState('');
  const [status, setStatus] = useState<ReportPriceStatus>('idle');
  const [message, setMessage] = useState('Report a shelf price mismatch. Corrections enter qa_findings before publishing.');

  async function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');

    const response = await fetch('/api/corrections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        listing: listingValue,
        store: storeValue,
        observed_price: Number(observedPrice),
        reporterId: readReporterId(),
        ...(photo.trim() ? { photo: photo.trim() } : {})
      })
    });
    const body = await response.json() as CorrectionResponse;

    if (!response.ok) {
      setStatus('error');
      setMessage(body.error ?? 'Price correction could not be submitted.');
      return;
    }

    setStatus('ready');
    setMessage(
      body.observationUpdated
        ? 'Correction confirmed by community or staff review; the observation update is ready.'
        : `Correction ${body.correction?.id ?? ''} sent to ${body.queue ?? 'qa_findings'} (${body.confirmationCount ?? 1}/3 confirmations).`
    );
  }

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm" aria-label="Report a price correction">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Community correction</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Report a shelf price mismatch</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Submit the listing, store, observed price, and optional photo evidence. Reports land in qa_findings and only update the observation after three matching user confirmations or staff review.
      </p>
      <form className="mt-4 grid gap-3" onSubmit={submitCorrection}>
        <label className="text-sm font-black text-slate-950" htmlFor="correction-listing">
          Listing
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="correction-listing"
            onChange={(event) => setListingValue(event.target.value)}
            placeholder="Product or listing id"
            required
            value={listingValue}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="correction-store">
          Store
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="correction-store"
            onChange={(event) => setStoreValue(event.target.value)}
            placeholder="Store name or id"
            required
            value={storeValue}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="correction-observed-price">
          Observed price
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="correction-observed-price"
            min="0.01"
            onChange={(event) => setObservedPrice(event.target.value)}
            placeholder="29.90"
            required
            step="0.01"
            type="number"
            value={observedPrice}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="correction-photo">
          Photo evidence URL (optional)
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="correction-photo"
            onChange={(event) => setPhoto(event.target.value)}
            placeholder="https://example.com/shelf-photo.jpg"
            value={photo}
          />
        </label>
        <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300" disabled={status === 'loading'} type="submit">
          {status === 'loading' ? 'Sending correction…' : 'Submit correction'}
        </button>
      </form>
      <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-950" role="status">{message}</p>
    </section>
  );
}
