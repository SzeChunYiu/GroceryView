export type IcaReklambladStructuredPromotion =
  | {
      kind: 'multi_buy';
      quantity: number;
      price: number;
      memberOnly: boolean;
      sourceText: string;
    }
  | {
      kind: 'percent_off';
      percentOff: number;
      memberOnly: boolean;
      sourceText: string;
    }
  | {
      kind: 'member_price';
      price: number | null;
      memberOnly: true;
      sourceText: string;
    };

export type IcaReklambladOffer = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  priceText: string;
  comparisonPrice: string;
  regularPriceText: string;
  validTo: string;
  storeName: string;
  storeId: string;
  availableInStore: boolean;
  availableOnline: boolean;
  eans: string[];
  sourceUrl: string;
  flyerUrl: string;
  flyerPdfUrl: string;
  imageUrl: string;
  retrievedAt: string;
  structuredPromotion: IcaReklambladStructuredPromotion | null;
};

type IcaWeeklyOffer = {
  id?: unknown;
  details?: {
    brand?: unknown;
    packageInformation?: unknown;
    name?: unknown;
    mechanicInfo?: unknown;
  };
  category?: {
    articleGroupName?: unknown;
  };
  validTo?: unknown;
  comparisonPrice?: unknown;
  stores?: Array<{
    storeMarketingName?: unknown;
    BMSStoreId?: unknown;
    regularPrice?: unknown;
    referencePriceText?: unknown;
    onlineInd?: unknown;
    storeInd?: unknown;
  }>;
  eans?: Array<{
    id?: unknown;
    image?: unknown;
  }>;
};

export const ICA_REKLAMBLAD_OFFER_PAGE_URL = 'https://www.ica.se/erbjudanden/ica-focus-1004247/';
export const DEFAULT_ICA_REKLAMBLAD_OFFER_PAGE_URLS = [
  ICA_REKLAMBLAD_OFFER_PAGE_URL,
  'https://www.ica.se/erbjudanden/ica-kvantum-kista-1004587/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-solna-1003380/',
  'https://www.ica.se/erbjudanden/ica-kvantum-kungsholmen-1004599/',
  'https://www.ica.se/erbjudanden/ica-supermarket-faltoversten-1004228/',
  'https://www.ica.se/erbjudanden/ica-kvantum-sodermalm-1004222/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-bromma-1015001/',
  'https://www.ica.se/erbjudanden/ica-nara-sergels-torg-1004329/',
  'https://www.ica.se/erbjudanden/ica-nara-baner-1004414/',
  'https://www.ica.se/erbjudanden/ica-supermarket-esplanad-sthlm-1004164/',
  'https://www.ica.se/erbjudanden/ica-supermarket-kungsholmstorg-1004026/',
  'https://www.ica.se/erbjudanden/ica-supermarket-aptiten-1003988/',
  'https://www.ica.se/erbjudanden/ica-nara-humlegarden-1003770/',
  'https://www.ica.se/erbjudanden/ica-karlaplan-1003714/',
  'https://www.ica.se/erbjudanden/ica-supermarket-sabbatsberg-1004134/',
  'https://www.ica.se/erbjudanden/ica-supermarket-medborgarplatsen-1003941/',
  'https://www.ica.se/erbjudanden/ica-supermarket-pelikan-1003447/',
  'https://www.ica.se/erbjudanden/ica-supermarket-baronen-stockholm-1004155/',
  'https://www.ica.se/erbjudanden/ica-nara-a-livs-1004177/',
  'https://www.ica.se/erbjudanden/ica-abrahamsberg-1003617/',
  'https://www.ica.se/erbjudanden/ica-affaren-orarna-1003909/',
  'https://www.ica.se/erbjudanden/ica-nara-affarn-sydkoster-1003964/',
  'https://www.ica.se/erbjudanden/ica-togo-agunnaryd-1168009/',
  'https://www.ica.se/erbjudanden/ica-nara-ahlgrens-torg-1051006/',
  'https://www.ica.se/erbjudanden/ica-kvantum-ale-1003458/',
  'https://www.ica.se/erbjudanden/ica-supermarket-alen-1003663/',
  'https://www.ica.se/erbjudanden/ica-nara-alexius-livs-1003644/',
  'https://www.ica.se/erbjudanden/ica-supermarket-alfta-1004242/',
  'https://www.ica.se/erbjudanden/ica-supermarket-algots-monsteras-1003645/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-alingsas-1003647/',
  'https://www.ica.se/erbjudanden/ica-nara-allans-livs-1003942/',
  'https://www.ica.se/erbjudanden/ica-nara-allens-1004333/',
  'https://www.ica.se/erbjudanden/ica-krysset-almunge-1003650/',
  'https://www.ica.se/erbjudanden/ica-supermarket-almers-1004079/',
  'https://www.ica.se/erbjudanden/ica-supermarket-alno-1003652/',
  'https://www.ica.se/erbjudanden/ica-nara-alskog-1004473/',
  'https://www.ica.se/erbjudanden/ica-nara-alsterhallen-1003653/',
  'https://www.ica.se/erbjudanden/ica-supermarket-alunda-1003654/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-hyllinge-1003937/',
  'https://www.ica.se/erbjudanden/ica-kvantum-munkeback-1004271/',
  'https://www.ica.se/erbjudanden/ica-nara-alvsjo-1004436/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-visby-1003730/',
  'https://www.ica.se/erbjudanden/ica-kvantum-skelleftea-1004002/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-barkarbystaden-1003408/',
  'https://www.ica.se/erbjudanden/ica-city-knalleland-1004101/',
  'https://www.ica.se/erbjudanden/ica-supermarket-grevie-1004106/',
  'https://www.ica.se/erbjudanden/ica-nara-stora-mellosa-1004150/',
  'https://www.ica.se/erbjudanden/ica-kvantum-hovas-1003932/',
  'https://www.ica.se/erbjudanden/ica-kvantum-molndal-1004589/',
  'https://www.ica.se/erbjudanden/ica-kvantum-vanersborg-1004306/',
  'https://www.ica.se/erbjudanden/ica-kvantum-gottsunda-1004218/',
  'https://www.ica.se/erbjudanden/ica-kvantum-tranas-1003829/',
  'https://www.ica.se/erbjudanden/ica-supermarket-margretelund-1004695/',
  'https://www.ica.se/erbjudanden/ica-supermarket-lindome-1004578/',
  'https://www.ica.se/erbjudanden/ica-supermarket-habo-1004429/',
  'https://www.ica.se/erbjudanden/ica-supermarket-kappala-1003833/',
  'https://www.ica.se/erbjudanden/ica-supermarket-matpunkten-1004230/',
  'https://www.ica.se/erbjudanden/ica-supermarket-knalleland-1004048/',
  'https://www.ica.se/erbjudanden/ica-supermarket-salem-1004689/',
  'https://www.ica.se/erbjudanden/ica-supermarket-limhamns-sjostad-1051002/',
  'https://www.ica.se/erbjudanden/ica-kvantum-flygfyren-1003532/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-kungalv-1004392/'
] as const;
export const DEFAULT_ICA_REKLAMBLAD_MAX_ROWS = 7000;
export const EMAGIN_PDF_API_BASE_URL = 'https://api.e-magin.se/api/pdf/';

export type FetchIcaReklambladOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export async function fetchIcaReklambladOffers(
  options: FetchIcaReklambladOffersOptions = {}
): Promise<IcaReklambladOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = options.sourceUrls ?? (options.sourceUrl ? [options.sourceUrl] : DEFAULT_ICA_REKLAMBLAD_OFFER_PAGE_URLS);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? DEFAULT_ICA_REKLAMBLAD_MAX_ROWS;
  const rows: IcaReklambladOffer[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`ICA reklamblad offer page request failed for ${sourceUrl}: ${response.status}`);
    }

    rows.push(...parseIcaReklambladOffers(await response.text(), {
      sourceUrl,
      retrievedAt,
      maxRows: maxRows - rows.length
    }));
    if (rows.length >= maxRows) {
      return rows;
    }
  }

  return rows;
}

export function parseIcaReklambladOffers(
  html: string,
  context: {
    sourceUrl: string;
    retrievedAt: string;
    maxRows?: number;
  }
): IcaReklambladOffer[] {
  const flyerUrl = extractIcaReklambladUrl(html);
  const flyerPdfUrl = buildEmaginPdfUrl(flyerUrl);
  const rows: IcaReklambladOffer[] = [];
  const seenCodes = new Set<string>();

  for (const offer of parseWeeklyOffers(html)) {
    const row = normalizeIcaReklambladOffer(offer, {
      sourceUrl: context.sourceUrl,
      flyerUrl,
      flyerPdfUrl,
      retrievedAt: context.retrievedAt
    });
    if (!row || seenCodes.has(row.code)) {
      continue;
    }
    seenCodes.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 150)) {
      return rows;
    }
  }

  return rows;
}

export function extractIcaReklambladUrl(html: string): string {
  const match = html.match(/"text":"DRBlad","type":"DRBlad","url":"([^"]+)"/);
  return match ? decodeJsonString(match[1]) : '';
}

export function buildEmaginPdfUrl(flyerUrl: string): string {
  const paperKey = flyerUrl.match(/\/latestpaper\/([^/]+)/)?.[1] ?? flyerUrl.match(/\/paper\/([^/]+)/)?.[1] ?? '';
  return paperKey ? new URL(encodeURIComponent(paperKey), EMAGIN_PDF_API_BASE_URL).toString() : '';
}

export function normalizeIcaReklambladOffer(
  offer: IcaWeeklyOffer,
  context: {
    sourceUrl: string;
    flyerUrl: string;
    flyerPdfUrl: string;
    retrievedAt: string;
  }
): IcaReklambladOffer | null {
  const code = text(offer.id);
  const name = text(offer.details?.name);
  const priceText = text(offer.details?.mechanicInfo);
  if (!code || !name || !priceText) {
    return null;
  }

  const store = offer.stores?.[0];
  const structuredPromotion = parseIcaReklambladStructuredPromotion(priceText);
  return {
    code,
    name,
    brand: text(offer.details?.brand),
    packageText: text(offer.details?.packageInformation),
    category: text(offer.category?.articleGroupName),
    priceText,
    comparisonPrice: text(offer.comparisonPrice),
    regularPriceText: text(store?.referencePriceText) || formatRegularPrice(store?.regularPrice),
    validTo: text(offer.validTo),
    storeName: text(store?.storeMarketingName),
    storeId: text(store?.BMSStoreId),
    availableInStore: store?.storeInd === true,
    availableOnline: store?.onlineInd === true,
    eans: Array.isArray(offer.eans) ? offer.eans.map((ean) => text(ean.id)).filter(Boolean) : [],
    sourceUrl: context.sourceUrl,
    flyerUrl: context.flyerUrl,
    flyerPdfUrl: context.flyerPdfUrl,
    imageUrl: text(offer.eans?.[0]?.image),
    retrievedAt: context.retrievedAt,
    structuredPromotion
  };
}

export function parseIcaReklambladStructuredPromotion(priceText: string): IcaReklambladStructuredPromotion | null {
  const sourceText = priceText.trim();
  if (!sourceText) {
    return null;
  }
  const memberOnly = /\b(?:medlemspris|stammispris|ica\s+stammis)\b/i.test(sourceText);
  const multiBuy = sourceText.match(/(\d+)\s*(?:för|for)\s*(\d+(?:[,.]\d+)?)/i);
  if (multiBuy) {
    return {
      kind: 'multi_buy',
      quantity: Number.parseInt(multiBuy[1] ?? '', 10),
      price: parseSwedishNumber(multiBuy[2]),
      memberOnly,
      sourceText
    };
  }

  const percentOff = sourceText.match(/(\d+(?:[,.]\d+)?)\s*%\s*(?:rabatt|off)?/i);
  if (percentOff) {
    return {
      kind: 'percent_off',
      percentOff: parseSwedishNumber(percentOff[1]),
      memberOnly,
      sourceText
    };
  }

  if (memberOnly) {
    const price = sourceText.match(/(\d+(?:[,.]\d+)?)(?=\s*(?:kr|:-|\/|$))/i);
    return {
      kind: 'member_price',
      price: price ? parseSwedishNumber(price[1]) : null,
      memberOnly: true,
      sourceText
    };
  }

  return null;
}

function parseSwedishNumber(value: string | undefined): number {
  return Number.parseFloat((value ?? '0').replace(',', '.'));
}

function parseWeeklyOffers(html: string): IcaWeeklyOffer[] {
  const marker = '"weeklyOffers":';
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('ICA offer page did not include weeklyOffers');
  }

  const arrayStart = html.indexOf('[', markerIndex);
  const arrayEnd = findMatchingBracket(html, arrayStart);
  if (arrayStart < 0 || arrayEnd < 0) {
    throw new Error('ICA weeklyOffers array was malformed');
  }

  return JSON.parse(html.slice(arrayStart, arrayEnd).replace(/\bundefined\b/g, 'null')) as IcaWeeklyOffer[];
}

function findMatchingBracket(textValue: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < textValue.length; index += 1) {
    const char = textValue[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
    } else if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
  }
  return -1;
}

function formatRegularPrice(value: unknown): string {
  const regularPrice = text(value);
  return regularPrice ? `Ord.pris ${regularPrice} kr.` : '';
}

function decodeJsonString(value: string): string {
  return JSON.parse(`"${value}"`) as string;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
