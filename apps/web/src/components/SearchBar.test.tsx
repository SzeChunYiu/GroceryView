import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';
import { recentSearchHistoryStorageKey } from '@/lib/personalization';

function seedRecentSearches() {
  window.localStorage.setItem(recentSearchHistoryStorageKey, JSON.stringify([
    { query: 'milk', href: '/products?q=milk', resultCount: 3, searchedAt: '2026-05-25T08:00:00.000Z' },
    { query: 'bread', href: '/products?q=bread', resultCount: 2, searchedAt: '2026-05-25T08:05:00.000Z' }
  ]));
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

test('SearchBar highlights autocomplete options with arrow keys and dismisses with Escape', async () => {
  seedRecentSearches();
  render(<SearchBar />);
  const user = userEvent.setup();
  const input = screen.getByRole('combobox', { name: 'Search products' });

  await user.click(input);
  const milk = await screen.findByRole('option', { name: /milk/i });
  const bread = screen.getByRole('option', { name: /bread/i });

  await user.keyboard('{ArrowDown}');
  await waitFor(() => assert.equal(document.activeElement, milk));
  assert.equal(input.getAttribute('aria-activedescendant'), milk.id);
  assert.match(milk.className, /emerald-50|ring/);

  await user.keyboard('{ArrowDown}');
  await waitFor(() => assert.equal(document.activeElement, bread));
  assert.equal(input.getAttribute('aria-activedescendant'), bread.id);
  assert.match(bread.className, /emerald-50|ring/);

  await user.keyboard('{Escape}');
  await waitFor(() => assert.equal(screen.queryByRole('listbox'), null));
});
