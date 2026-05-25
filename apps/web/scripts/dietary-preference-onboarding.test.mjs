import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('account onboarding captures dietary restrictions, avoided ingredients, and certifications', async () => {
  const personalization = await read('src/lib/personalization.ts');
  const account = await read('src/app/account/page.tsx');
  const actions = await read('src/components/account-mutation-actions.tsx');

  assert.match(personalization, /dietaryPreferenceOnboardingContract/);
  assert.match(personalization, /dietaryRestrictions/);
  assert.match(personalization, /avoidedIngredients/);
  assert.match(personalization, /certificationPreferences/);
  assert.match(personalization, /health, religious, and lifestyle needs are never inferred/i);
  assert.match(personalization, /halal/);
  assert.match(personalization, /kosher/);

  assert.match(account, /dietaryPreferenceOnboardingContract/);
  assert.match(account, /Dietary onboarding/);
  assert.match(account, /Profile preferences captured during onboarding/);
  assert.match(account, /personalizationSurfaces/);

  assert.match(actions, /dietaryPreferenceOnboardingContract\.endpoint/);
  assert.match(actions, /Save dietary preferences/);
  assert.match(actions, /dietaryRestrictions/);
  assert.match(actions, /avoidedIngredients/);
  assert.match(actions, /certificationPreferences/);
  assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(actions, /No anonymous dietary profile/);
  assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
  assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
});
