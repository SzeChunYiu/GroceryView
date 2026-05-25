import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../prisma/migrations/20260525143000_create_scraper_runs/migration.sql', import.meta.url), 'utf8');
const adminPage = readFileSync(new URL('../../apps/web/src/app/admin/scrapers/page.tsx', import.meta.url), 'utf8');

describe('scraper run audit schema', () => {
  it('maps scraper_runs into Prisma with the health dashboard fields', () => {
    assert.match(schema, /model ScraperRun\b/);
    assert.match(schema, /retailerId\s+String\s+@map\("retailer_id"\)/);
    assert.match(schema, /startedAt\s+DateTime\s+@map\("started_at"\)\s+@db\.Timestamptz\(6\)/);
    assert.match(schema, /finishedAt\s+DateTime\?\s+@map\("finished_at"\)\s+@db\.Timestamptz\(6\)/);
    assert.match(schema, /itemsScraped\s+Int\s+@default\(0\)\s+@map\("items_scraped"\)/);
    assert.match(schema, /status\s+String/);
    assert.match(schema, /@@index\(\[retailerId, startedAt\]\)/);
    assert.match(schema, /@@index\(\[status, startedAt\]\)/);
    assert.match(schema, /@@map\("scraper_runs"\)/);
  });

  it('ships a SQL migration with nonnegative item counts and terminal status checks', () => {
    assert.match(migration, /create table if not exists scraper_runs/i);
    assert.match(migration, /retailer_id text not null/i);
    assert.match(migration, /started_at timestamptz not null/i);
    assert.match(migration, /finished_at timestamptz/i);
    assert.match(migration, /items_scraped integer not null default 0/i);
    assert.match(migration, /status text not null/i);
    assert.match(migration, /items_scraped >= 0/i);
    assert.match(migration, /status in \('running', 'succeeded', 'failed', 'partial'\)/i);
    assert.match(migration, /scraper_runs_retailer_started_at_idx/i);
    assert.match(migration, /scraper_runs_status_started_at_idx/i);
  });

  it('adds an admin scraper health dashboard shell for the audit table', () => {
    assert.match(adminPage, /Scraper run audit/);
    assert.match(adminPage, /scraper_runs table contract/);
    assert.match(adminPage, /retailer_id/);
    assert.match(adminPage, /started_at/);
    assert.match(adminPage, /finished_at/);
    assert.match(adminPage, /items_scraped/);
    assert.match(adminPage, /running/);
    assert.match(adminPage, /succeeded/);
    assert.match(adminPage, /partial/);
    assert.match(adminPage, /failed/);
    assert.match(adminPage, /static admin shell/);
  });
});
