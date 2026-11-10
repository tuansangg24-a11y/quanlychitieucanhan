import { useState } from "react";
import Modal from "./Modal";
import Feedback from "./Feedback";
import { dataError } from "../lib/dataError";

export default function ConfirmDelete({
  title,
  description,
  action,
  onClose,
  onDeleted,
  category = false,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      onDeleted();
    } catch (failure) {
      setError(dataError(failure, category ? "delete-category" : "delete"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <p className="mb-5 break-words leading-7 text-stone-600">{description}</p>
      {error && <Feedback error>{error}</Feedback>}
      <div className="mt-6 flex justify-end gap-3">
        <button
          autoFocus
          data-autofocus
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onClose}
        >
          Hủy
        </button>
        <button className="danger" disabled={busy} onClick={confirm}>
          {busy ? "Đang xóa…" : "Xác nhận xóa"}
        </button>
      </div>
    </Modal>
  );
}
