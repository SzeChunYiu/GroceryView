import { describe, expect, it } from 'vitest';
import { formatDiscountPercent } from './deal-card';

describe('formatDiscountPercent', () => {
  it('rounds percentage discounts to 0 decimals with Intl.NumberFormat', () => {
    expect(formatDiscountPercent(19.6, 'en-US')).toBe('20');
    expect(formatDiscountPercent(19.4, 'en-US')).toBe('19');
  });
});
