'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type LineStyleName = 'solid' | 'dashed' | 'dotted';
type ChartLoadStatus = 'idle' | 'loading' | 'ready' | 'failed';
type LightweightChartsModule = typeof import('lightweight-charts');
type LightweightChartsValues = Pick<LightweightChartsModule, 'ColorType' | 'LineSeries' | 'LineStyle' | 'createChart'>;

let lightweightChartsModulePromise: Promise<LightweightChartsModule> | null = null;

function loadLightweightCharts() {
  lightweightChartsModulePromise ??= import('lightweight-charts');
  return lightweightChartsModulePromise;
}

export type PriceChartTerminalSeries = {
  id: string;
  storeName: string;
  sourceType: string;
  lineStyle: LineStyleName;
  points: Array<{
    time: string;
    value: number;
    confidence: number;
    lowerBound?: number;
    upperBound?: number;
    provenanceLabel?: string;
  }>;
  markers: Array<{
    time: string;
    text: string;
    color: string;
    provenanceLabel?: string;
  }>;
};

export type PriceChartTerminalWindow = {
  label: '1W' | '1M' | '3M' | '1Y' | 'ALL';
  rangeLabel: string;
  windowStart?: string;
  windowEnd?: string;
  pointCount: number;
  markerCount: number;
  latestValueLabel: string;
  latestObservedAt?: string;
  lowValueLabel: string;
  highValueLabel: string;
  series: PriceChartTerminalSeries[];
};

export type PriceChartTerminalModel = {
  available: boolean;
  title: string;
  sourceLabel: string;
  confidenceLabel: string;
  caveat: string;
  defaultWindow: PriceChartTerminalWindow['label'];
  windows: PriceChartTerminalWindow[];
};

function lineStyleFor(lineStyle: LineStyleName, lineStyles: LightweightChartsValues['LineStyle']) {
  if (lineStyle === 'dotted') return lineStyles.Dotted;
  if (lineStyle === 'dashed') return lineStyles.Dashed;
  return lineStyles.Solid;
}

function chartColorFor(index: number) {
  return ['#047857', '#0f766e', '#2563eb', '#7c3aed'][index % 4]!;
}

function bandColorFor(index: number) {
  return ['rgba(4, 120, 87, 0.38)', 'rgba(15, 118, 110, 0.38)', 'rgba(37, 99, 235, 0.34)', 'rgba(124, 58, 237, 0.34)'][index % 4]!;
}

function volatilityBandForPoint(point: PriceChartTerminalSeries['points'][number]) {
  if (point.lowerBound !== undefined && point.upperBound !== undefined) {
    return {
      lower: point.lowerBound,
      upper: point.upperBound
    };
  }
  const confidence = Math.max(0, Math.min(1, point.confidence));
  const margin = Math.max(0.03, (1 - confidence) * 0.18);
  return {
    lower: Math.max(0, Math.round((point.value * (1 - margin) + Number.EPSILON) * 100) / 100),
    upper: Math.round((point.value * (1 + margin) + Number.EPSILON) * 100) / 100
  };
}

function latestVolatilityBandLabel(series: PriceChartTerminalSeries) {
  const point = series.points.at(-1);
  if (!point) return 'no band';
  const band = volatilityBandForPoint(point);
  return `${band.lower.toLocaleString('sv-SE')}–${band.upper.toLocaleString('sv-SE')}`;
}

export function PriceChartTerminal({ chart }: Readonly<{ chart: PriceChartTerminalModel }>) {
  const [activeWindowLabel, setActiveWindowLabel] = useState(chart.defaultWindow);
  const [chartLoadError, setChartLoadError] = useState<string | null>(null);
  const [chartLoadStatus, setChartLoadStatus] = useState<ChartLoadStatus>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWindow = useMemo(
    () => chart.windows.find((window) => window.label === activeWindowLabel) ?? chart.windows[0],
    [activeWindowLabel, chart.windows]
  );
  const firstSeries = activeWindow?.series[0];
  const latestPoint = firstSeries?.points.at(-1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !chart.available || !activeWindow || activeWindow.series.length === 0) return;

    let isDisposed = false;
    let removeChart: (() => void) | undefined;
    setChartLoadError(null);
    setChartLoadStatus('loading');

    loadLightweightCharts()
      .then(({ ColorType, LineSeries, LineStyle, createChart }: LightweightChartsValues) => {
        if (isDisposed || !container.isConnected) return;
        const chartApi = createChart(container, {
          autoSize: true,
          height: 280,
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#334155'
          },
          grid: {
            vertLines: { color: 'rgba(148, 163, 184, 0.16)' },
            horzLines: { color: 'rgba(148, 163, 184, 0.18)' }
          },
          rightPriceScale: { borderColor: 'rgba(15, 23, 42, 0.12)' },
          timeScale: {
            borderColor: 'rgba(15, 23, 42, 0.12)',
            timeVisible: true
          },
          crosshair: {
            vertLine: { color: '#0f766e', style: LineStyle.Dashed },
            horzLine: { color: '#0f766e', style: LineStyle.Dashed }
          }
        });

        activeWindow.series.forEach((series, index) => {
          const bandColor = bandColorFor(index);
          const lowerBand = chartApi.addSeries(LineSeries, {
            color: bandColor,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            lastValueVisible: false,
            priceLineVisible: false
          });
          lowerBand.setData(series.points.map((point) => ({
            time: point.time.slice(0, 10),
            value: volatilityBandForPoint(point).lower
          })));

          const line = chartApi.addSeries(LineSeries, {
            color: chartColorFor(index),
            lineWidth: 3,
            lineStyle: lineStyleFor(series.lineStyle, LineStyle),
            lastValueVisible: true,
            priceLineVisible: true
          });
          line.setData(series.points.map((point) => ({
            time: point.time.slice(0, 10),
            value: point.value
          })));

          const upperBand = chartApi.addSeries(LineSeries, {
            color: bandColor,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            lastValueVisible: false,
            priceLineVisible: false
          });
          upperBand.setData(series.points.map((point) => ({
            time: point.time.slice(0, 10),
            value: volatilityBandForPoint(point).upper
          })));
        });

        chartApi.timeScale().fitContent();
        removeChart = () => chartApi.remove();
        setChartLoadStatus('ready');
      })
      .catch((error: unknown) => {
        if (isDisposed) return;
        setChartLoadError(error instanceof Error ? error.message : 'Unknown chart renderer error');
        setChartLoadStatus('failed');
      });

    return () => {
      isDisposed = true;
      removeChart?.();
    };
  }, [activeWindow, chart.available]);

  return (
    <section className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-xl md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Price chart terminal</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">{chart.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{chart.caveat}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">{chart.sourceLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-black text-emerald-100">
          crosshair value readout: {latestPoint ? `${activeWindow.latestValueLabel} · ${latestPoint.time.slice(0, 10)}` : 'no point selected'}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Price chart timeframe selector">
        {chart.windows.map((window) => (
          <button
            className={`rounded-full px-4 py-2 text-sm font-black motion-safe:transition ${
              window.label === activeWindow?.label
                ? 'bg-emerald-300 text-emerald-950'
                : 'border border-white/15 bg-white/10 text-slate-200 hover:border-emerald-300'
            }`}
            key={window.label}
            onClick={() => setActiveWindowLabel(window.label)}
            type="button"
          >
            {window.label}
          </button>
        ))}
      </div>

      {chart.available && activeWindow && activeWindow.pointCount > 0 ? (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-slate-200">
              Window: <span className="text-white">{activeWindow.rangeLabel}</span>
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-slate-200">
              Latest: <span className="text-white">{activeWindow.latestValueLabel}</span>
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-slate-200">
              Range: <span className="text-white">{activeWindow.lowValueLabel} → {activeWindow.highValueLabel}</span>
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-slate-200">
              Points/markers: <span className="text-white">{activeWindow.pointCount}/{activeWindow.markerCount}</span>
            </p>
          </div>
          <p aria-live="polite" className="sr-only">Chart renderer status: {chartLoadStatus}</p>
          <div ref={containerRef} className="mt-5 h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-white" />
          {chartLoadStatus === 'loading' ? (
            <p className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-xs font-bold text-slate-200">
              Loading interactive lightweight-charts renderer after the product data is visible.
            </p>
          ) : null}
          {chartLoadStatus === 'failed' ? (
            <p className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs font-bold text-amber-100">
              Interactive chart renderer failed to load; the verified price ranges and series summaries remain visible. {chartLoadError}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {activeWindow.series.map((series) => (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4" key={series.id}>
                <p className="text-sm font-black text-white">{series.storeName} · {series.sourceType}</p>
                <p className="mt-1 text-xs font-semibold text-slate-300">lineStyle {series.lineStyle} · {series.points.length} points · {series.markers.length} markers</p>
                <p className="mt-2 text-xs font-bold text-emerald-100">
                  Expected band: {latestVolatilityBandLabel(series)} around latest observed price.
                </p>
                {series.markers.length > 0 ? (
                  <p className="mt-3 rounded-xl bg-slate-950/70 p-3 text-xs font-bold text-emerald-100">
                    Latest marker: {series.markers.at(-1)?.text} · {series.markers.at(-1)?.time.slice(0, 10)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">
          {chart.caveat}
        </p>
      )}

      <p className="mt-4 text-xs font-semibold text-slate-400">{chart.sourceLabel} · {chart.confidenceLabel}</p>
    </section>
  );
}
