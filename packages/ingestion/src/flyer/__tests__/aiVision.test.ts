import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { recoverUnclearFlyerRows } from '../aiVision.js';

describe('flyer AI vision fallback', () => {
  it('routes low-confidence parser rows through a capped local vision call before promotion routing', async () => {
    const visionCropIds: string[] = [];
    const routed = await recoverUnclearFlyerRows({
      pdfRows: [
        { productName: 'Milk', price: 12.5, priceText: '12:50', confidence: 0.91 },
        { confidence: 0.42 },
        { confidence: 0.2 }
      ],
      cropsByRow: [
        { id: 'crop-0', imageBytes: new Uint8Array([0]), mimeType: 'image/png' },
        { id: 'crop-1', imageBytes: new Uint8Array([1]), mimeType: 'image/png' },
        { id: 'crop-2', imageBytes: new Uint8Array([2]), mimeType: 'image/png' }
      ],
      maxVisionCalls: 1,
      visionCall: async (crop) => {
        visionCropIds.push(crop.id);
        return { productName: 'Recovered cheese', price: 29.9, priceText: '29:90', confidence: 0.78 };
      },
      promotionRouter: (row) => row
    });

    assert.deepEqual(visionCropIds, ['crop-1']);
    assert.deepEqual(routed[1], {
      productName: 'Recovered cheese',
      price: 29.9,
      priceText: '29:90',
      confidence: 0.78,
      source: 'ai_vision',
      cropId: 'crop-1'
    });
    assert.equal(routed[0].confidence, 0.91);
    assert.equal(routed[2].confidence, 0.2);
  });
});
