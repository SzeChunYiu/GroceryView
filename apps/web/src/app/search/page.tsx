import ProductsPage from '../products/page';
import { RecentSearchReplayPills } from '@/components/SearchBar';
import { SaveSearchSubscriptionButton } from '@/components/saved-search-subscriptions';
import { buildSavedSearchSubscription } from '@/lib/alert-scheduler';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/search');
}

type SearchPageParams = Record<string, string | string[] | undefined>;

export default async function SearchPage({ searchParams }: { searchParams?: Promise<SearchPageParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const subscription = buildSavedSearchSubscription({ searchParams: resolvedSearchParams, path: '/search' });

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
      <ProductsPage searchParams={Promise.resolve(resolvedSearchParams)} />
    </>
  );
}
