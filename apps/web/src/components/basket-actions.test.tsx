import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasketActions } from './basket-actions';

afterEach(() => cleanup());

test('BasketActions renders add controls for mock products', async () => {
  const addedProducts: string[] = [];
  const user = userEvent.setup();

  render(
    <BasketActions
      products={[
        { id: 'milk', name: 'Milk' },
        { id: 'bread', name: 'Bread' },
      ]}
      onAdd={(product) => addedProducts.push(product.id)}
    />,
  );

  assert.ok(screen.getByText('Milk'));
  assert.ok(screen.getByText('Bread'));
  await user.click(screen.getAllByRole('button', { name: 'Add' })[1]!);
  assert.deepEqual(addedProducts, ['bread']);
});
