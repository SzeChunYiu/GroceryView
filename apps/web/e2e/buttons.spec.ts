import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const interactiveSelector = [
  'button:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  'a[href]'
].join(', ');

const defaultRoutes = ['/'];
const maxPages = Number.parseInt(process.env.BUTTON_AUDIT_MAX_PAGES ?? '80', 10);

type ButtonAuditInteraction = {
  accessibleName: string;
  clicked: boolean;
  focusVisible: boolean;
  href: string | null;
  index: number;
  role: string;
  tagName: string;
};

type ButtonAuditPage = {
  consoleErrors: string[];
  interactions: ButtonAuditInteraction[];
  route: string;
  xhrServerErrors: Array<{ method: string; status: number; url: string }>;
};

function normalizedInternalPath(baseUrl: string, href: string | null): string | null {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
  const url = new URL(href, baseUrl);
  const base = new URL(baseUrl);
  if (url.origin !== base.origin) return null;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return null;
  return `${url.pathname}${url.search}`.replace(/\/+$/, '') || '/';
}

async function visibleInternalLinks(page: Page) {
  return page.locator('a[href]').evaluateAll((links) =>
    links.flatMap((link) => {
      const anchor = link as HTMLAnchorElement;
      const rect = anchor.getBoundingClientRect();
      const style = window.getComputedStyle(anchor);
      if (rect.width <= 0 || rect.height <= 0 || style.visibility === 'hidden' || style.display === 'none') return [];
      return [anchor.href];
    })
  );
}

async function instrumentPage(page: Page, currentAudit: { page: ButtonAuditPage | null }) {
  page.on('console', (message) => {
    if (message.type() === 'error') currentAudit.page?.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => currentAudit.page?.consoleErrors.push(error.message));
  page.on('response', (response) => {
    const resourceType = response.request().resourceType();
    if ((resourceType === 'fetch' || resourceType === 'xhr') && response.status() >= 500) {
      currentAudit.page?.xhrServerErrors.push({
        method: response.request().method(),
        status: response.status(),
        url: response.url()
      });
    }
  });
}

async function discoverInteractions(page: Page) {
  return page.locator(interactiveSelector).evaluateAll((elements) =>
    elements.flatMap((element, index) => {
      const htmlElement = element as HTMLElement & { dataset: DOMStringMap };
      const rect = htmlElement.getBoundingClientRect();
      const style = window.getComputedStyle(htmlElement);
      const disabled =
        htmlElement.hasAttribute('disabled') ||
        htmlElement.getAttribute('aria-disabled') === 'true' ||
        htmlElement.closest('[inert], [aria-hidden="true"]');
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.pointerEvents !== 'none';
      if (!visible || disabled || htmlElement.getAttribute('aria-label') === 'Open Next.js Dev Tools') return [];

      const auditId = `button-audit-${index}`;
      htmlElement.dataset.buttonAuditId = auditId;
      return [{
        accessibleName: htmlElement.getAttribute('aria-label') ?? htmlElement.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        auditId,
        href: htmlElement instanceof HTMLAnchorElement ? htmlElement.href : null,
        index,
        role: htmlElement.getAttribute('role') ?? (htmlElement instanceof HTMLAnchorElement ? 'link' : htmlElement.tagName.toLowerCase()),
        tagName: htmlElement.tagName.toLowerCase()
      }];
    })
  );
}

async function hasVisibleFocus(page: Page, auditId: string) {
  return page.evaluate((id) => {
    const element = document.querySelector(`[data-button-audit-id="${id}"]`) as HTMLElement | null;
    if (!element) return false;
    element.focus();
    const active = document.activeElement === element || element.contains(document.activeElement);
    const style = window.getComputedStyle(element);
    const outlineWidth = Number.parseFloat(style.outlineWidth || '0');
    const hasOutline = style.outlineStyle !== 'none' && outlineWidth > 0;
    const hasShadow = style.boxShadow !== 'none';
    const focusVisible = element.matches(':focus-visible') || element.matches(':focus') || active;
    return active && focusVisible && (hasOutline || hasShadow || style.outlineStyle === 'auto');
  }, auditId);
}

test('crawls pages and audits every visible button, role button, and interactive link', async ({ page }) => {
  test.setTimeout(180_000);

  const baseURL = test.info().project.use.baseURL as string;
  const queue = [...defaultRoutes];
  const visited = new Set<string>();
  const audit: ButtonAuditPage[] = [];
  const currentAudit: { page: ButtonAuditPage | null } = { page: null };
  await instrumentPage(page, currentAudit);

  while (queue.length > 0 && visited.size < maxPages) {
    const routePath = queue.shift()!;
    if (visited.has(routePath)) continue;
    visited.add(routePath);

    const pageAudit: ButtonAuditPage = {
      consoleErrors: [],
      interactions: [],
      route: routePath,
      xhrServerErrors: []
    };
    currentAudit.page = pageAudit;
    await page.goto(routePath);
    await page.waitForLoadState('domcontentloaded');

    for (const href of await visibleInternalLinks(page)) {
      const nextPath = normalizedInternalPath(baseURL, href);
      if (nextPath && !visited.has(nextPath) && !queue.includes(nextPath) && queue.length + visited.size < maxPages) queue.push(nextPath);
    }

    const interactions = await discoverInteractions(page);
    for (const interaction of interactions) {
      await page.goto(routePath);
      await page.waitForLoadState('domcontentloaded');
      await discoverInteractions(page);
      const locator = page.locator(`[data-button-audit-id="${interaction.auditId}"]`).first();
      const focusVisible = await hasVisibleFocus(page, interaction.auditId);
      let clicked = false;
      const popupPromise = page.waitForEvent('popup', { timeout: 750 }).catch(() => null);
      await locator.click({ timeout: 2_500 }).then(() => {
        clicked = true;
      }).catch(() => {
        clicked = false;
      });
      const popup = await popupPromise;
      await popup?.close().catch(() => undefined);
      pageAudit.interactions.push({
        accessibleName: interaction.accessibleName,
        clicked,
        focusVisible,
        href: interaction.href,
        index: interaction.index,
        role: interaction.role,
        tagName: interaction.tagName
      });
    }

    audit.push(pageAudit);
    currentAudit.page = null;
  }

  const outputPath = path.join(test.info().config.rootDir, 'e2e', 'button-audit.json');
  await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), pages: audit }, null, 2)}\n`);

  expect(audit.length).toBeGreaterThan(0);
  expect(audit.flatMap((row) => row.interactions).length).toBeGreaterThan(0);
  expect(audit.flatMap((row) => row.consoleErrors)).toEqual([]);
  expect(audit.flatMap((row) => row.xhrServerErrors)).toEqual([]);
  expect(audit.flatMap((row) => row.interactions).every((interaction) => interaction.clicked)).toBe(true);
  expect(audit.flatMap((row) => row.interactions).every((interaction) => interaction.focusVisible)).toBe(true);
});
