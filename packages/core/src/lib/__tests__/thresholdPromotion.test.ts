import { describe, expect, it } from 'vitest';
import { parseThresholdPromotion } from '../promotionParsers/threshold';

const examples = [
  ['Vid köp över 200 kr, 20 kr rabatt', { kind: 'threshold', min_spend: 200, discount: 20 }],
  ['Handla för minst 300 kr - få 50 kr rabatt', { kind: 'threshold', min_spend: 300, discount: 50 }],
  ['Köp från 1 000 kr: 100 kr rabatt', { kind: 'threshold', min_spend: 1000, discount: 100 }],
  ['20 kr rabatt vid köp för minst 200 kr', { kind: 'threshold', min_spend: 200, discount: 20 }],
  ['10,50 kr rabatt vid köp över 99,90 kr', { kind: 'threshold', min_spend: 99.9, discount: 10.5 }]
] as const;

describe('parseThresholdPromotion', () => {
  it.each(examples)('parses %s', (input, expected) => {
    expect(parseThresholdPromotion(input)).toEqual(expected);
  });

  it('returns null for non-threshold or unsafe discount copy', () => {
    expect(parseThresholdPromotion('20% rabatt på kaffe')).toBeNull();
    expect(parseThresholdPromotion('20 kr rabatt')).toBeNull();
    expect(parseThresholdPromotion('Köp 2 för 20 kr')).toBeNull();
    expect(parseThresholdPromotion('Vid köp över 0 kr, 20 kr rabatt')).toBeNull();
  });
});
