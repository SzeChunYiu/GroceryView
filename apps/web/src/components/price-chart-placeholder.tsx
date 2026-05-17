"use client";

import { useState } from "react";

const ranges = ["7D", "30D", "90D", "1Y"] as const;

type Range = (typeof ranges)[number];

const mockSeries: Record<Range, number[]> = {
  "7D": [18, 16, 17, 15, 14, 16, 13],
  "30D": [22, 20, 21, 19, 18, 17, 19, 16, 15, 14],
  "90D": [26, 24, 22, 23, 21, 20, 18, 19, 17, 15],
  "1Y": [31, 29, 30, 27, 25, 26, 23, 21, 19, 18, 16, 15],
};

export function PriceChartPlaceholder() {
  const [activeRange, setActiveRange] = useState<Range>("30D");
  const series = mockSeries[activeRange];
  const maxValue = Math.max(...series);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Price history
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Chart placeholder
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            TradingView Lightweight Charts integration is next. This mock view keeps
            the terminal layout ready while ingestion and chart data are connected.
          </p>
        </div>

        <div className="flex rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {ranges.map((range) => {
            const isActive = activeRange === range;

            return (
              <button
                aria-pressed={isActive}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                }`}
                key={range}
                onClick={() => setActiveRange(range)}
                type="button"
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 h-64 rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-b from-emerald-50 to-white p-5 dark:border-zinc-700 dark:from-emerald-950/30 dark:to-zinc-950">
        <div className="flex h-full items-end gap-2" aria-label={`${activeRange} mock price chart`}>
          {series.map((value, index) => (
            <div
              className="flex flex-1 items-end rounded-t-xl bg-emerald-500/75 shadow-sm shadow-emerald-900/10 dark:bg-emerald-400/70"
              key={`${activeRange}-${index}-${value}`}
              style={{ height: `${Math.max(12, (value / maxValue) * 100)}%` }}
              title={`${value} SEK sample point`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span>Selected range: {activeRange}</span>
        <span>Mock SEK price movement; not live data.</span>
      </div>
    </section>
  );
}
