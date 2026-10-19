import assert from "node:assert/strict";
import test from "node:test";
import { summarizeCart } from "../apps/web/src/features/checkout/cart-model.js";
import {
  retailUnitPriceCents,
  saleUnitPriceCents,
} from "../apps/web/src/features/checkout/pricing.js";

test("checkout prices apply wholesale thresholds in integer cents", () => {
  const product = {
    price: 1.25,
    wholesalePrice: 1.1,
    wholesaleQuantity: 3,
  };

  assert.equal(retailUnitPriceCents(product), 125);
  assert.equal(saleUnitPriceCents(product, 2), 125);
  assert.equal(saleUnitPriceCents(product, 3), 110);
});

test("cart totals multiply and add exact cents across products", () => {
  const summary = summarizeCart([
    { id: "a", price: 0.1, wholesalePrice: 0, quantity: 3 },
    { id: "b", price: 0.2, wholesalePrice: 0, quantity: 2 },
  ]);

  assert.equal(summary.count, 5);
  assert.equal(summary.totalCents, 70);
  assert.equal(summary.subtotalCents, 70);
  assert.equal(summary.total, 0.7);
});

test("cart arithmetic rejects invalid quantities", () => {
  assert.throws(
    () => summarizeCart([{ price: 1, quantity: 1.5 }]),
    RangeError,
  );
});
