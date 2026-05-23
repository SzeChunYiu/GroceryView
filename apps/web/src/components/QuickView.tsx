"use client";

import { useMemo } from "react";
import { type PriceObservation } from "@/lib/openprices-products";

type StoreRow = {
  name: string;
  price: number;
};

type QuickViewProps = {
  productName: string;
  medianPrice: number;
  observations: PriceObservation[];
  stores: StoreRow[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

function buildSparkline(observations: PriceObservation[]) {
  const width = 220;
  const height = 64;
  const points = [...observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10)
    .map((obs) => obs.price);

  if (points.length < 2) {
    return {
      width,
      height,
      path: `M 8 ${height / 2} L ${width - 8} ${height / 2}`,
      min: 0,
      max: 0,
      values: points,
      dates: [...observations]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-10)
        .map((obs) => obs.date),
    };
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 0.0001);

  const coords = points.map((value, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * (width - 16) + 8;
    const y = height - ((value - min) / range) * (height - 16) - 8;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return {
    width,
    height,
    path: `M ${coords.join(" L ")}`,
    min,
    max,
    values: points,
    dates: [...observations]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)
      .map((obs) => obs.date),
  };
}

export function QuickView({
  productName,
  medianPrice,
  observations,
  stores,
}: Readonly<QuickViewProps>) {
  const limitedStores = stores.slice(0, 4);
  const history = useMemo(() => buildSparkline(observations), [observations]);

  return (
    <div
      role="status"
      className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-64 rounded-xl border border-market-ink/15 bg-white p-3 shadow-lg"
      aria-label={`Quick view for ${productName}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-market-ink/55">Quick view</p>
      <p className="mt-1 font-black text-lg">{formatCurrency(medianPrice)}</p>

      <div className="mt-3 rounded-lg border border-market-oat bg-market-oat/20 p-2 text-xs">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.15em] text-market-ink/60">
          <span>Price history</span>
          <span>
            {history.min === history.max ? "No variation" : `${formatCurrency(history.min)} – ${formatCurrency(history.max)}`}
          </span>
        </div>
        <svg
          width={history.width}
          height={history.height}
          viewBox={`0 0 ${history.width} ${history.height}`}
          className="mt-2 w-full"
          aria-hidden="true"
        >
          <polyline
            points={history.path.replace(/^M /, "")}
            fill="none"
            stroke="#0f172a"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mt-3 text-xs">
        <p className="mb-2 font-black uppercase tracking-[0.2em] text-market-ink/55">Stores</p>
        <ul className="space-y-1 text-[12px] font-semibold text-market-ink/75">
          {limitedStores.length > 0 ? limitedStores.map((store) => (
            <li key={store.name} className="flex items-center justify-between gap-3">
              <span className="truncate">{store.name}</span>
              <span className="shrink-0 font-black text-market-ink">{formatCurrency(store.price)}</span>
            </li>
          )) : (
            <li className="text-market-ink/45">No store observations yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
