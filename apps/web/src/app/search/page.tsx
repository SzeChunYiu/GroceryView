import Link from 'next/link';
import { SearchResultsGrid } from '@/components/search/search-results-grid';
import { Card, PageShell, SearchRecoveryPanel } from '@/components/data-ui';
import { GroceryViewSurfaceAnalytics } from '@/components/analytics/groceryview-surface-analytics';
import { PageQuestionHeader, GuidedEmptyState } from '@/components/mvp/handoff-content';
import { ChartShell, ChartTableFallback, Sparkline } from '@/components/mvp/visual-intelligence';
import { RecentSearchReplayPills } from '@/components/SearchBar';
import { SaveSearchSubscriptionButton } from '@/components/saved-search-subscriptions';
import { buildSavedSearchSubscription } from '@/lib/alert-scheduler';
import { metadataForSearch } from '@/lib/seo';
import { buildNoResultCorrectionWorkflow } from '@/lib/search-alias-review';
import { authenticatedSavedSearchShortcuts } from '@/lib/saved-searches';
import { buildMisspelledQueryRecovery } from '@/lib/search-suggest';
import { phoneticSearchBadgesForQuery } from '@/lib/search-filters';
import { seoLandingProducts } from '@/lib/seo-landing-pages';
import { buildFuelDomainSearchView } from '@/lib/fuel-domain';
import { buildPharmacyDomainSearchView } from '@/lib/pharmacy-domain';
import { buildProductSearchView } from '@/lib/verified-data';

type SearchPageParams = Record<string, string | string[] | undefined>;
const emptySearchPageParams: SearchPageParams = {};
const SEARCH_PAGE_SIZE = 24;
const domainTabs = [
  { value: 'all', label: 'All', href: '/search?domain=all' },
  { value: 'grocery', label: 'Grocery', href: '/search?domain=grocery' },
  { value: 'pharmacy', label: 'Pharmacy OTC', href: '/search?domain=pharmacy' },
  { value: 'fuel', label: 'Fuel', href: '/search?domain=fuel' }
] as const;
const searchSortControls = [
  { value: 'unit_price_asc', label: 'Cheapest' },
  { value: 'relevance', label: 'Best deal' },
  { value: 'newest_observation', label: 'Freshest' },
  { value: 'confidence_desc', label: 'Highest confidence' },
  { value: 'newest_observation', label: 'Price drop' },
  { value: 'unit_price_asc', label: 'Unit price' }
];

function firstParam(params: SearchPageParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function cursorOffset(params: SearchPageParams) {
  const parsed = Number.parseInt(firstParam(params, 'cursor'), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function cursorHref(params: SearchPageParams, nextOffset: number | null) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === 'cursor') continue;
    for (const item of Array.isArray(value) ? value : value ? [value] : []) {
      if (item) query.append(key, item);
    }
  }
  if (nextOffset !== null && nextOffset > 0) query.set('cursor', String(nextOffset));
  const serialized = query.toString();
  return serialized ? `/search?${serialized}` : '/search';
}

// routeMetadata('/search') is applied through metadataForSearch so query states can be canonicalized/noindexed.
export async function generateMetadata({ searchParams }: { searchParams?: Promise<SearchPageParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(emptySearchPageParams));
  return metadataForSearch(resolvedSearchParams);
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<SearchPageParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(emptySearchPageParams));
  const subscription = buildSavedSearchSubscription({ searchParams: resolvedSearchParams, path: '/search' });
  const query = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] ?? '' : resolvedSearchParams.q ?? '';
  const selectedSearchDomain = firstParam(resolvedSearchParams, 'domain') || 'grocery';
  const fuelSearchView = buildFuelDomainSearchView(resolvedSearchParams);
  const pharmacySearchView = buildPharmacyDomainSearchView(resolvedSearchParams);
  const searchView = buildProductSearchView(resolvedSearchParams);
  const offset = cursorOffset(resolvedSearchParams);
  const pagedResultCards = searchView.resultCards.slice(offset, offset + SEARCH_PAGE_SIZE);
  const previousOffset = offset > 0 ? Math.max(0, offset - SEARCH_PAGE_SIZE) : null;
  const nextOffset = offset + SEARCH_PAGE_SIZE < searchView.resultCards.length ? offset + SEARCH_PAGE_SIZE : null;
  const recovery = searchView.resultCards.length === 0 ? buildMisspelledQueryRecovery(query) : null;
  const noResultWorkflow = recovery ? buildNoResultCorrectionWorkflow(query) : null;
  const phoneticBadges = query.trim() ? phoneticSearchBadgesForQuery(query) : [];
  const normalizedQuery = query.trim().toLocaleLowerCase('sv-SE');
  const seoLandingMatches = normalizedQuery
    ? seoLandingProducts
      .filter((product) => `${product.name} ${product.brand} ${product.categoryLabel}`.toLocaleLowerCase('sv-SE').includes(normalizedQuery))
      .slice(0, 3)
    : seoLandingProducts.slice(0, 3);
  const resultEvidenceRows = pagedResultCards.slice(0, 4).map((card, index) => ({
    name: card.name,
    price: card.cheapestPriceLabel,
    evidence: `${card.sourceTables.join(' + ') || 'Verified product index'} · ${card.isAvailable ? 'priced row available' : 'availability not confirmed'}`,
    href: `/products/${card.slug}`,
    sparkline: [
      { label: 'result rank', value: Math.max(1, pagedResultCards.length - index) },
      { label: 'filtered rank', value: Math.max(1, pagedResultCards.length - index + 1) },
      { label: 'open detail', value: Math.max(1, pagedResultCards.length - index + 2) }
    ]
  }));
  const allDomainResultCards = [
    ...searchView.resultCards.slice(0, 3).map((card) => ({
      id: `grocery-${card.slug}`,
      type: 'Grocery product card',
      title: card.name,
      subtitle: `${card.brand ?? card.categoryLabel} · ${card.cheapestPriceLabel}`,
      href: `/products/${card.slug}`,
      mapHref: card.chainSlug ? `/map?domain=grocery&chain=${encodeURIComponent(card.chainSlug)}` : '/map?domain=grocery',
      watchHref: `/watchlist?domain=grocery&product=${encodeURIComponent(card.slug)}`,
      source: card.sourceTables.join(' + ') || 'Verified grocery product index',
      freshness: card.sortNewestObservedAt ? String(card.sortNewestObservedAt).slice(0, 10) : 'freshness unavailable',
      confidence: `${Math.round(Math.min(Math.max(card.sortConfidence ?? 0, 0), 1) * 100)}% confidence`,
      limitation: card.isAvailable ? 'Grocery price evidence only; final shelf availability can differ by store.' : 'Availability not confirmed; no stock claim.'
    })),
    ...pharmacySearchView.cards.slice(0, 3).map((card) => ({
      id: `pharmacy-${card.ean}`,
      type: 'Pharmacy OTC card',
      title: card.name,
      subtitle: `${card.brand} · EAN ${card.ean} · ${card.priceLabel}`,
      href: card.href,
      mapHref: card.mapHref,
      watchHref: card.alertHref,
      source: card.sourceLabel,
      freshness: card.retrievedAt,
      confidence: `${card.comparisonCount} exact-EAN row${card.comparisonCount === 1 ? '' : 's'} · ${card.chainCount} chain${card.chainCount === 1 ? '' : 's'}`,
      limitation: card.limitation
    })),
    ...fuelSearchView.gradeCards.slice(0, 2).map((card) => ({
      id: `fuel-grade-${card.id}`,
      type: 'Fuel grade/operator/station card',
      title: card.label,
      subtitle: `${card.operatorName} · ${card.priceLabel}`,
      href: card.href,
      mapHref: '/map?domain=fuel&layer=fuel-grade-availability',
      watchHref: '/watchlist?domain=fuel',
      source: card.sourceLabel,
      freshness: card.freshnessLabel,
      confidence: card.confidenceLabel,
      limitation: card.limitation
    })),
    ...fuelSearchView.stationCards.slice(0, 2).map((station) => ({
      id: `fuel-station-${station.osmId}`,
      type: 'Fuel grade/operator/station card',
      title: station.name,
      subtitle: `${station.chain} · ${station.gradeAvailability}`,
      href: station.href,
      mapHref: station.mapHref,
      watchHref: `/watchlist?domain=fuel&station=${station.osmId}`,
      source: station.sourceLabel,
      freshness: station.freshnessLabel,
      confidence: 'OSM location evidence + tagged grade availability',
      limitation: station.limitation
    }))
  ];

  const activeFilters = ['category', 'chain', 'type', 'region', 'store', 'dealLevel', 'sort']
    .map((key) => [key, firstParam(resolvedSearchParams, key)] as const)
    .filter(([, value]) => value);

  const domainTabsNav = (
    <section className="mx-auto mt-4 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Domain tabs">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Domain tabs</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {domainTabs.map((tab) => (
          <Link
            className={selectedSearchDomain === tab.value ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white' : 'rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-800'}
            data-gv-event="search_filter_applied"
            data-gv-filter-domain={tab.value}
            href={tab.href}
            key={tab.value}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </section>
  );

  if (selectedSearchDomain === 'all') {
    return (
      <PageShell data-gv-surface="search">
        <GroceryViewSurfaceAnalytics surface="search" />
        <PageQuestionHeader
          eyebrow="Search"
          question="Which grocery, pharmacy OTC, or fuel result should I open?"
          title={query ? `All-domain results for “${query}”` : 'All-domain search'}
          subtitle="Search across grocery products, Pharmacy OTC exact-EAN cards, and fuel grade/operator/station cards without mixing evidence types."
          actions={
            <form action="/search" className="flex min-w-[18rem] gap-2">
              <input name="domain" type="hidden" value="all" />
              <input className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold" defaultValue={query} name="q" placeholder="Search groceries, OTC, fuel…" type="search" />
              <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" data-gv-event="search_submitted" type="submit">Search all</button>
            </form>
          }
        />
        {domainTabsNav}
        <section className="mx-auto mt-6 w-full max-w-6xl" aria-label="All-domain search results">
          <ChartShell
            actionHref="/search?domain=all"
            actionLabel="Reset all-domain search"
            evidenceItems={[
              `${searchView.resultCards.length} grocery product candidates`,
              pharmacySearchView.evidenceSummary,
              fuelSearchView.evidenceSummary,
              'Every card shows source, freshness, confidence, and limitation before handoff.'
            ]}
            fallback={
              <ChartTableFallback
                caption="All-domain result cards"
                columns={[
                  { key: 'type', label: 'Result card type', render: (row: (typeof allDomainResultCards)[number]) => row.type },
                  { key: 'title', label: 'Result', render: (row: (typeof allDomainResultCards)[number]) => row.title },
                  { key: 'source', label: 'Source', render: (row: (typeof allDomainResultCards)[number]) => row.source },
                  { key: 'limitation', label: 'Limitation', render: (row: (typeof allDomainResultCards)[number]) => row.limitation }
                ]}
                rows={allDomainResultCards}
              />
            }
            hasData={allDomainResultCards.length > 0}
            insightTitle="Cross-domain search command center"
            plainSummary="All-domain search keeps Grocery product card, Pharmacy OTC card, and Fuel grade/operator/station card result types distinct while sharing route handoffs to detail, map, and watchlist."
            userQuestion="Which domain result has enough evidence to open?"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {allDomainResultCards.map((card) => (
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={card.id}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{card.type}</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{card.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-700">{card.subtitle}</p>
                  <dl className="mt-4 grid gap-2 text-xs font-bold leading-5 text-slate-700">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <dt className="font-black text-slate-950">source</dt>
                      <dd>{card.source}</dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <dt className="font-black text-slate-950">freshness</dt>
                      <dd>{card.freshness}</dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <dt className="font-black text-slate-950">confidence</dt>
                      <dd>{card.confidence}</dd>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-950">
                      <dt className="font-black">limitation</dt>
                      <dd>{card.limitation}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className="rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white" data-gv-event="cross_domain_result_clicked" href={card.href}>Open detail</Link>
                    <Link className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900" href={card.mapHref}>Open map</Link>
                    <Link className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900" data-gv-event="watchlist_item_added" href={card.watchHref}>Save alert</Link>
                  </div>
                </article>
              ))}
            </div>
          </ChartShell>
        </section>
      </PageShell>
    );
  }

  if (selectedSearchDomain === 'pharmacy') {
    return (
      <PageShell data-gv-surface="search">
        <GroceryViewSurfaceAnalytics surface="search" />
        <PageQuestionHeader
          eyebrow="Search"
          question="Which OTC exact-EAN pharmacy rows match my query?"
          title={query ? `Pharmacy OTC results for “${query}”` : 'Pharmacy OTC search'}
          subtitle="Search public OTC catalog rows by name, brand, chain, or exact EAN. Every card keeps no prescription or medical advice boundaries visible."
          actions={
            <form action="/search" className="flex min-w-[18rem] gap-2">
              <input name="domain" type="hidden" value="pharmacy" />
              <input className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold" defaultValue={query} name="q" placeholder="Search alvedon, ipren, EAN" type="search" />
              <button className="rounded-full bg-sky-800 px-4 py-2 text-sm font-black text-white" data-gv-event="search_submitted" type="submit">Search OTC</button>
            </form>
          }
        />
        {domainTabsNav}
        <section className="mx-auto mt-6 w-full max-w-6xl" aria-label="Pharmacy OTC search results">
          <ChartShell
            actionHref="/search?domain=pharmacy"
            actionLabel="Reset pharmacy search"
            evidenceItems={[
              pharmacySearchView.evidenceSummary,
              'Pharmacy cards route to /pharmacy/[ean]',
              'Map actions route to /map?domain=pharmacy&pharmacy=[chain]'
            ]}
            fallback={
              <ChartTableFallback
                caption="Pharmacy OTC search fallback"
                columns={[
                  { key: 'name', label: 'OTC product', render: (row: { name: string }) => row.name },
                  { key: 'ean', label: 'EAN', render: (row: { ean: string }) => row.ean },
                  { key: 'limitation', label: 'Limitation', render: (row: { limitation: string }) => row.limitation }
                ]}
                rows={pharmacySearchView.cards}
              />
            }
            hasData={pharmacySearchView.resultCount > 0}
            insightTitle="Pharmacy OTC domain search"
            plainSummary="Pharmacy search returns OTC cards keyed by exact EAN and separates public catalog price evidence from stock, prescription, or medical-advice claims."
            userQuestion="Which OTC exact-EAN card should I compare?"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pharmacySearchView.cards.map((card) => (
                <article className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm" key={card.ean}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">pharmacy_otc_product</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{card.name}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-600">{card.brand} · EAN {card.ean}</p>
                  <p className="mt-3 text-2xl font-black text-emerald-800">{card.priceLabel}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{card.chainLabel} · {card.sourceLabel} · refreshed {card.retrievedAt}</p>
                  <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-black leading-5 text-amber-950">{card.limitation}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className="rounded-full bg-sky-900 px-3 py-2 text-xs font-black text-white" data-gv-event="pharmacy_product_clicked" href={`/pharmacy/${card.ean}`}>Open product</Link>
                    <Link className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-950" data-gv-event="pharmacy_ean_comparison_opened" href={`/pharmacy/${card.ean}`}>Exact EAN comparison</Link>
                    <Link className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900" href={`/map?domain=pharmacy&pharmacy=${card.chain}`}>Open map source</Link>
                    <Link className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900" data-gv-event="pharmacy_otc_alert_set" href={card.alertHref}>Set alert</Link>
                  </div>
                </article>
              ))}
            </div>
            {pharmacySearchView.resultCount === 0 ? (
              <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-amber-950">{pharmacySearchView.emptyState}</p>
            ) : null}
          </ChartShell>
        </section>
      </PageShell>
    );
  }

  if (selectedSearchDomain === 'fuel') {
    return (
      <PageShell data-gv-surface="search">
        <GroceryViewSurfaceAnalytics surface="search" />
        <PageQuestionHeader
          eyebrow="Search"
          question="Which fuel prices or stations match my query?"
          title={query ? `Fuel search results for “${query}”` : 'Fuel search'}
          subtitle="Search operator price cards and OSM fuel station cards with source, freshness, confidence, and limitation on every result."
          actions={
            <form action="/search" className="flex min-w-[18rem] gap-2">
              <input name="domain" type="hidden" value="fuel" />
              <input className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold" defaultValue={query} name="q" placeholder="Search diesel, 95, OKQ8" type="search" />
              <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" data-gv-event="search_submitted" type="submit">Search fuel</button>
            </form>
          }
        />
        {domainTabsNav}
        <section className="mx-auto mt-6 w-full max-w-6xl" aria-label="Fuel search results">
          <ChartShell
            actionHref="/search?domain=fuel"
            actionLabel="Reset fuel search"
            evidenceItems={[
              fuelSearchView.evidenceSummary,
              'Fuel grade cards route to /fuel?grade=[grade]',
              'Fuel station cards route to detail and map selected station views'
            ]}
            fallback={
              <ChartTableFallback
                caption="Fuel search result fallback"
                columns={[
                  { key: 'label', label: 'Fuel result', render: (row: { label: string }) => row.label },
                  { key: 'evidence', label: 'Evidence', render: (row: { evidence: string }) => row.evidence },
                  { key: 'limitation', label: 'Limitation', render: (row: { limitation: string }) => row.limitation }
                ]}
                rows={[
                  ...fuelSearchView.gradeCards.map((card) => ({ label: card.label, evidence: `${card.priceLabel} · ${card.sourceLabel} · ${card.freshnessLabel}`, limitation: card.limitation })),
                  ...fuelSearchView.stationCards.map((station) => ({ label: station.name, evidence: `${station.chain} · ${station.sourceLabel} · ${station.freshnessLabel}`, limitation: station.limitation }))
                ]}
              />
            }
            hasData={fuelSearchView.resultCount > 0}
            insightTitle="Fuel domain search"
            plainSummary="Fuel search separates operator price cards from station location cards so shoppers can compare grades without inferring station-specific pump prices."
            userQuestion="Which fuel grade or station evidence should I open?"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-emerald-200 bg-emerald-50">
                <h2 className="text-2xl font-black text-emerald-950">Fuel grade cards</h2>
                <div className="mt-4 grid gap-3">
                  {fuelSearchView.gradeCards.map((card) => (
                    <Link className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" data-gv-event="fuel_grade_selected" href={card.href} key={card.id}>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Operator price card</p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{card.label}</h3>
                      <p className="mt-1 text-sm font-black text-emerald-900">{card.priceLabel} · {card.operatorName}</p>
                      <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{card.sourceLabel} · {card.freshnessLabel} · {card.confidenceLabel}</p>
                      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-black text-amber-950">{card.limitation}</p>
                    </Link>
                  ))}
                </div>
              </Card>
              <Card className="border-sky-200 bg-sky-50">
                <h2 className="text-2xl font-black text-sky-950">Fuel station cards</h2>
                <div className="mt-4 grid gap-3">
                  {fuelSearchView.stationCards.map((station) => (
                    <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm" key={station.osmId}>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Fuel station card</p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{station.name}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-700">{station.chain} · {station.address}</p>
                      <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{station.gradeAvailability} · {station.sourceLabel} · {station.freshnessLabel}</p>
                      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-black text-amber-950">Operator-level price guardrail: {station.limitation}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link className="rounded-full bg-sky-900 px-3 py-2 text-xs font-black text-white" data-gv-event="fuel_station_candidate_clicked" href={station.href}>Open station</Link>
                        <Link className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900" href={`/map?domain=fuel&station=${station.osmId}`}>Open map selection</Link>
                      </div>
                    </article>
                  ))}
                </div>
              </Card>
            </div>
            {fuelSearchView.resultCount === 0 ? (
              <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-amber-950">{fuelSearchView.emptyState}</p>
            ) : null}
          </ChartShell>
        </section>
        <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-sm font-black text-emerald-950">Fuel watchlist handoff</p>
          <Link className="mt-2 inline-flex rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" data-gv-event="fuel_alert_set" href="/watchlist?domain=fuel">Set a fuel target alert</Link>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell data-gv-surface="search">
      <GroceryViewSurfaceAnalytics surface="search" />
      <PageQuestionHeader
        eyebrow="Search"
        question="Which products match my filters?"
        title={query ? `Search results for “${query}”` : activeFilters.length > 0 ? 'Filtered grocery products' : 'Search grocery products'}
        subtitle="Use filters and sorting to compare price, freshness, confidence, and store availability."
        actions={
          <form action="/search" className="flex min-w-[18rem] gap-2">
            {activeFilters.map(([key, value]) => key !== 'q' ? <input key={key} name={key} type="hidden" value={value} /> : null)}
            <input className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold" defaultValue={query} name="q" placeholder="Search within list" type="search" />
            <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" data-gv-event="search_submitted" type="submit">Search</button>
          </form>
        }
      />
      {domainTabsNav}
      {activeFilters.length > 0 ? (
        <section className="mx-auto mt-4 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Active filters">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Active filters</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeFilters.map(([key, value]) => (
              <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-950" key={key}>{key}: {value}</span>
            ))}
          </div>
        </section>
      ) : null}
      {searchView.resultCards.length > 0 ? (
        <section className="mx-auto mt-4 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Sort search results">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Sort results</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {searchSortControls.map((sort) => (
              <a
                className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-800"
                data-gv-event="search_sort_changed"
                data-gv-sort={sort.value}
                href={cursorHref({ ...resolvedSearchParams, sort: sort.value }, null)}
                key={`${sort.value}-${sort.label}`}
              >
                {sort.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {resultEvidenceRows.length > 0 ? (
        <section className="mx-auto mt-4 w-full max-w-6xl" aria-label="Search visual intelligence">
          <ChartShell
            actionHref={cursorHref(resolvedSearchParams, null)}
            actionLabel="Refresh filtered results"
            evidenceItems={[
              `${searchView.resultCards.length.toLocaleString('sv-SE')} matching products`,
              `${activeFilters.length} active filters`,
              'optional sparkline shown only from ranked result evidence'
            ]}
            insightTitle="Search result evidence"
            plainSummary="The first ranked product cards show price, availability, source tables, and an optional sparkline-style rank cue before you open a detail page."
            userQuestion="Which filtered products are strongest?"
            fallback={
              <ChartTableFallback
                caption="Search result evidence"
                columns={[
                  { key: 'name', label: 'Product', render: (row: { name: string }) => row.name },
                  { key: 'price', label: 'Price', render: (row: { price: string }) => row.price },
                  { key: 'evidence', label: 'Evidence', render: (row: { evidence: string }) => row.evidence }
                ]}
                rows={resultEvidenceRows}
              />
            }
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {resultEvidenceRows.map((row) => (
                <a
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"
                  data-gv-entity-id={row.href.replace('/products/', '')}
                  data-gv-entity-type="product"
                  data-gv-event="search_result_clicked"
                  href={row.href}
                  key={row.href}
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Result card evidence</p>
                  <h3 className="mt-1 text-base font-black text-slate-950">{row.name}</h3>
                  <p className="mt-1 text-sm font-black text-emerald-900">{row.price}</p>
                  <Sparkline label={`${row.name} optional sparkline`} points={row.sparkline} />
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{row.evidence}</p>
                </a>
              ))}
            </div>
          </ChartShell>
        </section>
      ) : null}
      <SaveSearchSubscriptionButton subscription={subscription} />
      <section className="mx-auto mb-4 w-full max-w-5xl rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm" data-voice-search-help>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Mobile voice search</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">
          Tap the microphone in the header search bar on supported mobile browsers to dictate grocery terms like "lactosefri mjölk" or "havregryn". Voice entries submit into the same verified product results as typed searches, then the saved-search action can subscribe to those filters for alerts.
        </p>
      </section>
      <section className="mx-auto mb-4 w-full max-w-5xl rounded-3xl border border-violet-100 bg-violet-50/80 p-4 shadow-sm" aria-label="Saved search shortcuts">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-800">Repeat grocery missions</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-violet-950">
          {authenticatedSavedSearchShortcuts.length} signed-in saved search shortcuts plus browser recent searches keep repeat missions one tap away.
        </p>
      </section>
      <RecentSearchReplayPills />
      {phoneticBadges.length > 0 ? (
        <section className="mx-auto mb-4 w-full max-w-5xl rounded-3xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm" data-phonetic-search-ranking>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-800">Phonetic typo tolerance</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-indigo-950">
            Ranking boosts near matches for Swedish and English grocery terms that sound like "{query}".
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {phoneticBadges.map((badge) => (
              <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-indigo-900 shadow-sm" key={badge.label}>{badge.label}</span>
            ))}
          </div>
        </section>
      ) : null}
      {recovery ? <SearchRecoveryPanel didYouMean={recovery.didYouMean} popularAlternatives={recovery.popularAlternatives} query={recovery.query} /> : null}
      {seoLandingMatches.length > 0 ? (
        <section className="mx-auto mb-4 w-full max-w-5xl rounded-3xl border border-indigo-100 bg-indigo-50/80 p-4 shadow-sm" aria-label="Verified price comparison landing pages">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-800">Verified price pages</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-indigo-950">
            Crawlable landing pages are linked only for products with matched chain-price coverage and explicit source caveats.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {seoLandingMatches.map((product) => (
              <a className="rounded-full bg-white px-3 py-2 text-xs font-black text-indigo-950 shadow-sm" href={`/prisjamforelse/${product.slug}`} key={product.slug}>
                {product.name} · {product.cheapestPriceLabel}
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {noResultWorkflow && noResultWorkflow.query ? (
        <section className="mx-auto mb-4 w-full max-w-5xl rounded-3xl border border-sky-100 bg-white p-4 shadow-sm" data-no-result-correction-workflow>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Help improve search</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">Turn “{noResultWorkflow.query}” into a data-quality signal</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {noResultWorkflow.suggestedCorrections.map((correction) => (
              <a className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-950" href={`/search?q=${encodeURIComponent(correction)}`} key={correction}>
                Try spelling: {correction}
              </a>
            ))}
            <a className="rounded-full bg-sky-50 px-3 py-2 text-xs font-black text-sky-950" href={noResultWorkflow.aliasSubmissionHref}>
              Submit as alias candidate
            </a>
          </div>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Nearby categories</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {noResultWorkflow.categoryShortcuts.map((category) => (
              <a className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-800" href={category.href} key={category.href}>
                {category.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}
      <section className="mx-auto w-full max-w-6xl" aria-label="Search results">
        <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Showing results</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            Showing {searchView.resultCards.length === 0 ? 0 : offset + 1}-{Math.min(offset + SEARCH_PAGE_SIZE, searchView.resultCards.length)} of {searchView.resultCards.length.toLocaleString('sv-SE')} matching products.
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Use the controls above to compare cheapest, freshest, highest-confidence, and unit-price views.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {previousOffset !== null ? <a className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-900" href={cursorHref(resolvedSearchParams, previousOffset)}>Previous results</a> : null}
            {nextOffset !== null ? <a className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={cursorHref(resolvedSearchParams, nextOffset)}>Next results</a> : null}
          </div>
        </div>
        {pagedResultCards.length === 0 ? (
          <GuidedEmptyState
            title="No verified products match these filters yet"
            body="Try removing a filter, browsing the category, or checking deals. GroceryView does not fill empty search results with sample products."
            actions={[
              { label: 'Browse categories', href: '/browse' },
              { label: 'See deals', href: '/deals' },
              { label: 'Open market overview', href: '/market' }
            ]}
          />
        ) : null}
        <SearchResultsGrid
          cards={pagedResultCards.map((card) => ({
            slug: card.slug,
            name: card.name,
            brand: card.brand,
            imageUrl: card.imageUrl,
            categoryLabel: card.categoryLabel,
            categorySlug: card.categorySlug,
            cheapestPrice: card.cheapestPrice,
            cheapestPriceLabel: card.cheapestPriceLabel,
            unitPriceLabel: card.unitPriceLabel,
            chainLabel: card.chainLabel,
            chainSlug: card.chainSlug,
            sortConfidence: card.sortConfidence,
            sortNewestObservedAt: card.sortNewestObservedAt,
            sourceTables: card.sourceTables,
            isAvailable: card.isAvailable ?? false
          }))}
        />
      </section>
    </PageShell>
  );
}
