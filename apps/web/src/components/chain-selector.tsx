'use client';

import type { KeyboardEvent } from 'react';

export type ChainSelectorOption = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type ChainSelectorProps = {
  label?: string;
  options: ChainSelectorOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
};

export function ChainSelector({
  label = 'Choose a grocery chain',
  options,
  selectedId,
  onSelect,
  className = '',
}: ChainSelectorProps) {
  const handleKeyDown = (option: ChainSelectorOption) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!option.disabled) {
        onSelect(option.id);
      }
    }
  };

  return (
    <fieldset className={`space-y-3 ${className}`}>
      <legend className="text-sm font-medium text-slate-900">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = option.id === selectedId;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              disabled={option.disabled}
              onClick={() => {
                if (!option.disabled) {
                  onSelect(option.id);
                }
              }}
              onKeyDown={handleKeyDown(option)}
              className={`rounded-xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              {option.description ? (
                <span className="mt-1 block text-xs text-slate-600">{option.description}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
