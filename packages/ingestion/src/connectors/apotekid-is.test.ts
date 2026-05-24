import { describe, expect, it } from 'vitest';
import { normalizeApotekidIsPrice, parseApotekidIsProductJsonLd } from './apotekid-is';

describe('apotekidIsConnector', () => {
  it('normalizes Apótekið JSON-LD product offers as ISK products', () => {
    expect(
      parseApotekidIsProductJsonLd({
        '@type': 'Product',
        name: 'D vítamín',
        sku: 'APO-1',
        offers: { availability: 'https://schema.org/InStock', price: '1.990 kr.', priceCurrency: 'ISK', url: '/vara/d-vitamin' }
      })
    ).toEqual({
      availability: 'https://schema.org/InStock',
      currency: 'ISK',
      id: 'APO-1',
      name: 'D vítamín',
      price: 1990,
      url: 'https://www.apotekid.is/vara/d-vitamin'
    });
  });

  it('parses Icelandic price strings', () => {
    expect(normalizeApotekidIsPrice('2.499 kr.')).toBe(2499);
  });
});
