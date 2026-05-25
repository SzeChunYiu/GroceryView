import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MATTILSYNET_RECALLS_NO_FEED_URL,
  classifyMattilsynetRecallHazard,
  fetchMattilsynetFoodSafetyAlerts,
  parseMattilsynetFoodSafetyAlerts
} from '../mattilsynet-recalls-no.js';

const FEED_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:nl="https://support.make.as/nb/articles/21122-design-av-rss-rader" version="2.0">
  <channel>
    <title>Subscription</title>
    <item>
      <title><![CDATA[Coop Norge tilbakekaller Coop Sandwich 12 stk. på grunn av fare for metallbiter]]></title>
      <description><![CDATA[Coop Norge tilbakekaller Coop Sandwich 12 stk. på grunn av fare for metallbiter i produktet.]]></description>
      <pubDate>Fri, 22 May 2026 00:00:00 +0200</pubDate>
      <category>all</category>
      <category>mat</category>
      <category>mat/smitte-fra-mat-og-drikke</category>
      <link>https://www.mattilsynet.no/tilbakekallinger/coop-norge-tilbakekaller-coop-sandwich-12-stk.pa-grunn-av-fare-for-metallbiter</link>
      <guid isPermaLink="false">https://www.mattilsynet.no/tilbakekallinger/coop-norge-tilbakekaller-coop-sandwich-12-stk.pa-grunn-av-fare-for-metallbiter</guid>
      <nl:extra1>Tilbakekalling</nl:extra1>
    </item>
    <item>
      <title><![CDATA[Høring om næringsmidler til særskilte grupper]]></title>
      <description><![CDATA[Dette er ikke en tilbakekalling.]]></description>
      <pubDate>Thu, 21 May 2026 14:24:02 +0200</pubDate>
      <category>mat</category>
      <link>https://hoering.mattilsynet.no/hoering/3885</link>
      <guid>https://hoering.mattilsynet.no/hoering/3885</guid>
      <nl:extra1>Regelverksutvikling</nl:extra1>
    </item>
    <item>
      <title><![CDATA[Dyrefôr tilbakekalles]]></title>
      <description><![CDATA[Ikke en mat-rad for GroceryView.]]></description>
      <pubDate>Wed, 20 May 2026 10:00:00 +0200</pubDate>
      <category>dyr</category>
      <link>https://www.mattilsynet.no/tilbakekallinger/dyrefor-tilbakekalles</link>
      <guid>dyrefor</guid>
      <nl:extra1>Tilbakekalling</nl:extra1>
    </item>
  </channel>
</rss>`;

describe('Mattilsynet Norway recall feed connector', () => {
  it('parses Mattilsynet RSS recall items into food_safety_alert rows', () => {
    const rows = parseMattilsynetFoodSafetyAlerts(FEED_FIXTURE, '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 1);
    assert.equal(rows[0].country, 'NO');
    assert.equal(rows[0].authority, 'Mattilsynet');
    assert.equal(rows[0].kind, 'food_safety_alert');
    assert.equal(rows[0].title, 'Coop Norge tilbakekaller Coop Sandwich 12 stk. på grunn av fare for metallbiter');
    assert.equal(rows[0].hazard, 'foreign_body');
    assert.equal(rows[0].publishedAt, '2026-05-21T22:00:00.000Z');
    assert.deepEqual(rows[0].categories, ['all', 'mat', 'mat/smitte-fra-mat-og-drikke']);
    assert.equal(rows[0].sourceUrl, 'https://www.mattilsynet.no/tilbakekallinger/coop-norge-tilbakekaller-coop-sandwich-12-stk.pa-grunn-av-fare-for-metallbiter');
    assert.equal(rows[0].retrievedAt, '2026-05-25T00:00:00.000Z');
  });

  it('fetches the current Mattilsynet RSS endpoint and honors maxRows', async () => {
    const rows = await fetchMattilsynetFoodSafetyAlerts({
      retrievedAt: '2026-05-25T00:00:00.000Z',
      maxRows: 1,
      fetchImpl: async (url, init) => {
        assert.equal(url, MATTILSYNET_RECALLS_NO_FEED_URL);
        assert.equal(init?.headers && typeof init.headers === 'object' && 'accept' in init.headers, true);
        return new Response(FEED_FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].alertId, 'mattilsynet-no-https-www-mattilsynet-no-tilbakekallinger-coop-norge-tilbakekaller-coop-sandwich-12-stk-pa-grunn-av-fare-for-metallbiter');
  });

  it('classifies common Mattilsynet food-safety hazards', () => {
    assert.equal(classifyMattilsynetRecallHazard('fare for metallbiter'), 'foreign_body');
    assert.equal(classifyMattilsynetRecallHazard('mistanke om listeria'), 'microbiological');
    assert.equal(classifyMattilsynetRecallHazard('funn av plantevernmidler'), 'pesticide');
    assert.equal(classifyMattilsynetRecallHazard('inneholder melk som ikke er deklarert'), 'allergen');
  });
});
