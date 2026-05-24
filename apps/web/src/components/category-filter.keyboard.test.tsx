// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFilter } from './category-filter';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.navigator = dom.window.navigator;

const categories = [
  { id: 'produce', label: 'Produce', count: 12 },
  { id: 'dairy', label: 'Dairy', count: 8 },
  { id: 'bakery', label: 'Bakery', count: 5 },
];

function focusedLabel() {
  const active = document.activeElement;

  if (active instanceof HTMLInputElement) {
    if (active.type === 'checkbox') {
      return active.closest('label')?.textContent?.replace(/\s+/g, ' ').trim();
    }

    const label = document.querySelector(`label[for="${active.id}"]`);
    return label?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  return active?.getAttribute('aria-label') ?? active?.textContent?.trim() ?? '';
}

test.afterEach(() => cleanup());

test('CategoryFilter exposes a logical forward tab order for every control', async () => {
  const user = userEvent.setup();
  render(<CategoryFilter categories={categories} selectedCategoryIds={['dairy']} />);

  const order = [];
  for (let index = 0; index < 5; index += 1) {
    await user.tab();
    order.push(focusedLabel());
  }

  assert.deepEqual(order, [
    'Clear filters',
    'Search categories',
    'Produce 12',
    'Dairy 8',
    'Bakery 5',
  ]);
  assert.equal(screen.getByLabelText(/^Bakery/), document.activeElement);
});

test('CategoryFilter supports Shift-Tab back through the same controls', async () => {
  const user = userEvent.setup();
  render(<CategoryFilter categories={categories} selectedCategoryIds={['dairy']} />);

  for (let index = 0; index < 5; index += 1) {
    await user.tab();
  }

  const reverseOrder = [];
  for (let index = 0; index < 4; index += 1) {
    await user.tab({ shift: true });
    reverseOrder.push(focusedLabel());
  }

  assert.deepEqual(reverseOrder, [
    'Dairy 8',
    'Produce 12',
    'Search categories',
    'Clear filters',
  ]);
});
