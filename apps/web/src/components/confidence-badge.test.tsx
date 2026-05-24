import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConfidenceBadge } from "./confidence-badge";

describe("ConfidenceBadge", () => {
  it("wires the help button to the rendered tooltip without changing tab order", () => {
    render(<ConfidenceBadge level="high" label="High" sampleSize={42} />);

    const button = screen.getByRole("button", { name: "Confidence details" });
    const tooltip = screen.getByRole("tooltip");

    expect(button.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(tooltip.textContent).toBe("High confidence score based on 42 samples.");
    expect(button.tabIndex).toBe(-1);
  });
});
