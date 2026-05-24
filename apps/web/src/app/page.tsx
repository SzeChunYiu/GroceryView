import { Suspense } from 'react';
import { ItemListSkeleton } from '@/components/ItemListSkeleton';
import { MarketShell } from '@/components/market-shell';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}

async function ItemListStream() {
  return <MarketShell />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <ItemListStream />
    </Suspense>
  );
}
