import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasketRow } from './basket-row';

afterEach(() => cleanup());

test('BasketRow renders a product row with an add action', async () => {
  const addedProducts: string[] = [];
  const user = userEvent.setup();

  render(<BasketRow product={{ id: 'milk', name: 'Milk' }} onAdd={(product) => addedProducts.push(product.id)} />);

  assert.ok(screen.getByText('Milk'));
  await user.click(screen.getByRole('button', { name: 'Add' }));
  assert.deepEqual(addedProducts, ['milk']);
});
