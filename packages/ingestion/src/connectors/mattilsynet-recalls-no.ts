export const MATTILSYNET_RECALLS_URL = 'https://www.mattilsynet.no/tilbakekallinger';
export const MATTILSYNET_RECALL_SOURCE = 'mattilsynet.no';

export type FoodSafetyAlertRow = {
  table: 'food_safety_alert';
  alertId: string;
  countryCode: 'NO';
  source: typeof MATTILSYNET_RECALL_SOURCE;
  title: string;
  url: string;
  category: 'food_recall';
  publishedAt: string | null;
  retrievedAt: string;
  raw: unknown;
};

export type FoodSafetyAlertStore = {
  upsertFoodSafetyAlerts(rows: FoodSafetyAlertRow[]): Promise<void>;
};

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  headers?: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

export type FetchMattilsynetRecallsOptions = {
  feedUrl?: string;
  fetchImpl?: FetchLike;
  retrievedAt?: string | Date;
  store?: FoodSafetyAlertStore;
};

type RecallCandidate = {
  title?: unknown;
  name?: unknown;
  heading?: unknown;
  url?: unknown;
  href?: unknown;
  link?: unknown;
  publishedAt?: unknown;
  date?: unknown;
};

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function timestamp(value: string | Date | undefined): string {
  const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('retrievedAt must be a valid date.');
  return date.toISOString();
}

function absoluteUrl(value: string): string {
  return new URL(value, MATTILSYNET_RECALLS_URL).toString();
}

function alertId(url: string): string {
  const parsed = new URL(url);
  return parsed.pathname.split('/').filter(Boolean).pop() ?? parsed.pathname;
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&aring;/gi, 'å')
    .replace(/&oslash;/gi, 'ø')
    .replace(/&aelig;/gi, 'æ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function collectJsonCandidates(value: unknown): RecallCandidate[] {
  if (Array.isArray(value)) return value.flatMap(collectJsonCandidates);
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const candidate = record as RecallCandidate;
  if ((candidate.title || candidate.name || candidate.heading) && (candidate.url || candidate.href || candidate.link)) return [candidate];
  return ['items', 'results', 'data', 'recalls', 'tilbakekallinger'].flatMap((key) => collectJsonCandidates(record[key]));
}

function parseHtmlCandidates(html: string): RecallCandidate[] {
  const candidates: RecallCandidate[] = [];
  const anchorPattern = /<a\s+[^>]*href=["']([^"']*\/tilbakekallinger\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    const title = decodeHtml(match[2]);
    if (title) candidates.push({ title, url: absoluteUrl(match[1]) });
  }
  return candidates;
}

function candidateToAlert(candidate: RecallCandidate, retrievedAt: string): FoodSafetyAlertRow | null {
  const title = text(candidate.title) ?? text(candidate.name) ?? text(candidate.heading);
  const url = text(candidate.url) ?? text(candidate.href) ?? text(candidate.link);
  if (!title || !url) return null;
  const absolute = absoluteUrl(url);
  return {
    table: 'food_safety_alert',
    alertId: alertId(absolute),
    countryCode: 'NO',
    source: MATTILSYNET_RECALL_SOURCE,
    title,
    url: absolute,
    category: 'food_recall',
    publishedAt: text(candidate.publishedAt) ?? text(candidate.date) ?? null,
    retrievedAt,
    raw: candidate
  };
}

export function parseMattilsynetRecallFeed(payload: unknown, options: { retrievedAt?: string | Date } = {}): FoodSafetyAlertRow[] {
  const retrievedAt = timestamp(options.retrievedAt);
  const candidates = typeof payload === 'string' ? parseHtmlCandidates(payload) : collectJsonCandidates(payload);
  const seen = new Set<string>();
  return candidates.flatMap((candidate) => {
    const alert = candidateToAlert(candidate, retrievedAt);
    if (!alert || seen.has(alert.alertId)) return [];
    seen.add(alert.alertId);
    return [alert];
  });
}

export async function fetchMattilsynetRecallAlerts(options: FetchMattilsynetRecallsOptions = {}): Promise<FoodSafetyAlertRow[]> {
  const fetcher = options.fetchImpl ?? (globalThis as { fetch?: FetchLike }).fetch;
  if (!fetcher) throw new Error('fetch is required for Mattilsynet recall ingestion.');

  const response = await fetcher(options.feedUrl ?? MATTILSYNET_RECALLS_URL, {
    headers: { accept: 'application/json, text/html;q=0.9' }
  });
  if (!response.ok) throw new Error(`Mattilsynet recall feed failed with status ${response.status}.`);

  const contentType = response.headers?.get('content-type') ?? '';
  const payload = contentType.includes('json') ? await response.json() : await response.text();
  const rows = parseMattilsynetRecallFeed(payload, { retrievedAt: options.retrievedAt });
  if (options.store) await options.store.upsertFoodSafetyAlerts(rows);
  return rows;
}
