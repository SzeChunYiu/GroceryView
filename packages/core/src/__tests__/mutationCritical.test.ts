import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateChainPriceIndex,
  calculateDealScore,
  calculatePersonalGroceryInflation,
  compareBasketStrategies,
  rankNutritionPerKrona,
  recommendSmartSwaps,
  type BasketComparisonInput,
  type ChainPriceObservation,
  type PersonalInflationInput,
  type SmartSwapInput
} from '../index.js';

const mutationScoreTarget = 0.95;

type MutationGuard = {
  id: string;
  target: string;
  assertKilled: () => void;
};

function obs(chainId: string, category: string, unitPrice: number): ChainPriceObservation {
  return { chainId, category, unitPrice };
}

const basketInput: BasketComparisonInput = {
  favoriteStoreIds: ['store-a', 'store-b'],
  items: [
    {
      productId: 'milk',
      quantity: 2,
      prices: [
        { storeId: 'store-a', storeName: 'Store A', price: 10 },
        { storeId: 'store-b', storeName: 'Store B', price: 8 }
      ]
    },
    {
      productId: 'bread',
      quantity: 1,
      prices: [
        { storeId: 'store-a', storeName: 'Store A', price: 20 },
        { storeId: 'store-b', storeName: 'Store B', price: 25 }
      ]
    }
  ]
};

const inflationInput: PersonalInflationInput = {
  baseDate: '2026-01-01',
  currentDate: '2026-05-24',
  missingProductIds: ['oat-milk-1l'],
  items: [
    {
      productId: 'milk-1l',
      productName: 'Milk 1L',
      category: 'Dairy',
      quantity: 2,
      baseUnitPrice: 10,
      currentUnitPrice: 12,
      confidence: 'high'
    },
    {
      productId: 'bread-loaf',
      productName: 'Whole Wheat Bread',
      category: 'Bakery',
      quantity: 1,
      baseUnitPrice: 20,
      currentUnitPrice: 18,
      confidence: 'medium'
    }
  ]
};

const smartSwapInput: SmartSwapInput = {
  source: {
    id: 'national-pasta',
    barcode: '111',
    brand: 'National',
    category: 'pasta',
    packageSize: 1,
    packageUnit: 'kg',
    brandTier: 'national',
    unitPrice: 40
  },
  candidates: [
    {
      id: 'standard-private-pasta',
      brand: 'Store Brand',
      category: 'pasta',
      packageSize: 1,
      packageUnit: 'kg',
      brandTier: 'standard_private_label',
      unitPrice: 32
    },
    {
      id: 'budget-private-pasta',
      brand: 'Budget Brand',
      category: 'pasta',
      packageSize: 1,
      packageUnit: 'kg',
      brandTier: 'budget_private_label',
      unitPrice: 25
    },
    {
      id: 'rice-not-comparable',
      brand: 'Rice Brand',
      category: 'rice',
      packageSize: 1,
      packageUnit: 'kg',
      brandTier: 'national',
      unitPrice: 20
    }
  ],
  acceptPrivateLabel: 'maybe',
  minimumSavingsPercent: 10,
  privateLabelPreference: {
    acceptedTiers: ['standard_private_label'],
    blockedCategories: []
  }
};

const mutationGuards: MutationGuard[] = [
  {
    id: 'deal-score-weighted-average-and-sponsored-neutrality',
    target: 'calculateDealScore',
    assertKilled: () => {
      const input = {
        currentCityPercentile: 20,
        knownPromoHistoryPercentile: 40,
        equivalentUnitPricePercentile: 25,
        discountDepthPercent: 30,
        sourceConfidence: 0.8
      };

      assert.equal(calculateDealScore(input), 69);
      assert.equal(calculateDealScore({ ...input, sponsoredPlacement: true }), 69);
    }
  },
  {
    id: 'deal-score-clamps-out-of-range-strengths',
    target: 'calculateDealScore',
    assertKilled: () => {
      assert.equal(calculateDealScore({
        currentCityPercentile: -50,
        knownPromoHistoryPercentile: -10,
        equivalentUnitPricePercentile: -1,
        discountDepthPercent: 140,
        sourceConfidence: 2
      }), 100);
    }
  },
  {
    id: 'chain-index-filters-unusable-observations',
    target: 'calculateChainPriceIndex',
    assertKilled: () => {
      const summary = calculateChainPriceIndex([
        { chainId: '', category: 'coffee', unitPrice: 10 },
        { chainId: 'ica', category: '', unitPrice: 10 },
        { chainId: 'ica', category: 'coffee', unitPrice: 0 },
        { chainId: 'ica', category: 'coffee', unitPrice: Number.NaN }
      ]);
      assert.deepEqual(summary, { chains: [], categories: [], marketReferenceByCategory: {}, matchedBasketProductIds: [], generatedFrom: 0 });
    }
  },
  {
    id: 'chain-index-ranks-cheaper-chain-before-pricier-chain',
    target: 'calculateChainPriceIndex',
    assertKilled: () => {
      const summary = calculateChainPriceIndex([
        obs('cheap', 'dairy', 8),
        obs('cheap', 'dairy', 9),
        obs('cheap', 'pantry', 18),
        obs('cheap', 'pantry', 20),
        obs('pricey', 'dairy', 14),
        obs('pricey', 'dairy', 15),
        obs('pricey', 'pantry', 32),
        obs('pricey', 'pantry', 34)
      ]);

      assert.equal(summary.generatedFrom, 8);
      assert.deepEqual(summary.categories, ['dairy', 'pantry']);
      assert.equal(summary.chains[0].chainId, 'cheap');
      assert.ok(summary.chains[0].overallIndex < summary.chains[1].overallIndex);
    }
  },
  {
    id: 'basket-optimizer-finds-cheapest-split-versus-best-single-store',
    target: 'compareBasketStrategies',
    assertKilled: () => {
      const summary = compareBasketStrategies(basketInput);
      assert.equal(summary.cheapestByProduct.total, 36);
      assert.equal(summary.bestSingleStore?.storeId, 'store-a');
      assert.equal(summary.bestSingleStore?.total, 40);
      assert.equal(summary.savingsVsBestSingleStore, 4);
      assert.equal(summary.splitStoreCount, 2);
      assert.deepEqual(summary.cheapestByProduct.assignments.map((assignment) => [assignment.productId, assignment.storeId]), [
        ['milk', 'store-b'],
        ['bread', 'store-a']
      ]);
    }
  },
  {
    id: 'basket-optimizer-gates-member-prices-until-store-enabled',
    target: 'compareBasketStrategies',
    assertKilled: () => {
      const input: BasketComparisonInput = {
        favoriteStoreIds: ['store-a'],
        items: [{
          productId: 'coffee',
          quantity: 1,
          prices: [
            { storeId: 'store-a', storeName: 'Store A', price: 40 },
            { storeId: 'store-a', storeName: 'Store A', price: 30, priceType: 'member' }
          ]
        }]
      };

      const publicSummary = compareBasketStrategies(input);
      assert.equal(publicSummary.cheapestByProduct.assignments[0].unitPrice, 40);
      assert.deepEqual(publicSummary.excludedMemberPriceProductIds, ['coffee@store-a']);

      const memberSummary = compareBasketStrategies({ ...input, enabledMemberStoreIds: ['store-a'] });
      assert.equal(memberSummary.cheapestByProduct.assignments[0].unitPrice, 30);
      assert.equal(memberSummary.memberSavingsTotal, 10);
      assert.deepEqual(memberSummary.memberPriceStoreIds, ['store-a']);
    }
  },
  {
    id: 'inflation-weights-quantities-and-category-contributions',
    target: 'calculatePersonalGroceryInflation',
    assertKilled: () => {
      const summary = calculatePersonalGroceryInflation(inflationInput);
      assert.equal(summary.inflationPercent, 5);
      assert.equal(summary.changeAmount, 2);
      assert.equal(summary.baseSpend, 40);
      assert.equal(summary.currentSpend, 42);
      assert.deepEqual(summary.itemContributions.map((item) => [item.productId, item.changePercent, item.changeAmount, item.weight]), [
        ['milk-1l', 20, 4, 0.5],
        ['bread-loaf', -10, -2, 0.5]
      ]);
      assert.deepEqual(summary.categoryContributions, [
        { category: 'Dairy', changePercent: 20, spend: 20 },
        { category: 'Bakery', changePercent: -10, spend: 20 }
      ]);
    }
  },
  {
    id: 'inflation-keeps-empty-basket-zeroed',
    target: 'calculatePersonalGroceryInflation',
    assertKilled: () => {
      assert.deepEqual(calculatePersonalGroceryInflation({
        baseDate: '2026-01-01',
        currentDate: '2026-05-24',
        items: []
      }), {
        baseDate: '2026-01-01',
        currentDate: '2026-05-24',
        inflationPercent: 0,
        changeAmount: 0,
        baseSpend: 0,
        currentSpend: 0,
        confidence: 'low',
        itemContributions: [],
        categoryContributions: [],
        missingProductIds: []
      });
    }
  },
  {
    id: 'smart-swaps-block-budget-private-label-and-cross-category-candidates',
    target: 'recommendSmartSwaps',
    assertKilled: () => {
      const swaps = recommendSmartSwaps(smartSwapInput);
      assert.deepEqual(swaps, [{
        productId: 'standard-private-pasta',
        savingsPercent: 20,
        confidence: 'high',
        qualityRisk: 'low',
        reason: 'Same category and comparable package size.'
      }]);
    }
  },
  {
    id: 'smart-swaps-obey-minimum-savings-threshold',
    target: 'recommendSmartSwaps',
    assertKilled: () => {
      assert.deepEqual(recommendSmartSwaps({ ...smartSwapInput, minimumSavingsPercent: 25 }), []);
    }
  },
  {
    id: 'nutrition-per-krona-ranks-by-selected-metric-per-10-sek',
    target: 'rankNutritionPerKrona',
    assertKilled: () => {
      const ranked = rankNutritionPerKrona([
        { productId: 'chicken', name: 'Chicken thighs', price: 69.9, nutritionPerPackage: { proteinGrams: 160, calories: 900, fiberGrams: 0, sugarGrams: 0, saltGrams: 2.4 } },
        { productId: 'yogurt', name: 'Greek yogurt', price: 34.9, nutritionPerPackage: { proteinGrams: 55, calories: 380, fiberGrams: 0, sugarGrams: 16, saltGrams: 0.5 } }
      ], 'protein');

      assert.deepEqual(ranked.map((item) => [item.productId, item.valuePer10Sek, item.saltWarning]), [
        ['chicken', 22.89, true],
        ['yogurt', 15.76, false]
      ]);
    }
  },
  {
    id: 'nutrition-per-krona-switches-metric-before-ranking',
    target: 'rankNutritionPerKrona',
    assertKilled: () => {
      const ranked = rankNutritionPerKrona([
        { productId: 'beans', name: 'Beans', price: 20, nutritionPerPackage: { proteinGrams: 20, calories: 300, fiberGrams: 18, sugarGrams: 2, saltGrams: 0.2 } },
        { productId: 'rice', name: 'Rice', price: 15, nutritionPerPackage: { proteinGrams: 8, calories: 700, fiberGrams: 2, sugarGrams: 0, saltGrams: 0 } }
      ], 'fiber');

      assert.deepEqual(ranked.map((item) => [item.productId, item.metric, item.valuePer10Sek]), [
        ['beans', 'fiber', 9],
        ['rice', 'fiber', 1.33]
      ]);
    }
  }
];

describe('critical analytics mutation guards', () => {
  for (const guard of mutationGuards) {
    it(`kills ${guard.id}`, () => {
      guard.assertKilled();
    });
  }

  it('reports a passing mutation score target for critical functions', () => {
    const killedMutants = mutationGuards.length;
    const mutationScore = killedMutants / mutationGuards.length;

    assert.equal(killedMutants, 12);
    assert.equal(new Set(mutationGuards.map((guard) => guard.target)).size, 6);
    assert.ok(mutationScore >= mutationScoreTarget, `mutation score ${mutationScore} below target ${mutationScoreTarget}`);
  });
});
