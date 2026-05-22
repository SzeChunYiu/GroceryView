import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const apiPath = new URL('../../api/[...path].mjs', import.meta.url);
const vercelConfigPath = new URL('../../vercel.json', import.meta.url);

describe('Vercel server runtime wrapper', () => {
  it('deploys the GroceryView server handler as /api/* from the monorepo root', () => {
    assert.equal(existsSync(apiPath), true);
    assert.equal(existsSync(vercelConfigPath), true);

    const api = readFileSync(apiPath, 'utf8');
    assert.match(api, /createRuntimeHttpHandler/);
    assert.match(api, /handleNodeHttpRequest/);
    assert.match(api, /packages\/server\/dist\/index\.js/);

    const config = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
    assert.equal(config.buildCommand, 'npm run build -w @groceryview/server');
    assert.equal(config.installCommand, 'npm ci');
    assert.equal(config.framework, null);
    assert.equal(config.outputDirectory, '.');
    assert.deepEqual(config.rewrites, [{ source: '/api/:path*', destination: '/api/[...path]' }]);
  });
});
