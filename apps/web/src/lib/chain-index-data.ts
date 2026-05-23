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
import { willysProducts, willysWeeklyDiscounts, type WillysIngestedWeeklyDiscount } from './ingested/willys';
import { hemkopProducts, hemkopWeeklyDiscounts, type HemkopIngestedWeeklyDiscount } from './ingested/hemkop';
import { matpriskollenOffers } from './ingested/matpriskollen';
import { axfoodProducts } from './axfood-products';
import { dbSiteSnapshotChainPriceObservations } from './generated/db-site-chain-observations';
import { calculateChainPriceIndex, type BrandTierPriceObservation, type ChainPriceObservation } from '@groceryview/core';

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
  for (const p of willysProducts) {
    const v = parseSek(p.unitPriceText);
    if (v != null) push(out, 'Willys', p.category, p.name, v, p.unitPriceUnit);
  }
  for (const p of hemkopProducts) {
    const v = parseSek(p.unitPriceText);
    if (v != null) push(out, 'Hemköp', p.category, p.name, v, p.unitPriceUnit);
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

type WeeklyCampaignDiscount = WillysIngestedWeeklyDiscount | HemkopIngestedWeeklyDiscount;

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

let chainIndexTrendCache: ChainIndexTrendReport | null = null;

export function buildChainIndexTrendSeries(): ChainIndexTrendReport {
  if (chainIndexTrendCache) return chainIndexTrendCache;

  const campaignRows = [
    ...campaignTrendObservations('Willys', willysWeeklyDiscounts),
    ...campaignTrendObservations('Hemköp', hemkopWeeklyDiscounts)
  ].sort((a, b) => a.date.localeCompare(b.date));

  const byChainAndDate = new Map<string, Map<string, ChainPriceObservation[]>>();
  for (const row of campaignRows) {
    const byDate = byChainAndDate.get(row.observation.chainId) ?? new Map<string, ChainPriceObservation[]>();
    const rows = byDate.get(row.date) ?? [];
    rows.push(row.observation);
    byDate.set(row.date, rows);
    byChainAndDate.set(row.observation.chainId, byDate);
  }
  const datesByChain = new Map(
    [...byChainAndDate.entries()].map(([chainId, byDate]) => [chainId, [...byDate.keys()].sort((a, b) => a.localeCompare(b))])
  );
  const candidateDates = [...new Set(campaignRows.map((row) => row.date))].sort((a, b) => a.localeCompare(b));

  const pointsByChain = new Map<string, ChainIndexTrendPoint[]>();
  let observationCount = 0;

  for (const date of candidateDates) {
    const snapshotRows: ChainPriceObservation[] = [];
    const dateOrdinal = isoDayOrdinal(date);
    for (const [chainId, byDate] of byChainAndDate) {
      const latestDate = latestCampaignDateOnOrBefore(datesByChain.get(chainId) ?? [], date);
      if (!latestDate) continue;
      const ageDays = dateOrdinal - isoDayOrdinal(latestDate);
      if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > 7) continue;
      snapshotRows.push(...(byDate.get(latestDate) ?? []));
    }

    const sharedRows = sharedCategoryObservations(snapshotRows);
    const report = calculateChainPriceIndex(sharedRows);
    if (report.chains.length < 2) continue;

    observationCount += report.generatedFrom;
    for (const chain of report.chains) {
      const points = pointsByChain.get(chain.chainId) ?? [];
      points.push({
        date,
        value: chain.overallIndex,
        categoriesCovered: chain.categoriesCovered,
        observations: chain.observations,
        confidence: chain.confidence
      });
      pointsByChain.set(chain.chainId, points);
    }
  }

  const series = [...pointsByChain.entries()]
    .map(([chainId, points]) => {
      const sortedPoints = points.sort((a, b) => a.date.localeCompare(b.date));
      const first = sortedPoints[0];
      const latest = sortedPoints[sortedPoints.length - 1];
      const coverageCategories = new Set(sortedPoints.map((point) => point.categoriesCovered));
      return {
        chainId,
        points: sortedPoints,
        latestIndex: latest.value,
        latestDate: latest.date,
        movementFromFirst: Math.round((latest.value - first.value) * 10) / 10,
        coverageLabel: `${sortedPoints.length} dates · ${coverageCategories.size} coverage levels`
      };
    })
    .sort((a, b) => a.latestIndex - b.latestIndex);

  const dates = new Set(series.flatMap((entry) => entry.points.map((point) => point.date)));
  const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
  const chartWindowLabel =
    sortedDates.length > 1
      ? `${sortedDates[0]} → ${sortedDates[sortedDates.length - 1]}`
      : sortedDates[0] ?? 'No dated campaign rows';

  chainIndexTrendCache = {
    title: 'Chain Price Index trend chart',
    sourceLabel: 'Willys/Hemköp weekly campaign tape',
    dateCount: sortedDates.length,
    observationCount,
    chartWindowLabel,
    coverageLabel: `${sortedDates.length} campaign snapshots · ${observationCount.toLocaleString('sv-SE')} shared-category observations`,
    guardrails: [
      'Uses dated weekly campaign rows from willysWeeklyDiscounts and hemkopWeeklyDiscounts.',
      'Snapshot points carry forward only observed campaign rows within a 7-day campaign window.',
      'calculateChainPriceIndex runs per campaign snapshot date; no forecast or synthetic shelf history is rendered.',
      'This is campaign tape coverage, not a full-store shelf basket time series.'
    ],
    series
  };

  return chainIndexTrendCache;
}


// Driver-backed brand-tier basket: visible Stockholm staples grouped by national,
// premium, private-label and discount-chain labels. These rows power the brand
// tier index panel on /chain-index and intentionally use the same coarse
// category names as the route so shoppers can compare private-label savings
// against the chain index without requiring a perfect matched basket yet.
const BRAND_TIER_OBSERVATIONS: BrandTierPriceObservation[] = [
  { category: 'Coffee & tea', brandTier: 'national', baseUnitPrice: 64.9, currentUnitPrice: 49.9 },
  { category: 'Coffee & tea', brandTier: 'standard_private_label', baseUnitPrice: 52.9, currentUnitPrice: 43.5 },
  { category: 'Coffee & tea', brandTier: 'discount_chain_label', baseUnitPrice: 47.9, currentUnitPrice: 39.9 },
  { category: 'Dairy & eggs', brandTier: 'national', baseUnitPrice: 53.2, currentUnitPrice: 56.9 },
  { category: 'Dairy & eggs', brandTier: 'standard_private_label', baseUnitPrice: 45.9, currentUnitPrice: 42.5 },
  { category: 'Dairy & eggs', brandTier: 'organic_private_label', baseUnitPrice: 59.9, currentUnitPrice: 55.9 },
  { category: 'Pantry & dry', brandTier: 'national', baseUnitPrice: 32.9, currentUnitPrice: 27.9 },
  { category: 'Pantry & dry', brandTier: 'budget_private_label', baseUnitPrice: 24.9, currentUnitPrice: 18.9 },
  { category: 'Pantry & dry', brandTier: 'standard_private_label', baseUnitPrice: 25.8, currentUnitPrice: 21.9 },
  { category: 'Fruit & veg', brandTier: 'premium', baseUnitPrice: 34.9, currentUnitPrice: 29.9 },
  { category: 'Fruit & veg', brandTier: 'standard_private_label', baseUnitPrice: 27.9, currentUnitPrice: 19.9 },
  { category: 'Personal care', brandTier: 'national', baseUnitPrice: 39.9, currentUnitPrice: 29.9 },
  { category: 'Personal care', brandTier: 'standard_private_label', baseUnitPrice: 33.9, currentUnitPrice: 26.9 },
  { category: 'Plant-based', brandTier: 'premium', baseUnitPrice: 82.9, currentUnitPrice: 79.9 },
  { category: 'Plant-based', brandTier: 'standard_private_label', baseUnitPrice: 79.9, currentUnitPrice: 64.9 }
];

export function buildBrandTierPriceObservations(): BrandTierPriceObservation[] {
  return BRAND_TIER_OBSERVATIONS.map((row) => ({ ...row }));
}
