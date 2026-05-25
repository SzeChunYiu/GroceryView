'use client';

import { useMemo, useState } from 'react';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

function numeric(value: string, fallback: number) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function FuelDetourCalc({ currentFuelPrice = 18.99 }: Readonly<{ currentFuelPrice?: number }>) {
  const [extraKm, setExtraKm] = useState('8');
  const [tankLitres, setTankLitres] = useState('45');
  const [priceDiffOre, setPriceDiffOre] = useState('35');

  const result = useMemo(() => {
    const detourKm = numeric(extraKm, 0);
    const litres = numeric(tankLitres, 0);
    const ore = numeric(priceDiffOre, 0);
    const grossSavings = litres * (ore / 100);
    const detourCost = (detourKm / 100) * 7 * currentFuelPrice;
    const netSavings = grossSavings - detourCost;
    const breakEvenOre = litres > 0 ? (detourCost / litres) * 100 : 0;

    return { breakEvenOre, detourCost, grossSavings, netSavings };
  }, [currentFuelPrice, extraKm, priceDiffOre, tankLitres]);

  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm" aria-label="Worth driving for fuel calculator">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Worth driving for X öre/L?</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Fuel detour savings calculator</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
        Estimate whether a cheaper pump offsets the extra trip distance. Detour cost assumes 7 L/100 km at {formatSek(currentFuelPrice)}/L.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-black text-slate-700">
          Extra kilometres
          <input className="mt-1 w-full rounded-xl border border-amber-200 px-3 py-2 text-slate-950" inputMode="decimal" onChange={(event) => setExtraKm(event.target.value)} value={extraKm} />
        </label>
        <label className="text-sm font-black text-slate-700">
          Tank size (L)
          <input className="mt-1 w-full rounded-xl border border-amber-200 px-3 py-2 text-slate-950" inputMode="decimal" onChange={(event) => setTankLitres(event.target.value)} value={tankLitres} />
        </label>
        <label className="text-sm font-black text-slate-700">
          Price difference (öre/L)
          <input className="mt-1 w-full rounded-xl border border-amber-200 px-3 py-2 text-slate-950" inputMode="decimal" onChange={(event) => setPriceDiffOre(event.target.value)} value={priceDiffOre} />
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700">Gross pump saving <span className="block text-xl font-black text-slate-950">{formatSek(result.grossSavings)}</span></p>
        <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700">Detour fuel cost <span className="block text-xl font-black text-slate-950">{formatSek(result.detourCost)}</span></p>
        <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700">Net result <span className={result.netSavings >= 0 ? 'block text-xl font-black text-emerald-800' : 'block text-xl font-black text-rose-800'}>{formatSek(result.netSavings)}</span></p>
      </div>
      <p className="mt-3 text-sm font-bold text-amber-950">
        Break-even discount: {result.breakEvenOre.toFixed(0)} öre/L. {result.netSavings >= 0 ? 'This detour is worth it on fuel alone.' : 'This detour loses money on fuel alone.'}
      </p>
    </section>
  );
}
