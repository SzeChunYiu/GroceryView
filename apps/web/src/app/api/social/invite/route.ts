import { NextResponse, type NextRequest } from 'next/server';
import { acceptFriendInvite, createFriendInvite, friendInviteAcceptanceWorkflow, listFriendFollows, listFriendInvites } from '@/lib/social';

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function readBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await request.json().catch(() => ({}));
  }

  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return {
    acceptedByDisplayName: form.get('acceptedByDisplayName'),
    acceptedByUserId: form.get('acceptedByUserId'),
    action: form.get('action'),
    inviteeEmail: form.get('inviteeEmail'),
    inviterDisplayName: form.get('inviterDisplayName'),
    inviterUserId: form.get('inviterUserId'),
    token: form.get('token')
  };
}

export async function GET(request: NextRequest) {
  const userId = cleanString(request.nextUrl.searchParams.get('userId')) || 'signed-in-user';
  return NextResponse.json({
    follows: listFriendFollows(userId),
    guardrails: friendInviteAcceptanceWorkflow,
    invites: listFriendInvites(userId)
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request) as Record<string, unknown>;
    const action = cleanString(body.action) || 'create';

    if (action === 'accept') {
      const result = acceptFriendInvite({
        acceptedByDisplayName: cleanString(body.acceptedByDisplayName),
        acceptedByUserId: cleanString(body.acceptedByUserId),
        token: cleanString(body.token)
      });
      return NextResponse.json({ ...result, status: 'accepted' }, { status: 201 });
    }

    const invite = createFriendInvite({
      inviteeEmail: cleanString(body.inviteeEmail),
      inviterDisplayName: cleanString(body.inviterDisplayName),
      inviterUserId: cleanString(body.inviterUserId)
    });
    return NextResponse.json({ invite, status: 'created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process friend invite.' }, { status: 400 });
  }
}
