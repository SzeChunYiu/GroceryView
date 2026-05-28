import { PageShell, SearchRecoveryPanel } from '@/components/data-ui';
import { PageQuestionHeader, GuidedEmptyState } from '@/components/mvp/handoff-content';
import { ChartShell, ChartTableFallback, Sparkline } from '@/components/mvp/visual-intelligence';
import { RecentSearchReplayPills } from '@/components/SearchBar';
import { SaveSearchSubscriptionButton } from '@/components/saved-search-subscriptions';
import { buildSavedSearchSubscription } from '@/lib/alert-scheduler';
import { hasAppliedCanonicalFilters, metadataForSearch, routeMetadata } from '@/lib/seo';
import { buildNoResultCorrectionWorkflow } from '@/lib/search-alias-review';
import { authenticatedSavedSearchShortcuts } from '@/lib/saved-searches';
import { buildMisspelledQueryRecovery } from '@/lib/search-suggest';
import { phoneticSearchBadgesForQuery } from '@/lib/search-filters';
import { seoLandingProducts } from '@/lib/seo-landing-pages';
import { buildProductSearchView } from '@/lib/verified-data';

type SearchPageParams = Record<string, string | string[] | undefined>;
const emptySearchPageParams: SearchPageParams = {};
const SEARCH_PAGE_SIZE = 24;
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

export async function generateMetadata({ searchParams }: { searchParams?: Promise<SearchPageParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(emptySearchPageParams));
  return hasAppliedCanonicalFilters(resolvedSearchParams) ? metadataForSearch(resolvedSearchParams) : routeMetadata('/search');
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<SearchPageParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(emptySearchPageParams));
  const subscription = buildSavedSearchSubscription({ searchParams: resolvedSearchParams, path: '/search' });
  const query = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] ?? '' : resolvedSearchParams.q ?? '';
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

  const activeFilters = ['category', 'chain', 'type', 'region', 'store', 'dealLevel', 'sort']
    .map((key) => [key, firstParam(resolvedSearchParams, key)] as const)
    .filter(([, value]) => value);

  return (
    <PageShell>
      <PageQuestionHeader
        eyebrow="Search"
        question="Which products match my filters?"
        title={query ? `Search results for “${query}”` : activeFilters.length > 0 ? 'Filtered grocery products' : 'Search grocery products'}
        subtitle="Use filters and sorting to compare price, freshness, confidence, and store availability."
        actions={
          <form action="/search" className="flex min-w-[18rem] gap-2">
            {activeFilters.map(([key, value]) => key !== 'q' ? <input key={key} name={key} type="hidden" value={value} /> : null)}
            <input className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold" defaultValue={query} name="q" placeholder="Search within list" type="search" />
            <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" type="submit">Search</button>
          </form>
        }
      />
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
              <a className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-800" href={cursorHref({ ...resolvedSearchParams, sort: sort.value }, null)} key={`${sort.value}-${sort.label}`}>{sort.label}</a>
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
                <a className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4" href={row.href} key={row.href}>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagedResultCards.map((card) => (
            <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" key={card.slug}>
              <a className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 underline" href={`/browse/${encodeURIComponent(card.categorySlug)}`}>{card.categoryLabel}</a>
              <h3 className="mt-2 text-lg font-black text-slate-950"><a href={`/products/${card.slug}`}>{card.name}</a></h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{card.brand}</p>
              <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
                <p className="text-xl font-black text-emerald-950">{card.cheapestPriceLabel}</p>
                <p className="mt-1 text-sm font-bold text-emerald-800">{card.unitPriceLabel}</p>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">
                {card.chainSlug ? <a className="underline" href={`/search?chain=${encodeURIComponent(card.chainSlug)}`}>{card.chainLabel}</a> : card.chainLabel}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                <a className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-950" href={`/products/${card.slug}`}>Open product</a>
                <a className="rounded-full bg-slate-100 px-3 py-2 text-slate-800" href={`/browse/${encodeURIComponent(card.categorySlug)}`}>Browse category</a>
                <a className="rounded-full bg-slate-100 px-3 py-2 text-slate-800" href={`/market/${encodeURIComponent(card.categorySlug)}`}>Market context</a>
                <a className="rounded-full bg-slate-100 px-3 py-2 text-slate-800" href={`/search?category=${encodeURIComponent(card.categorySlug)}&similarTo=${encodeURIComponent(card.slug)}`}>Compare similar</a>
              </div>
              <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
                {card.sourceTables.join(' + ') || 'Verified product index'} · {card.isAvailable ? 'priced row available' : 'availability not confirmed'}
              </p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
