import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const compose = readFileSync(new URL('../../infra/docker-compose.yml', import.meta.url), 'utf8');
const envExample = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8');
const gitignore = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8');

describe('local infrastructure compose stack', () => {
  it('declares the required local services and ports', () => {
    for (const phrase of [
      'postgres:',
      'image: postgis/postgis:18-3.6',
      '"5432:5432"',
      'redis:',
      'image: redis:7-alpine',
      '"6379:6379"',
      'object-storage:',
      'image: minio/minio:latest',
      '"9000:9000"',
      'pgadmin:',
      'image: dpage/pgadmin4:latest',
      '"5050:80"'
    ]) {
      assert.match(compose, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  it('documents the application connection strings and S3-compatible storage env', () => {
    for (const key of [
      'DATABASE_URL=',
      'REDIS_URL=',
      'S3_ENDPOINT=',
      'S3_BUCKET=',
      'S3_ACCESS_KEY_ID=',
      'S3_SECRET_ACCESS_KEY='
    ]) {
      assert.match(envExample, new RegExp(`^${key}`, 'm'));
    }
  });

  it('keeps real env files local while allowing the template to be committed', () => {
    assert.match(gitignore, /^\.env$/m);
    assert.match(gitignore, /^\.env\.\*$/m);
    assert.match(gitignore, /^!\.env\.example$/m);
  });
});
