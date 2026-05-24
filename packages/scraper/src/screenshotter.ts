export type ScreenshotInput = {
  productId: string;
  productUrl: string;
};

export type ScreenshotResult = {
  productId: string;
  screenshotPath: string;
  capturedAt: string;
};

const DEFAULT_SCREENSHOT_PATH = 'artifacts/outliers';

export async function captureProductPageScreenshot(input: ScreenshotInput): Promise<ScreenshotResult> {
  const timestamp = new Date().toISOString();
  const safeId = input.productId.replace(/[^a-zA-Z0-9-]+/g, '-');
  const filename = `${safeId}-${Date.now()}.png`;
  const screenshotPath = `${DEFAULT_SCREENSHOT_PATH}/${filename}`;

  // TODO: call the real browser capture in the full scraper pipeline.
  void input.productUrl;
  void timestamp;
  return {
    productId: input.productId,
    screenshotPath,
    capturedAt: new Date(timestamp).toISOString()
  };
}

