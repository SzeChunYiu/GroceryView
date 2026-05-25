'use client';

import { useMemo, useState } from 'react';

const sekFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0,
});

function numericValue(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function BorderTripCalc() {
  const [homeBasketSek, setHomeBasketSek] = useState('1250');
  const [borderBasket, setBorderBasket] = useState('830');
  const [exchangeRate, setExchangeRate] = useState('1.55');
  const [distanceKm, setDistanceKm] = useState('110');
  const [fuelCostPerKm, setFuelCostPerKm] = useState('2.2');

  const trip = useMemo(() => {
    const homeTotal = numericValue(homeBasketSek);
    const borderTotalSek = numericValue(borderBasket) * numericValue(exchangeRate);
    const travelCost = numericValue(distanceKm) * 2 * numericValue(fuelCostPerKm);
    const netSavings = homeTotal - borderTotalSek - travelCost;

    return {
      borderTotalSek,
      travelCost,
      netSavings,
      isWorthTrip: netSavings > 0,
    };
  }, [borderBasket, distanceKm, exchangeRate, fuelCostPerKm, homeBasketSek]);

  return (
    <section className="rounded-[1.75rem] border border-orange-200 bg-orange-50 p-5 shadow-sm" aria-label="Worth the trip border calculator">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-800">Worth the trip calculator</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Border basket savings after currency, fuel, and distance</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            Compare a Swedish basket with a border basket by entering the foreign total, SEK exchange rate, one-way distance, and fuel cost per kilometre.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Swedish basket (SEK)
              <input className="mt-1 w-full rounded-2xl border border-orange-100 px-3 py-2 font-black text-slate-950" inputMode="decimal" onChange={(event) => setHomeBasketSek(event.target.value)} value={homeBasketSek} />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Border basket (foreign)
              <input className="mt-1 w-full rounded-2xl border border-orange-100 px-3 py-2 font-black text-slate-950" inputMode="decimal" onChange={(event) => setBorderBasket(event.target.value)} value={borderBasket} />
            </label>
            <label className="text-sm font-bold text-slate-700">
              SEK per foreign unit
              <input className="mt-1 w-full rounded-2xl border border-orange-100 px-3 py-2 font-black text-slate-950" inputMode="decimal" onChange={(event) => setExchangeRate(event.target.value)} value={exchangeRate} />
            </label>
            <label className="text-sm font-bold text-slate-700">
              One-way distance (km)
              <input className="mt-1 w-full rounded-2xl border border-orange-100 px-3 py-2 font-black text-slate-950" inputMode="decimal" onChange={(event) => setDistanceKm(event.target.value)} value={distanceKm} />
            </label>
            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
              Fuel cost (SEK/km)
              <input className="mt-1 w-full rounded-2xl border border-orange-100 px-3 py-2 font-black text-slate-950" inputMode="decimal" onChange={(event) => setFuelCostPerKm(event.target.value)} value={fuelCostPerKm} />
            </label>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
          <p className="text-sm font-black text-slate-950">Trip verdict</p>
          <p className={`mt-3 text-4xl font-black ${trip.isWorthTrip ? 'text-emerald-800' : 'text-rose-800'}`}>
            {trip.isWorthTrip ? 'Worth the trip' : 'Not worth it'}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-slate-600">Border basket in SEK</dt>
              <dd className="font-black text-slate-950">{sekFormatter.format(trip.borderTotalSek)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-slate-600">Round-trip fuel cost</dt>
              <dd className="font-black text-slate-950">{sekFormatter.format(trip.travelCost)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-orange-100 pt-3">
              <dt className="font-black text-slate-950">Net savings / loss</dt>
              <dd className={`font-black ${trip.isWorthTrip ? 'text-emerald-800' : 'text-rose-800'}`}>{sekFormatter.format(trip.netSavings)}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-2xl bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-950">
            Net savings = Swedish basket − converted border basket − round-trip fuel cost. Tolls, parking, and time cost stay out of this quick estimate.
          </p>
        </div>
      </div>
    </section>
  );
}
