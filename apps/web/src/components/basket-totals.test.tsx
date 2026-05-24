import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import { BasketTotals } from './basket-totals';

afterEach(() => cleanup());

test('BasketTotals renders the basket contents from mock props', () => {
  render(
    <BasketTotals
      products={[
        { id: 'milk', name: 'Milk' },
        { id: 'bread', name: 'Bread' },
      ]}
    />,
  );

  assert.ok(screen.getByRole('heading', { name: 'Basket' }));
  assert.ok(screen.getByText('Milk'));
  assert.ok(screen.getByText('Bread'));
});
