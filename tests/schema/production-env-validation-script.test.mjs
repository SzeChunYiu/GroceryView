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
    for (const name of ['GROCERYVIEW_DAILY_CONNECTORS_JSON', 'CATALOG_COVERAGE_TARGETS_JSON']) {
      assert.match(script, new RegExp(name));
    }
    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(script, new RegExp(`['"]${chain}['"]`));
    }
    assert.match(script, /requireEveryProductInEveryStore must be false/);
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
      coverageStoreCount: 6
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
      coverageStoreCount: 6
    });
  });


  it('accepts daily connector config by file path to avoid oversized process environments', async () => {
    const { validateProductionEnv } = await import(scriptPath);
    const chains = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
    const connectorPath = join(mkdtempSync(join(tmpdir(), 'groceryview-connectors-')), 'connectors.json');
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

    assert.equal(validateProductionEnv({
      AUTH_SECRET: 'test-auth-secret',
      DATABASE_URL: 'postgres://example/groceryview',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'test-notification-webhook-secret',
      BILLING_WEBHOOK_SECRET: 'test-billing-webhook-secret',
      METRICS_TOKEN: 'test-metrics-token',
      GROCERYVIEW_SERVER_URL: 'https://api.groceryview.example',
      GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE: connectorPath,
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: chains,
        targetStores: chains.map((chainId) => `${chainId}-odenplan`),
        requireEveryProductInEveryStore: false
      })
    }).status, 'ready');
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
        targetStores: ['willys-unknown-branch'],
        requireEveryProductInEveryStore: false
      })
    };
    const result = spawnSync(process.execPath, [scriptPath.pathname], { encoding: 'utf8', env });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /targetStores missing from connector stores: willys-unknown-branch/);
  });
});
