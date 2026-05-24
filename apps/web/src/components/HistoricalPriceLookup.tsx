'use client';

import { FormEvent, useState } from 'react';

type PriceObservation = {
  observedAt: string;
  price: number;
  currency: string;
};

type HistoricalPriceLookupProps = {
  productId: string;
  apiResource?: 'products' | 'items';
};

const defaultApiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function HistoricalPriceLookup({
  productId,
  apiResource = 'products'
}: Readonly<HistoricalPriceLookupProps>) {
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [observation, setObservation] = useState<PriceObservation | null>(null);
  const [lookupStatus, setLookupStatus] = useState('Enter a date to find the historical price for this item.');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    setObservation(null);
    setLookupStatus('Looking up price...');

    try {
      const response = await fetch(
        `${defaultApiBase}/${apiResource}/${productId}/observations?atDate=${encodeURIComponent(selectedDate)}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        setError('Could not fetch historical price. Please check the date and try again.');
        setLookupStatus('');
        return;
      }

      const observations = (await response.json()) as PriceObservation[];

      if (!observations.length) {
        setObservation(null);
        setLookupStatus('No price available for selected date.');
        return;
      }

      setObservation(observations[0]);
      setLookupStatus(`Price on ${observations[0].observedAt.slice(0, 10)} is ${observations[0].price} ${observations[0].currency}.`);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unexpected error while fetching price.');
      setLookupStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6 rounded-md border border-market-ink/10 bg-white p-4">
      <h2 className="text-sm font-bold uppercase tracking-widest text-market-ink/60">Price at specific date</h2>
      <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Date</span>
          <input
            required
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-md border border-market-ink/20 px-2 py-1"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-market-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={loading || !selectedDate}
        >
          {loading ? 'Looking up…' : 'Lookup'}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <p className="mt-3 text-sm text-market-ink/75">{lookupStatus}</p>
      {observation ? (
        <p className="mt-2 text-2xl font-black">
          {observation.price} {observation.currency}
        </p>
      ) : null}
    </section>
  );
}
