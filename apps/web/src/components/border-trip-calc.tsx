'use client';

import { useMemo, useState } from 'react';

const currencies = ['SEK', 'NOK', 'DKK', 'EUR'] as const;
type Currency = (typeof currencies)[number];

function formatMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat('sv-SE', { currency, style: 'currency' }).format(value);
}

export function BorderTripCalc() {
  const [currency, setCurrency] = useState<Currency>('SEK');
  const [homeBasket, setHomeBasket] = useState(1200);
  const [borderBasket, setBorderBasket] = useState(980);
  const [distanceKm, setDistanceKm] = useState(85);
  const [fuelCostPerKm, setFuelCostPerKm] = useState(1.9);

  const result = useMemo(() => {
    const roundTripDistance = Math.max(0, distanceKm) * 2;
    const travelCost = roundTripDistance * Math.max(0, fuelCostPerKm);
    const basketSavings = Math.max(0, homeBasket) - Math.max(0, borderBasket);
    const netSavings = basketSavings - travelCost;
    return { basketSavings, netSavings, roundTripDistance, travelCost };
  }, [borderBasket, distanceKm, fuelCostPerKm, homeBasket]);

  return (
    <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm" aria-labelledby="border-trip-calc-title">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Worth the trip calculator</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950" id="border-trip-calc-title">Cross-border basket savings after distance and fuel</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Enter the local basket, border basket, one-way distance, and fuel cost per kilometre to see whether the trip is a net saving or loss.
          </p>
        </div>
        <label className="text-sm font-black text-slate-950" htmlFor="border-trip-currency">
          Currency
          <select
            className="mt-2 min-h-11 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold"
            id="border-trip-currency"
            onChange={(event) => setCurrency(event.target.value as Currency)}
            value={currency}
          >
            {currencies.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <NumberInput label="Home basket" min={0} onChange={setHomeBasket} value={homeBasket} />
        <NumberInput label="Border basket" min={0} onChange={setBorderBasket} value={borderBasket} />
        <NumberInput label="Distance to border (km)" min={0} onChange={setDistanceKm} value={distanceKm} />
        <NumberInput label="Fuel cost per km" min={0} onChange={setFuelCostPerKm} step={0.1} value={fuelCostPerKm} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="Basket savings" value={formatMoney(result.basketSavings, currency)} />
        <Metric label="Round trip" value={`${result.roundTripDistance.toFixed(0)} km`} />
        <Metric label="Fuel cost" value={formatMoney(result.travelCost, currency)} />
        <Metric label={result.netSavings >= 0 ? 'Net savings' : 'Net loss'} tone={result.netSavings >= 0 ? 'positive' : 'negative'} value={formatMoney(Math.abs(result.netSavings), currency)} />
      </div>
    </section>
  );
}

function NumberInput({ label, min, onChange, step = 1, value }: { label: string; min: number; onChange: (value: number) => void; step?: number; value: number }) {
  return (
    <label className="text-sm font-black text-slate-950">
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function Metric({ label, tone = 'neutral', value }: { label: string; tone?: 'neutral' | 'positive' | 'negative'; value: string }) {
  const toneClass = tone === 'positive' ? 'text-emerald-900' : tone === 'negative' ? 'text-rose-900' : 'text-slate-950';
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{label}</p>
      <p className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}
