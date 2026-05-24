import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://groceryview.local/",
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.FocusEvent = dom.window.FocusEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const [{ cleanup, render, screen }, userEventModule, React, { PriceRangeSlider }] =
  await Promise.all([
    import("@testing-library/react"),
    import("@testing-library/user-event"),
    import("react"),
    import("./price-range-slider.tsx"),
  ]);

const userEvent = userEventModule.default;

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const focusedName = () =>
  document.activeElement?.getAttribute("aria-label") ??
  document.activeElement?.textContent?.trim() ??
  document.activeElement?.tagName;

test("PriceRangeSlider tab order reaches every interactive control", async () => {
  const user = userEvent.setup({ document });

  render(
    React.default.createElement(PriceRangeSlider, {
      min: 0,
      max: 100,
      value: [20, 80],
      onChange: () => {},
    }),
  );

  const expectedTabOrder = [
    "Minimum price",
    "Maximum price",
    "Reset price range",
  ];

  const controls = [
    screen.getByRole("slider", { name: "Minimum price" }),
    screen.getByRole("slider", { name: "Maximum price" }),
    screen.getByRole("button", { name: "Reset price range" }),
  ];

  const forwardTabOrder = [];
  for (const control of controls) {
    await user.tab();
    assert.equal(document.activeElement, control);
    forwardTabOrder.push(focusedName());
  }

  assert.deepEqual(forwardTabOrder, expectedTabOrder);

  const reverseTabOrder = [];
  for (const control of controls.slice(0, -1).reverse()) {
    await user.tab({ shift: true });
    assert.equal(document.activeElement, control);
    reverseTabOrder.push(focusedName());
  }

  assert.deepEqual(reverseTabOrder, expectedTabOrder.slice(0, -1).reverse());
});
