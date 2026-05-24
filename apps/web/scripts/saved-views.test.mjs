import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('saved view UX contract', () => {
  it('ships a client saved-view control with local guest persistence and alert handoff', async () => {
    const [component, shared] = await Promise.all([
      read('src/components/saved-view-actions.tsx'),
      read('src/lib/saved-views.ts')
    ]);

    assert.match(component, /'use client'/);
    assert.match(shared, /SAVED_VIEWS_STORAGE_KEY = 'groceryview:saved-views:v1'/);
    assert.match(shared, /'map', 'deals', 'screener', 'categories', 'compare'/);
    assert.match(component, /window\.localStorage\.getItem\(SAVED_VIEWS_STORAGE_KEY\)/);
    assert.match(component, /window\.localStorage\.setItem\(SAVED_VIEWS_STORAGE_KEY/);
    assert.match(component, /Save current view/);
    assert.match(component, /View saved/);
    assert.match(component, /Create alert from view/);
    assert.match(component, /from_saved_view/);
    assert.match(component, /Alerts not applicable/);
    assert.match(component, /account persistence/i);
  });

  it('mounts saved views on map, deals, screener, categories, and compare surfaces', async () => {
    const pages = new Map([
      ['map', await read('src/app/map/page.tsx')],
      ['deals', await read('src/app/deals/page.tsx')],
      ['screener', await read('src/app/screener/page.tsx')],
      ['categories', await read('src/app/categories/page.tsx')],
      ['compare', await read('src/app/compare/page.tsx')]
    ]);

    for (const [surface, source] of pages) {
      assert.match(source, /SavedViewActions/);
      assert.match(source, new RegExp(`surface="${surface}"`));
    }
    assert.doesNotMatch(pages.get('map'), /alertEligible/);
    assert.match(pages.get('deals'), /alertEligible/);
    assert.match(pages.get('screener'), /alertEligible/);
    assert.match(pages.get('categories'), /alertEligible/);
    assert.match(pages.get('compare'), /alertEligible/);
  });

  it('adds an account saved-view API contract that refuses anonymous account persistence', async () => {
    const route = await read('src/app/api/saved-views/route.ts');

    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /export const dynamic = 'force-dynamic'/);
    assert.match(route, /authentication_required/);
    assert.match(route, /guestFallbackKey: SAVED_VIEWS_STORAGE_KEY/);
    assert.match(route, /Cache-Control': 'no-store'/);
    assert.match(route, /hasBearerToken/);
    assert.match(route, /validateSavedViewPayload/);
    assert.match(route, /url\.startsWith\('\/'\)/);
    assert.match(route, /SUPPORTED_SURFACES/);
    assert.match(route, /status: 202/);
  });
});
