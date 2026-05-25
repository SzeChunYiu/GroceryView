'use client';

import type { KeyboardEvent } from 'react';

export type CategoryFilterOption = {
  id: string;
  label: string;
  description: string;
  count?: number;
};

type CategoryFilterProps = {
  options: CategoryFilterOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  label?: string;
  description?: string;
  idPrefix?: string;
  className?: string;
};

export function isCategoryFilterSelectionKey(key: string) {
  return key === 'Enter' || key === ' ' || key === 'Spacebar';
}

function optionDescriptionId(idPrefix: string, optionId: string) {
  return `${idPrefix}-${optionId}-description`;
}

export function CategoryFilter({
  options,
  selectedId,
  onSelect,
  label = 'Filter by category',
  description = 'Choose a category to refine the grocery results.',
  idPrefix = 'category-filter',
  className = ''
}: Readonly<CategoryFilterProps>) {
  const selected = options.find((option) => option.id === selectedId);
  const descriptionId = `${idPrefix}-description`;
  const statusId = `${idPrefix}-status`;
  const statusText = selected
    ? `${selected.label} category selected.`
    : `${options.length} categories available.`;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, optionId: string) {
    if (!isCategoryFilterSelectionKey(event.key)) return;

    event.preventDefault();
    onSelect(optionId);
  }

  return (
    <section
      aria-describedby={descriptionId}
      aria-label={label}
      className={['rounded-3xl border border-slate-200 bg-white p-4', className].filter(Boolean).join(' ')}
    >
      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600" id={descriptionId}>{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          const optionDescription = optionDescriptionId(idPrefix, option.id);
          const countLabel = typeof option.count === 'number' ? ` (${option.count})` : '';

          return (
            <button
              aria-describedby={`${descriptionId} ${optionDescription}`}
              aria-label={`${option.label}${countLabel}`}
              aria-pressed={isSelected}
              className={[
                'rounded-full border px-4 py-2 text-sm font-black transition',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700',
                isSelected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-700'
              ].join(' ')}
              key={option.id}
              onClick={() => onSelect(option.id)}
              onKeyDown={(event) => handleKeyDown(event, option.id)}
              type="button"
            >
              <span>{option.label}</span>
              {typeof option.count === 'number' ? <span className="ml-2 text-xs opacity-80">{option.count}</span> : null}
              <span className="sr-only" id={optionDescription}>{option.description}</span>
            </button>
          );
        })}
      </div>

      <p aria-atomic="true" aria-live="polite" className="sr-only" id={statusId} role="status">
        {statusText}
      </p>
    </section>
  );
}

export type CategoryScopedSuggestion = {
  query: string;
  categorySlug: string;
  reason: string;
  count: number;
};

export function CategorySuggestionList({
  suggestions,
  label = 'Category search suggestions'
}: Readonly<{ suggestions: CategoryScopedSuggestion[]; label?: string }>) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <a
            className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-900 hover:border-emerald-700"
            href={`/search?q=${encodeURIComponent(suggestion.query)}&category=${encodeURIComponent(suggestion.categorySlug)}`}
            key={`${suggestion.categorySlug}-${suggestion.query}-${suggestion.reason}`}
          >
            {suggestion.query}
            <span className="ml-2 text-xs font-semibold text-slate-500">{suggestion.reason.replace('-', ' ')} · {suggestion.count}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
