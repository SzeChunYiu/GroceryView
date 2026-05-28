import Link from 'next/link';
import { FeaturePlacementMap } from '@/components/feature-placement-map';
import { PageShell } from '@/components/data-ui';
import { PageQuestionHeader } from '@/components/mvp/handoff-content';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { DealBadge } from '@/components/mvp/deal-badge';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { NoVerifiedDataPanel } from '@/components/mvp/no-verified-data-panel';
import { RelatedLinksPanel } from '@/components/mvp/related-links-panel';
import { ChartShell, ChartTableFallback, DistributionBand } from '@/components/mvp/visual-intelligence';
import { buildPantryReplacementFilter } from '@/lib/pantry';
import { getDealsPageData } from '@/lib/mvp/data';
import { formatSek } from '@/lib/mvp/format';
import type { DealLabel } from '@/lib/mvp/types';
import {
  categoryBrowseHref,
  categoryMarketHref,
  dealsRoute,
  methodologyDealScoreHref,
  productRoute,
  searchRoute,
  storeSlugHref
} from '@/lib/mvp/routes';
import { routeMetadata } from '@/lib/seo';
import { buildSinglePortionDealFinder } from '@/lib/single-portion-deals';
import { labelFromSlug, snapshot, topChainSpreads } from '@/lib/verified-data';

type SearchParams = Record<string, string | string[] | undefined>;

const singlePortionDealFinder = buildSinglePortionDealFinder(topChainSpreads, labelFromSlug, { limit: 4 });

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dealsHref(tab: DealLabel | 'all', chain?: string, category?: string) {
  if (tab === 'all') return dealsRoute({ chain, category });
  return dealsRoute({ tab, chain, category });
}

export function generateMetadata() {
  return routeMetadata('/deals');
}

export default async function DealsPage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const params = (await searchParams) ?? {};
  const replacementFilter = buildPantryReplacementFilter(paramValue(params.replace));
  const data = getDealsPageData(params);
  const dealQualityRows = [
    {
      label: 'Real Deal',
      count: data.deals.filter((deal) => deal.dealLabel === 'real_deal').length,
      detail: 'Strong price-history or nearby comparison support.'
    },
    {
      label: 'Fair Discount',
      count: data.deals.filter((deal) => deal.dealLabel === 'fair_discount').length,
      detail: 'Useful reduction, but not the strongest observed opportunity.'
    },
    {
      label: 'Not Really a Deal',
      count: data.deals.filter((deal) => deal.dealLabel === 'not_really_a_deal').length,
      detail: 'Highlighted price lacks enough evidence for a strong discount claim.'
    }
  ];
  const totalDealRows = Math.max(1, data.deals.length);

  return (
    <PageShell>
      <MvpBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Deals' }]} />
      <PageQuestionHeader
        eyebrow="Deals"
        question="Is this advertised deal actually good?"
        title={replacementFilter ? `Replacement deals for ${replacementFilter.label}` : 'Real grocery deals'}
        subtitle="We compare advertised or current prices with price history and nearby stores to show whether a deal is truly worth it."
        evidence={
          <p className="text-sm font-semibold text-slate-600">
            Snapshot {snapshot.retrievedLabel} · {snapshot.axfoodSource}
            <br />
            Freshly observed products · source refresh · observed rows only · without synthetic discounts
          </p>
        }
      />

      <div className="mt-6">
        <FeaturePlacementMap compact focus="deals" />
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Deal label explanation">
        {[
          ['Real Deal', 'Clearly cheaper than usual and competitive against nearby stores.'],
          ['Fair Discount', 'Lower than normal, but not exceptional.'],
          ['Not Really a Deal', 'Advertised or highlighted, but price history or nearby comparison does not support a strong discount.']
        ].map(([label, detail]) => (
          <article className="rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-sm" key={label}>
            <h2 className="text-lg font-black text-slate-950">{label}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
          </article>
        ))}
      </section>

      <div className="mt-6">
        <ChartShell
          actionHref="/methodology#deal-score"
          actionLabel="Read deal-score method"
          evidenceItems={[`${data.deals.length} visible deals`, snapshot.retrievedLabel, 'Observed rows only']}
          hasData={data.deals.length > 0}
          insightTitle="Deal quality distribution"
          plainSummary="This visual shows how many visible deals are strong, fair, or weak so the page does not over-emphasize a single advertised discount."
          userQuestion="How strong are the current deal labels?"
          fallback={
            <ChartTableFallback
              caption="Deal quality distribution table"
              columns={[
                { key: 'label', label: 'Label', render: (row: (typeof dealQualityRows)[number]) => row.label },
                { key: 'count', label: 'Count', render: (row: (typeof dealQualityRows)[number]) => row.count.toLocaleString('sv-SE') },
                { key: 'detail', label: 'Why it ranks there', render: (row: (typeof dealQualityRows)[number]) => row.detail }
              ]}
              rows={dealQualityRows}
            />
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            {dealQualityRows.map((row) => (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={row.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-950">{row.label}</p>
                  <p className="font-mono text-2xl font-black text-emerald-800">{row.count}</p>
                </div>
                <DistributionBand current={row.count} label={`${row.label} share of visible deals`} max={totalDealRows} min={0} />
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{row.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-950">
            Why-ranked explanation: deal labels are ranked from observed discount strength, historic context when available, current price, source confidence, and nearby comparison evidence. Missing history keeps the claim cautious.
          </p>
        </ChartShell>
      </div>

      <section className="mt-6 rounded-[2rem] border border-sky-200 bg-sky-50/70 p-5" aria-label="Deal feed filters by chain and category">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Deal tabs</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.tabs.map((tab) => (
            <Link
              className={`rounded-full px-3 py-2 text-xs font-black ${data.activeTab === tab.id ? 'bg-sky-900 text-white' : 'bg-white text-slate-700'}`}
              href={dealsHref(tab.id, data.filters.chain, data.filters.category)}
              key={tab.id}
            >
              {tab.label} ({tab.count})
            </Link>
          ))}
        </div>
      </section>

      <MvpSectionCard className="mt-6" title="Verified deal feed">
        {data.deals.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.deals.map((deal) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-4" key={deal.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <DealBadge label={deal.dealLabel} />
                  <Link className="text-lg font-black text-emerald-800" href={productRoute(deal.product.id)}>
                    {formatSek(deal.currentPrice)}
                  </Link>
                </div>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  <Link href={productRoute(deal.product.id)}>{deal.product.name}</Link>
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-600">
                  {deal.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                  {deal.historicDiscountPct === undefined ? (
                    <li className="text-amber-800">Historic comparison unavailable — treat discount depth cautiously.</li>
                  ) : null}
                </ul>
                <div className="mt-3">
                  <EvidenceStrip evidence={deal} />
                </div>
                <div className="mt-4">
                  <RelatedLinksPanel
                    links={[
                      { label: 'Product detail', href: productRoute(deal.product.id), detail: deal.product.name },
                      {
                        label: `Search ${deal.product.name}`,
                        href: searchRoute({ q: deal.product.name, category: deal.product.categorySlug, chain: deal.chain?.toLowerCase() })
                      },
                      { label: `${deal.product.categoryName} market`, href: categoryMarketHref(deal.product.categorySlug) },
                      { label: `Browse ${deal.product.categoryName}`, href: categoryBrowseHref(deal.product.categorySlug) },
                      ...(deal.chain
                        ? [{ label: `${deal.chain} store`, href: storeSlugHref(deal.chain.toLowerCase()), detail: 'Chain landing when store ID unavailable' }]
                        : []),
                      { label: 'How deal score works', href: methodologyDealScoreHref() }
                    ]}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <NoVerifiedDataPanel title="No verified deals match these filters" />
        )}
      </MvpSectionCard>

      <section className="mt-6 rounded-[2rem] border border-violet-200 bg-violet-50/80 p-5 shadow-sm" aria-label="Single shopper small portion deals" data-single-portion-deal-finder>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">Students / young singles</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Small-portion deals with waste checks</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-violet-950">
            Ranked from verified Axfood rows by package size, estimated serving count, per-serving cost, and waste risk. Bulk-only deals stay out unless the serving and storage assumptions are visible.
          </p>
        </div>
        {singlePortionDealFinder.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {singlePortionDealFinder.map((deal) => (
              <Link className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700" href={`/products/${deal.productSlug}`} key={deal.productSlug}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">{deal.chainLabel} · {deal.categoryLabel}</p>
                <h3 className="mt-2 text-lg font-black leading-6 text-slate-950">{deal.productName}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{deal.brand} · {deal.packageSizeLabel}</p>
                <div className="mt-3 grid gap-2 rounded-2xl bg-violet-50 p-3 text-xs font-bold text-violet-950">
                  <p>{deal.totalPriceLabel} total · {deal.perServingCostLabel}</p>
                  <p>{deal.servingLabel}</p>
                  <p>{deal.wasteRiskLabel}</p>
                </div>
                {deal.cheaperAlternative ? (
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
                    Cheaper alternative: {deal.cheaperAlternative.productName} at {deal.cheaperAlternative.perServingCostLabel}.
                  </p>
                ) : (
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">No lower per-serving match in the current verified small-portion set.</p>
                )}
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{deal.confidenceLabel} {deal.sourceLabel}</p>
              </Link>
            ))}
          </div>
        ) : (
          <NoVerifiedDataPanel title="No verified small-portion deals match the current snapshot" />
        )}
      </section>

      {replacementFilter ? (
        <MvpSectionCard className="mt-6" title="Pantry replacement matches">
          <p className="text-sm font-semibold text-slate-700">
            Replacement deals for {replacementFilter.label} use pantryReplacementMatches on observed rows only.
          </p>
        </MvpSectionCard>
      ) : null}
    </PageShell>
  );
}
