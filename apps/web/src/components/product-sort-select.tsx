import type { ProductSearchSortOption, ProductSearchUrlParams } from '@/lib/verified-data';
import { productSearchSortOptions } from '@/lib/verified-data';

type ProductSortSelectProps = {
  searchParams: ProductSearchUrlParams & { brand?: string | string[] };
  selectedSort: ProductSearchSortOption;
};

const preservedKeys: Array<keyof ProductSortSelectProps['searchParams']> = [
  'q',
  'category',
  'label',
  'origin',
  'dietary',
  'chain',
  'minPrice',
  'maxPrice',
  'inStockOnly',
  'minConfidence',
  'minCarbonScore',
  'brand'
];

function hiddenInputsFor(searchParams: ProductSortSelectProps['searchParams']) {
  return preservedKeys.flatMap((key) => {
    const value = searchParams[key];
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values
      .filter((item) => item.trim())
      .map((item, index) => <input key={`${key}-${index}-${item}`} name={key} type="hidden" value={item} />);
  });
}

export function ProductSortSelect({ searchParams, selectedSort }: ProductSortSelectProps) {
  const selectedOption = productSearchSortOptions.find((option) => option.value === selectedSort) ?? productSearchSortOptions[0];

  return (
    <form action="/products" className="mt-5 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm" method="get">
      {hiddenInputsFor(searchParams)}
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="text-sm font-black text-slate-950" htmlFor="product-search-sort">
          Sort results
          <select
            className="mt-2 min-h-11 w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
            defaultValue={selectedSort}
            id="product-search-sort"
            name="sort"
          >
            {productSearchSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-xl bg-violet-800 px-5 py-3 text-sm font-black text-white" type="submit">Apply sort</button>
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-violet-950">
        {selectedOption.description} Nearest-store sorting is location-aware when a shopper has shared location context; otherwise it falls back to verified store coverage.
      </p>
    </form>
  );
}
