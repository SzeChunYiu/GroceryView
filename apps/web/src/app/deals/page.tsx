import Link from 'next/link';
import { PageShell } from '@/components/data-ui';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpPageHeader } from '@/components/mvp/mvp-page-header';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { DealBadge } from '@/components/mvp/deal-badge';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { NoVerifiedDataPanel } from '@/components/mvp/no-verified-data-panel';
import { RelatedLinksPanel } from '@/components/mvp/related-links-panel';
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
import { snapshot } from '@/lib/verified-data';

type SearchParams = Record<string, string | string[] | undefined>;

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

  return (
    <PageShell>
      <MvpBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Deals' }]} />
      <MvpPageHeader
        eyebrow="Deals"
        title={replacementFilter ? `Replacement deals for ${replacementFilter.label}` : 'Are supermarket deals actually good?'}
        subtitle="Each card compares current prices with historic medians and nearby chain evidence. GroceryView labels deals as Real Deal, Fair Discount, or Not Really a Deal instead of trusting campaign copy alone."
        evidence={
          <p className="text-sm font-semibold text-slate-600">
            Snapshot {snapshot.retrievedLabel} · {snapshot.axfoodSource}
            <br />
            Freshly observed products · source refresh · observed rows only · without synthetic discounts
          </p>
        }
      />

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
