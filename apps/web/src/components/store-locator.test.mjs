import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLSelectElement = dom.window.HTMLSelectElement;
globalThis.Node = dom.window.Node;
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: dom.window.navigator,
});

const React = await import('react');
const { cleanup, render } = await import('@testing-library/react');
const userEvent = (await import('@testing-library/user-event')).default;
const { StoreLocator } = await import('./store-locator.tsx');

afterEach(() => {
  cleanup();
});

const tabOrderSnapshot = [
  'Search stores',
  'Use current location',
  'Sort stores',
  'ICA Nära Södermalm',
  'Set ICA Nära Södermalm as preferred',
  'Coop Odenplan',
  'Set Coop Odenplan as preferred',
];

function activeElementName() {
  const activeElement = document.activeElement;

  assert.ok(activeElement instanceof HTMLElement);

  return activeElement.getAttribute('aria-label') ?? activeElement.textContent?.trim().replace(/\s+/g, ' ');
}

test('StoreLocator tab and Shift-Tab order reaches every interactive element', async () => {
  const user = userEvent.setup({ document });
  const { container } = render(React.createElement(StoreLocator));

  assert.equal(
    container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
    tabOrderSnapshot.length,
  );

  const forwardOrder = [];
  for (let index = 0; index < tabOrderSnapshot.length; index += 1) {
    await user.tab();
    forwardOrder.push(activeElementName());
  }

  const backwardOrder = [];
  for (let index = 0; index < tabOrderSnapshot.length - 1; index += 1) {
    await user.tab({ shift: true });
    backwardOrder.push(activeElementName());
  }

  assert.deepEqual(
    {
      forward: forwardOrder,
      shiftTab: backwardOrder,
    },
    {
      forward: tabOrderSnapshot,
      shiftTab: tabOrderSnapshot.slice(0, -1).reverse(),
    },
  );
});
