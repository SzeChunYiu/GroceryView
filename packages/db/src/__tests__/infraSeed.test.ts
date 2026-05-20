import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const stockholmSeed = readFileSync(join(repoRoot, 'infra/db/seeds/001_stockholm_seed.sql'), 'utf8').toLowerCase();

const requiredChains = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city-gross'];
const heroProductSlugs = [
  'standardmjolk-1l',
  'agg-12-pack',
  'smor-500g',
  'bryggkaffe-450g',
  'kycklingfile-1kg',
  'notfars-500g',
  'pasta-500g',
  'basmatiris-1kg',
  'formbrod-rost-700g',
  'hushallsost-1kg',
  'bananer-1kg',
  'tomater-500g',
  'potatis-2kg',
  'toalettpapper-8-pack',
  'tvattmedel-color-1l',
  'blojor-storlek-4',
  'havredryck-1l',
  'naturell-yoghurt-1kg',
  'olivolja-500ml',
  'fryst-pizza-350g'
];

describe('infra/db Stockholm seed contract', () => {
  it('seeds the required Stockholm retail chains', () => {
    for (const chain of requiredChains) {
      assert.match(stockholmSeed, new RegExp(`'${chain}'`), `${chain} chain seed missing`);
    }
    assert.match(stockholmSeed, /insert into chains/);
    assert.match(stockholmSeed, /on conflict \(slug\) do update/);
  });

  it('seeds six stores with geography coordinates', () => {
    const seedRefs = stockholmSeed.match(/seed:[^']+/g) ?? [];
    assert.equal(seedRefs.filter((ref) => ref.split(':').length >= 3).length, 6);
    assert.match(stockholmSeed, /st_setsrid\(st_makepoint\(store_seed\.longitude, store_seed\.latitude\), 4326\)::geography/);
    assert.match(stockholmSeed, /position = excluded\.position/);
  });

  it('seeds the first 20 hero products without price observations', () => {
    for (const slug of heroProductSlugs) {
      assert.match(stockholmSeed, new RegExp(`'${slug}'`), `${slug} product seed missing`);
    }
    assert.equal(heroProductSlugs.length, 20);
    assert.doesNotMatch(stockholmSeed, /insert into observations|insert into latest_prices/);
  });
});
