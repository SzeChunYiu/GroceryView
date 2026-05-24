import { Card } from '@/components/data-ui';
import { PriceChartTerminal, type PriceChartTerminalModel } from '@/components/price-chart-terminal';

export type ProductHistoryChartOverlay = {
  available: boolean;
  title: string;
  chainCount: number;
  observationCount: number;
  detail: string;
  crossChainOverlaySeries: Array<{
    chainLabel: string;
    lineStyle: string;
    latestPriceLabel: string;
    pointCount: number;
    lowValueLabel: string;
    highValueLabel: string;
  }>;
  chainHistoryCoverageRows: Array<{
    chainLabel: string;
    lineStyle: string;
    latestPriceLabel: string;
    pointCount: number;
    detail: string;
  }>;
};

export type ProductHistoryChartProps = {
  chart: PriceChartTerminalModel;
  crossChainHistoryOverlay: ProductHistoryChartOverlay;
};

export function ProductHistoryChart({ chart, crossChainHistoryOverlay }: ProductHistoryChartProps) {
  return (
    <>
      <PriceChartTerminal chart={chart} />
      <Card className="mt-6 overflow-hidden border-cyan-200 bg-cyan-50/80">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-800">cross-chain history overlay</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Per-chain dated price tape coverage</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Uses buildPriceChartSeries only when at least two chains have dated observations for the same product. No forecast or synthetic chain history is shown.
            </p>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-5 text-right text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{crossChainHistoryOverlay.title}</p>
            <p className="mt-2 text-3xl font-black">{crossChainHistoryOverlay.chainCount} sources</p>
            <p className="mt-1 text-xs font-semibold text-slate-300">{crossChainHistoryOverlay.observationCount} dated points</p>
          </div>
        </div>
        {crossChainHistoryOverlay.available ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {crossChainHistoryOverlay.crossChainOverlaySeries.map((series) => (
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={`${series.chainLabel}-${series.lineStyle}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">{series.chainLabel}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{series.latestPriceLabel}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{series.pointCount} points · lineStyle {series.lineStyle}</p>
                <p className="mt-2 text-sm font-bold text-slate-700">Range {series.lowValueLabel}–{series.highValueLabel}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {crossChainHistoryOverlay.chainHistoryCoverageRows.map((row) => (
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={`${row.chainLabel}-${row.lineStyle}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">{row.chainLabel}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{row.latestPriceLabel}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{row.pointCount} dated points · {row.lineStyle}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{row.detail}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">{crossChainHistoryOverlay.detail}</p>
      </Card>
    </>
  );
}
