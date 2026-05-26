import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  substitutionPlansForUnavailableProducts,
  substitutionSuggestionsForUnavailableProduct
} from '../src/lib/substitutions.ts';

function card(overrides) {
  return {
    slug: 'base',
    name: 'Base product',
    brand: 'Garant',
    productKind: 'branded',
    totalPriceLabel: '20,00 kr',
    unitPriceLabel: '40,00 kr/kg',
    totalSortPrice: 20,
    unitSortPrice: 40,
    isAvailable: true,
    confidenceLevel: 'high',
    confidenceLabel: 'Verified latest price and package size',
    safetyProfile: {
      dietaryTags: ['vegetarian'],
      allergenTags: [],
      evidenceLabels: ['vegetarian']
    },
    safetyEvidenceLabel: 'vegetarian label evidence',
    carbonScore: { score: 75, grade: 'B', label: '75/100 carbon score', source: 'origin-transport-heuristic', reasons: [] },
    ...overrides
  };
}

describe('store substitution suggestions', () => {
  it('ranks available alternatives by category, brand, price, and nutrition evidence', () => {
    const unavailable = card({
      slug: 'oats-main',
      name: 'Breakfast oats',
      brand: 'Axa',
      isAvailable: false,
      totalSortPrice: 24,
      unitSortPrice: 29
    });
    const sameCategorySameBrand = card({
      slug: 'oats-alt',
      name: 'Axa oats fallback',
      brand: 'Axa',
      totalSortPrice: 22,
      unitSortPrice: 25
    });
    const otherCategory = card({
      slug: 'sauce-alt',
      name: 'Sauce fallback',
      brand: 'Garant',
      productKind: 'commodity',
      totalSortPrice: 18,
      unitSortPrice: 18
    });

    const suggestions = substitutionSuggestionsForUnavailableProduct(unavailable, [
      unavailable,
      otherCategory,
      sameCategorySameBrand
    ]);

    assert.equal(suggestions[0].slug, 'oats-alt');
    assert.match(suggestions[0].reason, /same branded category/);
    assert.match(suggestions[0].brandPreferenceLabel, /Keeps selected brand/);
    assert.match(suggestions[0].nutritionImpactLabel, /vegetarian/);
  });

  it('builds plans only for unavailable products', () => {
    const plans = substitutionPlansForUnavailableProducts([
      card({ slug: 'available', name: 'Available product' }),
      card({ slug: 'missing', name: 'Missing product', isAvailable: false })
    ]);

    assert.equal(plans.length, 1);
    assert.equal(plans[0].unavailableProduct.slug, 'missing');
    assert.match(plans[0].guardrails.join(' '), /never auto-applied/);
  });
});
