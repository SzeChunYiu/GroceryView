export type LivsmedelsverketRecallHazard =
  | 'allergen'
  | 'foreign_body'
  | 'microbiological'
  | 'chemical'
  | 'pesticide'
  | 'labeling'
  | 'quality'
  | 'other';

export type LivsmedelsverketFoodSafetyAlert = {
  country: 'SE';
  authority: 'Livsmedelsverket';
  kind: 'food_safety_alert';
  alertId: string;
  title: string;
  summary: string;
  publishedAt: string;
  sourceUrl: string;
  guid: string;
  hazard: LivsmedelsverketRecallHazard;
  affectedProduct: string;
  retrievedAt: string;
};

export type FetchLivsmedelsverketFoodSafetyAlertsOptions = {
  fetchImpl?: typeof fetch;
  feedUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export const LIVSMEDELSVERKET_RECALLS_SE_FEED_URL = 'https://www.livsmedelsverket.se/rss/rss-aterkallanden/';
export const LIVSMEDELSVERKET_RECALLS_SE_LISTING_URL = 'https://www.livsmedelsverket.se/om-oss/press/aterkallanden';

export async function fetchLivsmedelsverketFoodSafetyAlerts(
  options: FetchLivsmedelsverketFoodSafetyAlertsOptions = {}
): Promise<LivsmedelsverketFoodSafetyAlert[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const feedUrl = options.feedUrl ?? LIVSMEDELSVERKET_RECALLS_SE_FEED_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(feedUrl, {
    headers: {
      accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'user-agent': 'GroceryView/0.1 Livsmedelsverket recalls (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`Livsmedelsverket recalls feed request failed: ${response.status}`);
  const rows = parseLivsmedelsverketFoodSafetyAlerts(await response.text(), retrievedAt, feedUrl);
  if (rows.length === 0) throw new Error('Livsmedelsverket recalls feed returned no food_safety_alert rows.');
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseLivsmedelsverketFoodSafetyAlerts(
  xml: string,
  retrievedAt: string,
  feedUrl = LIVSMEDELSVERKET_RECALLS_SE_FEED_URL
): LivsmedelsverketFoodSafetyAlert[] {
  return Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi))
    .map((match) => parseLivsmedelsverketRecallItem(match[1], retrievedAt, feedUrl))
    .filter((row): row is LivsmedelsverketFoodSafetyAlert => row !== null);
}

function parseLivsmedelsverketRecallItem(itemXml: string, retrievedAt: string, feedUrl: string): LivsmedelsverketFoodSafetyAlert | null {
  const title = decodeXml(textFromTag(itemXml, 'title'));
  const summary = stripHtml(decodeXml(textFromTag(itemXml, 'description')));
  const publishedAt = isoDateOrEmpty(decodeXml(textFromTag(itemXml, 'pubDate')));
  const sourceUrl = decodeXml(textFromTag(itemXml, 'link')) || feedUrl;
  const guid = decodeXml(textFromTag(itemXml, 'guid')) || sourceUrl;

  if (!title || !publishedAt || !sourceUrl) return null;

  const evidence = `${title} ${summary}`;
  return {
    country: 'SE',
    authority: 'Livsmedelsverket',
    kind: 'food_safety_alert',
    alertId: stableAlertId(guid || sourceUrl || title),
    title,
    summary,
    publishedAt,
    sourceUrl,
    guid,
    hazard: classifyLivsmedelsverketRecallHazard(evidence),
    affectedProduct: inferAffectedProduct(title, summary),
    retrievedAt
  };
}

export function classifyLivsmedelsverketRecallHazard(value: string): LivsmedelsverketRecallHazard {
  const normalized = normalizedSearchText(value);
  if (/allergen|allergi|odeklarerad|odeklarerat|inte deklarer|mjolk|gluten|not|jordnot|mandel|hasselnot|sesam|soja|agg|raka|kraftdjur/.test(normalized)) return 'allergen';
  if (/salmonella|listeria|e\.?\s*coli|campylobacter|bakter|mikrobiolog|mogel|mögel/.test(normalized)) return 'microbiological';
  if (/frammande foremal|glas|metall|plastbit|gummibit|foreign body/.test(normalized)) return 'foreign_body';
  if (/bekampningsmedel|pesticid|klorpyrifos|etylenoxid/.test(normalized)) return 'pesticide';
  if (/for hoga halter|gift|tox|kemisk|bly|kadmium|metall/.test(normalized)) return 'chemical';
  if (/felmarkt|felmarkning|markning|bast fore|vilseled/.test(normalized)) return 'labeling';
  if (/kvalitet|forstord|smak|lukt/.test(normalized)) return 'quality';
  return 'other';
}

function inferAffectedProduct(title: string, summary: string): string {
  const candidates = [
    title.match(/återkallar\s+(.+?)(?:\s+-|\s+av\s+säkerhetsskäl|\s+efter|\s+då|\(|$)/i)?.[1],
    summary.match(/återkallar\s+(.+?)(?:\.|\s+av\s+märket|\s+då|\s+efter|$)/i)?.[1],
    title.match(/varnar.*?(?:för|om)\s+(.+?)(?:\s+-|\.|$)/i)?.[1]
  ];
  return candidates.map((candidate) => candidate?.trim()).find((candidate): candidate is string => Boolean(candidate && candidate.length >= 3)) ?? title;
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
    .replace(/^\uFEFF/, '')
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
  const timestamp = Date.parse(value.replace(/\s+Z$/, ' GMT'));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '';
}

function stableAlertId(value: string): string {
  const slug = normalizedSearchText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `livsmedelsverket-se-${slug || 'unknown'}`;
}

function normalizedSearchText(value: string): string {
  return value
    .toLocaleLowerCase('sv-SE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o');
}
