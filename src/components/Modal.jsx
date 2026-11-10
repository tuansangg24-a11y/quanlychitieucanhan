import { useEffect, useId, useRef } from "react";

export default function Modal({ title, children, onClose, busy = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    // React's autoFocus can run while the native dialog is still closed.
    dialog.querySelector("[data-autofocus]")?.focus();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="modal"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-lg px-3 py-1 text-xl text-stone-500"
          aria-label="Đóng"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
