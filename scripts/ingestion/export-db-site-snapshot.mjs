#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';

function optional(value, key) {
  return value === undefined || value === null ? {} : { [key]: value };
}

export const DEFAULT_REQUIRED_SNAPSHOT_CHAINS = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];

export function parseRequiredSnapshotChains(value) {
  if (!value) return DEFAULT_REQUIRED_SNAPSHOT_CHAINS;
  return value
    .split(',')
    .map((chain) => chain.trim())
    .filter(Boolean);
}

function parseCatalogCoverageTargets(value) {
  if (!value) return undefined;
  const targets = typeof value === 'string' ? JSON.parse(value) : value;
  if (!targets || typeof targets !== 'object' || Array.isArray(targets)) throw new Error('Catalog coverage targets must be an object.');
  return targets;
}

export function parseRequiredStoreExternalRefsFromCatalogTargets(value) {
  const targets = parseCatalogCoverageTargets(value);
  if (!targets) return [];
  if (!Array.isArray(targets.targetStores)) throw new Error('Catalog coverage targets must include targetStores.');
  return targets.targetStores.map((store) => String(store).trim()).filter(Boolean);
}

export function parseRequiredProductSlugsFromCatalogTargets(value) {
  const targets = parseCatalogCoverageTargets(value);
  if (!targets) return [];
  if (!Array.isArray(targets.targetProducts)) throw new Error('Catalog coverage targets must include targetProducts.');
  return targets.targetProducts.map((product) => String(product).trim()).filter(Boolean);
}

export function parseRequiredPriceTypesFromCatalogTargets(value) {
  const targets = parseCatalogCoverageTargets(value);
  if (!targets) return [];
  if (!Array.isArray(targets.targetPriceTypes)) throw new Error('Catalog coverage targets must include targetPriceTypes.');
  return targets.targetPriceTypes.map((priceType) => String(priceType).trim()).filter(Boolean);
}

export function parseRequiredCategorySlugsFromCatalogTargets(value) {
  const targets = parseCatalogCoverageTargets(value);
  if (!targets) return [];
  if (!Array.isArray(targets.targetCategories)) throw new Error('Catalog coverage targets must include targetCategories.');
  return targets.targetCategories.map((category) => String(category).trim()).filter(Boolean);
}

function normalizeCoverageSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildDbSiteSnapshotArtifact({ generatedAt = new Date().toISOString(), rows, requiredChains = DEFAULT_REQUIRED_SNAPSHOT_CHAINS, requiredStoreExternalRefs = [], requiredProductSlugs = [], requiredPriceTypes = [], requiredCategorySlugs = [], maxObservedAgeHours }) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No latest price rows available for DB-to-site snapshot export.');

  const priceRows = rows.map((row) => ({
    productSlug: row.productSlug,
    canonicalName: row.canonicalName,
    ...optional(row.brand, 'brand'),
    ...optional(row.imageUrl, 'imageUrl'),
    categoryPath: row.categoryPath ?? [],
    ...optional(row.packageSize, 'packageSize'),
    ...optional(row.packageUnit, 'packageUnit'),
    comparableUnit: row.comparableUnit,
    chainSlug: row.chainSlug,
    chainName: row.chainName,
    ...optional(row.storeSlug, 'storeSlug'),
    ...optional(row.storeExternalRef, 'storeExternalRef'),
    ...optional(row.storeName, 'storeName'),
    ...optional(row.city, 'city'),
    priceType: row.priceType,
    price: row.price,
    ...optional(row.regularPrice, 'regularPrice'),
    unitPrice: row.unitPrice,
    currency: row.currency,
    observedAt: row.observedAt,
    isAvailable: row.isAvailable !== false,
    confidence: row.confidence,
    observationId: row.observationId,
    ...optional(row.promotionText, 'promotionText'),
    ...optional(row.promotionStartsOn, 'promotionStartsOn'),
    ...optional(row.promotionEndsOn, 'promotionEndsOn'),
    memberRequired: row.memberRequired === true,
    ...optional(row.validFrom, 'validFrom'),
    ...optional(row.validUntil, 'validUntil'),
    ...optional(row.retailerProductRef, 'retailerProductRef'),
    provenance: row.provenance ?? {}
  }));

  const normalizedMaxObservedAgeHours = maxObservedAgeHours === undefined ? undefined : Number(maxObservedAgeHours);
  if (normalizedMaxObservedAgeHours !== undefined && (!Number.isFinite(normalizedMaxObservedAgeHours) || normalizedMaxObservedAgeHours <= 0)) {
    throw new Error('maxObservedAgeHours must be a positive number.');
  }
  const generatedAtMs = Date.parse(generatedAt);
  const observedAtTimes = priceRows.map((row) => ({
    observationId: row.observationId,
    observedAt: row.observedAt,
    observedAtMs: Date.parse(row.observedAt)
  }));
  const oldestObservedAt = observedAtTimes
    .filter((row) => Number.isFinite(row.observedAtMs))
    .sort((a, b) => a.observedAtMs - b.observedAtMs)[0]?.observedAt;
  const staleObservationIds = normalizedMaxObservedAgeHours === undefined
    ? []
    : observedAtTimes
      .filter((row) => !Number.isFinite(generatedAtMs) || !Number.isFinite(row.observedAtMs) || generatedAtMs - row.observedAtMs > normalizedMaxObservedAgeHours * 60 * 60 * 1000)
      .map((row) => row.observationId);
  if (staleObservationIds.length > 0) {
    throw new Error(`db_site_snapshot_stale_observations:${staleObservationIds.join(',')}`);
  }

  const observedChains = new Set(priceRows.map((row) => row.chainSlug));
  const normalizedRequiredChains = [...new Set(requiredChains.map((chain) => String(chain).trim()).filter(Boolean))].sort();
  const missingRequiredChains = normalizedRequiredChains.filter((chain) => !observedChains.has(chain));
  if (missingRequiredChains.length > 0) {
    throw new Error(`db_site_snapshot_missing_required_chains:${missingRequiredChains.join(',')}`);
  }
  const observedStoreExternalRefs = new Set(priceRows.map((row) => row.storeExternalRef).filter(Boolean));
  const normalizedRequiredStoreExternalRefs = [...new Set(requiredStoreExternalRefs.map((store) => String(store).trim()).filter(Boolean))].sort();
  const missingRequiredStoreExternalRefs = normalizedRequiredStoreExternalRefs.filter((store) => !observedStoreExternalRefs.has(store));
  if (missingRequiredStoreExternalRefs.length > 0) {
    throw new Error(`db_site_snapshot_missing_required_stores:${missingRequiredStoreExternalRefs.join(',')}`);
  }
  const normalizedRequiredPriceTypes = [...new Set(requiredPriceTypes.map((priceType) => String(priceType).trim()).filter(Boolean))].sort();
  const observedStorePriceTypes = new Set(priceRows
    .filter((row) => row.storeExternalRef)
    .map((row) => `${row.storeExternalRef}:${row.priceType}`));
  const missingRequiredStorePriceTypes = normalizedRequiredStoreExternalRefs.flatMap((storeExternalRef) =>
    normalizedRequiredPriceTypes
      .filter((priceType) => !observedStorePriceTypes.has(`${storeExternalRef}:${priceType}`))
      .map((priceType) => `${storeExternalRef}:${priceType}`)
  );
  if (missingRequiredStorePriceTypes.length > 0) {
    throw new Error(`db_site_snapshot_missing_required_store_price_types:${missingRequiredStorePriceTypes.join(',')}`);
  }
  const observedCategorySlugs = new Set(priceRows.flatMap((row) => (row.categoryPath ?? []).map(normalizeCoverageSlug).filter(Boolean)));
  const normalizedRequiredCategorySlugs = [...new Set(requiredCategorySlugs.map(normalizeCoverageSlug).filter(Boolean))].sort();
  const missingRequiredCategorySlugs = normalizedRequiredCategorySlugs.filter((category) => !observedCategorySlugs.has(category));
  if (missingRequiredCategorySlugs.length > 0) {
    throw new Error(`db_site_snapshot_missing_required_categories:${missingRequiredCategorySlugs.join(',')}`);
  }
  const observedProductSlugs = new Set(priceRows.map((row) => row.productSlug));
  const normalizedRequiredProductSlugs = [...new Set(requiredProductSlugs.map((product) => String(product).trim()).filter(Boolean))].sort();
  const missingRequiredProductSlugs = normalizedRequiredProductSlugs.filter((product) => !observedProductSlugs.has(product));
  if (missingRequiredProductSlugs.length > 0) {
    throw new Error(`db_site_snapshot_missing_required_products:${missingRequiredProductSlugs.join(',')}`);
  }

  return {
    status: 'passed',
    generatedAt,
    source: 'postgres.latest_prices+observations',
    coverage: {
      products: new Set(priceRows.map((row) => row.productSlug)).size,
      chains: observedChains.size,
      stores: new Set(priceRows.map((row) => row.storeSlug).filter(Boolean)).size,
      observations: priceRows.length,
      requiredChains: normalizedRequiredChains,
      missingRequiredChains,
      requiredStoreExternalRefs: normalizedRequiredStoreExternalRefs,
      missingRequiredStoreExternalRefs,
      requiredProductSlugs: normalizedRequiredProductSlugs,
      missingRequiredProductSlugs,
      requiredPriceTypes: normalizedRequiredPriceTypes,
      missingRequiredStorePriceTypes,
      requiredCategorySlugs: normalizedRequiredCategorySlugs,
      missingRequiredCategorySlugs,
      ...(normalizedMaxObservedAgeHours === undefined ? {} : {
        maxObservedAgeHours: normalizedMaxObservedAgeHours,
        oldestObservedAt,
        staleObservationCount: staleObservationIds.length,
        staleObservationIds
      })
    },
    priceRows
  };
}

const CHAIN_DISPLAY_NAMES = new Map([
  ['citygross', 'City Gross'],
  ['city-gross', 'City Gross'],
  ['coop', 'Coop'],
  ['hemkop', 'Hemköp'],
  ['ica', 'ICA'],
  ['lidl', 'Lidl'],
  ['mathem', 'Mathem'],
  ['willys', 'Willys']
]);

function slugPart(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' och ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function categorySlug(row) {
  const [firstCategory] = row.categoryPath ?? [];
  return slugPart(firstCategory || 'grocery') || 'grocery';
}

function chainDisplayName(row) {
  const chainKey = slugPart(row.chainSlug);
  return CHAIN_DISPLAY_NAMES.get(chainKey) ?? row.chainName ?? chainKey;
}

function packageLabel(row) {
  const size = row.packageSize;
  const unit = row.packageUnit;
  if (size === undefined || size === null || !unit) return row.brand || row.canonicalName;
  return `${row.brand ? `${row.brand}, ` : ''}${String(size).replace('.', ',')}${unit}`;
}

function formatSek(value) {
  return `${new Intl.NumberFormat('sv-SE', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(value)} kr`;
}

function observedPriceUnit(row) {
  if (row.packageSize !== undefined && row.packageSize !== null) return 'kr/st';
  return `kr/${row.packageUnit || row.comparableUnit || 'st'}`;
}

function buildChainPrice(row) {
  return {
    price: row.price,
    priceText: formatSek(row.price),
    priceUnit: observedPriceUnit(row),
    isAvailable: row.isAvailable !== false,
    savings: typeof row.regularPrice === 'number' && row.regularPrice > row.price ? Math.round((row.regularPrice - row.price) * 100) / 100 : null,
    url: ''
  };
}

function sourceUrl(row) {
  const provenance = row.provenance && typeof row.provenance === 'object' ? row.provenance : {};
  return String(provenance.sourceUrl ?? provenance.url ?? '');
}

function productUrl(row) {
  const provenance = row.provenance && typeof row.provenance === 'object' ? row.provenance : {};
  return String(provenance.productUrl ?? provenance.url ?? '');
}

function dateOrObserved(row, value) {
  return value || row.observedAt;
}

function packageText(row) {
  if (row.packageSize === undefined || row.packageSize === null || !row.packageUnit) return '';
  return `${String(row.packageSize).replace('.', ',')} ${row.packageUnit}`;
}

function unitPriceText(row) {
  const unit = row.comparableUnit || row.packageUnit || 'st';
  return `${formatSek(row.unitPrice)}/${unit}`;
}

function regularPriceText(row) {
  return typeof row.regularPrice === 'number' ? formatSek(row.regularPrice) : '';
}

function publicRowCode(row) {
  return row.retailerProductRef || row.observationId || `${row.chainSlug}:${row.productSlug}`;
}

export function buildDbSiteAxfoodProducts(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const byProduct = new Map();
  for (const row of rows) {
    if (!row.productSlug || !row.canonicalName || !row.chainSlug || !Number.isFinite(row.price)) continue;
    const product = byProduct.get(row.productSlug) ?? {
      code: row.productSlug,
      slug: row.productSlug,
      name: row.canonicalName,
      brand: row.brand ?? '',
      subline: packageLabel(row),
      category: categorySlug(row),
      image: row.imageUrl ?? '',
      labels: [],
      chains: {}
    };
    const chainKey = slugPart(row.chainSlug);
    const chainName = chainDisplayName(row);
    const current = product.chains[chainKey];
    if (
      !current ||
      row.price < current.price ||
      (row.price === current.price && row.observedAt.localeCompare(current.observedAt) > 0)
    ) {
      product.chains[chainKey] = { ...buildChainPrice(row), chainName, observedAt: row.observedAt };
    }
    byProduct.set(row.productSlug, product);
  }

  return [...byProduct.values()]
    .map((product) => {
      const prices = Object.values(product.chains)
        .map((chain) => chain.price)
        .filter((price) => typeof price === 'number' && Number.isFinite(price) && price > 0);
      if (prices.length === 0) return null;
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const lowestEntry = Object.entries(product.chains)
        .filter(([, chain]) => typeof chain.price === 'number')
        .sort((left, right) => left[1].price - right[1].price || left[0].localeCompare(right[0]))[0];
      const chains = Object.fromEntries(
        Object.entries(product.chains).map(([chain, value]) => {
          const { observedAt, chainName, ...publicPrice } = value;
          return [chain, publicPrice];
        })
      );
      return {
        ...product,
        chains,
        lowestChain: lowestEntry?.[0] ?? Object.keys(chains)[0],
        lowestPrice,
        highestPrice,
        spreadPct: lowestPrice > 0 ? Math.round(((highestPrice - lowestPrice) / lowestPrice) * 1000) / 10 : 0,
        inChains: Object.keys(chains).sort()
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.spreadPct - left.spreadPct || left.name.localeCompare(right.name, 'sv'));
}

export function buildDbSiteChainPriceObservations(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .map((row) => {
      if (!row.chainSlug || !Number.isFinite(row.unitPrice) || row.unitPrice <= 0) return null;
      const unit = row.comparableUnit || row.packageUnit || 'st';
      return {
        chainId: chainDisplayName(row),
        category: `${categorySlug(row)} · ${unit}`,
        unitPrice: Math.round(row.unitPrice * 10000) / 10000
      };
    })
    .filter(Boolean)
    .sort((left, right) =>
      left.chainId.localeCompare(right.chainId, 'sv') ||
      left.category.localeCompare(right.category, 'sv') ||
      left.unitPrice - right.unitPrice
    );
}

export function buildDbSiteMatpriskollenOffers(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .filter((row) => row.productSlug && row.canonicalName && Number.isFinite(row.price))
    .map((row) => ({
      code: publicRowCode(row),
      name: row.canonicalName,
      brand: row.brand ?? '',
      store: row.storeName || chainDisplayName(row),
      storeKey: row.storeExternalRef || row.storeSlug || row.chainSlug,
      storeId: row.storeSlug || row.storeExternalRef || row.chainSlug,
      category: (row.categoryPath ?? []).join(' > ') || categorySlug(row),
      priceText: formatSek(row.price),
      comparePriceText: unitPriceText(row),
      regularPriceText: regularPriceText(row),
      packageText: packageText(row),
      condition: row.promotionText ?? '',
      origin: '',
      requiresMembershipCard: row.memberRequired === true,
      requiresCoupon: false,
      validFrom: dateOrObserved(row, row.validFrom || row.promotionStartsOn),
      validTo: dateOrObserved(row, row.validUntil || row.promotionEndsOn),
      sourceUrl: sourceUrl(row),
      productUrl: productUrl(row),
      imageUrl: row.imageUrl ?? '',
      retrievedAt: row.observedAt
    }))
    .sort((left, right) =>
      left.validTo.localeCompare(right.validTo) ||
      left.store.localeCompare(right.store, 'sv') ||
      left.name.localeCompare(right.name, 'sv')
    );
}

export function buildDbSiteLidlStoreOffers(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .filter((row) => slugPart(row.chainSlug) === 'lidl' && row.productSlug && row.canonicalName && Number.isFinite(row.price))
    .map((row) => ({
      code: publicRowCode(row),
      name: row.canonicalName,
      brand: row.brand ?? '',
      packageText: packageText(row),
      category: categorySlug(row),
      price: row.price,
      regularPrice: typeof row.regularPrice === 'number' ? row.regularPrice : null,
      priceText: formatSek(row.price),
      unitPriceText: unitPriceText(row),
      promotionText: row.promotionText ?? '',
      memberOnly: row.memberRequired === true,
      regions: row.city ? [row.city] : [],
      validFrom: dateOrObserved(row, row.validFrom || row.promotionStartsOn),
      validTo: dateOrObserved(row, row.validUntil || row.promotionEndsOn),
      productUrl: productUrl(row),
      imageUrl: row.imageUrl ?? '',
      sourceUrl: sourceUrl(row),
      retrievedAt: row.observedAt,
      storeId: row.storeSlug || row.storeExternalRef || row.chainSlug,
      storeName: row.storeName || chainDisplayName(row),
      city: row.city ?? ''
    }))
    .sort((left, right) =>
      left.storeName.localeCompare(right.storeName, 'sv') ||
      left.category.localeCompare(right.category, 'sv') ||
      left.name.localeCompare(right.name, 'sv')
    );
}

export function buildDbSiteIcaReklambladOffers(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .filter((row) => slugPart(row.chainSlug) === 'ica' && row.productSlug && row.canonicalName && Number.isFinite(row.price))
    .map((row) => ({
      code: publicRowCode(row),
      name: row.canonicalName,
      brand: row.brand ?? '',
      packageText: packageText(row),
      category: (row.categoryPath ?? []).join(' > ') || categorySlug(row),
      priceText: formatSek(row.price),
      comparisonPrice: unitPriceText(row),
      regularPriceText: regularPriceText(row),
      validTo: dateOrObserved(row, row.validUntil || row.promotionEndsOn),
      storeName: row.storeName || chainDisplayName(row),
      storeId: row.storeSlug || row.storeExternalRef || row.chainSlug,
      availableInStore: true,
      availableOnline: row.isAvailable !== false,
      eans: [],
      sourceUrl: sourceUrl(row),
      flyerUrl: '',
      flyerPdfUrl: '',
      imageUrl: row.imageUrl ?? '',
      retrievedAt: row.observedAt
    }))
    .sort((left, right) =>
      left.storeName.localeCompare(right.storeName, 'sv') ||
      left.category.localeCompare(right.category, 'sv') ||
      left.name.localeCompare(right.name, 'sv')
    );
}

export function buildDbSiteMathemProducts(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .filter((row) => slugPart(row.chainSlug) === 'mathem' && row.productSlug && row.canonicalName && Number.isFinite(row.price))
    .map((row) => ({
      code: row.retailerProductRef || row.productSlug,
      name: row.canonicalName,
      brand: row.brand ?? '',
      packageText: packageText(row),
      price: row.price,
      priceText: formatSek(row.price),
      unitPrice: Number.isFinite(row.unitPrice) ? row.unitPrice : null,
      unitPriceText: Number.isFinite(row.unitPrice) ? formatSek(row.unitPrice) : '',
      unitPriceUnit: row.comparableUnit || row.packageUnit || '',
      imageUrl: row.imageUrl ?? '',
      productUrl: productUrl(row),
      available: row.isAvailable !== false,
      sourceUrl: sourceUrl(row),
      retrievedAt: row.observedAt
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'sv') || left.price - right.price);
}

export function buildDbSiteCompareStoreCapabilities(rows, generatedAt) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const byChain = new Map();
  for (const row of rows) {
    if (!row.chainSlug || !Number.isFinite(row.price)) continue;
    const chainId = slugPart(row.chainSlug);
    if (!chainId) continue;
    const current = byChain.get(chainId) ?? {
      chainId,
      chainName: chainDisplayName(row),
      canCompare: false,
      rowCount: 0,
      evidenceUpdatedAt: null,
      generatedAt,
      source: 'postgres.latest_prices/observations compare store capability export'
    };
    current.rowCount += 1;
    current.canCompare = current.rowCount > 0;
    if (!current.evidenceUpdatedAt || String(row.observedAt).localeCompare(current.evidenceUpdatedAt) > 0) {
      current.evidenceUpdatedAt = row.observedAt ?? generatedAt;
    }
    byChain.set(chainId, current);
  }

  return [...byChain.values()].sort((left, right) => left.chainName.localeCompare(right.chainName, 'sv'));
}

export function renderDbSiteProductsModule({ generatedAt, rows }) {
  const products = buildDbSiteAxfoodProducts(rows);
  return [
    '// AUTO-GENERATED from postgres.latest_prices/observations by scripts/ingestion/export-db-site-snapshot.mjs.',
    `// Generated at: ${generatedAt}`,
    `// Product row count: ${products.length}`,
    "import type { AxfoodProduct } from '../axfood-products';",
    '',
    `export const dbSiteSnapshotGeneratedAt = ${JSON.stringify(generatedAt)};`,
    `export const dbSiteAxfoodProducts: AxfoodProduct[] = ${JSON.stringify(products, null, 2)};`,
    ''
  ].join('\n');
}

export function renderDbSiteChainObservationsModule({ generatedAt, rows }) {
  const observations = buildDbSiteChainPriceObservations(rows);
  return [
    '// AUTO-GENERATED from postgres.latest_prices/observations by scripts/ingestion/export-db-site-snapshot.mjs.',
    `// Generated at: ${generatedAt}`,
    `// Chain index observation row count: ${observations.length}`,
    "import type { ChainPriceObservation } from '@groceryview/core';",
    '',
    `export const dbSiteChainObservationsGeneratedAt = ${JSON.stringify(generatedAt)};`,
    `export const dbSiteSnapshotChainPriceObservations: ChainPriceObservation[] = ${JSON.stringify(observations, null, 2)};`,
    ''
  ].join('\n');
}

export function renderDbSiteIngestedOverridesModule({ generatedAt, rows }) {
  const matpriskollenOffers = buildDbSiteMatpriskollenOffers(rows);
  const lidlStoreOffers = buildDbSiteLidlStoreOffers(rows);
  const icaReklambladOffers = buildDbSiteIcaReklambladOffers(rows);
  const mathemProducts = buildDbSiteMathemProducts(rows);
  const compareStoreCapabilities = buildDbSiteCompareStoreCapabilities(rows, generatedAt);
  return [
    '// AUTO-GENERATED from postgres.latest_prices/observations by scripts/ingestion/export-db-site-snapshot.mjs.',
    `// Generated at: ${generatedAt}`,
    `// Matpriskollen-compatible row count: ${matpriskollenOffers.length}`,
    `// Lidl-compatible row count: ${lidlStoreOffers.length}`,
    `// ICA flyer-compatible row count: ${icaReklambladOffers.length}`,
    `// Mathem-compatible row count: ${mathemProducts.length}`,
    `// Compare store capability row count: ${compareStoreCapabilities.length}`,
    "import type { IcaReklambladIngestedOffer } from '../ingested/ica-reklamblad';",
    "import type { LidlIngestedStoreOffer } from '../ingested/lidl';",
    "import type { MathemIngestedProduct } from '../ingested/mathem';",
    "import type { MatpriskollenIngestedOffer } from '../ingested/matpriskollen';",
    '',
    `export const dbSiteIngestedOverridesGeneratedAt = ${JSON.stringify(generatedAt)};`,
    '',
    `export const dbSiteMatpriskollenOffers: MatpriskollenIngestedOffer[] = ${JSON.stringify(matpriskollenOffers, null, 2)};`,
    `export const dbSiteLidlStoreOffers: LidlIngestedStoreOffer[] = ${JSON.stringify(lidlStoreOffers, null, 2)};`,
    `export const dbSiteIcaReklambladOffers: IcaReklambladIngestedOffer[] = ${JSON.stringify(icaReklambladOffers, null, 2)};`,
    `export const dbSiteMathemProducts: MathemIngestedProduct[] = ${JSON.stringify(mathemProducts, null, 2)};`,
    '',
    'export type DbSiteCompareStoreCapability = { chainId: string; chainName: string; canCompare: boolean; rowCount: number; evidenceUpdatedAt: string | null; generatedAt: string | null; source: string };',
    `export const dbSiteCompareStoreCapabilities: DbSiteCompareStoreCapability[] = ${JSON.stringify(compareStoreCapabilities, null, 2)};`,
    '',
    `export const dbSiteMatpriskollenSource = ${JSON.stringify({ source: 'postgres.latest_prices/observations Matpriskollen-compatible export', retrievedAt: generatedAt, rowCount: matpriskollenOffers.length }, null, 2)} as const;`,
    `export const dbSiteLidlSource = ${JSON.stringify({ source: 'postgres.latest_prices/observations Lidl-compatible export', retrievedAt: generatedAt, rowCount: lidlStoreOffers.length }, null, 2)} as const;`,
    `export const dbSiteIcaReklambladSource = ${JSON.stringify({ source: 'postgres.latest_prices/observations ICA flyer-compatible export', retrievedAt: generatedAt, rowCount: icaReklambladOffers.length }, null, 2)} as const;`,
    `export const dbSiteMathemSource = ${JSON.stringify({ source: 'postgres.latest_prices/observations Mathem-compatible export', retrievedAt: generatedAt, rowCount: mathemProducts.length }, null, 2)} as const;`,
    ''
  ].join('\n');
}

function writeTextFile(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function pathExists(path) {
  try {
    readFileSync(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function parsePositiveNumber(value, name) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive number.`);
  return parsed;
}

const COVERAGE_GAP_KEYS = [
  'missingRequiredChains',
  'missingRequiredStoreExternalRefs',
  'missingRequiredProductSlugs',
  'missingRequiredStorePriceTypes',
  'missingRequiredCategorySlugs'
];

export function validateDbSiteSnapshotCacheArtifact({ artifact, cacheTtlSeconds, maxObservedAgeHours, now = new Date() }) {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return false;
  if (artifact.status !== 'passed') return false;
  if (!Array.isArray(artifact.priceRows) || artifact.priceRows.length === 0) return false;
  const coverage = artifact.coverage;
  if (!coverage || typeof coverage !== 'object' || Array.isArray(coverage)) return false;
  if (typeof coverage.observations !== 'number' || coverage.observations < 1) return false;
  if (COVERAGE_GAP_KEYS.some((key) => !Array.isArray(coverage[key]) || coverage[key].length > 0)) return false;
  if (coverage.staleObservationCount !== undefined && coverage.staleObservationCount !== 0) return false;

  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const generatedAtMs = Date.parse(artifact.generatedAt);
  if (!Number.isFinite(nowMs) || !Number.isFinite(generatedAtMs)) return false;
  const cacheTtlMs = cacheTtlSeconds * 1000;
  if (generatedAtMs > nowMs || nowMs - generatedAtMs > cacheTtlMs) return false;

  if (maxObservedAgeHours !== undefined) {
    const maxObservedAgeMs = maxObservedAgeHours * 60 * 60 * 1000;
    const hasStaleObservation = artifact.priceRows.some((row) => {
      const observedAtMs = Date.parse(row.observedAt);
      return !Number.isFinite(observedAtMs) || nowMs - observedAtMs > maxObservedAgeMs;
    });
    if (hasStaleObservation) return false;
  }

  return true;
}

export function readFreshDbSiteSnapshotCache({ outputPath, modulePath, chainObservationsModulePath, ingestedOverridesModulePath, cacheTtlSeconds, maxObservedAgeHours }) {
  if (cacheTtlSeconds === undefined || !outputPath) return undefined;
  const requestedOutputPaths = [outputPath, modulePath, chainObservationsModulePath, ingestedOverridesModulePath].filter(Boolean);
  if (requestedOutputPaths.some((path) => !pathExists(path))) return undefined;
  const artifact = JSON.parse(readFileSync(outputPath, 'utf8'));
  return validateDbSiteSnapshotCacheArtifact({ artifact, cacheTtlSeconds, maxObservedAgeHours }) ? artifact : undefined;
}

function writeDbSiteSnapshotOutputs({ artifact, outputPath, modulePath, chainObservationsModulePath, ingestedOverridesModulePath }) {
  if (outputPath) writeTextFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
  if (modulePath) writeTextFile(modulePath, renderDbSiteProductsModule({ generatedAt: artifact.generatedAt, rows: artifact.priceRows }));
  if (chainObservationsModulePath) writeTextFile(chainObservationsModulePath, renderDbSiteChainObservationsModule({ generatedAt: artifact.generatedAt, rows: artifact.priceRows }));
  if (ingestedOverridesModulePath) writeTextFile(ingestedOverridesModulePath, renderDbSiteIngestedOverridesModule({ generatedAt: artifact.generatedAt, rows: artifact.priceRows }));
}

async function exportDbSiteSnapshotFromEnv(env = process.env) {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required for DB-to-site snapshot export.');
  const outputPath = env.GROCERYVIEW_DB_SITE_SNAPSHOT_PATH?.trim();
  const modulePath = env.GROCERYVIEW_DB_SITE_SNAPSHOT_MODULE_PATH?.trim();
  const chainObservationsModulePath = env.GROCERYVIEW_DB_SITE_SNAPSHOT_CHAIN_OBSERVATIONS_MODULE_PATH?.trim();
  const ingestedOverridesModulePath = env.GROCERYVIEW_DB_SITE_SNAPSHOT_INGESTED_OVERRIDES_MODULE_PATH?.trim();
  if (!outputPath && !modulePath && !chainObservationsModulePath && !ingestedOverridesModulePath) throw new Error('GROCERYVIEW_DB_SITE_SNAPSHOT_PATH, GROCERYVIEW_DB_SITE_SNAPSHOT_MODULE_PATH, GROCERYVIEW_DB_SITE_SNAPSHOT_CHAIN_OBSERVATIONS_MODULE_PATH, or GROCERYVIEW_DB_SITE_SNAPSHOT_INGESTED_OVERRIDES_MODULE_PATH is required for DB-to-site snapshot export.');
  const minConfidence = env.GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE ? Number(env.GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE) : undefined;
  const limit = env.GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT ? Number(env.GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT) : undefined;
  if (minConfidence !== undefined && !Number.isFinite(minConfidence)) throw new Error('GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE must be a number.');
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error('GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT must be a positive integer.');
  const maxObservedAgeHours = parsePositiveNumber(env.GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS, 'GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS');
  const cacheTtlSeconds = parsePositiveNumber(env.GROCERYVIEW_DB_SITE_SNAPSHOT_CACHE_TTL_SECONDS, 'GROCERYVIEW_DB_SITE_SNAPSHOT_CACHE_TTL_SECONDS');
  const requiredChains = parseRequiredSnapshotChains(env.GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS);
  const requiredStoreTargetsJson = env.GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON_FILE
    ? readFileSync(env.GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON_FILE, 'utf8')
    : env.GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON;
  const requiredStoreExternalRefs = parseRequiredStoreExternalRefsFromCatalogTargets(requiredStoreTargetsJson);
  const requiredProductSlugs = parseRequiredProductSlugsFromCatalogTargets(requiredStoreTargetsJson);
  const requiredPriceTypes = parseRequiredPriceTypesFromCatalogTargets(requiredStoreTargetsJson);
  const requiredCategorySlugs = parseRequiredCategorySlugsFromCatalogTargets(requiredStoreTargetsJson);

  const cachedArtifact = readFreshDbSiteSnapshotCache({ outputPath, modulePath, chainObservationsModulePath, ingestedOverridesModulePath, cacheTtlSeconds, maxObservedAgeHours });
  if (cachedArtifact) {
    writeDbSiteSnapshotOutputs({ artifact: cachedArtifact, outputPath, modulePath, chainObservationsModulePath, ingestedOverridesModulePath });
    return cachedArtifact;
  }

  const [{ createPgQueryExecutor, createPostgresSiteSnapshotReader }, pg] = await Promise.all([
    import('@groceryview/db'),
    import('pg')
  ]);
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const reader = createPostgresSiteSnapshotReader(createPgQueryExecutor(pool));
    const rows = await reader.listLatestPriceSnapshotRows({ minConfidence, limit });
    const artifact = buildDbSiteSnapshotArtifact({ rows, requiredChains, requiredStoreExternalRefs, requiredProductSlugs, requiredPriceTypes, requiredCategorySlugs, maxObservedAgeHours });
    writeDbSiteSnapshotOutputs({ artifact, outputPath, modulePath, chainObservationsModulePath, ingestedOverridesModulePath });
    return artifact;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  exportDbSiteSnapshotFromEnv()
    .then((artifact) => {
      process.stdout.write(`${JSON.stringify({
        status: artifact.status,
        coverage: artifact.coverage,
        outputPath: process.env.GROCERYVIEW_DB_SITE_SNAPSHOT_PATH,
        modulePath: process.env.GROCERYVIEW_DB_SITE_SNAPSHOT_MODULE_PATH,
        chainObservationsModulePath: process.env.GROCERYVIEW_DB_SITE_SNAPSHOT_CHAIN_OBSERVATIONS_MODULE_PATH,
        ingestedOverridesModulePath: process.env.GROCERYVIEW_DB_SITE_SNAPSHOT_INGESTED_OVERRIDES_MODULE_PATH
      }, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
