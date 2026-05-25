import Link from 'next/link';
import { buildExpiryDealRadar } from '@groceryview/core';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { expiryDealRadarReports } from '@/lib/expiry-deals-data';
import { routeMetadata } from '@/lib/seo';

const expiryDealReports = expiryDealRadarReports;
const now = '2026-05-22T10:00:00.000Z';
const maxDistanceKm = 5;
const radar = buildExpiryDealRadar({
  now,
  reports: expiryDealReports,
  maxDistanceKm
});

const activeItems = radar.stores.flatMap((store) =>
  store.items.map((item) => ({
    ...item,
    storeName: store.storeName,
    source: expiryDealReports.find((report) => report.id === item.id)?.source ?? 'timestamped expiry report'
  }))
);

const staleReports = expiryDealReports.filter((report) => radar.staleReportIds.includes(report.id));
const confidenceLevel = activeItems.length === 0
  ? 'low'
  : activeItems.every((item) => item.verification === 'verified')
    ? 'high'
    : 'medium';

export function generateMetadata() {
  return routeMetadata('/expiry-deals');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatHours(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value);
}

function confidenceFor(item: { verification: 'verified' | 'needs_confirmation'; photoCount: number; verificationCount: number }) {
  if (item.verification === 'verified') {
    return {
      level: 'high' as const,
      label: item.photoCount > 0 ? 'photo verified' : 'multi-report verified',
      sampleSize: item.verificationCount + item.photoCount
    };
  }

  return {
    level: 'low' as const,
    label: 'needs confirmation',
    sampleSize: item.verificationCount + item.photoCount
  };
}

export default function ExpiryDealsPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>Expiry deal radar</Eyebrow>
          <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight text-slate-950">Near-expiry markdowns with visible confidence</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            This route calls buildExpiryDealRadar from @groceryview/core with timestamped visible product rows and community expiry-sticker reports. Expired or stale evidence is retained below, but only current near-expiry rows are ranked as active deals.
          </p>
        </div>
        <ConfidenceBadge level={confidenceLevel} label="radar confidence" sampleSize={expiryDealReports.length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Active deals</p>
          <p className="mt-2 text-4xl font-black text-emerald-800">{activeItems.length}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">within {maxDistanceKm} km</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Radar alerts</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{radar.alerts.length}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">verified rows scoring 75+</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Stores</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{radar.stores.length}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">ranked by top score</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Stale reports</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{radar.staleReportIds.length}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">excluded from active ranking</p>
        </Card>
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Current near-expiry board</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Ranked output from buildExpiryDealRadar combines markdown depth, hours until expiry, freshness, photo evidence, and verification count.
            </p>
          </div>
          <p className="rounded-lg bg-white px-3 py-2 text-sm font-black text-emerald-950">Snapshot {now.slice(0, 10)}</p>
        </div>

        <div className="mt-5 space-y-3">
          {activeItems.map((item) => {
            const confidence = confidenceFor(item);
            return (
              <Link className="block rounded-lg border border-emerald-100 bg-white p-4 shadow-sm hover:border-emerald-700" href={`/products/${item.productId}`} key={item.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{item.storeName} - {item.category}</p>
                    <h3 className="mt-2 text-xl font-black text-slate-950">{item.productName}</h3>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{item.source}</p>
                    <div className="mt-3">
                      <ConfidenceBadge {...confidence} />
                    </div>
                  </div>
                  <div className="grid min-w-64 grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                    <p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs uppercase text-slate-500">Now</span>{formatSek(item.currentPrice)}</p>
                    <p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs uppercase text-slate-500">Save</span>{formatSek(item.savings)}</p>
                    <p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs uppercase text-slate-500">Markdown</span>{item.markdownPercent}%</p>
                    <p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs uppercase text-slate-500">Score</span>{item.radarScore}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 md:grid-cols-3">
                  <p className="rounded-lg bg-slate-50 p-3">Expires in {formatHours(item.hoursUntilExpiry)} hours</p>
                  <p className="rounded-lg bg-slate-50 p-3">{item.urgency.replace('_', ' ')}</p>
                  <p className="rounded-lg bg-slate-50 p-3">{item.verification.replace('_', ' ')}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Alert threshold</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            Alerts stay narrower than the board: buildExpiryDealRadar emits them only for verified rows with a radarScore of at least 75.
          </p>
          <div className="mt-4 space-y-3">
            {radar.alerts.length > 0 ? radar.alerts.map((alert) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={alert.reportId}>
                <p className="font-black text-slate-950">{alert.message}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">reportId {alert.reportId}</p>
              </div>
            )) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-700">No active row currently has both verified evidence and a 75+ radarScore.</p>
            )}
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <h2 className="text-2xl font-black tracking-tight text-amber-950">Stale evidence kept visible</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
            These source rows remain auditable but are excluded because they are expired or older than the radar freshness window.
          </p>
          <div className="mt-4 space-y-3">
            {staleReports.map((report) => (
              <div className="rounded-lg bg-white p-4" key={report.id}>
                <p className="font-black text-slate-950">{report.productName}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{report.storeName}</p>
                <p className="mt-2 text-xs font-bold text-amber-900">{report.source}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
