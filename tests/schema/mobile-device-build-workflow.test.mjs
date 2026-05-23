import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/mobile-device-build.yml', import.meta.url), 'utf8');

describe('mobile device build workflow', () => {
  it('runs verified Expo/EAS store builds only with production credentials', () => {
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /platform:/);
    assert.match(workflow, /ios/);
    assert.match(workflow, /android/);
    assert.match(workflow, /environment:\s*production/);
    assert.match(workflow, /timeout-minutes:\s*60/);

    for (const requiredSecret of ['EXPO_TOKEN']) {
      assert.match(workflow, new RegExp(`missing production config: ${requiredSecret}`));
    }

    for (const command of [
      'npm ci',
      'npm run test -w @groceryview/mobile',
      'npm run build -w @groceryview/mobile',
      'npx eas-cli build --profile production --non-interactive --no-wait --platform'
    ]) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+')));
    }

    assert.match(workflow, /EXPO_TOKEN:\s*\$\{\{ secrets\.EXPO_TOKEN \}\}/);
    assert.match(workflow, /working-directory:\s*apps\/mobile/);
    assert.match(workflow, /apps\/mobile\/app\.config\.json/);
    assert.match(workflow, /apps\/mobile\/eas\.json/);
  });
});
