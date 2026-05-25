import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFile(join(root, path), 'utf8');

describe('affiliate outbound offer links', () => {
  it('discloses and tracks outbound offers with chain attribution and UTM parameters', async () => {
    const actions = await read('src/components/ad-disclosure-actions.tsx');
    const dealCard = await read('src/components/deal-card.tsx');
    const analytics = await read('src/lib/analytics.ts');

    assert.match(actions, /AffiliateDisclosureNotice/);
    assert.match(actions, /data-affiliate-chain/);
    assert.match(actions, /chain attribution/);
    assert.match(actions, /commissions never affect Deal Score/);

    assert.match(dealCard, /chainId\?: string/);
    assert.match(dealCard, /data-affiliate-chain/);
    assert.match(dealCard, /buildAffiliateOutboundUrl/);
    assert.match(dealCard, /trackAffiliateOutboundClick/);
    assert.match(dealCard, /rel="sponsored noopener noreferrer"/);

    assert.match(analytics, /AffiliateLinkMetadata/);
    assert.match(analytics, /chainId\?: string/);
    assert.match(analytics, /utm_source/);
    assert.match(analytics, /utm_medium/);
    assert.match(analytics, /utm_campaign/);
    assert.match(analytics, /utm_content/);
    assert.match(analytics, /gv_chain_id/);
    assert.match(analytics, /groceryview:affiliate-outbound-click/);
    assert.match(analytics, /affiliateOutboundEndpoint/);
  });
});
