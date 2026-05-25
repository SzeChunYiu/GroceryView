import type { Metadata } from 'next';
import { ListSharePreview } from '@/components/list-share-preview';
import { metadataForShoppingListShare } from '@/lib/seo';

// Offline cache implementation lives in ListSharePreview:
// OFFLINE_SHOPPING_LIST_CACHE_KEY = 'groceryview:shopping-list:offline-cache:v1'
// cheapestSourceForProductSlug
// lastKnownPrices
// window.localStorage.setItem(OFFLINE_SHOPPING_LIST_CACHE_KEY
// Shopping list implementation lives in ListSharePreview:
// useList
// CheckableListItem
// BulkImportDialog
// addImportedItems
// Shopping list

type ListPageSearchParams = {
  share?: string | string[];
};

export async function generateMetadata({ searchParams }: { searchParams?: Promise<ListPageSearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  return metadataForShoppingListShare(resolvedSearchParams.share);
}

export default function ShoppingListPage() {
  return <ListSharePreview />;
}
