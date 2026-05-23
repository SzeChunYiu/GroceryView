#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import process from 'node:process';

export const requiredDailyChainIds = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];

export const requiredEnvNames = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'PUBLIC_WEB_URL',
  'NOTIFICATION_WEBHOOK_SECRET',
  'EXPO_PUSH_ACCESS_TOKEN',
  'SENDGRID_FROM_EMAIL',
  'SENDGRID_API_KEY',
  'BILLING_WEBHOOK_SECRET',
  'METRICS_TOKEN',
  'GROCERYVIEW_SERVER_URL',
  'OCR_SPACE_API_KEY',
  'OCR_SPACE_HEALTHCHECK_IMAGE_URL',
  'OPENFOODFACTS_USER_AGENT',
  'OPENFOODFACTS_HEALTHCHECK_BARCODE',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN',
  'CATALOG_COVERAGE_TARGETS_JSON'
];

export const requiredDailyIngestionEnvNames = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'PUBLIC_WEB_URL',
  'NOTIFICATION_WEBHOOK_SECRET',
  'BILLING_WEBHOOK_SECRET',
  'METRICS_TOKEN',
  'GROCERYVIEW_SERVER_URL',
  'GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN',
  'CATALOG_COVERAGE_TARGETS_JSON'
];

function readJsonValue(env, name) {
  const raw = env[name];
  if (raw?.trim()) return raw;
  const filePath = env[`${name}_FILE`];
  if (filePath?.trim()) return readFileSync(filePath.trim(), 'utf8');
  throw new Error(`${name} or ${name}_FILE is required.`);
}

function parseJsonEnv(env, name) {
  return JSON.parse(readJsonValue(env, name));
}

function requireNonEmptyStringArray(value, path) {
  if (!Array.isArray(value) || value.length === 0 || !value.every((entry) => typeof entry === 'string' && entry.trim())) {
    throw new Error(`${path} must be a non-empty string array.`);
  }
  return value.map((entry) => entry.trim());
}

function requireRequiredChains(label, chainIds) {
  const present = new Set(chainIds);
  const missing = requiredDailyChainIds.filter((chainId) => !present.has(chainId));
  if (missing.length > 0) throw new Error(`${label} missing required chains: ${missing.join(', ')}`);
}

function validateConnectorStores(connector, index) {
  if (connector.requireStoreScopedPrices === false) return [];
  if (!Array.isArray(connector.stores) || connector.stores.length === 0) {
    throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}].stores must list every branch that can emit prices.`);
  }
  return connector.stores.map((store, storeIndex) => {
    const path = `GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}].stores[${storeIndex}]`;
    if (store === null || typeof store !== 'object' || Array.isArray(store)) throw new Error(`${path} must be an object.`);
    for (const field of ['storeId', 'name', 'address', 'city']) {
      if (typeof store[field] !== 'string' || !store[field].trim()) throw new Error(`${path}.${field} is required.`);
    }
    return store.storeId.trim();
  });
}

function validateDailyConnectors(env) {
  const connectors = parseJsonEnv(env, 'GROCERYVIEW_DAILY_CONNECTORS_JSON');
  if (!Array.isArray(connectors) || connectors.length === 0) throw new Error('GROCERYVIEW_DAILY_CONNECTORS_JSON must be a non-empty array.');
  const connectorStoreIds = [];
  const connectorChainIds = [];
  for (const [index, connector] of connectors.entries()) {
    if (connector === null || typeof connector !== 'object' || Array.isArray(connector)) throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}] must be an object.`);
    for (const field of ['connectorId', 'chainId', 'sourceType', 'endpointUrl', 'parserVersion', 'robotsTxtStatus', 'legalReviewStatus', 'hasDataAgreement']) {
      if (connector[field] === undefined || connector[field] === null || connector[field] === '') throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}].${field} is required.`);
    }
    connectorChainIds.push(String(connector.chainId));
    connectorStoreIds.push(...validateConnectorStores(connector, index));
  }
  requireRequiredChains('GROCERYVIEW_DAILY_CONNECTORS_JSON.chainId', connectorChainIds);
  return { connectorCount: connectors.length, connectorStoreCount: connectorStoreIds.length, connectorStoreIds, connectorChainIds: [...new Set(connectorChainIds)].sort() };
}


function validateSourceRunMinimums(env) {
  const thresholds = parseJsonEnv(env, 'GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN');
  if (thresholds === null || typeof thresholds !== 'object' || Array.isArray(thresholds)) {
    throw new Error('GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN must be an object.');
  }
  const entries = Object.entries(thresholds);
  if (entries.length === 0) throw new Error('GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN must include at least one chain threshold.');
  const chainIds = entries.map(([chainId]) => chainId.trim());
  requireRequiredChains('GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN', chainIds);
  for (const [chainId, minimum] of entries) {
    if (!Number.isInteger(minimum) || minimum < 1) {
      throw new Error(`GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN.${chainId} must be a positive integer.`);
    }
  }
  return { chains: chainIds.sort(), minimums: Object.fromEntries(entries.map(([chainId, minimum]) => [chainId.trim(), minimum])) };
}

function validateCatalogTargets(env) {
  const targets = parseJsonEnv(env, 'CATALOG_COVERAGE_TARGETS_JSON');
  if (targets === null || typeof targets !== 'object' || Array.isArray(targets)) throw new Error('CATALOG_COVERAGE_TARGETS_JSON must be an object.');
  const targetProducts = requireNonEmptyStringArray(targets.targetProducts, 'CATALOG_COVERAGE_TARGETS_JSON.targetProducts');
  requireNonEmptyStringArray(targets.targetCategories, 'CATALOG_COVERAGE_TARGETS_JSON.targetCategories');
  const targetChains = requireNonEmptyStringArray(targets.targetChains, 'CATALOG_COVERAGE_TARGETS_JSON.targetChains');
  const targetStores = requireNonEmptyStringArray(targets.targetStores, 'CATALOG_COVERAGE_TARGETS_JSON.targetStores');
  const targetPriceTypes = requireNonEmptyStringArray(targets.targetPriceTypes, 'CATALOG_COVERAGE_TARGETS_JSON.targetPriceTypes');
  requireRequiredChains('CATALOG_COVERAGE_TARGETS_JSON.targetChains', targetChains);
  if (!targetPriceTypes.includes('online')) {
    throw new Error('CATALOG_COVERAGE_TARGETS_JSON.targetPriceTypes must include online so weekly promotions cannot satisfy branch product-price readiness.');
  }
  if (targets.requireEveryProductInEveryStore !== false) {
    throw new Error('CATALOG_COVERAGE_TARGETS_JSON.requireEveryProductInEveryStore must be false; branch-price readiness uses observed/queryable store coverage, not a cross-chain product-store cartesian matrix.');
  }
  if (targets.requireEveryStorePriceType !== true) {
    throw new Error('CATALOG_COVERAGE_TARGETS_JSON.requireEveryStorePriceType must be true so every target branch proves required price types.');
  }
  return { productCount: targetProducts.length, storeCount: targetStores.length, targetStores, targetPriceTypes };
}

function validateConnectorStoreCoverage(connectorStoreIds, targetStores) {
  const connectorStores = new Set(connectorStoreIds);
  const missingStores = targetStores.filter((storeId) => !connectorStores.has(storeId));
  if (missingStores.length > 0) {
    throw new Error(`CATALOG_COVERAGE_TARGETS_JSON.targetStores missing from connector stores: ${missingStores.join(', ')}`);
  }
  return targetStores.length;
}

export function validateProductionEnv(env, options = {}) {
  const scope = options.scope === 'daily-ingestion' ? 'daily-ingestion' : 'production';
  const requiredNames = scope === 'daily-ingestion' ? requiredDailyIngestionEnvNames : requiredEnvNames;
  const hasValueOrFile = (name) => Boolean(env[name]?.trim() || env[`${name}_FILE`]?.trim());
  const missingEnv = requiredNames.filter((name) => !hasValueOrFile(name));
  if (!hasValueOrFile('GROCERYVIEW_DAILY_CONNECTORS_JSON')) {
    missingEnv.push('GROCERYVIEW_DAILY_CONNECTORS_JSON or GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE');
  }
  if (missingEnv.length > 0) throw new Error(`Missing required env: ${missingEnv.join(', ')}`);
  new URL(env.PUBLIC_WEB_URL);
  new URL(env.GROCERYVIEW_SERVER_URL);
  const connectors = validateDailyConnectors(env);
  const coverage = validateCatalogTargets(env);
  const sourceRunMinimums = validateSourceRunMinimums(env);
  const connectorStoreCoverageCount = validateConnectorStoreCoverage(connectors.connectorStoreIds, coverage.targetStores);
  return {
    status: 'ready',
    connectorCount: connectors.connectorCount,
    connectorChainIds: connectors.connectorChainIds,
    connectorStoreCount: connectors.connectorStoreCount,
    connectorStoreCoverageCount,
    coverageProductCount: coverage.productCount,
    coverageStoreCount: coverage.storeCount,
    coveragePriceTypes: coverage.targetPriceTypes,
    sourceRunMinimumChains: sourceRunMinimums.chains
  };
}

function selfTestEnv() {
  const chains = requiredDailyChainIds;
  return {
    AUTH_SECRET: 'self-test-auth-secret',
    DATABASE_URL: 'postgres://example/groceryview',
    PUBLIC_WEB_URL: 'https://groceryview.example',
    NOTIFICATION_WEBHOOK_SECRET: 'self-test-notification-webhook-secret',
    SENDGRID_API_KEY: 'self-test-sendgrid-api-key',
    SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
    EXPO_PUSH_ACCESS_TOKEN: 'self-test-expo-push-token',
    BILLING_WEBHOOK_SECRET: 'self-test-billing-webhook-secret',
    METRICS_TOKEN: 'self-test-metrics-token',
    GROCERYVIEW_SERVER_URL: 'https://api.groceryview.example',
    OCR_SPACE_API_KEY: 'self-test-ocr-space-key',
    OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
    OPENFOODFACTS_USER_AGENT: 'GroceryView/0.1 self-test@groceryview.se',
    OPENFOODFACTS_HEALTHCHECK_BARCODE: '0735000123456',
    S3_ENDPOINT: 'https://storage.example',
    S3_REGION: 'eu-north-1',
    S3_BUCKET: 'groceryview-receipts',
    S3_ACCESS_KEY_ID: 'self-test-s3-access-key',
    S3_SECRET_ACCESS_KEY: 'self-test-s3-secret-key',
    GROCERYVIEW_DAILY_CONNECTORS_JSON: JSON.stringify(chains.map((chainId) => ({
      connectorId: `${chainId}-normalized-json`,
      chainId,
      sourceType: 'official_api',
      endpointUrl: `https://sources.example.test/${chainId}/products.json`,
      parserVersion: 'normalized-json-v1',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: true,
      stores: [{ storeId: `${chainId}-odenplan`, name: `${chainId} Odenplan`, address: 'Odenplan', city: 'Stockholm' }]
    }))),
    GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN: JSON.stringify(Object.fromEntries(chains.map((chainId) => [chainId, 10]))),
    CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
      targetProducts: ['coffee', 'milk'],
      targetCategories: ['coffee', 'dairy'],
      targetChains: chains,
      targetStores: chains.map((chainId) => `${chainId}-odenplan`),
      targetPriceTypes: ['online'],
      requireEveryProductInEveryStore: false,
      requireEveryStorePriceType: true
    })
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const scopeIndex = process.argv.indexOf('--scope');
    const scope = scopeIndex >= 0 ? process.argv[scopeIndex + 1] : undefined;
    const result = validateProductionEnv(process.argv.includes('--self-test') ? selfTestEnv() : process.env, { scope });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
