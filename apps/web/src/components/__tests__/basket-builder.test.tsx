import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasketBuilder, type BasketBuilderProduct } from '../basket-builder';

const products: BasketBuilderProduct[] = [
  {
    id: 'milk',
    name: 'Milk',
    categoryLabel: 'Dairy',
    dietaryTags: ['vegetarian'],
  },
  {
    id: 'bread',
    name: 'Bread',
    categoryLabel: 'Bakery',
  },
];

afterEach(() => cleanup());

test('BasketBuilder renders with required props', () => {
  render(<BasketBuilder products={products} />);

  assert.ok(screen.getByRole('region', { name: 'Basket builder' }));
  assert.ok(screen.getByText('Milk'));
  assert.ok(screen.getByText('Bread'));
});

test('BasketBuilder fires onAction when a product is added', async () => {
  const actions: Array<{ type: string; product: BasketBuilderProduct }> = [];
  render(<BasketBuilder products={products} onAction={(action) => actions.push(action)} />);

  await userEvent.setup().click(screen.getAllByRole('button', { name: 'Add' })[0]);

  assert.equal(actions.length, 1);
  assert.equal(actions[0].type, 'add');
  assert.equal(actions[0].product.id, 'milk');
  assert.ok(screen.getByRole('listitem', { name: 'Milk basket row' }));
});

test('BasketBuilder handles empty data without rendering add actions', () => {
  render(<BasketBuilder products={products} emptyData />);

  assert.ok(screen.getByText('No basket data is available.'));
  assert.equal(screen.queryByRole('button', { name: 'Add' }), null);
  assert.equal(screen.queryByText('Milk'), null);
});
