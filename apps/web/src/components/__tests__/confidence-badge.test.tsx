import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ConfidenceBadge } from "../confidence-badge";

test("renders unknown when confidence is undefined", () => {
  const markup = renderToStaticMarkup(<ConfidenceBadge confidence={undefined} />);

  assert.match(markup, />unknown</);
});
