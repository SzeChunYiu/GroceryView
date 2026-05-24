import { Suspense } from 'react';
import { MarketShell } from '@/components/market-shell';
import { HomeLaunchSkeleton } from '@/components/Skeleton';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return {
    ...routeMetadata('/'),
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      title: 'GroceryView',
      statusBarStyle: 'black-translucent' as const
    }
  };
}


export default function HomePage() {
  return (
    <Suspense fallback={<HomeLaunchSkeleton />}>
      <MarketShell />
    </Suspense>
  );
}
