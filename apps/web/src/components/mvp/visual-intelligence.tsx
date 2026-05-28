import Link from 'next/link';
import type { ReactNode } from 'react';

type ChartPoint = { date?: string; label?: string; value: number };
type ChartTone = 'up' | 'down' | 'neutral';
type ChartSeries = { label: string; points: ChartPoint[]; tone?: ChartTone };
type TableColumn<T> = { key: string; label: string; render: (row: T) => ReactNode };
type HeatmapCell = {
  row: string;
  column: string;
  valueLabel: string;
  tone?: 'low' | 'medium' | 'high';
  href?: string;
  signal?: string;
  analyticsEvent?: string;
  entityType?: string;
  entityId?: string;
};

function extent(series: ChartSeries[]) {
  const values = series.flatMap((entry) => entry.points.map((point) => point.value));
  if (values.length === 0) return { min: 0, max: 1, span: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, span: Math.max(1, max - min) };
}

function toneClass(tone?: ChartTone) {
  if (tone === 'down') return { stroke: '#be123c' };
  if (tone === 'neutral') return { stroke: '#475569' };
  return { stroke: '#047857' };
}

export function ChartEmptyState({ title = 'Not enough verified data for this visual yet', message = 'The panel stays empty until source-backed rows can answer the user question.' }: Readonly<{ title?: string; message?: string }>) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4" role="status">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Fail-closed visual</p>
      <h3 className="mt-2 text-lg font-black text-amber-950">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">{message}</p>
    </div>
  );
}

export function ChartTableFallback<T>({ caption, columns, rows }: Readonly<{ caption: string; columns: TableColumn<T>[]; rows: T[] }>) {
  if (rows.length === 0) return <ChartEmptyState title="No table fallback rows" message="The accessible table appears as soon as verified rows are available." />;
  return (
    <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
      <summary className="cursor-pointer text-sm font-black text-slate-800">Table fallback: {caption}</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              {columns.map((column) => <th className="py-2 pr-4" key={column.key}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="border-b border-slate-100" key={index}>
                {columns.map((column) => <td className="py-2 pr-4 font-semibold" key={column.key}>{column.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function ChartTooltip({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-700" title={body}>
      {title}
    </span>
  );
}

export function ChartShell({ userQuestion, insightTitle, plainSummary, evidenceItems, actionHref, actionLabel = 'Open detail', children, fallback, emptyState, hasData = true }: Readonly<{ userQuestion: string; insightTitle: string; plainSummary: string; evidenceItems: string[]; actionHref: string; actionLabel?: string; children: ReactNode; fallback: ReactNode; emptyState?: ReactNode; hasData?: boolean }>) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm" aria-label={userQuestion}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{userQuestion}</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{insightTitle}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{plainSummary}</p>
        </div>
        <Link className="rounded-full bg-emerald-800 px-3 py-2 text-xs font-black text-white" href={actionHref}>{actionLabel}</Link>
      </div>
      <div className="mt-4">{hasData ? children : (emptyState ?? <ChartEmptyState />)}</div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Evidence strip">
        {evidenceItems.map((item) => <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700" key={item}>{item}</span>)}
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">Color is not the only signal</span>
      </div>
      {fallback}
    </section>
  );
}

export function KpiCard({ label, value, detail, href }: Readonly<{ label: string; value: string; detail: string; href: string }>) {
  return (
    <Link className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-200" href={href}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
    </Link>
  );
}

export function Sparkline({ points, label }: Readonly<{ points: ChartPoint[]; label: string }>) {
  const bounds = extent([{ label, points }]);
  const d = points.map((point, index) => {
    const x = 8 + (index / Math.max(1, points.length - 1)) * 104;
    const y = 44 - ((point.value - bounds.min) / bounds.span) * 36;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return <svg className="h-12 w-32" role="img" aria-label={label} viewBox="0 0 120 52"><path d={d} fill="none" stroke="#047857" strokeLinecap="round" strokeWidth="3" /></svg>;
}

export function MultiLineChart({ series, ariaLabel }: Readonly<{ series: ChartSeries[]; ariaLabel: string }>) {
  const bounds = extent(series);
  return (
    <svg className="h-64 w-full" role="img" aria-label={ariaLabel} viewBox="0 0 640 240">
      {[48, 96, 144, 192].map((y) => <line key={y} x1="28" x2="612" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 8" />)}
      {series.map((entry) => {
        const tone = toneClass(entry.tone);
        const d = entry.points.map((point, index) => {
          const x = 28 + (index / Math.max(1, entry.points.length - 1)) * 584;
          const y = 212 - ((point.value - bounds.min) / bounds.span) * 184;
          return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
        return <path d={d} fill="none" key={entry.label} stroke={tone.stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />;
      })}
    </svg>
  );
}

export function HeatmapMatrix({ cells }: Readonly<{ cells: HeatmapCell[] }>) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cells.map((cell) => {
        const tone = cell.tone === 'high' ? 'border-rose-100 bg-rose-50 text-rose-950' : cell.tone === 'medium' ? 'border-amber-100 bg-amber-50 text-amber-950' : 'border-emerald-100 bg-emerald-50 text-emerald-950';
        const body = <><span className="block text-xs font-black uppercase tracking-[0.14em]">{cell.column}</span><span className="mt-1 block text-lg font-black">{cell.row}</span><span className="mt-1 block text-sm font-bold">{cell.valueLabel} · {cell.signal}</span></>;
        return cell.href ? (
          <Link
            className={`rounded-2xl border p-3 ${tone}`}
            data-gv-entity-id={cell.entityId}
            data-gv-entity-type={cell.entityType}
            data-gv-event={cell.analyticsEvent}
            href={cell.href}
            key={`${cell.row}-${cell.column}`}
          >
            {body}
          </Link>
        ) : (
          <div className={`rounded-2xl border p-3 ${tone}`} key={`${cell.row}-${cell.column}`}>{body}</div>
        );
      })}
    </div>
  );
}

export function GeoHeatmap({ cells }: Readonly<{ cells: HeatmapCell[] }>) {
  return <HeatmapMatrix cells={cells} />;
}

export function DistributionBand({ min, max, current, label }: Readonly<{ min: number; max: number; current: number; label: string }>) {
  const pct = Math.max(0, Math.min(100, ((current - min) / Math.max(1, max - min)) * 100));
  return <div aria-label={label} className="rounded-2xl bg-slate-50 p-3"><div className="h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-emerald-700" style={{ width: `${pct}%` }} /></div><p className="mt-2 text-xs font-bold text-slate-600">{min}–{max} · current {current}</p></div>;
}

export function PriceHistoryChart({ points, label }: Readonly<{ points: ChartPoint[]; label: string }>) {
  return <MultiLineChart ariaLabel={label} series={[{ label, points, tone: 'up' }]} />;
}
