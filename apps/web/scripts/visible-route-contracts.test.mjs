import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const routeContracts = [
  {
    route: '/',
    label: 'homepage',
    files: ['src/app/page.tsx', 'src/components/market-shell.tsx'],
    required: [/MarketShell/, /explicit sources|sourceCoverage|sourceClaimLedger/, /confidence/i, /fresh|observed|retrieved/i]
  },
  {
    route: '/products',
    label: 'products',
    files: ['src/app/products/page.tsx'],
    required: [/sourceLabel|sourceProductSlug/, /minConfidence|confidence/i, /Fresh OpenPrices|recent community SEK observations/]
  },
  {
    route: '/stores',
    label: 'stores',
    files: ['src/app/stores/page.tsx', 'src/lib/freshness.ts'],
    required: [/Feed freshness/, /Price observations/, /scoreLabel|reliability/i]
  },
  {
    route: '/categories',
    label: 'categories',
    files: ['src/app/categories/page.tsx'],
    required: [/verified product rows|verified rows/i, /evidenceLabels|verified label evidence/, /not inferred|unverified substitutions/]
  },
  {
    route: '/compare',
    label: 'compare',
    files: ['src/app/compare/page.tsx'],
    required: [/sourceConfidence|confidenceLabel/, /Source:|sourceLabel/, /No forecast|observed SEK values/]
  },
  {
    route: '/deals',
    label: 'deals',
    files: ['src/app/deals/page.tsx'],
    required: [/sourceLabel|snapshot/, /observed rows only|without synthetic discounts/, /Freshly observed products|source refresh/]
  },
  {
    route: '/map',
    label: 'map',
    files: ['src/app/map/page.tsx'],
    required: [/verified OSM coordinates/, /Source confidence|confidence\/coverage/, /without inventing branch-level basket prices/]
  },
  {
    route: '/grocery-index',
    label: 'grocery index',
    files: ['src/app/grocery-index/page.tsx'],
    required: [/OpenPrices rows/, /historical conversions/, /max spread/]
  },
  {
    route: '/basket',
    label: 'basket',
    files: ['src/app/basket/page.tsx'],
    required: [/sourceConfidence|sourceLabel|SourceCoverage/, /verified price catalogue/, /rather than estimating/]
  },
  {
    route: '/account',
    label: 'account',
    files: ['src/app/account/page.tsx'],
    required: [/ConfidenceBadge|confidence/, /source of truth|API source|Session source|authenticated storage/, /Signed-in shoppers|Consent required/]
  },
  {
    route: '/account/profile',
    label: 'account profile',
    files: ['src/app/account/profile/page.tsx'],
    required: [/NoVerifiedData/, /source of truth/, /SourceCoverage/]
  },
  {
    route: '/en',
    label: 'English market landing',
    files: ['src/app/en/page.tsx', 'src/components/locale-home-page.tsx', 'src/components/market-shell.tsx'],
    required: [/LocaleHomePage locale="en"/, /Confidence, freshness, and savings copy/, /verified product pages/]
  },
  {
    route: '/sv',
    label: 'Swedish market landing',
    files: ['src/app/sv/page.tsx', 'src/components/locale-home-page.tsx', 'src/components/market-shell.tsx'],
    required: [/LocaleHomePage locale="sv"/, /Confidence, freshness, and savings copy/, /verified product pages/]
  },
  {
    route: '/ar',
    label: 'Arabic market landing',
    files: ['src/app/ar/page.tsx', 'src/components/locale-home-page.tsx'],
    required: [/BlockedLocalePage locale="ar"/, /source-evidence string/, /blocked-locale\.guardrailNoMachineTranslation/]
  },
  {
    route: '/so',
    label: 'Somali market landing',
    files: ['src/app/so/page.tsx', 'src/components/locale-home-page.tsx'],
    required: [/BlockedLocalePage locale="so"/, /source-evidence string/, /blocked-locale\.guardrailNoMachineTranslation/]
  }
];

const forbiddenScaffoldPatterns = [
  /@\/lib\/demo-data/,
  /@\/components\/sample-data/,
  /lorem ipsum/i,
  /todo: replace/i,
  /fake (price|store|account|basket)/i,
  /fabricated (price|store|number|comparison)/i,
  /synthetic (price|comparison)/i,
  /placeholder (price|basket|store|account)/i
];

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

async function exists(relative) {
  try {
    await access(new URL(`../${relative}`, import.meta.url));
    return true;
  } catch {
    return false;
  }
}

async function combinedSource(files) {
  const sources = [];
  for (const file of files) {
    assert.equal(await exists(file), true, `${file} should exist`);
    sources.push(await read(file));
  }
  return sources.join('\n');
}

describe('visible route contracts', () => {
  it('keeps every requested visible page mapped to a real App Router page', async () => {
    for (const contract of routeContracts) {
      assert.ok(contract.files.some((file) => file.startsWith('src/app/') && file.endsWith('/page.tsx')), `${contract.route} should include an app page`);
      for (const file of contract.files) assert.equal(await exists(file), true, `${contract.route} missing ${file}`);
    }
  });

  it('requires source, confidence, freshness, or fail-closed evidence on visible pages', async () => {
    for (const contract of routeContracts) {
      const source = await combinedSource(contract.files);
      for (const pattern of contract.required) {
        assert.match(source, pattern, `${contract.label} route should match ${pattern}`);
      }
    }
  });

  it('blocks scaffold placeholders and fabricated-data language from route sources', async () => {
    for (const contract of routeContracts) {
      const source = await combinedSource(contract.files);
      for (const pattern of forbiddenScaffoldPatterns) {
        assert.doesNotMatch(source, pattern, `${contract.label} should not contain ${pattern}`);
      }
    }
  });

  it('runs under the existing CI script and anchors to generated market fixtures', async () => {
    const packageJson = JSON.parse(await read('package.json'));
    const verifiedData = await read('src/lib/verified-data.ts');
    assert.match(packageJson.scripts.test, /node --test scripts\/\*\.test\.mjs/);
    assert.match(verifiedData, /axfoodProducts/);
    assert.match(verifiedData, /pricedProducts/);
    assert.match(verifiedData, /osmStores/);
    assert.match(verifiedData, /sourceCoverage/);
    assert.match(verifiedData, /snapshot/);
  });
});
