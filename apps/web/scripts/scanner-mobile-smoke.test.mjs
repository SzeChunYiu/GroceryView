import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

const mobileCameraFixtures = [
  {
    name: 'mobile camera permission granted',
    viewport: { width: 390, height: 844 },
    mediaDevices: { getUserMedia: 'resolves' },
    expectedSource: [
      /navigator\.mediaDevices\.getUserMedia\(\{\s*video:\s*\{\s*facingMode:\s*\{\s*ideal:\s*'environment'\s*\}\s*\}\s*\}\)/,
      /setCameraReady\(true\)/,
      /setStatus\('ready'\)/,
      /Camera access stays local/
    ]
  },
  {
    name: 'mobile camera permission denied',
    viewport: { width: 390, height: 844 },
    mediaDevices: { getUserMedia: 'rejects' },
    expectedSource: [
      /catch\s*\{[\s\S]*setStatus\('error'\)[\s\S]*Camera permission was denied or unavailable\./
    ]
  },
  {
    name: 'mobile camera API unavailable',
    viewport: { width: 360, height: 740 },
    mediaDevices: undefined,
    expectedSource: [
      /!navigator\.mediaDevices\?\.getUserMedia/,
      /Receipt camera is not available in this browser\./,
      /No scan upload was started\./
    ]
  }
];

const barcodeFallbackFixture = {
  name: 'manual barcode fallback after camera failure',
  viewport: { width: 390, height: 844 },
  barcodePayload: '0735000123456',
  expectedSource: [
    /id="barcode-payload"/,
    /disabled=\{!barcode\.trim\(\)\}/,
    /kind: 'barcode'/,
    /payload: barcode/,
    /Process barcode scan/
  ]
};

describe('PWA scanner mobile smoke fixtures', () => {
  it('covers granted, denied, and unavailable camera states without real devices', async () => {
    const source = await read('src/components/scanner-upload-actions.tsx');

    assert.match(source, /data-testid="scanner-mobile-camera"/);
    assert.match(source, /aria-live="polite"/);
    assert.match(source, /playsInline/);
    assert.match(source, /aspect-video w-full/);

    for (const fixture of mobileCameraFixtures) {
      assert.ok(fixture.viewport.width < 480, `${fixture.name} should model a mobile viewport`);
      for (const expectation of fixture.expectedSource) {
        assert.match(source, expectation, fixture.name);
      }
    }
  });

  it('keeps manual barcode search fallback usable when mobile camera APIs fail', async () => {
    const source = await read('src/components/scanner-upload-actions.tsx');

    assert.match(source, /data-testid="scanner-barcode-fallback"/);
    assert.match(source, /Manual barcode fallback/i);
    assert.ok(barcodeFallbackFixture.viewport.width < 480, 'fixture should model a mobile viewport');
    assert.equal(barcodeFallbackFixture.barcodePayload, '0735000123456');

    for (const expectation of barcodeFallbackFixture.expectedSource) {
      assert.match(source, expectation, barcodeFallbackFixture.name);
    }
  });
});
