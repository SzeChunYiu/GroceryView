import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WatchlistRow } from './watchlist-row';
import type { WatchlistAlert } from '@/lib/watchlist-data';

afterEach(cleanup);

const tabOrderSnapshot = [
  'Before watchlist row',
  'Open Organic oats watchlist alert',
  'After watchlist row'
];

function activeElementName() {
  const activeElement = document.activeElement;
  assert.ok(activeElement instanceof HTMLElement);
  return activeElement.getAttribute('aria-label') ?? activeElement.textContent?.replace(/\s+/g, ' ').trim() ?? activeElement.tagName;
}

describe('WatchlistRow keyboard navigation', () => {
  it('tabs through every interactive element in logical order and supports Shift-Tab backtracking', async () => {
    const user = userEvent.setup();
    const alert = {
      productId: 'organic-oats',
      productName: 'Organic oats',
      type: 'target_price',
      severity: 'normal',
      message: 'Organic oats is below your target price.',
      source: '2 verified rows',
      trigger: {
        metric: 'price',
        storeName: 'Willys online catalog',
        value: 24.9
      }
    } as WatchlistAlert;

    render(
      <>
        <button type="button">Before watchlist row</button>
        <WatchlistRow
          alert={alert}
          sourceConfidence="high"
          sourceLabel="2 verified Axfood chain price rows"
          sourceSampleSize={2}
          targetPrice={25}
        />
        <button type="button">After watchlist row</button>
      </>
    );

    const tabOrder: string[] = [];
    await user.tab();
    tabOrder.push(activeElementName());
    await user.tab();
    tabOrder.push(activeElementName());
    await user.tab();
    tabOrder.push(activeElementName());

    assert.deepEqual(tabOrder, tabOrderSnapshot);
    assert.equal(document.activeElement, screen.getByRole('button', { name: 'After watchlist row' }));

    await user.tab({ shift: true });
    assert.equal(activeElementName(), 'Open Organic oats watchlist alert');
    await user.tab({ shift: true });
    assert.equal(document.activeElement, screen.getByRole('button', { name: 'Before watchlist row' }));
  });
});
