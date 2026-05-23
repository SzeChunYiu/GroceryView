// @ts-nocheck
export type StoreEnumeratorChainId = 'ica' | 'willys' | 'coop' | 'hemkop' | 'lidl' | 'city_gross';
export type StoreEnumeratorSourceKind = 'official_store_locator' | 'osm_overpass';
export type StoreIdentifierKind = 'official_store_id' | 'official_ledger_account' | 'official_url_slug' | 'osm_element';
export type StoreEnumeratorSource = {
    sourceId: string;
    chainId?: StoreEnumeratorChainId;
    kind: StoreEnumeratorSourceKind;
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
export type StoreEnumerationValidation = {
    status: 'valid' | 'invalid';
    chainIds: StoreEnumeratorChainId[];
    storeCount: number;
    issues: string[];
};
export type FetchStoreEnumeratorStoresOptions = {
    fetchImpl?: typeof fetch;
    chains?: readonly StoreEnumeratorChainId[];
    includeOsm?: boolean;
    retrievedAt?: string;
};
type IcaInitialStore = {
    accountNumber?: unknown;
    storeName?: unknown;
    address?: {
        street?: unknown;
        postalCode?: unknown;
        city?: unknown;
        coordinates?: {
            coordinateX?: unknown;
            coordinateY?: unknown;
        };
    };
    lat?: unknown;
    lng?: unknown;
    geoPosition?: {
        lat?: unknown;
        lng?: unknown;
    };
    bhsUrl?: unknown;
    todayOpeningHours?: {
        label?: unknown;
        opens?: unknown;
        closes?: unknown;
        isClosed?: unknown;
    };
    tomorrowOpeningHours?: {
        label?: unknown;
        opens?: unknown;
        closes?: unknown;
        isClosed?: unknown;
    };
};
type AxfoodSearchStore = {
    storeId?: unknown;
    displayName?: unknown;
    name?: unknown;
    address?: {
        line1?: unknown;
        postalCode?: unknown;
        town?: unknown;
        phoneNumber?: unknown;
    };
    geoPoint?: {
        latitude?: unknown;
        longitude?: unknown;
    };
    openingHours?: unknown;
};
type AxfoodStoreSearchResponse = {
    results?: AxfoodSearchStore[];
};
type CoopStoreMapRow = {
    storeId?: unknown;
    ledgerAccountNumber?: unknown;
    name?: unknown;
    address?: unknown;
    phone?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    url?: unknown;
    city?: unknown;
    postalCode?: unknown;
    openingHoursToday?: unknown;
};
type CityGrossPageDataRow = {
    data?: {
        id?: unknown;
        siteId?: unknown;
        name?: unknown;
        storeName?: unknown;
        url?: unknown;
        storeLocation?: {
            coordinates?: unknown;
        };
        contactInformation?: {
            phone?: unknown;
        };
        openingHours?: Record<string, unknown>;
    };
};
type OverpassElement = {
    type?: unknown;
    id?: unknown;
    lat?: unknown;
    lon?: unknown;
    center?: {
        lat?: unknown;
        lon?: unknown;
    };
    tags?: Record<string, unknown>;
};
type OverpassResponse = {
    elements?: OverpassElement[];
};

export type CoopStoreServiceAccess = {
    storeApiUrl: string;
    storeApiSubscriptionKey: string;
};

export const ICA_STORES_URL = 'https://www.ica.se/butiker/';
export const WILLYS_STORE_SEARCH_URL = 'https://www.willys.se/axfood/rest/search/store';
export const HEMKOP_STORE_SEARCH_URL = 'https://www.hemkop.se/axfood/rest/search/store';
export const COOP_STORES_PAGE_URL = 'https://www.coop.se/butiker-erbjudanden/';
export const COOP_STORE_MAP_PATH = 'stores/map';
export const CITY_GROSS_STORES_URL = 'https://www.citygross.se/api/v1/PageData/stores';
export const LIDL_STORES_URL = 'https://www.lidl.se/s/sv-SE/butiker/';
export const STORE_ENUMERATOR_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
export const STORE_ENUMERATOR_OVERPASS_QUERY = `[out:json][timeout:60];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
  node["shop"="supermarket"]["brand"~"^(ICA|ICA Nära|ICA Supermarket|Maxi ICA Stormarknad|Willys|Coop|Hemköp|Lidl|City Gross)$",i](area.searchArea);
  way["shop"="supermarket"]["brand"~"^(ICA|ICA Nära|ICA Supermarket|Maxi ICA Stormarknad|Willys|Coop|Hemköp|Lidl|City Gross)$",i](area.searchArea);
  relation["shop"="supermarket"]["brand"~"^(ICA|ICA Nära|ICA Supermarket|Maxi ICA Stormarknad|Willys|Coop|Hemköp|Lidl|City Gross)$",i](area.searchArea);
  node["amenity"="supermarket"]["brand"~"^(ICA|ICA Nära|ICA Supermarket|Maxi ICA Stormarknad|Willys|Coop|Hemköp|Lidl|City Gross)$",i](area.searchArea);
  way["amenity"="supermarket"]["brand"~"^(ICA|ICA Nära|ICA Supermarket|Maxi ICA Stormarknad|Willys|Coop|Hemköp|Lidl|City Gross)$",i](area.searchArea);
  relation["amenity"="supermarket"]["brand"~"^(ICA|ICA Nära|ICA Supermarket|Maxi ICA Stormarknad|Willys|Coop|Hemköp|Lidl|City Gross)$",i](area.searchArea);
);
out center tags;`;
export const storeEnumeratorSources = [
    { sourceId: 'ica-store-locator', chainId: 'ica', kind: 'official_store_locator', sourceUrl: ICA_STORES_URL, citation: 'ICA public store finder, all stores page.' },
    { sourceId: 'willys-store-search', chainId: 'willys', kind: 'official_store_locator', sourceUrl: WILLYS_STORE_SEARCH_URL, citation: 'Willys public store search endpoint used by the Willys store list page.' },
    { sourceId: 'hemkop-store-search', chainId: 'hemkop', kind: 'official_store_locator', sourceUrl: HEMKOP_STORE_SEARCH_URL, citation: 'Hemköp public store search endpoint used by the Hemköp butik-sök page.' },
    { sourceId: 'coop-store-map', chainId: 'coop', kind: 'official_store_locator', sourceUrl: COOP_STORES_PAGE_URL, citation: 'Coop public stores page plus its exposed public store map API settings.' },
    { sourceId: 'city-gross-page-data-stores', chainId: 'city_gross', kind: 'official_store_locator', sourceUrl: CITY_GROSS_STORES_URL, citation: 'City Gross public PageData stores endpoint used by the stores page.' },
    { sourceId: 'lidl-store-seo-pages', chainId: 'lidl', kind: 'official_store_locator', sourceUrl: LIDL_STORES_URL, citation: 'Lidl public store SEO overview and city pages.' },
    { sourceId: 'osm-overpass-supermarkets', kind: 'osm_overpass', sourceUrl: STORE_ENUMERATOR_OVERPASS_URL, citation: 'OpenStreetMap data via Overpass, filtered to Swedish supermarkets for supported chains.' }
];
export const STORE_ENUMERATOR_DEFAULT_CHAINS = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
export function fetchStoreEnumeratorStores(options?: FetchStoreEnumeratorStoresOptions): Promise<EnumeratedStore[]>;
export async function fetchStoreEnumeratorStores(options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const chains = options.chains ?? STORE_ENUMERATOR_DEFAULT_CHAINS;
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const officialStores = [];
    for (const chainId of chains)
        officialStores.push(...await fetchStoreEnumeratorChainStores(chainId, { fetchImpl, retrievedAt }));
    if (options.includeOsm === false)
        return dedupeEnumeratedStores(officialStores);
    const selectedChains = new Set(chains);
    const osmStores = (await fetchOsmEnumeratedSupermarkets({ fetchImpl, retrievedAt })).filter((store) => selectedChains.has(store.chainId));
    return mergeStoreEnumerations(officialStores, osmStores);
}
export function fetchStoreEnumeratorChainStores(chainId: StoreEnumeratorChainId, options?: {
    fetchImpl?: typeof fetch;
    retrievedAt?: string;
}): Promise<EnumeratedStore[]>;
export async function fetchStoreEnumeratorChainStores(chainId, options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    if (chainId === 'ica')
        return fetchIcaEnumeratedStores({ fetchImpl, retrievedAt });
    if (chainId === 'willys' || chainId === 'hemkop')
        return fetchAxfoodEnumeratedStores(chainId, { fetchImpl, retrievedAt });
    if (chainId === 'coop')
        return fetchCoopEnumeratedStores({ fetchImpl, retrievedAt });
    if (chainId === 'city_gross')
        return fetchCityGrossEnumeratedStores({ fetchImpl, retrievedAt });
    return fetchLidlEnumeratedStores({ fetchImpl, retrievedAt });
}
export function fetchIcaEnumeratedStores(options?: {
    fetchImpl?: typeof fetch;
    retrievedAt?: string;
}): Promise<EnumeratedStore[]>;
export async function fetchIcaEnumeratedStores(options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const response = await fetchImpl(ICA_STORES_URL, { headers: defaultHeaders('text/html') });
    if (!response.ok)
        throw new Error(`ICA store locator request failed: ${response.status}`);
    return parseIcaStoresHtml(await response.text(), retrievedAt);
}
export function fetchAxfoodEnumeratedStores(chainId: Extract<StoreEnumeratorChainId, 'willys' | 'hemkop'>, options?: {
    fetchImpl?: typeof fetch;
    retrievedAt?: string;
}): Promise<EnumeratedStore[]>;
export async function fetchAxfoodEnumeratedStores(chainId, options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const sourceUrl = buildAxfoodStoreSearchUrl(chainId);
    const response = await fetchImpl(sourceUrl, { headers: defaultHeaders('application/json') });
    if (!response.ok)
        throw new Error(`${chainId} store search request failed: ${response.status}`);
    return parseAxfoodStoreSearch(chainId, await response.json(), sourceUrl, retrievedAt);
}
export function fetchCoopEnumeratedStores(options?: {
    fetchImpl?: typeof fetch;
    retrievedAt?: string;
}): Promise<EnumeratedStore[]>;
export async function fetchCoopEnumeratedStores(options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const serviceAccess = await fetchCoopStoreServiceAccess(fetchImpl);
    const sourceUrl = buildCoopStoreMapUrl(serviceAccess.storeApiUrl);
    const response = await fetchImpl(sourceUrl, {
        headers: { ...defaultHeaders('application/json'), 'ocp-apim-subscription-key': serviceAccess.storeApiSubscriptionKey, 'ocp-apim-trace': 'true' }
    });
    if (!response.ok)
        throw new Error(`Coop store map request failed: ${response.status}`);
    return parseCoopStoreMap(await response.json(), sourceUrl, retrievedAt);
}
export function fetchCityGrossEnumeratedStores(options?: {
    fetchImpl?: typeof fetch;
    retrievedAt?: string;
}): Promise<EnumeratedStore[]>;
export async function fetchCityGrossEnumeratedStores(options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const response = await fetchImpl(CITY_GROSS_STORES_URL, { headers: defaultHeaders('application/json') });
    if (!response.ok)
        throw new Error(`City Gross stores request failed: ${response.status}`);
    return parseCityGrossStores(await response.json(), CITY_GROSS_STORES_URL, retrievedAt);
}
export function fetchLidlEnumeratedStores(options?: {
    fetchImpl?: typeof fetch;
    retrievedAt?: string;
}): Promise<EnumeratedStore[]>;
export async function fetchLidlEnumeratedStores(options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const response = await fetchImpl(LIDL_STORES_URL, { headers: defaultHeaders('text/html') });
    if (!response.ok)
        throw new Error(`Lidl stores overview request failed: ${response.status}`);
    const overview = parseLidlOverviewLinks(await response.text(), LIDL_STORES_URL);
    const stores = [...overview.stores];
    for (const cityUrl of overview.cityUrls) {
        const cityResponse = await fetchImpl(cityUrl, { headers: defaultHeaders('text/html') });
        if (!cityResponse.ok)
            throw new Error(`Lidl stores city page request failed for ${cityUrl}: ${cityResponse.status}`);
        stores.push(...parseLidlCityStores(await cityResponse.text(), cityUrl, retrievedAt));
    }
    return dedupeEnumeratedStores(stores.map((store) => withRetrievedAt(store, retrievedAt)));
}
export function fetchOsmEnumeratedSupermarkets(options?: {
    fetchImpl?: typeof fetch;
    retrievedAt?: string;
}): Promise<EnumeratedStore[]>;
export async function fetchOsmEnumeratedSupermarkets(options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const response = await fetchImpl(STORE_ENUMERATOR_OVERPASS_URL, {
        method: 'POST',
        headers: defaultHeaders('application/json'),
        body: new URLSearchParams({ data: STORE_ENUMERATOR_OVERPASS_QUERY })
    });
    if (!response.ok)
        throw new Error(`Overpass store enumerator request failed: ${response.status}`);
    return parseOsmSupermarkets(await response.json(), retrievedAt);
}
export function parseIcaStoresHtml(html: string, retrievedAt: string): EnumeratedStore[];
export function parseIcaStoresHtml(html, retrievedAt) {
    const initialRows = parseIcaInitialStores(html, retrievedAt);
    if (initialRows.length > 0)
        return initialRows;
    const rows = [];
    const seen = new Set();
    const cardPattern = /ids-store-card__short-info[\s\S]*?<span class="ids-store-card__store-name">([\s\S]*?)<\/span>[\s\S]*?<span class="ids-store-card__store-address">([\s\S]*?)<\/span>[\s\S]*?href="(https:\/\/www\.ica\.se\/butiker\/[^"]+-(\d+)\/)"/g;
    for (const match of html.matchAll(cardPattern)) {
        const storeId = match[4];
        if (seen.has(storeId))
            continue;
        seen.add(storeId);
        const rawAddress = decodeHtml(stripTags(match[2]));
        rows.push({
            chainId: 'ica',
            storeId: `ica:${storeId}`,
            retailerStoreId: storeId,
            identifierKind: 'official_store_id',
            name: decodeHtml(stripTags(match[1])),
            address: addressFromRaw(rawAddress),
            phone: '',
            url: match[3],
            openingHours: [],
            sourceRefs: [sourceRef('ica-store-locator', ICA_STORES_URL, retrievedAt)]
        });
    }
    return rows;
}
export function parseIcaInitialStores(html: string, retrievedAt: string): EnumeratedStore[];
export function parseIcaInitialStores(html, retrievedAt) {
    const slimStores = jsonArrayAfter(html, '"slimStores"');
    const cardStores = jsonArrayAfter(html, '"storeCards"');
    const rows = slimStores.length > 0 ? slimStores : cardStores;
    return dedupeEnumeratedStores(rows
        .map((row) => normalizeIcaInitialStore(row, ICA_STORES_URL, retrievedAt))
        .filter((row) => row !== null));
}
export function normalizeIcaInitialStore(row: IcaInitialStore, sourceUrl: string, retrievedAt: string): EnumeratedStore | null;
export function normalizeIcaInitialStore(row, sourceUrl, retrievedAt) {
    const retailerStoreId = text(row.accountNumber) || officialIcaIdFromUrl(text(row.bhsUrl));
    const name = text(row.storeName);
    if (!retailerStoreId || !name)
        return null;
    const street = text(row.address?.street);
    const postalCode = text(row.address?.postalCode);
    const city = text(row.address?.city);
    const latitude = numberish(row.geoPosition?.lat) ?? numberish(row.lat) ?? numberish(row.address?.coordinates?.coordinateX);
    const longitude = numberish(row.geoPosition?.lng) ?? numberish(row.lng) ?? numberish(row.address?.coordinates?.coordinateY);
    return {
        chainId: 'ica',
        storeId: `ica:${retailerStoreId}`,
        retailerStoreId,
        identifierKind: 'official_store_id',
        name,
        address: { street, postalCode, city, raw: [street, postalCode, city].filter(Boolean).join(', ') },
        coordinates: latitude !== null && longitude !== null ? { latitude, longitude } : undefined,
        phone: '',
        url: text(row.bhsUrl),
        openingHours: [icaOpeningHoursText(row.todayOpeningHours), icaOpeningHoursText(row.tomorrowOpeningHours)].filter(Boolean),
        sourceRefs: [sourceRef('ica-store-locator', sourceUrl, retrievedAt)]
    };
}
export function buildAxfoodStoreSearchUrl(chainId: Extract<StoreEnumeratorChainId, 'willys' | 'hemkop'>): string;
export function buildAxfoodStoreSearchUrl(chainId) {
    const url = new URL(chainId === 'willys' ? WILLYS_STORE_SEARCH_URL : HEMKOP_STORE_SEARCH_URL);
    url.searchParams.set('q', '');
    url.searchParams.set('sort', 'display-name-asc');
    url.searchParams.set('size', '5000');
    return url.toString();
}
export function parseAxfoodStoreSearch(chainId: Extract<StoreEnumeratorChainId, 'willys' | 'hemkop'>, payload: AxfoodStoreSearchResponse, sourceUrl: string, retrievedAt: string): EnumeratedStore[];
export function parseAxfoodStoreSearch(chainId, payload, sourceUrl, retrievedAt) {
    return dedupeEnumeratedStores((payload.results ?? [])
        .map((row) => normalizeAxfoodStore(chainId, row, sourceUrl, retrievedAt))
        .filter((row) => row !== null));
}
export function normalizeAxfoodStore(chainId: Extract<StoreEnumeratorChainId, 'willys' | 'hemkop'>, row: AxfoodSearchStore, sourceUrl: string, retrievedAt: string): EnumeratedStore | null;
export function normalizeAxfoodStore(chainId, row, sourceUrl, retrievedAt) {
    const retailerStoreId = text(row.storeId);
    const name = text(row.displayName) || text(row.name);
    if (!retailerStoreId || !name)
        return null;
    const street = text(row.address?.line1);
    const postalCode = text(row.address?.postalCode);
    const city = text(row.address?.town);
    const latitude = numberOrNull(row.geoPoint?.latitude);
    const longitude = numberOrNull(row.geoPoint?.longitude);
    return {
        chainId,
        storeId: `${chainId}:${retailerStoreId}`,
        retailerStoreId,
        identifierKind: 'official_store_id',
        name,
        address: { street, postalCode, city, raw: [street, postalCode, city].filter(Boolean).join(', ') },
        coordinates: latitude !== null && longitude !== null ? { latitude, longitude } : undefined,
        phone: text(row.address?.phoneNumber),
        url: chainId === 'willys' ? `https://www.willys.se/butik/${retailerStoreId}` : `https://www.hemkop.se/butik/${retailerStoreId}`,
        openingHours: stringArray(row.openingHours),
        sourceRefs: [sourceRef(`${chainId}-store-search`, sourceUrl, retrievedAt)]
    };
}
export function fetchCoopStoreServiceAccess(fetchImpl?: typeof fetch): Promise<CoopStoreServiceAccess>;
export async function fetchCoopStoreServiceAccess(fetchImpl = fetch) {
    const response = await fetchImpl(COOP_STORES_PAGE_URL, { headers: defaultHeaders('text/html') });
    if (!response.ok)
        throw new Error(`Coop stores page request failed: ${response.status}`);
    return parseCoopStoreServiceAccess(await response.text());
}
export function parseCoopStoreServiceAccess(html: string): CoopStoreServiceAccess;
export function parseCoopStoreServiceAccess(html) {
    const storeApiUrl = stringSetting(html, 'storeApiUrl');
    const storeApiSubscriptionKey = stringSetting(html, 'storeApiSubscriptionKey');
    if (!storeApiUrl || !storeApiSubscriptionKey)
        throw new Error('Coop stores page did not expose public store API settings');
    return { storeApiUrl, storeApiSubscriptionKey };
}
export function buildCoopStoreMapUrl(storeApiUrl: string): string;
export function buildCoopStoreMapUrl(storeApiUrl) {
    const url = new URL(COOP_STORE_MAP_PATH, storeApiUrl.endsWith('/') ? storeApiUrl : `${storeApiUrl}/`);
    url.searchParams.set('conceptIds', '12,6,95');
    url.searchParams.set('invertFilter', 'true');
    url.searchParams.set('api-version', 'v2');
    return url.toString();
}
export function parseCoopStoreMap(rows: CoopStoreMapRow[], sourceUrl: string, retrievedAt: string): EnumeratedStore[];
export function parseCoopStoreMap(rows, sourceUrl, retrievedAt) {
    return dedupeEnumeratedStores(rows.map((row) => normalizeCoopEnumeratedStore(row, sourceUrl, retrievedAt)).filter((row) => row !== null));
}
export function normalizeCoopEnumeratedStore(row: CoopStoreMapRow, sourceUrl: string, retrievedAt: string): EnumeratedStore | null;
export function normalizeCoopEnumeratedStore(row, sourceUrl, retrievedAt) {
    const retailerStoreId = text(row.storeId) || text(row.ledgerAccountNumber);
    const name = text(row.name);
    if (!retailerStoreId || !name)
        return null;
    const street = text(row.address);
    const postalCode = text(row.postalCode);
    const city = text(row.city);
    const latitude = numberOrNull(row.latitude);
    const longitude = numberOrNull(row.longitude);
    return {
        chainId: 'coop',
        storeId: `coop:${retailerStoreId}`,
        retailerStoreId,
        identifierKind: text(row.storeId) ? 'official_store_id' : 'official_ledger_account',
        name,
        address: { street, postalCode, city, raw: [street, postalCode, city].filter(Boolean).join(', ') },
        coordinates: latitude !== null && longitude !== null ? { latitude, longitude } : undefined,
        phone: text(row.phone),
        url: absoluteUrl(text(row.url), 'https://www.coop.se'),
        openingHours: text(row.openingHoursToday) ? [text(row.openingHoursToday)] : [],
        sourceRefs: [sourceRef('coop-store-map', sourceUrl, retrievedAt)]
    };
}
export function parseCityGrossStores(rows: CityGrossPageDataRow[], sourceUrl: string, retrievedAt: string): EnumeratedStore[];
export function parseCityGrossStores(rows, sourceUrl, retrievedAt) {
    return dedupeEnumeratedStores(rows.map((row) => normalizeCityGrossEnumeratedStore(row, sourceUrl, retrievedAt)).filter((row) => row !== null));
}
export function normalizeCityGrossEnumeratedStore(row: CityGrossPageDataRow, sourceUrl: string, retrievedAt: string): EnumeratedStore | null;
export function normalizeCityGrossEnumeratedStore(row, sourceUrl, retrievedAt) {
    const data = row.data;
    const retailerStoreId = text(data?.siteId) || text(data?.id);
    const name = text(data?.storeName) || text(data?.name);
    if (!retailerStoreId || !name)
        return null;
    const [latitude, longitude] = text(data?.storeLocation?.coordinates).split(',').map((value) => numberOrNull(Number(value.trim())));
    return {
        chainId: 'city_gross',
        storeId: `city_gross:${retailerStoreId}`,
        retailerStoreId,
        identifierKind: 'official_store_id',
        name: `City Gross ${name}`,
        address: { street: '', postalCode: '', city: name, raw: name },
        coordinates: latitude !== null && longitude !== null ? { latitude, longitude } : undefined,
        phone: text(data?.contactInformation?.phone),
        url: absoluteUrl(text(data?.url), 'https://www.citygross.se'),
        openingHours: openingHoursFromCityGross(data?.openingHours),
        sourceRefs: [sourceRef('city-gross-page-data-stores', sourceUrl, retrievedAt)]
    };
}
export function parseLidlOverviewLinks(html: string, sourceUrl?: string): { stores: EnumeratedStore[]; cityUrls: string[] };
export function parseLidlOverviewLinks(html, sourceUrl = LIDL_STORES_URL) {
    const stores = [];
    const cityUrls = [];
    const seenStoreUrls = new Set();
    const seenCityUrls = new Set();
    for (const anchor of anchors(html)) {
        const href = attribute(anchor, 'href');
        if (!href.includes('/s/sv-SE/butiker/'))
            continue;
        const url = absoluteUrl(href, 'https://www.lidl.se');
        const pathParts = new URL(url).pathname.split('/').filter(Boolean);
        if (pathParts.length >= 5) {
            if (seenStoreUrls.has(url))
                continue;
            seenStoreUrls.add(url);
            stores.push(normalizeLidlStoreFromUrl(url, anchorText(anchor), sourceUrl, ''));
        }
        else if (!seenCityUrls.has(url)) {
            seenCityUrls.add(url);
            cityUrls.push(url);
        }
    }
    return { stores, cityUrls };
}
export function parseLidlCityStores(html: string, sourceUrl: string, retrievedAt: string): EnumeratedStore[];
export function parseLidlCityStores(html, sourceUrl, retrievedAt) {
    const rows = [];
    const seen = new Set();
    for (const anchor of anchors(html)) {
        const href = attribute(anchor, 'href');
        const ariaLabel = attribute(anchor, 'aria-label');
        if (!href.includes('/s/sv-SE/butiker/') || !ariaLabel.startsWith('Lidl-butik '))
            continue;
        const url = absoluteUrl(href, 'https://www.lidl.se');
        if (seen.has(url))
            continue;
        seen.add(url);
        rows.push(normalizeLidlStoreFromUrl(url, ariaLabel.replace(/^Lidl-butik\s+/, ''), sourceUrl, retrievedAt));
    }
    return rows;
}
export function normalizeLidlStoreFromUrl(url: string, label: string, sourceUrl: string, retrievedAt: string): EnumeratedStore;
export function normalizeLidlStoreFromUrl(url, label, sourceUrl, retrievedAt) {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const citySlug = parts[3] ?? '';
    const addressSlug = parts[4] ?? '';
    const retailerStoreId = `${citySlug}/${addressSlug}`;
    const labelAddress = label.includes(',') ? label : `${slugToTitle(addressSlug)}, ${slugToTitle(citySlug)}`;
    const address = addressFromRaw(labelAddress);
    return {
        chainId: 'lidl',
        storeId: `lidl:${retailerStoreId}`,
        retailerStoreId,
        identifierKind: 'official_url_slug',
        name: `Lidl ${address.raw || slugToTitle(retailerStoreId)}`.trim(),
        address,
        phone: '',
        url,
        openingHours: [],
        sourceRefs: [sourceRef('lidl-store-seo-pages', sourceUrl, retrievedAt)]
    };
}
export function parseOsmSupermarkets(payload: OverpassResponse, retrievedAt: string): EnumeratedStore[];
export function parseOsmSupermarkets(payload, retrievedAt) {
    return dedupeEnumeratedStores((payload.elements ?? []).map((element) => normalizeOsmSupermarket(element, retrievedAt)).filter((row) => row !== null));
}
export function normalizeOsmSupermarket(element: OverpassElement, retrievedAt: string): EnumeratedStore | null;
export function normalizeOsmSupermarket(element, retrievedAt) {
    const osmType = text(element.type);
    const osmId = numberOrNull(element.id);
    const tags = element.tags ?? {};
    const chainId = chainFromOsmTags(tags);
    const name = text(tags.name) || text(tags.brand) || text(tags.operator);
    const latitude = numberOrNull(element.lat) ?? numberOrNull(element.center?.lat);
    const longitude = numberOrNull(element.lon) ?? numberOrNull(element.center?.lon);
    if (!chainId || !osmType || osmId === null || !name)
        return null;
    const street = text(tags['addr:street']);
    const houseNumber = text(tags['addr:housenumber']);
    const postalCode = text(tags['addr:postcode']);
    const city = text(tags['addr:city']);
    return {
        chainId,
        storeId: `${chainId}:osm:${osmType}/${osmId}`,
        retailerStoreId: `${osmType}/${osmId}`,
        identifierKind: 'osm_element',
        name,
        address: { street: [street, houseNumber].filter(Boolean).join(' '), postalCode, city, raw: [street, houseNumber, postalCode, city].filter(Boolean).join(', ') },
        coordinates: latitude !== null && longitude !== null ? { latitude, longitude } : undefined,
        phone: text(tags.phone) || text(tags['contact:phone']),
        url: text(tags.website) || text(tags['contact:website']),
        openingHours: text(tags.opening_hours) ? [text(tags.opening_hours)] : [],
        sourceRefs: [sourceRef('osm-overpass-supermarkets', STORE_ENUMERATOR_OVERPASS_URL, retrievedAt)]
    };
}
export function mergeStoreEnumerations(officialStores: EnumeratedStore[], osmStores: EnumeratedStore[]): EnumeratedStore[];
export function mergeStoreEnumerations(officialStores, osmStores) {
    const rows = dedupeEnumeratedStores(officialStores);
    const byChainAndOfficialId = new Map(rows.map((store) => [`${store.chainId}:${store.retailerStoreId}`, store]));
    const byChainAndNameCity = new Map(rows.map((store) => [nameCityKey(store), store]));
    const output = [...rows];
    for (const osmStore of osmStores) {
        const officialIdMatch = officialIdFromOsm(osmStore);
        const existing = officialIdMatch ? byChainAndOfficialId.get(`${osmStore.chainId}:${officialIdMatch}`) : byChainAndNameCity.get(nameCityKey(osmStore));
        if (existing) {
            existing.sourceRefs = mergeSourceRefs(existing.sourceRefs, osmStore.sourceRefs);
            if (!existing.coordinates && osmStore.coordinates)
                existing.coordinates = osmStore.coordinates;
        }
        else {
            output.push(osmStore);
        }
    }
    return dedupeEnumeratedStores(output);
}
export function validateEnumeratedStores(stores: EnumeratedStore[]): StoreEnumerationValidation;
export function validateEnumeratedStores(stores) {
    const issues = [];
    const requiredChains = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
    const chainIds = [...new Set(stores.map((store) => store.chainId))].sort();
    const ids = new Set();
    for (const chainId of requiredChains)
        if (!chainIds.includes(chainId))
            issues.push(`missing_chain:${chainId}`);
    for (const store of stores) {
        if (ids.has(store.storeId))
            issues.push(`duplicate_store_id:${store.storeId}`);
        ids.add(store.storeId);
        if (!store.retailerStoreId.trim())
            issues.push(`missing_retailer_store_id:${store.storeId}`);
        if (!store.name.trim())
            issues.push(`missing_name:${store.storeId}`);
        if (!store.sourceRefs.length)
            issues.push(`missing_source_ref:${store.storeId}`);
        for (const ref of store.sourceRefs) {
            if (!ref.sourceUrl.startsWith('https://'))
                issues.push(`invalid_source_url:${store.storeId}`);
            if (Number.isNaN(Date.parse(ref.capturedAt)))
                issues.push(`invalid_captured_at:${store.storeId}`);
        }
    }
    return { status: issues.length === 0 ? 'valid' : 'invalid', chainIds, storeCount: stores.length, issues };
}
function dedupeEnumeratedStores(stores) {
    const seen = new Map();
    for (const store of stores) {
        const existing = seen.get(store.storeId);
        if (existing) {
            existing.sourceRefs = mergeSourceRefs(existing.sourceRefs, store.sourceRefs);
        }
        else {
            seen.set(store.storeId, { ...store, sourceRefs: [...store.sourceRefs] });
        }
    }
    return [...seen.values()];
}
function mergeSourceRefs(left, right) {
    const refs = new Map();
    for (const ref of [...left, ...right])
        refs.set(`${ref.sourceId}:${ref.sourceUrl}`, ref);
    return [...refs.values()];
}
function withRetrievedAt(store, retrievedAt) {
    return { ...store, sourceRefs: store.sourceRefs.map((ref) => ({ ...ref, capturedAt: ref.capturedAt || retrievedAt })) };
}
function sourceRef(sourceId, sourceUrl, capturedAt) {
    return { sourceId, sourceUrl, capturedAt };
}
function defaultHeaders(accept) {
    return { accept, 'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)' };
}
function jsonArrayAfter(html, marker) {
    const markerIndex = html.indexOf(marker);
    if (markerIndex < 0)
        return [];
    const start = html.indexOf('[', markerIndex);
    if (start < 0)
        return [];
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < html.length; index += 1) {
        const char = html[index];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (char === '\\' && inString) {
            escaped = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (inString)
            continue;
        if (char === '[')
            depth += 1;
        if (char === ']') {
            depth -= 1;
            if (depth === 0) {
                try {
                    const parsed = JSON.parse(html.slice(start, index + 1));
                    return Array.isArray(parsed) ? parsed : [];
                }
                catch {
                    return [];
                }
            }
        }
    }
    return [];
}
function stringSetting(html, key) {
    const pattern = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`);
    return decodeJsonString(html.match(pattern)?.[1] ?? '');
}
function decodeJsonString(value) {
    if (!value)
        return '';
    try {
        return JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
    }
    catch {
        return value;
    }
}
function anchors(html) {
    return [...html.matchAll(/<a\b[\s\S]*?<\/a>/gi)].map((match) => match[0]);
}
function attribute(tag, name) {
    const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
    return decodeHtml(match?.[1] ?? '');
}
function anchorText(anchor) {
    return stripTags(anchor).trim();
}
function stripTags(value) {
    return value.replace(/<[^>]+>/g, '');
}
function decodeHtml(value) {
    return value
        .replace(/\\u002F/g, '/')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&quot;/g, '"')
        .replace(/&#34;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&auml;/g, 'ä')
        .replace(/&aring;/g, 'å')
        .replace(/&ouml;/g, 'ö')
        .replace(/&Auml;/g, 'Ä')
        .replace(/&Aring;/g, 'Å')
        .replace(/&Ouml;/g, 'Ö')
        .trim();
}
function addressFromRaw(raw) {
    const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
    const street = parts[0] ?? '';
    const cityPart = parts[parts.length - 1] ?? '';
    const postcodeMatch = cityPart.match(/^(\d{3}\s?\d{2})\s+(.+)$/);
    return { street, postalCode: postcodeMatch?.[1]?.replace(/\s/g, '') ?? '', city: postcodeMatch?.[2] ?? (parts.length > 1 ? cityPart : ''), raw };
}
function absoluteUrl(value, baseUrl) {
    return value ? new URL(value, baseUrl).toString() : '';
}
function slugToTitle(value) {
    return value.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/aa/g, 'å').split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
function openingHoursFromCityGross(value) {
    if (!value)
        return [];
    return Object.entries(value)
        .filter(([key, entry]) => key !== 'holidays' && typeof entry === 'object' && entry !== null)
        .map(([key, entry]) => {
        const record = entry;
        const opens = text(record.opens);
        const closes = text(record.closes);
        return opens && closes ? `${key} ${opens}-${closes}` : '';
    })
        .filter(Boolean);
}
function icaOpeningHoursText(value) {
    if (!value)
        return '';
    const label = text(value.label);
    if (value.isClosed === true)
        return label ? `${label} closed` : 'closed';
    const opens = text(value.opens);
    const closes = text(value.closes);
    return [label, opens && closes ? `${opens}-${closes}` : ''].filter(Boolean).join(' ');
}
function stringArray(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}
function text(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return String(value);
    return typeof value === 'string' ? decodeHtml(value).trim() : '';
}
function numberOrNull(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function numberish(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value !== 'string' || !value.trim())
        return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function chainFromOsmTags(tags) {
    const brand = `${text(tags.brand)} ${text(tags.operator)} ${text(tags.name)}`.toLowerCase();
    if (brand.includes('city gross'))
        return 'city_gross';
    if (brand.includes('hemköp') || brand.includes('hemkop'))
        return 'hemkop';
    if (brand.includes('willys'))
        return 'willys';
    if (brand.includes('coop'))
        return 'coop';
    if (brand.includes('lidl'))
        return 'lidl';
    if (brand.includes('ica'))
        return 'ica';
    return null;
}
function officialIdFromOsm(store) {
    return store.url.match(/(?:stores|butiker|butik)\/(\d+)/)?.[1] ?? store.url.match(/-(\d+)\/?$/)?.[1] ?? null;
}
function officialIcaIdFromUrl(url) {
    return url.match(/-(\d+)\/?$/)?.[1] ?? '';
}
function nameCityKey(store) {
    return `${store.chainId}:${normalizeKey(store.name)}:${normalizeKey(store.address.city)}`;
}
function normalizeKey(value) {
    return value.toLowerCase().replace(/[^a-z0-9åäö]+/g, '');
}
