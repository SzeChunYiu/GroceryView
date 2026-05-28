import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChartShell, KpiCard } from '@/components/design-system';
import { Card, Eyebrow } from '@/components/data-ui';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { NoVerifiedDataPanel } from '@/components/mvp/no-verified-data-panel';
import { formatPercent } from '@/lib/mvp/format';
import type { CategoryIndexRow, ChainIndexSeries } from '@/lib/mvp/types';

export function MarketKpiRow({
  items
}: Readonly<{
  items: Array<{ detail?: string; label: string; value: string }>;
}>) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard key={item.label} label={item.label} meaning={item.detail ?? ''} value={item.value} />
      ))}
    </div>
  );
}

export function MarketFilterRail({
  action,
  children,
  title = 'Filters'
}: Readonly<{ action: string; children: ReactNode; title?: string }>) {
  return (
    <aside aria-label="Market filters">
      <Card className="sticky top-4 p-4">
        <Eyebrow>{title}</Eyebrow>
        <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--gv-ink-soft)]">Narrow market indexes by region and index type.</p>
        <form action={action} className="mt-4 space-y-4" method="get">
          {children}
          <button className="w-full rounded-full bg-[color:var(--gv-primary)] px-4 py-2 text-sm font-black text-white" type="submit">
            Apply filters
          </button>
        </form>
      </Card>
    </aside>
  );
}

export function MarketChartShell({
  description,
  series,
  title
}: Readonly<{ description: string; series: ChainIndexSeries[]; title: string }>) {
  const chart =
    series.length > 0 ? (
      <div className="space-y-4">
        {series.map((item) => (
          <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[var(--gv-surface)] p-4" key={`${item.chain}-${item.indexType}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-black capitalize text-[color:var(--gv-ink)]">{item.chain}</p>
                <p className="text-xs font-semibold text-[color:var(--gv-muted)]">{item.sourceLabel}</p>
              </div>
              <p className="text-sm font-semibold text-[color:var(--gv-ink-soft)]">
                Latest {item.points.at(-1)?.value.toFixed(1) ?? '—'} · weekly {formatPercent(item.weeklyChangePct)}
              </p>
            </div>
            <div aria-label={`Price index trend for ${item.chain}`} className="mt-4 flex items-end gap-1.5" role="img">
              {item.points.map((point) => (
                <div className="flex flex-1 flex-col items-center gap-1" key={`${item.chain}-${point.date}`}>
                  <span
                    className="w-full rounded-t-lg bg-[color:var(--gv-primary)]"
                    style={{ height: `${Math.max(12, Math.min(96, point.value * 0.8))}px` }}
                    title={`${point.date}: ${point.value.toFixed(1)}`}
                  />
                  <span className="text-[0.65rem] font-bold text-[color:var(--gv-muted)]">{point.date.slice(5)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-[color:var(--gv-muted)]">
              {item.points.length} price history points · {item.observationCount} observations
            </p>
          </div>
        ))}
      </div>
    ) : (
      <NoVerifiedDataPanel message="Not enough price history to show a chart for these filters." title="Chart unavailable" />
    );

  return (
    <ChartShell
      chart={chart}
      summary={description}
      title={title}
    />
  );
}

export function CategorySparklineChart({
  categoryName,
  row
}: Readonly<{ categoryName: string; row?: CategoryIndexRow }>) {
  const chart =
    row && row.sparkline.length > 0 ? (
      <div aria-label={`${categoryName} price trend`} className="flex items-end gap-2 p-2" role="img">
        {row.sparkline.map((point) => (
          <div className="flex flex-1 flex-col items-center gap-1" key={point.date}>
            <span
              className="w-full rounded-t-lg bg-[color:var(--gv-primary)]"
              style={{ height: `${Math.max(12, Math.min(120, point.value / 2))}px` }}
              title={`${point.date}: ${point.value.toFixed(2)} SEK`}
            />
            <span className="text-[0.65rem] font-bold text-[color:var(--gv-muted)]">{point.date.slice(5)}</span>
          </div>
        ))}
      </div>
    ) : (
      <NoVerifiedDataPanel message="This category does not have enough observations for a trend chart yet." title="Not enough data yet" />
    );

  return (
    <ChartShell
      chart={chart}
      summary={
        row
          ? `Weekly change ${formatPercent(row.weeklyChangePct)} from verified observations. 3m ${formatPercent(row.threeMonthChangePct)} · 1y ${formatPercent(row.oneYearChangePct)}.`
          : undefined
      }
      title={`What changed in ${categoryName}?`}
    />
  );
}

export function MarketCategoryTable({
  rows
}: Readonly<{
  rows: Array<{
    browseHref: string;
    categoryName: string;
    categorySlug: string;
    freshnessLabel: string;
    marketHref: string;
    observationCount: number;
    oneYearChangePct?: number;
    threeMonthChangePct?: number;
    weeklyChangePct?: number;
  }>;
}>) {
  return (
    <MvpSectionCard title="Category price table">
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Weekly</th>
                <th className="py-2 pr-4">3M</th>
                <th className="py-2 pr-4">1Y</th>
                <th className="py-2 pr-4">Observations</th>
                <th className="py-2 pr-4">Freshness</th>
                <th className="py-2">Browse</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b border-slate-100" key={row.categorySlug}>
                  <td className="py-3 pr-4">
                    <Link className="font-black text-emerald-800 underline" href={row.marketHref}>
                      {row.categoryName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 font-semibold">{formatPercent(row.weeklyChangePct)}</td>
                  <td className="py-3 pr-4 font-semibold">{formatPercent(row.threeMonthChangePct)}</td>
                  <td className="py-3 pr-4 font-semibold">{formatPercent(row.oneYearChangePct)}</td>
                  <td className="py-3 pr-4 font-semibold">{row.observationCount.toLocaleString('sv-SE')}</td>
                  <td className="py-3 pr-4 font-semibold capitalize">{row.freshnessLabel}</td>
                  <td className="py-3">
                    <Link className="text-sm font-black text-emerald-800 underline" href={row.browseHref}>
                      Browse category
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <NoVerifiedDataPanel />
      )}
    </MvpSectionCard>
  );
}
