#!/usr/bin/env node
import process from 'node:process';

export const requiredDailyChainIds = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];

export const requiredEnvNames = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'PUBLIC_WEB_URL',
  'NOTIFICATION_WEBHOOK_SECRET',
  'BILLING_WEBHOOK_SECRET',
  'METRICS_TOKEN',
  'GROCERYVIEW_DAILY_CONNECTORS_JSON',
  'GROCERYVIEW_SERVER_URL',
  'CATALOG_COVERAGE_TARGETS_JSON'
];

function parseJsonEnv(env, name) {
  const raw = env[name];
  if (!raw?.trim()) throw new Error(`${name} is required.`);
  return JSON.parse(raw);
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

function validateDailyConnectors(env) {
  const connectors = parseJsonEnv(env, 'GROCERYVIEW_DAILY_CONNECTORS_JSON');
  if (!Array.isArray(connectors) || connectors.length === 0) throw new Error('GROCERYVIEW_DAILY_CONNECTORS_JSON must be a non-empty array.');
  for (const [index, connector] of connectors.entries()) {
    if (connector === null || typeof connector !== 'object' || Array.isArray(connector)) throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}] must be an object.`);
    for (const field of ['connectorId', 'chainId', 'sourceType', 'endpointUrl', 'parserVersion', 'robotsTxtStatus', 'legalReviewStatus', 'hasDataAgreement']) {
      if (connector[field] === undefined || connector[field] === null || connector[field] === '') throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}].${field} is required.`);
    }
  }
  requireRequiredChains('GROCERYVIEW_DAILY_CONNECTORS_JSON.chainId', connectors.map((connector) => String(connector.chainId)));
  return connectors.length;
}

function validateCatalogTargets(env) {
  const targets = parseJsonEnv(env, 'CATALOG_COVERAGE_TARGETS_JSON');
  if (targets === null || typeof targets !== 'object' || Array.isArray(targets)) throw new Error('CATALOG_COVERAGE_TARGETS_JSON must be an object.');
  const targetProducts = requireNonEmptyStringArray(targets.targetProducts, 'CATALOG_COVERAGE_TARGETS_JSON.targetProducts');
  requireNonEmptyStringArray(targets.targetCategories, 'CATALOG_COVERAGE_TARGETS_JSON.targetCategories');
  const targetChains = requireNonEmptyStringArray(targets.targetChains, 'CATALOG_COVERAGE_TARGETS_JSON.targetChains');
  const targetStores = requireNonEmptyStringArray(targets.targetStores, 'CATALOG_COVERAGE_TARGETS_JSON.targetStores');
  requireRequiredChains('CATALOG_COVERAGE_TARGETS_JSON.targetChains', targetChains);
  if (targets.requireEveryProductInEveryStore !== true) throw new Error('CATALOG_COVERAGE_TARGETS_JSON.requireEveryProductInEveryStore must be true.');
  return { productCount: targetProducts.length, storeCount: targetStores.length };
}

export function validateProductionEnv(env) {
  const missingEnv = requiredEnvNames.filter((name) => !env[name]?.trim());
  if (missingEnv.length > 0) throw new Error(`Missing required env: ${missingEnv.join(', ')}`);
  new URL(env.PUBLIC_WEB_URL);
  new URL(env.GROCERYVIEW_SERVER_URL);
  const connectorCount = validateDailyConnectors(env);
  const coverage = validateCatalogTargets(env);
  return {
    status: 'ready',
    connectorCount,
    coverageProductCount: coverage.productCount,
    coverageStoreCount: coverage.storeCount
  };
}

function selfTestEnv() {
  const chains = requiredDailyChainIds;
  return {
    AUTH_SECRET: 'self-test-auth-secret',
    DATABASE_URL: 'postgres://example/groceryview',
    PUBLIC_WEB_URL: 'https://groceryview.example',
    NOTIFICATION_WEBHOOK_SECRET: 'self-test-notification-webhook-secret',
    BILLING_WEBHOOK_SECRET: 'self-test-billing-webhook-secret',
    METRICS_TOKEN: 'self-test-metrics-token',
    GROCERYVIEW_SERVER_URL: 'https://api.groceryview.example',
    GROCERYVIEW_DAILY_CONNECTORS_JSON: JSON.stringify(chains.map((chainId) => ({
      connectorId: `${chainId}-normalized-json`,
      chainId,
      sourceType: 'official_api',
      endpointUrl: `https://sources.example.test/${chainId}/products.json`,
      parserVersion: 'normalized-json-v1',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: true
    }))),
    CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
      targetProducts: ['coffee', 'milk'],
      targetCategories: ['coffee', 'dairy'],
      targetChains: chains,
      targetStores: ['willys-odenplan', 'coop-odenplan'],
      requireEveryProductInEveryStore: true
    })
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = validateProductionEnv(process.argv.includes('--self-test') ? selfTestEnv() : process.env);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
