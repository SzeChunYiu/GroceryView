import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LIVSMEDELSVERKET_RECALLS_SE_FEED_URL,
  classifyLivsmedelsverketRecallHazard,
  fetchLivsmedelsverketFoodSafetyAlerts,
  parseLivsmedelsverketFoodSafetyAlerts
} from '../livsmedelsverket-recalls-se.js';

const FEED_FIXTURE = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Livsmedelsverket - återkallanden</title>
    <item>
      <link>https://www.livsmedelsverket.se/om-oss/press/aterkallanden/lidl-sverige-aterkallar-dumplings-med-kyckling-och-dumplings-med-biff-och-flask-av-market-kuljanka/</link>
      <title>Lidl Sverige återkallar Dumplings med kyckling och Dumplings med biff och fläsk (Kuljanka)</title>
      <description>Lidl Sverige återkallar Dumplings med kyckling och Dumplings med biff och fläsk av märket Kuljanka. Efter rutinmässig analys av produkterna har salmonella hittats i ett begränsat parti.</description>
      <pubDate>Fri, 22 May 2026 17:08:27 Z</pubDate>
    </item>
    <item>
      <link>https://www.livsmedelsverket.se/om-oss/press/aterkallanden/aterkallande/</link>
      <title>Zeinas återkallar Zeinas Toum 200 gram - kan innehålla räka</title>
      <description>Zeinas återkallar Zeinas Toum 200 gram av säkerhetsskäl då det finns risk att produkten innehåller kräftdjur (räka), ett allergen som inte deklarerats på förpackningen.</description>
      <pubDate>Fri, 22 May 2026 14:58:13 Z</pubDate>
    </item>
  </channel>
</rss>`;

describe('Livsmedelsverket Sweden recall feed connector', () => {
  it('parses RSS items into food_safety_alert rows', () => {
    const rows = parseLivsmedelsverketFoodSafetyAlerts(FEED_FIXTURE, '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 2);
    assert.equal(rows[0].country, 'SE');
    assert.equal(rows[0].authority, 'Livsmedelsverket');
    assert.equal(rows[0].kind, 'food_safety_alert');
    assert.equal(rows[0].hazard, 'microbiological');
    assert.equal(rows[0].affectedProduct, 'Dumplings med kyckling och Dumplings med biff och fläsk');
    assert.equal(rows[0].publishedAt, '2026-05-22T17:08:27.000Z');
    assert.equal(rows[0].retrievedAt, '2026-05-25T00:00:00.000Z');
    assert.equal(rows[1].hazard, 'allergen');
  });

  it('fetches the official recalls RSS endpoint and honors maxRows', async () => {
    const rows = await fetchLivsmedelsverketFoodSafetyAlerts({
      retrievedAt: '2026-05-25T00:00:00.000Z',
      maxRows: 1,
      fetchImpl: async (url, init) => {
        assert.equal(url, LIVSMEDELSVERKET_RECALLS_SE_FEED_URL);
        assert.equal(init?.headers && typeof init.headers === 'object' && 'accept' in init.headers, true);
        return new Response(FEED_FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 1);
    assert.match(rows[0].alertId, /^livsmedelsverket-se-/);
  });

  it('classifies common Swedish recall hazards', () => {
    assert.equal(classifyLivsmedelsverketRecallHazard('innehåller kräftdjur, ett allergen som inte deklarerats'), 'allergen');
    assert.equal(classifyLivsmedelsverketRecallHazard('salmonella hittats i ett begränsat parti'), 'microbiological');
    assert.equal(classifyLivsmedelsverketRecallHazard('glasbit i produkten'), 'foreign_body');
    assert.equal(classifyLivsmedelsverketRecallHazard('för höga halter av bekämpningsmedel'), 'pesticide');
  });
});
