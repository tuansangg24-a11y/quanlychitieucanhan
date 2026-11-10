import { useState } from "react";
import { useData } from "../data/DataProvider";
import { saveRow } from "../lib/api";
import { dataError } from "../lib/dataError";
import { validateCategory } from "../lib/finance";
import Modal from "./Modal";
import Feedback from "./Feedback";

export default function CategoryForm({ category, onClose, onSaved }) {
  const { userId } = useData();
  const [values, setValues] = useState(() =>
    category
      ? {
          name: category.name,
          color: category.color,
          emoji: category.emoji,
          type: category.type,
        }
      : { name: "", color: "#166534", emoji: "📌", type: "expense" },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key, value) =>
    setValues((current) => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    let payload;
    try {
      payload = validateCategory(values);
    } catch (failure) {
      setError(failure.message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveRow("categories", userId, payload, category?.id);
      onSaved();
    } catch (failure) {
      setError(dataError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={category ? "Sửa danh mục" : "Thêm danh mục"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-5">
          <label className="field">
            Tên danh mục
            <input
              autoFocus
              data-autofocus
              required
              maxLength={80}
              value={values.name}
              onChange={(event) => change("name", event.target.value)}
              placeholder="Ví dụ: Cà phê"
            />
          </label>
          <label className="field">
            Loại danh mục
            <select
              value={values.type}
              onChange={(event) => change("type", event.target.value)}
            >
              <option value="expense">Chi tiêu</option>
              <option value="income">Thu nhập</option>
            </select>
          </label>
          {category && (
            <p className="text-xs leading-5 text-stone-500">
              Danh mục đã có giao dịch hoặc ngân sách không thể đổi loại
              thu/chi.
            </p>
          )}
          <fieldset>
            <legend className="field mb-2">Biểu tượng</legend>
            <div className="grid grid-cols-6 gap-2">
              {[
                ...new Set([
                  values.emoji,
                  "🍜",
                  "☕",
                  "🛒",
                  "🏠",
                  "🚌",
                  "🎓",
                  "💊",
                  "🎬",
                  "👕",
                  "💼",
                  "💰",
                  "📌",
                ]),
              ].map((icon) => (
                <button
                  className="secondary text-xl px-1"
                  type="button"
                  aria-label={`Biểu tượng ${icon}`}
                  aria-pressed={values.emoji === icon}
                  key={icon}
                  onClick={() => change("emoji", icon)}
                  style={{
                    borderColor:
                      values.emoji === icon ? "var(--brand)" : undefined,
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="field mb-2">Màu danh mục</legend>
            <div className="flex flex-wrap gap-2">
              {[
                ...new Set([
                  values.color,
                  "#0072b2",
                  "#e69f00",
                  "#009e73",
                  "#cc79a7",
                  "#56b4e9",
                  "#d55e00",
                  "#595959",
                ]),
              ].map((color) => (
                <button
                  type="button"
                  className="rounded-lg border p-2"
                  aria-label={`Màu ${color}`}
                  aria-pressed={values.color === color}
                  key={color}
                  onClick={() => change("color", color)}
                  style={{
                    borderColor:
                      values.color === color ? "var(--brand)" : "var(--border)",
                  }}
                >
                  <span
                    style={{
                      background: color,
                      width: 24,
                      height: 24,
                      display: "block",
                      borderRadius: 6,
                    }}
                  >
                    {values.color === color ? "✓" : ""}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <p className="flex items-center gap-3 rounded-xl border border-stone-200 p-4">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-xl"
              style={{ backgroundColor: `${values.color}20` }}
            >
              {values.emoji}
            </span>
            <span className="break-words font-medium">
              {values.name || "Xem trước danh mục"}
            </span>
            <span
              className="ml-auto h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: values.color }}
            />
          </p>
          {error && <Feedback error>{error}</Feedback>}
          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Hủy
            </button>
            <button className="primary" type="submit">
              {busy ? "Đang lưu…" : "Lưu danh mục"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
