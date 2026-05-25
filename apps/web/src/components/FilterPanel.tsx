import Link from 'next/link';
import type { RemovableSearchFilterChip } from '@/lib/search-filters';

const dietaryFilters = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'lactose-free', label: 'Lactose-free' }
] as const;

type FilterPanelProps = {
  selectedDietary?: readonly string[];
  activeChips?: readonly RemovableSearchFilterChip[];
};

type ActiveFilterChipsProps = {
  chips: readonly RemovableSearchFilterChip[];
};

export function ActiveFilterChips({ chips }: ActiveFilterChipsProps) {
  if (chips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-white/80 px-4 py-3 text-sm font-bold text-violet-900">
        No saved search filters.
      </div>
    );
  }

  return (
    <div aria-label="Saved search filters" className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link className="rounded-full bg-violet-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-violet-700" href={chip.href} key={chip.id}>
          {chip.label}
          <span aria-hidden="true" className="ml-2">×</span>
          <span className="sr-only">Remove {chip.label}</span>
        </Link>
      ))}
    </div>
  );
}

export function FilterPanel({ selectedDietary = [], activeChips = [] }: FilterPanelProps) {
  const selected = new Set(selectedDietary);

  return (
    <fieldset className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
      <legend className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Dietary filters</legend>
      {activeChips.length > 0 ? (
        <div className="mb-3">
          <ActiveFilterChips chips={activeChips} />
        </div>
      ) : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {dietaryFilters.map((filter) => (
          <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-emerald-950 shadow-sm" key={filter.value}>
            <input defaultChecked={selected.has(filter.value)} name="dietary" type="checkbox" value={filter.value} />
            <span>{filter.label}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-emerald-900">
        Uses dietary flags captured during scraping; products without verified flags stay out of these filtered results.
      </p>
    </fieldset>
  );
}
