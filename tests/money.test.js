import assert from "node:assert/strict";
import test from "node:test";
import {
  addMinorUnits,
  formatGhs,
  minorUnits,
  parseGhs,
} from "@counterpoint/shared/money";

test("GHS strings convert to integer minor units without floating-point arithmetic", () => {
  assert.equal(parseGhs("12"), 1200);
  assert.equal(parseGhs("12.4"), 1240);
  assert.equal(parseGhs("-0.05"), -5);
  assert.equal(addMinorUnits(parseGhs("0.10"), parseGhs("0.20")), 30);
});

test("GHS parsing and addition reject invalid or unsafe values", () => {
  assert.throws(() => parseGhs("1.001"), TypeError);
  assert.throws(() => parseGhs("1e2"), TypeError);
  assert.throws(() => parseGhs("90071992547409.92"), RangeError);
  assert.throws(() => minorUnits(1.5), RangeError);
  assert.throws(() => addMinorUnits(Number.MAX_SAFE_INTEGER, 1), RangeError);
});

test("GHS formatting preserves exact cents and Ghana locale grouping", () => {
  assert.equal(formatGhs(minorUnits(123456)), "GH₵1,234.56");
  assert.equal(formatGhs(minorUnits(-5)), "-GH₵0.05");
});
