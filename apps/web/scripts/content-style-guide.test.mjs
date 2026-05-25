import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const repoRoot = new URL('../../../', import.meta.url);
const webRoot = new URL('../', import.meta.url);
const sourceRoot = new URL('../src/', import.meta.url);

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  }));
  return files.flat();
}

async function read(relativePath) {
  return readFile(new URL(relativePath, webRoot), 'utf8');
}

describe('honest price intelligence content style', () => {
  it('defines required copy rules and Nordic terminology seeds in code', async () => {
    const style = await read('src/lib/content-style.ts');
    for (const topic of ['confidence', 'freshness', 'savings', 'buyWait', 'historicalPercentile', 'sourceLimitations']) {
      assert.match(style, new RegExp(`${topic}:`), `${topic} rule should be defined`);
    }
    for (const locale of ['en', 'sv', 'no', 'is']) {
      assert.match(style, new RegExp(`${locale}: \\{`), `${locale} terminology seeds should be defined`);
    }
    assert.match(style, /bannedWithoutEvidence/);
    assert.match(style, /listedSavingsBoundaryCopy/);
  });

  it('wires shared confidence, freshness, savings, and source-limitation wording into rendered UI', async () => {
    const confidenceBadge = await read('src/components/confidence-badge.tsx');
    const dataUi = await read('src/components/data-ui.tsx');
    const catalogueSavings = await read('src/app/catalogue-savings/page.tsx');

    assert.match(confidenceBadge, /confidenceCopy/);
    assert.match(dataUi, /freshnessCopy/);
    assert.match(dataUi, /sourceLimitationCopy/);
    assert.match(catalogueSavings, /listedSavingsBoundaryCopy/);
  });

  it('localizes rendered honest price terminology on locale entry pages', async () => {
    const style = await read('src/lib/content-style.ts');
    const i18n = await read('src/lib/i18n.ts');
    const localeHome = await read('src/components/locale-home-page.tsx');
    const marketShell = await read('src/components/market-shell.tsx');
    const englishPage = await read('src/app/en/page.tsx');
    const swedishPage = await read('src/app/sv/page.tsx');

    assert.match(style, /priceIntelligenceTerminologyForLocale/);
    assert.match(i18n, /localizedPriceIntelligenceTerminology/);
    assert.match(localeHome, /<MarketShell locale=\{locale\}/);
    assert.match(englishPage, /<LocaleHomePage locale="en"/);
    assert.match(swedishPage, /<LocaleHomePage locale="sv"/);
    for (const term of ['terminology.confidence', 'terminology.freshness', 'terminology.savings']) {
      assert.match(marketShell, new RegExp(term.replace('.', '\\.')), `${term} should render in the locale shell`);
    }
  });


  it('keeps forecast-like language tied to observed or historical source context', async () => {
    const files = await collectFiles(sourceRoot.pathname);
    const risky = /\b(forecast|predict(?:ion|ed|s)?|will drop|about to drop|expected price)\b/i;
    const factualGuardrail = /\b(no forecast|observed|historical|history|dated observations|source rows|factual)\b/i;
    const violations = [];

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      if (risky.test(source) && !factualGuardrail.test(source)) {
        violations.push(relative(repoRoot.pathname, file));
      }
    }

    assert.deepEqual(violations, []);
  });
});
