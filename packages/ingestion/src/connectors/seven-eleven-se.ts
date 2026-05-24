export type SevenElevenSeConvenienceCategory = 'salad' | 'bowl' | 'small-bowl' | 'wrap' | 'pane-lungo';

export type SevenElevenSeConvenienceProduct = {
  chainId: 'seven_eleven_se';
  retailerProductId: string;
  name: string;
  category: SevenElevenSeConvenienceCategory;
  categoryLabel: string;
  packageText: '1 st';
  price: number;
  priceQualifier: 'from' | 'fixed';
  sourceUrl: string;
  retrievedAt: string;
  parserVersion: string;
  rawSnapshotRef: string;
  provenance: {
    source: 'seven_eleven_se_sortiment_page';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalSectionTitle: string;
    originalPriceText: string;
    originalItemHtml: string;
  };
};

export const SEVEN_ELEVEN_SE_SORTIMENT_URL = 'https://7-eleven.se/vart-sortiment/';
export const SEVEN_ELEVEN_SE_PARSER_VERSION = 'seven-eleven-se-sortiment-v1';

const SECTION_CATEGORY_BY_LABEL: Record<string, SevenElevenSeConvenienceCategory> = {
  sallad: 'salad',
  bowls: 'bowl',
  'liten bowl': 'small-bowl',
  wraps: 'wrap',
  'pane lungo': 'pane-lungo'
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&aring;/gi, 'å')
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&eacute;/gi, 'é')
    .replace(/&times;/gi, '×')
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'");
}

function textFromHtml(html: string): string {
  return decodeHtmlEntities(html)
    .replace(/<\s*br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stableKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

function parseSwedishKronor(value: string): number {
  const normalized = value.replace(/\s+/g, ' ').trim().replace(',', '.').replace(/\s*kr$/i, '');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid 7-Eleven SE price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function contentHashFor(body: string): string {
  let hash = 0;
  for (let index = 0; index < body.length; index += 1) {
    hash = ((hash << 5) - hash + body.charCodeAt(index)) | 0;
  }
  return `seven-eleven-se-${Math.abs(hash).toString(16)}`;
}

function sectionCategory(sectionLabel: string): SevenElevenSeConvenienceCategory | undefined {
  return SECTION_CATEGORY_BY_LABEL[sectionLabel.trim().toLowerCase().replace(/\s+/g, ' ')];
}

function containsFuelTerm(value: string): boolean {
  return /\b(drivmedel|bensin|diesel|hvo|e85|fuel|goeasy|etanol)\b/i.test(value);
}

export function parseSevenElevenSeSortimentPage(input: {
  body: string;
  sourceUrl?: string;
  retrievedAt: string;
  rawSnapshotRef?: string;
  parserVersion?: string;
}): SevenElevenSeConvenienceProduct[] {
  const sourceUrl = input.sourceUrl ?? SEVEN_ELEVEN_SE_SORTIMENT_URL;
  const parserVersion = input.parserVersion ?? SEVEN_ELEVEN_SE_PARSER_VERSION;
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://seven-eleven-se/${contentHashFor(input.body)}`;
  const rows: SevenElevenSeConvenienceProduct[] = [];
  const seenIds = new Set<string>();

  const sectionPattern = /<p\b[^>]*class="[^"]*redactor-ingress[^"]*"[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>\s*(?:<figure\b[\s\S]*?<\/figure>\s*)?<ul\b[^>]*>([\s\S]*?)<\/ul>/gi;
  let sectionMatch: RegExpExecArray | null;
  while ((sectionMatch = sectionPattern.exec(input.body)) !== null) {
    const rawSectionTitle = textFromHtml(sectionMatch[1] ?? '');
    const priceMatch = rawSectionTitle.match(/^(.+?)\s*:\s*(Från\s*)?(\d+(?:[,.]\d+)?)\s*kr$/i);
    if (!priceMatch) continue;

    const categoryLabel = priceMatch[1]!.replace(/\s+/g, ' ').trim();
    const category = sectionCategory(categoryLabel);
    if (!category) continue;

    const priceQualifier = priceMatch[2] ? 'from' : 'fixed';
    const originalPriceText = `${priceMatch[2] ?? ''}${priceMatch[3]} kr`.replace(/\s+/g, ' ').trim();
    const price = parseSwedishKronor(`${priceMatch[3]} kr`);
    const listHtml = sectionMatch[2] ?? '';
    const itemPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemPattern.exec(listHtml)) !== null) {
      const originalItemHtml = itemMatch[1] ?? '';
      const name = textFromHtml(originalItemHtml);
      if (!name || containsFuelTerm(name)) continue;
      const retailerProductId = `seven-eleven-se-${category}-${stableKeyPart(name)}`;
      if (seenIds.has(retailerProductId)) continue;
      seenIds.add(retailerProductId);
      rows.push({
        chainId: 'seven_eleven_se',
        retailerProductId,
        name,
        category,
        categoryLabel,
        packageText: '1 st',
        price,
        priceQualifier,
        sourceUrl,
        retrievedAt: input.retrievedAt,
        parserVersion,
        rawSnapshotRef,
        provenance: {
          source: 'seven_eleven_se_sortiment_page',
          sourceUrl,
          parserVersion,
          rawSnapshotRef,
          originalSectionTitle: rawSectionTitle,
          originalPriceText,
          originalItemHtml: originalItemHtml.trim()
        }
      });
    }
  }

  if (rows.length === 0) throw new Error('7-Eleven SE sortiment page contained no convenience SKU price rows.');
  return rows;
}

export async function fetchSevenElevenSeConvenienceProducts(options: {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceUrl?: string;
} = {}): Promise<SevenElevenSeConvenienceProduct[]> {
  const sourceUrl = options.sourceUrl ?? SEVEN_ELEVEN_SE_SORTIMENT_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView 7-Eleven SE connector (+https://groceryview.example)'
    }
  });
  if (response.status === 403 || response.status === 401) throw new Error(`7-Eleven SE sortiment source blocked with HTTP ${response.status}.`);
  if (!response.ok) throw new Error(`7-Eleven SE sortiment source failed with HTTP ${response.status}.`);
  const body = await response.text();
  if (/captcha|logga in för att fortsätta|access denied/i.test(body)) {
    throw new Error('7-Eleven SE sortiment source returned a login/captcha/access-denied page.');
  }
  return parseSevenElevenSeSortimentPage({
    body,
    sourceUrl,
    retrievedAt,
    rawSnapshotRef: `raw://seven-eleven-se/${contentHashFor(body)}`
  });
}
