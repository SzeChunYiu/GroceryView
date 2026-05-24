import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchNaturkraftSeProducts, parseNaturkraftSeProducts } from '../connectors/naturkraft-se.js';

const fixtureHtml = `
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Ekologiskt spirulinapulver","sku":"NK-SPIRULINA","brand":{"name":"Naturkraft"},"image":"/spirulina.jpg","offers":{"price":"149,00 kr","priceCurrency":"SEK","availability":"https://schema.org/InStock","url":"/products/spirulina"}}
</script>`;

describe('Naturkraft Sweden connector', () => {
  it('normalizes health-food product JSON-LD rows', () => {
    const rows = parseNaturkraftSeProducts(fixtureHtml, 'https://naturkraft.se/collections/halsokost', '2026-05-24T00:00:00.000Z');

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.chain, 'naturkraft-se');
    assert.equal(rows[0]?.country, 'SE');
    assert.equal(rows[0]?.category, 'health_food');
    assert.equal(rows[0]?.price, 149);
    assert.equal(rows[0]?.productUrl, 'https://naturkraft.se/products/spirulina');
  });

  it('fetches configured Naturkraft source URLs with the provided fetch implementation', async () => {
    const rows = await fetchNaturkraftSeProducts({
      fetchImpl: async () => new Response(fixtureHtml, { status: 200 }),
      retrievedAt: '2026-05-24T00:00:00.000Z',
      sourceUrls: ['https://naturkraft.se/collections/halsokost']
    });

    assert.equal(rows[0]?.name, 'Ekologiskt spirulinapulver');
  });
});
