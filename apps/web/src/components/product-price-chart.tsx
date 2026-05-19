"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";

type Range = "7D" | "30D" | "90D" | "1Y";
type PriceConfidence = "verified" | "high" | "medium" | "low" | "estimated";
type PriceType = "regular" | "promotion" | "estimated";

type BusinessDay = {
  year: number;
  month: number;
  day: number;
};

type PricePoint = {
  time: BusinessDay;
  value: number;
  confidence: PriceConfidence;
  priceType: PriceType;
};

type StoreSeries = {
  store: string;
  color: string;
  points: PricePoint[];
};

const ranges: readonly Range[] = ["7D", "30D", "90D", "1Y"];

const rangeData: Record<Range, StoreSeries[]> = {
  "7D": [
    {
      store: "Willys Odenplan",
      color: "#0284c7",
      points: [
        { time: { year: 2026, month: 5, day: 10 }, value: 52.9, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 11 }, value: 50.9, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 12 }, value: 48.9, confidence: "high", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 13 }, value: 47.1, confidence: "medium", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 14 }, value: 49.4, confidence: "medium", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 15 }, value: 49.1, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 16 }, value: 49.9, confidence: "estimated", priceType: "estimated" },
      ],
    },
    {
      store: "ICA Kvantum Liljeholmen",
      color: "#16a34a",
      points: [
        { time: { year: 2026, month: 5, day: 10 }, value: 55.9, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 11 }, value: 55.4, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 12 }, value: 54.8, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 13 }, value: 54.5, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 14 }, value: 54.2, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 15 }, value: 54.1, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 16 }, value: 54.6, confidence: "high", priceType: "regular" },
      ],
    },
    {
      store: "Coop Farsta",
      color: "#d97706",
      points: [
        { time: { year: 2026, month: 5, day: 10 }, value: 60.4, confidence: "estimated", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 11 }, value: 59.8, confidence: "low", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 12 }, value: 59.2, confidence: "low", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 13 }, value: 58.9, confidence: "estimated", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 14 }, value: 58.5, confidence: "estimated", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 15 }, value: 58.0, confidence: "estimated", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 16 }, value: 57.4, confidence: "estimated", priceType: "estimated" },
      ],
    },
  ],
  "30D": [
    {
      store: "Willys Odenplan",
      color: "#0284c7",
      points: [
        { time: { year: 2026, month: 4, day: 18 }, value: 57.1, confidence: "medium", priceType: "promotion" },
        { time: { year: 2026, month: 4, day: 23 }, value: 56.2, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 4, day: 28 }, value: 55.1, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 3 }, value: 54.6, confidence: "high", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 8 }, value: 53.6, confidence: "high", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 12 }, value: 52.4, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 16 }, value: 52.0, confidence: "verified", priceType: "regular" },
      ],
    },
    {
      store: "ICA Kvantum Liljeholmen",
      color: "#16a34a",
      points: [
        { time: { year: 2026, month: 4, day: 18 }, value: 61.1, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 4, day: 23 }, value: 60.2, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 4, day: 28 }, value: 59.4, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 3 }, value: 58.4, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 8 }, value: 58.0, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 12 }, value: 57.2, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 16 }, value: 56.8, confidence: "verified", priceType: "regular" },
      ],
    },
    {
      store: "Coop Farsta",
      color: "#d97706",
      points: [
        { time: { year: 2026, month: 4, day: 18 }, value: 66.7, confidence: "estimated", priceType: "estimated" },
        { time: { year: 2026, month: 4, day: 23 }, value: 66.1, confidence: "low", priceType: "estimated" },
        { time: { year: 2026, month: 4, day: 28 }, value: 65.0, confidence: "low", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 3 }, value: 64.1, confidence: "low", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 8 }, value: 63.9, confidence: "low", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 12 }, value: 63.2, confidence: "estimated", priceType: "estimated" },
        { time: { year: 2026, month: 5, day: 16 }, value: 62.4, confidence: "estimated", priceType: "estimated" },
      ],
    },
  ],
  "90D": [
    {
      store: "Willys Odenplan",
      color: "#0284c7",
      points: [
        { time: { year: 2026, month: 3, day: 18 }, value: 53.8, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 3, day: 31 }, value: 52.9, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 4, day: 13 }, value: 52.4, confidence: "high", priceType: "promotion" },
        { time: { year: 2026, month: 4, day: 26 }, value: 51.6, confidence: "high", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 6 }, value: 50.4, confidence: "medium", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 12 }, value: 50.1, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 16 }, value: 49.9, confidence: "verified", priceType: "regular" },
      ],
    },
    {
      store: "ICA Kvantum Liljeholmen",
      color: "#16a34a",
      points: [
        { time: { year: 2026, month: 3, day: 18 }, value: 58.2, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 3, day: 31 }, value: 57.9, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 4, day: 13 }, value: 57.0, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 4, day: 26 }, value: 56.6, confidence: "verified", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 6 }, value: 55.7, confidence: "high", priceType: "promotion" },
        { time: { year: 2026, month: 5, day: 12 }, value: 55.1, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 16 }, value: 54.6, confidence: "verified", priceType: "regular" },
      ],
    },
  ],
  "1Y": [
    {
      store: "Willys Odenplan",
      color: "#0284c7",
      points: [
        { time: { year: 2025, month: 6, day: 1 }, value: 57.9, confidence: "verified", priceType: "regular" },
        { time: { year: 2025, month: 8, day: 1 }, value: 54.9, confidence: "verified", priceType: "promotion" },
        { time: { year: 2025, month: 10, day: 1 }, value: 52.3, confidence: "high", priceType: "promotion" },
        { time: { year: 2025, month: 12, day: 1 }, value: 50.7, confidence: "high", priceType: "promotion" },
        { time: { year: 2026, month: 2, day: 1 }, value: 50.2, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 4, day: 1 }, value: 49.8, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 16 }, value: 49.9, confidence: "verified", priceType: "regular" },
      ],
    },
    {
      store: "ICA Kvantum Liljeholmen",
      color: "#16a34a",
      points: [
        { time: { year: 2025, month: 6, day: 1 }, value: 61.1, confidence: "verified", priceType: "regular" },
        { time: { year: 2025, month: 8, day: 1 }, value: 59.6, confidence: "verified", priceType: "regular" },
        { time: { year: 2025, month: 10, day: 1 }, value: 57.8, confidence: "verified", priceType: "promotion" },
        { time: { year: 2025, month: 12, day: 1 }, value: 55.8, confidence: "verified", priceType: "promotion" },
        { time: { year: 2026, month: 2, day: 1 }, value: 53.6, confidence: "verified", priceType: "regular" },
        { time: { year: 2026, month: 4, day: 1 }, value: 52.3, confidence: "high", priceType: "regular" },
        { time: { year: 2026, month: 5, day: 16 }, value: 51.1, confidence: "verified", priceType: "regular" },
      ],
    },
  ],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    currency: "SEK",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function isDotted(confidence: PriceConfidence) {
  return confidence === "low" || confidence === "estimated";
}

function confidenceLabel(confidence: PriceConfidence) {
  if (confidence === "verified") {
    return "Verified";
  }
  if (confidence === "high") {
    return "High confidence";
  }
  if (confidence === "medium") {
    return "Medium confidence";
  }
  if (confidence === "low") {
    return "Low confidence";
  }
  return "Estimated";
}

export function ProductPriceChart() {
  const [activeRange, setActiveRange] = useState<Range>("30D");
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const stores = rangeData[activeRange];

  const legendRows = useMemo(() => {
    return stores.map((store) => {
      const latest = store.points.at(-1);
      return {
        color: store.color,
        confidence: latest ? confidenceLabel(latest.confidence) : "No data",
        priceType: latest?.priceType ?? "estimated",
        store: store.store,
        value: latest?.value ?? 0,
      };
    });
  }, [stores]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    const chart = createChart(container, {
      height: container.clientHeight,
      width: container.clientWidth,
      crosshair: {
        horzLine: { color: "rgba(37, 99, 235, 0.35)" },
        vertLine: { color: "rgba(37, 99, 235, 0.35)" },
      },
      grid: {
        horzLines: { color: "rgba(113, 113, 122, 0.12)" },
        vertLines: { color: "rgba(113, 113, 122, 0.08)" },
      },
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
    });

    stores.forEach((store) => {
      const highConfidencePoints = store.points
        .filter((point) => !isDotted(point.confidence))
        .map((point) => ({ time: point.time, value: point.value }));
      const lowConfidencePoints = store.points
        .filter((point) => isDotted(point.confidence))
        .map((point) => ({ time: point.time, value: point.value }));

      if (highConfidencePoints.length > 1) {
        const verifiedSeries = chart.addSeries(LineSeries, {
          color: store.color,
          lastValueVisible: false,
          lineStyle: LineStyle.Solid,
          lineWidth: 3,
          priceLineVisible: false,
        });

        verifiedSeries.setData(highConfidencePoints);
        createSeriesMarkers(
          verifiedSeries,
          store.points
            .filter((point) => point.priceType === "promotion" && !isDotted(point.confidence))
            .map((point) => ({
              color: store.color,
              position: "belowBar",
              shape: "circle",
              text: "Promo",
              time: point.time,
            })),
        );
      }

      if (lowConfidencePoints.length > 1) {
        const estimatedSeries = chart.addSeries(LineSeries, {
          color: `${store.color}99`,
          lastValueVisible: false,
          lineStyle: LineStyle.Dotted,
          lineWidth: 2,
          priceLineVisible: false,
        });

        estimatedSeries.setData(lowConfidencePoints);
      }
    });

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chart.resize(entry.contentRect.width, entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [stores]);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Price history
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Multi-store price terminal
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Solid lines represent verified or high-confidence observations. Dotted lines represent estimated or low-confidence data.
            Promo markers call out temporary promotions.
          </p>
        </div>

        <div className="flex flex-wrap rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
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
        <div ref={chartContainerRef} className="h-full w-full" aria-label={`Price history chart ${activeRange}`} />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>Selected range: {activeRange}</span>
          <span>Legend: solid = verified/high confidence, dotted = estimated/low confidence</span>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {legendRows.map((row) => (
            <article
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
              key={row.store}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">{row.store}</p>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-lg font-semibold">{formatCurrency(row.value)}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {row.priceType} - {row.confidence}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
