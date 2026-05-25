import type { SharedListActivityEvent } from './activity-log';

export type ListShareRole = 'view' | 'edit';

export type ListSharePermission = {
  id: string;
  listId: string;
  listName: string;
  collaboratorName: string;
  collaboratorEmail: string;
  role: ListShareRole;
  grantedAt: string;
};

export const listShareRoles: Record<ListShareRole, { label: string; description: string; capabilities: string[] }> = {
  view: {
    label: 'View only',
    description: 'Can open the shared list and compare prices without changing household planning data.',
    capabilities: ['Read list items', 'Compare store totals', 'Export a shopping copy'],
  },
  edit: {
    label: 'Can edit',
    description: 'Can add, remove, and check off list items for active household collaboration.',
    capabilities: ['Read list items', 'Update quantities', 'Check off purchased items'],
  },
};

export const accountListSharePermissions: ListSharePermission[] = [
  {
    id: 'share-local-shopping-list-sam',
    listId: 'local-shopping-list',
    listName: 'Today\'s basket',
    collaboratorName: 'Sam Shopper',
    collaboratorEmail: 'sam@example.com',
    role: 'edit',
    grantedAt: '2026-05-24T18:05:00.000Z',
  },
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
];

export const sharedShoppingListActivityFeed: SharedListActivityEvent[] = [
  {
    id: 'activity-local-shopping-list-added-oats',
    listId: 'local-shopping-list',
    itemId: 'oats',
    itemName: 'Oats',
    kind: 'item_added',
    actor: { id: 'sam-shopper', name: 'Sam Shopper' },
    timestamp: '2026-05-25T08:10:00.000Z',
    detail: 'Added before the morning store run.'
  },
  {
    id: 'activity-local-shopping-list-checked-milk',
    listId: 'local-shopping-list',
    itemId: 'milk',
    itemName: 'Milk',
    kind: 'item_checked',
    actor: { id: 'mina-parent', name: 'Mina Parent' },
    timestamp: '2026-05-25T08:24:00.000Z',
    detail: 'Checked off in store.'
  },
  {
    id: 'activity-local-shopping-list-removed-snacks',
    listId: 'local-shopping-list',
    itemId: 'snacks',
    itemName: 'Extra snacks',
    kind: 'item_removed',
    actor: { id: 'alex-roommate', name: 'Alex Roommate' },
    timestamp: '2026-05-25T08:31:00.000Z',
    detail: 'Removed duplicate item from the shared list.'
  }
];

export function resolveListShareRole(role: string | null | undefined): ListShareRole {
  return role === 'edit' ? 'edit' : 'view';
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
