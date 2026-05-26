/**
 * GroceryView v3 design-system charts — friendly labels, clear axes, plain language.
 * Pure SVG, dependency-free, server-renderable (no hooks). Ported from the
 * approved design prototype (/tmp/gv-design/charts.jsx) to typed TSX.
 *
 * Accessibility intent: numbers always pair with plain-language readings
 * (e.g. PriceChart paints "GOOD PRICE" / "EXPENSIVE" bands instead of stats jargon).
 */
import * as React from 'react';

// ============ Sparkline ============
export function Sparkline({
  values,
  w = 100,
  h = 32,
  color,
  strokeWidth = 1.8,
  fill = true,
  showDot = true,
}: {
  values: number[];
  w?: number;
  h?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
  showDot?: boolean;
}) {
  if (!values || values.length === 0) return null;
  const last = values[values.length - 1];
  const first = values[0];
  const trend = last - first;
  const c = color || (trend <= 0 ? 'var(--brand)' : 'var(--hot)');
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1 || 1);
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(2 + (1 - (v - min) / range) * (h - 4)).toFixed(1)}`)
    .join(' ');
  const lastX = (values.length - 1) * stepX;
  const lastY = 2 + (1 - (last - min) / range) * (h - 4);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden="true">
      {fill && <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={c} opacity="0.15" />}
      <path d={path} stroke={c} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {showDot && <circle cx={lastX} cy={lastY} r="2.5" fill={c} stroke="white" strokeWidth="1.5" />}
    </svg>
  );
}

// ============ Friendly Price Chart ============
export interface PricePoint {
  date: string;
  price: number;
}
export function PriceChart({
  data,
  w = 800,
  h = 280,
  color = 'var(--brand)',
  lowMark,
  highMark,
  currentMark,
  marketBands = true,
  title,
}: {
  data: PricePoint[];
  w?: number;
  h?: number;
  color?: string;
  lowMark?: number;
  highMark?: number;
  currentMark?: number;
  marketBands?: boolean;
  title?: string;
}) {
  if (!data || !data.length) return <div style={{ width: w, height: h, background: 'var(--bg-2)', borderRadius: 12 }} />;
  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min) * 0.15 || 1;
  const yMin = Math.min(min - pad, lowMark ?? Infinity);
  const yMax = Math.max(max + pad, highMark ?? -Infinity);
  const range = yMax - yMin || 1;
  const padL = 50, padR = 24, padT = 24, padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const sx = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const sy = (v: number) => padT + (1 - (v - yMin) / range) * innerH;
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + (range * i) / ticks);
  const n = data.length;
  const xTicks: { idx: number; label: string }[] = [];
  for (let i = 0; i <= 5; i++) {
    const idx = Math.floor((i / 5) * (n - 1));
    xTicks.push({ idx, label: data[idx].date.slice(5).replace('-', '/') });
  }
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)} ${sy(d.price).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${sx(data.length - 1)} ${padT + innerH} L ${sx(0)} ${padT + innerH} Z`;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const std = Math.sqrt(prices.reduce((s, v) => s + (v - mean) ** 2, 0) / prices.length);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} role="img"
      aria-label={title || 'Price history with good-price and expensive bands'}>
      <defs>
        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {marketBands && (
        <>
          <rect x={padL} y={sy(mean + std * 1.5)} width={innerW} height={Math.max(0, sy(yMin) - sy(mean + std * 1.5))} fill="var(--hot-soft)" opacity="0.5" />
          <rect x={padL} y={sy(mean + std * 1.5)} width={innerW} height={Math.max(0, sy(mean - std * 1.5) - sy(mean + std * 1.5))} fill="var(--bg-2)" opacity="0.5" />
          <rect x={padL} y={sy(mean - std * 1.5)} width={innerW} height={Math.max(0, sy(yMin) - sy(mean - std * 1.5))} fill="var(--brand-soft)" opacity="0.5" />
          <text x={padL + innerW - 6} y={sy(mean + std * 1.5) - 4} textAnchor="end" fontSize="10" fill="var(--hot)" fontWeight="600">EXPENSIVE</text>
          <text x={padL + innerW - 6} y={sy(mean - std * 1.5) + 12} textAnchor="end" fontSize="10" fill="var(--brand-deep)" fontWeight="600">GOOD PRICE</text>
        </>
      )}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={sy(t)} x2={w - padR} y2={sy(t)} className="chart-grid" />
          <text x={padL - 8} y={sy(t) + 3} textAnchor="end" className="chart-axis">{t.toFixed(0)}</text>
        </g>
      ))}
      {lowMark != null && <line x1={padL} x2={w - padR} y1={sy(lowMark)} y2={sy(lowMark)} stroke="var(--brand)" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />}
      {highMark != null && <line x1={padL} x2={w - padR} y1={sy(highMark)} y2={sy(highMark)} stroke="var(--hot)" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />}
      <path d={areaPath} fill="url(#priceFill)" />
      <path d={linePath} stroke={color} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {currentMark != null && (
        <g>
          <circle cx={sx(data.length - 1)} cy={sy(currentMark)} r="6" fill={color} stroke="white" strokeWidth="3" />
          <circle cx={sx(data.length - 1)} cy={sy(currentMark)} r="11" fill={color} opacity="0.25" />
        </g>
      )}
      {xTicks.map((l, i) => (
        <text key={i} x={sx(l.idx)} y={h - 10} textAnchor="middle" className="chart-axis">{l.label}</text>
      ))}
    </svg>
  );
}

// ============ Multi-line chart ============
export interface LineSeries {
  name: string;
  values: number[];
  color: string;
  dim?: boolean;
}
export function MultiLineChart({
  series,
  w = 800,
  h = 280,
  baseline = 100,
  xLabels,
  legend = true,
}: {
  series: LineSeries[];
  w?: number;
  h?: number;
  baseline?: number | null;
  xLabels?: { idx: number; label: string }[];
  legend?: boolean;
}) {
  if (!series || !series.length) return null;
  const all = series.flatMap((s) => s.values);
  const min = Math.min(...all, baseline ?? Infinity);
  const max = Math.max(...all, baseline ?? -Infinity);
  const pad = (max - min) * 0.1 || 1;
  const yMin = min - pad, yMax = max + pad;
  const range = yMax - yMin || 1;
  const padL = 48, padR = 96, padT = 18, padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const N = series[0].values.length;
  const sx = (i: number) => padL + (i / (N - 1)) * innerW;
  const sy = (v: number) => padT + (1 - (v - yMin) / range) * innerH;
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (range * i) / 4);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden="true">
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={sy(t)} x2={w - padR} y2={sy(t)} className="chart-grid" />
          <text x={padL - 8} y={sy(t) + 3} textAnchor="end" className="chart-axis">{t.toFixed(0)}</text>
        </g>
      ))}
      {baseline != null && (
        <g>
          <line x1={padL} x2={w - padR} y1={sy(baseline)} y2={sy(baseline)} stroke="var(--ink-3)" strokeDasharray="5 3" opacity="0.5" />
          <text x={padL + 6} y={sy(baseline) - 4} className="chart-axis">{baseline}</text>
        </g>
      )}
      {series.map((s, si) => {
        const path = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ');
        return (
          <g key={si}>
            <path d={path} stroke={s.color} strokeWidth="2.2" fill="none" strokeLinejoin="round" opacity={s.dim ? 0.25 : 1} />
            <circle cx={sx(N - 1)} cy={sy(s.values[N - 1])} r="4" fill={s.color} stroke="white" strokeWidth="2" />
            {legend && (
              <text x={w - padR + 8} y={sy(s.values[N - 1]) + 3.5} fill={s.color} style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</text>
            )}
          </g>
        );
      })}
      {xLabels?.map((l, i) => (
        <text key={i} x={sx(l.idx)} y={h - 8} textAnchor="middle" className="chart-axis">{l.label}</text>
      ))}
    </svg>
  );
}

// ============ Horizontal bar ============
export function BarChart({
  rows,
  w = 480,
  barH = 28,
  gap = 8,
  format = (v: number) => v.toFixed(0),
  valueColor,
  labelW = 130,
}: {
  rows: { label: string; value: number; color?: string; bold?: boolean; dim?: boolean }[];
  w?: number;
  barH?: number;
  gap?: number;
  format?: (v: number) => string;
  valueColor?: 'savings';
  labelW?: number;
}) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)));
  const min = Math.min(0, ...rows.map((r) => r.value));
  const padL = labelW, padR = 70;
  const innerW = w - padL - padR;
  const zero = padL + (-min / (max - min || max || 1)) * innerW;
  const scale = innerW / (max - min || max || 1);
  const h = rows.length * (barH + gap);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden="true">
      {rows.map((r, i) => {
        const y = i * (barH + gap);
        const val = r.value;
        const bw = Math.abs(val) * scale;
        const bx = val >= 0 ? zero : zero - bw;
        const color = r.color || (valueColor === 'savings' ? (val >= 0 ? 'var(--brand)' : 'var(--hot)') : 'var(--brand)');
        return (
          <g key={i}>
            <text x={padL - 10} y={y + barH / 2 + 4} textAnchor="end" fontSize="13" fill={r.bold ? 'var(--ink)' : 'var(--ink-2)'} fontWeight={r.bold ? 700 : 500}>{r.label}</text>
            <rect x={bx} y={y} width={Math.max(2, bw)} height={barH} fill={color} rx="6" opacity={r.dim ? 0.5 : 1} />
            <text x={Math.min(w - padR + 4, bx + bw + 8)} y={y + barH / 2 + 4} fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="var(--mono)" style={{ fontVariantNumeric: 'tabular-nums' }}>{format(val)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============ Donut ============
export function Donut({ data, size = 180, thickness = 28, gap = 2 }: { data: { value: number; color: string }[]; size?: number; thickness?: number; gap?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - thickness / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * C - gap;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="butt" />
        );
        offset += frac * C;
        return el;
      })}
    </svg>
  );
}

// ============ Gauge ============
export function Gauge({ value, max = 100, label, color, w = 200, h = 120 }: { value: number; max?: number; label?: string; color?: string; w?: number; h?: number }) {
  const cx = w / 2, cy = h - 12, r = Math.min(cx - 12, h - 24);
  const t = Math.max(0, Math.min(1, value / max));
  const startA = Math.PI, endA = 0;
  const a = startA + (endA - startA) * t;
  const lx = cx + r * Math.cos(startA), ly = cy - r * Math.sin(startA);
  const rx = cx + r * Math.cos(endA), ry = cy - r * Math.sin(endA);
  const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
  const c = color || (value >= 75 ? 'var(--brand)' : value >= 50 ? 'var(--save)' : 'var(--hot)');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden="true">
      <path d={`M ${lx} ${ly} A ${r} ${r} 0 0 1 ${rx} ${ry}`} stroke="var(--bg-2)" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d={`M ${lx} ${ly} A ${r} ${r} 0 0 1 ${x} ${y}`} stroke={c} strokeWidth="14" fill="none" strokeLinecap="round" />
      <text x={cx} y={cy - 26} textAnchor="middle" fontSize="32" fontWeight="800" fill="var(--ink)">{value}</text>
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-3)">{label || ''}</text>
    </svg>
  );
}

// ============ Score bar ============
export function ScoreBar({ value, max = 100, label, color }: { value: number; max?: number; label?: string; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || (pct >= 75 ? 'var(--brand)' : pct >= 50 ? 'var(--save)' : 'var(--hot)');
  return (
    <div className="col gap-2" style={{ width: '100%' }}>
      {label && (
        <div className="row between" style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span className="mono">{Math.round(value)}/{max}</span>
        </div>
      )}
      <div className="bar-track"><div className="bar-fill" style={{ width: pct + '%', background: c }} /></div>
    </div>
  );
}
