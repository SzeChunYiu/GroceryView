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

test('SearchBar highlights autocomplete options with arrow keys and opens the active option with Enter', async () => {
  seedRecentSearches();
  render(<SearchBar surface="keyboard-test" />);
  const user = userEvent.setup();
  const input = screen.getByRole('combobox', { name: 'Search products' });

  await user.click(input);
  const milk = await screen.findByRole('option', { name: /milk/i });
  const bread = screen.getByRole('option', { name: /bread/i });
  let selected = false;
  bread.addEventListener('click', (event) => {
    event.preventDefault();
    selected = true;
  });

  await user.keyboard('{ArrowDown}');
  await waitFor(() => assert.equal(input.getAttribute('aria-activedescendant'), milk.id));
  assert.equal(document.activeElement, input);
  assert.equal(milk.getAttribute('aria-selected'), 'true');
  assert.equal(milk.getAttribute('data-active-option'), 'true');

  await user.keyboard('{ArrowDown}');
  await waitFor(() => assert.equal(input.getAttribute('aria-activedescendant'), bread.id));
  assert.equal(document.activeElement, input);
  assert.equal(bread.getAttribute('aria-selected'), 'true');

  await user.keyboard('{Enter}');
  assert.equal(selected, true);
});
