import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { fireEvent, render, screen } from '@testing-library/react';

type BasketBuilderItem = {
  id: string;
  name: string;
  quantity: number;
};

type BasketBuilderProps = {
  items: BasketBuilderItem[];
  onAction: (action: { type: 'select'; itemId: string }) => void;
  emptyData?: boolean;
};

const mockItems: BasketBuilderItem[] = [
  { id: 'milk-1', name: 'Milk', quantity: 1 },
  { id: 'bread-1', name: 'Bread', quantity: 2 }
];

function BasketBuilder({ items, onAction, emptyData = false }: BasketBuilderProps) {
  if (emptyData || items.length === 0) {
    return <p>No basket items yet.</p>;
  }

  return (
    <section aria-label="Basket builder">
      {items.map((item) => (
        <button key={item.id} onClick={() => onAction({ type: 'select', itemId: item.id })} type="button">
          {item.name} · {item.quantity}
        </button>
      ))}
    </section>
  );
}

describe('BasketBuilder', () => {
  it('renders with required props', () => {
    render(<BasketBuilder items={mockItems} onAction={() => undefined} />);

    assert.ok(screen.getByRole('region', { name: 'Basket builder' }));
    assert.ok(screen.getByRole('button', { name: 'Milk · 1' }));
    assert.ok(screen.getByRole('button', { name: 'Bread · 2' }));
  });

  it('fires onAction callback', () => {
    const onAction = mock.fn();

    render(<BasketBuilder items={mockItems} onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Milk · 1' }));

    assert.equal(onAction.mock.callCount(), 1);
    assert.deepEqual(onAction.mock.calls[0]?.arguments[0], { type: 'select', itemId: 'milk-1' });
  });

  it('handles empty-data prop', () => {
    render(<BasketBuilder emptyData items={[]} onAction={() => undefined} />);

    assert.ok(screen.getByText('No basket items yet.'));
  });
});
