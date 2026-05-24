import { cleanup } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { afterEach } from "node:test";

export function setupComponentTestDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });

  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    navigator: { configurable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, value: dom.window.HTMLElement },
    SVGElement: { configurable: true, value: dom.window.SVGElement },
    Node: { configurable: true, value: dom.window.Node },
    Event: { configurable: true, value: dom.window.Event },
    MouseEvent: { configurable: true, value: dom.window.MouseEvent },
    KeyboardEvent: { configurable: true, value: dom.window.KeyboardEvent },
    CustomEvent: { configurable: true, value: dom.window.CustomEvent },
    getComputedStyle: {
      configurable: true,
      value: dom.window.getComputedStyle.bind(dom.window),
    },
  });

  afterEach(() => {
    cleanup();
    dom.window.document.body.innerHTML = "";
  });

  return dom;
}
