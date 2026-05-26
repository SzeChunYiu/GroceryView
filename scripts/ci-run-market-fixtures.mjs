#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const market = process.argv[2]?.trim().toLowerCase();
const supportedMarkets = new Set(['se', 'no', 'is']);

if (!supportedMarkets.has(market)) {
  process.stderr.write('Usage: node scripts/ci-run-market-fixtures.mjs <SE|NO|IS>\n');
  process.exit(2);
}

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function isMarketFixture(filePath) {
  if (!filePath.endsWith('.test.js')) return false;
  const normalized = filePath.toLowerCase();
  return normalized.includes(`-${market}.test.js`) || normalized.includes(`/${market}-`);
}

const fixtureRoot = join(process.cwd(), 'packages/ingestion/dist-test');
const fixtures = walk(fixtureRoot).filter(isMarketFixture).sort();

if (fixtures.length === 0) {
  process.stderr.write(`No ${market.toUpperCase()} ingestion fixture tests were found under ${fixtureRoot}.\n`);
  process.exit(1);
}

process.stdout.write(`Running ${fixtures.length} ${market.toUpperCase()} ingestion fixture test files:\n`);
for (const fixture of fixtures) process.stdout.write(`- ${fixture}\n`);

const result = spawnSync(process.execPath, ['--test', ...fixtures], {
  env: {
    ...process.env,
    GROCERYVIEW_CI_FIXTURE_COUNTRIES: market.toUpperCase()
  },
  stdio: 'inherit'
});

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
