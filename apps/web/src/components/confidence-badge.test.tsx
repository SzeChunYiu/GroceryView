import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JSDOM } from "jsdom";

import { ConfidenceBadge } from "./confidence-badge";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://groceryview.test/"
});

globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator
});
globalThis.window = dom.window;

function activeElementLabel() {
  const element = document.activeElement;
  if (!element || element === document.body) return "body";
  return element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName.toLowerCase();
}

async function recordTabs(user: ReturnType<typeof userEvent.setup>, steps: Array<{ shift?: boolean }> = [{}]) {
  const order: string[] = [];

  for (const step of steps) {
    await user.tab(step);
    order.push(activeElementLabel());
  }

  return order;
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("ConfidenceBadge keyboard navigation", () => {
  it("keeps every interactive element reachable in logical Tab and Shift-Tab order", async () => {
    const user = userEvent.setup({ document });

    const { getByRole } = render(
      <div>
        <button type="button">Previous control</button>
        <ConfidenceBadge level="high" label="High confidence" sampleSize={42} />
        <a href="/next">Next control</a>
      </div>
    );

    const help = getByRole("button", { name: /confidence score explanation/i });
    assert.equal(help.getAttribute("type"), "button");

    const forwardTabOrder = await recordTabs(user, [{}, {}, {}]);
    assert.deepEqual(forwardTabOrder, [
      "Previous control",
      help.getAttribute("aria-label"),
      "Next control"
    ]);

    const reverseTabOrder = await recordTabs(user, [{ shift: true }, { shift: true }, { shift: true }]);
    assert.deepEqual(reverseTabOrder, [
      help.getAttribute("aria-label"),
      "Previous control",
      "body"
    ]);

    assert.deepEqual(
      {
        forward: forwardTabOrder,
        reverse: reverseTabOrder
      },
      {
        forward: [
          "Previous control",
          "Confidence score explanation: Confidence reflects source freshness and match quality, so newer verified rows and stronger product matches score higher.",
          "Next control"
        ],
        reverse: [
          "Confidence score explanation: Confidence reflects source freshness and match quality, so newer verified rows and stronger product matches score higher.",
          "Previous control",
          "body"
        ]
      }
    );
  });
});
