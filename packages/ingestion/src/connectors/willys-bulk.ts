import {
  fetchWillysProducts,
  type FetchWillysProductsOptions,
  type WillysProduct
} from './willys.js';

export const WILLYS_BULK_MINIMUM_ROWS = 100;

export type FetchWillysBulkProductsOptions = Pick<
  FetchWillysProductsOptions,
  'fetchImpl' | 'queries' | 'categoryPaths' | 'categoryTreeUrl' | 'maxRows' | 'retrievedAt'
> & {
  minRows?: number;
};

export async function fetchWillysBulkProducts(options: FetchWillysBulkProductsOptions = {}): Promise<WillysProduct[]> {
  const rows = await fetchWillysProducts({
    fetchImpl: options.fetchImpl,
    queries: options.queries?.length ? options.queries : undefined,
    categoryPaths: options.categoryPaths?.length ? options.categoryPaths : undefined,
    categoryTreeUrl: options.categoryTreeUrl,
    maxRows: options.maxRows,
    retrievedAt: options.retrievedAt
  });
  const minimumRows = options.minRows ?? WILLYS_BULK_MINIMUM_ROWS;

  if (rows.length < minimumRows) {
    throw new Error(`Willys bulk fetch returned only ${rows.length} rows; minimum required is ${minimumRows}.`);
  }

  return rows;
}

export type { WillysProduct };
