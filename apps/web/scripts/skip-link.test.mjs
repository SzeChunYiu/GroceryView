import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('root layout renders a skip-to-content link before app content', async () => {
  const layout = await read('src/app/layout.tsx');
  const skipLink = await read('src/components/SkipLink.tsx');
  const a11yCss = await read('src/styles/a11y.css');

  assert.match(layout, /import \{ SkipLink \} from '@\/components\/SkipLink';/);
  assert.match(layout, /import '\.\.\/styles\/a11y\.css';/);
  assert.match(layout, /<body>[\s\S]*<SkipLink \/>[\s\S]*<div id="main-content" tabIndex=\{-1\}>/);

  assert.match(skipLink, /href="#main-content"/);
  assert.match(skipLink, /Skip to main content/);
  assert.match(skipLink, /document\.querySelector<HTMLElement>\('main'\)/);
  assert.match(skipLink, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(skipLink, /console\./);

  assert.match(a11yCss, /\.skip-link \{/);
  assert.match(a11yCss, /position: fixed;/);
  assert.match(a11yCss, /transform: translateY\(calc\(-100% - 1\.5rem\)\);/);
  assert.match(a11yCss, /\.skip-link:focus-visible/);
  assert.match(a11yCss, /transform: translateY\(0\);/);
});
