'use client';

import { SaveSearchSubscriptionButton } from '@/components/saved-search-subscriptions';
import type { SavedSearchSubscription } from '@/lib/alert-scheduler';

export function SavedSearchAction({ subscription }: Readonly<{ subscription: SavedSearchSubscription }>) {
  return <SaveSearchSubscriptionButton subscription={subscription} />;
}
