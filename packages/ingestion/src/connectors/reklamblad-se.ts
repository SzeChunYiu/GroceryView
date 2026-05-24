export type ReklambladSeChainId = 'ica' | 'coop' | 'willys' | 'hemkop' | 'lidl' | 'city-gross' | 'tempo' | 'matdax';

export type ReklambladSeOffer = {
  chainId: ReklambladSeChainId;
  code: string;
  name: string;
  brand: string;
  category: string;
  packageText: string;
  price: number;
  priceText: string;
  regularPrice: number | null;
  regularPriceText: string;
  validFrom: string;
  validTo: string;
  sourceUrl: string;
  flyerUrl: string;
  productUrl: string;
  imageUrl: string;
  isDeal: true;
  retrievedAt: string;
};

export type FetchReklambladSeOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export type ReklambladSeParsedProduct = {
  sourceType: 'flyer_campaign';
  observedAt: string;
  parserVersion: string;
  rawSnapshotRef: string;
  chainId: ReklambladSeChainId;
  retailerProductId: string;
  rawName: string;
  canonicalName: string;
  productId: string;
  categoryId: string;
  brand?: string;
  packageSize: number;
  packageUnit: string;
  price: number;
  regularPrice?: number;
  promoText: string;
  memberOnly: false;
  isAvailable: true;
  validFrom?: string;
  validUntil?: string;
  sourceUrl?: string;
  imageUrl?: string;
};

type WalkContext = {
  chainId?: ReklambladSeChainId;
  flyerUrl?: string;
  validFrom?: string;
  validTo?: string;
};

type CandidateObject = Record<string, unknown>;

export const REKLAMBLAD_SE_BASE_URL = 'https://reklamblad.se';
export const DEFAULT_REKLAMBLAD_SE_CHAIN_URLS = [
  'https://reklamblad.se/ica',
  'https://reklamblad.se/coop',
  'https://reklamblad.se/willys',
  'https://reklamblad.se/hemkop',
  'https://reklamblad.se/lidl',
  'https://reklamblad.se/city-gross'
] as const;
export const REKLAMBLAD_SE_PARSER_VERSION = 'reklamblad-se-weekly-flyers-v1';

const CHAIN_ALIASES: Record<string, ReklambladSeChainId> = {
  ica: 'ica',
  'ica maxi': 'ica',
  'ica kvantum': 'ica',
  coop: 'coop',
  willys: 'willys',
  "willy's": 'willys',
  hemkop: 'hemkop',
  hemköp: 'hemkop',
  lidl: 'lidl',
  'city gross': 'city-gross',
  citygross: 'city-gross',
  tempo: 'tempo',
  matdax: 'matdax'
};

export async function fetchReklambladSeOffers(options: FetchReklambladSeOffersOptions = {}): Promise<ReklambladSeOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = options.sourceUrls ?? DEFAULT_REKLAMBLAD_SE_CHAIN_URLS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 2000;
  const rows: ReklambladSeOffer[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Reklamblad.se request failed for ${sourceUrl}: ${response.status}`);
    }
    for (const row of parseReklambladSeOffers(await response.text(), { sourceUrl, retrievedAt, maxRows: maxRows - rows.length })) {
      const key = `${row.chainId}:${row.code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function parseReklambladSeOffers(
  html: string,
  context: { sourceUrl: string; retrievedAt: string; maxRows?: number }
): ReklambladSeOffer[] {
  const rows: ReklambladSeOffer[] = [];
  const seen = new Set<string>();
  const initialContext: WalkContext = { chainId: chainIdFromText(context.sourceUrl) };

  for (const payload of extractStructuredPayloads(html)) {
    collectOffers(payload, initialContext, (candidate, walkContext) => {
      const row = normalizeReklambladSeOffer(candidate, {
        ...walkContext,
        sourceUrl: context.sourceUrl,
        retrievedAt: context.retrievedAt
      });
      if (!row) return;
      const key = `${row.chainId}:${row.code}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(row);
    });
    if (rows.length >= (context.maxRows ?? 2000)) return rows.slice(0, context.maxRows ?? 2000);
  }

  for (const row of parseReklambladSeOfferCards(html, context, initialContext)) {
    const key = `${row.chainId}:${row.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 2000)) return rows;
  }

  return rows;
}

export function normalizeReklambladSeOffer(
  candidate: CandidateObject,
  context: WalkContext & { sourceUrl: string; retrievedAt: string }
): ReklambladSeOffer | null {
  const chainId = chainIdFromText(text(candidate.chainId) || text(candidate.chain) || text(candidate.retailer) || text(candidate.retailerName) || text(candidate.storeName)) ?? context.chainId;
  const name = text(candidate.name) || text(candidate.title) || text(candidate.productName);
  const priceText = text(candidate.priceText) || text(candidate.offerText) || text(candidate.mechanicInfo) || text(candidate.price);
  const price = numberFromText(candidate.priceValue ?? candidate.price ?? candidate.offerPrice ?? candidate.currentPrice ?? priceText);
  if (!chainId || !name || price === null) return null;

  const code = text(candidate.id) || text(candidate.offerId) || text(candidate.code) || text(candidate.sku) || stableKeyPart(`${chainId}-${name}-${priceText || price}`);
  const flyerUrl = absoluteUrl(text(candidate.flyerUrl) || text(candidate.catalogUrl) || context.flyerUrl || context.sourceUrl, context.sourceUrl);
  const productUrl = absoluteUrl(text(candidate.productUrl) || text(candidate.url), context.sourceUrl);
  const regularPrice = numberFromText(candidate.regularPrice ?? candidate.originalPrice ?? candidate.beforePrice ?? candidate.wasPrice);

  return {
    chainId,
    code,
    name,
    brand: text(candidate.brand),
    category: text(candidate.category) || text(candidate.categoryName),
    packageText: text(candidate.packageText) || text(candidate.packageSize) || text(candidate.packageInformation),
    price,
    priceText: priceText || `${price.toFixed(2)} kr`,
    regularPrice,
    regularPriceText: text(candidate.regularPriceText) || text(candidate.originalPriceText),
    validFrom: isoDateText(candidate.validFrom ?? candidate.startsAt ?? context.validFrom),
    validTo: isoDateText(candidate.validTo ?? candidate.validUntil ?? candidate.endsAt ?? context.validTo),
    sourceUrl: context.sourceUrl,
    flyerUrl,
    productUrl,
    imageUrl: absoluteUrl(text(candidate.imageUrl) || text(candidate.image) || text(candidate.thumbnail), context.sourceUrl),
    isDeal: true,
    retrievedAt: context.retrievedAt
  };
}

export function reklambladSeOfferToParsedProduct(row: ReklambladSeOffer): ReklambladSeParsedProduct {
  const quantity = parsePackageText(`${row.name} ${row.packageText}`);
  return {
    sourceType: 'flyer_campaign',
    observedAt: row.retrievedAt,
    parserVersion: REKLAMBLAD_SE_PARSER_VERSION,
    rawSnapshotRef: `raw://reklamblad-se/${stableKeyPart(row.chainId)}/${stableKeyPart(row.code)}`,
    chainId: row.chainId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: `reklamblad-se-${row.chainId}-${stableKeyPart(row.code || row.name)}`,
    categoryId: `grocery-${stableKeyPart(row.category || 'flyer-offer')}`,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    regularPrice: row.regularPrice !== null && row.regularPrice > row.price ? row.regularPrice : undefined,
    promoText: row.priceText,
    memberOnly: false,
    isAvailable: true,
    validFrom: row.validFrom || undefined,
    validUntil: row.validTo || undefined,
    sourceUrl: row.flyerUrl || row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function extractStructuredPayloads(html: string): unknown[] {
  const payloads: unknown[] = [];
  for (const id of ['__NEXT_DATA__', 'reklamblad-se-data', 'reklamblad-data']) {
    const payload = extractJsonScript(html, id);
    if (payload !== null) payloads.push(payload);
  }
  for (const name of ['__REKLAMBLAD_SE__', '__REKLAMBLAD_DATA__']) {
    const payload = extractWindowAssignment(html, name);
    if (payload !== null) payloads.push(payload);
  }
  return payloads;
}

function collectOffers(value: unknown, context: WalkContext, onOffer: (candidate: CandidateObject, context: WalkContext) => void): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectOffers(item, context, onOffer);
    return;
  }

  const object = value as CandidateObject;
  const nextContext = contextFromObject(object, context);
  if (looksLikeOffer(object)) onOffer(object, nextContext);
  for (const child of Object.values(object)) collectOffers(child, nextContext, onOffer);
}

function contextFromObject(object: CandidateObject, context: WalkContext): WalkContext {
  return {
    chainId: chainIdFromText(text(object.chainId) || text(object.chain) || text(object.retailer) || text(object.retailerName) || text(object.storeName) || text(object.name)) ?? context.chainId,
    flyerUrl: text(object.flyerUrl) || text(object.catalogUrl) || text(object.reklambladUrl) || context.flyerUrl,
    validFrom: isoDateText(object.validFrom ?? object.startsAt) || context.validFrom,
    validTo: isoDateText(object.validTo ?? object.validUntil ?? object.endsAt) || context.validTo
  };
}

function looksLikeOffer(object: CandidateObject): boolean {
  const name = text(object.name) || text(object.title) || text(object.productName);
  const hasPrice = numberFromText(object.priceValue ?? object.price ?? object.offerPrice ?? object.currentPrice ?? object.priceText ?? object.offerText ?? object.mechanicInfo) !== null;
  return Boolean(name && hasPrice);
}

function parseReklambladSeOfferCards(
  html: string,
  context: { sourceUrl: string; retrievedAt: string; maxRows?: number },
  walkContext: WalkContext
): ReklambladSeOffer[] {
  const rows: ReklambladSeOffer[] = [];
  const cardPattern = /<[^>]+data-reklamblad-offer=(['"])(.*?)\1[^>]*>/gis;
  let match: RegExpExecArray | null;
  while ((match = cardPattern.exec(html)) !== null) {
    try {
      const candidate = JSON.parse(decodeHtml(match[2])) as CandidateObject;
      const row = normalizeReklambladSeOffer(candidate, { ...walkContext, sourceUrl: context.sourceUrl, retrievedAt: context.retrievedAt });
      if (row) rows.push(row);
    } catch {
      // Ignore malformed data attributes; structured JSON payloads are preferred.
    }
    if (rows.length >= (context.maxRows ?? 2000)) return rows;
  }
  return rows;
}

function extractJsonScript(html: string, id: string): unknown | null {
  const pattern = new RegExp(`<script[^>]+id=["']${escapeRegExp(id)}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
  const match = html.match(pattern);
  if (!match) return null;
  return JSON.parse(decodeHtml(match[1]).trim()) as unknown;
}

function extractWindowAssignment(html: string, name: string): unknown | null {
  const marker = `window.${name}`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const equalsIndex = html.indexOf('=', markerIndex + marker.length);
  const objectStart = html.indexOf('{', equalsIndex);
  if (equalsIndex < 0 || objectStart < 0) return null;
  const objectEnd = findMatchingBrace(html, objectStart);
  if (objectEnd < 0) return null;
  return JSON.parse(html.slice(objectStart, objectEnd + 1)) as unknown;
}

function findMatchingBrace(value: string, start: number): number {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function chainIdFromText(value: string): ReklambladSeChainId | undefined {
  const normalized = normalizeText(value);
  return CHAIN_ALIASES[normalized] ?? Object.entries(CHAIN_ALIASES).find(([alias]) => normalized.includes(alias))?.[1];
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function parsePackageText(value: string): { packageSize: number; packageUnit: string } {
  const normalized = value.toLowerCase().replace(',', '.');
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|gram|l|liter|ml|st|styck|pack|kpl)\b/);
  if (!match) return { packageSize: 1, packageUnit: 'piece' };
  const amount = Number.parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'st' || unit === 'styck' || unit === 'pack' || unit === 'kpl') return { packageSize: amount, packageUnit: 'piece' };
  if (unit === 'gram') return { packageSize: amount, packageUnit: 'g' };
  return { packageSize: amount, packageUnit: unit };
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  if (value.startsWith('https://') || value.startsWith('http://')) return value;
  return new URL(value, baseUrl).toString();
}

function isoDateText(value: unknown): string {
  const raw = text(value);
  if (!raw) return '';
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? raw : new Date(parsed).toISOString();
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = text(value).replace(/\s/g, '').replace(',', '.');
  const match = raw.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function stableKeyPart(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'unknown';
}

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
