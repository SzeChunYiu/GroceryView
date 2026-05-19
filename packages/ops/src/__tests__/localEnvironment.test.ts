import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateLocalEnvironment } from '../index.js';

describe('local environment validation', () => {
  it('accepts the expected local infrastructure service URLs', () => {
    const report = validateLocalEnvironment({
      env: {
        DATABASE_URL: 'postgresql://groceryview:groceryview@localhost:5432/groceryview',
        REDIS_URL: 'redis://localhost:6379',
        S3_ENDPOINT: 'http://localhost:9000'
      }
    });

    assert.deepEqual(report, {
      status: 'ready',
      services: [
        {
          service: 'database',
          envVar: 'DATABASE_URL',
          url: 'postgresql://groceryview:groceryview@localhost:5432/groceryview',
          port: 5432,
          status: 'ready'
        },
        {
          service: 'redis',
          envVar: 'REDIS_URL',
          url: 'redis://localhost:6379',
          port: 6379,
          status: 'ready'
        },
        {
          service: 'object_storage',
          envVar: 'S3_ENDPOINT',
          url: 'http://localhost:9000',
          port: 9000,
          status: 'ready'
        }
      ],
      blockers: [],
      warnings: []
    });
  });

  it('fails closed for missing required variables and malformed service URLs', () => {
    const report = validateLocalEnvironment({
      env: {
        DATABASE_URL: 'not a url',
        S3_ENDPOINT: ''
      }
    });

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.blockers, ['invalid_url:DATABASE_URL', 'missing_env:REDIS_URL']);
    assert.deepEqual(report.warnings, ['optional_env_missing:S3_ENDPOINT']);
  });

  it('rejects protocols that point a service at the wrong dependency class', () => {
    const report = validateLocalEnvironment({
      env: {
        DATABASE_URL: 'http://localhost:5432',
        REDIS_URL: 'postgresql://localhost:6379'
      }
    });

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.blockers, ['invalid_protocol:DATABASE_URL', 'invalid_protocol:REDIS_URL']);
  });

  it('warns on non-default ports without blocking valid service URLs', () => {
    const report = validateLocalEnvironment({
      env: {
        DATABASE_URL: 'postgresql://localhost:15432/groceryview',
        REDIS_URL: 'redis://localhost:16379',
        S3_ENDPOINT: 'https://storage.local'
      }
    });

    assert.equal(report.status, 'ready');
    assert.deepEqual(report.warnings, [
      'non_default_port:DATABASE_URL:15432',
      'non_default_port:REDIS_URL:16379',
      'non_default_port:S3_ENDPOINT:443'
    ]);
  });
});
