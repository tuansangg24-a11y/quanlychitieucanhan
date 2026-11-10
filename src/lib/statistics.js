import {
  addMonths,
  eachDayOfInterval,
  format,
  parseISO,
  subDays,
} from "date-fns";
import { monthBounds, parseAmount } from "./finance.js";

export function shiftMonth(month, amount) {
  monthBounds(month);
  return format(addMonths(parseISO(`${month}-01`), amount), "yyyy-MM");
}

export function summarizeMonth(rows, categories, month) {
  const { start, end } = monthBounds(month);
  let income = 0n;
  let expense = 0n;
  const categoryTotals = new Map();
  const days = eachDayOfInterval({
    start: parseISO(start),
    end: subDays(parseISO(end), 1),
  }).map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    day: format(day, "dd"),
    total: 0n,
  }));
  const dayMap = new Map(days.map((day) => [day.date, day]));
  for (const row of rows) {
    if (row.date < start || row.date >= end) continue;
    const amount = BigInt(row.amount);
    if (row.type === "income") income += amount;
    else if (row.type === "expense") {
      expense += amount;
      categoryTotals.set(
        row.category_id,
        (categoryTotals.get(row.category_id) || 0n) + amount,
      );
      dayMap.get(row.date).total += amount;
    }
  }
  const names = new Map(categories.map((category) => [category.id, category]));
  const byCategory = [...categoryTotals]
    .map(([id, total]) => ({
      id,
      name: names.get(id)?.name || "Danh mục khác",
      color: names.get(id)?.color || "#64748B",
      emoji: names.get(id)?.emoji || "📌",
      total,
      value: Number(total),
    }))
    .sort((a, b) =>
      a.total > b.total ? -1 : a.total < b.total ? 1 : a.id.localeCompare(b.id),
    );
  return {
    income,
    expense,
    balance: income - expense,
    byCategory,
    days: days.map((day) => ({ ...day, value: Number(day.total) })),
    categoryTotals,
  };
}

export function comparison(current, previous) {
  const delta = current - previous;
  if (previous === 0n) return { delta, percentage: null };
  const base = previous < 0n ? -previous : previous;
  return { delta, percentage: Number((delta * 1000n) / base) / 10 };
}

export function budgetProgress(spent, limit) {
  spent = BigInt(spent);
  limit = BigInt(limit);
  if (limit <= 0n) throw new Error("Hạn mức phải lớn hơn 0.");
  const percentage = Number((spent * 1000n) / limit) / 10;
  return {
    percentage,
    width: Math.min(100, percentage),
    remaining: limit - spent,
    state:
      spent > limit
        ? "over"
        : spent * 100n >= limit * 80n
          ? "warning"
          : "normal",
  };
}

export function validateBudget(values, categories) {
  if (
    !categories.some(
      (category) =>
        category.id === values.category_id && category.type === "expense",
    )
  )
    throw new Error("Hãy chọn danh mục chi tiêu hợp lệ.");
  const { start } = monthBounds(values.month);
  return {
    category_id: values.category_id,
    type: "expense",
    month: start,
    amount: parseAmount(values.amount),
  };
}
