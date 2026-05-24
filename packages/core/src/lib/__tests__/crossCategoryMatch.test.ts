import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyProductMatch, type ProductMatchInput } from '../../index.js';

type ReviewedSku = ProductMatchInput & {
  retailerType: 'grocery' | 'pharmacy' | 'variety' | 'cosmetics';
  cluster: string;
};

const reviewedSkus: ReviewedSku[] = [
  sku('colgate-total-75-grocery', 'grocery', 'colgate-total-75', '0732350101010', 'Colgate', 'personal_care', 75, 'ml'),
  sku('colgate-total-75-pharmacy', 'pharmacy', 'colgate-total-75', '0732350101010', 'Colgate', 'personal_care', 75, 'ml'),
  sku('colgate-total-75-variety', 'variety', 'colgate-total-75', '0732350101010', 'Colgate', 'personal_care', 75, 'ml'),
  sku('colgate-max-100-grocery', 'grocery', 'colgate-max-100', '0732350202020', 'Colgate', 'personal_care', 100, 'ml'),
  sku('colgate-max-100-pharmacy', 'pharmacy', 'colgate-max-100', '0732350202020', 'Colgate', 'personal_care', 100, 'ml'),
  sku('colgate-max-100-cosmetics', 'cosmetics', 'colgate-max-100', '0732350202020', 'Colgate', 'personal_care', 100, 'ml'),
  sku('pampers-baby-dry-44-grocery', 'grocery', 'pampers-baby-dry-44', '8001090303030', 'Pampers', 'baby_care', 44, 'diaper'),
  sku('pampers-baby-dry-44-pharmacy', 'pharmacy', 'pampers-baby-dry-44', '8001090303030', 'Pampers', 'baby_care', 44, 'diaper'),
  sku('pampers-baby-dry-44-variety', 'variety', 'pampers-baby-dry-44', '8001090303030', 'Pampers', 'baby_care', 44, 'diaper'),
  sku('pampers-premium-38-grocery', 'grocery', 'pampers-premium-38', '8001090404040', 'Pampers', 'baby_care', 38, 'diaper'),
  sku('pampers-premium-38-pharmacy', 'pharmacy', 'pampers-premium-38', '8001090404040', 'Pampers', 'baby_care', 38, 'diaper'),
  sku('pampers-premium-38-variety', 'variety', 'pampers-premium-38', '8001090404040', 'Pampers', 'baby_care', 38, 'diaper'),
  sku('always-ultra-12-grocery', 'grocery', 'always-ultra-12', '4015400505050', 'Always', 'personal_care', 12, 'piece'),
  sku('always-ultra-12-pharmacy', 'pharmacy', 'always-ultra-12', '4015400505050', 'Always', 'personal_care', 12, 'piece'),
  sku('always-ultra-12-cosmetics', 'cosmetics', 'always-ultra-12', '4015400505050', 'Always', 'personal_care', 12, 'piece'),
  sku('always-night-10-grocery', 'grocery', 'always-night-10', '4015400606060', 'Always', 'personal_care', 10, 'piece'),
  sku('always-night-10-pharmacy', 'pharmacy', 'always-night-10', '4015400606060', 'Always', 'personal_care', 10, 'piece'),
  sku('always-night-10-variety', 'variety', 'always-night-10', '4015400606060', 'Always', 'personal_care', 10, 'piece'),
  sku('nivea-soft-200-grocery', 'grocery', 'nivea-soft-200', '4005800707070', 'Nivea', 'personal_care', 200, 'ml'),
  sku('nivea-soft-200-pharmacy', 'pharmacy', 'nivea-soft-200', '4005800707070', 'Nivea', 'personal_care', 200, 'ml'),
  sku('nivea-soft-200-cosmetics', 'cosmetics', 'nivea-soft-200', '4005800707070', 'Nivea', 'personal_care', 200, 'ml'),
  sku('libresse-ultra-14-grocery', 'grocery', 'libresse-ultra-14', '7310790808080', 'Libresse', 'personal_care', 14, 'piece'),
  sku('libresse-ultra-14-pharmacy', 'pharmacy', 'libresse-ultra-14', '7310790808080', 'Libresse', 'personal_care', 14, 'piece'),
  sku('libresse-ultra-14-variety', 'variety', 'libresse-ultra-14', '7310790808080', 'Libresse', 'personal_care', 14, 'piece'),
  sku('oralb-pro-1-grocery', 'grocery', 'oralb-pro-1', '4210200909090', 'Oral-B', 'personal_care', 1, 'piece'),
  sku('oralb-pro-1-pharmacy', 'pharmacy', 'oralb-pro-1', '4210200909090', 'Oral-B', 'personal_care', 1, 'piece'),
  sku('oralb-pro-1-variety', 'variety', 'oralb-pro-1', '4210200909090', 'Oral-B', 'personal_care', 1, 'piece'),
  sku('sensodyne-repair-75-grocery', 'grocery', 'sensodyne-repair-75', '5054560101010', 'Sensodyne', 'personal_care', 75, 'ml'),
  sku('sensodyne-repair-75-pharmacy', 'pharmacy', 'sensodyne-repair-75', '5054560101010', 'Sensodyne', 'personal_care', 75, 'ml'),
  sku('sensodyne-repair-75-cosmetics', 'cosmetics', 'sensodyne-repair-75', '5054560101010', 'Sensodyne', 'personal_care', 75, 'ml')
];

function sku(id: string, retailerType: ReviewedSku['retailerType'], cluster: string, barcode: string, brand: string, category: string, packageSize: number, packageUnit: string): ReviewedSku {
  return { id, retailerType, cluster, barcode, brand, category, packageSize, packageUnit, brandTier: 'national' };
}

describe('cross-retailer product_match precision review', () => {
  it('clusters 30 personal-care SKUs across grocery, pharmacy, variety, and cosmetics retailers', () => {
    let predictedMatches = 0;
    let truePositiveMatches = 0;

    for (let left = 0; left < reviewedSkus.length; left += 1) {
      for (let right = left + 1; right < reviewedSkus.length; right += 1) {
        if (reviewedSkus[left].retailerType === reviewedSkus[right].retailerType) continue;
        const match = classifyProductMatch({ source: reviewedSkus[left], candidate: reviewedSkus[right] });
        if (match.mode === 'exact' || match.mode === 'equivalent') {
          predictedMatches += 1;
          if (reviewedSkus[left].cluster === reviewedSkus[right].cluster) truePositiveMatches += 1;
        }
      }
    }

    const precision = predictedMatches === 0 ? 0 : truePositiveMatches / predictedMatches;
    assert.equal(reviewedSkus.length, 30);
    assert.equal(predictedMatches, 30);
    assert.equal(truePositiveMatches, 30);
    assert.equal(precision, 1);
  });
});
