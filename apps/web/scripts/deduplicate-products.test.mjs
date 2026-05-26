import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDuplicateReconcileWorkflow,
  titleSignatureForProduct
} from '../src/lib/deduplicate-products.ts';

describe('duplicate product reconciliation', () => {
  it('groups duplicate products by barcode and title signature for admin review', () => {
    const workflow = buildDuplicateReconcileWorkflow([
      {
        id: 'axfood:milk-1',
        name: 'Organic Whole Milk 1l',
        brand: 'Green Valley',
        barcode: '0735000111222',
        size: '1l',
        unit: 'kr/st'
      },
      {
        id: 'openprices:milk-1',
        name: 'Green Valley Organic Whole Milk',
        brand: 'Green Valley',
        ean: '0735000111222',
        size: '1 l',
        unit: 'kr/st'
      },
      {
        id: 'openprices:oats',
        name: 'Breakfast Oats',
        brand: 'Morning Mill',
        barcode: '0700000000001',
        size: '750g'
      }
    ], 0.65);

    assert.equal(workflow.stats.inputProductCount, 3);
    assert.equal(workflow.groups.length, 1);
    assert.equal(workflow.stats.readyToMergeCount, 1);
    assert.match(workflow.groups[0].signals.join(' '), /same barcode/);
    assert.match(workflow.groups[0].signals.join(' '), /same brand/);
    assert.equal(workflow.mergeQueue[0].canonicalProduct.id, 'axfood:milk-1');
  });

  it('builds stable title signatures from brand, normalized name, package size, and unit', () => {
    assert.equal(
      titleSignatureForProduct({
        id: 'pasta',
        name: 'Makaroner Pasta',
        brand: 'Garant Eko',
        size: '500g',
        unit: 'kr/st'
      }),
      'garant eko:makaroner pasta:500:g'
    );
  });
});
