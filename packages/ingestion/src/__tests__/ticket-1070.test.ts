import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

function collectTypeScriptFiles(dir: string): string[] {
  const fileNames = readdirSync(dir, { withFileTypes: true });
  const result: string[] = [];

  for (const entry of fileNames) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectTypeScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.ts')) {
      result.push(fullPath);
    }
  }

  return result;
}

const explicitAnnotation = /:\s*any\b/;
const explicitCast = /\bas\s+any\b/;

function assertNoAnyInContent(filePath: string, contents: string): void {
  assert.ok(!explicitAnnotation.test(contents), `${filePath} uses \`: any\``);
  assert.ok(!explicitCast.test(contents), `${filePath} uses \`as any\``);
}

describe('ticket #1070: normalize typing', () => {
  it('has no explicit any usage in src normalize entry file', () => {
    const normalizePath = path.join(SRC_DIR, 'normalize.ts');
    if (!existsSync(normalizePath)) {
      return;
    }

    const normalizeContents = readFileSync(normalizePath, 'utf8');
    assertNoAnyInContent(normalizePath, normalizeContents);
  });

  it('has no explicit any usage in ingestion source files', () => {
    for (const filePath of collectTypeScriptFiles(SRC_DIR)) {
      if (path.basename(filePath) === 'ticket-1070.test.ts') {
        continue;
      }
      const contents = readFileSync(filePath, 'utf8');
      assertNoAnyInContent(filePath, contents);
    }
  });
});
