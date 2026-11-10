import { test } from "node:test";
import assert from "node:assert/strict";
import {
  budgetProgress,
  comparison,
  shiftMonth,
  summarizeMonth,
  validateBudget,
} from "../src/lib/statistics.js";
import { formatMoney } from "../src/lib/finance.js";

const categories = [
  { id: "food", name: "Ăn uống", color: "#F97316", type: "expense" },
  { id: "salary", name: "Lương", color: "#166534", type: "income" },
];
test("monthly summary separates income, expense, day and category and excludes other months", () => {
  const result = summarizeMonth(
    [
      {
        type: "expense",
        category_id: "food",
        amount: 50000,
        date: "2028-02-29",
      },
      {
        type: "expense",
        category_id: "food",
        amount: 25000,
        date: "2028-02-28",
      },
      {
        type: "income",
        category_id: "salary",
        amount: 100000,
        date: "2028-02-28",
      },
      {
        type: "expense",
        category_id: "food",
        amount: 90000,
        date: "2028-03-01",
      },
    ],
    categories,
    "2028-02",
  );
  assert.equal(result.income, 100000n);
  assert.equal(result.expense, 75000n);
  assert.equal(result.balance, 25000n);
  assert.equal(result.days.length, 29);
  assert.equal(result.days.at(-1).total, 50000n);
  assert.equal(result.byCategory[0].total, 75000n);
  assert.equal(summarizeMonth([], categories, "2026-02").days.length, 28);
});
test("summary retains exact integers when totals exceed Number.MAX_SAFE_INTEGER", () => {
  const rows = Array.from({ length: 20 }, () => ({
    type: "expense",
    category_id: "food",
    amount: 999999999999999,
    date: "2026-11-01",
  }));
  const result = summarizeMonth(rows, categories, "2026-11");
  assert.equal(result.expense, 19999999999999980n);
  assert.ok(formatMoney(result.expense).includes("19.999.999.999.999.980"));
});
test("month comparison avoids division by zero and handles negative balances", () => {
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.deepEqual(comparison(200n, 100n), { delta: 100n, percentage: 100 });
  assert.deepEqual(comparison(100n, 0n), { delta: 100n, percentage: null });
  assert.deepEqual(comparison(-50n, -100n), { delta: 50n, percentage: 50 });
});
test("budget thresholds: warning exactly at 80%, red strictly above 100%, bars capped", () => {
  assert.equal(budgetProgress(799n, 1000n).state, "normal");
  assert.equal(budgetProgress(800n, 1000n).state, "warning");
  assert.equal(budgetProgress(1000n, 1000n).state, "warning");
  assert.equal(budgetProgress(1001n, 1000n).state, "over");
  assert.equal(budgetProgress(1500n, 1000n).width, 100);
  assert.equal(budgetProgress(1500n, 1000n).remaining, -500n);
  assert.throws(() => budgetProgress(100n, 0n));
});
test("budget validates expense-only category, month start and positive VND", () => {
  assert.deepEqual(
    validateBudget(
      { category_id: "food", month: "2026-11", amount: "1000000" },
      categories,
    ),
    {
      category_id: "food",
      month: "2026-11-01",
      amount: 1000000,
      type: "expense",
    },
  );
  assert.throws(() =>
    validateBudget(
      { category_id: "salary", month: "2026-11", amount: "1000" },
      categories,
    ),
  );
  assert.throws(() =>
    validateBudget(
      { category_id: "food", month: "2026-13", amount: "1000" },
      categories,
    ),
  );
});
