import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('homepage wires a branded launch skeleton to the static PWA manifest', async () => {
  const [pageSource, skeletonSource, manifestSource] = await Promise.all([
    readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/Skeleton.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../public/manifest.json', import.meta.url), 'utf8')
  ]);
  const manifest = JSON.parse(manifestSource);

  assert.match(pageSource, /import \{ Suspense \} from 'react';/);
  assert.match(pageSource, /fallback=\{<HomeLaunchSkeleton \/>\}/);
  assert.match(pageSource, /manifest: '\/manifest\.json'/);
  assert.match(skeletonSource, /GroceryView/);
  assert.match(skeletonSource, /aria-busy="true"/);
  assert.match(skeletonSource, /animate-pulse/);
  assert.equal(manifest.name, 'GroceryView verified grocery terminal');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, '#f5f1e8');
  assert.equal(manifest.theme_color, '#064e3b');
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'));
});
