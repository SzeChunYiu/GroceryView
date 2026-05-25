import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const generatorPath = new URL('../../../scripts/ingestion/generate-live-retailer-ingested.mjs', import.meta.url);

describe('Bónus IS live ingestion export wiring', () => {
  it('registers the connector in the live retailer snapshot generator with provenance metadata', async () => {
    const generator = await readFile(generatorPath, 'utf8');

    assert.match(generator, /DEFAULT_BONUS_IS_PRODUCT_URLS/);
    assert.match(generator, /fetchBonusIsProducts/);
    assert.match(generator, /shouldRun\('bonus-is'\)/);
    assert.match(generator, /summary\.bonusIsProducts = bonusIsProducts\.length/);
    assert.match(generator, /writeGeneratedFile\('bonus-is\.ts'/);
    assert.match(generator, /export const bonusIsSource/);
    assert.match(generator, /rowCount: rows\.length/);
    assert.match(generator, /sourceUrls: sourceUrls\.length > 0 \? sourceUrls : \[\.\.\.DEFAULT_BONUS_IS_PRODUCT_URLS\]/);
    assert.match(generator, /export const bonusIsProducts: BonusIsIngestedProduct\[\]/);
  });
});
