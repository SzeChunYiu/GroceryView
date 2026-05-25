import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import { BasketRow } from './basket-row';

afterEach(() => cleanup());

test('BasketRow renders a product row with mock props', () => {
  render(<BasketRow product={{ id: 'milk', name: 'Milk' }} onAdd={() => undefined} />);

  assert.ok(screen.getByText('Milk'));
  assert.ok(screen.getByRole('button', { name: 'Add' }));
});
