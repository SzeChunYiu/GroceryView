'use client';

import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { buildPriceHistorySparklinePath } from '@/lib/price-events';
import { buildPriceChartTerminalMoveNotes, formatPriceChartTerminalReadout } from '../lib/price-chart-terminal-readout.js';
export { buildPriceChartTerminalMoveNotes, formatPriceChartTerminalReadout, priceChartTerminalLatestPoint } from '../lib/price-chart-terminal-readout.js';

/**
 * Renders the interactive price-history terminal for a product, including
 * timeframe controls, value summaries, series provenance, and a lazy-loaded
 * lightweight-charts line chart.
 *
 * | Prop | Description |
 * | --- | --- |
 * | `chart` | Prepared chart view model containing availability, labels, windows, series, and caveat copy. |
 *
 * @example
 * ```tsx
 * <PriceChartTerminal chart={priceChartModel} />
 * ```
 *
 * @param chart Prepared price chart model used to render terminal copy, windows, series, and fallback state.
 */
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
    type?: 'promotion' | 'member' | 'new_low' | 'price_change' | 'receipt_confirmed' | 'source_warning';
    text: string;
    color: string;
    sourceType?: string;
    provenanceLabel?: string;
  }>;
};

export type PriceChartTerminalForecast = {
  available: boolean;
  title: string;
  horizonLabel: string;
  summary: string;
  caveat: string;
  points: Array<{
    time: string;
    value: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
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
  forecast?: PriceChartTerminalForecast;
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

function csvEscape(value: string | number | undefined) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function priceHistoryCsv(window: PriceChartTerminalWindow | undefined, series: PriceChartTerminalSeries[]) {
  if (!window) return '';
  const rows = [
    ['window', 'series_id', 'store_name', 'source_type', 'date', 'price', 'confidence', 'provenance'],
    ...series.flatMap((item) => item.points.map((point) => [
      window.label,
      item.id,
      item.storeName,
      item.sourceType,
      point.time.slice(0, 10),
      point.value,
      point.confidence,
      point.provenanceLabel ?? ''
    ]))
  ];
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

export function PriceChartTerminal({ chart }: Readonly<{ chart: PriceChartTerminalModel }>) {
  const [activeWindowLabel, setActiveWindowLabel] = useState(chart.defaultWindow);
  const [chartLoadError, setChartLoadError] = useState<string | null>(null);
  const [chartLoadStatus, setChartLoadStatus] = useState<ChartLoadStatus>('idle');
  const [overlaySeriesIds, setOverlaySeriesIds] = useState<string[]>([]);
  const chartRendererStatusId = useId();
  const chartSelectorDescriptionId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWindow = useMemo(
    () => chart.windows.find((window) => window.label === activeWindowLabel) ?? chart.windows[0],
    [activeWindowLabel, chart.windows]
  );
  const overlayControlAvailable = (activeWindow?.series.length ?? 0) > 1;
  const availableOverlaySeriesIds = useMemo(() => activeWindow?.series.map((series) => series.id) ?? [], [activeWindow]);
  const selectedOverlaySeriesIds = useMemo(
    () => overlaySeriesIds.filter((id) => availableOverlaySeriesIds.includes(id)),
    [availableOverlaySeriesIds, overlaySeriesIds]
  );
  const effectiveOverlaySeriesIds = useMemo(
    () => overlayControlAvailable
      ? (selectedOverlaySeriesIds.length > 0 ? selectedOverlaySeriesIds : availableOverlaySeriesIds.slice(0, 2)).slice(0, 2)
      : availableOverlaySeriesIds,
    [availableOverlaySeriesIds, overlayControlAvailable, selectedOverlaySeriesIds]
  );
  const visibleSeries = useMemo(
    () => activeWindow?.series.filter((series) => effectiveOverlaySeriesIds.includes(series.id)) ?? [],
    [activeWindow, effectiveOverlaySeriesIds]
  );
  const visiblePointCount = visibleSeries.reduce((total, series) => total + series.points.length, 0);
  const visibleMarkerCount = visibleSeries.reduce((total, series) => total + series.markers.length, 0);
  const latestReadout = formatPriceChartTerminalReadout(activeWindow);
  const priceMoveNotes = useMemo(
    () => activeWindow ? buildPriceChartTerminalMoveNotes({ ...activeWindow, series: visibleSeries }, 5) : [],
    [activeWindow, visibleSeries]
  );
  const csvDownloadHref = useMemo(() => {
    const csv = priceHistoryCsv(activeWindow, visibleSeries);
    return csv ? `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}` : '#';
  }, [activeWindow, visibleSeries]);
  const handleWindowKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    windowLabel: PriceChartTerminalWindow['label']
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setActiveWindowLabel(windowLabel);
  };
  const toggleOverlaySeries = (seriesId: string) => {
    setOverlaySeriesIds((current) => {
      const available = new Set(availableOverlaySeriesIds);
      const selected = current.filter((id) => available.has(id));
      const baseSelection = selected.length > 0 ? selected : availableOverlaySeriesIds.slice(0, 2);
      if (baseSelection.includes(seriesId)) {
        return baseSelection.length <= 1 ? baseSelection : baseSelection.filter((id) => id !== seriesId);
      }

      return [...baseSelection.slice(-1), seriesId];
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !chart.available || !activeWindow || visibleSeries.length === 0) return;

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

        visibleSeries.forEach((series, index) => {
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

        if (activeWindow.forecast?.available && activeWindow.forecast.points.length > 0) {
          const forecastBandColor = 'rgba(245, 158, 11, 0.42)';
          const latestHistoricalPoint = visibleSeries
            .flatMap((series) => series.points)
            .sort((a, b) => a.time.localeCompare(b.time))
            .at(-1);
          const forecastPoints = latestHistoricalPoint
            ? [
              {
                time: latestHistoricalPoint.time,
                value: latestHistoricalPoint.value,
                lowerBound: latestHistoricalPoint.value,
                upperBound: latestHistoricalPoint.value
              },
              ...activeWindow.forecast.points
            ]
            : activeWindow.forecast.points;
          const forecastLowerBand = chartApi.addSeries(LineSeries, {
            color: forecastBandColor,
            lineWidth: 2,
            lineStyle: LineStyle.Dotted,
            lastValueVisible: false,
            priceLineVisible: false
          });
          forecastLowerBand.setData(forecastPoints.map((point) => ({
            time: point.time.slice(0, 10),
            value: point.lowerBound
          })));

          const forecastLine = chartApi.addSeries(LineSeries, {
            color: '#f59e0b',
            lineWidth: 3,
            lineStyle: LineStyle.Dashed,
            lastValueVisible: true,
            priceLineVisible: true
          });
          forecastLine.setData(forecastPoints.map((point) => ({
            time: point.time.slice(0, 10),
            value: point.value
          })));

          const forecastUpperBand = chartApi.addSeries(LineSeries, {
            color: forecastBandColor,
            lineWidth: 2,
            lineStyle: LineStyle.Dotted,
            lastValueVisible: false,
            priceLineVisible: false
          });
          forecastUpperBand.setData(forecastPoints.map((point) => ({
            time: point.time.slice(0, 10),
            value: point.upperBound
          })));
        }

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
  }, [activeWindow, chart.available, visibleSeries]);

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
          crosshair value readout: {latestReadout}
        </div>
      </div>

      <p id={chartSelectorDescriptionId} className="sr-only">
        Choose the time range used for the price chart, summary cards, and store series details.
      </p>
      <div
        className="mt-5 flex flex-wrap gap-2"
        aria-describedby={chartSelectorDescriptionId}
        aria-label="Price chart timeframe selector"
        role="group"
      >
        {chart.windows.map((window) => (
          <button
            aria-describedby={`${chartSelectorDescriptionId} ${chartRendererStatusId}`}
            aria-label={`Show ${window.rangeLabel} price chart window`}
            aria-pressed={window.label === activeWindow?.label}
            className={`rounded-full px-4 py-2 text-sm font-black motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              window.label === activeWindow?.label
                ? 'bg-emerald-300 text-emerald-950'
                : 'border border-white/15 bg-white/10 text-slate-200 hover:border-emerald-300'
            }`}
            key={window.label}
            onKeyDown={(event) => handleWindowKeyDown(event, window.label)}
            onClick={() => setActiveWindowLabel(window.label)}
            role="button"
            type="button"
          >
            {window.label}
          </button>
        ))}
      </div>
      <p id={chartRendererStatusId} aria-live="polite" className="sr-only" role="status">Chart renderer status: {chartLoadStatus}</p>

      {overlayControlAvailable && activeWindow ? (
        <fieldset className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4">
          <legend className="px-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Overlay two chains or pack sizes</legend>
          <p className="mt-1 text-xs font-semibold text-slate-300">Pick up to two series for the chart overlay; choosing a third replaces the oldest selection.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeWindow.series.map((series) => (
              <label
                className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-black ${
                  effectiveOverlaySeriesIds.includes(series.id)
                    ? 'border-emerald-300 bg-emerald-300 text-emerald-950'
                    : 'border-white/15 bg-slate-900 text-slate-200'
                }`}
                key={series.id}
              >
                <input
                  checked={effectiveOverlaySeriesIds.includes(series.id)}
                  className="sr-only"
                  onChange={() => toggleOverlaySeries(series.id)}
                  type="checkbox"
                />
                {series.storeName} · {series.sourceType}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {chart.available && activeWindow && activeWindow.pointCount > 0 ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-300/30 bg-violet-300/10 p-4">
            <p className="text-sm font-bold text-violet-100">Premium export: download the visible price-history series as CSV for research or budget planning.</p>
            <a
              className="rounded-full bg-violet-200 px-4 py-2 text-sm font-black text-violet-950"
              download={`${chart.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'price-history'}-${activeWindow.label.toLowerCase()}.csv`}
              href={csvDownloadHref}
            >
              Export CSV
            </a>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
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
              Overlay points/markers: <span className="text-white">{visiblePointCount}/{visibleMarkerCount}</span>
            </p>
            <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">
              Forecast: <span className="text-white">{activeWindow.forecast?.available ? activeWindow.forecast.horizonLabel : 'withheld'}</span>
            </p>
          </div>
          <div
            ref={containerRef}
            aria-describedby={chartRendererStatusId}
            aria-label={`${chart.title} price history chart for ${activeWindow.rangeLabel}`}
            className="mt-5 h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-white"
            role="img"
          />
          {priceMoveNotes.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-sky-300/30 bg-sky-300/10 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Why markers moved</p>
                  <h3 className="mt-1 text-lg font-black text-white">Factual notes tied to chart markers</h3>
                </div>
                <p className="text-xs font-bold text-sky-100">{priceMoveNotes.length} marker-linked notes · no inferred retailer cause</p>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {priceMoveNotes.map((note) => (
                  <article
                    className="rounded-xl border border-white/10 bg-slate-950/70 p-3"
                    data-price-chart-marker-note={note.markerKey}
                    key={note.id}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-100">
                      {note.markerLabel} · {note.observedAt.slice(0, 10)}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{note.explanation}</p>
                    <p className="mt-2 text-xs font-bold text-slate-300">
                      Marker link: {note.markerKey} · {note.sourceLabel}
                    </p>
                    {note.provenanceLabel ? (
                      <p className="mt-1 text-xs font-semibold text-slate-400">Source: {note.provenanceLabel}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}
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
            {activeWindow.forecast?.available ? (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 md:col-span-2">
                <p className="text-sm font-black text-amber-100">{activeWindow.forecast.title}</p>
                <p className="mt-2 text-xs font-bold text-amber-50">{activeWindow.forecast.summary}</p>
                <p className="mt-2 text-xs font-semibold text-amber-100/80">{activeWindow.forecast.caveat}</p>
              </div>
            ) : null}
            {visibleSeries.map((series) => (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4" key={series.id}>
                <p className="text-sm font-black text-white">{series.storeName} · {series.sourceType}</p>
                <p className="mt-1 text-xs font-semibold text-slate-300">lineStyle {series.lineStyle} · {series.points.length} points · {series.markers.length} markers</p>
                {buildPriceHistorySparklinePath(series.points) ? (
                  <svg
                    aria-label={`${series.storeName} compact price history sparkline`}
                    className="mt-3 h-11 w-full rounded-xl bg-slate-950/60 p-1"
                    preserveAspectRatio="none"
                    role="img"
                    viewBox="0 0 160 44"
                  >
                    <path d={buildPriceHistorySparklinePath(series.points) ?? ''} fill="none" stroke="#6ee7b7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  </svg>
                ) : null}
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
