import assert from "node:assert/strict";
import { test } from "node:test";

import { addBasketBuilderProduct } from "../basket-builder";

test("addBasketBuilderProduct ignores products already present", () => {
  const product = { id: "milk", name: "Milk" };
  const basket = [product];

  assert.equal(addBasketBuilderProduct(basket, product), basket);
});
