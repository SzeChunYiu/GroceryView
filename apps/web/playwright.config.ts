import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['junit', { outputFile: './e2e/test-results/junit.xml' }],
    ['html', { outputFolder: './e2e/playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    locale: 'sv-SE',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev -w @groceryview/web -- --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000/scanner',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
