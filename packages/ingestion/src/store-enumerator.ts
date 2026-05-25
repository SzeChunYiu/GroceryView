import {
  fetchOverpassGroceryStores,
  OVERPASS_INTERPRETER_URL,
  type OverpassGroceryStore
} from './connectors/overpass.js';
import type { RetailerChainId } from './index.js';

export const STORE_ENUMERATOR_CHAIN_IDS = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'] as const satisfies readonly RetailerChainId[];

export type StoreEnumeratorSourceKind = 'official_locator_api' | 'official_locator_payload' | 'osm_overpass';
export type StoreEnumeratorSourceId =
  | 'ica_public_store_locator'
  | 'willys_axfood_store_locator'
  | 'hemkop_axfood_store_locator'
  | 'coop_public_store_locator'
  | 'lidl_nuxt_store_locator_payload'
  | 'city_gross_public_site_api'
  | 'osm_overpass_sweden';

export type StoreEnumeratorSourceCitation = {
  sourceId: StoreEnumeratorSourceId;
  chainIds: RetailerChainId[];
  kind: StoreEnumeratorSourceKind;
  name: string;
  url: string;
  evidence: string;
};

export type StoreBranchStatus = 'open' | 'temporarily_closed' | 'unknown';

export type StoreBranchOsmReference = {
  osmType: OverpassGroceryStore['osmType'];
  osmId: number;
  sourceUrl: string;
};

export type EnumeratedStoreBranch = {
  chainId: RetailerChainId;
  storeId: string;
  sourceStoreId: string;
  sourceIds: StoreEnumeratorSourceId[];
  name: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: 'SE';
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  branchUrl?: string;
  status: StoreBranchStatus;
  sourceUrl: string;
  retrievedAt: string;
  metadata?: Record<string, string | number | boolean>;
  osmReferences?: StoreBranchOsmReference[];
};

export type StoreEnumerationResult = {
  chainId: RetailerChainId;
  retrievedAt: string;
  sourceCitations: StoreEnumeratorSourceCitation[];
  stores: EnumeratedStoreBranch[];
  issues: string[];
};

export type StoreEnumerationSupplement = Omit<StoreEnumerationResult, 'chainId'>;

export type StoreEnumerationValidation = {
  status: 'valid' | 'invalid';
  chainIds: RetailerChainId[];
  issues: string[];
};

export type FetchStoreBranchesOptions = {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  includeOsm?: boolean;
};

export type FetchAllStoreBranchesOptions = FetchStoreBranchesOptions & {
  chainIds?: readonly RetailerChainId[];
};

export const ICA_PUBLIC_ACCESS_TOKEN_URL = 'https://www.ica.se/e11/public-access-token';
export const ICA_STORE_LIST_URL = 'https://apim-pub.gw.ica.se/sverige/digx/mdsastoresearch/v1/storeslist?url=%2F&skip=0&take=5000';
export const WILLYS_STORE_LIST_URL = 'https://www.willys.se/axfood/rest/store?online=false&clickAndCollect=false&b2bClickAndCollect=false';
export const HEMKOP_STORE_LIST_URL = 'https://www.hemkop.se/axfood/rest/store?online=false&clickAndCollect=false&b2bClickAndCollect=false';
export const COOP_STORE_MAP_URL = 'https://proxy.api.coop.se/external/store/stores/map?api-version=v2&conceptIds=12,6,95&invertFilter=true';
export const COOP_STORE_API_SUBSCRIPTION_KEY = '990520e65cc44eef89e9e9045b57f4e9';
export const LIDL_STORE_DIRECTORY_PAYLOAD_URL = 'https://www.lidl.se/s/sv-SE/butiker/_payload.json?bid_26_9_15';
export const CITY_GROSS_SITES_URL = 'https://www.citygross.se/api/v1/sites?siteTypeId=3';

export const SWEDEN_CHAIN_STORE_OVERPASS_QUERY = `[out:json][timeout:180];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
  node["shop"~"^(supermarket|convenience|grocery)$"]["brand"~"^(ICA|Willys|Coop|Hemköp|Hemkop|Lidl|City Gross)",i](area.searchArea);
  way["shop"~"^(supermarket|convenience|grocery)$"]["brand"~"^(ICA|Willys|Coop|Hemköp|Hemkop|Lidl|City Gross)",i](area.searchArea);
  relation["shop"~"^(supermarket|convenience|grocery)$"]["brand"~"^(ICA|Willys|Coop|Hemköp|Hemkop|Lidl|City Gross)",i](area.searchArea);
  node["shop"~"^(supermarket|convenience|grocery)$"]["name"~"^(ICA|Willys|Coop|Hemköp|Hemkop|Lidl|City Gross)",i](area.searchArea);
  way["shop"~"^(supermarket|convenience|grocery)$"]["name"~"^(ICA|Willys|Coop|Hemköp|Hemkop|Lidl|City Gross)",i](area.searchArea);
  relation["shop"~"^(supermarket|convenience|grocery)$"]["name"~"^(ICA|Willys|Coop|Hemköp|Hemkop|Lidl|City Gross)",i](area.searchArea);
);
out center tags;`;

export const storeEnumeratorSourceCitations: StoreEnumeratorSourceCitation[] = [
  {
    sourceId: 'ica_public_store_locator',
    chainIds: ['ica'],
    kind: 'official_locator_api',
    name: 'ICA public store locator',
    url: ICA_STORE_LIST_URL,
    evidence: 'The public locator page obtains an anonymous public access token, then calls the mdsa store search storeslist endpoint.'
  },
  {
    sourceId: 'willys_axfood_store_locator',
    chainIds: ['willys'],
    kind: 'official_locator_api',
    name: 'Willys public Axfood store endpoint',
    url: WILLYS_STORE_LIST_URL,
    evidence: 'The Willys site exposes its branch list through the public /axfood/rest/store endpoint.'
  },
  {
    sourceId: 'hemkop_axfood_store_locator',
    chainIds: ['hemkop'],
    kind: 'official_locator_api',
    name: 'Hemköp public Axfood store endpoint',
    url: HEMKOP_STORE_LIST_URL,
    evidence: 'The Hemköp site exposes its branch list through the public /axfood/rest/store endpoint.'
  },
  {
    sourceId: 'coop_public_store_locator',
    chainIds: ['coop'],
    kind: 'official_locator_api',
    name: 'Coop public store map endpoint',
    url: COOP_STORE_MAP_URL,
    evidence: 'The Coop store locator publishes storeApiUrl and storeApiSubscriptionKey in window.coopSettings and loads /stores/map.'
  },
  {
    sourceId: 'lidl_nuxt_store_locator_payload',
    chainIds: ['lidl'],
    kind: 'official_locator_payload',
    name: 'Lidl Sweden Nuxt store locator payload',
    url: LIDL_STORE_DIRECTORY_PAYLOAD_URL,
    evidence: 'The Lidl store locator publishes Nuxt _payload.json documents for the country page, city pages, and store detail pages.'
  },
  {
    sourceId: 'city_gross_public_site_api',
    chainIds: ['city_gross'],
    kind: 'official_locator_api',
    name: 'City Gross public site API',
    url: CITY_GROSS_SITES_URL,
    evidence: 'The City Gross React app uses BASE_URL /api/v1 and requests /sites for public site/store selection data.'
  },
  {
    sourceId: 'osm_overpass_sweden',
    chainIds: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
    kind: 'osm_overpass',
    name: 'OpenStreetMap Overpass Sweden supermarket query',
    url: OVERPASS_INTERPRETER_URL,
    evidence: 'OpenStreetMap shop=supermarket/convenience/grocery elements are queried by chain brand/name for Sweden.'
  }
];

const OFFICIAL_SOURCE_BY_CHAIN: Record<RetailerChainId, StoreEnumeratorSourceId> = {
  ica: 'ica_public_store_locator',
  willys: 'willys_axfood_store_locator',
  coop: 'coop_public_store_locator',
  hemkop: 'hemkop_axfood_store_locator',
  lidl: 'lidl_nuxt_store_locator_payload',
  city_gross: 'city_gross_public_site_api'
};

export async function fetchStoreBranchesForChain(
  chainId: RetailerChainId,
  options: FetchStoreBranchesOptions = {}
): Promise<StoreEnumerationResult> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const official = await fetchOfficialStoreBranchesForChain(chainId, { ...options, retrievedAt });

  if (!options.includeOsm) return official;

  const osmStores = await fetchOsmStoreBranches({ ...options, retrievedAt });
  const chainOsmStores = osmStores.stores.filter((store) => store.chainId === chainId);

  return {
    ...official,
    sourceCitations: citationsForResult([...official.stores, ...chainOsmStores]),
    stores: mergeOfficialAndOsmBranches(official.stores, chainOsmStores),
    issues: [...official.issues, ...osmStores.issues]
  };
}

export async function fetchAllStoreBranches(options: FetchAllStoreBranchesOptions = {}): Promise<StoreEnumerationResult[]> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const chainIds = options.chainIds ?? STORE_ENUMERATOR_CHAIN_IDS;

  if (!options.includeOsm) {
    return Promise.all(chainIds.map((chainId) => fetchOfficialStoreBranchesForChain(chainId, { ...options, retrievedAt })));
  }

  const [officialResults, osmStores] = await Promise.all([
    Promise.all(chainIds.map((chainId) => fetchOfficialStoreBranchesForChain(chainId, { ...options, retrievedAt }))),
    fetchOsmStoreBranches({ ...options, retrievedAt })
  ]);

  return officialResults.map((result) => {
    const chainOsmStores = osmStores.stores.filter((store) => store.chainId === result.chainId);
    const stores = mergeOfficialAndOsmBranches(result.stores, chainOsmStores);
    return {
      ...result,
      sourceCitations: citationsForResult(stores),
      stores,
      issues: [...result.issues, ...osmStores.issues]
    };
  });
}

export async function fetchOfficialStoreBranchesForChain(
  chainId: RetailerChainId,
  options: FetchStoreBranchesOptions = {}
): Promise<StoreEnumerationResult> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();

  switch (chainId) {
    case 'ica':
      return resultForChain(chainId, parseIcaStoreList(await fetchIcaStoreListPayload(options.fetchImpl), retrievedAt), retrievedAt);
    case 'willys':
      return resultForChain(chainId, parseAxfoodStoreList('willys', await fetchJson(WILLYS_STORE_LIST_URL, options.fetchImpl), retrievedAt), retrievedAt);
    case 'hemkop':
      return resultForChain(chainId, parseAxfoodStoreList('hemkop', await fetchJson(HEMKOP_STORE_LIST_URL, options.fetchImpl), retrievedAt), retrievedAt);
    case 'coop':
      return resultForChain(chainId, parseCoopStoreMap(await fetchCoopStoreMapPayload(options.fetchImpl), retrievedAt), retrievedAt);
    case 'lidl':
      return resultForChain(chainId, await fetchLidlStoreBranches({ ...options, retrievedAt }), retrievedAt);
    case 'city_gross':
      return resultForChain(chainId, parseCityGrossSites(await fetchJson(CITY_GROSS_SITES_URL, options.fetchImpl), retrievedAt), retrievedAt);
  }
}

export async function fetchOsmStoreBranches(options: FetchStoreBranchesOptions = {}): Promise<StoreEnumerationSupplement> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows = await fetchOverpassGroceryStores({
    fetchImpl: options.fetchImpl,
    query: SWEDEN_CHAIN_STORE_OVERPASS_QUERY,
    retrievedAt
  });
  const stores = parseOsmChainStores(rows, retrievedAt);
  return {
    retrievedAt,
    sourceCitations: [sourceCitationById('osm_overpass_sweden')],
    stores,
    issues: []
  };
}

export async function fetchLidlStoreBranches(options: FetchStoreBranchesOptions = {}): Promise<EnumeratedStoreBranch[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const countryPayload = await fetchJson(LIDL_STORE_DIRECTORY_PAYLOAD_URL, fetchImpl);
  const directoryLinks = parseLidlStoreDirectoryLinks(countryPayload);
  const payloadUrls = new Set<string>([LIDL_STORE_DIRECTORY_PAYLOAD_URL]);

  for (const link of directoryLinks) {
    payloadUrls.add(lidlPayloadUrlForPage(link.url));
  }

  const stores: EnumeratedStoreBranch[] = [];
  for (const payloadUrl of payloadUrls) {
    const payload = payloadUrl === LIDL_STORE_DIRECTORY_PAYLOAD_URL ? countryPayload : await fetchJson(payloadUrl, fetchImpl);
    stores.push(...parseLidlStorePayload(payload, retrievedAt, payloadUrl));
  }

  return uniqueBy(stores, (store) => store.storeId);
}

export function parseIcaStoreList(payload: unknown, retrievedAt: string): EnumeratedStoreBranch[] {
  return asArray(payload)
    .map((store) => {
      const record = asRecord(store);
      const address = asRecord(record.address);
      const coordinates = asRecord(address.coordinates);
      const accountNumber = text(record.accountNumber);
      const storeId = text(record.storeId);
      const name = text(record.storeName);

      if (!name || (!accountNumber && !storeId)) return null;

      const sourceStoreId = accountNumber || storeId;
      return compactBranch({
        chainId: 'ica',
        storeId: canonicalStoreId('ica', sourceStoreId),
        sourceStoreId,
        sourceIds: ['ica_public_store_locator'],
        name,
        address: text(address.street),
        city: text(address.city),
        postalCode: text(address.postalCode),
        countryCode: 'SE',
        latitude: numberFrom(coordinates.coordinateX) ?? numberFrom(record.lat) ?? numberFrom(asRecord(record.geoPosition).lat),
        longitude: numberFrom(coordinates.coordinateY) ?? numberFrom(record.lng) ?? numberFrom(asRecord(record.geoPosition).lng),
        phone: text(record.phoneNumber),
        email: text(record.emailAddress),
        website: text(record.bhsUrl) || text(record.onlineUrl),
        branchUrl: text(record.bhsUrl),
        status: 'open',
        sourceUrl: ICA_STORE_LIST_URL,
        retrievedAt,
        metadata: {
          bmsStoreId: storeId,
          profile: text(record.profile)
        }
      });
    })
    .filter(isBranch);
}

export function parseAxfoodStoreList(chainId: Extract<RetailerChainId, 'willys' | 'hemkop'>, payload: unknown, retrievedAt: string): EnumeratedStoreBranch[] {
  const sourceId = chainId === 'willys' ? 'willys_axfood_store_locator' : 'hemkop_axfood_store_locator';
  const sourceUrl = chainId === 'willys' ? WILLYS_STORE_LIST_URL : HEMKOP_STORE_LIST_URL;

  return asArray(payload)
    .map((store) => {
      const record = asRecord(store);
      const address = asRecord(record.address);
      const geoPoint = asRecord(record.geoPoint);
      const name = text(record.name);
      const sourceStoreId = text(record.storeId) || text(record.siteId) || slugify(name);

      if (!name || bool(record.external) || !sourceStoreId) return null;

      return compactBranch({
        chainId,
        storeId: canonicalStoreId(chainId, sourceStoreId),
        sourceStoreId,
        sourceIds: [sourceId],
        name,
        address: text(address.line1) || text(address.streetAddress),
        city: text(address.town) || text(address.city),
        postalCode: text(address.postalCode),
        countryCode: 'SE',
        latitude: numberFrom(geoPoint.latitude),
        longitude: numberFrom(geoPoint.longitude),
        phone: text(record.phone),
        website: text(record.url),
        branchUrl: text(record.url),
        status: 'open',
        sourceUrl,
        retrievedAt,
        metadata: {
          onlineStore: bool(record.onlineStore),
          clickAndCollect: bool(record.clickAndCollect)
        }
      });
    })
    .filter(isBranch);
}

export function parseCoopStoreMap(payload: unknown, retrievedAt: string): EnumeratedStoreBranch[];
export function parseCoopStoreMap(payload: unknown, sourceUrl: string, capturedAt: string): EnumeratedStore[];
export function parseCoopStoreMap(payload: unknown, sourceUrlOrRetrievedAt: string, capturedAt?: string): EnumeratedStoreBranch[] | EnumeratedStore[] {
  const retrievedAt = capturedAt ?? sourceUrlOrRetrievedAt;
  const sourceUrl = capturedAt ? sourceUrlOrRetrievedAt : COOP_STORE_MAP_URL;
  const branches = asArray(payload)
    .map((store) => {
      const record = asRecord(store);
      const storeId = text(record.storeId);
      const ledgerAccountNumber = text(record.ledgerAccountNumber);
      const name = text(record.name);
      const sourceStoreId = ledgerAccountNumber || storeId;

      if (!name || !sourceStoreId) return null;

      return compactBranch({
        chainId: 'coop',
        storeId: canonicalStoreId('coop', sourceStoreId),
        sourceStoreId,
        sourceIds: ['coop_public_store_locator'],
        name,
        address: text(record.address),
        city: text(record.city),
        postalCode: text(record.postalCode),
        countryCode: 'SE',
        latitude: numberFrom(record.latitude),
        longitude: numberFrom(record.longitude),
        phone: text(record.phone),
        website: text(record.url) ? `https://www.coop.se${text(record.url)}` : undefined,
        branchUrl: text(record.url) ? `https://www.coop.se${text(record.url)}` : undefined,
        status: text(record.status).toLowerCase() === 'closed' ? 'temporarily_closed' : 'open',
        sourceUrl,
        retrievedAt,
        metadata: {
          storeId,
          ledgerAccountNumber
        }
      });
    })
    .filter(isBranch);
  return capturedAt ? branches.map(branchToEnumeratedStore) : branches;
}

export function parseCityGrossSites(payload: unknown, retrievedAt: string): EnumeratedStoreBranch[] {
  const sites = asArray(asRecord(payload).sites);
  return sites
    .map((site) => {
      const record = asRecord(site);
      const sourceStoreId = text(record.storeNumber) || text(record.id);
      const name = text(record.name);

      if (!sourceStoreId || !name || numberFrom(record.type) !== 3) return null;

      return compactBranch({
        chainId: 'city_gross',
        storeId: canonicalStoreId('city_gross', sourceStoreId),
        sourceStoreId,
        sourceIds: ['city_gross_public_site_api'],
        name: `City Gross ${name}`,
        address: text(record.streetAddress),
        city: text(record.city),
        postalCode: text(record.zipcode),
        countryCode: 'SE',
        phone: text(record.phone),
        email: text(record.email),
        status: 'open',
        sourceUrl: CITY_GROSS_SITES_URL,
        retrievedAt,
        metadata: {
          siteId: numberFrom(record.id) ?? sourceStoreId
        }
      });
    })
    .filter(isBranch);
}

export type LidlDirectoryLink = {
  name: string;
  numberOfStores: number;
  url: string;
};

export function parseLidlStoreDirectoryLinks(payload: unknown): LidlDirectoryLink[] {
  const dereferenced = dereferenceNuxtPayload(payload);
  const links: LidlDirectoryLink[] = [];

  visit(dereferenced, (value) => {
    const record = asRecord(value);
    const url = text(record.url);
    const name = text(record.name);
    const numberOfStores = numberFrom(record.numberOfStores);
    if (name && url.startsWith('/s/sv-SE/butiker/') && numberOfStores !== undefined) {
      links.push({ name, numberOfStores, url: absoluteLidlUrl(url) });
    }
  });

  return uniqueBy(links, (link) => link.url);
}

export function parseLidlStorePayload(payload: unknown, retrievedAt: string, sourceUrl = LIDL_STORE_DIRECTORY_PAYLOAD_URL): EnumeratedStoreBranch[] {
  const dereferenced = dereferenceNuxtPayload(payload);
  const stores: EnumeratedStoreBranch[] = [];

  visit(dereferenced, (value) => {
    const record = asRecord(value);
    const sourceStoreId = text(record.objectNumber);
    const name = text(record.storeName);
    const address = asRecord(record.address);

    if (!sourceStoreId || !name) return;

    const streetName = text(address.streetName);
    const streetNumber = text(address.streetNumber);
    const status = text(asRecord(record.status).name).toLowerCase() === 'open' ? 'open' : 'unknown';
    stores.push(compactBranch({
      chainId: 'lidl',
      storeId: canonicalStoreId('lidl', sourceStoreId),
      sourceStoreId,
      sourceIds: ['lidl_nuxt_store_locator_payload'],
      name: `Lidl ${name}`,
      address: [streetName, streetNumber].filter(Boolean).join(' '),
      city: text(address.city),
      postalCode: text(address.zip),
      countryCode: 'SE',
      latitude: numberFrom(address.latitude),
      longitude: numberFrom(address.longitude),
      status,
      sourceUrl,
      retrievedAt
    }));
  });

  return uniqueBy(stores, (store) => store.storeId);
}

export function parseOsmChainStores(rows: OverpassGroceryStore[], retrievedAt: string): EnumeratedStoreBranch[] {
  return rows
    .map((row) => {
      const chainId = classifyOsmChain(row);
      if (!chainId) return null;
      const address = [row.street, row.houseNumber].filter(Boolean).join(' ');
      return compactBranch({
        chainId,
        storeId: `${chainId}:osm:${row.osmType}:${row.osmId}`,
        sourceStoreId: `${row.osmType}:${row.osmId}`,
        sourceIds: ['osm_overpass_sweden'],
        name: row.name,
        address,
        city: row.city,
        postalCode: row.postcode,
        countryCode: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        phone: row.phone,
        website: row.website,
        branchUrl: row.website,
        status: 'unknown',
        sourceUrl: row.sourceUrl,
        retrievedAt,
        metadata: {
          osmBrand: row.brand,
          osmShop: row.shop
        },
        osmReferences: [{
          osmType: row.osmType,
          osmId: row.osmId,
          sourceUrl: row.sourceUrl
        }]
      });
    })
    .filter(isBranch);
}

export function validateStoreEnumerationResults(results: StoreEnumerationResult[]): StoreEnumerationValidation {
  const issues: string[] = [];
  const chainIds = [...new Set(results.map((result) => result.chainId))].sort() as RetailerChainId[];

  for (const chainId of STORE_ENUMERATOR_CHAIN_IDS) {
    if (!chainIds.includes(chainId)) issues.push(`missing_chain:${chainId}`);
  }

  for (const result of results) {
    const sourceIds = new Set(result.sourceCitations.map((citation) => citation.sourceId));
    const storeIds = new Set<string>();
    const officialSource = OFFICIAL_SOURCE_BY_CHAIN[result.chainId];
    if (!sourceIds.has(officialSource)) issues.push(`missing_official_source:${result.chainId}`);

    for (const store of result.stores) {
      if (store.chainId !== result.chainId) issues.push(`chain_mismatch:${result.chainId}:${store.storeId}`);
      if (!store.storeId.startsWith(`${store.chainId}:`)) issues.push(`invalid_store_id:${store.storeId}`);
      if (storeIds.has(store.storeId)) issues.push(`duplicate_store_id:${store.storeId}`);
      storeIds.add(store.storeId);
      if (!store.name.trim()) issues.push(`missing_name:${store.storeId}`);
      if (!store.sourceStoreId.trim()) issues.push(`missing_source_store_id:${store.storeId}`);
      if (!store.sourceUrl.startsWith('https://')) issues.push(`invalid_source_url:${store.storeId}`);
      if (Number.isNaN(Date.parse(store.retrievedAt))) issues.push(`invalid_retrieved_at:${store.storeId}`);
      for (const sourceId of store.sourceIds) {
        if (!sourceIds.has(sourceId)) issues.push(`missing_source_citation:${store.storeId}:${sourceId}`);
      }
    }
  }

  return {
    status: issues.length === 0 ? 'valid' : 'invalid',
    chainIds,
    issues
  };
}

export type StoreEnumeratorChainId = RetailerChainId;
export type StoreIdentifierKind = 'official_store_id' | 'official_ledger_account' | 'official_url_slug' | 'osm_element';

export type LegacyStoreEnumeratorSource = {
  sourceId: string;
  chainId?: StoreEnumeratorChainId;
  kind: 'official_store_locator' | 'osm_overpass';
  sourceUrl: string;
  citation: string;
};

export type EnumeratedStoreSourceRef = {
  sourceId: string;
  sourceUrl: string;
  capturedAt: string;
};

export type EnumeratedStoreAddress = {
  street: string;
  postalCode: string;
  city: string;
  raw: string;
};

export type EnumeratedStore = {
  chainId: StoreEnumeratorChainId;
  storeId: string;
  retailerStoreId: string;
  identifierKind: StoreIdentifierKind;
  name: string;
  address: EnumeratedStoreAddress;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  url: string;
  openingHours: string[];
  sourceRefs: EnumeratedStoreSourceRef[];
};

export type FetchStoreEnumeratorStoresOptions = {
  fetchImpl?: typeof fetch;
  chains?: readonly StoreEnumeratorChainId[];
  includeOsm?: boolean;
  retrievedAt?: string;
};

export const ICA_STORES_URL = 'https://www.ica.se/butiker/';
export const WILLYS_STORE_SEARCH_URL = WILLYS_STORE_LIST_URL;
export const HEMKOP_STORE_SEARCH_URL = HEMKOP_STORE_LIST_URL;
export const COOP_STORES_PAGE_URL = 'https://www.coop.se/butiker-erbjudanden/';
export const COOP_STORE_MAP_PATH = 'stores/map';
export const CITY_GROSS_STORES_URL = 'https://www.citygross.se/api/v1/PageData/stores';
export const LIDL_STORES_URL = 'https://www.lidl.se/s/sv-SE/butiker/';
export const STORE_ENUMERATOR_OVERPASS_URL = OVERPASS_INTERPRETER_URL;
export const STORE_ENUMERATOR_OVERPASS_QUERY = SWEDEN_CHAIN_STORE_OVERPASS_QUERY;
export const STORE_ENUMERATOR_DEFAULT_CHAINS = STORE_ENUMERATOR_CHAIN_IDS;

export const storeEnumeratorSources: LegacyStoreEnumeratorSource[] = [
  { sourceId: 'ica-store-locator', chainId: 'ica', kind: 'official_store_locator', sourceUrl: ICA_STORE_LIST_URL, citation: 'ICA public store finder and mdsa storeslist endpoint.' },
  { sourceId: 'willys-store-search', chainId: 'willys', kind: 'official_store_locator', sourceUrl: WILLYS_STORE_LIST_URL, citation: 'Willys public Axfood store endpoint.' },
  { sourceId: 'hemkop-store-search', chainId: 'hemkop', kind: 'official_store_locator', sourceUrl: HEMKOP_STORE_LIST_URL, citation: 'Hemköp public Axfood store endpoint.' },
  { sourceId: 'coop-store-map', chainId: 'coop', kind: 'official_store_locator', sourceUrl: COOP_STORE_MAP_URL, citation: 'Coop public stores page plus its exposed public store map API settings.' },
  { sourceId: 'city-gross-page-data-stores', chainId: 'city_gross', kind: 'official_store_locator', sourceUrl: CITY_GROSS_SITES_URL, citation: 'City Gross public site/store API used by the stores page.' },
  { sourceId: 'lidl-store-seo-pages', chainId: 'lidl', kind: 'official_store_locator', sourceUrl: LIDL_STORE_DIRECTORY_PAYLOAD_URL, citation: 'Lidl public store locator Nuxt payloads.' },
  { sourceId: 'osm-overpass-supermarkets', kind: 'osm_overpass', sourceUrl: OVERPASS_INTERPRETER_URL, citation: 'OpenStreetMap data via Overpass, filtered to Swedish supermarkets for supported chains.' }
];

export function buildAxfoodStoreSearchUrl(chainId: Extract<RetailerChainId, 'willys' | 'hemkop'>): string {
  return chainId === 'willys' ? WILLYS_STORE_LIST_URL : HEMKOP_STORE_LIST_URL;
}

export function buildCoopStoreMapUrl(storeApiUrl: string): string {
  return `${storeApiUrl.replace(/\/$/, '')}/${COOP_STORE_MAP_PATH}?api-version=v2&conceptIds=12,6,95&invertFilter=true`;
}

export async function fetchStoreEnumeratorStores(options: FetchStoreEnumeratorStoresOptions = {}): Promise<EnumeratedStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const chains = options.chains ?? STORE_ENUMERATOR_DEFAULT_CHAINS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const officialStores: EnumeratedStore[] = [];

  for (const chainId of chains) {
    officialStores.push(...await fetchStoreEnumeratorChainStores(chainId, { fetchImpl, retrievedAt }));
  }

  if (options.includeOsm === false) return dedupeEnumeratedStores(officialStores);

  const selectedChains = new Set(chains);
  const osmStores = (await fetchOsmStoreBranches({ fetchImpl, retrievedAt })).stores
    .filter((store) => selectedChains.has(store.chainId))
    .map(branchToEnumeratedStore);
  return mergeStoreEnumerations(officialStores, osmStores);
}

export async function fetchStoreEnumeratorChainStores(
  chainId: StoreEnumeratorChainId,
  options: { fetchImpl?: typeof fetch; retrievedAt?: string } = {}
): Promise<EnumeratedStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();

  if (chainId === 'willys' || chainId === 'hemkop') {
    const payload = await fetchJson(buildAxfoodStoreSearchUrl(chainId), fetchImpl);
    const rows = asArray(asRecord(payload).results).length > 0 ? asArray(asRecord(payload).results) : asArray(payload);
    return rows
      .map((store) => normalizeAxfoodStore(chainId, store, buildAxfoodStoreSearchUrl(chainId), retrievedAt))
      .filter((store): store is EnumeratedStore => store !== null);
  }

  const result = await fetchOfficialStoreBranchesForChain(chainId, { fetchImpl, retrievedAt });
  return result.stores.map(branchToEnumeratedStore);
}

export function normalizeAxfoodStore(
  chainId: Extract<RetailerChainId, 'willys' | 'hemkop'>,
  store: unknown,
  sourceUrl: string,
  capturedAt: string
): EnumeratedStore | null {
  const record = asRecord(store);
  const branch = parseAxfoodStoreList(chainId, [{
    ...record,
    name: text(record.displayName) || text(record.name),
    address: {
      ...asRecord(record.address),
      phone: text(asRecord(record.address).phoneNumber)
    }
  }], capturedAt)[0];
  if (!branch) return null;
  return branchToEnumeratedStore({ ...branch, sourceUrl });
}

export function parseCoopStoreServiceAccess(html: string): CoopStoreServiceAccess | null {
  const storeApiUrl = /"storeApiUrl"\s*:\s*"([^"]+)"/.exec(html)?.[1] ?? '';
  const storeApiSubscriptionKey = /"storeApiSubscriptionKey"\s*:\s*"([^"]+)"/.exec(html)?.[1] ?? '';
  return storeApiUrl && storeApiSubscriptionKey ? { storeApiUrl, storeApiSubscriptionKey } : null;
}

export type CoopStoreServiceAccess = {
  storeApiUrl: string;
  storeApiSubscriptionKey: string;
};

export function parseIcaInitialStores(html: string, capturedAt: string): EnumeratedStore[] {
  const scriptMatch = /"slimStores"\s*:\s*(\[[\s\S]*?\])\s*}/i.exec(html);
  if (!scriptMatch) return [];
  try {
    return parseIcaStoreList(JSON.parse(scriptMatch[1]), capturedAt).map(branchToEnumeratedStore);
  } catch {
    return [];
  }
}

export function parseIcaStoresHtml(html: string, capturedAt: string): EnumeratedStore[] {
  const rows: EnumeratedStore[] = [];
  const cardPattern = /<div[^>]*ids-store-card__short-info[^>]*>([\s\S]*?)<\/div>/g;
  for (const match of html.matchAll(cardPattern)) {
    const card = match[1];
    const name = stripHtml(/ids-store-card__store-name[^>]*>([\s\S]*?)<\/[^>]+>/.exec(card)?.[1] ?? '');
    const rawAddress = stripHtml(/ids-store-card__store-address[^>]*>([\s\S]*?)<\/[^>]+>/.exec(card)?.[1] ?? '');
    const href = /href="([^"]+)"/.exec(card)?.[1] ?? ICA_STORES_URL;
    const retailerStoreId = /-(\d+)\/?$/.exec(href)?.[1] ?? slugify(name);
    const [street = '', city = ''] = rawAddress.split(',').map((part) => part.trim());
    rows.push({
      chainId: 'ica',
      storeId: `ica:${retailerStoreId}`,
      retailerStoreId,
      identifierKind: 'official_url_slug',
      name,
      address: { street, postalCode: '', city, raw: rawAddress },
      phone: '',
      url: href,
      openingHours: [],
      sourceRefs: [{ sourceId: 'ica-store-locator', sourceUrl: ICA_STORES_URL, capturedAt }]
    });
  }
  return rows.filter((row) => row.name);
}

export function parseCityGrossStores(payload: unknown, sourceUrl: string, capturedAt: string): EnumeratedStore[] {
  return asArray(payload)
    .map((item) => {
      const data = asRecord(asRecord(item).data);
      const coordinates = parseCoordinates(text(asRecord(data.storeLocation).coordinates));
      const branch = compactBranch({
        chainId: 'city_gross',
        storeId: canonicalStoreId('city_gross', text(data.siteId) || text(data.id)),
        sourceStoreId: text(data.siteId) || text(data.id),
        sourceIds: ['city_gross_public_site_api'],
        name: `City Gross ${text(data.storeName) || text(data.name)}`,
        address: '',
        city: text(data.storeName) || text(data.name),
        postalCode: '',
        countryCode: 'SE',
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        phone: text(asRecord(data.contactInformation).phone),
        branchUrl: text(data.url) ? `https://www.citygross.se${text(data.url)}` : undefined,
        status: 'open',
        sourceUrl,
        retrievedAt: capturedAt
      });
      return branch.sourceStoreId ? branchToEnumeratedStore(branch) : null;
    })
    .filter((store): store is EnumeratedStore => store !== null);
}

export function normalizeLidlStoreFromUrl(url: string, rawAddress: string, sourceUrl: string, capturedAt: string): EnumeratedStore {
  const absoluteUrl = absoluteLidlUrl(url);
  const parts = absoluteUrl.split('/').filter(Boolean);
  const retailerStoreId = parts.slice(-2).join('-') || slugify(rawAddress);
  const city = decodeSlug(parts.at(-2) ?? '');
  const street = rawAddress || decodeSlug(parts.at(-1) ?? '');
  return {
    chainId: 'lidl',
    storeId: `lidl:${slugify(retailerStoreId)}`,
    retailerStoreId,
    identifierKind: 'official_url_slug',
    name: `Lidl ${city || street}`,
    address: { street, postalCode: '', city, raw: rawAddress || street },
    phone: '',
    url: absoluteUrl,
    openingHours: [],
    sourceRefs: [{ sourceId: 'lidl-store-seo-pages', sourceUrl, capturedAt }]
  };
}

export function parseLidlOverviewLinks(html: string): { stores: EnumeratedStore[]; cityUrls: string[] } {
  const stores: EnumeratedStore[] = [];
  const cityUrls: string[] = [];
  for (const match of html.matchAll(/href="([^"]*\/s\/sv-SE\/butiker\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const url = absoluteLidlUrl(match[1]);
    const label = stripHtml(match[2]);
    const parts = url.split('/').filter(Boolean);
    if (parts.length > 6) {
      stores.push(normalizeLidlStoreFromUrl(url, label, LIDL_STORES_URL, ''));
    } else {
      cityUrls.push(url);
    }
  }
  return { stores, cityUrls };
}

export function parseLidlCityStores(html: string, sourceUrl: string, capturedAt: string): EnumeratedStore[] {
  const stores: EnumeratedStore[] = [];
  for (const match of html.matchAll(/href="([^"]*\/s\/sv-SE\/butiker\/[^"]+)"[^>]*(?:aria-label="([^"]+)")?/g)) {
    const url = absoluteLidlUrl(match[1]);
    if (url === sourceUrl) continue;
    const rawAddress = /Lidl-butik\s+([^,]+),/.exec(match[2] ?? '')?.[1] ?? '';
    stores.push(normalizeLidlStoreFromUrl(url, rawAddress, sourceUrl, capturedAt));
  }
  return dedupeEnumeratedStores(stores);
}

export function normalizeOsmSupermarket(element: unknown, capturedAt: string): EnumeratedStore | null {
  const record = asRecord(element);
  const tags = asRecord(record.tags);
  const brand = text(tags.brand) || text(tags.operator);
  const name = text(tags.name) || brand;
  const chainId = classifyOsmChain({
    osmType: 'node',
    osmId: 0,
    country: 'SE',
    name,
    brand,
    shop: text(tags.shop) || text(tags.amenity),
    latitude: 0,
    longitude: 0,
    street: '',
    houseNumber: '',
    postcode: '',
    city: '',
    openingHours: '',
    website: '',
    phone: '',
    sourceUrl: OVERPASS_INTERPRETER_URL,
    retrievedAt: capturedAt
  });
  const osmType = text(record.type) as OverpassGroceryStore['osmType'];
  const osmId = numberFrom(record.id);
  if (!chainId || !name || !osmType || osmId === undefined) return null;

  const lat = numberFrom(record.lat) ?? numberFrom(asRecord(record.center).lat);
  const lon = numberFrom(record.lon) ?? numberFrom(asRecord(record.center).lon);
  return {
    chainId,
    storeId: `${chainId}:osm:${osmType}:${osmId}`,
    retailerStoreId: `${osmType}:${osmId}`,
    identifierKind: 'osm_element',
    name,
    address: {
      street: [text(tags['addr:street']), text(tags['addr:housenumber'])].filter(Boolean).join(' '),
      postalCode: text(tags['addr:postcode']),
      city: text(tags['addr:city']),
      raw: ''
    },
    coordinates: lat !== undefined && lon !== undefined ? { latitude: lat, longitude: lon } : undefined,
    phone: text(tags.phone) || text(tags['contact:phone']),
    url: text(tags.website) || text(tags['contact:website']),
    openingHours: text(tags.opening_hours) ? [text(tags.opening_hours)] : [],
    sourceRefs: [{ sourceId: 'osm-overpass-supermarkets', sourceUrl: OVERPASS_INTERPRETER_URL, capturedAt }]
  };
}

export function parseOsmSupermarkets(payload: unknown, capturedAt: string): EnumeratedStore[] {
  return asArray(asRecord(payload).elements)
    .map((element) => normalizeOsmSupermarket(element, capturedAt))
    .filter((store): store is EnumeratedStore => store !== null);
}

export function mergeStoreEnumerations(officialStores: EnumeratedStore[], osmStores: EnumeratedStore[]): EnumeratedStore[] {
  const merged = officialStores.map((store) => ({ ...store, sourceRefs: [...store.sourceRefs] }));
  for (const osmStore of osmStores) {
    const match = merged.find((store) => legacyStoresLikelyMatch(store, osmStore));
    if (!match) {
      merged.push(osmStore);
      continue;
    }
    const refs = new Map(match.sourceRefs.map((ref) => [ref.sourceId, ref]));
    for (const ref of osmStore.sourceRefs) refs.set(ref.sourceId, ref);
    match.sourceRefs = [...refs.values()];
  }
  return dedupeEnumeratedStores(merged);
}

export function validateEnumeratedStores(stores: EnumeratedStore[]): StoreEnumerationValidation {
  const issues: string[] = [];
  const chainIds = [...new Set(stores.map((store) => store.chainId))].sort() as RetailerChainId[];
  for (const chainId of STORE_ENUMERATOR_CHAIN_IDS) {
    if (!chainIds.includes(chainId)) issues.push(`missing_chain:${chainId}`);
  }
  const storeIds = new Set<string>();
  for (const store of stores) {
    if (storeIds.has(store.storeId)) issues.push(`duplicate_store_id:${store.storeId}`);
    storeIds.add(store.storeId);
    if (!store.storeId.startsWith(`${store.chainId}:`)) issues.push(`invalid_store_id:${store.storeId}`);
    if (!store.retailerStoreId) issues.push(`missing_retailer_store_id:${store.storeId}`);
    if (!store.name) issues.push(`missing_name:${store.storeId}`);
    if (store.sourceRefs.length === 0) issues.push(`missing_source_ref:${store.storeId}`);
    for (const ref of store.sourceRefs) {
      if (!ref.sourceUrl.startsWith('https://')) issues.push(`invalid_source_url:${store.storeId}:${ref.sourceId}`);
    }
  }
  return { status: issues.length === 0 ? 'valid' : 'invalid', chainIds, issues };
}

function branchToEnumeratedStore(branch: EnumeratedStoreBranch): EnumeratedStore {
  const citation = legacySourceIdForBranch(branch);
  const addressRaw = [branch.address, branch.postalCode, branch.city].filter(Boolean).join(', ');
  return {
    chainId: branch.chainId,
    storeId: branch.storeId,
    retailerStoreId: branch.sourceStoreId,
    identifierKind: branch.sourceIds.includes('osm_overpass_sweden') && branch.sourceIds.length === 1
      ? 'osm_element'
      : branch.chainId === 'coop' && text(branch.metadata?.ledgerAccountNumber)
        ? 'official_ledger_account'
        : 'official_store_id',
    name: branch.name,
    address: {
      street: branch.address,
      postalCode: branch.postalCode,
      city: branch.city,
      raw: addressRaw
    },
    coordinates: branch.latitude !== undefined && branch.longitude !== undefined
      ? { latitude: branch.latitude, longitude: branch.longitude }
      : undefined,
    phone: branch.phone ?? '',
    url: branch.branchUrl ?? branch.website ?? branch.sourceUrl,
    openingHours: [],
    sourceRefs: [{
      sourceId: citation.sourceId,
      sourceUrl: branch.sourceUrl,
      capturedAt: branch.retrievedAt
    }]
  };
}

function legacySourceIdForBranch(branch: EnumeratedStoreBranch): LegacyStoreEnumeratorSource {
  if (branch.sourceIds.includes('osm_overpass_sweden')) return legacySourceById('osm-overpass-supermarkets');
  if (branch.chainId === 'ica') return legacySourceById('ica-store-locator');
  if (branch.chainId === 'willys') return legacySourceById('willys-store-search');
  if (branch.chainId === 'hemkop') return legacySourceById('hemkop-store-search');
  if (branch.chainId === 'coop') return legacySourceById('coop-store-map');
  if (branch.chainId === 'city_gross') return legacySourceById('city-gross-page-data-stores');
  return legacySourceById('lidl-store-seo-pages');
}

function legacySourceById(sourceId: string): LegacyStoreEnumeratorSource {
  const source = storeEnumeratorSources.find((candidate) => candidate.sourceId === sourceId);
  if (!source) throw new Error(`Unknown legacy store enumerator source: ${sourceId}`);
  return source;
}

function legacyStoresLikelyMatch(a: EnumeratedStore, b: EnumeratedStore): boolean {
  if (a.chainId !== b.chainId) return false;
  if (a.url && b.url && a.url === b.url) return true;
  if (a.coordinates && b.coordinates) {
    return distanceMeters(a.coordinates.latitude, a.coordinates.longitude, b.coordinates.latitude, b.coordinates.longitude) <= 150;
  }
  return normalizeName(a.name) === normalizeName(b.name) && normalizeName(a.address.city) === normalizeName(b.address.city);
}

function dedupeEnumeratedStores(stores: EnumeratedStore[]): EnumeratedStore[] {
  return uniqueBy(stores, (store) => store.storeId);
}

function parseCoordinates(value: string): { latitude: number; longitude: number } | undefined {
  const [latitude, longitude] = value.split(',').map((part) => numberFrom(part));
  return latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function decodeSlug(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resultForChain(chainId: RetailerChainId, stores: EnumeratedStoreBranch[], retrievedAt: string): StoreEnumerationResult {
  return {
    chainId,
    retrievedAt,
    sourceCitations: citationsForResult(stores.length > 0 ? stores : [{
      sourceIds: [OFFICIAL_SOURCE_BY_CHAIN[chainId]]
    }]),
    stores,
    issues: []
  };
}

async function fetchIcaStoreListPayload(fetchImpl = fetch): Promise<unknown> {
  const tokenResponse = await fetchImpl(ICA_PUBLIC_ACCESS_TOKEN_URL, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1'
    }
  });
  if (!tokenResponse.ok) throw new Error(`ICA public access token request failed: ${tokenResponse.status}`);

  const tokenPayload = asRecord(await tokenResponse.json());
  const token = text(tokenPayload.publicAccessToken);
  if (!token) throw new Error('ICA public access token response did not include publicAccessToken');

  return fetchJson(ICA_STORE_LIST_URL, fetchImpl, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1'
    }
  });
}

async function fetchCoopStoreMapPayload(fetchImpl = fetch): Promise<unknown> {
  return fetchJson(COOP_STORE_MAP_URL, fetchImpl, {
    headers: {
      accept: 'application/json',
      'Ocp-Apim-Subscription-Key': COOP_STORE_API_SUBSCRIPTION_KEY,
      'Ocp-Apim-Trace': 'true',
      'user-agent': 'GroceryView/0.1'
    }
  });
}

async function fetchJson(url: string, fetchImpl = fetch, init?: RequestInit): Promise<unknown> {
  const response = await fetchImpl(url, {
    ...init,
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1',
      ...init?.headers
    }
  });
  if (!response.ok) throw new Error(`Store enumerator request failed for ${url}: ${response.status}`);
  return response.json();
}

function mergeOfficialAndOsmBranches(officialStores: EnumeratedStoreBranch[], osmStores: EnumeratedStoreBranch[]): EnumeratedStoreBranch[] {
  const merged = officialStores.map((store) => ({ ...store }));
  const unmatchedOsmStores: EnumeratedStoreBranch[] = [];

  for (const osmStore of osmStores) {
    const match = merged.find((store) => storesLikelyMatch(store, osmStore));
    if (!match) {
      unmatchedOsmStores.push(osmStore);
      continue;
    }

    match.sourceIds = [...new Set([...match.sourceIds, ...osmStore.sourceIds])];
    match.osmReferences = [
      ...(match.osmReferences ?? []),
      ...(osmStore.osmReferences ?? [])
    ];
  }

  return [...merged, ...unmatchedOsmStores];
}

function storesLikelyMatch(a: EnumeratedStoreBranch, b: EnumeratedStoreBranch): boolean {
  if (a.latitude !== undefined && a.longitude !== undefined && b.latitude !== undefined && b.longitude !== undefined) {
    return distanceMeters(a.latitude, a.longitude, b.latitude, b.longitude) <= 150;
  }

  return normalizeName(a.city) === normalizeName(b.city) && normalizeName(a.name).includes(normalizeName(b.name).slice(0, 8));
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(value: number): number {
  return value * Math.PI / 180;
}

function classifyOsmChain(row: OverpassGroceryStore): RetailerChainId | null {
  const haystack = normalizeName(`${row.brand} ${row.name}`);
  if (haystack.includes('city gross')) return 'city_gross';
  if (haystack.includes('hemkop')) return 'hemkop';
  if (haystack.includes('willys')) return 'willys';
  if (haystack.includes('coop')) return 'coop';
  if (haystack.includes('lidl')) return 'lidl';
  if (haystack.includes('ica')) return 'ica';
  return null;
}

function dereferenceNuxtPayload(payload: unknown): unknown {
  if (!Array.isArray(payload)) return payload;
  return dereferenceNuxtValue(payload, payload[0], true, new Set());
}

function dereferenceNuxtValue(payload: unknown[], value: unknown, fromPayloadSlot: boolean, seen: Set<number>): unknown {
  if (typeof value === 'number' && !fromPayloadSlot && Number.isInteger(value) && value >= 0 && value < payload.length) {
    if (seen.has(value)) return undefined;
    const nextSeen = new Set(seen);
    nextSeen.add(value);
    return dereferenceNuxtValue(payload, payload[value], true, nextSeen);
  }
  if (Array.isArray(value)) {
    if (value[0] === 'ShallowReactive' && typeof value[1] === 'number') {
      return dereferenceNuxtValue(payload, value[1], false, seen);
    }
    return value.map((item) => dereferenceNuxtValue(payload, item, false, seen));
  }
  if (isRecordLike(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, dereferenceNuxtValue(payload, item, false, seen)]));
  }
  return value;
}

function visit(value: unknown, callback: (value: unknown) => void): void {
  callback(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
  } else if (isRecordLike(value)) {
    for (const item of Object.values(value)) visit(item, callback);
  }
}

function lidlPayloadUrlForPage(pageUrl: string): string {
  const url = pageUrl.startsWith('https://') ? pageUrl : absoluteLidlUrl(pageUrl);
  return `${url.replace(/\/?$/, '/')}_payload.json?bid_26_9_15`;
}

function absoluteLidlUrl(url: string): string {
  return url.startsWith('https://') ? url : `https://www.lidl.se${url}`;
}

function citationsForResult(items: Array<{ sourceIds: StoreEnumeratorSourceId[] }>): StoreEnumeratorSourceCitation[] {
  const sourceIds = new Set(items.flatMap((item) => item.sourceIds));
  return storeEnumeratorSourceCitations.filter((citation) => sourceIds.has(citation.sourceId));
}

function sourceCitationById(sourceId: StoreEnumeratorSourceId): StoreEnumeratorSourceCitation {
  const citation = storeEnumeratorSourceCitations.find((candidate) => candidate.sourceId === sourceId);
  if (!citation) throw new Error(`Unknown store enumerator source citation: ${sourceId}`);
  return citation;
}

function compactBranch(branch: EnumeratedStoreBranch): EnumeratedStoreBranch {
  return Object.fromEntries(Object.entries(branch).filter(([, value]) => value !== undefined)) as EnumeratedStoreBranch;
}

function isBranch(value: EnumeratedStoreBranch | null): value is EnumeratedStoreBranch {
  return value !== null;
}

function canonicalStoreId(chainId: RetailerChainId, rawStoreId: string): string {
  return `${chainId}:${slugify(rawStoreId)}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeName(value: string): string {
  return slugify(value).replace(/-/g, ' ');
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecordLike(value) ? value : {};
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function numberFrom(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.').trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function bool(value: unknown): boolean {
  return value === true;
}
