import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';

const rootPackage = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const rootTsconfig = JSON.parse(readFileSync(new URL('../../tsconfig.json', import.meta.url), 'utf8'));
const readPackage = (path) => JSON.parse(readFileSync(new URL(`../../${path}/package.json`, import.meta.url), 'utf8'));

const packages = {
  api: readPackage('packages/api'),
  db: readPackage('packages/db'),
  server: readPackage('packages/server'),
  mobile: readPackage('apps/mobile'),
  web: readPackage('apps/web')
};

const repoRoot = new URL('../..', import.meta.url);

const collectSourceFiles = (dirUrl) => {
  const entries = readdirSync(dirUrl, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dirUrl);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    if (!/\.(ts|tsx|mjs|js)$/.test(entry.name)) {
      return [];
    }

    return [entryPath];
  });
};

const workspacePackageImportsFrom = (sourceDir) => {
  const imports = new Set();
  for (const file of collectSourceFiles(new URL(sourceDir, repoRoot))) {
    if (!statSync(file).isFile()) {
      continue;
    }

    const source = readFileSync(file, 'utf8');
    const patterns = [
      /\bfrom\s+['"](@groceryview\/[^'"/]+)['"]/g,
      /\bimport\s*\(\s*['"](@groceryview\/[^'"/]+)['"]\s*\)/g
    ];
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        imports.add(match[1]);
      }
    }
  }

  return [...imports].sort();
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

    for (const workspace of workspacePackageImportsFrom('apps/web/src/')) {
      assert.match(packages.web.scripts['build:deps'], new RegExp(`npm run build -w ${workspace.replace('/', '\\/')}`));
    }
    assert.match(packages.web.scripts.build, /npm run build:deps &&/);
  });

  it('runs ingested data provenance verification from the root test script', () => {
    assert.match(rootPackage.scripts.test, /npm run ingest:verify/);
    assert.equal(rootPackage.scripts['ingest:verify'], 'node scripts/ingestion/verify-ingested-provenance.mjs');
    assert.match(rootPackage.scripts['ingest:generate-live'], /generate-live-retailer-ingested\.mjs/);
    assert.equal(existsSync(new URL('../../scripts/ingestion/verify-ingested-provenance.mjs', import.meta.url)), true);
    assert.equal(existsSync(new URL('../../scripts/ingestion/generate-live-retailer-ingested.mjs', import.meta.url)), true);
  });

  it('exposes a focused retailer seed metadata verification script', () => {
    assert.equal(
      rootPackage.scripts['db:check-retailer-seeds'],
      'npm run test:retailer-seeds -w @groceryview/db && node --test tests/schema/stockholm-seed.test.mjs'
    );
    assert.match(packages.db.scripts['test:retailer-seeds'], /retailerSeed\.test\.js/);
    assert.match(packages.db.scripts['test:retailer-seeds'], /infraSeed\.test\.js/);
    assert.match(packages.db.scripts['test:retailer-seeds'], /retailerQueries\.test\.js/);
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

  it('declares every local workspace package imported by the web app', () => {
    const declared = new Set(Object.keys(packages.web.dependencies ?? {}));
    const localImports = workspacePackageImportsFrom('apps/web/src/');

    assert.deepEqual(
      localImports.filter((packageName) => !declared.has(packageName)),
      [],
      'apps/web/package.json must declare every @groceryview/* package imported by apps/web/src'
    );
  });
});
