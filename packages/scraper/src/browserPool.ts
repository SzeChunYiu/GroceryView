export type BrowserPage = {
  close?: () => Promise<void> | void;
  evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
  goto: (url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }) => Promise<unknown>;
  waitForLoadState?: (state: 'load' | 'domcontentloaded' | 'networkidle', options?: { timeout?: number }) => Promise<void>;
  waitForTimeout?: (milliseconds: number) => Promise<void>;
};

export type BrowserContext = {
  close?: () => Promise<void> | void;
  newPage: () => Promise<BrowserPage>;
};

export type BrowserInstance = {
  close?: () => Promise<void> | void;
  newContext?: () => Promise<BrowserContext>;
  newPage?: () => Promise<BrowserPage>;
};

export type BrowserFactory = () => Promise<BrowserInstance>;

export type BrowserPoolOptions = {
  maxPages?: number;
};

export class BrowserPool {
  private activePages = 0;
  private readonly waiters: Array<() => void> = [];
  private browser: BrowserInstance | null = null;
  private readonly maxPages: number;

  constructor(private readonly createBrowser: BrowserFactory, options: BrowserPoolOptions = {}) {
    this.maxPages = options.maxPages ?? 2;
  }

  private async browserInstance() {
    this.browser ??= await this.createBrowser();
    return this.browser;
  }

  private async reservePageSlot() {
    if (this.activePages < this.maxPages) {
      this.activePages += 1;
      return;
    }

    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.activePages += 1;
  }

  private releasePageSlot() {
    this.activePages = Math.max(0, this.activePages - 1);
    this.waiters.shift()?.();
  }

  async withPage<T>(run: (page: BrowserPage) => Promise<T>): Promise<T> {
    await this.reservePageSlot();
    const browser = await this.browserInstance();
    const context = browser.newContext ? await browser.newContext() : null;
    const page = context ? await context.newPage() : await browser.newPage?.();

    if (!page) {
      this.releasePageSlot();
      throw new Error('Browser factory did not provide a page.');
    }

    try {
      return await run(page);
    } finally {
      await page.close?.();
      await context?.close?.();
      this.releasePageSlot();
    }
  }

  async close() {
    await this.browser?.close?.();
    this.browser = null;
  }
}
