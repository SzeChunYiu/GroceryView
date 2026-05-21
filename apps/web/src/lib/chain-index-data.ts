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
import { willysProducts } from './ingested/willys';
import { hemkopProducts } from './ingested/hemkop';
import { matpriskollenOffers } from './ingested/matpriskollen';
import type { ChainPriceObservation } from '@groceryview/core';

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
