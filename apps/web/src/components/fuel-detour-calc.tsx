'use client';

import { useMemo, useState } from 'react';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export function FuelDetourCalc() {
  const [extraKm, setExtraKm] = useState(8);
  const [tankLitres, setTankLitres] = useState(45);
  const [orePerLitre, setOrePerLitre] = useState(35);
  const [consumption, setConsumption] = useState(0.7);
  const [tripFuelPrice, setTripFuelPrice] = useState(19);

  const result = useMemo(() => {
    const grossSavings = tankLitres * (orePerLitre / 100);
    const detourCost = extraKm * consumption * tripFuelPrice;
    return grossSavings - detourCost;
  }, [consumption, extraKm, orePerLitre, tankLitres, tripFuelPrice]);

  return (
    <section className="mt-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Worth driving?</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Fuel detour calculator</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        Estimate whether driving extra kilometres for a cheaper pump price pays off. Enter the round-trip detour, tank size, and price gap in öre per litre.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <label className="text-sm font-bold text-slate-700">Extra km
          <input className="mt-1 w-full rounded-2xl border border-amber-200 px-3 py-2" min="0" step="0.1" type="number" value={extraKm} onChange={(event) => setExtraKm(Number(event.target.value))} />
        </label>
        <label className="text-sm font-bold text-slate-700">Tank litres
          <input className="mt-1 w-full rounded-2xl border border-amber-200 px-3 py-2" min="0" step="1" type="number" value={tankLitres} onChange={(event) => setTankLitres(Number(event.target.value))} />
        </label>
        <label className="text-sm font-bold text-slate-700">Öre/L gap
          <input className="mt-1 w-full rounded-2xl border border-amber-200 px-3 py-2" step="1" type="number" value={orePerLitre} onChange={(event) => setOrePerLitre(Number(event.target.value))} />
        </label>
        <label className="text-sm font-bold text-slate-700">L/km
          <input className="mt-1 w-full rounded-2xl border border-amber-200 px-3 py-2" min="0" step="0.01" type="number" value={consumption} onChange={(event) => setConsumption(Number(event.target.value))} />
        </label>
        <label className="text-sm font-bold text-slate-700">Trip fuel kr/L
          <input className="mt-1 w-full rounded-2xl border border-amber-200 px-3 py-2" min="0" step="0.01" type="number" value={tripFuelPrice} onChange={(event) => setTripFuelPrice(Number(event.target.value))} />
        </label>
      </div>
      <p className={result >= 0 ? 'mt-4 text-3xl font-black text-emerald-800' : 'mt-4 text-3xl font-black text-rose-700'}>
        Net {result >= 0 ? 'savings' : 'loss'}: {formatSek(result)}
      </p>
    </section>
  );
}
