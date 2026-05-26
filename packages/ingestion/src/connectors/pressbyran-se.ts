export const PRESSBYRAN_SE_BASE_URL = 'https://www.pressbyran.se';
export const PRESSBYRAN_SE_APP_URL = `${PRESSBYRAN_SE_BASE_URL}/handla-hos-oss/pressbyransapp/`;
export const PRESSBYRAN_SE_GLASS_CAMPAIGN_URL = `${PRESSBYRAN_SE_BASE_URL}/handla-hos-oss/ata/glass-godis/halva-priset-pa-all-glass/`;
export const PRESSBYRAN_SE_WORK_URL = `${PRESSBYRAN_SE_BASE_URL}/pressbyran-work/`;
export const PRESSBYRAN_SE_MAGAZINE_WEB_URL = 'https://webshop.pressbyran.se';

export type PressbyranSeChannel = 'online' | 'store' | 'delivery';
export type PressbyranSeFormat = 'pressbyran' | 'magazine_webshop' | 'pressbyran_at_work';

export type PressbyranSePriceRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'pressbyran-se';
  code: string;
  name: string;
  category: string;
  price: number | null;
  priceText: string;
  channel: PressbyranSeChannel;
  format: PressbyranSeFormat;
  store_id: string | null;
  region: string | null;
  sourceUrl: string;
  retrievedAt: string;
  is_member_price: boolean;
  is_subscription_price: boolean;
  is_coupon_price: boolean;
  is_clearance: false;
  multi_buy: string | null;
  membershipProgram: 'Pressbyrån Kompis' | null;
  promotion: string | null;
  discountPercent: number | null;
  schedule: string | null;
  deliveryPartners: readonly string[];
  shippingFeeFromSek: number | null;
  subscriptionTerm: string | null;
  issueLabel: string | null;
};

export function parsePressbyranSeMagazineProductHtml(
  html: string,
  productUrl: string,
  retrievedAt: string
): PressbyranSePriceRow[] {
  const text = htmlToText(html);
  const name = productName(text);
  if (!name) return [];

  const optionBlock = text.match(/Välj prenumeration eller lösnummer:\s*([\s\S]*?)(?:Lägg i varukorgen|Alla priser)/i)?.[1] ?? '';
  const shippingFeeFromSek = money(text.match(/(?:börjar på|Lösnummer från)\s*(\d+(?:[\s,.]\d{1,2})?)\s*kr/i)?.[1]);
  const rows: PressbyranSePriceRow[] = [];
  // The Lösnummer label can carry a year ("Lösnummer #21, 2026"). The price group only
  // accepts a single amount with Swedish space-grouped thousands (1-3 digits then groups of
  // exactly 3) so "2026 44" can't be read as one number (-> 202644.9); the year stays in the
  // non-greedy label and the trailing "44,90" is captured as the price.
  const optionPattern = /(Tillsvidareprenumeration|Helår\s*\([^)]*\)|Halvår\s*\([^)]*\)|Kvartal\s*\([^)]*\)|Lösnummer\s*#[^\n\r]*?)(\d{1,3}(?:\s\d{3})*(?:[,.]\d{1,2})?|\d+(?:[,.]\d{1,2})?)\s*kr/gi;
  let match: RegExpExecArray | null;

  while ((match = optionPattern.exec(optionBlock)) !== null) {
    const label = cleanWhitespace(match[1]);
    const price = money(match[2]);
    if (price === null) continue;
    const isSubscription = !/^Lösnummer/i.test(label);
    rows.push(baseRow({
      code: `${slugFromUrl(productUrl)}-${slug(label)}`,
      name: `${name} - ${label}`,
      category: 'magazine',
      price,
      priceText: `${formatSek(price)} SEK`,
      channel: 'online',
      format: 'magazine_webshop',
      sourceUrl: productUrl,
      retrievedAt,
      is_subscription_price: isSubscription,
      shippingFeeFromSek,
      subscriptionTerm: isSubscription ? label : null,
      issueLabel: isSubscription ? null : label
    }));
  }

  return rows;
}

export function pressbyranSeKompisFikaPromotionRow(retrievedAt: string): PressbyranSePriceRow {
  return baseRow({
    code: 'pressbyran-kompisfika-fika-50-percent',
    name: 'Kompisfika liten varm dryck + valfritt fikabröd',
    category: 'fika',
    price: null,
    priceText: '50% rabatt',
    channel: 'store',
    format: 'pressbyran',
    sourceUrl: PRESSBYRAN_SE_APP_URL,
    retrievedAt,
    is_member_price: true,
    is_coupon_price: true,
    membershipProgram: 'Pressbyrån Kompis',
    promotion: 'Kompisfika',
    discountPercent: 50,
    schedule: 'tisdagar 15:00-16:00'
  });
}

export function pressbyranSeHalfPriceGlassPromotionRows(retrievedAt: string): PressbyranSePriceRow[] {
  const common = {
    code: 'pressbyran-half-price-glass-campaign',
    name: 'Halva priset på all glass',
    category: 'ice_cream',
    price: 10,
    priceText: '10,00 SEK vid ordinarie pris 20,00 SEK',
    format: 'pressbyran' as const,
    sourceUrl: PRESSBYRAN_SE_GLASS_CAMPAIGN_URL,
    retrievedAt,
    promotion: 'Halva priset på all glass',
    discountPercent: 50
  };

  return [
    baseRow({ ...common, channel: 'store', code: `${common.code}-store` }),
    baseRow({
      ...common,
      channel: 'delivery',
      code: `${common.code}-delivery`,
      deliveryPartners: ['Wolt', 'Foodora', 'Uber Eats']
    })
  ];
}

function baseRow(overrides: Partial<PressbyranSePriceRow> & Pick<PressbyranSePriceRow, 'code' | 'name' | 'category' | 'price' | 'priceText' | 'channel' | 'format' | 'sourceUrl' | 'retrievedAt'>): PressbyranSePriceRow {
  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'pressbyran-se',
    store_id: null,
    region: null,
    is_member_price: false,
    is_subscription_price: false,
    is_coupon_price: false,
    is_clearance: false,
    multi_buy: null,
    membershipProgram: null,
    promotion: null,
    discountPercent: null,
    schedule: null,
    deliveryPartners: [],
    shippingFeeFromSek: null,
    subscriptionTerm: null,
    issueLabel: null,
    ...overrides
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function productName(text: string): string {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const markerIndex = lines.findIndex((line) => line === 'Ge bort som gåva?' || line === 'När startar min prenumeration?');
  if (markerIndex > 0) return lines[markerIndex - 1];
  return lines.find((line) => !/^Hem$|^Sortiment$|^Logga in$/i.test(line)) ?? '';
}

function money(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? roundSek(parsed) : null;
}

function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function roundSek(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatSek(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function slug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'option';
}

function slugFromUrl(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? 'pressbyran-product';
}
