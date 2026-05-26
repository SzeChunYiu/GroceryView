export type MastRecallHazard =
  | 'allergen'
  | 'foreign_body'
  | 'microbiological'
  | 'pesticide'
  | 'chemical'
  | 'labeling'
  | 'quality'
  | 'other';

export type MastFoodSafetyAlert = {
  country: 'IS';
  authority: 'MAST';
  kind: 'food_safety_alert';
  alertId: string;
  title: string;
  summary: string;
  publishedAt: string;
  sourceUrl: string;
  guid: string;
  imageUrl: string;
  hazard: MastRecallHazard;
  affectedProduct: string;
  retrievedAt: string;
};

export type FetchMastFoodSafetyAlertsOptions = {
  fetchImpl?: typeof fetch;
  feedUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export const MAST_RECALLS_IS_FEED_URL = 'https://www.mast.is/is/feed/2';
export const MAST_RECALLS_IS_LISTING_URL = 'https://www.mast.is/is/um-mast/frettir/innkallanir';

export async function fetchMastFoodSafetyAlerts(options: FetchMastFoodSafetyAlertsOptions = {}): Promise<MastFoodSafetyAlert[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const feedUrl = options.feedUrl ?? MAST_RECALLS_IS_FEED_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(feedUrl, {
    headers: {
      accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'user-agent': 'GroceryView/0.1 MAST Iceland recalls (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`MAST IS recalls feed request failed: ${response.status}`);
  const rows = parseMastFoodSafetyAlerts(await response.text(), retrievedAt, feedUrl);
  if (rows.length === 0) throw new Error('MAST IS recalls feed returned no food_safety_alert rows.');
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseMastFoodSafetyAlerts(xml: string, retrievedAt: string, feedUrl = MAST_RECALLS_IS_FEED_URL): MastFoodSafetyAlert[] {
  return Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi))
    .map((match) => parseMastRecallItem(match[1], retrievedAt, feedUrl))
    .filter((row): row is MastFoodSafetyAlert => row !== null);
}

function parseMastRecallItem(itemXml: string, retrievedAt: string, feedUrl: string): MastFoodSafetyAlert | null {
  const title = decodeXml(textFromTag(itemXml, 'title'));
  const rawDescription = decodeXml(textFromTag(itemXml, 'description'));
  const summary = stripHtml(rawDescription);
  const pubDate = decodeXml(textFromTag(itemXml, 'pubDate'));
  const publishedAt = isoDateOrEmpty(pubDate);
  const sourceUrl = decodeXml(textFromTag(itemXml, 'link')) || feedUrl;
  const guid = decodeXml(textFromTag(itemXml, 'guid')) || sourceUrl;
  const imageUrl = decodeXml(firstMatch(rawDescription, /<img\b[^>]*\bsrc=["']([^"']+)["']/i));

  if (!title || !publishedAt || !sourceUrl) return null;

  const evidence = `${title} ${summary}`;
  return {
    country: 'IS',
    authority: 'MAST',
    kind: 'food_safety_alert',
    alertId: stableAlertId(guid || sourceUrl || title),
    title,
    summary,
    publishedAt,
    sourceUrl,
    guid,
    imageUrl,
    hazard: classifyMastRecallHazard(evidence),
    affectedProduct: inferAffectedProduct(title, summary),
    retrievedAt
  };
}

export function classifyMastRecallHazard(value: string): MastRecallHazard {
  const normalized = normalizedSearchText(value);
  if (/ofnaemi|othol|onæmi|oþol|sulfit|sinnep|gluten|mjolk|hnet/.test(normalized)) return 'allergen';
  if (/adskota|malmhlut|glerbrot|plast|hlutur/.test(normalized)) return 'foreign_body';
  if (/salmonell|listeri|orveru|bakter|e\.?\s*coli|myglu/.test(normalized)) return 'microbiological';
  if (/varnarefni|pesticid|chlorpyrifos|etylen oxi|ethylen oxi/.test(normalized)) return 'pesticide';
  if (/3-mcpd|glycidyl|litarefni|efna|tox|eitur/.test(normalized)) return 'chemical';
  if (/vanmerkt|omerkt|merking/.test(normalized)) return 'labeling';
  if (/thranun|skemmd|gaedi|leyfi/.test(normalized)) return 'quality';
  return 'other';
}

function inferAffectedProduct(title: string, summary: string): string {
  const source = `${title}. ${summary}`;
  const patterns = [
    /\b(?:af|á|a)\s+([^,.]+?)\s+(?:frá|sem|vegna|er|,|\.)/i,
    /\b(?:neyslu á|við)\s+([^,.]+?)\s+(?:frá|sem|vegna|er|,|\.)/i
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern)?.[1]?.trim();
    if (match && match.length >= 3) return match;
  }
  return title;
}

function textFromTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  const value = match?.[1] ?? '';
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function isoDateOrEmpty(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '';
}

function stableAlertId(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `mast-is-${slug || 'unknown'}`;
}

function normalizedSearchText(value: string): string {
  return value
    .toLocaleLowerCase('is-IS')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th');
}

function firstMatch(value: string, pattern: RegExp): string {
  return value.match(pattern)?.[1]?.trim() ?? '';
}
