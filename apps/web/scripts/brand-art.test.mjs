import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const webRoot = new URL('../', import.meta.url);

async function read(relative) {
  return readFile(new URL(relative, webRoot), 'utf8');
}

test('brand-art components export geometric collage SVG with aria-hidden decoration', async () => {
  const [collage, hero, empty, accent, tokens] = await Promise.all([
    read('src/components/brand-art/data-collage-svg.tsx'),
    read('src/components/brand-art/brand-art-hero-shell.tsx'),
    read('src/components/brand-art/brand-art-empty-backdrop.tsx'),
    read('src/components/brand-art/brand-art-market-accent.tsx'),
    read('src/components/brand-art/brand-art-tokens.ts')
  ]);

  assert.match(tokens, /burgundy/i);
  assert.match(tokens, /forest/i);
  assert.match(tokens, /neonLime/i);
  assert.match(tokens, /purpleFrame/i);
  assert.match(tokens, /signalYellow/i);

  assert.match(collage, /aria-hidden/);
  assert.match(collage, /role="presentation"/);
  assert.match(collage, /polygon/);
  assert.match(collage, /BRAND_ART_COLORS\.burgundy/);

  assert.match(hero, /BrandArtHeroShell/);
  assert.match(hero, /data-brand-art="hero"/);
  assert.match(hero, /DataCollageSvg/);

  assert.match(empty, /aria-hidden/);
  assert.match(empty, /data-brand-art="empty"/);

  assert.match(accent, /aria-hidden/);
  assert.match(accent, /data-brand-art="market-accent"/);
});

test('brand-art stays out of product cards, evidence strips, and price tables', async () => {
  const forbiddenTargets = [
    'src/components/mvp/product-card.tsx',
    'src/components/mvp/evidence-strip.tsx',
    'src/components/preview/search-result-preview-card.tsx'
  ];

  for (const file of forbiddenTargets) {
    const source = await read(file);
    assert.doesNotMatch(source, /@\/components\/brand-art/, `${file} must not import brand-art`);
    assert.doesNotMatch(source, /BrandArtHeroShell|DataCollageSvg|BrandArtEmptyBackdrop/, `${file} must not embed collage art`);
  }
});

test('homepage is search-first with domain chips and primary CTA to /search', async () => {
  const home = await read('src/components/mvp/mvp-home-page.tsx');

  assert.match(home, /BrandArtHeroShell/);
  assert.match(home, /data-home-primary-cta="search"/);
  assert.match(home, /href="\/search"/);
  assert.match(home, /data-domain-chips/);
  assert.match(home, /Grocery/);
  assert.match(home, /Pharmacy OTC/);
  assert.match(home, /Fuel/);
  assert.match(home, /DOMAIN_CHIPS/);
  assert.match(home, /href: '\/browse'/);
  assert.match(home, /href: '\/pharmacy'/);
  assert.match(home, /href: '\/fuel'/);
  assert.match(home, /action="\/search"/);

  const primaryIndex = home.indexOf('data-home-primary-cta="search"');
  const browseChipIndex = home.indexOf('data-domain-chips');
  assert.ok(primaryIndex >= 0 && browseChipIndex >= 0);
  assert.ok(primaryIndex < browseChipIndex, 'primary search CTA should appear before domain chips');
});

test('public shopper routes avoid backstage debug copy', async () => {
  const [home, search] = await Promise.all([
    read('src/components/mvp/mvp-home-page.tsx'),
    read('src/app/search/page.tsx')
  ]);

  for (const source of [home, search]) {
    assert.doesNotMatch(source, /Server-side cursor pagination/i);
    assert.doesNotMatch(source, /source_run_id/i);
    assert.doesNotMatch(source, /fail closed until Redis cache and pgbouncer/i);
  }
});

test('market page uses decorative brand accent outside chart tables', async () => {
  const market = await read('src/app/market/page.tsx');
  assert.match(market, /BrandArtMarketAccent/);
  const accentPos = market.indexOf('BrandArtMarketAccent');
  const tablePos = market.indexOf('<table');
  assert.ok(accentPos >= 0 && tablePos >= 0);
  assert.ok(accentPos < tablePos, 'market accent should render before data tables');
});
