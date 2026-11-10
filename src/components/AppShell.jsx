import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useData } from "../data/DataProvider";
import { supabase } from "../lib/supabase";
import { authError } from "../lib/authError";
import Feedback from "./Feedback";
import PwaStatus from "./PwaStatus";

export default function AppShell() {
  const { session } = useAuth();
  const { categories, error: categoryError, loading, reload } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await supabase.auth.signOut();
      if (failure) throw failure;
    } catch (failure) {
      setError(authError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link to="/app" className="flex items-center gap-3 text-xl font-bold">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-white"
            >
              ₫
            </span>
            Sổ chi tiêu
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <p className="hidden max-w-60 truncate text-sm text-stone-500 sm:block">
              {session.user.email}
            </p>
            <button className="secondary" disabled={busy} onClick={signOut}>
              {busy ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-5 sm:gap-6"
          aria-label="Điều hướng chính"
        >
          <NavLink
            to="/app/tong-quan"
            className={({ isActive }) =>
              `nav-link whitespace-nowrap ${isActive ? "border-emerald-800 text-emerald-800" : "border-transparent text-stone-500"}`
            }
          >
            Tổng quan
          </NavLink>
          <NavLink
            to="/app/giao-dich"
            className={({ isActive }) =>
              `nav-link ${isActive ? "border-emerald-800 text-emerald-800" : "border-transparent text-stone-500"}`
            }
          >
            Giao dịch
          </NavLink>
          <NavLink
            to="/app/danh-muc"
            className={({ isActive }) =>
              `nav-link ${isActive ? "border-emerald-800 text-emerald-800" : "border-transparent text-stone-500"}`
            }
          >
            Danh mục
          </NavLink>
          <NavLink
            to="/app/ngan-sach"
            className={({ isActive }) =>
              `nav-link whitespace-nowrap ${isActive ? "border-emerald-800 text-emerald-800" : "border-transparent text-stone-500"}`
            }
          >
            Ngân sách
          </NavLink>
        </nav>
      </header>
      <PwaStatus />
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-5 sm:py-10">
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
          <p role="status">Đang tải danh mục…</p>
        ) : (
          <Outlet />
        )}
      </main>
      <footer className="mx-auto max-w-6xl px-5 py-8 text-xs text-stone-500">
        Sổ chi tiêu · Từng bước xây thói quen tài chính
      </footer>
    </div>
  );
}
