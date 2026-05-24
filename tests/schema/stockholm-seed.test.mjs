import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const seed = readFileSync(new URL('../../db/migrations/010_stockholm_hero_seed.sql', import.meta.url), 'utf8');

describe('Stockholm hero seed migration', () => {
  it('includes all launch chains required for Stockholm coverage', () => {
    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'citygross', 'netto']) {
      assert.match(seed, new RegExp(`'${chain}'`), `${chain} chain missing`);
    }
  });

  it('seeds Stockholm stores with coordinates for every launch chain', () => {
    for (const store of [
      'ica-liljeholmen',
      'willys-odenplan',
      'coop-farsta',
      'hemkop-torsplan',
      'lidl-sveavagen',
      'citygross-bromma'
    ]) {
      assert.match(seed, new RegExp(`'${store}'[^;]+59\\.\\d{6}[^;]+1[78]\\.\\d{6}`, 's'), `${store} coordinates missing`);
    }
  });

  it('seeds the first 20 hero products with package and comparable-unit data', () => {
    const productsBlock = seed.match(/insert into products[\s\S]+?on conflict \(id\) do update set/)[0];
    const productRows = [...productsBlock.matchAll(/\('([a-z0-9-]+)',\s*(?:'[^']*'|null),\s*'[^']+',\s*(?:'[^']*'|null),/g)];
    assert.equal(productRows.length, 20);
    for (const product of ['zoegas-coffee-450g', 'arla-milk-1l', 'bregott-600g', 'bananas-1kg', 'lambi-toilet-paper-8p']) {
      assert.match(productsBlock, new RegExp(`'${product}'`), `${product} product missing`);
    }
    assert.match(productsBlock, /comparable_unit/);
    assert.match(productsBlock, /package_size/);
  });
});
