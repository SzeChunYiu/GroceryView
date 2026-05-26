import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('crowd price submissions', () => {
  it('keeps account-gated price reports trust-scored and review-blocked before public use', () => {
    const route = readFileSync('apps/web/src/app/api/community-price-reports/route.ts', 'utf8');
    const verified = readFileSync('apps/web/src/lib/verified-data.ts', 'utf8');
    const page = readFileSync('apps/web/src/app/price-reports/page.tsx', 'utf8');

    assert.match(route, /x-groceryview-user-id/);
    assert.match(route, /photoEvidence/);
    assert.match(route, /reportedPrice/);
    assert.match(route, /planCommunityReportAbuseControls/);
    assert.match(route, /outlierCheck/);
    assert.match(route, /queued_for_human_review/);
    assert.match(route, /publicDisplay:\s*false/);
    assert.match(route, /accept_community_report/);

    assert.match(verified, /scoringPipeline/);
    assert.match(verified, /outlierChecks/);
    assert.match(verified, /\/api\/community-price-reports/);
    assert.match(verified, /community_report raw_records/);

    assert.match(page, /Scoring pipeline/);
    assert.match(page, /Outlier checks/);
    assert.match(page, /crowdPriceSubmissionContract/);
  });
});
