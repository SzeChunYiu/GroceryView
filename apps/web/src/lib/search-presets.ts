export type SearchPresetFilterKey =
  | 'brand'
  | 'category'
  | 'chain'
  | 'dietary'
  | 'inStockOnly'
  | 'label'
  | 'maxPrice'
  | 'minConfidence'
  | 'minPrice'
  | 'origin'
  | 'q';

export type SearchFilterPreset = {
  createdAt: string;
  filters: Partial<Record<SearchPresetFilterKey, string[]>>;
  href: string;
  id: string;
  name: string;
  summary: string;
};

type SearchParamsLike = Partial<Record<SearchPresetFilterKey | 'page', string | string[] | undefined>>;

const presetFilterKeys: SearchPresetFilterKey[] = ['q', 'category', 'dietary', 'origin', 'chain', 'label', 'brand', 'minPrice', 'maxPrice', 'minConfidence', 'inStockOnly'];

function listValues(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean))];
}

export function searchPresetFiltersFromParams(searchParams: SearchParamsLike): SearchFilterPreset['filters'] {
  return Object.fromEntries(
    presetFilterKeys
      .map((key) => [key, listValues(searchParams[key])] as const)
      .filter(([, values]) => values.length > 0)
  );
}

export function searchPresetHref(filters: SearchFilterPreset['filters']) {
  const params = new URLSearchParams();
  for (const key of presetFilterKeys) {
    for (const value of filters[key] ?? []) params.append(key, value);
  }
  const query = params.toString();
  return query ? `/products?${query}` : '/products';
}

export function searchPresetSummary(filters: SearchFilterPreset['filters']) {
  const parts = presetFilterKeys.flatMap((key) => {
    const values = filters[key] ?? [];
    return values.length > 0 ? [`${key}: ${values.join(', ')}`] : [];
  });
  return parts.length > 0 ? parts.join(' · ') : 'No advanced filters selected';
}

export function buildSearchFilterPreset(searchParams: SearchParamsLike, name?: string, createdAt = new Date().toISOString()): SearchFilterPreset {
  const filters = searchPresetFiltersFromParams(searchParams);
  const href = searchPresetHref(filters);
  const summary = searchPresetSummary(filters);
  const id = `preset:${href.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 96) || 'all-products'}`;

  return {
    createdAt,
    filters,
    href,
    id,
    name: name?.trim() || (summary === 'No advanced filters selected' ? 'All verified products' : `Preset · ${summary.split(' · ').slice(0, 2).join(' · ')}`),
    summary
  };
}
