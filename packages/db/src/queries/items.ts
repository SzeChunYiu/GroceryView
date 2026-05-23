export type ItemSource = {
  id: string;
  name: string;
  category: string;
  storeIds: string[];
  onSale: boolean;
  organic: boolean;
  bestPrice?: number;
};

export type ItemsQueryFilter = {
  category?: readonly string[];
  store?: string;
  onSale?: boolean;
  organic?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedItemsResult = {
  items: ItemSource[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function normalizeCategory(category: string): string {
  return category.trim().toLowerCase();
}

function clampPage(value: number | undefined): number {
  if (!Number.isFinite(value) || value < 1) return DEFAULT_PAGE;
  return Math.floor(value);
}

function clampPageSize(value: number | undefined): number {
  if (!Number.isFinite(value) || value < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(value));
}

export function queryItems(input: { items: readonly ItemSource[]; query: ItemsQueryFilter }): PaginatedItemsResult {
  const requestedPage = clampPage(input.query.page);
  const requestedPageSize = clampPageSize(input.query.pageSize);
  const terms = (input.query.q ?? '')
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  const categoryFilter = new Set(
    (input.query.category ?? [])
      .map(normalizeCategory)
      .filter((category) => category.length > 0)
  );

  const storeFilter = input.query.store?.trim();

  const filtered = input.items.filter((item) => {
    if (categoryFilter.size > 0 && !categoryFilter.has(normalizeCategory(item.category))) return false;
    if (storeFilter && !item.storeIds.includes(storeFilter)) return false;
    if (input.query.onSale !== undefined && item.onSale !== input.query.onSale) return false;
    if (input.query.organic !== undefined && item.organic !== input.query.organic) return false;
    if (terms.length === 0) return true;

    const haystack = `${item.id}\n${item.name}\n${item.category}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });

  const ordered = [...filtered].sort((left, right) => {
    const byName = left.name.localeCompare(right.name);
    if (byName !== 0) return byName;
    return left.id.localeCompare(right.id);
  });

  const total = ordered.length;
  const page = requestedPage;
  const pageSize = requestedPageSize;
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  return {
    items: ordered.slice(offset, offset + pageSize).map((item) => ({ ...item })),
    total,
    page,
    pageSize,
    totalPages
  };
}
