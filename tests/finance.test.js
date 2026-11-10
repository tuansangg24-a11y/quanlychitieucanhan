import { test } from "node:test";
import assert from "node:assert/strict";
import {
  escapeLike,
  monthBounds,
  normalizeFilters,
  parseAmount,
  validateCategory,
  validateTransaction,
} from "../src/lib/finance.js";
import { makeCsv } from "../src/lib/csv.js";

test("VND amounts stay exact and reject decimals/coercion/overflow", () => {
  assert.equal(parseAmount("50000"), 50000);
  assert.equal(parseAmount("999999999999999"), 999999999999999);
  for (const value of [
    "0",
    "-1",
    "1.5",
    "50.000",
    "1e6",
    "",
    "1000000000000000",
  ])
    assert.throws(() => parseAmount(value));
});

test("month filtering includes December rollover and leap-year February", () => {
  assert.deepEqual(monthBounds("2026-12"), {
    start: "2026-12-01",
    end: "2027-01-01",
  });
  assert.deepEqual(monthBounds("2028-02"), {
    start: "2028-02-01",
    end: "2028-03-01",
  });
  assert.throws(() => monthBounds("2026-13"));
  assert.throws(() =>
    normalizeFilters({ search: "", min: "90000", max: "100", month: "" }),
  );
});

test("transaction validation rejects category/type mismatch and impossible dates", () => {
  const categories = [{ id: "food", type: "expense" }];
  const values = {
    type: "expense",
    category_id: "food",
    amount: "50000",
    date: "2028-02-29",
    note: " Bữa trưa ",
  };
  assert.equal(validateTransaction(values, categories).note, "Bữa trưa");
  assert.throws(() =>
    validateTransaction({ ...values, type: "income" }, categories),
  );
  assert.throws(() =>
    validateTransaction({ ...values, date: "2026-02-29" }, categories),
  );
  assert.throws(() =>
    validateTransaction(
      { ...values, category_id: "other-user-category" },
      categories,
    ),
  );
  assert.throws(() =>
    validateCategory({
      name: " ",
      type: "expense",
      emoji: "🍜",
      color: "#166534",
    }),
  );
});

test("search treats SQL wildcard characters as literal note text", () => {
  assert.equal(escapeLike("50%_\\"), "50\\%\\_\\\\");
});

test("Excel CSV has BOM, quote/newline escaping and formula protection", () => {
  const csv = makeCsv(
    [
      {
        date: "2026-11-10",
        type: "expense",
        amount: 50000,
        category_id: "food",
        note: '=SUM(1,2)\n"ghi chú"',
      },
    ],
    [{ id: "food", name: "Ăn uống" }],
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"50000"'));
  assert.ok(csv.includes('"Ăn uống"'));
  assert.ok(csv.includes('"\'=SUM(1,2)\n""ghi chú"""'));
  assert.ok(csv.endsWith("\r\n"));
});
