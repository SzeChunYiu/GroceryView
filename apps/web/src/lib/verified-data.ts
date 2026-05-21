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

export const storeBrandLedger = Object.values(
  osmStores.reduce<Record<string, {
    brand: string;
    stores: number;
    districts: Set<string>;
    formats: Set<string>;
    addressedStores: number;
    latestRetrieved: string;
    sampleSlug: string;
  }>>((ledger, store) => {
    const brand = store.brand || 'Unbranded';
    const row = ledger[brand] ?? {
      brand,
      stores: 0,
      districts: new Set<string>(),
      formats: new Set<string>(),
      addressedStores: 0,
      latestRetrieved: '',
      sampleSlug: store.slug
    };

    row.stores += 1;
    if (store.district) row.districts.add(store.district);
    if (store.format) row.formats.add(store.format);
    if (store.address) row.addressedStores += 1;
    if (store.retrievedDate > row.latestRetrieved) row.latestRetrieved = store.retrievedDate;
    ledger[brand] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    brand: row.brand,
    stores: row.stores,
    districts: row.districts.size,
    formats: Array.from(row.formats).sort((a, b) => a.localeCompare(b, 'sv')).slice(0, 3),
    addressCoverage: row.stores ? row.addressedStores / row.stores : 0,
    latestRetrieved: row.latestRetrieved,
    sampleSlug: row.sampleSlug
  }))
  .sort((a, b) => b.stores - a.stores || a.brand.localeCompare(b.brand, 'sv'))
  .slice(0, 8);

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

export const categoryQualityMatrix = categorySummaries
  .map((category) => {
    const openRows = pricedProducts.filter((product) => product.category === category.slug);
    const chainRows = axfoodProducts.filter((product) => product.category === category.slug);
    const latestOpenPrice = openRows.reduce((latest, product) => product.lastObservedAt > latest ? product.lastObservedAt : latest, '');
    const observedProducts = new Set(openRows.map((product) => product.code || product.slug)).size;
    const chainMatches = chainRows.filter((product) => product.inChains.length > 1).length;

    return {
      slug: category.slug,
      label: category.label,
      verifiedRows: openRows.length + chainRows.length,
      observedProducts,
      chainMatches,
      latestOpenPrice,
      spreadSignal: category.strongestSpread,
      qualityScore: openRows.length + chainMatches * 2 + (latestOpenPrice ? 1 : 0)
    };
  })
  .filter((category) => category.verifiedRows > 0)
  .sort((a, b) => b.qualityScore - a.qualityScore || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 8);

export const chainCategoryCoverage = Object.values(
  matchedChainProducts.reduce<Record<string, {
    slug: string;
    chainRows: number;
    matchedProducts: number;
    spreadTotal: number;
    topSpread: number;
    willysLowest: number;
    hemkopLowest: number;
  }>>((ledger, product) => {
    const row = ledger[product.category] ?? {
      slug: product.category,
      chainRows: 0,
      matchedProducts: 0,
      spreadTotal: 0,
      topSpread: 0,
      willysLowest: 0,
      hemkopLowest: 0
    };

    row.chainRows += 1;
    row.matchedProducts += 1;
    row.spreadTotal += product.spreadPct;
    row.topSpread = Math.max(row.topSpread, product.spreadPct);
    if (product.lowestChain === 'willys') row.willysLowest += 1;
    if (product.lowestChain === 'hemkop') row.hemkopLowest += 1;
    ledger[product.category] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    slug: row.slug,
    label: labelFromSlug(row.slug),
    chainRows: row.chainRows,
    matchedProducts: row.matchedProducts,
    averageSpread: row.matchedProducts ? row.spreadTotal / row.matchedProducts : 0,
    topSpread: row.topSpread,
    leadingLowestChain: row.willysLowest >= row.hemkopLowest ? 'Willys' : 'Hemkop',
    coverageScore: row.matchedProducts * 2 + row.topSpread
  }))
  .sort((a, b) => b.coverageScore - a.coverageScore || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 6);

export const openPriceObservationDepth = Object.values(
  pricedProducts.reduce<Record<string, {
    slug: string;
    products: number;
    observationTotal: number;
    latestObservation: string;
    topProductName: string;
    topProductSlug: string;
    topProductObservations: number;
  }>>((ledger, product) => {
    const row = ledger[product.category] ?? {
      slug: product.category,
      products: 0,
      observationTotal: 0,
      latestObservation: '',
      topProductName: '',
      topProductSlug: '',
      topProductObservations: 0
    };

    row.products += 1;
    row.observationTotal += product.observationCount;
    if (product.lastObservedAt > row.latestObservation) row.latestObservation = product.lastObservedAt;
    if (product.observationCount > row.topProductObservations) {
      row.topProductName = product.name;
      row.topProductSlug = product.slug;
      row.topProductObservations = product.observationCount;
    }
    ledger[product.category] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    slug: row.slug,
    label: labelFromSlug(row.slug),
    products: row.products,
    observationTotal: row.observationTotal,
    latestObservation: row.latestObservation,
    topProductName: row.topProductName,
    topProductSlug: row.topProductSlug,
    topProductObservations: row.topProductObservations,
    averageObservations: row.products ? row.observationTotal / row.products : 0
  }))
  .sort((a, b) => b.observationTotal - a.observationTotal || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 6);

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

export type PrivateFeatureRoute =
  | 'weekly-basket'
  | 'watchlist'
  | 'scanner'
  | 'household'
  | 'account'
  | 'account-profile'
  | 'basket-ideas'
  | 'coupon-stacks'
  | 'deals'
  | 'meal-planner'
  | 'nutrition-value'
  | 'pantry-planner'
  | 'price-reports'
  | 'savings-dashboard'
  | 'shopping-trips'
  | 'privacy';

export const privateFeatureCopy: Record<PrivateFeatureRoute, { verifiedSurface: string; gatedBy: string; nextStep: string }> = {
  'weekly-basket': {
    verifiedSurface: 'The page can compare verified Willys/Hemkop spreads and source coverage, but it cannot assemble a household basket without authenticated pantry and quantity records.',
    gatedBy: 'Requires a real household profile, saved staples, and opt-in purchase history before totals or substitutions are shown.',
    nextStep: 'Connect authenticated basket records, then render item-level totals with source timestamps beside every price.'
  },
  watchlist: {
    verifiedSurface: 'The public snapshot supports product spread browsing, but it does not know which products a shopper personally follows.',
    gatedBy: 'Requires signed-in watchlist records and notification consent before alerts can be personalized.',
    nextStep: 'Store verified watchlist preferences first, then show only alerts backed by current chain or OpenPrices rows.'
  },
  scanner: {
    verifiedSurface: 'Scanner routes can explain coverage and price sources, but no production receipt images or review queue rows are bundled.',
    gatedBy: 'Requires uploaded receipts, parser output, and human review status before line-item corrections appear.',
    nextStep: 'Add receipt review records with redacted merchant metadata, then expose the queue with confidence labels.'
  },
  household: {
    verifiedSurface: 'The static build can show public grocery data, not household members, budgets, diets, or location preferences.',
    gatedBy: 'Requires authenticated account records and explicit household sharing settings.',
    nextStep: 'Load profile fields from production auth, then render only confirmed preferences and consent states.'
  },
  account: {
    verifiedSurface: 'The account page stays browse-only because this repository snapshot has no verified user identity records.',
    gatedBy: 'Requires a production auth session plus alert, privacy, and subscription records.',
    nextStep: 'Wire the sign-in flow before showing account settings, saved areas, or message preferences.'
  },
  'account-profile': {
    verifiedSurface: 'The profile page can explain why account data is absent, but it cannot show names, emails, saved areas, or household roles from this static snapshot.',
    gatedBy: 'Requires a signed production session and verified account profile record before personal details are rendered.',
    nextStep: 'Load profile fields from authenticated storage, then show only confirmed identity, consent, and saved-area metadata.'
  },
  'basket-ideas': {
    verifiedSurface: 'The app can rank public price spreads, but it cannot suggest personal baskets without real household goals.',
    gatedBy: 'Requires saved staples, dietary constraints, and accepted substitutions before basket ideas are personalized.',
    nextStep: 'Combine verified profile preferences with current product rows, then label every suggestion by source confidence.'
  },
  'coupon-stacks': {
    verifiedSurface: 'The static snapshot has chain prices but no authenticated coupons, loyalty balances, or receipt bonuses.',
    gatedBy: 'Requires a coupon feed tied to a real account before stacked savings can be counted.',
    nextStep: 'Ingest coupon eligibility and expiry data, then separate guaranteed discounts from receipt-pending bonuses.'
  },
  deals: {
    verifiedSurface: 'Deal radar can point to verified chain-price spreads, but private deal decisions need shopper-specific thresholds.',
    gatedBy: 'Requires saved stores, stock-up rules, and notification consent before deal pushes are shown.',
    nextStep: 'Attach user thresholds to verified product rows, then show deal rationale with price-source caveats.'
  },
  'meal-planner': {
    verifiedSurface: 'Verified product rows can support ingredient research, but meal plans need real preferences and portions.',
    gatedBy: 'Requires dietary preferences, household size, and accepted recipe substitutions.',
    nextStep: 'Load signed-in meal constraints, then build plans only from products with current source coverage.'
  },
  'nutrition-value': {
    verifiedSurface: 'The static snapshot has price data, not complete nutrition labels for every rendered product.',
    gatedBy: 'Requires verified nutrition facts matched to each product code before nutrition-per-krona rankings are shown.',
    nextStep: 'Join nutrition labels to product identifiers, then rank only rows with both price and nutrition evidence.'
  },
  'pantry-planner': {
    verifiedSurface: 'Pantry planning is withheld because the app does not know current household inventory or shelf-life rules.',
    gatedBy: 'Requires saved pantry counts, preferred stores, and real replenishment cadence.',
    nextStep: 'Sync pantry records first, then show restock recommendations with verified price and freshness context.'
  },
  'price-reports': {
    verifiedSurface: 'Public report pages can summarize generated sources, but no private report subscriptions are present.',
    gatedBy: 'Requires subscribed audiences, send approvals, and report history before personalized reports appear.',
    nextStep: 'Store report recipients and approval records, then attach each report claim to a generated data source.'
  },
  'savings-dashboard': {
    verifiedSurface: 'The dashboard can show public coverage, not personal avoided spend or budget progress.',
    gatedBy: 'Requires real baskets, receipts, and baseline prices before savings totals are calculated.',
    nextStep: 'Backfill verified purchase history, then compute savings only from reviewed transactions.'
  },
  'shopping-trips': {
    verifiedSurface: 'Store and price rows are available, but route planning needs real saved locations and trip constraints.',
    gatedBy: 'Requires saved areas, transport mode, store preferences, and consent to use location context.',
    nextStep: 'Connect signed-in trip preferences, then show only trips with current store and product evidence.'
  },
  privacy: {
    verifiedSurface: 'The privacy page avoids pretend toggles because no authenticated consent records are loaded in this snapshot.',
    gatedBy: 'Requires real user consent state and account identity before controls can be changed.',
    nextStep: 'Read privacy preferences from production auth, then render controls with audit timestamps.'
  }
};

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
