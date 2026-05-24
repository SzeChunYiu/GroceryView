import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const supportedCountries = ['SE', 'NO', 'IS'];

describe('Nordic CI fixture setup', () => {
  it('loads the country fixture selected by CI for country-scoped tests', async () => {
    const country = process.env.GROCERYVIEW_TEST_COUNTRY || 'SE';
    assert.ok(supportedCountries.includes(country), `unsupported Nordic test country: ${country}`);

    const fixturePath = process.env.GROCERYVIEW_TEST_FIXTURE || `tests/fixtures/nordic/${country}.json`;
    const fixture = JSON.parse(await readFile(new URL(`../../${fixturePath}`, import.meta.url), 'utf8'));

    assert.equal(fixture.country, country);
    assert.match(fixture.locale, /^[a-z]{2}-[A-Z]{2}$/);
    assert.match(fixture.currency, /^[A-Z]{3}$/);
    assert.match(fixture.baseUrl, new RegExp(`\\.${country.toLowerCase()}$`));
  });
});
