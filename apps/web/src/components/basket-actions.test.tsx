import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import { BasketActions } from './basket-actions';

afterEach(() => cleanup());

test('BasketActions renders an add button with mock props', () => {
  render(<BasketActions onAdd={() => undefined} />);

  assert.ok(screen.getByRole('button', { name: 'Add' }));
});
