import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasketBuilder, type BasketBuilderProduct } from './basket-builder';

const products: BasketBuilderProduct[] = [
  {
    id: 'oat-milk',
    name: 'Oat milk',
    dietaryTags: ['vegan']
  },
  {
    id: 'rye-bread',
    name: 'Rye bread',
    dietaryTags: ['gluten-free', 'vegan']
  }
];

const pastPurchaseShortcuts: BasketBuilderProduct[] = [
  {
    id: 'bananas',
    name: 'Bananas',
    shortcutLabel: 'Last bought'
  }
];

function activeElementLabel() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return '';

  if (active.getAttribute('aria-label')) return active.getAttribute('aria-label')!;
  if (active instanceof HTMLInputElement) return active.closest('label')?.textContent?.trim() ?? active.value;
  if (active instanceof HTMLButtonElement && active.textContent?.trim() === 'Add') {
    return `Add ${active.closest('li')?.querySelector('span')?.textContent?.trim() ?? 'product'}`;
  }

  return active.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

afterEach(() => cleanup());

test('BasketBuilder exposes a logical tab and shift-tab order for reachable controls', async () => {
  render(<BasketBuilder products={products} pastPurchaseShortcuts={pastPurchaseShortcuts} />);
  const user = userEvent.setup();

  assert.ok(screen.getByRole('button', { name: /Add Bananas/ }));
  assert.ok(screen.getByRole('checkbox', { name: 'gluten-free' }));
  assert.ok(screen.getByRole('checkbox', { name: 'vegan' }));
  assert.equal(screen.getAllByRole('button', { name: 'Add' }).length, 2);

  await user.tab();
  await user.keyboard('{Enter}');
  assert.ok(screen.getByRole('listitem', { name: 'Bananas basket row' }));

  const forwardOrder = [activeElementLabel()];
  for (let index = 0; index < 5; index += 1) {
    await user.tab();
    forwardOrder.push(activeElementLabel());
  }

  const reverseOrder: string[] = [];
  for (let index = 0; index < 6; index += 1) {
    reverseOrder.push(activeElementLabel());
    await user.tab({ shift: true });
  }

  assert.deepEqual(forwardOrder, [
    'Add Bananas · Last bought',
    'gluten-free',
    'vegan',
    'Add Oat milk',
    'Add Rye bread',
    'Bananas basket row'
  ]);
  assert.deepEqual(reverseOrder, [
    'Bananas basket row',
    'Add Rye bread',
    'Add Oat milk',
    'vegan',
    'gluten-free',
    'Add Bananas · Last bought'
  ]);
  assert.equal(
    `forward: ${forwardOrder.join(' -> ')}\nreverse: ${reverseOrder.join(' -> ')}`,
    'forward: Add Bananas · Last bought -> gluten-free -> vegan -> Add Oat milk -> Add Rye bread -> Bananas basket row\nreverse: Bananas basket row -> Add Rye bread -> Add Oat milk -> vegan -> gluten-free -> Add Bananas · Last bought'
  );
});
