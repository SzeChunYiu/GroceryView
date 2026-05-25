import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { recentSearchHistoryStorageKey } from '@/lib/personalization';
import { SearchBar } from './SearchBar';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

test('SearchBar highlights autocomplete options with arrow keys and opens the active option with Enter', async () => {
  window.localStorage.setItem(recentSearchHistoryStorageKey, JSON.stringify([
    { query: 'milk', href: '/products?q=milk', resultCount: 3, searchedAt: '2026-05-25T00:00:00.000Z' }
  ]));

  render(<SearchBar surface="keyboard-test" />);
  const user = userEvent.setup();
  const input = screen.getByRole('combobox', { name: /search products/i });

  await user.click(input);
  const option = await screen.findByRole('option', { name: /milk/i });
  let selected = false;
  option.addEventListener('click', (event) => {
    event.preventDefault();
    selected = true;
  });

  await user.keyboard('{ArrowDown}');

  assert.equal(document.activeElement, input);
  assert.equal(input.getAttribute('aria-activedescendant'), option.id);
  assert.equal(option.getAttribute('aria-selected'), 'true');
  assert.equal(option.getAttribute('data-active-option'), 'true');

  await user.keyboard('{Enter}');
  assert.equal(selected, true);
});
