export type SevenElevenSeProductCategory = 'breakfast' | 'bakery' | 'lunch' | 'drink' | 'snack' | 'convenience';

export type SevenElevenSeDietaryTag = 'lacto_vegetarian' | 'vegetarian' | 'plant_based' | 'vegan';

export type SevenElevenSeProduct = {
  productId: string;
  chainId: 'seven_eleven_se';
  chainName: '7-Eleven Sweden';
  country: 'SE';
  name: string;
  category: SevenElevenSeProductCategory;
  priceMin: number;
  priceMax: number;
  priceText: string;
  currency: 'SEK';
  channel: 'b2b';
  customerSegment: 'business';
  format: 'seven_eleven';
  store_id: 'se:national-seven-eleven-b2b';
  region: 'se-national';
  depositIncluded: boolean;
  is_member_price: false;
  is_subscription_price: false;
  is_coupon_price: false;
  is_clearance: false;
  multi_buy: null;
  out_of_scope_for_consumer_connector: true;
  dietaryTags: SevenElevenSeDietaryTag[];
  sourceUrl: string;
  pdfUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'seven_eleven_se_b2b_assortment_pdf';
    parserVersion: string;
    rawSnapshotRef: string;
  };
};

export type FetchSevenElevenSeConvenienceProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
  sourceUrl?: string;
  pdfUrl?: string;
  pdfTextExtractor?: (input: ArrayBuffer) => Promise<string>;
};

export type ParseSevenElevenSeConvenienceProductsOptions = {
  sourceUrl?: string;
  pdfUrl?: string;
  retrievedAt: string;
  rawSnapshotRef?: string;
  maxRows?: number;
};

export const SEVEN_ELEVEN_SE_BASE_URL = 'https://7-eleven.se';
export const SEVEN_ELEVEN_SE_BUSINESS_ORDERS_PATH = '/foretagsbestallningar/';
export const SEVEN_ELEVEN_SE_ASSORTMENT_PDF_URL = 'https://storage.googleapis.com/seveneleven-media-bucket-prod/1/2025/06/7E-Sortimentlista-B2B-A4-enkelsidor.pdf';
export const SEVEN_ELEVEN_SE_PRODUCT_PARSER_VERSION = 'seven-eleven-se-b2b-assortment-v1';
export const SEVEN_ELEVEN_SE_APP_URL = `${SEVEN_ELEVEN_SE_BASE_URL}/ladda-ner-appen/`;
export const SEVEN_ELEVEN_SE_APP_TERMS_URL = `${SEVEN_ELEVEN_SE_BASE_URL}/kontakt/behandling-av-personuppgifter/appar/`;
export const SEVEN_ELEVEN_SE_APP_FAQ_URL = `${SEVEN_ELEVEN_SE_BASE_URL}/ladda-ner-appen/faq/`;
export const SEVEN_ELEVEN_SE_CLICK_AND_COLLECT_TERMS_URL = `${SEVEN_ELEVEN_SE_BASE_URL}/anvandarvillkor/click-and-collect-tos/`;
export const SEVEN_ELEVEN_SE_PRICING_QUIRKS_PARSER_VERSION = 'seven-eleven-se-pricing-quirks-v1';

export type SevenElevenSePricingQuirkRow = {
  id: string;
  chainId: 'seven_eleven_se';
  chainName: '7-Eleven Sweden';
  country: 'SE';
  productScope: 'app_deals' | 'click_and_collect' | 'b2b_assortment';
  channel: 'app' | 'online' | 'b2b';
  customerSegment: 'consumer' | 'business';
  format: 'seven_eleven';
  store_id: 'se:national-seven-eleven' | 'se:national-seven-eleven-b2b';
  region: 'se-national';
  price: number | null;
  currency: 'SEK';
  unit: 'metadata';
  is_member_price: boolean;
  membershipProgram: 'The Corner Club' | null;
  is_subscription_price: false;
  is_coupon_price: boolean;
  is_clearance: false;
  multi_buy: null;
  out_of_scope_for_consumer_connector?: boolean;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'seven_eleven_se_pricing_quirks';
    parserVersion: string;
    evidenceText: string;
  };
};

const PRICE_RANGE_PATTERN = /(\d{1,3})\s*[-–]\s*(\d{1,3})\s*:-/;

export function buildSevenElevenSeBusinessOrdersUrl(baseUrl = SEVEN_ELEVEN_SE_BASE_URL): string {
  return new URL(SEVEN_ELEVEN_SE_BUSINESS_ORDERS_PATH, baseUrl).toString();
}

export function findSevenElevenSeAssortmentPdfUrl(html: string, sourceUrl = buildSevenElevenSeBusinessOrdersUrl()): string | null {
  const links: string[] = [];
  const hrefPattern = /href=(['"])(.*?)\1/gi;
  for (const match of html.matchAll(hrefPattern)) {
    const rawHref = decodeHtml(match[2] ?? '');
    if (!/\.pdf(?:$|[?#])/i.test(rawHref)) continue;
    if (!/(sortiment|meny|b2b|foretag|företag|bestall|beställ)/i.test(rawHref)) continue;
    links.push(new URL(rawHref, sourceUrl).toString());
  }
  return links[0] ?? null;
}

export async function fetchSevenElevenSeConvenienceProducts(
  options: FetchSevenElevenSeConvenienceProductsOptions = {}
): Promise<SevenElevenSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? buildSevenElevenSeBusinessOrdersUrl(options.baseUrl);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const pageResponse = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!pageResponse.ok) throw new Error(`7-Eleven Sweden business-order page request failed: ${pageResponse.status}`);

  const pageHtml = await pageResponse.text();
  const pdfUrl = options.pdfUrl ?? findSevenElevenSeAssortmentPdfUrl(pageHtml, sourceUrl);
  if (!pdfUrl) throw new Error('7-Eleven Sweden business-order page did not expose an assortment PDF link.');

  const pdfResponse = await fetchImpl(pdfUrl, {
    headers: {
      accept: 'application/pdf,*/*',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!pdfResponse.ok) throw new Error(`7-Eleven Sweden assortment PDF request failed: ${pdfResponse.status}`);
  const contentType = pdfResponse.headers.get('content-type') ?? '';
  if (contentType && !contentType.toLowerCase().includes('pdf')) {
    throw new Error(`7-Eleven Sweden assortment PDF response had unexpected content type: ${contentType}`);
  }

  const pdfText = await (options.pdfTextExtractor ?? extractSevenElevenSePdfText)(await pdfResponse.arrayBuffer());
  const rows = parseSevenElevenSeConvenienceProducts(pdfText, {
    sourceUrl,
    pdfUrl,
    retrievedAt,
    rawSnapshotRef: `raw://seven-eleven-se-assortment/${contentHashFor(pdfText)}`,
    maxRows: options.maxRows
  });
  if (rows.length === 0) throw new Error('7-Eleven Sweden assortment PDF had no parseable convenience SKU rows.');
  return rows;
}

export async function extractSevenElevenSePdfText(input: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({ data: new Uint8Array(input) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items
      .map((item: { str?: unknown }) => typeof item.str === 'string' ? item.str.trim() : '')
      .filter(Boolean)
      .join('\n'));
  }
  return pages.join('\n');
}

export function parseSevenElevenSeConvenienceProducts(
  textContent: string,
  options: ParseSevenElevenSeConvenienceProductsOptions
): SevenElevenSeProduct[] {
  const sourceUrl = options.sourceUrl ?? buildSevenElevenSeBusinessOrdersUrl();
  const pdfUrl = options.pdfUrl ?? SEVEN_ELEVEN_SE_ASSORTMENT_PDF_URL;
  const rawSnapshotRef = options.rawSnapshotRef ?? `raw://seven-eleven-se-assortment/${contentHashFor(textContent)}`;
  const rows: SevenElevenSeProduct[] = [];
  const seen = new Set<string>();
  let pendingName = '';

  for (const line of normalizedProductLines(textContent)) {
    const priceMatch = line.match(PRICE_RANGE_PATTERN);
    if (!priceMatch || priceMatch.index === undefined) {
      const pendingCandidate = sanitizeProductName(line);
      if (isProductNameCandidate(pendingCandidate)) {
        pendingName = pendingName ? sanitizeProductName(`${pendingName} ${pendingCandidate}`) : pendingCandidate;
      }
      continue;
    }

    const beforePrice = sanitizeProductName(line.slice(0, priceMatch.index));
    const name = sanitizeProductName(beforePrice.length >= 4 ? `${pendingName} ${beforePrice}` : pendingName);
    pendingName = '';
    if (!isProductNameCandidate(name)) continue;

    const min = Number.parseInt(priceMatch[1]!, 10);
    const max = Number.parseInt(priceMatch[2]!, 10);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) continue;

    const suffix = line.slice(priceMatch.index + priceMatch[0].length);
    const productId = `seven-eleven-se-${slugFor(name)}`;
    if (seen.has(productId)) continue;
    seen.add(productId);
    rows.push({
      productId,
      chainId: 'seven_eleven_se',
      chainName: '7-Eleven Sweden',
      country: 'SE',
      name,
      category: categoryForSevenElevenSeProduct(name),
      priceMin: min,
      priceMax: max,
      priceText: `${min}-${max}:-${/\bpant\b/i.test(suffix) ? ' + pant' : ''}`,
      currency: 'SEK',
      channel: 'b2b',
      customerSegment: 'business',
      format: 'seven_eleven',
      store_id: 'se:national-seven-eleven-b2b',
      region: 'se-national',
      depositIncluded: /\bpant\b/i.test(suffix),
      is_member_price: false,
      is_subscription_price: false,
      is_coupon_price: false,
      is_clearance: false,
      multi_buy: null,
      out_of_scope_for_consumer_connector: true,
      dietaryTags: dietaryTagsFor(`${name} ${suffix}`),
      sourceUrl,
      pdfUrl,
      retrievedAt: options.retrievedAt,
      provenance: {
        source: 'seven_eleven_se_b2b_assortment_pdf',
        parserVersion: SEVEN_ELEVEN_SE_PRODUCT_PARSER_VERSION,
        rawSnapshotRef
      }
    });
    if (options.maxRows && rows.length >= options.maxRows) break;
  }

  return rows;
}

export function parseSevenElevenSePricingQuirks(input: {
  pages: Array<{ sourceUrl: string; html: string }>;
  retrievedAt: string;
}): SevenElevenSePricingQuirkRow[] {
  const rows: SevenElevenSePricingQuirkRow[] = [];
  const seen = new Set<string>();

  for (const page of input.pages) {
    assertSevenElevenSeSource(page.sourceUrl);
    const text = htmlToFlatText(page.html);
    if (/captcha|access denied|logga in för att fortsätta/i.test(text)) throw new Error('7-Eleven SE source returned a blocked/login page.');

    const appDeals = text.match(/The Corner Club[\s\S]*?exklusiva app-deals på mat,\s*mellis och fika|Få exklusiva app-deals på mat,\s*mellis och fika/i);
    if (appDeals && !seen.has('corner-club-app-deals')) {
      seen.add('corner-club-app-deals');
      rows.push(pricingQuirkRow({
        id: 'seven-eleven-se-corner-club-app-deals',
        productScope: 'app_deals',
        channel: 'app',
        customerSegment: 'consumer',
        is_member_price: true,
        membershipProgram: 'The Corner Club',
        is_coupon_price: true,
        sourceUrl: page.sourceUrl,
        retrievedAt: input.retrievedAt,
        evidenceText: appDeals[0]
      }));
    }

    const appCoupon = text.match(/skanna den specifika App-kupongens QR-kod i kassan i en 7-Eleven butik|App-kupong kan vara en gratis- eller rabattkupong/i);
    if (appCoupon && !seen.has('corner-club-coupon-redemption')) {
      seen.add('corner-club-coupon-redemption');
      rows.push(pricingQuirkRow({
        id: 'seven-eleven-se-corner-club-coupon-redemption',
        productScope: 'app_deals',
        channel: 'app',
        customerSegment: 'consumer',
        is_member_price: true,
        membershipProgram: 'The Corner Club',
        is_coupon_price: true,
        sourceUrl: page.sourceUrl,
        retrievedAt: input.retrievedAt,
        evidenceText: appCoupon[0]
      }));
    }

    const clickCollect = text.match(/RCS garanterar inte att priserna för Produkterna i Tjänsten följer priserna i butik|Rabattkuponger\/koder kan användas i samband med en beställning i Tjänsten/i);
    if (clickCollect && !seen.has('click-and-collect-price-split')) {
      seen.add('click-and-collect-price-split');
      rows.push(pricingQuirkRow({
        id: 'seven-eleven-se-click-and-collect-price-split',
        productScope: 'click_and_collect',
        channel: 'online',
        customerSegment: 'consumer',
        is_coupon_price: /Rabattkuponger\/koder/i.test(text),
        sourceUrl: page.sourceUrl,
        retrievedAt: input.retrievedAt,
        evidenceText: clickCollect[0]
      }));
    }
  }

  return rows;
}

function normalizedProductLines(textContent: string): string[] {
  return textContent
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u00ad]/g, '')
    .replace(/\r/g, '\n')
    .replace(/:-(?=\S)/g, ':-\n')
    .replace(/\s+\n/g, '\n')
    .split('\n')
    .flatMap((line) => splitLineOnEmbeddedProductRows(line))
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function splitLineOnEmbeddedProductRows(line: string): string[] {
  const normalized = line.replace(/:-(?=[A-ZÅÄÖÉÜ])/g, ':-\n');
  return normalized.split('\n');
}

function sanitizeProductName(value: string): string {
  const withoutIngredients = value.includes('Ingredienser:')
    ? value.slice(value.lastIndexOf('Ingredienser:') + 'Ingredienser:'.length)
    : value;
  return decodeHtml(withoutIngredients)
    .replace(/^[\s:;,.\-–]+/, '')
    .replace(/\s+(?:LAKTO-VEGETARISK|VEGETARISK|VÄXTBASERAD|VEGAN)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isProductNameCandidate(value: string): boolean {
  if (value.length < 4 || value.length > 180) return false;
  if (!/[A-ZÅÄÖÉÜ]/.test(value)) return false;
  if (/^(beställ|mat & fika|till jobbet|frukostmöte|på jobbet|hos oss|grillas|i butik|en matig|fräsch lunch|prova gärna|hitta din|ingredienser|kan innehålla)/i.test(value)) return false;
  if (/\b(Ingredienser|innehåller|konserveringsmedel|emulgeringsmedel|stabiliseringsmedel|surhetsreglerande|mjölbehandlingsmedel)\b/i.test(value)) return false;
  const letters = value.replace(/[^A-Za-zÅÄÖåäöÉéÜü]/g, '');
  if (letters.length < 4) return false;
  const uppercase = letters.replace(/[a-zåäöéü]/g, '');
  return uppercase.length / letters.length >= 0.75;
}

function categoryForSevenElevenSeProduct(name: string): SevenElevenSeProductCategory {
  if (/\b(JUICE|SHAKE|DRYCK|KAFFE|LATTE|SMOOTHIE)\b/i.test(name)) return 'drink';
  if (/\b(SALLAD|WRAP|PANE LUNGO|SEDANINI)\b/i.test(name)) return 'lunch';
  if (/\b(CROISSANTFRALLA|FRALLA|POLARKLÄMMA|CHIAPUDDING|YOGHURT|ÄGG\s*&\s*KAVIAR|LEVERPASTEJ)\b/i.test(name)) return 'breakfast';
  if (/\b(MUFFIN|BULLE|WIENER|CUPCAKE|COOKIE|BISKVI|CROISSANT|PAIN AU|DELICATOBOLL|CHOKLADBOLL|KAKA|FIKA)\b/i.test(name)) return 'bakery';
  if (/\b(CHIPS|GODIS|SNACK|NÖTTER|BAR)\b/i.test(name)) return 'snack';
  return 'convenience';
}

function dietaryTagsFor(value: string): SevenElevenSeDietaryTag[] {
  const tags: SevenElevenSeDietaryTag[] = [];
  if (/lakto-vegetarisk/i.test(value)) tags.push('lacto_vegetarian');
  if (/\bvegetarisk\b/i.test(value) && !tags.includes('vegetarian')) tags.push('vegetarian');
  if (/växtbaserad|plant.?based/i.test(value)) tags.push('plant_based');
  if (/\bvegan\b/i.test(value)) tags.push('vegan');
  return tags;
}

function slugFor(value: string): string {
  return value
    .replace(/Å/g, 'A').replace(/Ä/g, 'A').replace(/Ö/g, 'O')
    .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
    .replace(/É|È|Ê/g, 'E').replace(/é|è|ê/g, 'e')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function assertSevenElevenSeSource(sourceUrl: string): void {
  const hostname = new URL(sourceUrl).hostname;
  if (hostname !== '7-eleven.se' && hostname !== 'www.7-eleven.se') {
    throw new Error('7-Eleven SE connector only accepts 7-eleven.se source URLs.');
  }
}

function htmlToFlatText(html: string): string {
  return decodeHtml(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function pricingQuirkRow(input: {
  id: string;
  productScope: SevenElevenSePricingQuirkRow['productScope'];
  channel: SevenElevenSePricingQuirkRow['channel'];
  customerSegment: SevenElevenSePricingQuirkRow['customerSegment'];
  is_member_price?: boolean;
  membershipProgram?: SevenElevenSePricingQuirkRow['membershipProgram'];
  is_coupon_price?: boolean;
  sourceUrl: string;
  retrievedAt: string;
  evidenceText: string;
}): SevenElevenSePricingQuirkRow {
  const row: SevenElevenSePricingQuirkRow = {
    id: input.id,
    chainId: 'seven_eleven_se',
    chainName: '7-Eleven Sweden',
    country: 'SE',
    productScope: input.productScope,
    channel: input.channel,
    customerSegment: input.customerSegment,
    format: 'seven_eleven',
    store_id: input.customerSegment === 'business' ? 'se:national-seven-eleven-b2b' : 'se:national-seven-eleven',
    region: 'se-national',
    price: null,
    currency: 'SEK',
    unit: 'metadata',
    is_member_price: input.is_member_price ?? false,
    membershipProgram: input.membershipProgram ?? null,
    is_subscription_price: false,
    is_coupon_price: input.is_coupon_price ?? false,
    is_clearance: false,
    multi_buy: null,
    sourceUrl: input.sourceUrl,
    retrievedAt: input.retrievedAt,
    provenance: {
      source: 'seven_eleven_se_pricing_quirks',
      parserVersion: SEVEN_ELEVEN_SE_PRICING_QUIRKS_PARSER_VERSION,
      evidenceText: input.evidenceText
    }
  };
  if (input.customerSegment === 'business') row.out_of_scope_for_consumer_connector = true;
  return row;
}

function contentHashFor(body: string): string {
  let hash = 0;
  for (let index = 0; index < body.length; index += 1) {
    hash = ((hash << 5) - hash + body.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16);
}
