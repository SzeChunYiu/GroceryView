'use client';

import { useState } from 'react';

export type PharmacyTargetAlertProduct = {
  ean: string;
  name: string;
  chainLabel: string;
  currentPrice: number;
  currentPriceText: string;
  retrievedAt: string;
  sourceUrl: string;
};

type SavedPharmacyAlert = PharmacyTargetAlertProduct & {
  targetPrice: number;
  savedAt: string;
};

const storageKey = 'groceryview:pharmacy-target-alerts';

function readSavedAlerts(): SavedPharmacyAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]') as SavedPharmacyAlert[];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item.ean === 'string' && typeof item.targetPrice === 'number') : [];
  } catch {
    return [];
  }
}

function writeSavedAlerts(alerts: SavedPharmacyAlert[]): void {
  window.localStorage.setItem(storageKey, JSON.stringify(alerts.slice(0, 20)));
}

function formatTarget(value: number): string {
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} kr`;
}

export function PharmacyTargetAlertControls({ products }: Readonly<{ products: PharmacyTargetAlertProduct[] }>) {
  const [selectedEan, setSelectedEan] = useState(products[0]?.ean ?? '');
  const selectedProduct = products.find((product) => product.ean === selectedEan) ?? products[0];
  const [targetPrice, setTargetPrice] = useState(selectedProduct ? Math.max(1, Math.floor(selectedProduct.currentPrice * 0.9)) : 1);
  const [savedAlerts, setSavedAlerts] = useState<SavedPharmacyAlert[]>([]);
  const [status, setStatus] = useState('No pharmacy target alert is saved in this browser yet.');

  function saveAlert() {
    if (!selectedProduct || !Number.isFinite(targetPrice) || targetPrice <= 0) {
      setStatus('Choose an OTC row and enter a positive target price.');
      return;
    }
    const current = readSavedAlerts().filter((alert) => alert.ean !== selectedProduct.ean);
    const next = [{ ...selectedProduct, targetPrice, savedAt: new Date().toISOString() }, ...current];
    writeSavedAlerts(next);
    setSavedAlerts(next);
    setStatus(`Saved ${selectedProduct.name} target at ${formatTarget(targetPrice)} from public pharmacy source evidence.`);
  }

  if (products.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-amber-200 bg-white p-4 text-sm font-semibold text-slate-600">
        Pharmacy target alerts need exact-EAN public price rows before any alert preference can be saved.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-4" aria-label="Pharmacy target price alert setup">
      <div className="grid gap-3 lg:grid-cols-[1fr_10rem_auto] lg:items-end">
        <label className="text-sm font-black text-slate-950" htmlFor="pharmacy-alert-product">
          OTC product
          <select
            className="mt-2 w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="pharmacy-alert-product"
            onChange={(event) => {
              const next = products.find((product) => product.ean === event.target.value);
              setSelectedEan(event.target.value);
              if (next) setTargetPrice(Math.max(1, Math.floor(next.currentPrice * 0.9)));
            }}
            value={selectedProduct?.ean}
          >
            {products.map((product) => (
              <option key={product.ean} value={product.ean}>{product.name} · {product.currentPriceText}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="pharmacy-alert-target">
          Target
          <input
            className="mt-2 w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="pharmacy-alert-target"
            min={1}
            onChange={(event) => setTargetPrice(Math.max(1, Number(event.target.value) || 1))}
            step="0.01"
            type="number"
            value={targetPrice}
          />
        </label>
        <button className="rounded-full bg-amber-800 px-5 py-3 text-sm font-black text-white" onClick={saveAlert} type="button">
          Save alert
        </button>
      </div>
      <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-950" data-pharmacy-alert-status>
        {status}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        Saved rows stay local until account-backed pharmacy alert delivery is available. Public OTC evidence is source-only and does not imply suitability, stock, or medical advice.
      </p>
      {savedAlerts.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {savedAlerts.slice(0, 3).map((alert) => (
            <p className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-700" key={alert.ean}>
              {alert.name}: notify below {formatTarget(alert.targetPrice)} · current {alert.currentPriceText} at {alert.chainLabel} · source retrieved {alert.retrievedAt.slice(0, 10)}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
