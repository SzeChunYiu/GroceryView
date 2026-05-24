import { createHash } from 'node:crypto';

export const LIVSMEDELSVERKET_RECALLS_RSS_URL = 'https://www.livsmedelsverket.se/rss/rss-aterkallanden/';

export type FoodSafetyAlertRow = {
  rowType: 'food_safety_alert';
  sourceId: string;
  authority: 'Livsmedelsverket';
  country: 'SE';
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
  retrievedAt: string;
  hazard: string;
  productNames: string[];
};

export type FetchLivsmedelsverketRecallAlertsOptions = {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceUrl?: string;
  maxRows?: number;
};

type RssItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
};

const HAZARD_PATTERNS: Array<[RegExp, string]> = [
  [/salmonella/i, 'salmonella'],
  [/(listeria|listerios)/i, 'listeria'],
  [/(e\.?\s*coli| ehec)/i, 'e_coli'],
  [/(allergen|allergi|mjölk|gluten|nöt|jordnöt|sesam|soja|ägg|räka|kräftdjur)/i, 'undeclared_allergen'],
  [/(metall|glas|plastbit|främmande föremål)/i, 'foreign_material']
];

export function buildLivsmedelsverketRecallsUrl() {
  return LIVSMEDELSVERKET_RECALLS_RSS_URL;
}

export async function fetchLivsmedelsverketRecallAlerts(
  options: FetchLivsmedelsverketRecallAlertsOptions = {}
): Promise<FoodSafetyAlertRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? buildLivsmedelsverketRecallsUrl();
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 100;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      'user-agent': 'GroceryView/0.1 (food safety recall monitor; https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Livsmedelsverket recall RSS request failed: ${response.status}`);
  }

  return parseLivsmedelsverketRecallRss(await response.text(), { retrievedAt, maxRows });
}

export function parseLivsmedelsverketRecallRss(
  xml: string,
  options: { retrievedAt?: string; maxRows?: number } = {}
): FoodSafetyAlertRow[] {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 100;
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .map((match) => parseRssItem(match[1] ?? ''))
    .filter((item): item is RssItem => item !== null)
    .slice(0, maxRows);

  return items.map((item) => {
    const summary = item.description;
    const title = item.title;
    const sourceUrl = item.link;
    const publishedAt = dateToIso(item.pubDate);

    return {
      rowType: 'food_safety_alert',
      sourceId: createHash('sha256').update(`${sourceUrl}:${publishedAt}`).digest('hex').slice(0, 24),
      authority: 'Livsmedelsverket',
      country: 'SE',
      title,
      summary,
      sourceUrl,
      publishedAt,
      retrievedAt,
      hazard: detectHazard(`${title} ${summary}`),
      productNames: extractProductNames(title)
    };
  });
}

function parseRssItem(xml: string): RssItem | null {
  const title = tagText(xml, 'title');
  const description = tagText(xml, 'description');
  const link = tagText(xml, 'link');
  const pubDate = tagText(xml, 'pubDate');

  if (!title || !link || !pubDate) return null;
  return { title, description, link, pubDate };
}

function tagText(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return cleanText(match?.[1] ?? '');
}

function cleanText(value: string) {
  return decodeXmlEntities(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function dateToIso(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : new Date(0).toISOString();
}

function detectHazard(text: string) {
  for (const [pattern, hazard] of HAZARD_PATTERNS) {
    if (pattern.test(text)) return hazard;
  }
  return 'unspecified_recall';
}

function extractProductNames(title: string) {
  const normalized = title.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/återkallar\s+(.+?)(?:\s+-|\s+av säkerhetsskäl|\s+då|\s+efter|$)/i);
  return [match?.[1] ?? normalized].map((value) => value.trim()).filter(Boolean);
}
