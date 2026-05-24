import { createHash, randomBytes, randomUUID } from 'node:crypto';

export type SocialUser = {
  id: string;
  name: string;
  email: string;
  influenceScore: number;
  favoriteChains: string[];
};

export type FollowRelationship = {
  followerId: string;
  followingId: string;
  status: 'following';
  createdAt: string;
  influenceWeight: number;
};

export type FriendInvite = {
  id: string;
  inviterId: string;
  invitedEmail: string;
  tokenHash: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedByUserId?: string;
  acceptedAt?: string;
};

export type PublicFriendInvite = Omit<FriendInvite, 'tokenHash'> & { token: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const users: SocialUser[] = [
  {
    id: 'user-alma',
    name: 'Alma',
    email: 'alma@example.com',
    influenceScore: 94,
    favoriteChains: ['Willys', 'ICA']
  },
  {
    id: 'user-samir',
    name: 'Samir',
    email: 'samir@example.com',
    influenceScore: 88,
    favoriteChains: ['Lidl', 'Coop']
  },
  {
    id: 'user-nora',
    name: 'Nora',
    email: 'nora@example.com',
    influenceScore: 81,
    favoriteChains: ['Hemköp', 'Willys']
  }
];

const seedFollows: FollowRelationship[] = [
  {
    followerId: 'signed-in-user',
    followingId: 'user-alma',
    status: 'following',
    createdAt: '2026-05-20T09:00:00.000Z',
    influenceWeight: 0.42
  }
];

type SocialState = {
  follows: FollowRelationship[];
  invites: FriendInvite[];
};

const globalState = globalThis as typeof globalThis & { __groceryViewSocialState?: SocialState };

function state() {
  globalState.__groceryViewSocialState ??= {
    follows: [...seedFollows],
    invites: []
  };
  return globalState.__groceryViewSocialState;
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function publicInvite(invite: FriendInvite, token = ''): PublicFriendInvite {
  return {
    id: invite.id,
    inviterId: invite.inviterId,
    invitedEmail: invite.invitedEmail,
    status: invite.status,
    createdAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    acceptedByUserId: invite.acceptedByUserId,
    acceptedAt: invite.acceptedAt,
    token
  };
}

export function listSuggestedFriends(currentUserId = 'signed-in-user') {
  const followedIds = new Set(state().follows.filter((follow) => follow.followerId === currentUserId).map((follow) => follow.followingId));
  return users.filter((user) => !followedIds.has(user.id));
}

export function listFriendFollows(currentUserId = 'signed-in-user') {
  return state().follows
    .filter((follow) => follow.followerId === currentUserId)
    .map((follow) => ({
      ...follow,
      user: users.find((user) => user.id === follow.followingId) ?? null
    }));
}

export function createFriendInvite(input: { inviterId?: string; invitedEmail: string; now?: Date }) {
  const invitedEmail = input.invitedEmail.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invitedEmail)) {
    throw new Error('A valid invite email is required.');
  }

  const now = input.now ?? new Date();
  const token = randomBytes(32).toString('base64url');
  const invite: FriendInvite = {
    id: randomUUID(),
    inviterId: input.inviterId ?? 'signed-in-user',
    invitedEmail,
    tokenHash: tokenHash(token),
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * DAY_MS).toISOString()
  };

  state().invites.push(invite);
  return publicInvite(invite, token);
}

export function acceptFriendInvite(input: { token: string; acceptedByUserId: string; now?: Date }) {
  const token = input.token.trim();
  if (!token) throw new Error('Invite token is required.');

  const invite = state().invites.find((candidate) => candidate.tokenHash === tokenHash(token));
  if (!invite) throw new Error('Invite token was not found.');
  if (invite.status !== 'pending') throw new Error('Invite has already been used.');

  const now = input.now ?? new Date();
  if (new Date(invite.expiresAt).getTime() < now.getTime()) {
    invite.status = 'expired';
    throw new Error('Invite token has expired.');
  }

  invite.status = 'accepted';
  invite.acceptedAt = now.toISOString();
  invite.acceptedByUserId = input.acceptedByUserId;

  const follows = state().follows;
  if (!follows.some((follow) => follow.followerId === input.acceptedByUserId && follow.followingId === invite.inviterId)) {
    follows.push({
      followerId: input.acceptedByUserId,
      followingId: invite.inviterId,
      status: 'following',
      createdAt: invite.acceptedAt,
      influenceWeight: 0.35
    });
  }

  return publicInvite(invite);
}

export function friendSocialSnapshot(currentUserId = 'signed-in-user') {
  return {
    currentUserId,
    follows: listFriendFollows(currentUserId),
    suggestions: listSuggestedFriends(currentUserId),
    inviteTtlDays: 7,
    pendingInvites: state().invites.filter((invite) => invite.inviterId === currentUserId && invite.status === 'pending').map((invite) => publicInvite(invite)),
    recommendationSignals: [
      'Followers can lift stores and products in personal recommendation ranking.',
      'Invite tokens are stored only as SHA-256 hashes and expire after seven days.',
      'Accepted invites create a one-way follow from the invitee to the inviter.'
    ]
  };
}
