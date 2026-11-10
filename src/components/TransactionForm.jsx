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
      categories.find(
        (item) =>
          item.type === initialType &&
          item.id ===
            localStorage.getItem(`finance-category-${userId}-${initialType}`),
      )?.id ||
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
      category_id:
        categories.find(
          (item) =>
            item.type === type &&
            item.id ===
              localStorage.getItem(`finance-category-${userId}-${type}`),
        )?.id ||
        categories.find((item) => item.type === type)?.id ||
        "",
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
      localStorage.setItem(
        `finance-category-${userId}-${payload.type}`,
        payload.category_id,
      );
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
          <div className="segmented" role="group" aria-label="Loại giao dịch">
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
            Số tiền (₫)
            <input
              autoFocus
              data-autofocus
              inputMode="numeric"
              className="amount-input"
              onInvalid={(event) =>
                event.target.setCustomValidity(
                  "Nhập số tiền là số nguyên dương, tối đa 15 chữ số",
                )
              }
              onInput={(event) => event.target.setCustomValidity("")}
              pattern="[0-9.]{1,19}"
              maxLength={19}
              required
              placeholder="0"
              value={values.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              onChange={(event) =>
                change("amount", event.target.value.replace(/\./g, ""))
              }
              aria-describedby="amount-help"
            />
          </label>
          <p id="amount-help" className="text-xs text-center muted">
            Nhập số tiền là số nguyên dương, tối đa 15 chữ số.
          </p>
          <div className="quick-amounts">
            {[10000, 50000, 100000].map((amount) => (
              <button
                type="button"
                className="secondary"
                key={amount}
                onClick={() =>
                  change(
                    "amount",
                    String(
                      Math.min(
                        999999999999999,
                        Number(values.amount || 0) + amount,
                      ),
                    ),
                  )
                }
              >
                +{amount / 1000}k
              </button>
            ))}
          </div>
          <fieldset>
            <legend className="field mb-2">Danh mục</legend>
            {choices.length ? (
              <div className="grid grid-cols-3 gap-2">
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
          <div className="sheet-actions">
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
