import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const compose = readFileSync(new URL('../../../../infra/docker-compose.yml', import.meta.url), 'utf8');
const envExample = readFileSync(new URL('../../../../.env.example', import.meta.url), 'utf8');
const infraReadme = readFileSync(new URL('../../../../infra/README.md', import.meta.url), 'utf8');
const smokeScript = readFileSync(new URL('../../../../infra/scripts/smoke-local-services.sh', import.meta.url), 'utf8');
const smokeWorkflow = readFileSync(new URL('../../../../.github/workflows/local-infra-smoke.yml', import.meta.url), 'utf8');

describe('local infrastructure compose', () => {
  it('defines the required development backing services and ports', () => {
    assert.match(compose, /postgres:\n\s+image: postgis\/postgis:18-3\.6/);
    assert.match(compose, /redis:\n\s+image: redis:7-alpine/);
    assert.match(compose, /pgadmin:\n\s+image: dpage\/pgadmin4:latest/);
    assert.match(compose, /object-storage:\n\s+image: minio\/minio:latest/);
    assert.match(compose, /object-storage-init:\n\s+image: minio\/mc:latest/);
    assert.match(compose, /"5432:5432"/);
    assert.match(compose, /"6379:6379"/);
    assert.match(compose, /"5050:80"/);
    assert.match(compose, /"9000:9000"/);
    assert.match(compose, /postgres-data:\/var\/lib\/postgresql/);
    assert.doesNotMatch(compose, /postgres-data:\/var\/lib\/postgresql\/data/);
    assert.match(compose, /http:\/\/localhost:9000\/minio\/health\/live/);
  });

  it('documents connection URLs and S3-compatible object storage settings', () => {
    assert.match(envExample, /^DATABASE_URL=postgresql:\/\/groceryview:groceryview@localhost:5432\/groceryview$/m);
    assert.match(envExample, /^REDIS_URL=redis:\/\/localhost:6379$/m);
    assert.match(envExample, /^S3_ENDPOINT=http:\/\/localhost:9000$/m);
    assert.match(envExample, /^S3_BUCKET=groceryview-raw$/m);
    assert.match(envExample, /^S3_ACCESS_KEY_ID=groceryview$/m);
  });

  it('ships a smoke script for the local development stack', () => {
    assert.match(smokeScript, /docker compose -f "\$COMPOSE_FILE"/);
    assert.match(smokeScript, /compose up -d "\$POSTGRES_SERVICE" "\$REDIS_SERVICE" "\$OBJECT_STORAGE_SERVICE" "\$OBJECT_STORAGE_INIT_SERVICE"/);
    assert.match(smokeScript, /pg_isready -U "\$POSTGRES_USER" -d "\$POSTGRES_DB"/);
    assert.match(smokeScript, /redis-cli ping/);
    assert.match(smokeScript, /mc ls "local\/\$S3_BUCKET"/);
    assert.match(smokeScript, /print_service_diagnostics\(\)/);
    assert.match(smokeScript, /infra\/README\.md#smoke-troubleshooting/);
    assert.match(smokeScript, /docker inspect[\s\S]*health=/);
    assert.match(smokeScript, /compose logs --no-color --tail=120 "\$service"/);
    assert.match(smokeScript, /"\$POSTGRES_SERVICE" "\$REDIS_SERVICE" "\$OBJECT_STORAGE_SERVICE" "\$OBJECT_STORAGE_INIT_SERVICE"/);
  });

  it('runs the local services smoke check in CI for infra changes', () => {
    assert.match(smokeWorkflow, /name: Local infrastructure smoke/);
    assert.match(smokeWorkflow, /pull_request:/);
    assert.match(smokeWorkflow, /infra\/scripts\/smoke-local-services\.sh/);
    assert.match(smokeWorkflow, /docker compose -f infra\/docker-compose\.yml down -v --remove-orphans/);
  });

  it('documents smoke troubleshooting fixes for common local failures', () => {
    assert.match(infraReadme, /## Smoke troubleshooting/);
    assert.match(infraReadme, /### Missing Docker/);
    assert.match(infraReadme, /docker compose version/);
    assert.match(infraReadme, /### PostgreSQL 18 volume mount/);
    assert.match(infraReadme, /\/var\/lib\/postgresql\/data/);
    assert.match(infraReadme, /docker compose -f infra\/docker-compose\.yml down -v/);
    assert.match(infraReadme, /### MinIO bucket initialization/);
    assert.match(infraReadme, /object-storage-init/);
    assert.match(infraReadme, /S3_BUCKET/);
  });
});
