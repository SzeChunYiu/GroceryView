import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://groceryview.test/",
});

globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.MouseEvent = dom.window.MouseEvent;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});
globalThis.window = dom.window as unknown as Window & typeof globalThis;

const { cleanup, fireEvent, render, screen } = await import("@testing-library/react");
const { ConfidenceBadge } = await import("../confidence-badge");

afterEach(() => {
  cleanup();
});

describe("ConfidenceBadge", () => {
  it("renders with required props", () => {
    render(<ConfidenceBadge level="high" label="Verified match" sampleSize={12} />);

    assert.ok(screen.getByText("Verified match"));
    assert.ok(screen.getByText("n=12"));
  });

  it("fires onAction callback", () => {
    let actionCount = 0;

    render(
      <ConfidenceBadge
        actionLabel="Open confidence details"
        level="medium"
        label="Review confidence"
        onAction={() => {
          actionCount += 1;
        }}
        sampleSize={3}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open confidence details" }));

    assert.equal(actionCount, 1);
  });

  it("handles empty-data prop", () => {
    render(<ConfidenceBadge emptyData level="low" label="Insufficient coverage" sampleSize={0} />);

    assert.ok(screen.getByText("Insufficient coverage"));
    assert.ok(screen.getByText("No data"));
    assert.equal(screen.queryByText("n=0"), null);
  });
});
