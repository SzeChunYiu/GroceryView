import ProductsPage from '../products/page';
import { SearchRecoveryPanel } from '@/components/data-ui';
import { RecentSearchReplayPills } from '@/components/SearchBar';
import { SaveSearchSubscriptionButton } from '@/components/saved-search-subscriptions';
import { buildSavedSearchSubscription } from '@/lib/alert-scheduler';
import { hasAppliedCanonicalFilters, metadataForSearch, routeMetadata } from '@/lib/seo';
import { buildNoResultCorrectionWorkflow } from '@/lib/search-alias-review';
import { authenticatedSavedSearchShortcuts } from '@/lib/saved-searches';
import { buildMisspelledQueryRecovery } from '@/lib/search-suggest';
import { phoneticSearchBadgesForQuery } from '@/lib/search-filters';
import { buildProductSearchView } from '@/lib/verified-data';

type SearchPageParams = Record<string, string | string[] | undefined>;
const defaultSearchPageParams: SearchPageParams = {};

export async function generateMetadata({ searchParams }: { searchParams?: Promise<SearchPageParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  return hasAppliedCanonicalFilters(resolvedSearchParams) ? metadataForSearch(resolvedSearchParams) : routeMetadata('/search');
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<SearchPageParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(defaultSearchPageParams));
  const subscription = buildSavedSearchSubscription({ searchParams: resolvedSearchParams, path: '/search' });
  const query = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] ?? '' : resolvedSearchParams.q ?? '';
  const searchView = buildProductSearchView(resolvedSearchParams);
  const recovery = searchView.resultCards.length === 0 ? buildMisspelledQueryRecovery(query) : null;
  const noResultWorkflow = recovery ? buildNoResultCorrectionWorkflow(query) : null;
  const phoneticBadges = query.trim() ? phoneticSearchBadgesForQuery(query) : [];

  return (
    <>
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
      <section aria-label="Search results with virtualized product rendering">
        <ProductsPage searchParams={Promise.resolve(resolvedSearchParams)} />
      </section>
    </>
  );
}
