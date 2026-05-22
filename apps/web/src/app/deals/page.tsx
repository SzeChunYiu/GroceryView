import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { expiryDealRadar, expiryDealRadarReports, kidsSnackLunchboxDeals, singlePortionDealFinder } from '@/lib/demo-data';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function sourceFor(reportId: string) {
  return expiryDealRadarReports.find((report) => report.id === reportId)?.source ?? 'timestamped expiry report';
}

export default function DealsPage() {
  const activeItems = expiryDealRadar.radar.stores.flatMap((store) => store.items.map((item) => ({ ...item, storeName: store.storeName })));
  return (
    <PageShell>
      <Eyebrow>Expiry deal radar</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Markdowns before they disappear</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page calls buildExpiryDealRadar with visible product rows plus timestamped expiry-sticker reports. Expired and stale evidence stays visible as coverage context, but it is not promoted as an active deal.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Active markdowns</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{activeItems.length}</p>
          <p className="mt-3 font-semibold text-slate-700">from {expiryDealRadar.reportCount} timestamped reports · confidence {expiryDealRadar.coverage.confidence}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Radar alerts</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{expiryDealRadar.radar.alerts.length}</p>
          <p className="mt-3 font-semibold text-slate-700">Verified high-score markdowns only; needs-confirmation rows do not alert.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Stale evidence</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{expiryDealRadar.radar.staleReportIds.length}</p>
          <p className="mt-3 font-semibold text-slate-700">{expiryDealRadar.coverage.caveat}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Live expiry markdown board</h2>
        <div className="mt-4 space-y-3">
          {activeItems.map((item) => (
            <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${item.productId}`} key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-black text-slate-950">{item.productName}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.storeName} · {item.category} · {sourceFor(item.id)}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-800">{item.markdownPercent}% off</p>
                  <p className="text-sm font-semibold text-slate-600">radarScore {item.radarScore} · {item.urgency.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-4">
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Now {formatSek(item.currentPrice)}</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Saves {formatSek(item.savings)}</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Expires in {item.hoursUntilExpiry}h</p>
                <p className={`rounded-2xl p-3 font-semibold ${item.verification === 'verified' ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'}`}>{item.verification.replace('_', ' ')}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Students / young singles</p>
        <h2 className="mt-2 text-2xl font-black">Single-portion deals</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          This student view calls rankDealOpportunities, then keeps only visible small-pack deals that make sense for one-person baskets instead of family-size bulk buys.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {singlePortionDealFinder.rankedDeals.map((deal) => (
            <Link className="block rounded-2xl border border-emerald-200 bg-white p-4 hover:border-emerald-700" href={`/products/${deal.productId}`} key={`${deal.storeId}-${deal.productId}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">{deal.productName}</p>
                  <p className="mt-1 text-sm text-slate-600">{deal.storeName} · {deal.portionLabel}</p>
                </div>
                <p className="text-2xl font-black text-emerald-800">{formatSek(deal.currentPrice)}</p>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                <p className="rounded-2xl bg-emerald-100 p-3 font-semibold">{deal.discountPercent}% below regular</p>
                <p className="rounded-2xl bg-emerald-100 p-3 font-semibold">{deal.band.label}</p>
                <p className="rounded-2xl bg-emerald-100 p-3 font-semibold">Deal Score {deal.dealScore}</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-600">{deal.source}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{singlePortionDealFinder.coverage.caveat}</p>
      </Card>

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-800">{kidsSnackLunchboxDeals.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Kids snack & lunchbox deals</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          This family feed calls rankDealOpportunities, then shows only visible lunchboxFit rows that can support school snacks or packed lunches without using sponsored boosts.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {kidsSnackLunchboxDeals.rankedDeals.map((deal) => (
            <Link className="block rounded-2xl border border-blue-200 bg-white p-4 hover:border-blue-700" href={`/products/${deal.productId}`} key={`${deal.storeId}-${deal.productId}`}>
              <p className="text-lg font-black text-slate-950">{deal.productName}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{deal.storeName} · {deal.lunchboxFit}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p className="rounded-2xl bg-blue-100 p-3 font-semibold">{formatSek(deal.currentPrice)} now</p>
                <p className="rounded-2xl bg-blue-100 p-3 font-semibold">{deal.discountPercent}% below regular</p>
                <p className="rounded-2xl bg-emerald-50 p-3 font-black text-emerald-900">Deal Score {deal.dealScore}</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-600">{deal.source}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{kidsSnackLunchboxDeals.coverage.caveat}</p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Stale or expired reports</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">These report IDs are deliberately excluded from active ranking by buildExpiryDealRadar: {expiryDealRadar.radar.staleReportIds.join(', ') || 'none'}.</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
