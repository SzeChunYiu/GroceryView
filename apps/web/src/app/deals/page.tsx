import Link from 'next/link';
import { calculateBrandTierIndices } from '@groceryview/core';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { buildBrandTierPriceObservations } from '@/lib/chain-index-data';
import { expiryDealRadar, expiryDealRadarReports, kidsSnackLunchboxDeals, singlePortionDealFinder } from '@/lib/demo-data';
import { digitalCatalogueOfferBoard, flyerValidityCalendar, offerExpiryReminderBoard } from '@/lib/verified-data';
import { unknownUnitPriceLabel } from '@/lib/i18n';
import { routeMetadata } from '@/lib/seo';
import { screenerDefaultHref } from '@/lib/screener-query';

const premiumTierSummary = calculateBrandTierIndices(buildBrandTierPriceObservations());
const premiumTierTracking = {
  persona: 'Deal-hunters / foodies',
  premiumGapPercent: premiumTierSummary.premiumGapPercent,
  specialtyCategories: premiumTierSummary.highestSavingsCategories,
  rows: premiumTierSummary.indices.filter((tier) => ['premium', 'organic_private_label', 'national'].includes(tier.brandTier)),
  guardrails: [
    'Uses the observed brand-tier basket from buildBrandTierPriceObservations, not a forecast.',
    'Premium tier rows are fixed-basket index evidence, not product quality or taste claims.',
    'Specialty basket tracking stays separate from checkout savings until a current product price row exists.'
  ]
};

export function generateMetadata() {
  return routeMetadata('/deals');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatPct(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(value) + '%';
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

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Deal screener</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Dedicated verified screener</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Richer deal ranking now lives in the dedicated /screener route, which separates sort/filter mechanics from the legacy expiry-focused deals surface.
            </p>
          </div>
          <Link
            className="h-fit rounded-xl border border-emerald-900 bg-emerald-900 px-4 py-3 text-sm font-black text-white hover:brightness-110"
            href={screenerDefaultHref()}
          >
            Open verified deal screener →
          </Link>
        </div>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">{premiumTierTracking.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Specialty & premium tier tracking</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Foodies can now track the premium tier and specialty basket pressure with calculateBrandTierIndices over the observed brand-tier basket. The premiumGapPercent is a fixed-basket index gap against private-label tiers, not a forecast, rating, or taste claim.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">premiumGapPercent</span>
                <span className="mt-1 block text-3xl font-black text-fuchsia-900">{formatPct(premiumTierTracking.premiumGapPercent)}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">specialty basket</span>
                <span className="mt-1 block text-lg font-black text-slate-950">{premiumTierTracking.specialtyCategories.join(', ')}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">tracked tiers</span>
                <span className="mt-1 block text-3xl font-black text-slate-950">{premiumTierTracking.rows.length}</span>
              </p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-fuchsia-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Premium tier evidence</h3>
            <div className="mt-3 space-y-2">
              {premiumTierTracking.rows.map((tier) => (
                <div className="rounded-2xl bg-fuchsia-50 p-3" key={tier.brandTier}>
                  <p className="text-sm font-black text-slate-950">{tier.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">index {tier.value} · movement {formatPct(tier.movementPercent)} · {tier.categoryCount} categories</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {premiumTierTracking.guardrails.map((guardrail) => (
                <li key={guardrail}>• {guardrail}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-orange-200 bg-orange-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-800">Flyer / digital-catalog ingestion</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">ICA e-magin catalogue offers</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              These rows come from the generated ICA public weekly-offer export. The UI keeps retailer priceText, comparisonPrice, regularPriceText, sourceUrl, and flyerPdfUrl visible instead of pretending every flyer row has a computed checkout saving.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-right shadow-sm">
            <p className="text-4xl font-black text-orange-900">{digitalCatalogueOfferBoard.offerCount.toLocaleString('sv-SE')}</p>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">real weekly offer rows</p>
            <p className="mt-2 text-xs font-semibold text-slate-600">{digitalCatalogueOfferBoard.storeCount} ICA stores · {digitalCatalogueOfferBoard.flyerCount} flyer PDFs</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {digitalCatalogueOfferBoard.sampleOffers.slice(0, 3).map((offer) => (
            <a className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm hover:border-orange-600" href={offer.sourceUrl} key={offer.code}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">{offer.storeName}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{offer.productName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{offer.evidenceLabel}</p>
              <p className="mt-3 text-2xl font-black text-orange-900">{offer.priceText}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{offer.comparisonPrice}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">validTo {offer.validTo.slice(0, 10)} · flyerPdfUrl retained</p>
            </a>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white/80 p-3 text-sm font-bold text-orange-950">
          {digitalCatalogueOfferBoard.guardrails[1]}
        </p>
      </Card>

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


      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Matpriskollen validity windows</p>
        <h2 className="mt-2 text-2xl font-black">Offer expiry reminders</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Built from {offerExpiryReminderBoard.retrievedOfferCount.toLocaleString('sv-SE')} real Matpriskollen offer rows. We show validFrom and validTo exactly as source evidence so shoppers can plan expiring deals without invented start dates.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {offerExpiryReminderBoard.rows.map((offer) => (
            <a className="block rounded-2xl border border-amber-200 bg-white p-4 hover:border-amber-700" href={offer.productUrl} key={`${offer.store}-${offer.name}-${offer.validTo}`} rel="noreferrer" target="_blank">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">{offer.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{offer.store} · {offer.brand || 'Brand not reported'} · {offer.category}</p>
                </div>
                <p className="text-2xl font-black text-amber-800">{offer.priceText}</p>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                <p className="rounded-2xl bg-amber-100 p-3 font-semibold">validFrom {offer.validFrom}</p>
                <p className="rounded-2xl bg-amber-100 p-3 font-semibold">validTo {offer.validTo}</p>
                <p className="rounded-2xl bg-amber-100 p-3 font-semibold">{offer.comparePriceText || unknownUnitPriceLabel}</p>
                <p className="rounded-2xl bg-amber-100 p-3 font-semibold">{offer.requiresMembershipCard ? 'Membership card needed' : 'No membership flag'} · {offer.requiresCoupon ? 'coupon needed' : 'no coupon flag'}</p>
              </div>
              <p className="mt-3 break-all text-xs font-semibold text-slate-600">sourceUrl: {offer.sourceUrl}</p>
            </a>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-black text-amber-950">
          No deal starts tomorrow claim unless a future validFrom date exists in source data.
        </p>
        <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
          {offerExpiryReminderBoard.guardrails.map((guardrail) => (
            <li key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>


      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Flyer planning</p>
        <h2 className="mt-2 text-2xl font-black">Flyer validity calendar</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Starts tomorrow is shown only when Matpriskollen validFrom has rows for {flyerValidityCalendar.tomorrowDate}. Current status: {flyerValidityCalendar.startsTomorrow ? 'verified starts tomorrow rows exist' : flyerValidityCalendar.unsupportedTomorrowClaim}.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {flyerValidityCalendar.validityDays.map((day) => (
            <div className="rounded-2xl border border-cyan-200 bg-white p-4" key={day.date}>
              <p className="text-lg font-black text-slate-950">{day.date}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p className="rounded-2xl bg-cyan-100 p-3 font-semibold">validFrom starts: {day.startingOfferCount}</p>
                <p className="rounded-2xl bg-cyan-100 p-3 font-semibold">validTo endings: {day.endingOfferCount}</p>
                <p className="rounded-2xl bg-cyan-100 p-3 font-semibold">stores covered: {day.storeCount}</p>
              </div>
              <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
                {day.sample.map((offer) => (
                  <li key={`${day.date}-${offer.store}-${offer.name}`}>
                    {offer.store}: {offer.name} · {offer.priceText} · validFrom {offer.validFrom} · validTo {offer.validTo}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Students / young singles</p>
        <h2 className="mt-2 text-2xl font-black">Single-portion deals</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          This student view calls rankSinglePortionDeals over real Axfood rows, then keeps only visible small-pack deals that make sense for one-person baskets instead of family-size bulk buys.
        </p>
        <div className="mt-4 grid gap-2 text-sm text-emerald-950 md:grid-cols-4">
          <p className="rounded-2xl bg-white p-3 font-black">{singlePortionDealFinder.coverage.rankedCount} recommended</p>
          <p className="rounded-2xl bg-white p-3 font-black">{singlePortionDealFinder.coverage.excludedBulkWithoutAssumptionCount} bulk rows blocked</p>
          <p className="rounded-2xl bg-white p-3 font-black">{singlePortionDealFinder.coverage.excludedHighWasteCount} high-waste rows blocked</p>
          <p className="rounded-2xl bg-white p-3 font-black">{singlePortionDealFinder.coverage.confidence} confidence</p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {singlePortionDealFinder.rankedDeals.map((deal) => (
            <Link className="block rounded-2xl border border-emerald-200 bg-white p-4 hover:border-emerald-700" href={`/products/${deal.productId}`} key={`${deal.storeId}-${deal.productId}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">{deal.productName}</p>
                  <p className="mt-1 text-sm text-slate-600">{deal.storeName} · {deal.packageLabel} · {deal.servingCount} serving{deal.servingCount === 1 ? '' : 's'}</p>
                </div>
                <p className="text-2xl font-black text-emerald-800">{formatSek(deal.currentPrice)}</p>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                <p className="rounded-2xl bg-emerald-100 p-3 font-semibold">{formatSek(deal.perServingCost)} / serving</p>
                <p className="rounded-2xl bg-emerald-100 p-3 font-semibold">Waste risk {deal.wasteRisk}</p>
                <p className="rounded-2xl bg-emerald-100 p-3 font-semibold">Deal Score {deal.dealScore}</p>
              </div>
              <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{deal.servingSizeLabel}</p>
              {deal.bulkCaveat ? (
                <p className="mt-3 rounded-2xl bg-amber-100 p-3 text-xs font-black text-amber-950">{deal.bulkCaveat}</p>
              ) : null}
              <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Cheaper per-serving alternatives</p>
                {deal.cheaperAlternatives.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-700">
                    {deal.cheaperAlternatives.slice(0, 2).map((alternative) => (
                      <li key={alternative.productId}>{alternative.productName} · {alternative.storeName} · {formatSek(alternative.perServingCost)} / serving</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-slate-600">No cheaper visible single-portion alternative in this evidence set.</p>
                )}
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-600">{deal.sourceLabel}</p>
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
