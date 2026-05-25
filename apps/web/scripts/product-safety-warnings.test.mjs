import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('product cards surface allergen and dietary preference warnings from OpenFoodFacts evidence', async () => {
  const cards = await read('src/components/product-price-cards.tsx');
  const certFilter = await read('src/components/cert-filter.tsx');
  const verified = await read('src/lib/verified-data.ts');
  const catalog = await read('src/lib/openfoodfacts-catalog.ts');

  assert.match(catalog, /export type DietarySafetyPreference = /);
  assert.match(catalog, /export type AllergenSafetyPreference = /);
  assert.match(catalog, /export function openFoodFactsSafetyProfile/);
  assert.match(catalog, /dietaryTags/);
  assert.match(catalog, /allergenTags/);

  assert.match(verified, /openFoodFactsSafetyProfile/);
  assert.match(verified, /safetyProfile: OpenFoodFactsSafetyProfile/);
  assert.match(verified, /safetyProfileForProduct/);
  assert.match(verified, /safetyEvidenceLabel/);

  assert.match(certFilter, /SAFETY_PREFERENCES_STORAGE_KEY/);
  assert.match(certFilter, /SAFETY_PREFERENCES_CHANGED_EVENT/);
  assert.match(certFilter, /readStoredSafetyPreferences/);
  assert.match(certFilter, /Dietary safety preferences/);
  assert.match(certFilter, /Allergen avoidance preferences/);

  assert.match(cards, /readStoredSafetyPreferences/);
  assert.match(cards, /SAFETY_PREFERENCES_CHANGED_EVENT/);
  assert.match(cards, /safetyWarnings/);
  assert.match(cards, /Safety preference warning/);
  assert.match(cards, /role="alert"/);
  assert.match(cards, /Contains \$\{tag\} evidence/);
  assert.match(cards, /Missing \$\{tag\} evidence/);
});
