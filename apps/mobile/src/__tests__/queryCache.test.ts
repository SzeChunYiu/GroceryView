import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMobilePersistedCachePlan, buildMobileQueryKey, buildMobileQueryRegistry } from '../queryCache.js';

describe('mobile query cache plan', () => {
  it('defines TanStack Query-compatible cache policies for Today, Stores, Watchlist, Search, Product, Basket, and Budget routes', () => {
    const registry = buildMobileQueryRegistry();

    assert.deepEqual(
      registry.map((definition) => definition.id),
      ['today', 'stores', 'watchlist', 'search', 'product', 'productTerminal', 'basket', 'budget']
    );
    assert.deepEqual(
      registry.map((definition) => definition.route),
      ['/today', '/stores', '/watchlist', '/search', '/products/[id]', '/products/[id]/terminal', '/basket', '/budget']
    );
    assert.equal(registry.every((definition) => definition.persist), true);
    assert.equal(registry.every((definition) => definition.networkMode === 'offlineFirst'), true);
    assert.equal(registry.find((definition) => definition.id === 'basket')?.invalidatesOn.includes('receipt_synced'), true);
    assert.equal(registry.find((definition) => definition.id === 'budget')?.invalidatesOn.includes('budget_changed'), true);
  });

  it('builds stable user-partitioned query keys for mobile screens', () => {
    assert.deepEqual(buildMobileQueryKey({ id: 'today', userId: 'User-1' }), ['mobile', 'user-1', 'today']);
    assert.deepEqual(buildMobileQueryKey({ id: 'stores', userId: 'User-1' }), ['mobile', 'user-1', 'stores']);
    assert.deepEqual(buildMobileQueryKey({ id: 'watchlist', userId: 'User-1' }), ['mobile', 'user-1', 'watchlist']);
    assert.deepEqual(buildMobileQueryKey({ id: 'search', userId: 'User-1', query: ' Coffee ' }), ['mobile', 'user-1', 'search', 'coffee']);
    assert.deepEqual(buildMobileQueryKey({ id: 'product', userId: 'User-1', productId: ' ZOEGAS-COFFEE-450G ' }), [
      'mobile',
      'user-1',
      'product',
      'zoegas-coffee-450g'
    ]);
    assert.deepEqual(buildMobileQueryKey({ id: 'productTerminal', userId: 'User-1', productId: ' Coffee ' }), [
      'mobile',
      'user-1',
      'product',
      'coffee',
      'terminal'
    ]);
    assert.deepEqual(buildMobileQueryKey({ id: 'basket', userId: 'User-1' }), ['mobile', 'user-1', 'basket']);
    assert.deepEqual(buildMobileQueryKey({ id: 'budget', userId: 'User-1' }), ['mobile', 'user-1', 'budget']);
  });

  it('plans persisted cache hydration without storing sensitive receipt, token, or precise-location data', () => {
    const plan = buildMobilePersistedCachePlan('User-1');

    assert.equal(plan.storageKey, 'groceryview.mobile.query-cache.v1');
    assert.equal(plan.userPartitionKey, 'user:user-1');
    assert.deepEqual(plan.hydrateOrder, ['today', 'stores', 'watchlist', 'basket', 'budget', 'search', 'product', 'productTerminal']);
    assert.deepEqual(plan.persistedQueryIds, ['today', 'stores', 'watchlist', 'search', 'product', 'productTerminal', 'basket', 'budget']);
    assert.equal(plan.maxPersistedAgeMs, 86_400_000);
    assert.equal(plan.purgeOnSignOut, true);
    assert.deepEqual(plan.redactBeforePersist, ['receipt_images', 'auth_tokens', 'precise_location']);
  });

  it('rejects cache keys that cannot be safely partitioned', () => {
    assert.throws(() => buildMobileQueryKey({ id: 'today', userId: ' ' }), /userId is required/);
    assert.throws(() => buildMobileQueryKey({ id: 'product', userId: 'user-1', productId: ' ' }), /productId is required/);
    assert.throws(() => buildMobileQueryKey({ id: 'productTerminal', userId: 'user-1', productId: ' ' }), /productId is required/);
    assert.throws(() => buildMobilePersistedCachePlan(' '), /userId is required/);
  });
});
