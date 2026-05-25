import ProductsPage from '../products/page';
import { SearchRecoveryPanel } from '@/components/data-ui';
import { RecentSearchReplayPills } from '@/components/SearchBar';
import { SaveSearchSubscriptionButton } from '@/components/saved-search-subscriptions';
import { buildSavedSearchSubscription } from '@/lib/alert-scheduler';
import { routeMetadata } from '@/lib/seo';
import { buildMisspelledQueryRecovery } from '@/lib/search-suggest';
import { phoneticSearchBadgesForQuery } from '@/lib/search-filters';
import { buildProductSearchView } from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/search');
}

type SearchPageParams = Record<string, string | string[] | undefined>;

export default async function SearchPage({ searchParams }: { searchParams?: Promise<SearchPageParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const subscription = buildSavedSearchSubscription({ searchParams: resolvedSearchParams, path: '/search' });
  const query = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] ?? '' : resolvedSearchParams.q ?? '';
  const searchView = buildProductSearchView(resolvedSearchParams);
  const recovery = searchView.resultCards.length === 0 ? buildMisspelledQueryRecovery(query) : null;
  const phoneticBadges = query.trim() ? phoneticSearchBadgesForQuery(query) : [];

  return (
    <>
      <SaveSearchSubscriptionButton subscription={subscription} />
      <section className="mx-auto mb-4 w-full max-w-5xl rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm" data-voice-search-help>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Mobile voice search</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">
          Tap the microphone in the header search bar on supported mobile browsers to dictate grocery terms like "lactosefri mjölk" or "havregryn". Voice entries submit into the same verified product results as typed searches.
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
      <section aria-label="Search results with virtualized product rendering">
        <ProductsPage searchParams={Promise.resolve(resolvedSearchParams)} />
      </section>
    </>
  );
}
