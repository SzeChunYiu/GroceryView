'use client';

import { FormEvent, useState } from 'react';

type ReportPricePayload = {
  itemId: string;
  reportedPrice: number;
  storeName?: string;
  observedAt?: string;
  notes?: string;
};

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

type ReportPriceDialogProps = Readonly<{
  itemId: string;
  itemLabel: string;
}>;

export function ReportPriceDialog({ itemId, itemLabel }: ReportPriceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportedPrice, setReportedPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [observedAt, setObservedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = Boolean(reportedPrice.trim());
  const isSubmitting = submissionState === 'submitting';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number.parseFloat(reportedPrice);
    if (Number.isNaN(parsedPrice)) {
      setErrorMessage('Please enter a valid price.');
      return;
    }

    const payload: ReportPricePayload = {
      itemId,
      reportedPrice: parsedPrice
    };

    if (storeName.trim()) payload.storeName = storeName.trim();
    if (observedAt.trim()) payload.observedAt = observedAt.trim();
    if (notes.trim()) payload.notes = notes.trim();

    setSubmissionState('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/reports/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Could not submit report');
      }

      setSubmissionState('success');
      setReportedPrice('');
      setStoreName('');
      setObservedAt('');
      setNotes('');
      setTimeout(() => {
        setIsOpen(false);
        setSubmissionState('idle');
      }, 1000);
    } catch (error) {
      setSubmissionState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Could not submit report.');
    }
  }

  const buttonStyle = 'rounded-lg border border-market-ink/20 px-4 py-2 text-sm font-semibold hover:bg-market-ink/5';

  return (
    <section className="mt-6 rounded-lg border border-market-ink/10 bg-white p-6">
      <h2 className="text-2xl font-black">Report a price difference</h2>
      <p className="mt-2 text-sm text-market-ink/65">
        Use this form to queue a price correction for manual review for <span className="font-semibold">{itemLabel}</span>.
      </p>

      {!isOpen ? (
        <button className="mt-4 inline-flex h-10 items-center rounded-lg bg-market-mint px-4 text-sm font-bold text-zinc-950" type="button" onClick={() => setIsOpen(true)}>
          Report price for this item
        </button>
      ) : null}

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold">Observed price (SEK)</span>
            <input
              className="rounded-md border border-market-ink/25 px-3 py-2 text-sm"
              type="number"
              step="0.01"
              min="0"
              value={reportedPrice}
              onChange={(event) => setReportedPrice(event.target.value)}
              required
              inputMode="decimal"
              aria-label="Reported price"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold">Store name</span>
            <input
              className="rounded-md border border-market-ink/25 px-3 py-2 text-sm"
              type="text"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="e.g. Willys Odenplan"
              aria-label="Store name"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold">Observed at</span>
            <input
              className="rounded-md border border-market-ink/25 px-3 py-2 text-sm"
              type="date"
              value={observedAt}
              onChange={(event) => setObservedAt(event.target.value)}
              aria-label="Observed date"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold">Additional notes</span>
            <textarea
              className="rounded-md border border-market-ink/25 px-3 py-2 text-sm"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Any extra details helpful for admin review."
              aria-label="Notes"
            />
          </label>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              className={`h-10 rounded-lg bg-market-mint px-4 text-sm font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60`}
              type="submit"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Submit report'}
            </button>
            <button className={buttonStyle} type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
          </div>

          {submissionState === 'success' ? (
            <p className="text-sm font-semibold text-green-700">Report queued for admin review.</p>
          ) : null}
          {submissionState === 'error' ? <p className="text-sm font-semibold text-red-700">{errorMessage}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
