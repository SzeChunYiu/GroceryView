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
      <RecentSearchReplayPills />
      <ProductsPage searchParams={Promise.resolve(resolvedSearchParams)} basePath="/search" />
    </>
  );
}
