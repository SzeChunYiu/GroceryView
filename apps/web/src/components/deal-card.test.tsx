import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DealCard } from './deal-card';

describe('DealCard keyboard traversal', () => {
  it('supports tab and shift+tab traversal and exposes a stable tab order snapshot', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <DealCard
        title="Organic apples"
        storeName="Willys"
        priceText="12.90 SEK/kg"
        savingsText="Save 20%"
        href="/products/organic-apples"
      />
    );

    const tabOrder: string[] = [];
    await user.tab();
    const first = document.activeElement;
    tabOrder.push((first?.getAttribute('data-testid')) || first?.tagName || 'unknown');

    await user.tab({ shift: true });
    const second = document.activeElement;
    tabOrder.push((second?.getAttribute('data-testid')) || second?.tagName || 'unknown');

    assert.deepEqual(tabOrder, ['deal-card-link', 'deal-card-link']);
    assert.equal(first, second);
    assert.deepEqual(
      tabOrder.map((entry) => `deal-card:${entry}`).join(','),
      'deal-card:deal-card-link,deal-card:deal-card-link'
    );

    unmount();
  });
});
