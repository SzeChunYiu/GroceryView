import { NextResponse, type NextRequest } from 'next/server';

type InviteRole = 'viewer' | 'editor';

type InvitePayload = {
  householdName?: string;
  inviterName?: string;
  role?: InviteRole;
};

const onboardingCopy = [
  'Join my GroceryView household to plan one shared list before the next shop.',
  'Open the invite, confirm your role, and GroceryView will keep prices, blockers, and trip context in sync.',
];

function inviteRole(role: unknown): InviteRole {
  return role === 'editor' ? 'editor' : 'viewer';
}

function inviteUrl(request: NextRequest, role: InviteRole, inviteId: string) {
  const url = new URL('/household', request.nextUrl.origin);
  url.searchParams.set('invite', inviteId);
  url.searchParams.set('role', role);
  url.searchParams.set('utm_source', 'household_friend_invite');
  return url.toString();
}

async function readPayload(request: NextRequest): Promise<InvitePayload> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const role = inviteRole(request.nextUrl.searchParams.get('role'));
  const link = inviteUrl(request, role, 'preview');

  return NextResponse.json({
    role,
    onboardingCopy,
    deepLink: link,
    oneTapMessage: `${onboardingCopy[0]} ${link}`,
  });
}

export async function POST(request: NextRequest) {
  const payload = await readPayload(request);
  const role = inviteRole(payload.role);
  const inviteId = crypto.randomUUID();
  const deepLink = inviteUrl(request, role, inviteId);
  const householdName = payload.householdName?.trim() || 'my household';
  const inviterName = payload.inviterName?.trim() || 'A friend';
  const oneTapMessage = `${inviterName} invited you to ${householdName}. ${onboardingCopy[0]} ${deepLink}`;

  return NextResponse.json({
    inviteId,
    role,
    householdName,
    onboardingCopy,
    deepLink,
    oneTapMessage,
    actions: [
      { label: 'Open invite', href: deepLink },
      { label: 'Share by SMS', href: `sms:?&body=${encodeURIComponent(oneTapMessage)}` },
      { label: 'Share by email', href: `mailto:?subject=${encodeURIComponent(`Join ${householdName} on GroceryView`)}&body=${encodeURIComponent(oneTapMessage)}` },
    ],
  });
}
