export type SocialFeedPost = Readonly<{
  author: string;
  body: string;
  createdAt: string;
  id: string;
  title: string;
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
