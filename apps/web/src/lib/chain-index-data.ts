// Adapter: turn the heterogeneous ingested chain feeds into the normalised
// ChainPriceObservation shape that @groceryview/core's calculateChainPriceIndex
// consumes. The feeds use different schemas, taxonomies and units, so the work
// here IS the "make sparse, mismatched data comparable" step:
//   - unit prices are canonicalised to a base unit (kg / l / st), folding hg/g
//     and dl/cl/ml so /kg compares with /kg,
//   - free-text categories (+ product names where the feed has no category) are
//     mapped onto one coarse, shared taxonomy so a "category" means the same
//     thing across chains,
//   - the category key carries its base unit, so medians are always like-for-like.
import { coopProducts } from './ingested/coop';
import { matpriskollenOffers } from './ingested/matpriskollen';
import { axfoodProducts } from './axfood-products';
import { axfoodWeeklyTrendReport } from './ingested/axfood-weekly-summary';
import { dbSiteSnapshotChainPriceObservations } from './generated/db-site-chain-observations';
import { calculateChainPriceIndex, calculateDealScore, type BrandTier, type BrandTierPriceObservation, type ChainPriceObservation } from '@groceryview/core';

export const householdCategoryExposureWeights: Record<string, { monthlySpend: number; sharePercent: number }> = {
  'Dairy & eggs': { monthlySpend: 420, sharePercent: 18 },
  'Bread & bakery': { monthlySpend: 260, sharePercent: 11 },
  'Fruit & veg': { monthlySpend: 510, sharePercent: 22 },
  'Pantry & dry': { monthlySpend: 360, sharePercent: 15 },
  Beverages: { monthlySpend: 210, sharePercent: 9 },
  Frozen: { monthlySpend: 190, sharePercent: 8 },
  Household: { monthlySpend: 170, sharePercent: 7 }
};

// ── unit canonicalisation ────────────────────────────────────────────────────
type Canon = { factor: number; base: 'kg' | 'l' | 'st' };
const UNIT_CANON: Record<string, Canon> = {
  kg: { factor: 1, base: 'kg' },
  hg: { factor: 10, base: 'kg' }, // price per hg × 10 = per kg
  g: { factor: 1000, base: 'kg' },
  gram: { factor: 1000, base: 'kg' },
  l: { factor: 1, base: 'l' },
  liter: { factor: 1, base: 'l' },
  dl: { factor: 10, base: 'l' },
  cl: { factor: 100, base: 'l' },
  ml: { factor: 1000, base: 'l' },
  st: { factor: 1, base: 'st' },
  styck: { factor: 1, base: 'st' },
  frp: { factor: 1, base: 'st' },
  p: { factor: 1, base: 'st' },
};

function canonUnitPrice(value: number, unit: string): { price: number; base: string } | null {
  const u = unit.trim().toLowerCase().replace(/\./g, '');
  const canon = UNIT_CANON[u];
  if (!canon || !Number.isFinite(value) || value <= 0) return null;
  return { price: value * canon.factor, base: canon.base };
}

// Parse a Swedish price fragment like "16,27 kr", "0,17/st", "12,20 kr/kg".
function parseSek(text: string): number | null {
  const m = text.replace(',', '.').match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ── coarse shared taxonomy ───────────────────────────────────────────────────
const CATEGORY_RULES: { category: string; match: RegExp }[] = [
  { category: 'Coffee & tea', match: /kaffe|bryggkaffe|espresso|\bte\b|coffee|tea/i },
  { category: 'Dairy & eggs', match: /mj[oö]lk|gr[aä]dde|\bost\b|yoghurt|\bfil\b|sm[oö]r|[aä]gg|milk|cheese|butter|\begg|dairy|cream/i },
  { category: 'Bread & bakery', match: /br[oö]d|bulle|fralla|kn[aä]cke|bake|bread|bakery|tortilla/i },
  { category: 'Meat & fish', match: /k[oö]tt|kyckling|fl[aä]sk|fisk|\blax\b|korv|bacon|f[aä]rs|meat|chicken|pork|\bfish|beef|salmon/i },
  { category: 'Fruit & veg', match: /frukt|gr[oö]nsak|banan|[aä]pple|tomat|potatis|sallad|l[oö]k|morot|vegetable|fruit|avocado/i },
  { category: 'Pantry & dry', match: /pasta|makaron|\bris\b|mj[oö]l|socker|\bsalt\b|konserv|s[aå]s|olja|krydd|pantry|flour|rice|\boil\b|noodle/i },
  { category: 'Beverages', match: /l[aä]sk|juice|vatten|dryck|\b[oö]l\b|\bvin\b|soda|cola|beverage|drink|water|smoothie/i },
  { category: 'Snacks & sweets', match: /godis|choklad|chips|snacks|\bkex\b|glass|n[oö]tter|candy|chocolate|sweet|cookie|ice cream/i },
  { category: 'Frozen', match: /fryst|\bfrys|frozen/i },
  { category: 'Household', match: /st[aä]d|disk|tv[aä]tt|papper|reng[oö]ring|household|cleaning|hush[aå]ll|toalett|servett/i },
  { category: 'Personal care', match: /hygien|kroppsv[aå]rd|schampo|tv[aå]l|tandkr[aä]m|hudv[aå]rd|deo|personal care|shampoo|soap/i },
  { category: 'Baby', match: /bl[oö]j|\bbaby\b|barn|v[aå]tservett/i },
  { category: 'Pet', match: /\bhund\b|\bkatt\b|\bdjur\b|\bpet\b|dog|\bcat\b/i },
];

function normaliseCategory(...texts: string[]): string {
  const hay = texts.filter(Boolean).join(' ');
  for (const rule of CATEGORY_RULES) if (rule.match.test(hay)) return rule.category;
  return 'Other';
}

// matpriskollen store name -> chain.
const STORE_CHAIN_RULES: { chain: string; match: RegExp }[] = [
  { chain: 'ICA', match: /\bica\b|maxi/i },
  { chain: 'Coop', match: /coop|stora coop/i },
  { chain: 'Willys', match: /willys/i },
  { chain: 'Hemköp', match: /hemk[oö]p/i },
  { chain: 'Lidl', match: /lidl/i },
  { chain: 'City Gross', match: /city gross/i },
  { chain: 'Tempo', match: /tempo|handlarn|matöppet|matoppet/i },
];

function chainFromStore(store: string): string | null {
  for (const rule of STORE_CHAIN_RULES) if (rule.match.test(store)) return rule.chain;
  return null;
}

function push(out: ChainPriceObservation[], chainId: string, rawCategory: string, name: string, value: number, unit: string) {
  const canon = canonUnitPrice(value, unit);
  if (!canon) return;
  const category = `${normaliseCategory(rawCategory, name)} · ${canon.base}`;
  out.push({ chainId, category, unitPrice: canon.price });
}

export function buildChainPriceObservations(): ChainPriceObservation[] {
  if (dbSiteSnapshotChainPriceObservations.length > 0) return dbSiteSnapshotChainPriceObservations;

  const out: ChainPriceObservation[] = [];

  for (const p of coopProducts) {
    if (p.unitPrice != null) push(out, 'Coop', p.category, p.name, p.unitPrice, p.unitPriceUnit);
  }
  for (const o of matpriskollenOffers) {
    const chain = chainFromStore(o.store);
    if (!chain) continue;
    // comparePriceText like "0,17/st" or "129,00/kg".
    const v = parseSek(o.comparePriceText);
    const unit = o.comparePriceText.split('/')[1]?.trim() ?? '';
    if (v != null && unit) push(out, chain, o.category, o.name, v, unit);
  }

  return out;
}

export function buildMatchedBasketChainPriceObservations(): ChainPriceObservation[] {
  const out: ChainPriceObservation[] = [];
  for (const product of axfoodProducts) {
    const category = `${normaliseCategory(product.category, product.name, product.brand)} · st`;
    if (product.chains.willys?.price != null) {
      out.push({ chainId: 'Willys', category, unitPrice: product.chains.willys.price });
    }
    if (product.chains.hemkop?.price != null) {
      out.push({ chainId: 'Hemköp', category, unitPrice: product.chains.hemkop.price });
    }
  }
  return out;
}

export type ChainIndexTrendPoint = {
  date: string;
  value: number;
  categoriesCovered: number;
  observations: number;
  confidence: 'high' | 'medium' | 'low';
};

export type ChainIndexTrendSeries = {
  chainId: string;
  points: ChainIndexTrendPoint[];
  latestIndex: number;
  latestDate: string;
  movementFromFirst: number;
  coverageLabel: string;
};

export type ChainIndexTrendReport = {
  title: string;
  sourceLabel: string;
  dateCount: number;
  observationCount: number;
  chartWindowLabel: string;
  coverageLabel: string;
  guardrails: string[];
  series: ChainIndexTrendSeries[];
};

export type PartnerStoreIssueSeverity = 'clear' | 'watch';

export type PartnerStoreDashboardStore = {
  chainKey: string;
  chainName: string;
  visibleProducts: number;
  matchedProducts: number;
  categoriesCovered: number;
  lowestPriceWins: number;
  coveragePercent: number;
  visibilityLabel: string;
  catalogueCoverageLabel: string;
  reportedIssueCount: number;
  reportedIssueSummary: string;
  issueSeverity: PartnerStoreIssueSeverity;
  nextAction: string;
};

export type PartnerStoreIssueSummary = {
  id: string;
  label: string;
  count: number;
  severity: PartnerStoreIssueSeverity;
  detail: string;
};

export type PartnerStoreDashboardSummary = {
  sourceLabel: string;
  totalVisibleProducts: number;
  matchedProducts: number;
  sharedCategoryCount: number;
  stores: PartnerStoreDashboardStore[];
  issues: PartnerStoreIssueSummary[];
  guardrails: string[];
};

type WeeklyCampaignDiscount = {
  startDate: string;
  comparePriceText: string;
  category: string;
  name: string;
  brand: string;
};

type DatedChainObservation = {
  date: string;
  observation: ChainPriceObservation;
};

export function parseCampaignDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})-(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const monthLengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > monthLengths[month - 1]) return null;

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function campaignTrendObservations(chainId: string, discounts: readonly WeeklyCampaignDiscount[]): DatedChainObservation[] {
  const out: DatedChainObservation[] = [];

  for (const discount of discounts) {
    const date = parseCampaignDate(discount.startDate);
    if (!date) continue;

    const value = parseSek(discount.comparePriceText);
    const unit = discount.comparePriceText.split('/')[1]?.trim() ?? '';
    const canon = value == null ? null : canonUnitPrice(value, unit);
    if (!canon) continue;

    out.push({
      date,
      observation: {
        chainId,
        category: `${normaliseCategory(discount.category, discount.name, discount.brand)} · ${canon.base}`,
        unitPrice: canon.price
      }
    });
  }

  return out;
}

function sharedCategoryObservations(rows: ChainPriceObservation[]): ChainPriceObservation[] {
  const chainsByCategory = new Map<string, Set<string>>();
  for (const row of rows) {
    const chains = chainsByCategory.get(row.category) ?? new Set<string>();
    chains.add(row.chainId);
    chainsByCategory.set(row.category, chains);
  }

  return rows.filter((row) => (chainsByCategory.get(row.category)?.size ?? 0) >= 2);
}

function isoDayOrdinal(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return Number.NaN;
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function latestCampaignDateOnOrBefore(dates: readonly string[], date: string): string | null {
  let latest: string | null = null;
  for (const candidate of dates) {
    if (candidate <= date) latest = candidate;
    if (candidate > date) break;
  }
  return latest;
}


export type ChainCategoryCoverageGap = {
  slug: string;
  label: string;
  chainId: string;
  observedProducts: number;
  matchedProducts: number;
  targetProducts: number;
  gapProducts: number;
  coveragePct: number;
  trendDirection: 'up' | 'flat' | 'down';
  actionLabel: string;
};

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('sv-SE') + part.slice(1))
    .join(' ');
}

export function buildChainCategoryCoverageGaps(limit = 8): ChainCategoryCoverageGap[] {
  const chains = ['willys', 'hemkop'];
  const categories = [...new Set(axfoodProducts.map((product) => product.category))];

  return categories.flatMap((slug) => {
    const products = axfoodProducts.filter((product) => product.category === slug);
    const matchedProducts = products.filter((product) => product.inChains.length > 1).length;
    const targetProducts = Math.max(12, Math.ceil(products.length * 0.9));

    return chains.map((chainId) => {
      const observedProducts = products.filter((product) => product.inChains.includes(chainId)).length;
      const gapProducts = Math.max(0, targetProducts - observedProducts);
      const coveragePct = targetProducts > 0 ? observedProducts / targetProducts : 0;
      const trendDirection = observedProducts >= targetProducts ? 'up' : matchedProducts >= targetProducts * 0.7 ? 'flat' : 'down';
      const actionLabel = gapProducts === 0
        ? 'Meets target depth'
        : `Need ${gapProducts.toLocaleString('sv-SE')} more ${chainId} row${gapProducts === 1 ? '' : 's'}`;

      return { slug, label: titleFromSlug(slug), chainId, observedProducts, matchedProducts, targetProducts, gapProducts, coveragePct, trendDirection, actionLabel };
    });
  })
    .filter((gap) => gap.gapProducts > 0)
    .sort((left, right) => right.gapProducts - left.gapProducts || left.label.localeCompare(right.label, 'sv'))
    .slice(0, limit);
}

export function buildChainIndexTrendSeries(): ChainIndexTrendReport {
  // Precomputed from the generated willysWeeklyDiscounts and hemkopWeeklyDiscounts
  // campaign arrays so Next does not parse 100+ MB of static Axfood rows during build.
  return axfoodWeeklyTrendReport;
}

const PARTNER_STORE_CHAINS = [
  { key: 'willys', name: 'Willys' },
  { key: 'hemkop', name: 'Hemköp' }
] as const;

function hasPartnerPrice(product: (typeof axfoodProducts)[number], chainKey: string): boolean {
  const price = product.chains[chainKey]?.price;
  return typeof price === 'number' && Number.isFinite(price) && price > 0;
}

export function buildPartnerStoreDashboardSummary(): PartnerStoreDashboardSummary {
  const visibleProducts = axfoodProducts.filter((product) => PARTNER_STORE_CHAINS.some((chain) => hasPartnerPrice(product, chain.key)));
  const matchedProducts = visibleProducts.filter((product) => PARTNER_STORE_CHAINS.every((chain) => hasPartnerPrice(product, chain.key)));
  const unmatchedProducts = visibleProducts.length - matchedProducts.length;
  const sharedCategoryCount = new Set(matchedProducts.map((product) => normaliseCategory(product.category, product.name, product.brand))).size;

  const stores = PARTNER_STORE_CHAINS.map((chain) => {
    const chainProducts = visibleProducts.filter((product) => hasPartnerPrice(product, chain.key));
    const chainMatchedProducts = chainProducts.filter((product) => PARTNER_STORE_CHAINS.every((partner) => hasPartnerPrice(product, partner.key)));
    const categoriesCovered = new Set(chainProducts.map((product) => normaliseCategory(product.category, product.name, product.brand))).size;
    const lowestPriceWins = chainProducts.filter((product) => product.lowestChain === chain.key).length;
    const missingCounterpartCount = chainProducts.length - chainMatchedProducts.length;
    const coveragePercent = chainProducts.length ? chainMatchedProducts.length / chainProducts.length : 0;

    return {
      chainKey: chain.key,
      chainName: chain.name,
      visibleProducts: chainProducts.length,
      matchedProducts: chainMatchedProducts.length,
      categoriesCovered,
      lowestPriceWins,
      coveragePercent,
      visibilityLabel: `${chainProducts.length.toLocaleString('sv-SE')} visible catalogue rows`,
      catalogueCoverageLabel: `${chainMatchedProducts.length.toLocaleString('sv-SE')} cross-chain matches across ${categoriesCovered} coarse categories`,
      reportedIssueCount: missingCounterpartCount + 1,
      reportedIssueSummary:
        missingCounterpartCount > 0
          ? `${missingCounterpartCount.toLocaleString('sv-SE')} rows need a partner-chain counterpart; branch inventory is not connected.`
          : 'No unmatched Axfood rows in this snapshot; branch inventory is still not connected.',
      issueSeverity: 'watch',
      nextAction:
        missingCounterpartCount > 0
          ? 'Review unmatched catalogue rows before promoting partner coverage.'
          : 'Confirm branch-level inventory or issue-report integrations before launch.'
    } satisfies PartnerStoreDashboardStore;
  });

  return {
    sourceLabel: 'Axfood chain price snapshot · Willys/Hemköp online catalogue rows',
    totalVisibleProducts: visibleProducts.length,
    matchedProducts: matchedProducts.length,
    sharedCategoryCount,
    stores,
    issues: [
      {
        id: 'catalogue-counterparts',
        label: 'Catalogue rows missing partner counterparts',
        count: unmatchedProducts,
        severity: unmatchedProducts > 0 ? 'watch' : 'clear',
        detail:
          unmatchedProducts > 0
            ? 'Rows visible in one partner catalogue but not the other stay out of matched comparison coverage.'
            : 'Every currently visible partner row has a Willys/Hemköp counterpart in the static snapshot.'
      },
      {
        id: 'branch-inventory',
        label: 'Branch-level inventory feed',
        count: PARTNER_STORE_CHAINS.length,
        severity: 'watch',
        detail: 'The snapshot is chain-wide online catalogue data; partner stores still need branch inventory or availability feeds before store-level claims.'
      },
      {
        id: 'customer-reported-issues',
        label: 'Customer-reported store issues',
        count: 0,
        severity: 'clear',
        detail: 'No production customer issue-report rows are bundled with this repo snapshot, so the admin shell shows the empty-state explicitly.'
      }
    ],
    guardrails: [
      'Visibility counts are derived from captured online catalogue prices only.',
      'Catalogue coverage counts matched Willys/Hemköp products and never estimates missing prices.',
      'Reported issue totals only include verifiable snapshot gaps or an explicit empty production-report state.'
    ]
  };
}

function medianPrice(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function brandTierForMatchedProduct(product: (typeof axfoodProducts)[number], categoryMedian: number): BrandTier {
  const brand = product.brand.toLowerCase();
  const labels = product.labels.map((label) => label.toLowerCase());
  const isRetailerPrivateLabel =
    brand.includes('garant') ||
    brand.includes('eldorado') ||
    brand.includes('ica') ||
    brand.includes('coop') ||
    brand.includes('änglamark') ||
    brand.includes('x-tra');

  if (
    brand.includes('garant eko') ||
    brand.includes('änglamark') ||
    (isRetailerPrivateLabel && (labels.includes('ecological') || labels.includes('eu_ecological')))
  ) {
    return 'organic_private_label';
  }
  if (brand.includes('eldorado') || brand.includes('x-tra') || brand.includes('basic')) return 'budget_private_label';
  if (isRetailerPrivateLabel) return 'standard_private_label';
  if (brand.includes('willys') || brand.includes('lidl') || brand.includes('city gross')) return 'discount_chain_label';
  if (product.lowestPrice >= categoryMedian * 1.25) return 'premium';
  return 'national';
}

export type PremiumSpecialtyTrackerRow = {
  slug: string;
  ticker: string;
  name: string;
  brand: string;
  brandTier: BrandTier;
  category: string;
  lowestChain: string;
  lowestPrice: number;
  spreadPercent: number;
  dealScore: number;
  confidence: 'high' | 'medium' | 'low';
  watchlistTargetPrice: number;
  sourceLabel: string;
  specialtyReason: string;
  historicalLowBadge?: string;
};

const specialtyKeywordRules: Array<{ reason: string; match: RegExp }> = [
  { reason: 'specialty pantry import', match: /\bzeta\b|\bde cecco\b|\bmutti\b|olivolja|extra virgin|balsamico|matlagningsvin/i },
  { reason: 'premium chocolate or confectionery', match: /premium|kakao|choklad|lindt/i },
  { reason: 'delicatessen or fresh specialty', match: /delikatess|tryffel|parmesan|laxfärs|gourmet/i },
  { reason: 'baking specialty', match: /special|surdeg|tipo|durum/i }
];

function premiumSpecialtyReason(product: (typeof axfoodProducts)[number], brandTier: BrandTier): string | null {
  if (brandTier === 'premium') return 'premium brand-tier index constituent';
  const haystack = `${product.name} ${product.brand} ${product.category}`;
  return specialtyKeywordRules.find((rule) => rule.match.test(haystack))?.reason ?? null;
}

function tickerForProductSlug(slug: string): string {
  return slug
    .replace(/-\d+(?:-st)?$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();
}

function roundSek(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildPremiumSpecialtyTrackerRows(): PremiumSpecialtyTrackerRow[] {
  const matchedProducts = axfoodProducts.filter((product) => product.inChains.length > 1 && product.lowestPrice > 0);
  const medianByCategory = new Map<string, number>();

  for (const category of new Set(matchedProducts.map((product) => normaliseCategory(product.category, product.name)))) {
    const prices = matchedProducts
      .filter((product) => normaliseCategory(product.category, product.name) === category)
      .map((product) => product.lowestPrice)
      .filter((price) => Number.isFinite(price) && price > 0);
    if (prices.length > 0) medianByCategory.set(category, medianPrice(prices));
  }

  return matchedProducts
    .flatMap((product): PremiumSpecialtyTrackerRow[] => {
      const category = normaliseCategory(product.category, product.name);
      const categoryMedian = medianByCategory.get(category) ?? product.lowestPrice;
      const brandTier = brandTierForMatchedProduct(product, categoryMedian);
      const specialtyReason = premiumSpecialtyReason(product, brandTier);
      if (!specialtyReason) return [];

      const dealScore = calculateDealScore({
        currentCityPercentile: Math.max(0, Math.min(100, 100 - product.spreadPct * 2)),
        knownPromoHistoryPercentile: Math.max(0, Math.min(100, 100 - product.spreadPct * 2)),
        equivalentUnitPricePercentile: product.inChains.length > 1 ? 0 : 50,
        discountDepthPercent: product.spreadPct,
        sourceConfidence: Math.max(0, Math.min(1, product.inChains.length / 2))
      });

      return [{
        slug: product.slug,
        ticker: tickerForProductSlug(product.slug),
        name: product.name,
        brand: product.brand || 'Brand not reported',
        brandTier,
        category,
        lowestChain: product.lowestChain,
        lowestPrice: product.lowestPrice,
        spreadPercent: product.spreadPct,
        dealScore,
        confidence: product.inChains.length >= 2 ? 'high' : 'medium',
        watchlistTargetPrice: roundSek(product.lowestPrice * 1.02),
        sourceLabel: `${product.inChains.length} matched Willys/Hemköp rows`,
        specialtyReason,
        ...(product.spreadPct >= 20
          ? { historicalLowBadge: 'Matched-chain low: dated 52-week history not available for this specialty row.' }
          : {})
      }];
    })
    .sort((left, right) =>
      right.dealScore - left.dealScore ||
      right.spreadPercent - left.spreadPercent ||
      left.name.localeCompare(right.name, 'sv')
    )
    .slice(0, 8);
}

export function buildBrandTierPriceObservations(): BrandTierPriceObservation[] {
  const matchedProducts = axfoodProducts.filter((product) => product.inChains.length > 1 && product.lowestPrice > 0);
  const medianByCategory = new Map<string, number>();

  for (const category of new Set(matchedProducts.map((product) => normaliseCategory(product.category, product.name)))) {
    const prices = matchedProducts
      .filter((product) => normaliseCategory(product.category, product.name) === category)
      .map((product) => product.lowestPrice)
      .filter((price) => Number.isFinite(price) && price > 0);
    if (prices.length > 0) medianByCategory.set(category, medianPrice(prices));
  }

  return matchedProducts.flatMap((product) => {
    const category = normaliseCategory(product.category, product.name);
    const categoryMedian = medianByCategory.get(category) ?? product.lowestPrice;
    const brandTier = brandTierForMatchedProduct(product, categoryMedian);
    const chainPrices = product.inChains
      .map((chainId) => ({ chainId, price: product.chains[chainId]?.price }))
      .filter((row): row is { chainId: string; price: number } => typeof row.price === 'number' && Number.isFinite(row.price) && row.price > 0);

    if (chainPrices.length < 2) return [];

    const baseUnitPrice = chainPrices.reduce((sum, row) => sum + row.price, 0) / chainPrices.length;

    return chainPrices.map((row) => ({
      category: `${category} · ${row.chainId}`,
      brandTier,
      baseUnitPrice,
      currentUnitPrice: row.price
    }));
  });
}
