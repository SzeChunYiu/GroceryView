export type AccountDataActor =
  | { kind: 'anonymous' }
  | { kind: 'user'; userId: string }
  | { kind: 'service_role'; reason: string };

export type AccountDataOperation = 'read' | 'write';

export type AccountOwnedTablePolicy = {
  table: string;
  domain: 'household' | 'watchlist' | 'alerts' | 'receipts' | 'consent' | 'budgets' | 'saved_baskets';
  ownerColumn: 'user_id' | 'household_id' | 'receipt_id' | 'basket_id';
  accessModel: 'owner_only' | 'household_member_read_editor_write' | 'cascade_owner';
};

export type HouseholdMembership = {
  householdId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
};

export type AccountDataAccessInput = {
  table: string;
  operation: AccountDataOperation;
  actor: AccountDataActor;
  ownerUserId?: string;
  householdId?: string;
  receiptOwnerUserId?: string;
  basketOwnerUserId?: string;
  householdMembers?: readonly HouseholdMembership[];
};

export type AccountDataAccessDecision = {
  allowed: boolean;
  reason: string;
};

export const accountOwnedTablePolicies = [
  { table: 'watchlists', domain: 'watchlist', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'watchlist_items', domain: 'watchlist', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'alert_rules', domain: 'alerts', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'alerts', domain: 'alerts', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'receipt_uploads', domain: 'receipts', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'receipt_items', domain: 'receipts', ownerColumn: 'receipt_id', accessModel: 'cascade_owner' },
  { table: 'user_preferences', domain: 'consent', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'budgets', domain: 'budgets', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'weekly_baskets', domain: 'saved_baskets', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'basket_items', domain: 'saved_baskets', ownerColumn: 'basket_id', accessModel: 'cascade_owner' },
  { table: 'basket_import_review_items', domain: 'saved_baskets', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'multi_week_stock_up_rows', domain: 'saved_baskets', ownerColumn: 'user_id', accessModel: 'owner_only' },
  { table: 'household_plans', domain: 'household', ownerColumn: 'household_id', accessModel: 'household_member_read_editor_write' },
  { table: 'household_members', domain: 'household', ownerColumn: 'household_id', accessModel: 'household_member_read_editor_write' },
  { table: 'household_basket_items', domain: 'household', ownerColumn: 'household_id', accessModel: 'household_member_read_editor_write' },
  { table: 'household_watchlist_items', domain: 'household', ownerColumn: 'household_id', accessModel: 'household_member_read_editor_write' },
  { table: 'household_favorite_stores', domain: 'household', ownerColumn: 'household_id', accessModel: 'household_member_read_editor_write' }
] as const satisfies readonly AccountOwnedTablePolicy[];

export function accountOwnedTablePolicy(table: string): AccountOwnedTablePolicy | undefined {
  return accountOwnedTablePolicies.find((policy) => policy.table === table);
}

export function evaluateAccountDataAccess(input: AccountDataAccessInput): AccountDataAccessDecision {
  const policy = accountOwnedTablePolicy(input.table);
  if (!policy) return { allowed: false, reason: 'unknown_account_owned_table' };
  if (input.actor.kind === 'service_role') return { allowed: true, reason: 'service_role_bypass_for_server_workflow' };
  if (input.actor.kind === 'anonymous') return { allowed: false, reason: 'anonymous_blocked' };

  if (policy.accessModel === 'household_member_read_editor_write') {
    const member = input.householdMembers?.find((candidate) => candidate.householdId === input.householdId && candidate.userId === input.actor.userId);
    if (!member) return { allowed: false, reason: 'household_membership_required' };
    if (input.operation === 'read') return { allowed: true, reason: 'household_member_read' };
    return member.role === 'owner' || member.role === 'editor'
      ? { allowed: true, reason: 'household_editor_write' }
      : { allowed: false, reason: 'household_viewer_write_blocked' };
  }

  const ownerUserId = policy.ownerColumn === 'receipt_id'
    ? input.receiptOwnerUserId
    : policy.ownerColumn === 'basket_id'
      ? input.basketOwnerUserId
      : input.ownerUserId;
  if (!ownerUserId) return { allowed: false, reason: 'owner_context_required' };
  return ownerUserId === input.actor.userId
    ? { allowed: true, reason: 'owner_match' }
    : { allowed: false, reason: 'cross_user_blocked' };
}

export function assertAccountOwnedPolicyTestCoverage(testedTables: readonly string[]): void {
  const tested = new Set(testedTables);
  const missing = accountOwnedTablePolicies.map((policy) => policy.table).filter((table) => !tested.has(table));
  if (missing.length > 0) throw new Error(`Missing account data access regression tests for: ${missing.join(', ')}`);
}
