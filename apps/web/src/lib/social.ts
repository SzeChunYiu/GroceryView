import { cheapestSourceForProductSlug } from './shopping-list-prices';

export type SocialFeedPost = Readonly<{
  author: string;
  body: string;
  createdAt: string;
  id: string;
  title: string;
}>;

export type FriendPriceSighting = Readonly<{
  action: 'reported' | 'saved';
  confidence: 'high' | 'medium' | 'low';
  id: string;
  note?: string;
  observedAt: string;
  postId: string;
  priceLabel: string;
  productName: string;
  productSlug: string;
  relationship: 'friend' | 'household';
  reporter: string;
  sharedWithFriends: boolean;
  storeName: string;
}>;

export type SocialComment = Readonly<{
  author: string;
  body: string;
  createdAt: string;
  id: string;
  mentions: string[];
  parentId?: string;
  postId: string;
}>;

type PublicSharePreviewInputItem = Readonly<{
  matchedProductSlug?: string;
  name: string;
  quantity?: string;
}>;

export type PublicSharePreviewItem = Readonly<{
  estimateLabel: string;
  name: string;
  privacySafeStoreRange: string;
  quantity: string;
}>;

export type PublicSharePreview = Readonly<{
  estimatedTotalLabel: string;
  items: PublicSharePreviewItem[];
  privacyNote: string;
}>;

export const socialFeedPosts: SocialFeedPost[] = [
  {
    author: 'Maja',
    body: 'Swapped store-brand oats for the bigger pack while it was in stock.',
    createdAt: '2026-05-24T09:00:00.000Z',
    id: 'weekly-oats-swap',
    title: 'Oats substitution worked'
  },
  {
    author: 'Jonas',
    body: 'Fresh basil was low at my store, but frozen herbs covered dinner.',
    createdAt: '2026-05-24T10:30:00.000Z',
    id: 'basil-stock-note',
    title: 'Basil stock note'
  }
];

export const friendPriceSightings: FriendPriceSighting[] = [
  {
    action: 'reported',
    confidence: 'medium',
    id: 'friend-sighting-oats-hemkop',
    note: 'Friend reported the shelf tag before the official feed refreshed.',
    observedAt: '2026-05-24T08:42:00.000Z',
    postId: 'weekly-oats-swap',
    priceLabel: '21,90 kr',
    productName: 'Havregryn',
    productSlug: 'havregryn-100132321-st',
    relationship: 'friend',
    reporter: 'Friend sighting',
    sharedWithFriends: true,
    storeName: 'Hemkop Skanstull'
  },
  {
    action: 'reported',
    confidence: 'low',
    id: 'friend-sighting-basil-willys',
    note: 'Household member flagged local stock while shopping.',
    observedAt: '2026-05-24T10:12:00.000Z',
    postId: 'basil-stock-note',
    priceLabel: '18,90 kr',
    productName: 'Fresh basil pot',
    productSlug: 'basilika',
    relationship: 'household',
    reporter: 'Household sighting',
    sharedWithFriends: true,
    storeName: 'Willys Stockholm'
  },
  {
    action: 'saved',
    confidence: 'high',
    id: 'friend-sighting-fiberhavregryn-willys',
    note: 'Saved by a household member as a cheaper local option.',
    observedAt: '2026-05-24T11:20:00.000Z',
    postId: 'weekly-oats-swap',
    priceLabel: '20,90 kr',
    productName: 'Fiberhavregryn',
    productSlug: 'fiberhavregryn-7340083480638',
    relationship: 'household',
    reporter: 'Household save',
    sharedWithFriends: true,
    storeName: 'Willys Hornstull'
  }
];

let socialComments: SocialComment[] = [
  {
    author: 'Linnea',
    body: '@Maja did the larger pack keep the unit price lower?',
    createdAt: '2026-05-24T09:15:00.000Z',
    id: 'comment-seed-oats-unit-price',
    mentions: ['Maja'],
    postId: 'weekly-oats-swap'
  }
];

export function extractMentions(body: string) {
  return [...new Set([...body.matchAll(/(^|\s)@([a-zA-Z0-9_-]{2,32})/g)].map((match) => match[2]))];
}

export function listSocialComments(postId?: string) {
  return socialComments.filter((comment) => !postId || comment.postId === postId);
}

function recentFriendSightings(sightings: FriendPriceSighting[]) {
  return [...sightings].sort((left, right) => right.observedAt.localeCompare(left.observedAt));
}

export function listFriendPriceSightings(postId?: string) {
  return recentFriendSightings(friendPriceSightings.filter((sighting) => sighting.sharedWithFriends && (!postId || sighting.postId === postId)));
}

export function listFriendPriceSightingsForProduct(productSlug: string) {
  return recentFriendSightings(friendPriceSightings.filter((sighting) => sighting.sharedWithFriends && sighting.productSlug === productSlug));
}

export function friendPriceSightingSummary(sighting: FriendPriceSighting) {
  const relationship = sighting.relationship === 'household' ? 'household member' : 'friend';
  return `${sighting.reporter} ${sighting.action} by ${relationship}`;
}

function priceFromLabel(priceLabel: string) {
  const normalized = priceLabel.replace(/\s/g, '').replace(',', '.').match(/\d+(\.\d+)?/);
  return normalized ? Number(normalized[0]) : null;
}

function formatSekEstimate(value: number) {
  return `${Math.round(value).toLocaleString('sv-SE')} kr`;
}

const publicPreviewFallbackSlugs: Record<string, string> = {
  coffee: 'mellanrost-perfekt-med-mj-lk-bryggkaffe-101276230-st',
  'fresh fruit': 'pple-royal-gala-klass-1-100144504-kg',
  'frozen vegetables': 'babymor-tter-frysta-100655792-st',
  'milk or fil': 'mj-lk-3-101205891-st',
  oats: 'havregryn-100132394-st'
};

function publicPreviewSlugForItem(item: PublicSharePreviewInputItem) {
  return item.matchedProductSlug || publicPreviewFallbackSlugs[item.name.trim().toLowerCase()];
}

export function createPublicListSharePreview(items: PublicSharePreviewInputItem[]): PublicSharePreview {
  let matchedEstimateTotal = 0;

  const previewItems = items.map((item) => {
    const cheapestSource = cheapestSourceForProductSlug(publicPreviewSlugForItem(item));
    const price = cheapestSource ? priceFromLabel(cheapestSource.priceLabel) : null;
    if (price !== null) matchedEstimateTotal += price;

    const rangeCeiling = price !== null && cheapestSource
      ? price * (1 + Math.max(cheapestSource.spreadPercent, 0) / 100)
      : null;

    return {
      estimateLabel: price !== null ? `Estimated from ${cheapestSource?.priceLabel}` : 'No verified estimate yet',
      name: item.name,
      privacySafeStoreRange: price !== null && rangeCeiling !== null && cheapestSource
        ? `${cheapestSource.chainLabel} public shelf band ${formatSekEstimate(price)}–${formatSekEstimate(rangeCeiling)}`
        : 'Store range hidden until a verified public price match exists',
      quantity: item.quantity?.trim() || 'Quantity not shared'
    };
  });

  return {
    estimatedTotalLabel: matchedEstimateTotal > 0 ? `About ${formatSekEstimate(matchedEstimateTotal)} from matched items` : 'No matched-item total yet',
    items: previewItems,
    privacyNote: 'Public previews show item names, quantities, catalog estimates, and chain-level price bands only — never account, household, or exact store data.'
  };
}

export function createSocialComment(input: Readonly<{ author: string; body: string; parentId?: string; postId: string }>) {
  const author = input.author.trim().slice(0, 48) || 'GroceryView shopper';
  const body = input.body.trim();
  const postExists = socialFeedPosts.some((post) => post.id === input.postId);
  const parentExists = !input.parentId || socialComments.some((comment) => comment.id === input.parentId && comment.postId === input.postId);

  if (!postExists) throw new Error('Unknown social feed post.');
  if (!parentExists) throw new Error('Unknown parent comment.');
  if (body.length < 1 || body.length > 280) throw new Error('Comments must be between 1 and 280 characters.');

  const comment: SocialComment = {
    author,
    body,
    createdAt: new Date().toISOString(),
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mentions: extractMentions(body),
    parentId: input.parentId,
    postId: input.postId
  };

  socialComments = [...socialComments, comment];
  return comment;
}
