import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = async (relative) => JSON.parse(await readFile(new URL(relative, root), 'utf8'));

function flattenKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) return flattenKeys(nested, path);
    return path;
  }).sort();
}

test('Norwegian Bokmål messages match Swedish shell message keys', async () => {
  const sv = await readJson('messages/sv.json');
  const nb = await readJson('messages/nb.json');

  assert.deepEqual(flattenKeys(nb), flattenKeys(sv));
  assert.equal(nb.nav.overview, 'Oversikt');
  assert.equal(nb.language.label, 'Språk');
  assert.match(nb.home.body, /verifisert kilde/);
  assert.doesNotMatch(JSON.stringify(nb), /Nynorsk|ikkje|frå|kvifor|kva/);
});

test('Norwegian Bokmål locale is wired as native-reviewed without currency conversion', async () => {
  const i18n = await readFile(new URL('src/lib/i18n.ts', root), 'utf8');
  const routing = await readFile(new URL('src/lib/i18n-routing.ts', root), 'utf8');
  const nbRoute = await readFile(new URL('src/app/nb/page.tsx', root), 'utf8');

  assert.match(i18n, /import nbMessages from '..\/..\/messages\/nb\.json'/);
  assert.match(i18n, /nb: nbMessages/);
  assert.match(i18n, /htmlLang: 'nb-NO'/);
  assert.match(i18n, /nativeLabel: 'Norsk bokmål'/);
  assert.match(i18n, /currency: 'SEK'/);
  assert.match(routing, /supportedLocales = \['sv', 'en', 'nb'\]/);
  assert.match(routing, /routedLocales = \['sv', 'en', 'nb'\]/);
  assert.match(nbRoute, /locale="nb"/);
  assert.deepEqual(new Intl.PluralRules('nb-NO').select(1), 'one');
  assert.deepEqual(new Intl.PluralRules('nb-NO').select(2), 'other');
});
