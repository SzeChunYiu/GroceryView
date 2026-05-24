import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEnvironment } from '../src/config/env.schema.js';

describe('validateEnvironment', () => {
  it('accepts absent CORS_ALLOWED_ORIGINS', () => {
    const env = validateEnvironment({ NODE_ENV: 'test' });

    assert.equal(env.CORS_ALLOWED_ORIGINS, undefined);
  });

  it('parses CORS_ALLOWED_ORIGINS as comma-separated origins', () => {
    const env = validateEnvironment({
      NODE_ENV: 'test',
      CORS_ALLOWED_ORIGINS: 'https://app.example.test, https://admin.example.test,https://partner.example.test'
    });

    assert.deepEqual(env.CORS_ALLOWED_ORIGINS, [
      'https://app.example.test',
      'https://admin.example.test',
      'https://partner.example.test'
    ]);
  });

  it('trims whitespace and drops empty entries in CORS_ALLOWED_ORIGINS', () => {
    const env = validateEnvironment({
      NODE_ENV: 'test',
      CORS_ALLOWED_ORIGINS: ' https://app.example.test , , https://admin.example.test '
    });

    assert.deepEqual(env.CORS_ALLOWED_ORIGINS, ['https://app.example.test', 'https://admin.example.test']);
  });

  it('throws when CORS_ALLOWED_ORIGINS is not a string', () => {
    assert.throws(
      () => {
        validateEnvironment({
          NODE_ENV: 'test',
          CORS_ALLOWED_ORIGINS: ['https://invalid.example.test'] as unknown
        });
      },
      {
        message: 'CORS_ALLOWED_ORIGINS must be a comma-separated list of origins.'
      }
    );
  });
});

