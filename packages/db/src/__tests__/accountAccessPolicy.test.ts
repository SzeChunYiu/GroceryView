import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accountOwnedTablePolicies,
  assertAccountOwnedPolicyTestCoverage,
  evaluateAccountDataAccess,
  type AccountDataOperation
} from '../accountAccessPolicy.js';

const ownerActor = { kind: 'user' as const, userId: 'user-owner' };
const otherActor = { kind: 'user' as const, userId: 'user-other' };
const anonymousActor = { kind: 'anonymous' as const };
const serviceRoleActor = { kind: 'service_role' as const, reason: 'scheduled privacy export' };

function access(table: string, operation: AccountDataOperation, actor = ownerActor) {
  return evaluateAccountDataAccess({
    table,
    operation,
    actor,
    ownerUserId: 'user-owner',
    receiptOwnerUserId: 'user-owner',
    basketOwnerUserId: 'user-owner',
    householdId: 'household-1',
    householdMembers: [
      { householdId: 'household-1', userId: 'user-owner', role: 'owner' },
      { householdId: 'household-1', userId: 'user-editor', role: 'editor' },
      { householdId: 'household-1', userId: 'user-viewer', role: 'viewer' }
    ]
  });
}

describe('account-owned data access policy regressions', () => {
  it('has explicit regression coverage for every account-owned table policy', () => {
    assertAccountOwnedPolicyTestCoverage(accountOwnedTablePolicies.map((policy) => policy.table));
  });

  it('blocks anonymous access to household, watchlist, alerts, receipts, consent, budgets, and saved baskets', () => {
    for (const policy of accountOwnedTablePolicies) {
      assert.deepEqual(access(policy.table, 'read', anonymousActor), { allowed: false, reason: 'anonymous_blocked' }, `${policy.table} anonymous read`);
      assert.deepEqual(access(policy.table, 'write', anonymousActor), { allowed: false, reason: 'anonymous_blocked' }, `${policy.table} anonymous write`);
    }
  });

  it('blocks one signed-in user from reading or writing another user account-owned rows', () => {
    for (const policy of accountOwnedTablePolicies.filter((candidate) => candidate.accessModel !== 'household_member_read_editor_write')) {
      assert.deepEqual(access(policy.table, 'read', otherActor), { allowed: false, reason: 'cross_user_blocked' }, `${policy.table} cross-user read`);
      assert.deepEqual(access(policy.table, 'write', otherActor), { allowed: false, reason: 'cross_user_blocked' }, `${policy.table} cross-user write`);
    }
  });

  it('allows owners to read and write their own non-household rows', () => {
    for (const policy of accountOwnedTablePolicies.filter((candidate) => candidate.accessModel !== 'household_member_read_editor_write')) {
      assert.deepEqual(access(policy.table, 'read'), { allowed: true, reason: 'owner_match' }, `${policy.table} owner read`);
      assert.deepEqual(access(policy.table, 'write'), { allowed: true, reason: 'owner_match' }, `${policy.table} owner write`);
    }
  });

  it('allows household members to read, blocks viewers from writing, and blocks non-members entirely', () => {
    const householdTables = accountOwnedTablePolicies.filter((policy) => policy.accessModel === 'household_member_read_editor_write');
    for (const policy of householdTables) {
      assert.deepEqual(access(policy.table, 'read', { kind: 'user', userId: 'user-viewer' }), { allowed: true, reason: 'household_member_read' }, `${policy.table} viewer read`);
      assert.deepEqual(access(policy.table, 'write', { kind: 'user', userId: 'user-editor' }), { allowed: true, reason: 'household_editor_write' }, `${policy.table} editor write`);
      assert.deepEqual(access(policy.table, 'write', { kind: 'user', userId: 'user-viewer' }), { allowed: false, reason: 'household_viewer_write_blocked' }, `${policy.table} viewer write`);
      assert.deepEqual(access(policy.table, 'read', otherActor), { allowed: false, reason: 'household_membership_required' }, `${policy.table} non-member read`);
    }
  });

  it('allows service-role access only through the explicit server workflow bypass path', () => {
    for (const policy of accountOwnedTablePolicies) {
      assert.deepEqual(access(policy.table, 'read', serviceRoleActor), { allowed: true, reason: 'service_role_bypass_for_server_workflow' }, `${policy.table} service-role read`);
      assert.deepEqual(access(policy.table, 'write', serviceRoleActor), { allowed: true, reason: 'service_role_bypass_for_server_workflow' }, `${policy.table} service-role write`);
    }
  });

  it('fails closed when a new account-owned table has no policy entry', () => {
    assert.deepEqual(evaluateAccountDataAccess({
      table: 'new_account_owned_table',
      operation: 'read',
      actor: ownerActor,
      ownerUserId: 'user-owner'
    }), { allowed: false, reason: 'unknown_account_owned_table' });
    assert.throws(() => assertAccountOwnedPolicyTestCoverage(['watchlists']), /Missing account data access regression tests/);
  });
});
