import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const compareLibSource = await readFile(new URL('../src/lib/chain-compare.ts', import.meta.url), 'utf8');

function parseCompareProductsParam(input) {
  const productsParam = Array.isArray(input) ? input.join(',') : (input ?? '');
  const seen = new Set();
  return productsParam.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, 6);
}

function loadResetUrlHelper() {
  const match = compareLibSource.match(/export function buildCompareNoChainResetUrl[\s\S]*?\n}/);
  assert.ok(match, 'buildCompareNoChainResetUrl should be exported from chain-compare.ts');
  const helperSource = match[0]
    .replace('export ', '')
    .replace('searchParams: CompareResetSearchParams', 'searchParams')
    .replace('): string {', ') {');

  return Function('parseCompareProductsParam', `${helperSource}; return buildCompareNoChainResetUrl;`)(parseCompareProductsParam);
}

describe('compare no-chain reset URL helper', () => {
  it('preserves selected products while clearing coupon, delivery, and pickup params', () => {
    const buildCompareNoChainResetUrl = loadResetUrlHelper();
    const resetUrl = buildCompareNoChainResetUrl({
      products: ['makaroner-pasta-101302991-st', 'havregryn-extra-fylliga-101758934-st'],
      coupons: 'only',
      delivery: 'home',
      pickup: 'store-123'
    });

    assert.equal(resetUrl, '/compare?products=makaroner-pasta-101302991-st,havregryn-extra-fylliga-101758934-st');
    assert.doesNotMatch(resetUrl, /coupons?|delivery|pickup/);
  });
});
