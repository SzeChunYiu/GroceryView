import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('groceryview:accessToken', 'e2e-token');
    sessionStorage.setItem('groceryview:userId', 'e2e-user');

    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { configurable: true, get: () => 640 });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { configurable: true, get: () => 480 });
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback: BlobCallback, type?: string) {
      callback(new Blob(['receipt-photo'], { type: type || 'image/jpeg' }));
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => new MediaStream()
      }
    });
  });
});

test('uploads a receipt, processes OCR matches, and renders purchase history', async ({ page }) => {
  const requests: string[] = [];
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    if (request.method() === 'PUT' && url === 'https://uploads.groceryview.test/receipt.jpg') {
      requests.push('upload');
      await route.fulfill({ status: 200, body: '' });
      return;
    }
    if (url.includes('/api/scans/upload-url')) {
      requests.push('ticket');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            status: 'ready',
            ticket: {
              scanId: 'receipt-e2e',
              uploadUrl: 'https://uploads.groceryview.test/receipt.jpg',
              payloadUri: 'gs://receipts/e2e/receipt.jpg',
              headers: { 'content-type': 'image/jpeg' }
            }
          }
        })
      });
      return;
    }
    if (url.includes('/api/scans/process')) {
      requests.push('process');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: { status: 'processed', kind: 'receipt', totalAmount: 57.8, confidence: 0.94 },
          purchaseHistory: [
            { productId: 'canonical-oatly-milk', name: 'Oatly iKaffe 1L', quantity: 1, totalAmount: 24.9 },
            { productId: 'canonical-banana-se', name: 'Bananer', quantity: 1.2, totalAmount: 32.9 }
          ]
        })
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/scanner');
  await page.getByRole('button', { name: 'Start receipt camera' }).click();
  await expect(page.getByText('Camera access stays local')).toBeVisible();

  await page.getByRole('button', { name: 'Submit receipt image' }).click();

  await expect(page.getByText(/OCR parsed the receipt and matched canonical products/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Receipt purchase history' })).toContainText('Oatly iKaffe 1L');
  await expect(page.getByRole('region', { name: 'Receipt purchase history' })).toContainText('Bananer');
  expect(requests).toEqual(['ticket', 'upload', 'process']);
  await page.screenshot({ path: 'e2e/snapshots/receipt-upload-final.png', fullPage: true });
});

test('shows an error when receipt processing is rejected', async ({ page }) => {
  await page.route('https://uploads.groceryview.test/receipt.jpg', (route) => route.fulfill({ status: 200, body: '' }));
  await page.route('**/api/scans/upload-url?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ result: { status: 'ready', ticket: { scanId: 'receipt-error', uploadUrl: 'https://uploads.groceryview.test/receipt.jpg', payloadUri: 'gs://receipts/error.jpg', headers: {} } } })
  }));
  await page.route('**/api/scans/process?**', (route) => route.fulfill({ status: 502, body: 'scanner unavailable' }));

  await page.goto('/scanner');
  await page.getByRole('button', { name: 'Start receipt camera' }).click();
  await page.getByRole('button', { name: 'Submit receipt image' }).click();

  await expect(page.locator('[data-status="error"]')).toHaveText('Scanner request was rejected by the production API.');
  await expect(page.getByRole('region', { name: 'Receipt purchase history' })).toHaveCount(0);
});
