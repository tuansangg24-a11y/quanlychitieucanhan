import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../data/DataProvider";
import { saveRow } from "../lib/api";
import { dataError } from "../lib/dataError";
import { formatMoney, todayVN, validateTransaction } from "../lib/finance";
import Feedback from "./Feedback";
import Modal from "./Modal";

export default function TransactionForm({ transaction, onClose, onSaved }) {
  const { userId, categories } = useData();
  const initialType = transaction?.type || "expense";
  const [values, setValues] = useState(() => ({
    type: initialType,
    amount: transaction ? String(transaction.amount) : "",
    category_id:
      transaction?.category_id ||
      categories.find((item) => item.type === initialType)?.id ||
      "",
    date: transaction?.date || todayVN(),
    note: transaction?.note || "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const choices = categories.filter((item) => item.type === values.type);
  function change(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function changeType(type) {
    setValues((current) => ({
      ...current,
      type,
      category_id: categories.find((item) => item.type === type)?.id || "",
    }));
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    let payload;
    try {
      payload = validateTransaction(values, categories);
    } catch (failure) {
      setError(failure.message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveRow("transactions", userId, payload, transaction?.id);
      onSaved(payload);
    } catch (failure) {
      setError(dataError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={transaction ? "Sửa giao dịch" : "Thêm giao dịch"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-5">
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label="Loại giao dịch"
          >
            {[
              ["expense", "Khoản chi"],
              ["income", "Khoản thu"],
            ].map(([type, label]) => (
              <button
                type="button"
                key={type}
                className={values.type === type ? "primary" : "secondary"}
                aria-pressed={values.type === type}
                onClick={() => changeType(type)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="field">
            Số tiền (VND)
            <input
              autoFocus
              data-autofocus
              inputMode="numeric"
              pattern="[0-9]{1,15}"
              maxLength={15}
              required
              placeholder="50000"
              value={values.amount}
              onChange={(event) => change("amount", event.target.value)}
              aria-describedby="amount-help"
            />
          </label>
          <p id="amount-help" className="text-sm text-stone-500">
            {/^\d+$/.test(values.amount)
              ? formatMoney(values.amount)
              : "Nhập chữ số, ví dụ 50000 cho 50.000 ₫."}
          </p>
          <fieldset>
            <legend className="field mb-2">Danh mục</legend>
            {choices.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {choices.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    aria-pressed={values.category_id === category.id}
                    className={`category-choice ${values.category_id === category.id ? "border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700" : "border-stone-200"}`}
                    onClick={() => change("category_id", category.id)}
                  >
                    <span aria-hidden="true">{category.emoji}</span>
                    <span className="min-w-0 break-words">{category.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 p-3 text-sm">
                Chưa có danh mục cho loại này.{" "}
                <Link
                  to="/app/danh-muc"
                  onClick={onClose}
                  className="underline"
                >
                  Tạo danh mục
                </Link>
              </p>
            )}
          </fieldset>
          <label className="field">
            Ngày giao dịch
            <input
              type="date"
              required
              value={values.date}
              onChange={(event) => change("date", event.target.value)}
            />
          </label>
          <label className="field">
            Ghi chú{" "}
            <span className="font-normal text-stone-400">(không bắt buộc)</span>
            <textarea
              rows={2}
              maxLength={2000}
              placeholder="Bữa trưa, cà phê…"
              value={values.note}
              onChange={(event) => change("note", event.target.value)}
            />
          </label>
          {error && <Feedback error>{error}</Feedback>}
          <div className="flex justify-end gap-3">
            <button type="button" className="secondary" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="primary"
              disabled={!choices.length}
            >
              {busy ? "Đang lưu…" : "Lưu giao dịch"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
