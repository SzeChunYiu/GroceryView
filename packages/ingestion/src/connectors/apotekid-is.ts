export const APOTEKID_IS_BASE_URL = 'https://www.apotekid.is/';
export const APOTEKID_IS_REDIRECT_TARGET_URL = 'https://www.lyfja.is/';
export const APOTEKID_IS_PARSER_VERSION = 'apotekid-is-official-redirect-v1';

export type ApotekidIsCatalogueStatus = {
  chain: 'apotekid-is';
  chainName: 'Apótekið';
  country: 'IS';
  retailerType: 'pharmacy';
  status: 'verified_official_redirect_to_lyfja';
  qualifiesForOnlinePriceConnector: false;
  sourceUrl: string;
  redirectTargetUrl: string;
  retrievedAt: string;
  caveat: string;
  provenance: {
    source: 'apotekid_is_official_redirect';
    parserVersion: typeof APOTEKID_IS_PARSER_VERSION;
    evidenceText: string;
  };
};

export type FetchApotekidIsCatalogueStatusOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export async function fetchApotekidIsCatalogueStatus(
  options: FetchApotekidIsCatalogueStatusOptions = {}
): Promise<ApotekidIsCatalogueStatus> {
  const sourceUrl = options.sourceUrl ?? APOTEKID_IS_BASE_URL;
  assertApotekidSource(sourceUrl);

  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 apotekid-is-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Apótekið IS source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Apótekið IS source failed with HTTP ${response.status}.`);

  return parseApotekidIsCatalogueStatus({
    sourceUrl,
    finalUrl: response.url || sourceUrl,
    html: await response.text(),
    retrievedAt: options.retrievedAt ?? new Date().toISOString()
  });
}

export function parseApotekidIsCatalogueStatus(input: {
  sourceUrl: string;
  finalUrl: string;
  html: string;
  retrievedAt: string;
}): ApotekidIsCatalogueStatus {
  assertApotekidSource(input.sourceUrl);
  const finalUrl = normalizedUrl(input.finalUrl || input.sourceUrl);
  const text = textFromHtml(input.html);

  if (/captcha|access denied|cloudflare|innskr[aá]|logg/i.test(text)) {
    throw new Error('Apótekið IS source returned a blocked/login page.');
  }
  if (!isLyfjaUrl(finalUrl)) {
    throw new Error('Apótekið IS source did not redirect to the verified Lyfja target.');
  }
  if (!/Lyfja|ap[óo]tek|lyfj/i.test(text)) {
    throw new Error('Apótekið IS redirect target did not contain pharmacy evidence.');
  }

  return {
    chain: 'apotekid-is',
    chainName: 'Apótekið',
    country: 'IS',
    retailerType: 'pharmacy',
    status: 'verified_official_redirect_to_lyfja',
    qualifiesForOnlinePriceConnector: false,
    sourceUrl: APOTEKID_IS_BASE_URL,
    redirectTargetUrl: finalUrl,
    retrievedAt: input.retrievedAt,
    caveat: 'The official apotekid.is domain redirects to Lyfja, so this connector records Apótekið as a verified legacy/alias pharmacy source and does not emit separate Apótekið product prices.',
    provenance: {
      source: 'apotekid_is_official_redirect',
      parserVersion: APOTEKID_IS_PARSER_VERSION,
      evidenceText: evidenceSnippet(text)
    }
  };
}

export function verifyApotekidIsCatalogueStatus(retrievedAt = new Date().toISOString()): ApotekidIsCatalogueStatus {
  return {
    chain: 'apotekid-is',
    chainName: 'Apótekið',
    country: 'IS',
    retailerType: 'pharmacy',
    status: 'verified_official_redirect_to_lyfja',
    qualifiesForOnlinePriceConnector: false,
    sourceUrl: APOTEKID_IS_BASE_URL,
    redirectTargetUrl: APOTEKID_IS_REDIRECT_TARGET_URL,
    retrievedAt,
    caveat: 'The official apotekid.is domain redirects to Lyfja, so this connector records Apótekið as a verified legacy/alias pharmacy source and does not emit separate Apótekið product prices.',
    provenance: {
      source: 'apotekid_is_official_redirect',
      parserVersion: APOTEKID_IS_PARSER_VERSION,
      evidenceText: 'apotekid.is redirects to lyfja.is'
    }
  };
}

function assertApotekidSource(sourceUrl: string): void {
  const host = new URL(sourceUrl).hostname;
  if (host !== 'apotekid.is' && host !== 'www.apotekid.is') {
    throw new Error('Apótekið connector only accepts apotekid.is source URLs.');
  }
}

function isLyfjaUrl(value: string): boolean {
  const host = new URL(value).hostname;
  return host === 'lyfja.is' || host === 'www.lyfja.is';
}

function normalizedUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.toString();
}

function evidenceSnippet(text: string): string {
  const match = text.match(/Lyfja[^.]{0,180}/i) ?? text.match(/ap[óo]tek[^.]{0,180}/i);
  return (match?.[0] ?? text).slice(0, 240).trim();
}

function textFromHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}
