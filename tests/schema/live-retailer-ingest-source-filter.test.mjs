import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../../scripts/ingestion/generate-live-retailer-ingested.mjs', import.meta.url), 'utf8');

describe('source-filtered live retailer generator', () => {
  it('supports willys,hemkop partial refresh without db-site override churn', () => {
    assert.match(script, /GROCERYVIEW_INGEST_SOURCES/);
    assert.match(script, /const shouldRun = \(source\) => requestedSources\.size === 0 \|\| requestedSources\.has\(source\)/);
    assert.match(script, /const dbSiteOverrideSources = \['citygross', 'willys', 'hemkop', 'lidl'\]/);
    assert.match(script, /dbSiteOverrideSources\.every\(\(source\) => requestedSources\.has\(source\)\)/);
    assert.match(script, /if \(shouldWriteDbSiteOverrides\) \{/);
  });

  it('normalizes generated files to exactly one trailing newline', () => {
    assert.match(script, /function withSingleTrailingNewline\(value\)/);
    assert.match(script, /value\.replace\(\/\\n\+\$\/u, ''\)/);
    assert.match(script, /writeGeneratedFile[\s\S]*withSingleTrailingNewline\(lines\.join\('\\n'\)\)/);
    assert.match(script, /writeDbSiteIngestedOverrides[\s\S]*withSingleTrailingNewline\(/);
  });
});
