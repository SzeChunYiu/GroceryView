import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type KiwiNoRow = {
  country: 'NO';
  currency: 'NOK';
  chain: 'kiwi-no';
  sku: string;
  name: string;
  price: number;
};

function parseKiwiNoFixture(payload: unknown): KiwiNoRow[] {
  if (!Array.isArray(payload)) throw new Error('KIWI fixture must be an array');
  return payload.map((item) => {
    const row = item as Record<string, unknown>;
    if (typeof row.sku !== 'string' || typeof row.name !== 'string' || typeof row.price !== 'number') {
      throw new Error('KIWI fixture row is missing sku, name, or numeric price');
    }
    return { country: 'NO', currency: 'NOK', chain: 'kiwi-no', sku: row.sku, name: row.name, price: row.price };
  });
}

describe('kiwi-no connector fixture contract', () => {
  it('parses recorded fixture rows into the expected row shape', () => {
    assert.deepEqual(parseKiwiNoFixture([{ sku: 'kiwi-melk-1l', name: 'Lettmelk 1 l', price: 22.9 }]), [{
      country: 'NO',
      currency: 'NOK',
      chain: 'kiwi-no',
      sku: 'kiwi-melk-1l',
      name: 'Lettmelk 1 l',
      price: 22.9
    }]);
  });

  it('covers empty fixtures and malformed rows', () => {
    assert.deepEqual(parseKiwiNoFixture([]), []);
    assert.throws(() => parseKiwiNoFixture([{ sku: 'bad', name: 'Missing price' }]), /numeric price/);
    assert.throws(() => parseKiwiNoFixture({}), /must be an array/);
  });
});
