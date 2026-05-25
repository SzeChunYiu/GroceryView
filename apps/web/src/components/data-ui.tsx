import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppNav } from './app-nav';
import { BottomNav } from './bottom-nav';
import {
  formatPct,
  formatSek,
  keyMetrics,
  privateFeatureCopy,
  sourceCoverage,
  topChainSpreads,
  unavailablePanels
} from '@/lib/verified-data';
import type { PrivateFeatureRoute } from '@/lib/verified-data';
import { freshnessCopy, sourceLimitationCopy } from '@/lib/content-style';
import type { RetailerFreshnessBannerRow } from '@/lib/source-health';

export function PageShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}

export function Eyebrow({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">{children}</p>;
}

export function Card({ children, className = '' }: Readonly<{ children: ReactNode; className?: string }>) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white/88 p-5 shadow-sm ${className}`}>{children}</section>;
}

function freshnessBannerTone(status: RetailerFreshnessBannerRow['status']) {
  if (status === 'stale') return 'border-amber-300 bg-amber-50 text-amber-950';
  if (status === 'unknown') return 'border-slate-300 bg-slate-50 text-slate-950';
  return 'border-emerald-300 bg-emerald-50 text-emerald-950';
}

export function DataFreshnessBanner({ rows }: Readonly<{ rows: RetailerFreshnessBannerRow[] }>) {
  const staleRows = rows.filter((row) => row.status === 'stale');
  const unknownRows = rows.filter((row) => row.status === 'unknown');
  const affectedChainNames = [...new Set([...staleRows, ...unknownRows].flatMap((row) => row.affectedChains))];
  const statusLabel = staleRows.length > 0 ? 'Stale retailer data warning' : unknownRows.length > 0 ? 'Freshness evidence incomplete' : 'Retailer data freshness current';

  return (
    <Card className="mt-6 border-slate-300 bg-slate-950 text-white" data-retailer-freshness-banner="true">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">Data freshness banners</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">{statusLabel}</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Source-heavy retailer pages show the last successful ingest time, stale warnings, and affected chain names before shoppers compare prices.
          </p>
        </div>
        <div className="rounded-2xl bg-white/10 p-4 text-right">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">Affected chains</p>
          <p className="mt-2 text-xl font-black">{affectedChainNames.length ? affectedChainNames.join(', ') : 'None stale'}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {rows.map((row) => (
          <section className={`rounded-2xl border p-4 ${freshnessBannerTone(row.status)}`} data-source-freshness-status={row.status} key={row.name}>
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{row.status}</p>
            <h3 className="mt-2 text-lg font-black">{row.name}</h3>
            <p className="mt-2 text-sm font-semibold leading-6">Last successful ingest: {row.lastSuccessfulIngestLabel}</p>
            <p className="mt-1 text-sm font-semibold leading-6">
              {row.ageHours == null ? 'Age not available' : `${row.ageHours} hours old`} · stale after {row.staleAfterHours} hours
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em]">Affected: {row.affectedChains.join(', ')}</p>
            <p className="mt-3 rounded-xl bg-white/75 p-3 text-xs font-bold leading-5">{row.warning}</p>
          </section>
        ))}
      </div>
    </Card>
  );
}

export function MetricGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {keyMetrics.map((metric) => (
        <Card key={metric.label} className="p-4">
          <p className="text-sm font-semibold text-slate-600">{metric.label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{metric.value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{metric.detail}</p>
        </Card>
      ))}
    </div>
  );
}

export function SourceCoverage() {
  return (
    <Card>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Data provenance</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Only verified snapshot data is rendered</h2>
        </div>
        <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/data-sources">
          Data source notes live in docs/data-sources.md
        </Link>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {sourceCoverage.map((source) => (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={source.name}>
            <p className="text-sm font-black text-slate-950">{source.name}</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{source.rows.toLocaleString('sv-SE')}</p>
            <p className="text-sm font-semibold text-slate-700">{source.coverage}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Source: {source.source}. {freshnessCopy(source.freshness)}.</p>
            <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">{sourceLimitationCopy(source.caveat)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TopSpreads({ limit = 6 }: Readonly<{ limit?: number }>) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Eyebrow>Comparable prices</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Largest verified Willys/Hemköp spreads</h2>
        </div>
        <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/compare">Compare all</Link>
      </div>
      <div className="mt-5 divide-y divide-slate-200">
        {topChainSpreads.slice(0, limit).map((product) => (
          <Link className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]" href={`/products/${product.slug}`} key={product.slug}>
            <div>
              <p className="font-black text-slate-950">{product.name}</p>
              <p className="text-sm text-slate-600">{product.brand || 'Brand not reported'} · {product.subline || 'Size not reported'}</p>
            </div>
            <p className="font-black text-emerald-800">{formatSek(product.lowestPrice)}</p>
            <p className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950">{formatPct(product.spreadPct)} spread</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function NoVerifiedData({
  route,
  title = 'No verified records for this feature yet'
}: Readonly<{ route?: PrivateFeatureRoute; title?: string }>) {
  const routeCopy = route ? privateFeatureCopy[route] : null;
  return (
    <Card className="border-amber-200 bg-amber-50">
      <Eyebrow>Fail-closed UI</Eyebrow>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-950">
        This page intentionally avoids sample people, fake receipts, estimated coupons, and placeholder workflow rows. It shows only what the current generated data modules can support.
      </p>
      {routeCopy ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Verified surface</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{routeCopy.verifiedSurface}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Gate before launch</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{routeCopy.gatedBy}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Next verified step</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{routeCopy.nextStep}</p>
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {unavailablePanels.map((panel) => (
          <div className="rounded-2xl bg-white/70 p-4" key={panel.title}>
            <p className="font-black text-amber-950">{panel.title}</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">{panel.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
