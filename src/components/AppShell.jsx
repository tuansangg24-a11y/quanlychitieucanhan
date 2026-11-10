import { generateRecurring } from "../lib/recurringApi";
import { useEffect } from "react";
import { stopOffline } from "../lib/offlineApi";
import TransactionForm from "./TransactionForm";
import ThemeToggle from "./ThemeToggle";
import Skeleton from "./Skeleton";
import SyncStatus from "./SyncStatus";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useData } from "../data/DataProvider";
import { supabase } from "../lib/supabase";
import { authError } from "../lib/authError";
import Feedback from "./Feedback";
import PwaStatus from "./PwaStatus";

export default function AppShell() {
  const { session, demo, exitDemo } = useAuth();
  const { categories, error: categoryError, loading, reload } = useData();
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    generateRecurring(session.user.id)
      .then(() => {
        if (active) window.dispatchEvent(new Event("finance-sync"));
      })
      .catch(() => {
        if (active)
          setError(
            "Chưa tạo được giao dịch định kỳ. Kiểm tra migration và mạng, rồi mở trang Định kỳ để thử lại.",
          );
      });
    return () => {
      active = false;
    };
  }, [session.user.id]);
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      if (demo) {
        exitDemo();
        return;
      }
      const { error: failure } = await supabase.auth.signOut();
      if (failure) throw failure;
      await stopOffline(session.user.id);
    } catch (failure) {
      setError(authError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen">
      <header className="app-header">
        <Link to="/app" className="app-brand">
          <span className="brand-mark" aria-hidden="true">
            ₫
          </span>
          Sổ chi tiêu
        </Link>
        <div className="header-tools">
          <ThemeToggle />
          <button className="text-button" disabled={busy} onClick={signOut}>
            {busy ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      </header>
      <nav className="main-nav" aria-label="Điều hướng chính">
        {[
          ["tong-quan", "Tổng quan", "M3 10 12 3l9 7v11h-6v-7H9v7H3Z"],
          [
            "giao-dich",
            "Giao dịch",
            "M4 7h16M16 3l4 4-4 4M20 17H4m4-4-4 4 4 4",
          ],
          ["ngan-sach", "Ngân sách", "M3 6h18v15H3ZM3 10h18M7 3v5m10-5v5"],
          [
            "danh-muc",
            "Danh mục",
            "M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z",
          ],
          ["dinh-ky", "Định kỳ", "M20 7V3l-3 3a9 9 0 1 0 3 11M12 7v5l3 2"],
        ].map(([path, label, d]) => (
          <NavLink
            key={path}
            to={`/app/${path}`}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={d} />
            </svg>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="app-content">
        {demo && (
          <aside className="demo-banner">
            Chế độ dùng thử · Dữ liệu lưu trên thiết bị.{" "}
            <Link to="/dang-ky" className="underline font-semibold">
              Đăng ký để lưu dữ liệu
            </Link>
          </aside>
        )}
        <PwaStatus />
        {!demo && <SyncStatus userId={session.user.id} />}
        <main className="app-main">
          {error && (
            <div className="mb-5">
              <Feedback error>{error}</Feedback>
            </div>
          )}
          {categoryError ? (
            <section className="space-y-4">
              <Feedback error>{categoryError}</Feedback>
              <button className="secondary" onClick={reload}>
                Tải lại danh mục
              </button>
            </section>
          ) : loading && !categories.length ? (
            <Skeleton label="Đang tải danh mục…" />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <button
        className="primary fab"
        onClick={() => setAdding(true)}
        disabled={loading || !!categoryError}
      >
        <span aria-hidden="true" className="text-2xl">
          +
        </span>{" "}
        Ghi giao dịch
      </button>
      {notice && (
        <div role="status" className="toast">
          {notice}
        </div>
      )}
      {adding && (
        <TransactionForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setNotice("Đã lưu giao dịch");
            window.dispatchEvent(new Event("finance-sync"));
          }}
        />
      )}
    </div>
  );
}
