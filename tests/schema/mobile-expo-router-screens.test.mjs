import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

const routeFiles = [
  ['apps/mobile/app/_layout.tsx', 'Stack'],
  ['apps/mobile/app/today.tsx', 'TodayScreen'],
  ['apps/mobile/app/stores.tsx', 'StoresScreen'],
  ['apps/mobile/app/watchlist.tsx', 'WatchlistScreen'],
  ['apps/mobile/app/search.tsx', 'SearchScreen'],
  ['apps/mobile/app/products/[id].tsx', 'ProductScreen'],
  ['apps/mobile/app/products/[id]/terminal.tsx', 'ProductPriceTerminalScreen'],
  ['apps/mobile/app/basket.tsx', 'BasketScreen'],
  ['apps/mobile/app/budget.tsx', 'BudgetScreen'],
  ['apps/mobile/app/scan/barcode.tsx', 'BarcodeScanScreen'],
  ['apps/mobile/app/scan/receipt.tsx', 'ReceiptScanScreen'],
  ['apps/mobile/app/profile.tsx', 'ProfileScreen'],
  ['apps/mobile/app/household.tsx', 'HouseholdScreen'],
  ['apps/mobile/app/privacy.tsx', 'PrivacyScreen'],
  ['apps/mobile/app/review-queue.tsx', 'HumanReviewQueueScreen']
];

describe('mobile Expo Router screens', () => {
  it('ships native Expo route files for every authenticated MVP screen', () => {
    const pkg = JSON.parse(readFileSync('apps/mobile/package.json', 'utf8'));
    for (const dependency of ['expo', 'expo-router', 'react', 'react-native']) {
      assert.ok(pkg.dependencies?.[dependency], `apps/mobile/package.json must declare ${dependency}`);
    }

    assert.ok(existsSync('apps/mobile/src/native/GroceryViewNativeScreen.tsx'), 'shared native screen renderer is missing');
    const renderer = readFileSync('apps/mobile/src/native/GroceryViewNativeScreen.tsx', 'utf8');
    assert.match(renderer, /from 'react-native'/);
    assert.match(renderer, /buildMobileScreenBlueprints/);
    assert.match(renderer, /accessibilityRole="button"/);

    for (const [file, screen] of routeFiles) {
      assert.ok(existsSync(file), `${file} is missing`);
      const source = readFileSync(file, 'utf8');
      if (file.endsWith('_layout.tsx')) {
        assert.match(source, /from 'expo-router'/);
        assert.match(source, /<Stack/);
      } else {
        assert.match(source, /GroceryViewNativeScreen/);
        assert.match(source, new RegExp(`screenName="${screen}"`));
      }
    }
  });
});
