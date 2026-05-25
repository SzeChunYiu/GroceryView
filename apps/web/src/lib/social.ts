export type SocialFeedPost = Readonly<{
  author: string;
  body: string;
  createdAt: string;
  id: string;
  title: string;
}>;

export type FriendPriceSighting = Readonly<{
  confidence: 'high' | 'medium' | 'low';
  id: string;
  observedAt: string;
  postId: string;
  priceLabel: string;
  productName: string;
  productSlug: string;
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
    confidence: 'medium',
    id: 'friend-sighting-oats-hemkop',
    observedAt: '2026-05-24T08:42:00.000Z',
    postId: 'weekly-oats-swap',
    priceLabel: '21,90 kr',
    productName: 'Havregryn',
    productSlug: 'havregryn-100132321-st',
    reporter: 'Friend sighting',
    sharedWithFriends: true,
    storeName: 'Hemkop Skanstull'
  },
  {
    confidence: 'low',
    id: 'friend-sighting-basil-willys',
    observedAt: '2026-05-24T10:12:00.000Z',
    postId: 'basil-stock-note',
    priceLabel: '18,90 kr',
    productName: 'Fresh basil pot',
    productSlug: 'basilika',
    reporter: 'Household sighting',
    sharedWithFriends: true,
    storeName: 'Willys Stockholm'
  },
  {
    confidence: 'high',
    id: 'friend-sighting-fiberhavregryn-willys',
    observedAt: '2026-05-24T11:20:00.000Z',
    postId: 'weekly-oats-swap',
    priceLabel: '20,90 kr',
    productName: 'Fiberhavregryn',
    productSlug: 'fiberhavregryn-7340083480638',
    reporter: 'Friend sighting',
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
