import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

async function exists(relative) {
  try {
    await access(new URL(relative, root));
    return true;
  } catch {
    return false;
  }
}

test('search page saves current URL filters as a saved search subscription', async () => {
  const searchPage = await read('src/app/search/page.tsx');

  assert.match(searchPage, /SaveSearchSubscriptionButton/);
  assert.match(searchPage, /buildSavedSearchSubscription/);
  assert.match(searchPage, /searchParams\?: Promise<SearchPageParams>/);
  assert.match(searchPage, /path: '\/search'/);
  assert.match(searchPage, /ProductsPage searchParams=\{Promise\.resolve\(resolvedSearchParams\)\}/);
});

test('saved search subscriptions are stored locally and surfaced on alerts', async () => {
  assert.equal(await exists('src/components/saved-search-subscriptions.tsx'), true);
  const component = await read('src/components/saved-search-subscriptions.tsx');
  const alertsPage = await read('src/app/alerts/page.tsx');

  assert.match(component, /'use client'/);
  assert.match(component, /groceryview:saved-search-subscriptions/);
  assert.match(component, /window\.localStorage\.setItem\(storageKey/);
  assert.match(component, /buildSavedSearchDealMatches\(subscriptions, candidates\)/);
  assert.match(component, /data-saved-search-status/);
  assert.match(alertsPage, /SavedSearchSubscriptionsPanel/);
  assert.match(alertsPage, /savedSearchDealCandidates/);
  assert.match(alertsPage, /matchedChainProducts\.slice\(0, 80\)/);
});

test('alert scheduler builds saved search subscriptions and matching deal candidates', async () => {
  const scheduler = await read('src/lib/alert-scheduler.ts');

  assert.match(scheduler, /export type SavedSearchSubscription/);
  assert.match(scheduler, /export type SavedSearchDealCandidate/);
  assert.match(scheduler, /buildSavedSearchSubscription/);
  assert.match(scheduler, /subscriptionIdFromFilters/);
  assert.match(scheduler, /buildSavedSearchDealMatches/);
  assert.match(scheduler, /Notify when newly matching verified deals appear/);
});
