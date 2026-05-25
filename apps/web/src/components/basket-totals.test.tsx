import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import { BasketTotals } from './basket-totals';

afterEach(() => cleanup());

test('BasketTotals renders selected products with mock props', () => {
  render(<BasketTotals products={[{ id: 'milk', name: 'Milk' }]} />);

  assert.ok(screen.getByRole('heading', { name: 'Basket' }));
  assert.ok(screen.getByText('Milk'));
});
