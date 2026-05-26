import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MAST_RECALLS_IS_FEED_URL,
  classifyMastRecallHazard,
  fetchMastFoodSafetyAlerts,
  parseMastFoodSafetyAlerts
} from '../mast-recalls-is.js';

const FEED_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Innkallanir | Matvælastofnun</title>
    <item>
      <title>Málmhlutur í maísbaunum</title>
      <description><![CDATA[<p><img src="https://www.mast.is/static/news/sm/maiskorn.png.png" alt="Málmhlutur í maísbaunum" /></p>Matvælastofnun varar við neyslu á einni framleiðslulotu af Ora maisbaunum, 420g vegna málmhlutar sem gæti fundist í vöru.]]></description>
      <pubDate>Wed, 20 May 2026 15:52:00 +0000</pubDate>
      <link>https://www.mast.is/is/um-mast/frettir/frettir/malmhlutur-i-maisbaunum</link>
      <guid>https://www.mast.is/is/um-mast/frettir/frettir/malmhlutur-i-maisbaunum</guid>
    </item>
    <item>
      <title>Vanmerktur ofnæmis- og óþolsvaldur í pálmasykri</title>
      <description><![CDATA[Matvælastofnun varar neytendur sem hafa ofnæmi-eða óþol fyrir súlfíti við Madam Wong pálmasykri sem er vanmerktur.]]></description>
      <pubDate>Fri, 06 Mar 2026 13:21:00 +0000</pubDate>
      <link>https://www.mast.is/is/um-mast/frettir/frettir/vanmerktur-ofnaemis-og-otholsvaldur-i-palmasykri-3</link>
      <guid>mast-palmasykur</guid>
    </item>
  </channel>
</rss>`;

describe('MAST Iceland recall feed connector', () => {
  it('parses RSS items into food_safety_alert rows', () => {
    const rows = parseMastFoodSafetyAlerts(FEED_FIXTURE, '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 2);
    assert.equal(rows[0].country, 'IS');
    assert.equal(rows[0].authority, 'MAST');
    assert.equal(rows[0].kind, 'food_safety_alert');
    assert.equal(rows[0].title, 'Málmhlutur í maísbaunum');
    assert.equal(rows[0].hazard, 'foreign_body');
    assert.equal(rows[0].publishedAt, '2026-05-20T15:52:00.000Z');
    assert.equal(rows[0].sourceUrl, 'https://www.mast.is/is/um-mast/frettir/frettir/malmhlutur-i-maisbaunum');
    assert.equal(rows[0].imageUrl, 'https://www.mast.is/static/news/sm/maiskorn.png.png');
    assert.equal(rows[0].retrievedAt, '2026-05-25T00:00:00.000Z');
    assert.equal(rows[1].hazard, 'allergen');
  });

  it('fetches the current MAST recalls RSS endpoint and honors maxRows', async () => {
    const rows = await fetchMastFoodSafetyAlerts({
      retrievedAt: '2026-05-25T00:00:00.000Z',
      maxRows: 1,
      fetchImpl: async (url, init) => {
        assert.equal(url, MAST_RECALLS_IS_FEED_URL);
        assert.equal(init?.headers && typeof init.headers === 'object' && 'accept' in init.headers, true);
        return new Response(FEED_FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].alertId, 'mast-is-https-www-mast-is-is-um-mast-frettir-frettir-malmhlutur-i-maisbaunum');
  });

  it('classifies common MAST food safety hazards', () => {
    assert.equal(classifyMastRecallHazard('Salmonella í nautahakki'), 'microbiological');
    assert.equal(classifyMastRecallHazard('Óleyfilegt varnarefni í hvítlauk'), 'pesticide');
    assert.equal(classifyMastRecallHazard('3-MCDP og glycidyl fitusýrur esterar í núðlum'), 'chemical');
    assert.equal(classifyMastRecallHazard('Vanmerktur ofnæmisvaldur'), 'allergen');
  });
});
