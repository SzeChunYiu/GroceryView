import Link from 'next/link';
import type { RemovableSearchFilterChip } from '@/lib/search-filters';

const dietaryFilters = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'lactose-free', label: 'Lactose-free' }
] as const;

type FilterPanelProps = {
  categoryOptions?: readonly { value: string; label: string; count: number }[];
  chainOptions?: readonly { value: string; label: string; count: number }[];
  promotionOptions?: readonly { value: string; label: string; count: number }[];
  selectedCategories?: readonly string[];
  selectedChains?: readonly string[];
  selectedDietary?: readonly string[];
  selectedPriceTypes?: readonly string[];
  activeChips?: readonly RemovableSearchFilterChip[];
  minPrice?: string;
  maxPrice?: string;
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

export function FilterPanel({
  categoryOptions = [],
  chainOptions = [],
  promotionOptions = [],
  selectedCategories = [],
  selectedChains = [],
  selectedDietary = [],
  selectedPriceTypes = [],
  activeChips = [],
  minPrice = '',
  maxPrice = ''
}: FilterPanelProps) {
  const selectedCategorySet = new Set(selectedCategories);
  const selectedChainSet = new Set(selectedChains);
  const selectedDietarySet = new Set(selectedDietary);
  const selectedPriceTypeSet = new Set(selectedPriceTypes);

  return (
    <fieldset className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3" data-search-filter-panel>
      <legend className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Search filters</legend>
      {activeChips.length > 0 ? (
        <div className="mb-3">
          <ActiveFilterChips chips={activeChips} />
        </div>
      ) : null}
      {categoryOptions.length > 0 ? (
        <div className="mb-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Category filters</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {categoryOptions.map((filter) => (
              <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-emerald-950 shadow-sm" key={filter.value}>
                <input defaultChecked={selectedCategorySet.has(filter.value)} name="category" type="checkbox" value={filter.value} />
                <span>{filter.label} · {filter.count}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
      {chainOptions.length > 0 ? (
        <div className="mb-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Chain filters</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {chainOptions.map((filter) => (
              <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-emerald-950 shadow-sm" key={filter.value}>
                <input defaultChecked={selectedChainSet.has(filter.value)} name="chain" type="checkbox" value={filter.value} />
                <span>{filter.label} · {filter.count}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-black text-emerald-950" htmlFor="filter-panel-min-price">
          Min unit price
          <input className="mt-2 w-full rounded-2xl border border-emerald-100 px-3 py-2 text-sm font-semibold text-slate-950" defaultValue={minPrice} id="filter-panel-min-price" min="0" name="minPrice" step="0.01" type="number" />
        </label>
        <label className="text-sm font-black text-emerald-950" htmlFor="filter-panel-max-price">
          Max unit price
          <input className="mt-2 w-full rounded-2xl border border-emerald-100 px-3 py-2 text-sm font-semibold text-slate-950" defaultValue={maxPrice} id="filter-panel-max-price" min="0" name="maxPrice" step="0.01" type="number" />
        </label>
      </div>
      {promotionOptions.length > 0 ? (
        <div className="mb-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Promotion filters</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {promotionOptions.map((filter) => (
              <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-emerald-950 shadow-sm" key={filter.value}>
                <input defaultChecked={selectedPriceTypeSet.has(filter.value)} name="priceType" type="checkbox" value={filter.value} />
                <span>{filter.label} · {filter.count}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Dietary filters</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {dietaryFilters.map((filter) => (
          <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-emerald-950 shadow-sm" key={filter.value}>
            <input defaultChecked={selectedDietarySet.has(filter.value)} name="dietary" type="checkbox" value={filter.value} />
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
