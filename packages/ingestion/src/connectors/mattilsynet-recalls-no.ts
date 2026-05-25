export type MattilsynetRecallHazard =
  | 'allergen'
  | 'foreign_body'
  | 'microbiological'
  | 'pesticide'
  | 'chemical'
  | 'labeling'
  | 'quality'
  | 'other';

export type MattilsynetFoodSafetyAlert = {
  country: 'NO';
  authority: 'Mattilsynet';
  kind: 'food_safety_alert';
  alertId: string;
  title: string;
  summary: string;
  publishedAt: string;
  sourceUrl: string;
  guid: string;
  categories: string[];
  hazard: MattilsynetRecallHazard;
  affectedProduct: string;
  retrievedAt: string;
};

export type FetchMattilsynetFoodSafetyAlertsOptions = {
  fetchImpl?: typeof fetch;
  feedUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export const MATTILSYNET_RECALLS_NO_FEED_URL = 'https://www.mattilsynet.no/rss/subscription';
export const MATTILSYNET_RECALLS_NO_LISTING_URL = 'https://www.mattilsynet.no/tilbakekallinger';

export async function fetchMattilsynetFoodSafetyAlerts(options: FetchMattilsynetFoodSafetyAlertsOptions = {}): Promise<MattilsynetFoodSafetyAlert[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const feedUrl = options.feedUrl ?? MATTILSYNET_RECALLS_NO_FEED_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(feedUrl, {
    headers: {
      accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'user-agent': 'GroceryView/0.1 Mattilsynet Norway recalls (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`Mattilsynet NO recalls feed request failed: ${response.status}`);
  const rows = parseMattilsynetFoodSafetyAlerts(await response.text(), retrievedAt, feedUrl);
  if (rows.length === 0) throw new Error('Mattilsynet NO recalls feed returned no food_safety_alert rows.');
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseMattilsynetFoodSafetyAlerts(xml: string, retrievedAt: string, feedUrl = MATTILSYNET_RECALLS_NO_FEED_URL): MattilsynetFoodSafetyAlert[] {
  return Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi))
    .map((match) => parseMattilsynetRecallItem(match[1], retrievedAt, feedUrl))
    .filter((row): row is MattilsynetFoodSafetyAlert => row !== null);
}

function parseMattilsynetRecallItem(itemXml: string, retrievedAt: string, feedUrl: string): MattilsynetFoodSafetyAlert | null {
  const title = decodeXml(textFromTag(itemXml, 'title'));
  const summary = stripHtml(decodeXml(textFromTag(itemXml, 'description')));
  const pubDate = decodeXml(textFromTag(itemXml, 'pubDate'));
  const publishedAt = isoDateOrEmpty(pubDate);
  const sourceUrl = decodeXml(textFromTag(itemXml, 'link')) || feedUrl;
  const guid = decodeXml(textFromTag(itemXml, 'guid')) || sourceUrl;
  const extraType = decodeXml(textFromTag(itemXml, 'nl:extra1'));
  const categories = tagsFromXml(itemXml, 'category').map(decodeXml);

  if (!title || !publishedAt || !sourceUrl) return null;
  if (extraType !== 'Tilbakekalling' && !sourceUrl.includes('/tilbakekallinger/')) return null;
  if (!categories.some((category) => category === 'mat' || category.startsWith('mat/'))) return null;

  const evidence = `${title} ${summary}`;
  return {
    country: 'NO',
    authority: 'Mattilsynet',
    kind: 'food_safety_alert',
    alertId: stableAlertId(guid || sourceUrl || title),
    title,
    summary,
    publishedAt,
    sourceUrl,
    guid,
    categories,
    hazard: classifyMattilsynetRecallHazard(evidence),
    affectedProduct: inferAffectedProduct(title, summary),
    retrievedAt
  };
}

export function classifyMattilsynetRecallHazard(value: string): MattilsynetRecallHazard {
  const normalized = normalizedSearchText(value);
  if (/allergen|allergi|allergener|soya|gluten|melk|sulfitt|sennep|nott|notter|mandel/.test(normalized)) return 'allergen';
  if (/metall|glass|plast|skrue|skruer|smastein|fremmedlegem|fremmedlegeme/.test(normalized)) return 'foreign_body';
  if (/listeria|salmonella|e\.?\s*coli|bakter|mugg|helsefare|smitte/.test(normalized)) return 'microbiological';
  if (/plantevernmiddel|pesticid|meldroye|ergot/.test(normalized)) return 'pesticide';
  if (/kadmium|bly|kvikksolv|tungmetall|gift|for hoyt innhold|uonskede stoffer/.test(normalized)) return 'chemical';
  if (/feilmerket|manglende merking|merking|deklarert/.test(normalized)) return 'labeling';
  if (/kvalitet|bedervet|avvik|best for/.test(normalized)) return 'quality';
  return 'other';
}

function inferAffectedProduct(title: string, summary: string): string {
  const source = `${title}. ${summary}`;
  const patterns = [
    /\btilbakekaller\s+([^,.]+?)(?:\s+på grunn|\s+pga|,|\.)/i,
    /\bkaller tilbake\s+([^,.]+?)(?:\s+på grunn|\s+pga|,|\.)/i,
    /\btilbake\s+([^,.]+?)(?:\s+på grunn|\s+pga|,|\.)/i
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern)?.[1]?.replace(/^"|"$/g, '').trim();
    if (match && match.length >= 3) return match;
  }
  return title;
}

function textFromTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  const value = match?.[1] ?? '';
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function tagsFromXml(xml: string, tag: string): string[] {
  return Array.from(xml.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')))
    .map((match) => match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim())
    .filter(Boolean);
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
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `mattilsynet-no-${slug || 'unknown'}`;
}

function normalizedSearchText(value: string): string {
  return value
    .toLocaleLowerCase('nb-NO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a');
}
