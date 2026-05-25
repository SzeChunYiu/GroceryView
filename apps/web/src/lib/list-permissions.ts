import { createHmac } from 'node:crypto';

export type ListShareRole = 'view' | 'comment' | 'edit';

export type ListSharePermission = {
  id: string;
  listId: string;
  listName: string;
  collaboratorName: string;
  collaboratorEmail: string;
  role: ListShareRole;
  grantedAt: string;
};

export type PublicListShareItem = {
  detail: string;
  id: string;
  importSource: 'bulk-clipboard' | 'item-detail';
  matchedProductName?: string;
  matchedProductSlug?: string;
  name: string;
  quantity: string;
};

export type PublicListShare = {
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  items: PublicListShareItem[];
  listId: string;
  updatedAt: string;
};

export const listShareRoles: Record<ListShareRole, { label: string; description: string; capabilities: string[] }> = {
  view: {
    label: 'View only',
    description: 'Can open the shared list and compare prices without changing household planning data.',
    capabilities: ['Read list items', 'Compare store totals', 'Export a shopping copy'],
  },
  comment: {
    label: 'Can comment',
    description: 'Can leave timestamped notes on individual list items without changing quantities or checkout state.',
    capabilities: ['Read list items', 'Add item comments', 'Review comment history'],
  },
  edit: {
    label: 'Can edit',
    description: 'Can add, remove, check off list items, and leave timestamped comments for active household collaboration.',
    capabilities: ['Read list items', 'Update quantities', 'Check off purchased items', 'Add item comments'],
  },
};

export const accountListSharePermissions: ListSharePermission[] = [
  {
    id: 'share-weekly-roommates',
    listId: 'weekly-staples',
    listName: 'Weekly staples',
    collaboratorName: 'Alex Roommate',
    collaboratorEmail: 'alex@example.com',
    role: 'edit',
    grantedAt: '2026-05-20T08:15:00.000Z',
  },
  {
    id: 'share-family-view',
    listId: 'family-bbq',
    listName: 'Family BBQ',
    collaboratorName: 'Mina Parent',
    collaboratorEmail: 'mina@example.com',
    role: 'view',
    grantedAt: '2026-05-22T16:45:00.000Z',
  },
  {
    id: 'share-neighbor-comment',
    listId: 'weekly-staples',
    listName: 'Weekly staples',
    collaboratorName: 'Sam Neighbor',
    collaboratorEmail: 'sam@example.com',
    role: 'comment',
    grantedAt: '2026-05-23T09:20:00.000Z',
  },
];

export function resolveListShareRole(role: string | null | undefined): ListShareRole {
  return role === 'edit' || role === 'comment' ? role : 'view';
}

export function createListSharePermission(input: {
  listId: string;
  listName: string;
  collaboratorName: string;
  collaboratorEmail: string;
  role?: string | null;
}): ListSharePermission {
  return {
    id: `share-${input.listId}-${input.collaboratorEmail}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
    listId: input.listId,
    listName: input.listName,
    collaboratorName: input.collaboratorName,
    collaboratorEmail: input.collaboratorEmail,
    role: resolveListShareRole(input.role),
    grantedAt: new Date().toISOString(),
  };
}

export function revokeListSharePermission(shareId: string, permissions = accountListSharePermissions) {
  const permission = permissions.find((share) => share.id === shareId);

  return {
    revoked: Boolean(permission),
    permission,
    revokedAt: new Date().toISOString(),
  };
}

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export function normalizePublicListShareItems(items: unknown[]): PublicListShareItem[] {
  return items
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object' && !Array.isArray(item))
    .map((item, index) => ({
      detail: safeString(item.detail, 'Shared grocery item'),
      id: safeString(item.id, `shared-item-${index + 1}`),
      importSource: item.importSource === 'item-detail' ? 'item-detail' : 'bulk-clipboard',
      matchedProductName: safeString(item.matchedProductName) || undefined,
      matchedProductSlug: safeString(item.matchedProductSlug) || undefined,
      name: safeString(item.name),
      quantity: safeString(item.quantity, 'Quantity not shared')
    }))
    .filter((item) => item.name.length > 0)
    .slice(0, 50);
}

export function createPublicListShareToken(input: {
  createdAt?: string;
  expiresAt?: string | null;
  items: PublicListShareItem[];
  listId: string;
}) {
  const payload = {
    createdAt: input.createdAt ?? new Date().toISOString(),
    expiresAt: input.expiresAt ?? null,
    items: normalizePublicListShareItems(input.items),
    listId: input.listId
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', process.env.LIST_SHARE_SECRET || process.env.NEXT_PUBLIC_LIST_SHARE_SECRET || 'local-list-share-development-secret')
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

function decodeSharePayload(shareId: string) {
  const [encodedPayload, signature, extra] = shareId.split('.');
  if (!encodedPayload || !signature || extra !== undefined) return null;
  const expectedSignature = createHmac('sha256', process.env.LIST_SHARE_SECRET || process.env.NEXT_PUBLIC_LIST_SHARE_SECRET || 'local-list-share-development-secret')
    .update(encodedPayload)
    .digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      createdAt?: unknown;
      expiresAt?: unknown;
      items?: unknown;
      listId?: unknown;
      updatedAt?: unknown;
    };
  } catch {
    return null;
  }
}

export function readPublicListShare(shareId: string): PublicListShare | null {
  const payload = decodeSharePayload(shareId);
  if (!payload) return null;

  const expiresAt = typeof payload.expiresAt === 'string' ? payload.expiresAt : null;
  const expiresAtMs = expiresAt ? Date.parse(expiresAt) : Number.POSITIVE_INFINITY;

  return {
    createdAt: safeString(payload.createdAt, new Date(0).toISOString()),
    expiresAt,
    isExpired: Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now(),
    items: Array.isArray(payload.items) ? normalizePublicListShareItems(payload.items) : [],
    listId: safeString(payload.listId, 'shared-shopping-list'),
    updatedAt: safeString(payload.updatedAt, safeString(payload.createdAt, new Date(0).toISOString()))
  };
}

export function publicListSharePath(shareId: string) {
  return `/list/shared/${encodeURIComponent(shareId)}`;
}
