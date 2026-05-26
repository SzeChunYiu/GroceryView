import { createHash } from 'node:crypto';

export const TANKA_SE_HOME_URL = 'https://www.tanka.se/';
export const TANKA_SE_CARPAY_URL = 'https://tanka.se/carpay';
export const TANKA_SE_PARSER_VERSION = 'tanka-se-pricing-quirks-v1';

type TankaSeSourceKind = 'station_price_notice' | 'carpay_fuel_discount';

export type TankaSePricingQuirkRow = {
  id: string;
  domain: 'fuel';
  chainId: 'tanka-se';
  operatorName: 'Tanka';
  country: 'SE';
  kind: TankaSeSourceKind;
  channel: 'store';
  productScope: 'fuel';
  storePriceSource: 'local_station_price_sign';
  requiresStoreId: boolean;
  is_member_price: boolean;
  membershipProgram?: 'CarPay';
  discountAmountSekPerLitre?: number;
  is_subscription_price: false;
  is_coupon_price: false;
  is_clearance: false;
  observedAt: string;
  sourceUrl: string;
  provenance: {
    source: 'tanka_se_pricing_quirks';
    parserVersion: string;
    sourceUrl: string;
    contentDigest: string;
    matchedText: string;
  };
};

type TankaSeSourcePage = {
  sourceUrl: string;
  html: string;
};

function contentDigest(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function decodeHtmlText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&auml;/g, 'ä')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&aring;/g, 'å')
    .replace(/&Aring;/g, 'Å')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertTankaSource(sourceUrl: string) {
  const url = new URL(sourceUrl);
  if (url.hostname !== 'tanka.se' && url.hostname !== 'www.tanka.se') {
    throw new Error('Tanka SE connector only accepts tanka.se source URLs.');
  }
}

function appBundleUrls(html: string, sourceUrl: string) {
  return [...html.matchAll(/<script\b[^>]+\bsrc=["']([^"']*resources\/app\.[^"']+\.js)["'][^>]*>/gi)]
    .map((match) => new URL(match[1]!, sourceUrl).toString());
}

function parseOrePerLitre(text: string) {
  const match = text.match(/(\d+)\s*öre\s+per\s+liter/i);
  if (!match) return undefined;
  return Math.round((Number(match[1]) / 100 + Number.EPSILON) * 100) / 100;
}

function rowBase(input: {
  id: string;
  kind: TankaSeSourceKind;
  observedAt: string;
  page: TankaSeSourcePage;
  matchedText: string;
}): Omit<TankaSePricingQuirkRow, 'requiresStoreId' | 'is_member_price'> {
  return {
    id: input.id,
    domain: 'fuel',
    chainId: 'tanka-se',
    operatorName: 'Tanka',
    country: 'SE',
    kind: input.kind,
    channel: 'store',
    productScope: 'fuel',
    storePriceSource: 'local_station_price_sign',
    is_subscription_price: false,
    is_coupon_price: false,
    is_clearance: false,
    observedAt: input.observedAt,
    sourceUrl: input.page.sourceUrl,
    provenance: {
      source: 'tanka_se_pricing_quirks',
      parserVersion: TANKA_SE_PARSER_VERSION,
      sourceUrl: input.page.sourceUrl,
      contentDigest: contentDigest(input.page.html),
      matchedText: input.matchedText
    }
  };
}

export function parseTankaSePricingQuirks(input: {
  pages: TankaSeSourcePage[];
  observedAt: string;
}): TankaSePricingQuirkRow[] {
  const rows: TankaSePricingQuirkRow[] = [];
  const seen = new Set<string>();

  for (const page of input.pages) {
    assertTankaSource(page.sourceUrl);
    const text = decodeHtmlText(page.html);
    if (/captcha|access denied|logga in/i.test(text)) throw new Error('Tanka SE source returned a blocked/login page.');

    const priceNotice = text.match(/Vi publicerar inte längre rekommenderade drivmedelspriser på hemsidan men du hittar alltid aktuellt pris på prisskylten på din lokala Tankastation\.?/i);
    if (priceNotice && !seen.has('station-local-price-sign')) {
      seen.add('station-local-price-sign');
      rows.push({
        ...rowBase({
          id: 'tanka-se-station-local-price-sign',
          kind: 'station_price_notice',
          observedAt: input.observedAt,
          page,
          matchedText: priceNotice[0]
        }),
        requiresStoreId: true,
        is_member_price: false
      });
    }

    const carpayDiscountText = text.match(/Hos Tanka har du alltid\s+\d+\s*öre per liter i rabatt[^.]*\./i);
    const discountAmountSekPerLitre = carpayDiscountText ? parseOrePerLitre(carpayDiscountText[0]) : undefined;
    if (carpayDiscountText && discountAmountSekPerLitre !== undefined && !seen.has('carpay-fuel-discount')) {
      seen.add('carpay-fuel-discount');
      rows.push({
        ...rowBase({
          id: 'tanka-se-carpay-fuel-discount',
          kind: 'carpay_fuel_discount',
          observedAt: input.observedAt,
          page,
          matchedText: carpayDiscountText[0]
        }),
        requiresStoreId: true,
        is_member_price: true,
        membershipProgram: 'CarPay',
        discountAmountSekPerLitre
      });
    }
  }

  return rows;
}

export async function fetchTankaSePricingQuirks(options: {
  fetchImpl?: typeof fetch;
  observedAt?: string;
  sourceUrls?: string[];
} = {}): Promise<TankaSePricingQuirkRow[]> {
  const sourceUrls = options.sourceUrls ?? [TANKA_SE_HOME_URL, TANKA_SE_CARPAY_URL];
  const fetchImpl = options.fetchImpl ?? fetch;
  const pages: TankaSeSourcePage[] = [];

  for (const sourceUrl of sourceUrls) {
    assertTankaSource(sourceUrl);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 tanka-se-pricing-quirks-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Tanka SE source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Tanka SE source failed with HTTP ${response.status}.`);
    const html = await response.text();
    pages.push({ sourceUrl, html });

    for (const bundleUrl of appBundleUrls(html, sourceUrl)) {
      const bundleResponse = await fetchImpl(bundleUrl, {
        headers: {
          accept: 'application/javascript,text/javascript',
          'user-agent': 'GroceryView/0.1 tanka-se-pricing-quirks-connector (+https://github.com/SzeChunYiu/GroceryView)'
        }
      });
      if (bundleResponse.ok) pages.push({ sourceUrl: bundleUrl, html: await bundleResponse.text() });
    }
  }

  return parseTankaSePricingQuirks({ pages, observedAt: options.observedAt ?? new Date().toISOString() });
}
