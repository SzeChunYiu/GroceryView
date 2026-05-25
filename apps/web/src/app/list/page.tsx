import type { Metadata } from 'next';
import { ListSharePreview } from '@/components/list-share-preview';
import { metadataForShoppingListShare } from '@/lib/seo';

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
