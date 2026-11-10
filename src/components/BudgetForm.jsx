import { useState } from "react";
import { useData } from "../data/DataProvider";
import { saveRow } from "../lib/api";
import { dataError } from "../lib/dataError";
import { formatMoney } from "../lib/finance";
import { validateBudget } from "../lib/statistics";
import Modal from "./Modal";
import Feedback from "./Feedback";

export default function BudgetForm({
  budget,
  month,
  budgets,
  onClose,
  onSaved,
}) {
  const { userId, categories } = useData();
  const choices = categories.filter(
    (category) =>
      category.type === "expense" &&
      (category.id === budget?.category_id ||
        !budgets.some((item) => item.category_id === category.id)),
  );
  const [values, setValues] = useState({
    category_id: budget?.category_id || choices[0]?.id || "",
    amount: budget ? String(budget.amount) : "",
    month,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    let payload;
    try {
      payload = validateBudget(values, categories);
    } catch (failure) {
      setError(failure.message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveRow("budgets", userId, payload, budget?.id);
      onSaved();
    } catch (failure) {
      setError(
        failure.code === "23505"
          ? "Danh mục đã có ngân sách trong tháng này. Hãy tải lại rồi sửa ngân sách hiện có."
          : dataError(failure),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={budget ? "Sửa ngân sách" : "Đặt ngân sách"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="space-y-5">
          <p className="text-sm text-stone-500">
            Hạn mức chi cho tháng {month.slice(5)}/{month.slice(0, 4)}
          </p>
          <label className="field">
            Danh mục chi
            <select
              aria-label="Danh mục chi"
              disabled={!!budget}
              value={values.category_id}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  category_id: event.target.value,
                }))
              }
            >
              {choices.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Hạn mức (VND)
            <input
              autoFocus
              data-autofocus
              required
              inputMode="numeric"
              pattern="[0-9]{1,15}"
              maxLength={15}
              placeholder="2000000"
              value={values.amount}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
          </label>
          <p className="text-sm text-stone-500">
            {/^\d+$/.test(values.amount)
              ? formatMoney(values.amount)
              : "Nhập chữ số, ví dụ 2000000 cho 2.000.000 ₫."}
          </p>
          {error && <Feedback error>{error}</Feedback>}
          <div className="flex justify-end gap-3">
            <button type="button" className="secondary" onClick={onClose}>
              Hủy
            </button>
            <button className="primary" disabled={!choices.length}>
              {busy ? "Đang lưu…" : "Lưu ngân sách"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
