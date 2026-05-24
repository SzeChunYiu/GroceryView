import { describe, expect, it } from 'vitest';
import { normalizeNaturkraftSeProduct, normalizeNaturkraftSeStore } from './naturkraft-se';

describe('naturkraft-se connector', () => {
  it('normalizes health-food products as SEK rows', () => {
    expect(
      normalizeNaturkraftSeProduct({ '@type': 'Product', name: 'D-vitamin', sku: 'HK-1', brand: { name: 'Hälsokraft' }, offers: { price: '99', url: '/d-vitamin' } })
    ).toMatchObject({ category: 'health_food', currency: 'SEK', productId: 'HK-1', price: 99 });
  });

  it('normalizes Swedish health-food store locations', () => {
    expect(
      normalizeNaturkraftSeStore({ '@type': 'Store', name: 'Hälsokraft Stockholm', address: { streetAddress: 'Exempelgatan 1', addressLocality: 'Stockholm' }, url: '/butiker/stockholm' })
    ).toMatchObject({ category: 'health_food', countryCode: 'SE', city: 'Stockholm' });
  });
});
