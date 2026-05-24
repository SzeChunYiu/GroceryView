import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeApohemProductRows } from '../connectors/apohem.js';

test('Apohem Club Deal rows carry online channel and member/non-member flags', () => {
  const rows = normalizeApohemProductRows({
    displayName: 'BioSalma Kreatin Monohydrat 500g',
    brandName: 'BioSalma',
    code: 'PA123',
    variationCode: 'A123',
    variationEAN: '0735000123456',
    url: '/produkt/biosalma-kreatin',
    price: {
      current: { inclVat: 149, vatPercent: 12 },
      member: { inclVat: 149 },
      nonMember: { inclVat: 186 },
    },
  }, 'https://www.apohem.se/erbjudande/rea', '2026-05-24T00:00:00.000Z');

  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => ({ price: row.price, channel: row.channel, is_member_price: row.is_member_price })), [
    { price: 149, channel: 'online', is_member_price: true },
    { price: 186, channel: 'online', is_member_price: false },
  ]);
});
