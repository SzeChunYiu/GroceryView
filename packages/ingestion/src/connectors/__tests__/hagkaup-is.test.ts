import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { icelandBannerTierResearch, parseHagkaupIsProducts } from '../hagkaup-is.js';

const SOURCE_URL = 'https://hagkaup.is/tilbod';
const RETRIEVED_AT = '2026-05-25T18:20:00.000Z';
const FIXTURE = `<main><article class="product tilboð" data-sku="hag-1" data-category="coffee"><a href="/vara/kaffi"><img src="/img/kaffi.jpg" /></a><h2>Premium kaffi 500 g</h2><span class="price">1.499 kr.</span><span class="regular">1.999 kr.</span><span class="badge">Tilboð</span></article></main>`;

describe('Hagkaup IS connector research parser', () => {
  it('parses premium Hagkaup ISK rows and models banner tier separately from operator group', () => {
    const rows = parseHagkaupIsProducts(FIXTURE, SOURCE_URL, RETRIEVED_AT);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.operatorGroup, 'hagkaup');
    assert.equal(rows[0]?.priceTier, 'premium');
    assert.equal(rows[0]?.currency, 'ISK');
    assert.equal(rows[0]?.price, 1499);
    assert.equal(icelandBannerTierResearch.some((row) => row.chain === 'pris-is' && row.priceTier === 'discount'), true);
  });
});
