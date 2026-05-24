export type FriendShareSignal = {
  productId: string;
  sharedByCount: number;
  context: 'friend' | 'household';
};

export type FriendShareSignalBadge = {
  sharedByCount: number;
  label: string;
  ariaLabel: string;
  sourceLabel: string;
};

const friendShareSignals: FriendShareSignal[] = [
  { productId: 'havregryn-extra-fylliga-101758934-st', sharedByCount: 2, context: 'household' },
  { productId: 'lingongrova-100168667-st', sharedByCount: 1, context: 'friend' },
  { productId: 'zoegas-coffee-450g', sharedByCount: 2, context: 'friend' },
  { productId: 'pagen-lingongrova-500g', sharedByCount: 1, context: 'household' }
];

export const friendShareSignalFeed = {
  path: '/api/deals/friend-share-signals',
  suggestionProductIds: friendShareSignals.map((signal) => signal.productId),
  privacy: 'Opted-in friend and household shares only; anonymous or public social signals are excluded.',
  signals: friendShareSignals
};

export function friendShareSignalForProduct(productId: string): FriendShareSignalBadge | null {
  const signal = friendShareSignals.find((item) => item.productId === productId);
  if (!signal) return null;

  const personLabel = signal.context === 'household' ? 'household member' : 'friend';
  const pluralPersonLabel = signal.context === 'household' ? 'household members' : 'friends';
  const sharerLabel = signal.sharedByCount === 1 ? personLabel : pluralPersonLabel;
  const label = `${signal.sharedByCount} opted-in ${sharerLabel} shared this`;

  return {
    sharedByCount: signal.sharedByCount,
    label,
    ariaLabel: `${label}; sourced from ${friendShareSignalFeed.path}`,
    sourceLabel: 'Friend-share signal feed; no anonymous/public social data.'
  };
}

export async function fetchFriendShareSignalFeed(fetcher: typeof fetch = fetch) {
  const response = await fetcher(friendShareSignalFeed.path, { cache: 'no-store' });
  if (!response.ok) throw new Error('friend_share_signals_unavailable');
  return response.json() as Promise<typeof friendShareSignalFeed>;
}
