import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setupComponentTestDom } from '@/test/component-test-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfidenceBadge } from '../confidence-badge';

setupComponentTestDom();

test('ConfidenceBadge disables the action and does not fire it when empty data is shown', async () => {
  let actionCount = 0;
  render(
    <ConfidenceBadge
      level="low"
      label="empty confidence"
      emptyData
      actionLabel="Inspect source rows"
      onAction={() => {
        actionCount += 1;
      }}
    />
  );

  const action = screen.getByRole('button', { name: 'Inspect source rows' });
  assert.equal(action.hasAttribute('disabled'), true);

  await userEvent.setup().click(action);
  assert.equal(actionCount, 0);
});
