import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductRow } from './product-row';

const product = {
  name: 'Organic Gala Apples',
  href: '/products/organic-gala-apples',
  priceLabel: '$3.99',
};

const tabOrderSnapshot = [
  'View Organic Gala Apples',
  'Add Organic Gala Apples to favourites',
  'Decrease Organic Gala Apples quantity',
  'Organic Gala Apples quantity',
  'Increase Organic Gala Apples quantity',
  'Add Organic Gala Apples to basket',
];

afterEach(() => {
  cleanup();
});

function activeElementName() {
  const element = document.activeElement;

  if (!element || element === document.body) {
    return '';
  }

  return element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '';
}

async function renderProductRow() {
  render(<ProductRow product={product} />);

  assert.deepEqual(
    [
      screen.getByRole('link', { name: 'View Organic Gala Apples' }),
      screen.getByRole('button', { name: 'Add Organic Gala Apples to favourites' }),
      screen.getByRole('button', { name: 'Decrease Organic Gala Apples quantity' }),
      screen.getByRole('spinbutton', { name: 'Organic Gala Apples quantity' }),
      screen.getByRole('button', { name: 'Increase Organic Gala Apples quantity' }),
      screen.getByRole('button', { name: 'Add Organic Gala Apples to basket' }),
    ].map((element) => element.getAttribute('aria-label') ?? element.textContent?.trim() ?? ''),
    tabOrderSnapshot,
  );
}

describe('ProductRow keyboard navigation', () => {
  it('tabs through every interactive control in logical order and snapshots the order', async () => {
    await renderProductRow();

    const user = userEvent.setup();
    const forwardOrder: string[] = [];

    for (const _expected of tabOrderSnapshot) {
      await user.tab();
      forwardOrder.push(activeElementName());
    }

    assert.deepEqual(forwardOrder, tabOrderSnapshot);

    const reverseOrder: string[] = [];

    for (const _expected of tabOrderSnapshot.slice(0, -1).reverse()) {
      await user.tab({ shift: true });
      reverseOrder.push(activeElementName());
    }

    assert.deepEqual(reverseOrder, tabOrderSnapshot.slice(0, -1).reverse());
  });
});
