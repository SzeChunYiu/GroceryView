export type MastFoodSafetyAlertRow = {
  countryCode: 'IS';
  language: 'is';
  publishedDate: string;
  retrievedAt: string;
  rowType: 'food_safety_alert';
  sourceAuthority: 'MAST';
  sourceUrl: string;
  summary?: string;
  title: string;
};

export type FetchMastFoodSafetyAlertsOptions = {
  fetchImpl?: typeof fetch;
  includeDetails?: boolean;
  listingUrl?: string;
  maxRows?: number;
  retrievedAt?: string;
};

export const MAST_RECALLS_IS_URL = 'https://www.mast.is/is/um-mast/frettir/innkallanir';
export const MAST_SOURCE_AUTHORITY = 'MAST';

const USER_AGENT = 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)';

export async function fetchMastFoodSafetyAlerts(
  options: FetchMastFoodSafetyAlertsOptions = {}
): Promise<MastFoodSafetyAlertRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const listingUrl = options.listingUrl ?? MAST_RECALLS_IS_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 100;
  const response = await fetchImpl(listingUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`MAST recalls request failed: ${response.status}`);
  }

  const html = await response.text();
  const alerts = parseMastRecallListing(html, { listingUrl, maxRows, retrievedAt });

  if (!options.includeDetails) {
    return alerts;
  }

  return Promise.all(alerts.map(async (alert) => {
    const summary = await fetchMastRecallSummary(fetchImpl, alert.sourceUrl);
    return summary ? { ...alert, summary } : alert;
  }));
}

export function parseMastRecallListing(
  html: string,
  context: { listingUrl?: string; maxRows?: number; retrievedAt?: string } = {}
): MastFoodSafetyAlertRow[] {
  const listingUrl = context.listingUrl ?? MAST_RECALLS_IS_URL;
  const retrievedAt = context.retrievedAt ?? new Date().toISOString();
  const maxRows = context.maxRows ?? 100;
  const rows: MastFoodSafetyAlertRow[] = [];
  const seenUrls = new Set<string>();
  const recallLinkPattern = /<h3[^>]*>\s*<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h3>\s*([\s\S]{0,240}?)(\d{2}\.\d{2}\.\d{4})/gi;

  for (const match of html.matchAll(recallLinkPattern)) {
    const title = normalizeText(stripTags(match[2] ?? ''));
    const publishedDate = parseIcelandicDate(match[4] ?? '');
    const sourceUrl = absolutizeMastUrl(match[1] ?? '', listingUrl);
    if (!title || !publishedDate || !sourceUrl || seenUrls.has(sourceUrl)) {
      continue;
    }

    seenUrls.add(sourceUrl);
    rows.push({
      countryCode: 'IS',
      language: 'is',
      publishedDate,
      retrievedAt,
      rowType: 'food_safety_alert',
      sourceAuthority: MAST_SOURCE_AUTHORITY,
      sourceUrl,
      title
    });

    if (rows.length >= maxRows) {
      break;
    }
  }

  return rows;
}

async function fetchMastRecallSummary(fetchImpl: typeof fetch, sourceUrl: string): Promise<string | undefined> {
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': USER_AGENT
    }
  });

  if (!response.ok) {
    return undefined;
  }

  return extractMastRecallSummary(await response.text());
}

export function extractMastRecallSummary(html: string): string | undefined {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const paragraphPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;

  for (const match of main.matchAll(paragraphPattern)) {
    const text = normalizeText(stripTags(match[1] ?? ''));
    if (text.length >= 40 && !/^Getum við bætt/i.test(text)) {
      return text;
    }
  }

  return undefined;
}

function parseIcelandicDate(value: string): string | undefined {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function absolutizeMastUrl(href: string, baseUrl: string): string | undefined {
  try {
    return new URL(htmlDecode(href), baseUrl).toString();
  } catch {
    return undefined;
  }
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ');
}

function normalizeText(value: string): string {
  return htmlDecode(value).replace(/\s+/g, ' ').trim();
}

function htmlDecode(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
