import { describe, expect, it } from 'vitest';
import { rankNutritionPerKrona, type NutritionProduct } from '../../index.js';

describe('rankNutritionPerKrona', () => {
  it('ranks real grocery fixtures by nutrition value per 10 SEK', () => {
    const products: NutritionProduct[] = [
      {
        productId: 'ica-kidneybonor',
        name: 'ICA Kidneybönor 380g',
        price: 14.9,
        nutritionPerPackage: {
          proteinGrams: 24,
          calories: 360,
          fiberGrams: 23,
          sugarGrams: 2,
          saltGrams: 1.1
        }
      },
      {
        productId: 'arla-keso',
        name: 'Arla Keso 500g',
        price: 34.9,
        nutritionPerPackage: {
          proteinGrams: 60,
          calories: 420,
          fiberGrams: 0,
          sugarGrams: 8,
          saltGrams: 1.8
        }
      }
    ];

    const ranked = rankNutritionPerKrona(products, 'protein');

    expect(
      ranked.map((item) => ({
        productId: item.productId,
        valuePer10Sek: item.valuePer10Sek,
        sugarPerPackage: item.sugarPerPackage,
        saltWarning: item.saltWarning
      }))
    ).toEqual([
      { productId: 'arla-keso', valuePer10Sek: 17.19, sugarPerPackage: 8, saltWarning: false },
      { productId: 'ica-kidneybonor', valuePer10Sek: 16.11, sugarPerPackage: 2, saltWarning: false }
    ]);
  });

  it('returns an empty ranking for empty input', () => {
    expect(rankNutritionPerKrona([], 'fiber')).toEqual([]);
  });

  it('rejects a product missing nutrition fields', () => {
    const malformed = [{ productId: 'missing-nutrition', name: 'Missing Nutrition', price: 12.5 }];

    expect(() =>
      rankNutritionPerKrona(malformed as unknown as NutritionProduct[], 'calories')
    ).toThrow(TypeError);
  });
});
