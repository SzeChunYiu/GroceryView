import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { explainProductMatch, marketAliasTermsFor, rankExplainableProductMatches } from '../index.js';

describe('explainProductMatch', () => {
  it('marks exact EAN matches as high confidence with an EAN factor', () => {
    const match = explainProductMatch(
      { id: 'willys-milk', name: 'Arla Mjölk 1L', market: 'SE', ean: '0731086001234', commodityId: 'milk' },
      { id: 'coop-milk', name: 'Arla Mjölk 1 l', market: 'SE', gtin: '0731086001234', commodityId: 'milk' }
    );

    assert.equal(match.confidence, 'high');
    assert.equal(match.requiresReview, false);
    assert.ok(match.factors.some((factor) => factor.type === 'ean' && factor.score > 0));
  });

  it('uses Norwegian and Icelandic alias signals for cross-market commodity matches', () => {
    const ranked = rankExplainableProductMatches(
      { id: 'no-oats', name: 'Havregryn lettkokte', market: 'NO', commodityId: 'oats' },
      [
        { id: 'is-oats', name: 'Hafrar fínir', market: 'IS', commodityId: 'oats', aliases: ['oats'] },
        { id: 'is-rice', name: 'Hrísgrjón', market: 'IS', commodityId: 'rice' }
      ]
    );

    assert.equal(ranked[0]?.candidateId, 'is-oats');
    assert.equal(ranked[0]?.confidence, 'medium');
    assert.ok(ranked[0]?.factors.some((factor) => factor.type === 'market_alias'));
  });

  it('requires review when EANs conflict even if brand and size agree', () => {
    const match = explainProductMatch(
      { id: 'a', name: 'Brand Pasta 500g', ean: '1111111111111', brand: 'Brand', sizeText: '500 g' },
      { id: 'b', name: 'Brand Pasta 500 gram', ean: '2222222222222', brand: 'Brand', sizeText: '0.5 kg' }
    );

    assert.equal(match.confidence, 'review');
    assert.equal(match.requiresReview, true);
    assert.ok(match.factors.some((factor) => factor.type === 'ean' && factor.score < 0));
  });

  it('adds a nutrition factor when per-100g values are close', () => {
    const match = explainProductMatch(
      {
        id: 'source',
        name: 'Greek yoghurt',
        commodityId: 'yoghurt',
        nutrition: { energyKcalPer100g: 95, proteinPer100g: 8.5, carbsPer100g: 4, fatPer100g: 5 }
      },
      {
        id: 'candidate',
        name: 'Greek yogurt',
        commodityId: 'yoghurt',
        nutrition: { energyKcalPer100g: 100, proteinPer100g: 8, carbsPer100g: 4.8, fatPer100g: 5.2 }
      }
    );

    assert.ok(match.factors.some((factor) => factor.type === 'nutrition'));
    assert.ok(match.score >= 35);
  });
});

describe('marketAliasTermsFor', () => {
  it('normalizes Nordic grocery aliases for admin explanations', () => {
    assert.deepEqual(marketAliasTermsFor('IS', 'Nýmjólk'), ['milk', 'mjolk']);
  });
});
