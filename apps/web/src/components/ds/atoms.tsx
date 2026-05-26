/**
 * GroceryView v3 design-system atoms. Thin, typed React components over the
 * design-system.css classes (see apps/web/src/styles/design-system.css).
 * Server-renderable (no hooks); tooltips use native title for zero-JS a11y.
 * Ported from the approved prototype (/tmp/gv-design/components.jsx).
 */
import * as React from 'react';

type Tone = 'default' | 'save' | 'up' | 'down' | 'hot' | 'brand' | 'info' | 'warn';

// ============ ExplainChip — plain-language "?" explainer (accessibility core) ============
export function ExplainChip({ children, hint }: { children: React.ReactNode; hint: string }) {
  return (
    <span className="explain" title={hint} aria-label={`${typeof children === 'string' ? children : ''}: ${hint}`}>
      {children}
      <span className="q" aria-hidden="true">?</span>
    </span>
  );
}

// ============ Pill ============
export function Pill({ tone = 'default', lg, children }: { tone?: Tone; lg?: boolean; children: React.ReactNode }) {
  return <span className={`pill${tone !== 'default' ? ' ' + tone : ''}${lg ? ' lg' : ''}`}>{children}</span>;
}

// ============ Card ============
export function Card({
  children,
  tight,
  brand,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { tight?: boolean; brand?: boolean }) {
  return (
    <div className={`card${tight ? ' tight' : ''}${brand ? ' brand' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}

// ============ KPI ============
export function KPI({ label, value, sub, hint, color }: { label: string; value: React.ReactNode; sub?: React.ReactNode; hint?: string; color?: string }) {
  return (
    <div className="card col gap-3">
      <div className="row between">
        {hint ? <ExplainChip hint={hint}><span className="kpi-label">{label}</span></ExplainChip> : <span className="kpi-label">{label}</span>}
      </div>
      <div className="kpi-value" style={color ? { color } : undefined}>{value}</div>
      {sub != null && <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{sub}</div>}
    </div>
  );
}

// ============ StatRow (label · value · hint) ============
export function StatRow({ label, value, hint, big, color }: { label: string; value: React.ReactNode; hint?: string; big?: boolean; color?: string }) {
  return (
    <div className="col gap-1">
      {hint ? <ExplainChip hint={hint}><span className="kpi-label">{label}</span></ExplainChip> : <span className="kpi-label">{label}</span>}
      <span className="mono" style={{ fontSize: big ? 22 : 15, fontWeight: 600, color: color || 'var(--ink)' }}>{value}</span>
    </div>
  );
}

// ============ ChainSwatch — colored chain initials badge ============
export function ChainSwatch({ color, initials, size = 22 }: { color: string; initials: string; size?: number }) {
  return (
    <span className="swatch" style={{ background: color, width: size, height: size }} aria-hidden="true">
      {initials}
    </span>
  );
}

// ============ StoreChip ============
export function StoreChip({ name, color, initials }: { name: string; color: string; initials: string }) {
  return (
    <span className="store-chip">
      <ChainSwatch color={color} initials={initials} />
      {name}
    </span>
  );
}

// ============ Breadcrumb ============
export function Breadcrumb({ path }: { path: { label: string; href?: string }[] }) {
  return (
    <nav className="row gap-2 eyebrow" aria-label="Breadcrumb">
      {path.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden="true">/</span>}
          {p.href ? <a href={p.href}>{p.label}</a> : <span>{p.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ============ SavingsBanner — editorial insight banner ============
export function SavingsBanner({ headline, detail, value, valueLabel }: { headline: React.ReactNode; detail?: React.ReactNode; value: React.ReactNode; valueLabel?: string }) {
  return (
    <div className="savings-banner">
      <div className="col gap-2" style={{ maxWidth: 560 }}>
        <div className="serif" style={{ fontSize: 26, lineHeight: 1.15 }}>{headline}</div>
        {detail != null && <div style={{ fontSize: 14, opacity: 0.85 }}>{detail}</div>}
      </div>
      <div className="col" style={{ alignItems: 'flex-end' }}>
        <div className="mono" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{value}</div>
        {valueLabel && <div className="eyebrow" style={{ opacity: 0.7 }}>{valueLabel}</div>}
      </div>
    </div>
  );
}

// ============ ProductTile — Bloomberg-ticker product card ============
export interface TileProduct {
  slug: string;
  name: string;
  brand?: string;
  size?: string;
  emoji?: string;
  price: number;
  regular?: number;
  unitPrice?: string;
  currency?: string;
  badge?: string;
  cheapestChain?: { name: string; color: string };
  verdict?: string;
}
export function ProductTile({ product, href, currency = 'kr' }: { product: TileProduct; href?: string; currency?: string }) {
  const p = product;
  const onSale = p.regular != null && p.regular > p.price;
  const inner = (
    <div className="tile">
      <div className="tile-image">
        {p.emoji || '🛒'}
        {p.badge && <span className="tile-badge">{p.badge}</span>}
      </div>
      <div className="col gap-2">
        {(p.brand || p.size) && <div className="tile-brand-size">{[p.brand, p.size].filter(Boolean).join(' · ')}</div>}
        <div className="tile-name">{p.name}</div>
        <div className="row gap-2 center wrap">
          <span className="tile-price">{p.price.toFixed(2)} {p.currency || currency}</span>
          {onSale && <span className="tile-price-old">{p.regular!.toFixed(2)}</span>}
        </div>
        {p.unitPrice && <div className="tile-unit-price">{p.unitPrice}</div>}
        {p.verdict && <span className="pill save" style={{ alignSelf: 'flex-start' }}>{p.verdict}</span>}
      </div>
      {p.cheapestChain && (
        <div className="tile-store">
          <span className="dot" style={{ background: p.cheapestChain.color }} />
          Cheapest at {p.cheapestChain.name}
        </div>
      )}
    </div>
  );
  return href ? <a href={href} aria-label={p.name}>{inner}</a> : inner;
}
