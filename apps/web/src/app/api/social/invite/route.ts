import { acceptFriendInvite, createFriendInvite, friendSocialSnapshot } from '@/lib/social';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function errorResponse(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Invalid social invite request.' },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json(friendSocialSnapshot());
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { inviterId?: string; invitedEmail?: string };
    return NextResponse.json(
      { invite: createFriendInvite({ inviterId: body.inviterId, invitedEmail: body.invitedEmail ?? '' }) },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { token?: string; acceptedByUserId?: string };
    return NextResponse.json({
      invite: acceptFriendInvite({
        token: body.token ?? '',
        acceptedByUserId: body.acceptedByUserId ?? 'signed-in-user'
      })
    });
  } catch (error) {
    return errorResponse(error);
  }
}
