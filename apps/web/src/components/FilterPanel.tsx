const dietaryFilters = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'lactose-free', label: 'Lactose-free' }
] as const;

type FilterPanelProps = {
  selectedDietary?: readonly string[];
};

export function FilterPanel({ selectedDietary = [] }: FilterPanelProps) {
  const selected = new Set(selectedDietary);

  return (
    <fieldset className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
      <legend className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Dietary filters</legend>
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
