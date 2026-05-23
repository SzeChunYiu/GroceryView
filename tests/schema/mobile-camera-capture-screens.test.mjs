import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

describe('mobile native camera capture screens', () => {
  it('uses Expo Camera for barcode and receipt capture routes with typed build coverage', () => {
    const pkg = JSON.parse(readFileSync('apps/mobile/package.json', 'utf8'));
    const buildTsconfig = JSON.parse(readFileSync('apps/mobile/tsconfig.build.json', 'utf8'));
    const testTsconfig = JSON.parse(readFileSync('apps/mobile/tsconfig.test.json', 'utf8'));
    const barcodeRoute = readFileSync('apps/mobile/app/scan/barcode.tsx', 'utf8');
    const receiptRoute = readFileSync('apps/mobile/app/scan/receipt.tsx', 'utf8');

    assert.ok(pkg.dependencies?.['expo-camera'], 'mobile package must declare expo-camera');
    assert.ok(existsSync('apps/mobile/src/native/MobileScanCaptureScreen.tsx'), 'native camera capture screen is missing');

    for (const config of [buildTsconfig, testTsconfig]) {
      assert.equal(config.compilerOptions.jsx, 'react-jsx');
      assert.ok(config.include.includes('src/**/*.tsx'), 'mobile TypeScript config must compile native TSX sources');
    }

    const cameraScreen = readFileSync('apps/mobile/src/native/MobileScanCaptureScreen.tsx', 'utf8');
    assert.match(cameraScreen, /from 'expo-camera'/);
    assert.match(cameraScreen, /CameraView/);
    assert.match(cameraScreen, /requestCameraPermissionsAsync/);
    assert.match(cameraScreen, /onBarcodeScanned/);
    assert.match(cameraScreen, /takePictureAsync/);
    assert.match(cameraScreen, /mode: 'barcode' \| 'receipt'/);
    assert.match(cameraScreen, /GroceryViewNativeScreen/);

    assert.match(barcodeRoute, /MobileScanCaptureScreen/);
    assert.match(barcodeRoute, /mode="barcode"/);
    assert.match(receiptRoute, /MobileScanCaptureScreen/);
    assert.match(receiptRoute, /mode="receipt"/);
  });
});
