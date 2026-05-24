import type { Meta, StoryObj } from '@storybook/react';

type FilterChip = {
  label: string;
  value?: string;
  count?: number;
  disabled?: boolean;
};

type FilterChipsProps = {
  chips: FilterChip[];
};

function FilterChips({ chips }: FilterChipsProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {chips.map((chip) => (
        <button
          key={`${chip.label}-${chip.value ?? ''}`}
          disabled={chip.disabled}
          style={{
            alignItems: 'center',
            border: '1px solid #d1d5db',
            borderRadius: 999,
            background: chip.disabled ? '#f3f4f6' : '#ffffff',
            color: chip.disabled ? '#9ca3af' : '#111827',
            display: 'inline-flex',
            gap: 6,
            padding: '6px 10px',
          }}
          type="button"
        >
          <span>{chip.label}</span>
          {chip.value ? <strong>{chip.value}</strong> : null}
          {typeof chip.count === 'number' ? <span>({chip.count})</span> : null}
        </button>
      ))}
    </div>
  );
}

const meta = {
  title: 'Components/FilterChips',
  component: FilterChips,
  tags: ['autodocs'],
} satisfies Meta<typeof FilterChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'default',
  args: {
    chips: [
      { label: 'Store', value: 'Any' },
      { label: 'Category', value: 'All groceries' },
    ],
  },
};

export const WithData: Story = {
  name: 'with-data',
  args: {
    chips: [
      { label: 'Store', value: 'Willys', count: 42 },
      { label: 'Category', value: 'Dairy', count: 12 },
      { label: 'Price', value: 'Under 50 kr', count: 8 },
    ],
  },
};

export const EdgeCase: Story = {
  name: 'edge-case',
  args: {
    chips: [
      { label: 'Very long filter label that wraps', value: 'A long selected value', count: 0 },
      { label: 'Disabled', value: 'Unavailable', disabled: true },
      { label: 'No value' },
    ],
  },
};
