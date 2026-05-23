import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const rootPackage = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const rootTsconfig = JSON.parse(readFileSync(new URL('../../tsconfig.json', import.meta.url), 'utf8'));
const readPackage = (path) => JSON.parse(readFileSync(new URL(`../../${path}/package.json`, import.meta.url), 'utf8'));

const packages = {
  api: readPackage('packages/api'),
  server: readPackage('packages/server'),
  mobile: readPackage('apps/mobile')
};

describe('workspace package scripts', () => {
  it('builds local workspace dependencies before tests that import package entrypoints', () => {
    for (const workspace of ['@groceryview/core', '@groceryview/monetization']) {
      assert.match(packages.api.scripts.test, new RegExp(`npm run build -w ${workspace.replace('/', '\\/')}`));
    }

    for (const workspace of ['@groceryview/core', '@groceryview/monetization', '@groceryview/api', '@groceryview/auth', '@groceryview/scanning']) {
      assert.match(packages.server.scripts.test, new RegExp(`npm run build -w ${workspace.replace('/', '\\/')}`));
    }

    for (const workspace of ['@groceryview/core', '@groceryview/monetization', '@groceryview/api']) {
      assert.match(packages.mobile.scripts.test, new RegExp(`npm run build -w ${workspace.replace('/', '\\/')}`));
    }
  });

  it('runs ingested data provenance verification from the root test script', () => {
    assert.match(rootPackage.scripts.test, /npm run ingest:verify/);
    assert.equal(rootPackage.scripts['ingest:verify'], 'node scripts/ingestion/verify-ingested-provenance.mjs');
    assert.match(rootPackage.scripts['ingest:generate-live'], /generate-live-retailer-ingested\.mjs/);
    assert.equal(existsSync(new URL('../../scripts/ingestion/verify-ingested-provenance.mjs', import.meta.url)), true);
    assert.equal(existsSync(new URL('../../scripts/ingestion/generate-live-retailer-ingested.mjs', import.meta.url)), true);
  });

  it('typechecks workspace imports against source entrypoints before build artifacts exist', () => {
    const paths = rootTsconfig.compilerOptions.paths;
    for (const workspace of [
      'api',
      'api-contracts',
      'auth',
      'catalog',
      'core',
      'db',
      'ingestion',
      'monetization',
      'notifications',
      'ops',
      'scanning',
      'server'
    ]) {
      assert.deepEqual(paths[`@groceryview/${workspace}`], [`packages/${workspace}/src/index.ts`]);
    }
  });
});
