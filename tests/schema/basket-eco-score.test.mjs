import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const basketPage = readFileSync(new URL('../../apps/web/src/app/basket/page.tsx', import.meta.url), 'utf8');
const verifiedData = readFileSync(new URL('../../apps/web/src/lib/verified-data.ts', import.meta.url), 'utf8');

describe('basket eco score surface', () => {
  it('renders basket-level eco scoring on the basket route', () => {
    assert.match(basketPage, /data-basket-eco-score/);
    assert.match(basketPage, /weeklyBasketEcoScore/);
    assert.match(basketPage, /weeklyBasketEcoGrade/);
    assert.match(basketPage, /no kg CO2e value is invented/i);
  });

  it('keeps eco scoring tied to carbon evidence and cheaper greener suggestions', () => {
    assert.match(verifiedData, /calculateCarbonScore/);
    assert.match(verifiedData, /weeklyBasketEcoRows/);
    assert.match(verifiedData, /knownEcoScoreCount/);
    assert.match(verifiedData, /estimatedEcoScoreCount/);
    assert.match(verifiedData, /Cheaper-plus-greener suggestions require same-category verified catalogue rows/);
  });
});
