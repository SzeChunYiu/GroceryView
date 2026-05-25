import { DEFAULT_ICA_MAX_PRODUCTS, DEFAULT_ICA_STORE_ACCOUNT_ID, ICA_STORE_BASE_URL } from './ica.js';

export const ICA_PRODUCT_PAGE_SEARCH_PATH = '/v6/product-pages/search';

export type IcaCatalogSearchInvestigation = {
  status: 'blocked' | 'approved';
  checkedAt: string;
  storeAccountId: string;
  observedBundlePath: string;
  probedUrl: string;
  blockedStatus: number;
  reason: string;
  requiredActions: string[];
  fallbackConnector: 'ica-store-promotions';
};

export type BuildIcaStoreProductSearchUrlOptions = {
  storeAccountId?: string;
  query?: string;
  pageToken?: string;
  sortOptionId?: string;
  maxPageSize?: number;
};

export function buildIcaStoreProductSearchUrl(options: BuildIcaStoreProductSearchUrlOptions = {}): string {
  const storeAccountId = options.storeAccountId ?? DEFAULT_ICA_STORE_ACCOUNT_ID;
  const maxPageSize = options.maxPageSize ?? DEFAULT_ICA_MAX_PRODUCTS;
  const url = new URL(`/stores/${storeAccountId}/api/webproductpagews${ICA_PRODUCT_PAGE_SEARCH_PATH}`, ICA_STORE_BASE_URL);
  if (options.query) url.searchParams.set('q', options.query);
  if (options.sortOptionId) url.searchParams.set('sortOptionId', options.sortOptionId);
  if (options.pageToken) url.searchParams.set('pageToken', options.pageToken);
  url.searchParams.set('tag', 'web');
  url.searchParams.set('includeAdditionalPageInfo', options.pageToken ? 'false' : 'true');
  url.searchParams.set('maxProductsToDecorate', String(maxPageSize));
  url.searchParams.set('maxPageSize', String(maxPageSize));
  return url.toString();
}

export const ICA_MAXI_CATALOG_SEARCH_INVESTIGATION: IcaCatalogSearchInvestigation = {
  status: 'blocked',
  checkedAt: '2026-05-23T20:53:30.000Z',
  storeAccountId: '1003418',
  observedBundlePath: ICA_PRODUCT_PAGE_SEARCH_PATH,
  probedUrl: buildIcaStoreProductSearchUrl({ storeAccountId: '1003418', query: 'mjölk', maxPageSize: 20 }),
  blockedStatus: 403,
  reason: 'The frontend bundle references /v6/product-pages/search, but the store-scoped API probe is blocked by CloudFront/AWS WAF without an approved authenticated or WAF-compatible access path.',
  requiredActions: ['approved_ica_catalog_search_access', 'waf_compatible_fetch_contract', 'pagination_contract_fixture'],
  fallbackConnector: 'ica-store-promotions'
};
