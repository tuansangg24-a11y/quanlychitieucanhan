import { addMonths, format, isValid, parseISO } from "date-fns";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
export const formatMoney = (value) =>
  currency.format(typeof value === "bigint" ? value : Number(value));
export const formatDate = (value) => format(parseISO(value), "dd/MM/yyyy");
export const typeLabel = (type) =>
  type === "income" ? "Thu nhập" : "Chi tiêu";
export const MAX_AMOUNT = 999999999999999;

// Use the calendar date in Vietnam; never slice a UTC ISO timestamp for defaults.
export function todayVN() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function monthBounds(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("Tháng chưa hợp lệ.");
  const start = `${month}-01`;
  return { start, end: format(addMonths(parseISO(start), 1), "yyyy-MM-dd") };
}

// Accept digit-only VND; refuse decimals, exponent notation and silent coercion.
export function parseAmount(value, { allowZero = false } = {}) {
  const text = String(value).trim();
  if (!/^\d{1,15}$/.test(text))
    throw new Error(
      "Nhập số tiền nguyên bằng chữ số, không dùng dấu chấm hoặc dấu phẩy.",
    );
  const amount = Number(text);
  if (
    !Number.isSafeInteger(amount) ||
    amount > MAX_AMOUNT ||
    amount < (allowZero ? 0 : 1)
  ) {
    throw new Error(
      "Số tiền phải lớn hơn 0 và không quá 999.999.999.999.999 ₫.",
    );
  }
  return amount;
}

export function validateTransaction(values, categories) {
  if (!["income", "expense"].includes(values.type))
    throw new Error("Vui lòng chọn khoản thu hoặc chi.");
  const category = categories.find(
    (item) => item.id === values.category_id && item.type === values.type,
  );
  if (!category)
    throw new Error("Vui lòng chọn danh mục phù hợp với loại giao dịch.");
  const date = parseISO(values.date);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(values.date) ||
    !isValid(date) ||
    format(date, "yyyy-MM-dd") !== values.date
  ) {
    throw new Error("Ngày giao dịch chưa hợp lệ.");
  }
  if ((values.note || "").length > 2000)
    throw new Error("Ghi chú tối đa 2.000 ký tự.");
  return {
    type: values.type,
    amount: parseAmount(values.amount),
    category_id: category.id,
    date: values.date,
    note: (values.note || "").trim(),
  };
}

export function validateCategory(values) {
  const name = values.name.trim();
  const emoji = values.emoji.trim();
  if (!name || name.length > 80)
    throw new Error("Tên danh mục cần từ 1 đến 80 ký tự.");
  if (!emoji || [...emoji].length > 32)
    throw new Error("Biểu tượng cần từ 1 đến 32 ký tự.");
  if (!/^#[0-9a-f]{6}$/i.test(values.color))
    throw new Error("Vui lòng chọn màu hợp lệ.");
  if (!["income", "expense"].includes(values.type))
    throw new Error("Loại danh mục chưa hợp lệ.");
  return { name, emoji, color: values.color, type: values.type };
}

export function normalizeFilters(values) {
  if (values.month) monthBounds(values.month);
  const min =
    values.min === "" ? "" : parseAmount(values.min, { allowZero: true });
  const max =
    values.max === "" ? "" : parseAmount(values.max, { allowZero: true });
  if (min !== "" && max !== "" && min > max)
    throw new Error("Số tiền từ không được lớn hơn số tiền đến.");
  return { ...values, search: values.search.trim(), min, max };
}

// Escape LIKE metacharacters so a literal % or _ in a note stays literal.
export const escapeLike = (value) => value.replace(/[\\%_]/g, "\\$&");
