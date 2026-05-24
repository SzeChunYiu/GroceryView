'use client';

import { useId, type KeyboardEvent } from 'react';

export type CategoryFilterOption = {
  id: string;
  label: string;
  count?: number;
  description?: string;
};

export type CategoryFilterProps = {
  options: CategoryFilterOption[];
  selectedCategoryId?: string;
  label?: string;
  description?: string;
  statusMessage?: string;
  onSelect: (categoryId: string) => void;
};

function handleKeyboardSelect(event: KeyboardEvent<HTMLButtonElement>, select: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  select();
}

export function CategoryFilter({
  options,
  selectedCategoryId,
  label = 'Filter products by category',
  description = 'Choose one category to update the product results. Use Tab to move between categories and Enter or Space to select.',
  statusMessage,
  onSelect
}: CategoryFilterProps) {
  const baseId = useId();
  const describedById = `${baseId}-description`;
  const statusId = `${baseId}-status`;
  const selectedOption = options.find((option) => option.id === selectedCategoryId);
  const visibleStatus = statusMessage ?? (selectedOption ? `${selectedOption.label} category selected.` : 'No category filter selected.');

  return (
    <section aria-describedby={describedById} aria-label={label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">{label}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600" id={describedById}>{description}</p>
        </div>
        <p aria-live="polite" className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900" id={statusId} role="status">
          {visibleStatus}
        </p>
      </div>
      <div aria-describedby={`${describedById} ${statusId}`} aria-label="Available grocery categories" className="mt-4 flex flex-wrap gap-2" role="list">
        {options.map((option) => {
          const selected = option.id === selectedCategoryId;
          const optionDescriptionId = `${baseId}-${option.id}-description`;
          const select = () => onSelect(option.id);
          return (
            <div key={option.id} role="listitem">
              <button
                aria-describedby={option.description ? optionDescriptionId : statusId}
                aria-label={`${selected ? 'Selected category' : 'Filter by category'}: ${option.label}`}
                aria-pressed={selected}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 focus-visible:ring-offset-2',
                  selected
                    ? 'border-emerald-900 bg-emerald-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-700 hover:bg-white'
                ].join(' ')}
                onClick={select}
                onKeyDown={(event) => handleKeyboardSelect(event, select)}
                type="button"
              >
                {option.label}
                {option.count === undefined ? null : <span className="ml-2 text-xs opacity-80">{option.count.toLocaleString('sv-SE')}</span>}
              </button>
              {option.description ? <p className="sr-only" id={optionDescriptionId}>{option.description}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryFilter;
