import { createHash } from 'node:crypto';

export const BEST_NO_LEGACY_URL = 'https://best.no/';
export const BEST_NO_CURRENT_URL = 'https://beststasjon.no/';
export const BEST_NO_PARSER_VERSION = 'best-no-legacy-yx-v1';

export type BestNoConnectorRow = {
  id: string;
  chain: 'best-no';
  country: 'NO';
  currency: 'NOK';
  domain: 'fuel' | 'convenience';
  category: 'legacy_brand_status' | 'fuel_station_services' | 'station_food' | 'member_fuel_benefit';
  product: string;
  price: null;
  unit: 'metadata';
  customerSegment: 'consumer';
  channel: 'station';
  brandStatus: 'legacy_best_rebranded_to_yx' | 'active_best_station';
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    parserVersion: string;
    evidenceText: string;
    contentDigest: string;
  };
};

export type FetchBestNoRowsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export async function fetchBestNoRows(options: FetchBestNoRowsOptions = {}): Promise<BestNoConnectorRow[]> {
  const sourceUrl = options.sourceUrl ?? BEST_NO_CURRENT_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 best-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Best NO source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Best NO source failed with HTTP ${response.status}.`);
  return parseBestNoRows({ html: await response.text(), sourceUrl, retrievedAt: options.retrievedAt ?? new Date().toISOString() });
}

export function parseBestNoRows(input: { html: string; sourceUrl?: string; retrievedAt: string }): BestNoConnectorRow[] {
  const sourceUrl = input.sourceUrl ?? BEST_NO_CURRENT_URL;
  assertBestSource(sourceUrl);
  const text = textFromHtml(input.html);
  if (/captcha|access denied|cloudflare|logg inn/i.test(text)) throw new Error('Best NO source returned a blocked/login page.');

  const brandEvidence = requireEvidence(text, /Best stasjonene omprofileres til YX|omprofilert fra Best til YX|Best til YX/i, 'Best to YX brand status');
  const fuelEvidence = requireEvidence(text, /drivstoff|95 Blyfri|98 Blyfri|Diesel|Avgiftsfri Diesel|HVO 100|AdBlue/i, 'fuel station services');
  const foodEvidence = requireEvidence(text, /mat og drikke|kaffe|YX-appen|bestille mat/i, 'station food and drink');
  const memberEvidence = text.match(/Coop-medlem[^.]*bonus på drivstoff|medlemsfordeler/i)?.[0] ?? '';

  const rows = [
    metadataRow({
      id: 'best-no-legacy-brand-status',
      domain: 'fuel',
      category: 'legacy_brand_status',
      product: 'Best Norway legacy station brand status',
      sourceUrl,
      retrievedAt: input.retrievedAt,
      html: input.html,
      evidenceText: brandEvidence
    }),
    metadataRow({
      id: 'best-no-fuel-station-services',
      domain: 'fuel',
      category: 'fuel_station_services',
      product: 'Best / YX Norway station fuel services',
      sourceUrl,
      retrievedAt: input.retrievedAt,
      html: input.html,
      evidenceText: fuelEvidence
    }),
    metadataRow({
      id: 'best-no-station-food',
      domain: 'convenience',
      category: 'station_food',
      product: 'Best / YX Norway station food and drink',
      sourceUrl,
      retrievedAt: input.retrievedAt,
      html: input.html,
      evidenceText: foodEvidence
    })
  ];

  if (memberEvidence) {
    rows.push(metadataRow({
      id: 'best-no-coop-member-fuel-benefit',
      domain: 'fuel',
      category: 'member_fuel_benefit',
      product: 'Best / YX Norway Coop member fuel benefit',
      sourceUrl,
      retrievedAt: input.retrievedAt,
      html: input.html,
      evidenceText: memberEvidence
    }));
  }

  return rows;
}

function metadataRow(input: {
  id: string;
  domain: BestNoConnectorRow['domain'];
  category: BestNoConnectorRow['category'];
  product: string;
  sourceUrl: string;
  retrievedAt: string;
  html: string;
  evidenceText: string;
}): BestNoConnectorRow {
  return {
    id: input.id,
    chain: 'best-no',
    country: 'NO',
    currency: 'NOK',
    domain: input.domain,
    category: input.category,
    product: input.product,
    price: null,
    unit: 'metadata',
    customerSegment: 'consumer',
    channel: 'station',
    brandStatus: /best\s+til\s+yx|omprofil/i.test(input.evidenceText) ? 'legacy_best_rebranded_to_yx' : 'active_best_station',
    sourceUrl: input.sourceUrl,
    retrievedAt: input.retrievedAt,
    provenance: {
      parserVersion: BEST_NO_PARSER_VERSION,
      evidenceText: input.evidenceText,
      contentDigest: createHash('sha256').update(input.html).digest('hex')
    }
  };
}

function assertBestSource(sourceUrl: string) {
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '');
  if (!['best.no', 'beststasjon.no', 'yx.no'].includes(hostname)) {
    throw new Error('Best NO connector only accepts best.no, beststasjon.no, or yx.no source URLs.');
  }
}

function requireEvidence(text: string, pattern: RegExp, label: string): string {
  const match = text.match(pattern);
  if (!match) throw new Error(`Best NO source missing evidence for ${label}.`);
  return match[0];
}

function textFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&oslash;/g, 'ø')
    .replace(/&aring;/g, 'å')
    .replace(/&aelig;/g, 'æ')
    .replace(/\s+/g, ' ')
    .trim();
}
