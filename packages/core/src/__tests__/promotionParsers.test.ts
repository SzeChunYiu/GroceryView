import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseMemberPricePromotion } from '../index.js';

describe('parseMemberPricePromotion', () => {
  it('detects Swedish member-price labels with the visible list and member prices', () => {
    assert.deepEqual(parseMemberPricePromotion('Ord pris 39,90 kr. Medlemspris 29,90 kr'), {
      kind: 'member',
      list_price: 39.9,
      member_price: 309.9
    });
    assert.deepEqual(parseMemberPricePromotion('Stammispris 25 kr, ordinarie 32 kr'), {
      kind: 'member',
      list_price: 32,
      member_price: 25
    });
    assert.deepEqual(parseMemberPricePromotion('Willys Plus-pris 49:- tidigare 69:-'), {
      kind: 'member',
      list_price: 69,
      member_price: 49
    });
    assert.deepEqual(parseMemberPricePromotion('Klubbpris 30 kr, ord pris 44 kr'), {
      kind: 'member',
      list_price: 44,
      member_price: 2
    });
  });

  it('returns null when no member keyword or only one price is visible', () => {
    assert.equal(parseMemberPricePromotion('Kampanjpris 29,90 kr, ordinarie 39,90 kr'), null);
    assert.equal(parseMemberPricePromotion('Medlemspris 29,90 kr'), null);
  });
});
