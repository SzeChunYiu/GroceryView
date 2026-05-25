import { afterEach } from 'node:test';
import { JSDOM } from 'jsdom';

let dom: JSDOM | undefined;

function installDomGlobals() {
  dom ??= new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://grocery-web-mu.vercel.app/'
  });

  const { window } = dom;
  Object.defineProperties(globalThis, {
    self: { configurable: true, value: window },
    window: { configurable: true, value: window },
    document: { configurable: true, value: window.document },
    navigator: { configurable: true, value: window.navigator },
    HTMLElement: { configurable: true, value: window.HTMLElement },
    HTMLButtonElement: { configurable: true, value: window.HTMLButtonElement },
    HTMLInputElement: { configurable: true, value: window.HTMLInputElement },
    Node: { configurable: true, value: window.Node },
    Event: { configurable: true, value: window.Event },
    KeyboardEvent: { configurable: true, value: window.KeyboardEvent },
    MouseEvent: { configurable: true, value: window.MouseEvent },
    PointerEvent: { configurable: true, value: window.PointerEvent ?? window.MouseEvent },
    localStorage: { configurable: true, value: window.localStorage },
    sessionStorage: { configurable: true, value: window.sessionStorage }
  });

  const requestAnimationFrame = (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0);
  const cancelAnimationFrame = (handle: number) => window.clearTimeout(handle);
  globalThis.requestAnimationFrame ??= requestAnimationFrame;
  globalThis.cancelAnimationFrame ??= cancelAnimationFrame;
  window.requestAnimationFrame ??= requestAnimationFrame;
  window.cancelAnimationFrame ??= cancelAnimationFrame;
  window.matchMedia ??= () => ({
    matches: false,
    media: '',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false
  });
}

installDomGlobals();

export function setupComponentTestDom() {
  afterEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}
