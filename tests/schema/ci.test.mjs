import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
const rootPackage = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
const ingestionPackage = readFileSync(new URL('../../packages/ingestion/package.json', import.meta.url), 'utf8');
const countryFixtureTests = {
  SE: readFileSync(new URL('../../packages/ingestion/src/__tests__/ingestion.test.ts', import.meta.url), 'utf8'),
  NO: readFileSync(new URL('../../packages/ingestion/src/connectors/__tests__/meny-no.test.ts', import.meta.url), 'utf8'),
  IS: readFileSync(new URL('../../packages/ingestion/src/connectors/__tests__/bonus-is.test.ts', import.meta.url), 'utf8')
};

describe('CI workflow', () => {
  it('runs install, test, build, and typecheck on pull requests and main pushes', () => {
    assert.match(workflow, /pull_request:/);
    assert.match(workflow, /push:/);
    assert.match(workflow, /branches:\s*\[main\]/);
    for (const command of ['npm ci', 'npm run test -w', 'npm run build -w', 'npm run typecheck']) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+')));
    }
    assert.match(workflow, /package-verify:/);
    assert.match(workflow, /market-fixtures:/);
    assert.match(workflow, /market:\s*\[SE, NO, IS\]/);
    assert.match(workflow, /GROCERYVIEW_CI_FIXTURE_COUNTRIES:\s*\$\{\{ matrix\.market \}\}/);
  });

  it('keeps country-scoped fixture tests wired into the CI test command', () => {
    assert.match(rootPackage, /npm run test -w @groceryview\/ingestion/);
    assert.match(rootPackage, /node --test tests\/schema\/\*\.test\.mjs/);
    assert.match(ingestionPackage, /find dist-test -name '\*\.test\.js'/);
    assert.match(ingestionPackage, /node --test \$\(find dist-test -name '\*\.test\.js' -print \| sort\)/);

    assert.match(countryFixtureTests.SE, /countryCode: ['"]SE['"]/);
    assert.match(countryFixtureTests.SE, /describe\('ICA connector fixture parsing'/);
    assert.match(countryFixtureTests.NO, /country: ['"]NO['"]/);
    assert.match(countryFixtureTests.NO, /describe\('Meny Norway connector fixture parsing'/);
    assert.match(countryFixtureTests.IS, /BONUS_IS_STORE_BASE_URL/);
    assert.match(countryFixtureTests.IS, /describe\('Bónus IS connector fixture parsing'/);
  });
});
