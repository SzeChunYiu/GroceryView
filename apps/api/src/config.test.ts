import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEnvironment } from './config.js';

describe('validateEnvironment', () => {
  it('uses production defaults', () => {
    const env = validateEnvironment({ PORT: '4000' });
    assert.equal(env.NODE_ENV, 'development');
    assert.equal(env.PORT, '4000');
  });

  it('trims analytics consent token secret', () => {
    const env = validateEnvironment({ ANALYTICS_CONSENT_TOKEN_SECRET: '  secret  ' });
    assert.equal(env.ANALYTICS_CONSENT_TOKEN_SECRET, 'secret');
  });

  it('parses SCRAPER_DRY_RUN', () => {
    const env = validateEnvironment({ SCRAPER_DRY_RUN: 'true' });
    assert.equal(env.SCRAPER_DRY_RUN, true);
  });

  it('throws for invalid PORT', () => {
    assert.throws(() => {
      validateEnvironment({ PORT: '-1' });
    }, /PORT must be a positive integer/);
  });
});
