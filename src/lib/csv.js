import { typeLabel } from "./finance.js";

function cell(value) {
  let text = String(value ?? "");
  // Prevent spreadsheet formulas in user-provided names and notes.
  if (/^[\s]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function makeCsv(rows, categories) {
  const names = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const header = ["Ngày", "Loại", "Số tiền (VND)", "Danh mục", "Ghi chú"];
  const lines = rows.map((row) => [
    row.date,
    typeLabel(row.type),
    row.amount,
    names.get(row.category_id) || "Danh mục không còn khả dụng",
    row.note,
  ]);
  return (
    "\uFEFF" +
    [header, ...lines].map((line) => line.map(cell).join(",")).join("\r\n") +
    "\r\n"
  );
}
export function downloadCsv(csv, filename) {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
