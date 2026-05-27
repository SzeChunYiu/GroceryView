import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const component = await readFile(new URL('../src/components/data-state-panel.tsx', import.meta.url), 'utf8');
const story = await readFile(new URL('../src/components/data-state-panel.stories.tsx', import.meta.url), 'utf8');

const requiredStates = ['no-coverage', 'partial-coverage', 'stale-source', 'connector-failure', 'loading', 'blocked-permissions'];
const requiredActions = ['Change market', 'Choose another chain', 'Request alert', 'See methodology'];

test('DataStatePanel defines actionable missing-data states and visual examples', () => {
  for (const state of requiredStates) {
    assert.match(component, new RegExp(`'${state}'|${state}:`), `missing ${state} state`);
    assert.match(story, /dataStateKinds\.map/, 'story must render every state');
  }

  for (const action of requiredActions) {
    assert.match(component, new RegExp(action), `missing ${action} action`);
  }

  assert.match(component, /data-ui-state/);
  assert.match(component, /aria-busy=\{kind === 'loading'\}/);
  assert.match(component, /Source: \{sourceLabel\}/);
  assert.match(component, /Confidence: \{confidenceLabel\}/);
  assert.match(component, /Freshness: \{freshnessLabel\}/);
});
