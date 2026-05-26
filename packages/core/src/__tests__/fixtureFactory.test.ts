import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureBasket, fixtureMarketBundle, fixturePriceObservation, fixtureProduct } from '../lib/fixtureFactory.js';

test('fixture factory keeps related ids consistent', () => {
  const bundle = fixtureMarketBundle('NO');

  assert.equal(bundle.market.code, 'NO');
  assert.equal(bundle.product.market, 'NO');
  assert.equal(bundle.store.chainId, bundle.chain.id);
  assert.equal(bundle.observation.productId, bundle.product.id);
  assert.equal(bundle.basket.lines[0]?.productId, bundle.product.id);
});

test('fixture factory supports targeted overrides', () => {
  const product = fixtureProduct({ id: 'custom-product', market: 'IS', barcode: undefined });
  const observation = fixturePriceObservation({ market: 'IS', productId: product.id, price: 123 });
  const basket = fixtureBasket({ market: 'IS', lines: [{ productId: product.id, quantity: 3 }] });

  assert.equal(product.id, 'custom-product');
  assert.equal(observation.currency, 'ISK');
  assert.equal(observation.productId, product.id);
  assert.equal(basket.lines[0]?.quantity, 3);
});
