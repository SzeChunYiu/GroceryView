import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const scriptPath = new URL('../../scripts/ops/validate-production-env.mjs', import.meta.url);
const script = readFileSync(scriptPath, 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const envExample = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8');

function parseEnvExample(text) {
  return Object.fromEntries(text.split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }));
}

describe('production env value validation script', () => {
  it('validates daily connectors and catalog coverage targets for all required chains', () => {
    for (const name of ['GROCERYVIEW_DAILY_CONNECTORS_JSON', 'CATALOG_COVERAGE_TARGETS_JSON', 'EXPO_PUSH_ACCESS_TOKEN', 'SENDGRID_FROM_EMAIL', 'SENDGRID_API_KEY', 'OCR_SPACE_API_KEY', 'OCR_SPACE_HEALTHCHECK_IMAGE_URL', 'OPENFOODFACTS_USER_AGENT', 'OPENFOODFACTS_HEALTHCHECK_BARCODE', 'S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
      assert.match(script, new RegExp(name));
    }
    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(script, new RegExp(`['"]${chain}['"]`));
    }
    assert.match(script, /requireEveryProductInEveryStore must be false/);
    assert.match(script, /targetPriceTypes/);
    assert.match(script, /requireEveryStorePriceType/);
    assert.match(script, /stores must list every branch/);
    assert.match(script, /targetStores missing from connector stores/);
    assert.equal(pkg.scripts['ops:validate-production-env'], 'node scripts/ops/validate-production-env.mjs');
  });

  it('self-test passes with six connectors and branch-observed store targets', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), {
      status: 'ready',
      connectorCount: 6,
      connectorChainIds: ['city_gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys'],
      connectorStoreCount: 6,
      connectorStoreCoverageCount: 6,
      coverageProductCount: 2,
      coverageStoreCount: 6,
      coveragePriceTypes: ['online']
    });
  });

  it('keeps .env.example aligned with required production ingestion validation shape', async () => {
    const { validateProductionEnv } = await import(scriptPath);
    assert.deepEqual(validateProductionEnv(parseEnvExample(envExample)), {
      status: 'ready',
      connectorCount: 6,
      connectorChainIds: ['city_gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys'],
      connectorStoreCount: 6,
      connectorStoreCoverageCount: 6,
      coverageProductCount: 1,
      coverageStoreCount: 6,
      coveragePriceTypes: ['online']
    });
  });


  it('accepts daily connector and catalog coverage target config by file path to avoid oversized process environments', async () => {
    const { validateProductionEnv } = await import(scriptPath);
    const chains = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
    const tempDir = mkdtempSync(join(tmpdir(), 'groceryview-production-env-'));
    const connectorPath = join(tempDir, 'connectors.json');
    const catalogTargetPath = join(tempDir, 'catalog-targets.json');
    writeFileSync(connectorPath, JSON.stringify(chains.map((chainId) => ({
      connectorId: `${chainId}-normalized-json`,
      chainId,
      sourceType: 'official_api',
      endpointUrl: `https://sources.example.test/${chainId}/products.json`,
      parserVersion: 'normalized-json-v1',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: true,
      stores: [{ storeId: `${chainId}-odenplan`, name: `${chainId} Odenplan`, address: 'Odenplan', city: 'Stockholm' }]
    }))));
    writeFileSync(catalogTargetPath, JSON.stringify({
      targetProducts: ['coffee'],
      targetCategories: ['coffee'],
      targetChains: chains,
      targetStores: chains.map((chainId) => `${chainId}-odenplan`),
      targetPriceTypes: ['online'],
      requireEveryProductInEveryStore: false,
      requireEveryStorePriceType: true
    }));

    assert.equal(validateProductionEnv({
      AUTH_SECRET: 'test-auth-secret',
      DATABASE_URL: 'postgres://example/groceryview',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'test-notification-webhook-secret',
      BILLING_WEBHOOK_SECRET: 'test-billing-webhook-secret',
      METRICS_TOKEN: 'test-metrics-token',
      SENDGRID_API_KEY: 'sg-test-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-push-token',
      GROCERYVIEW_SERVER_URL: 'https://api.groceryview.example',
      OCR_SPACE_API_KEY: 'test-ocr-space-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/0.1 test@groceryview.se',
      OPENFOODFACTS_HEALTHCHECK_BARCODE: '0735000123456',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'test-s3-access-key',
      S3_SECRET_ACCESS_KEY: 'test-s3-secret-key',
      GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE: connectorPath,
      CATALOG_COVERAGE_TARGETS_JSON_FILE: catalogTargetPath
    }).status, 'ready');
  });

  it('accepts daily ingestion scope without notification, mobile, or scanning-only secrets', async () => {
    const { validateProductionEnv } = await import(scriptPath);
    const chains = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
    assert.equal(validateProductionEnv({
      AUTH_SECRET: 'test-auth-secret',
      DATABASE_URL: 'postgres://example/groceryview',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'test-notification-webhook-secret',
      BILLING_WEBHOOK_SECRET: 'test-billing-webhook-secret',
      METRICS_TOKEN: 'test-metrics-token',
      GROCERYVIEW_SERVER_URL: 'https://api.groceryview.example',
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
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: chains,
        targetStores: chains.map((chainId) => `${chainId}-odenplan`),
        targetPriceTypes: ['online'],
        requireEveryProductInEveryStore: false,
        requireEveryStorePriceType: true
      })
    }, { scope: 'daily-ingestion' }).status, 'ready');
  });

  it('fails closed when required env values are missing', () => {
    const result = spawnSync(process.execPath, [scriptPath.pathname], { encoding: 'utf8', env: {} });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing required env/);
    assert.match(result.stderr, /GROCERYVIEW_DAILY_CONNECTORS_JSON/);
    assert.match(result.stderr, /CATALOG_COVERAGE_TARGETS_JSON/);
  });

  it('fails closed when catalog target stores are not covered by daily connector branch metadata', () => {
    const chains = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
    const env = {
      AUTH_SECRET: 'test-auth-secret',
      DATABASE_URL: 'postgres://example/groceryview',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'test-notification-webhook-secret',
      BILLING_WEBHOOK_SECRET: 'test-billing-webhook-secret',
      METRICS_TOKEN: 'test-metrics-token',
      SENDGRID_API_KEY: 'sg-test-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-push-token',
      GROCERYVIEW_SERVER_URL: 'https://api.groceryview.example',
      OCR_SPACE_API_KEY: 'test-ocr-space-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/0.1 test@groceryview.se',
      OPENFOODFACTS_HEALTHCHECK_BARCODE: '0735000123456',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'test-s3-access-key',
      S3_SECRET_ACCESS_KEY: 'test-s3-secret-key',
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
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: chains,
        targetStores: ['willys-unknown-branch'],
        targetPriceTypes: ['online'],
        requireEveryProductInEveryStore: false,
        requireEveryStorePriceType: true
      })
    };
    const result = spawnSync(process.execPath, [scriptPath.pathname], { encoding: 'utf8', env });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /targetStores missing from connector stores: willys-unknown-branch/);
  });

  it('fails closed when catalog targets do not require branch product price coverage for every target store', () => {
    const chains = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
    const baseEnv = {
      AUTH_SECRET: 'test-auth-secret',
      DATABASE_URL: 'postgres://example/groceryview',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'test-notification-webhook-secret',
      BILLING_WEBHOOK_SECRET: 'test-billing-webhook-secret',
      METRICS_TOKEN: 'test-metrics-token',
      SENDGRID_API_KEY: 'sg-test-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-push-token',
      GROCERYVIEW_SERVER_URL: 'https://api.groceryview.example',
      OCR_SPACE_API_KEY: 'test-ocr-space-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/0.1 test@groceryview.se',
      OPENFOODFACTS_HEALTHCHECK_BARCODE: '0735000123456',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'test-s3-access-key',
      S3_SECRET_ACCESS_KEY: 'test-s3-secret-key',
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
      })))
    };
    const result = spawnSync(process.execPath, [scriptPath.pathname], {
      encoding: 'utf8',
      env: {
        ...baseEnv,
        CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
          targetProducts: ['coffee'],
          targetCategories: ['coffee'],
          targetChains: chains,
          targetStores: chains.map((chainId) => `${chainId}-odenplan`),
          requireEveryProductInEveryStore: false
        })
      }
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /targetPriceTypes/);
  });

});
