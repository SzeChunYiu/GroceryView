/* GroceryView v2 — charts. Friendly labels, clear axes, plain language. */

const { useMemo: useMemoC, useState: useStateC, useRef: useRefC, useEffect: useEffectC } = React;

// ============ Sparkline ============
function Sparkline({ values, w = 100, h = 32, color, strokeWidth = 1.8, fill = true, showDot = true }) {
  if (!values || values.length === 0) return null;
  const last = values[values.length - 1], first = values[0];
  const trend = last - first;
  const c = color || (trend <= 0 ? 'var(--brand)' : 'var(--hot)');
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1 || 1);
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(2 + (1 - (v - min) / range) * (h - 4)).toFixed(1)}`).join(' ');
  const lastX = (values.length - 1) * stepX;
  const lastY = 2 + (1 - (last - min) / range) * (h - 4);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {fill && (
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={c} opacity="0.15" />
      )}
      <path d={path} stroke={c} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {showDot && <circle cx={lastX} cy={lastY} r="2.5" fill={c} stroke="white" strokeWidth="1.5" />}
    </svg>
  );
}

// ============ Friendly Price Chart ============
function PriceChart({ data, w = 800, h = 280, color = 'var(--brand)', lowMark, highMark, currentMark, currency = 'kr', subtitle, marketBands = true }) {
  if (!data || !data.length) return <div style={{ width: w, height: h, background: 'var(--bg-2)', borderRadius: 12 }} />;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const pad = (max - min) * 0.15 || 1;
  const yMin = Math.min(min - pad, lowMark || Infinity);
  const yMax = Math.max(max + pad, highMark || -Infinity);
  const range = yMax - yMin || 1;

  const padL = 50, padR = 24, padT = 24, padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const sx = i => padL + (i / (data.length - 1)) * innerW;
  const sy = v => padT + (1 - (v - yMin) / range) * innerH;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + (range * i / ticks));
  const n = data.length;
  const xTicks = [];
  for (let i = 0; i <= 5; i++) {
    const idx = Math.floor((i / 5) * (n - 1));
    xTicks.push({ idx, label: data[idx].date.slice(5).replace('-', '/') });
  }

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)} ${sy(d.price).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${sx(data.length - 1)} ${padT + innerH} L ${sx(0)} ${padT + innerH} Z`;

  // Calculate "good/typical/expensive" bands
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const std = Math.sqrt(prices.reduce((s, v) => s + (v - mean) ** 2, 0) / prices.length);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background bands */}
      {marketBands && (
        <>
          <rect x={padL} y={sy(mean + std * 1.5)} width={innerW} height={Math.max(0, sy(yMin) - sy(mean + std * 1.5))}
            fill="var(--hot-soft)" opacity="0.5" />
          <rect x={padL} y={sy(mean + std * 1.5)} width={innerW} height={Math.max(0, sy(mean - std * 1.5) - sy(mean + std * 1.5))}
            fill="var(--bg-2)" opacity="0.5" />
          <rect x={padL} y={sy(mean - std * 1.5)} width={innerW} height={Math.max(0, sy(yMin) - sy(mean - std * 1.5))}
            fill="var(--brand-soft)" opacity="0.5" />

          <text x={padL + innerW - 6} y={sy(mean + std * 1.5) - 4} textAnchor="end" fontSize="10" fill="var(--hot)" fontWeight="600">
            EXPENSIVE
          </text>
          <text x={padL + innerW - 6} y={sy(mean - std * 1.5) + 12} textAnchor="end" fontSize="10" fill="var(--brand-deep)" fontWeight="600">
            GOOD PRICE
          </text>
        </>
      )}

      {/* Gridlines + Y labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={sy(t)} x2={w - padR} y2={sy(t)} className="chart-grid" />
          <text x={padL - 8} y={sy(t) + 3} textAnchor="end" className="chart-axis">{t.toFixed(0)}</text>
        </g>
      ))}

      {/* 52w low/high */}
      {lowMark != null && (
        <g>
          <line x1={padL} x2={w - padR} y1={sy(lowMark)} y2={sy(lowMark)} stroke="var(--brand)" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
        </g>
      )}
      {highMark != null && (
        <g>
          <line x1={padL} x2={w - padR} y1={sy(highMark)} y2={sy(highMark)} stroke="var(--hot)" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
        </g>
      )}

      {/* Line + fill */}
      <path d={areaPath} fill="url(#priceFill)" />
      <path d={linePath} stroke={color} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />

      {/* Current dot */}
      {currentMark != null && (
        <g>
          <circle cx={sx(data.length - 1)} cy={sy(currentMark)} r="6" fill={color} stroke="white" strokeWidth="3" />
          <circle cx={sx(data.length - 1)} cy={sy(currentMark)} r="11" fill={color} opacity="0.25" />
        </g>
      )}

      {/* X labels */}
      {xTicks.map((l, i) => (
        <text key={i} x={sx(l.idx)} y={h - 10} textAnchor="middle" className="chart-axis">{l.label}</text>
      ))}
    </svg>
  );
}

// ============ Multi-line chart ============
function MultiLineChart({ series, w = 800, h = 280, baseline = 100, xLabels, legend = true, yLabel }) {
  if (!series || !series.length) return null;
  const all = series.flatMap(s => s.values);
  const min = Math.min(...all, baseline ?? Infinity);
  const max = Math.max(...all, baseline ?? -Infinity);
  const pad = (max - min) * 0.1 || 1;
  const yMin = min - pad, yMax = max + pad;
  const range = yMax - yMin || 1;
  const padL = 48, padR = 96, padT = 18, padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const N = series[0].values.length;
  const sx = i => padL + (i / (N - 1)) * innerW;
  const sy = v => padT + (1 - (v - yMin) / range) * innerH;
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (range * i / 4));

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
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
              <text x={w - padR + 8} y={sy(s.values[N - 1]) + 3.5} fill={s.color}
                style={{ fontWeight: 600, fontSize: 12 }}>
                {s.name}
              </text>
            )}
          </g>
        );
      })}
      {xLabels && xLabels.map((l, i) => (
        <text key={i} x={sx(l.idx)} y={h - 8} textAnchor="middle" className="chart-axis">{l.label}</text>
      ))}
    </svg>
  );
}

// ============ Horizontal bar ============
function BarChart({ rows, w = 480, barH = 28, gap = 8, format = v => v.toFixed(0), valueColor, labelW = 130 }) {
  const max = Math.max(...rows.map(r => Math.abs(r.value)));
  const min = Math.min(0, ...rows.map(r => r.value));
  const padL = labelW, padR = 70;
  const innerW = w - padL - padR;
  const zero = padL + ((-min) / (max - min || max || 1)) * innerW;
  const scale = innerW / (max - min || max || 1);
  const h = rows.length * (barH + gap);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {rows.map((r, i) => {
        const y = i * (barH + gap);
        const val = r.value;
        const bw = Math.abs(val) * scale;
        const bx = val >= 0 ? zero : zero - bw;
        const color = r.color || (valueColor === 'savings'
          ? (val >= 0 ? 'var(--brand)' : 'var(--hot)')
          : 'var(--brand)');
        return (
          <g key={i}>
            <text x={padL - 10} y={y + barH / 2 + 4} textAnchor="end"
              fontSize="13" fill={r.bold ? 'var(--ink)' : 'var(--ink-2)'} fontWeight={r.bold ? 700 : 500}>
              {r.label}
            </text>
            <rect x={bx} y={y} width={Math.max(2, bw)} height={barH} fill={color} rx="6" opacity={r.dim ? 0.5 : 1} />
            <text x={Math.min(w - padR + 4, bx + bw + 8)} y={y + barH / 2 + 4}
              fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="var(--mono)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {format(val)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============ Stacked vertical bar ============
function StackedBars({ data, w = 600, h = 220, keys, colors, format = v => v.toFixed(0) }) {
  const padL = 40, padR = 20, padT = 16, padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...data.map(d => keys.reduce((s, k) => s + (d[k] || 0), 0)));
  const barW = innerW / data.length * 0.7;
  const stepX = innerW / data.length;
  const sx = i => padL + i * stepX + (stepX - barW) / 2;
  const sy = v => padT + (1 - v / max) * innerH;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={padT + t * innerH} x2={w - padR} y2={padT + t * innerH} className="chart-grid" />
          <text x={padL - 6} y={padT + t * innerH + 3} textAnchor="end" className="chart-axis">{format(max * (1 - t))}</text>
        </g>
      ))}
      {data.map((d, i) => {
        let acc = 0;
        return (
          <g key={i}>
            {keys.map((k, ki) => {
              const v = d[k] || 0;
              const y0 = sy(acc + v);
              const y1 = sy(acc);
              acc += v;
              return (
                <rect key={k} x={sx(i)} y={y0} width={barW} height={y1 - y0}
                  fill={colors[ki]} rx={ki === keys.length - 1 ? 6 : 0} ry={ki === keys.length - 1 ? 6 : 0} />
              );
            })}
            <text x={sx(i) + barW / 2} y={h - 12} textAnchor="middle" className="chart-axis">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============ Donut / pie ============
function Donut({ data, size = 180, thickness = 28, gap = 2 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - thickness / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * C - gap;
        const el = (
          <circle key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
        offset += frac * C;
        return el;
      })}
    </svg>
  );
}

// ============ Heatmap ============
function Heatmap({ rows, cols, data, w = 800, cellH = 36, format = v => v.toFixed(0), centerAt = 100 }) {
  const padL = 130, padT = 32;
  const cellW = (w - padL) / cols.length;
  const h = padT + rows.length * cellH + 16;
  const flat = data.flat();
  const max = Math.max(...flat);
  const min = Math.min(...flat);
  const colorFor = (v) => {
    if (centerAt != null) {
      const d = v - centerAt;
      const abs = Math.max(max - centerAt, centerAt - min);
      const t = Math.max(-1, Math.min(1, d / abs));
      if (t < 0) return `oklch(${(94 - (-t) * 30).toFixed(0)}% ${(0.04 + (-t) * 0.14).toFixed(3)} 152)`;
      return `oklch(${(94 - t * 30).toFixed(0)}% ${(0.04 + t * 0.14).toFixed(3)} 25)`;
    }
    const t = (v - min) / (max - min || 1);
    return `oklch(${(96 - t * 32).toFixed(0)}% ${(0.04 + t * 0.14).toFixed(3)} 152)`;
  };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {cols.map((c, i) => (
        <text key={i} x={padL + i * cellW + cellW / 2} y={padT - 10} textAnchor="middle"
          fontSize="11" fontWeight="600" fill="var(--ink-2)">{c}</text>
      ))}
      {rows.map((r, ri) => (
        <g key={ri}>
          <text x={padL - 10} y={padT + ri * cellH + cellH / 2 + 4} textAnchor="end"
            fontSize="13" fontWeight="500" fill="var(--ink-2)">{r}</text>
          {cols.map((c, ci) => {
            const v = data[ri][ci];
            return (
              <g key={ci}>
                <rect x={padL + ci * cellW + 2} y={padT + ri * cellH + 2}
                  width={cellW - 4} height={cellH - 4}
                  fill={colorFor(v)} rx="6" />
                <text x={padL + ci * cellW + cellW / 2} y={padT + ri * cellH + cellH / 2 + 4}
                  textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)"
                  fontFamily="var(--mono)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {format(v)}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

// ============ Gauge ============
function Gauge({ value, max = 100, label, color, w = 200, h = 120 }) {
  const cx = w / 2, cy = h - 12, r = Math.min(cx - 12, h - 24);
  const t = Math.max(0, Math.min(1, value / max));
  const startA = Math.PI, endA = 0;
  const a = startA + (endA - startA) * t;
  const lx = cx + r * Math.cos(startA), ly = cy - r * Math.sin(startA);
  const rx = cx + r * Math.cos(endA), ry = cy - r * Math.sin(endA);
  const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
  const c = color || (value >= 75 ? 'var(--brand)' : value >= 50 ? 'var(--save)' : 'var(--hot)');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={`M ${lx} ${ly} A ${r} ${r} 0 0 1 ${rx} ${ry}`} stroke="var(--bg-2)" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d={`M ${lx} ${ly} A ${r} ${r} 0 0 1 ${x} ${y}`} stroke={c} strokeWidth="14" fill="none" strokeLinecap="round" />
      <text x={cx} y={cy - 26} textAnchor="middle" fontSize="32" fontWeight="800" fill="var(--ink)">{value}</text>
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-3)" style={{ textTransform: 'uppercase' }}>{label || ''}</text>
    </svg>
  );
}

// ============ KPI Card ============
function KPI({ label, value, sub, change, sparkline, big = false, color }) {
  const up = change != null && change >= 0;
  return (
    <div className="card col gap-3" style={{ minHeight: big ? 180 : 'auto' }}>
      <div className="row between">
        <div className="kpi-label">{label}</div>
        {change != null && (
          <span className={'pill ' + (up ? 'hot' : 'save')}>
            {up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="kpi-value" style={{ fontSize: big ? 46 : 32, color: color || 'var(--ink)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{sub}</div>}
      {sparkline && (
        <Sparkline values={sparkline} w={220} h={32} color={up ? 'var(--hot)' : 'var(--brand)'} />
      )}
    </div>
  );
}

// ============ Score bar ============
function ScoreBar({ value, max = 100, label, color }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || (pct >= 75 ? 'var(--brand)' : pct >= 50 ? 'var(--save)' : 'var(--hot)');
  return (
    <div className="col gap-2" style={{ width: '100%' }}>
      {label && (
        <div className="row between" style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span className="mono">{value.toFixed ? value.toFixed(0) : value}/{max}</span>
        </div>
      )}
      <div className="bar-track">
        <div className="bar-fill" style={{ width: pct + '%', background: c }} />
      </div>
    </div>
  );
}

// ============ Box / dot plot ============
function DotPlot({ items, w = 500, h = 80, color = 'var(--brand)', highlight }) {
  const values = items.map(i => i.value);
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pad = 24;
  const innerW = w - pad * 2;
  const sx = v => pad + ((v - min) / span) * innerW;
  const y = h / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <line x1={pad} x2={w - pad} y1={y} y2={y} stroke="var(--rule-2)" strokeWidth="1" />
      {items.map((it, i) => {
        const isHi = it.highlight || it.value === highlight;
        return (
          <g key={i}>
            <circle cx={sx(it.value)} cy={y} r={isHi ? 7 : 5}
              fill={isHi ? color : 'white'} stroke={isHi ? 'white' : color} strokeWidth={isHi ? 3 : 2} />
          </g>
        );
      })}
      <text x={pad} y={h - 4} fontSize="10" fill="var(--ink-3)" fontFamily="var(--mono)">{min.toFixed(2)}</text>
      <text x={w - pad} y={h - 4} fontSize="10" fill="var(--ink-3)" textAnchor="end" fontFamily="var(--mono)">{max.toFixed(2)}</text>
    </svg>
  );
}

Object.assign(window, {
  Sparkline, PriceChart, MultiLineChart, BarChart, StackedBars, Donut, Heatmap, Gauge, KPI, ScoreBar, DotPlot,
});
