import { describe, expect, it } from 'vitest';
import { parseBogoPromotion } from '../promotionParsers/bogo';

describe('parseBogoPromotion', () => {
  it('parses buy-n-get-m-free copy', () => {
    expect(parseBogoPromotion('Köp 2 få 1 gratis')).toEqual({ kind: 'bogo', buy: 2, free: 1 });
    expect(parseBogoPromotion('Köp 3 och få 2 på köpet')).toEqual({ kind: 'bogo', buy: 3, free: 2 });
  });

  it('parses x-for-y and take-x-pay-y mechanics as paid plus free units', () => {
    expect(parseBogoPromotion('3 för 2')).toEqual({ kind: 'bogo', buy: 2, free: 1 });
    expect(parseBogoPromotion('Tag 4 betala för 3')).toEqual({ kind: 'bogo', buy: 3, free: 1 });
  });

  it('ignores non-bogo discount copy and invalid mechanics', () => {
    expect(parseBogoPromotion('20% rabatt på kaffe')).toBeNull();
    expect(parseBogoPromotion('2 för 3')).toBeNull();
    expect(parseBogoPromotion('Medlemspris 29 kr')).toBeNull();
  });
});
