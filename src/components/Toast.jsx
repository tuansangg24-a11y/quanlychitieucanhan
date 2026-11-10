import { useEffect } from "react";
export default function Toast({ children, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [children, onClose]);
  return (
    <div className="toast flex items-center gap-3" role="status">
      <span>{children}</span>
      <button
        type="button"
        className="text-button"
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
}
