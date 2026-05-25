export const ACTION_SE_SOURCE_URL = 'https://www.action.com/';
export const ACTION_SE_PARSER_VERSION = 'action-se-presence-check-v1';

export type ActionSePresenceStatus = {
  chain: 'action';
  country: 'SE';
  currency: 'SEK';
  retailer_type: 'variety';
  status: 'no_se_presence_yet';
  qualifiesForConnector: false;
  checkedAt: string;
  sourceUrl: string;
  evidence: string;
  caveat: string;
};

export type FetchActionSePresenceOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  checkedAt?: string;
};

const SWEDEN_COUNTRY_LABELS = /\b(?:Sweden|Sverige|sv-SE|svenska)\b/i;
const ACTION_MARKET_LABELS = /\b(?:Nederland|Belgique|Deutschland|France|Luxembourg|Polska|Portugal|Česká republika|Italia|España|Slovensko|România|Schweiz|Hrvatska)\b/i;

export async function fetchActionSePresence(options: FetchActionSePresenceOptions = {}): Promise<ActionSePresenceStatus> {
  const sourceUrl = options.sourceUrl ?? ACTION_SE_SOURCE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 action-se-presence-check (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Action SE presence source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Action SE presence source failed with HTTP ${response.status}.`);
  return parseActionSePresence(await response.text(), options.checkedAt ?? new Date().toISOString(), sourceUrl);
}

export function parseActionSePresence(html: string, checkedAt: string, sourceUrl = ACTION_SE_SOURCE_URL): ActionSePresenceStatus {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logga in/i.test(text)) throw new Error('Action SE presence source returned a blocked/login page.');
  if (!/Action/i.test(text) || !ACTION_MARKET_LABELS.test(text)) throw new Error('Action country-selector evidence missing from source.');
  if (SWEDEN_COUNTRY_LABELS.test(text)) throw new Error('Action SE presence now appears in the source; implement a store connector before emitting rows.');

  return {
    chain: 'action',
    country: 'SE',
    currency: 'SEK',
    retailer_type: 'variety',
    status: 'no_se_presence_yet',
    qualifiesForConnector: false,
    checkedAt,
    sourceUrl,
    evidence: 'Official Action country selector lists active European markets but does not list Sweden/Sverige or a sv-SE locale.',
    caveat: 'No product or store rows are emitted until Action publishes Swedish store presence on action.com.'
  };
}

export function buildActionSeRows(): never[] {
  return [];
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
