import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { JSDOM } from "jsdom";

import { ChainSelector } from "./chain-selector";

let dom: JSDOM | undefined;
let cleanup: typeof import("@testing-library/react").cleanup | undefined;

const chains = [
  { id: "ica", name: "ICA" },
  { id: "coop", name: "Coop" },
  { id: "hemkop", name: "Hemköp" },
];

function setGlobalDomValue(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
    writable: true,
  });
}

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });

  setGlobalDomValue("window", dom.window);
  setGlobalDomValue("document", dom.window.document);
  setGlobalDomValue("HTMLElement", dom.window.HTMLElement);
  setGlobalDomValue("Node", dom.window.Node);
  setGlobalDomValue("navigator", dom.window.navigator);
});

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  dom?.window.close();
  dom = undefined;

  for (const name of ["window", "document", "HTMLElement", "Node", "navigator"]) {
    Reflect.deleteProperty(globalThis, name);
  }
});

async function loadTestingLibrary() {
  const testingLibrary = await import("@testing-library/react");
  const userEventModule = await import("@testing-library/user-event");
  cleanup = testingLibrary.cleanup;

  return {
    render: testingLibrary.render,
    screen: testingLibrary.screen,
    userEvent: userEventModule.default,
  };
}

function activeLabel(tabStops: ReadonlyMap<HTMLElement, string>) {
  const activeElement = document.activeElement;

  for (const [element, label] of tabStops) {
    if (element === activeElement) {
      return label;
    }
  }

  return "untracked focus target";
}

test("snapshots logical Tab and Shift-Tab traversal for the chain selector", async () => {
  const { render, screen, userEvent } = await loadTestingLibrary();
  const expectedTabOrder = ["Open filters", "Choose grocery chain", "Compare prices"];

  render(
    <form>
      <button type="button">Open filters</button>
      <ChainSelector chains={chains} value="ica" onChange={() => undefined} label="Choose grocery chain" />
      <a href="/compare">Compare prices</a>
    </form>,
  );

  const tabStops = new Map<HTMLElement, string>([
    [screen.getByRole("button", { name: "Open filters" }), "Open filters"],
    [screen.getByRole("combobox", { name: "Choose grocery chain" }), "Choose grocery chain"],
    [screen.getByRole("link", { name: "Compare prices" }), "Compare prices"],
  ]);
  const user = userEvent.setup();
  const forwardTabOrder: string[] = [];

  for (let index = 0; index < expectedTabOrder.length; index += 1) {
    await user.tab();
    forwardTabOrder.push(activeLabel(tabStops));
  }

  assert.deepStrictEqual(forwardTabOrder, expectedTabOrder);
  assert.deepStrictEqual(new Set(forwardTabOrder), new Set(expectedTabOrder));

  const reverseTabOrder: string[] = [];

  for (let index = 0; index < expectedTabOrder.length - 1; index += 1) {
    await user.tab({ shift: true });
    reverseTabOrder.push(activeLabel(tabStops));
  }

  assert.deepStrictEqual(reverseTabOrder, ["Choose grocery chain", "Open filters"]);
});
