export type SearchFacetOption = {
  value: string;
  label: string;
  count: number;
  helper?: string;
};

type FilterPanelProps = {
  action?: string;
  query?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  minConfidence?: number | null;
  inStockOnly?: boolean;
  selectedCategories?: readonly string[];
  selectedDietary?: readonly string[];
  selectedCertifications?: readonly string[];
  selectedChains?: readonly string[];
  categoryOptions?: readonly SearchFacetOption[];
  dietaryOptions?: readonly SearchFacetOption[];
  certificationOptions?: readonly SearchFacetOption[];
  chainOptions?: readonly SearchFacetOption[];
};

const groupStyles = {
  category: {
    fieldset: 'border-violet-100 bg-violet-50/80',
    heading: 'text-violet-800',
    option: 'text-violet-950',
    helper: 'text-violet-700'
  },
  dietary: {
    fieldset: 'border-emerald-100 bg-emerald-50/80',
    heading: 'text-emerald-800',
    option: 'text-emerald-950',
    helper: 'text-emerald-700'
  },
  certification: {
    fieldset: 'border-amber-100 bg-amber-50/80',
    heading: 'text-amber-800',
    option: 'text-amber-950',
    helper: 'text-amber-700'
  },
  chain: {
    fieldset: 'border-sky-100 bg-sky-50/80',
    heading: 'text-sky-800',
    option: 'text-sky-950',
    helper: 'text-sky-700'
  }
} as const;

function normalizedSelection(values: readonly string[] = []) {
  return new Set(values.map((value) => value.toLocaleLowerCase('sv-SE')));
}

function hiddenInput(name: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  return <input name={name} type="hidden" value={String(value)} />;
}

function FacetCheckboxGroup({
  title,
  name,
  options,
  selectedValues,
  styleKey
}: {
  title: string;
  name: string;
  options: readonly SearchFacetOption[];
  selectedValues: readonly string[];
  styleKey: keyof typeof groupStyles;
}) {
  const selected = normalizedSelection(selectedValues);
  const styles = groupStyles[styleKey];

  return (
    <fieldset className={`rounded-2xl border p-3 ${styles.fieldset}`}>
      <legend className={`text-xs font-black uppercase tracking-[0.18em] ${styles.heading}`}>{title}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <label className={`flex items-start gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black shadow-sm ${styles.option}`} key={`${name}-${option.value}`}>
            <input className="mt-1" defaultChecked={selected.has(option.value.toLocaleLowerCase('sv-SE'))} name={name} type="checkbox" value={option.value} />
            <span>
              {option.label}
              <span className={`block text-xs font-semibold ${styles.helper}`}>
                {option.count.toLocaleString('sv-SE')} rows{option.helper ? ` · ${option.helper}` : ''}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterPanel({
  action = '/search',
  query = '',
  minPrice = null,
  maxPrice = null,
  minConfidence = null,
  inStockOnly = false,
  selectedCategories = [],
  selectedDietary = [],
  selectedCertifications = [],
  selectedChains = [],
  categoryOptions = [],
  dietaryOptions = [],
  certificationOptions = [],
  chainOptions = []
}: FilterPanelProps) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm" method="get">
      {hiddenInput('q', query)}
      {hiddenInput('minPrice', minPrice)}
      {hiddenInput('maxPrice', maxPrice)}
      {hiddenInput('minConfidence', minConfidence)}
      {inStockOnly ? <input name="inStockOnly" type="hidden" value="true" /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <FacetCheckboxGroup name="category" options={categoryOptions} selectedValues={selectedCategories} styleKey="category" title="Category facets" />
        <FacetCheckboxGroup name="dietary" options={dietaryOptions} selectedValues={selectedDietary} styleKey="dietary" title="Dietary filters" />
        <FacetCheckboxGroup name="label" options={certificationOptions} selectedValues={selectedCertifications} styleKey="certification" title="Certifications" />
        <FacetCheckboxGroup name="chain" options={chainOptions} selectedValues={selectedChains} styleKey="chain" title="Store chains" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-xs font-semibold leading-5 text-slate-600">
          Multi-select facets keep shoppers in the search results flow. Dietary labels and certifications only match verified product metadata or explicit product text; GroceryView does not infer them from profiles or category names.
        </p>
        <div className="flex gap-2">
          <a className="rounded-full bg-slate-100 px-4 py-3 text-sm font-black text-slate-700" href={action}>Clear facets</a>
          <button className="rounded-full bg-violet-800 px-4 py-3 text-sm font-black text-white" type="submit">Apply facet selections</button>
        </div>
      </div>
    </form>
  );
}
