import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('single-portion deal finder contract', () => {
  it('keeps one-person deal logic source-backed and explicit about waste assumptions', async () => {
    const source = await read('src/lib/single-portion-deals.ts');

    assert.match(source, /buildSinglePortionDealFinder/);
    assert.match(source, /packageEvidenceFromText/);
    assert.match(source, /perServingCostLabel/);
    assert.match(source, /wasteRiskLabel/);
    assert.match(source, /cheaperAlternative/);
    assert.match(source, /per-serving assumes/);
    assert.match(source, /does not infer household appetite or live stock/);
    assert.match(source, /candidate\.servingCount <= maxServings && candidate\.wasteRisk !== 'high'/);
    assert.match(source, /costDelta/);
    assert.match(source, /servingDelta/);
  });

  it('surfaces student and young-single deals on the visible deals route', async () => {
    const dealsPage = await read('src/app/deals/page.tsx');

    assert.match(dealsPage, /buildSinglePortionDealFinder/);
    assert.match(dealsPage, /Students \/ young singles/);
    assert.match(dealsPage, /Small-portion deals with waste checks/);
    assert.match(dealsPage, /data-single-portion-deal-finder/);
    assert.match(dealsPage, /per-serving cost/);
    assert.match(dealsPage, /Cheaper alternative/);
    assert.match(dealsPage, /Bulk-only deals stay out unless the serving and storage assumptions are visible/);
  });
});
