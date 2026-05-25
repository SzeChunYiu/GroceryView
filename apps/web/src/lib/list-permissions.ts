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
