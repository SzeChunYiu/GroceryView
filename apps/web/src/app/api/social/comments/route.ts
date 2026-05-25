import { NextResponse, type NextRequest } from 'next/server';
import { createSocialComment, listSharedFriendPriceSightings, listSocialComments } from '@/lib/social';

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get('postId') ?? undefined;
  const productSlug = request.nextUrl.searchParams.get('productSlug') ?? undefined;
  return NextResponse.json({
    comments: listSocialComments(postId),
    friendPriceSightings: listSharedFriendPriceSightings({ postId, productSlug })
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<{
      author: string;
      body: string;
      parentId: string;
      postId: string;
    }>;

    if (typeof body.postId !== 'string' || typeof body.body !== 'string') {
      return NextResponse.json({ error: 'postId and body are required.' }, { status: 400 });
    }

    const comment = createSocialComment({
      author: typeof body.author === 'string' ? body.author : '',
      body: body.body,
      parentId: typeof body.parentId === 'string' ? body.parentId : undefined,
      postId: body.postId
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save comment.' }, { status: 400 });
  }
}
