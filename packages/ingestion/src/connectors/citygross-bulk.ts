import {
  fetchCityGrossProductsForAllStores,
  type CityGrossProduct,
  type FetchCityGrossProductsForAllStoresOptions
} from './citygross.js';

export const CITY_GROSS_BULK_MINIMUM_ROWS = 100;

export type FetchCityGrossBulkProductsOptions = FetchCityGrossProductsForAllStoresOptions & {
  minRows?: number;
};

export async function fetchCityGrossBulkProducts(options: FetchCityGrossBulkProductsOptions = {}): Promise<CityGrossProduct[]> {
  const { minRows, queries, ...allStoreOptions } = options;
  const rows = await fetchCityGrossProductsForAllStores({
    ...allStoreOptions,
    queries: queries?.length ? queries : undefined
  });
  const minimumRows = minRows ?? CITY_GROSS_BULK_MINIMUM_ROWS;

  if (rows.length < minimumRows) {
    throw new Error(`City Gross bulk fetch returned only ${rows.length} rows; minimum required is ${minimumRows}.`);
  }

  return rows;
}

export type { CityGrossProduct };
