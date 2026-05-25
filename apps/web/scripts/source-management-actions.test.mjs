import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('retailer source management actions', () => {
  it('wires source owner metadata, pause/resume/annotate controls, and runbook links into data sources', async () => {
    const [health, dataUi, page] = await Promise.all([
      read('src/lib/source-health.ts'),
      read('src/components/data-ui.tsx'),
      read('src/app/data-sources/page.tsx')
    ]);

    assert.match(health, /export type SourceManagementAction/);
    assert.match(health, /sourceManagementActions/);
    assert.match(health, /allowedActions: state === 'paused' \? \['resume', 'annotate'\] : \['pause', 'annotate'\]/);
    assert.match(health, /owner: 'Data Ops/);
    assert.match(health, /runbookUrl: '\/admin\/runbooks\//);
    assert.match(health, /sourceManagementSummary/);

    assert.match(dataUi, /export function SourceManagementActionsPanel/);
    assert.match(dataUi, /data-source-action="pause"/);
    assert.match(dataUi, /data-source-action="resume"/);
    assert.match(dataUi, /data-source-action="annotate"/);
    assert.match(dataUi, /href=\{source\.runbookUrl\}/);
    assert.match(dataUi, /Owner: \{source\.owner\}/);

    assert.match(page, /SourceManagementActionsPanel/);
    assert.match(page, /sourceManagementActions/);
    assert.match(page, /sourceManagementSummary/);
    assert.match(page, /Pause, resume, annotate, and route ownership/);
  });
});
