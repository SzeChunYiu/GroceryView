import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHalaSeRows, verifyHalaSeStoreCount } from './hala-se.js';

const fixture = new URL('./fixtures/hala-se.html', import.meta.url);

describe('hala-se connector', () => {
  it('verifies store count and emits whitelisted Eastern-European rows', async () => {
    const html = await readFile(fixture, 'utf8');
    const rows = parseHalaSeRows(html, 'https://hala.se/', '2026-05-24T00:00:00Z');

    assert.equal(verifyHalaSeStoreCount(html), 3);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.country, 'SE');
    assert.equal(rows[0]?.currency, 'SEK');
    assert.equal(rows[0]?.chain, 'hala');
    assert.equal(rows[0]?.retailer_type, 'ethnic_polish_eastern_european');
    assert.equal(rows[0]?.store_count, 3);
    assert.equal(rows.every((row) => row.qualifies), true);
  });

  it('excludes Hala sources that do not qualify as Polish/Eastern-European grocery overlap', () => {
    const rows = parseHalaSeRows('<h1>Hala Frukt AB</h1><p>1 butiker</p><article><h2>Äpplen</h2><p>20 SEK</p></article>');
    assert.deepEqual(rows, []);
  });
});
