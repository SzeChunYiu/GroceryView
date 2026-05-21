import { axfoodProducts } from './axfood-products';
import { categoryLabels, pricedProducts } from './openprices-products';
import { osmStores } from './osm-stores';

export const snapshot = {
  retrievedLabel: '20-21 May 2026',
  axfoodSource: 'Willys and Hemköp public search endpoints',
  openPricesSource: 'OpenPrices / Open Food Facts SEK observations',
  osmSource: 'OpenStreetMap Overpass Stockholm county extract'
};

const sek = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });

export function formatSek(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? sek.format(value) : 'Not reported';
}

export function formatPct(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `${pct.format(value)}%` : 'Not reported';
}

export function labelFromSlug(slug: string) {
  return categoryLabels[slug] ?? slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export const matchedChainProducts = axfoodProducts.filter((product) => product.inChains.length > 1 && product.lowestPrice > 0);
export const topChainSpreads = [...matchedChainProducts].sort((a, b) => b.spreadPct - a.spreadPct).slice(0, 18);
export const freshestOpenPrices = [...pricedProducts].sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt)).slice(0, 18);
export const productUniverse = [...topChainSpreads, ...freshestOpenPrices].slice(0, 36);

export const storeUniverse = osmStores;
export const featuredStores = [...osmStores]
  .filter((store) => store.address)
  .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  .slice(0, 24);

export const categorySummaries = Object.entries(categoryLabels)
  .map(([slug, label]) => {
    const openRows = pricedProducts.filter((product) => product.category === slug);
    const chainRows = axfoodProducts.filter((product) => product.category === slug);
    const prices = openRows.map((product) => product.priceMedian).filter((price) => Number.isFinite(price));
    return {
      slug,
      label,
      openPriceRows: openRows.length,
      chainRows: chainRows.length,
      medianPrice: prices.length ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null,
      latestObservation: openRows.reduce((latest, product) => product.lastObservedAt > latest ? product.lastObservedAt : latest, ''),
      strongestSpread: chainRows.reduce((best, product) => Math.max(best, product.spreadPct), 0)
    };
  })
  .filter((category) => category.openPriceRows > 0 || category.chainRows > 0)
  .sort((a, b) => (b.openPriceRows + b.chainRows) - (a.openPriceRows + a.chainRows));

export const sourceCoverage = [
  {
    name: 'Axfood chain price snapshot',
    source: snapshot.axfoodSource,
    rows: axfoodProducts.length,
    coverage: `${matchedChainProducts.length} Willys/Hemköp cross-chain matches`,
    freshness: snapshot.retrievedLabel,
    caveat: 'Chain-wide online catalogue prices; not per-branch shelf prices.'
  },
  {
    name: 'OpenPrices SEK observations',
    source: snapshot.openPricesSource,
    rows: pricedProducts.length,
    coverage: `${new Set(pricedProducts.map((product) => product.code)).size} EAN-coded products`,
    freshness: freshestOpenPrices[0]?.lastObservedAt ?? 'Not reported',
    caveat: 'Community observations; every row shows observation count and latest date.'
  },
  {
    name: 'Stockholm store directory',
    source: snapshot.osmSource,
    rows: osmStores.length,
    coverage: `${new Set(osmStores.map((store) => store.brand)).size} brands across Stockholm county`,
    freshness: osmStores[0]?.retrievedDate ?? 'Not reported',
    caveat: 'Location data only; prices are not inferred from store locations.'
  }
];

export const keyMetrics = [
  { label: 'Verified price rows', value: (axfoodProducts.length + pricedProducts.length).toLocaleString('sv-SE'), detail: 'Axfood products plus OpenPrices observations rendered from generated modules.' },
  { label: 'Matched Willys/Hemköp products', value: matchedChainProducts.length.toLocaleString('sv-SE'), detail: 'Only products present in both chain catalogues are compared.' },
  { label: 'Stockholm stores', value: osmStores.length.toLocaleString('sv-SE'), detail: 'Physical stores from the OSM Overpass extract.' },
  { label: 'Categories with data', value: categorySummaries.length.toLocaleString('sv-SE'), detail: 'Categories containing at least one verified product row.' }
];

export const unavailablePanels = [
  {
    title: 'Household profiles',
    detail: 'No verified household account records are bundled with this static website. The UI therefore hides names, budgets, dietary preferences, and notification preferences instead of inventing them.'
  },
  {
    title: 'Receipt scanner queue',
    detail: 'No production receipt-review records are present in the repo snapshot. Scanner routes show connector status and source coverage only.'
  },
  {
    title: 'Coupons and loyalty offers',
    detail: 'No authenticated coupon feed is ingested. Coupon pages show the currently verified chain-price spread surface, not fictional promotions.'
  }
];

export function findProduct(slug: string) {
  return axfoodProducts.find((product) => product.slug === slug) ?? pricedProducts.find((product) => product.slug === slug);
}

export function findStore(slug: string) {
  return osmStores.find((store) => store.slug === slug);
}

export function chainPriceRows(product: (typeof axfoodProducts)[number]) {
  return Object.entries(product.chains)
    .map(([chain, price]) => ({ chain, ...price }))
    .filter((row) => typeof row.price === 'number');
}
