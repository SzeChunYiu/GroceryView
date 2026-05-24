import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConfidenceBadge } from '../confidence-badge';

describe('ConfidenceBadge', () => {
  it('keeps the action disabled for empty data and does not fire the callback', () => {
    const onAction = mock.fn();

    render(
      <ConfidenceBadge
        actionLabel="Inspect source"
        emptyData
        label="No data"
        level="low"
        onAction={onAction}
      />
    );

    const action = screen.getByRole('button', { name: 'Inspect source' });
    assert.equal(action.hasAttribute('disabled'), true);

    fireEvent.click(action);

    assert.equal(onAction.mock.callCount(), 0);
  });
});
