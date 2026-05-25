import { describe, expect, it } from 'vitest';
import { normalizeTempoSeProduct, parseTempoSeProducts } from '../tempo-se';

describe('Tempo SE connector', () => {
  it('normalizes chain-wide Tempo product rows for the all-store runner', () => {
    const row = normalizeTempoSeProduct({ code: '731000', name: 'Mjölk 1,5%', priceText: '18,90 kr', packageText: '1 l' }, 'https://www.tempo.nu/sok?q=mjolk', '2026-05-25T00:00:00.000Z');
    expect(row).toMatchObject({ country: 'SE', currency: 'SEK', chain: 'tempo', code: '731000', price: 18.9, packageText: '1 l' });
  });

  it('parses JSON search payloads', () => {
    expect(parseTempoSeProducts(JSON.stringify({ products: [{ id: '1', title: 'Pasta', price: 12 }] }))).toHaveLength(1);
  });
});
