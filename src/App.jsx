import { useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { configError, supabase } from "./lib/supabase";
import { authError } from "./lib/authError";
import { DataProvider } from "./data/DataProvider";
import AppShell from "./components/AppShell";
import TransactionsPage from "./pages/TransactionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import DashboardPage from "./pages/DashboardPage";
import BudgetsPage from "./pages/BudgetsPage";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 font-bold text-xl">
      <span
        aria-hidden="true"
        className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-white"
      >
        ₫
      </span>
      Sổ chi tiêu
    </Link>
  );
}
function Message({ children, error = false }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}
    >
      {children}
    </p>
  );
}
function ProtectedRoute() {
  const { session } = useAuth();
  const location = useLocation();
  return session ? (
    <Outlet />
  ) : (
    <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />
  );
}
function AuthPage({ signup = false }) {
  const { session } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const target = location.state?.from;
  if (session)
    return (
      <Navigate to={target?.startsWith("/app") ? target : "/app"} replace />
    );
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (signup && password !== confirmation) {
      setError("Hai mật khẩu chưa trùng khớp.");
      return;
    }
    setBusy(true);
    try {
      const credentials = { email: email.trim(), password };
      const { data, error: failure } = signup
        ? await supabase.auth.signUp({
            ...credentials,
            options: { emailRedirectTo: `${window.location.origin}/app` },
          })
        : await supabase.auth.signInWithPassword(credentials);
      if (failure) throw failure;
      if (signup && !data.session) {
        setNotice(
          "Nếu email đủ điều kiện đăng ký, thư xác nhận sẽ được gửi. Hãy kiểm tra hộp thư (kể cả thư rác), mở liên kết rồi quay lại đăng nhập.",
        );
        setPassword("");
        setConfirmation("");
      }
    } catch (failure) {
      setError(authError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-8 md:grid-cols-2 md:px-10">
      <section>
        <Brand />
        <p className="mt-12 text-xs font-bold uppercase tracking-[.22em] text-emerald-800">
          Rõ chi tiêu · Nhẹ tâm trí
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Một góc nhỏ cho
          <br />
          tài chính của bạn.
        </h1>
        <p className="mt-5 max-w-sm leading-7 text-stone-600">
          Bắt đầu với tài khoản riêng để chuẩn bị quản lý thu chi mỗi ngày.
        </p>
        <p className="mt-8 text-sm text-stone-500">
          Dành cho những thói quen nhỏ, bền lâu.
        </p>
      </section>
      <section
        aria-labelledby="auth-title"
        className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
          Chào bạn
        </p>
        <h2 id="auth-title" className="mt-3 text-2xl font-semibold">
          {signup ? "Tạo tài khoản" : "Đăng nhập"}
        </h2>
        <p className="mb-7 mt-2 text-sm text-stone-500">
          {signup
            ? "Tạo không gian quản lý chi tiêu của riêng bạn."
            : "Chào mừng bạn trở lại với Sổ chi tiêu."}
        </p>
        <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              placeholder="ban@example.com"
            />
          </label>
          <label className="block text-sm font-medium">
            Mật khẩu
            <input
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              required
              minLength={signup ? 8 : undefined}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              aria-describedby={signup ? "password-help" : undefined}
            />
          </label>
          {signup && (
            <>
              <p id="password-help" className="text-xs text-stone-500">
                Ít nhất 8 ký tự. Có thể cần thêm yêu cầu theo cấu hình Supabase.
              </p>
              <label className="block text-sm font-medium">
                Nhập lại mật khẩu
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={busy}
                />
              </label>
            </>
          )}
          {error && <Message error>{error}</Message>}
          {notice && <Message>{notice}</Message>}
          <button disabled={busy} className="primary w-full">
            {busy ? "Đang xử lý…" : signup ? "Tạo tài khoản" : "Đăng nhập"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-600">
          {signup ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <Link
            className="font-semibold text-emerald-800 underline underline-offset-4"
            to={signup ? "/dang-nhap" : "/dang-ky"}
          >
            {signup ? "Đăng nhập" : "Đăng ký"}
          </Link>
        </p>
      </section>
    </main>
  );
}
export default function App() {
  const { loading, error, retry, session } = useAuth();
  if (configError)
    return (
      <main className="mx-auto max-w-lg p-6 pt-20">
        <Brand />
        <h1 className="my-6 text-2xl font-semibold">Thiết lập kết nối</h1>
        <Message error>{configError}</Message>
      </main>
    );
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center">
        <p role="status">Đang kiểm tra phiên đăng nhập…</p>
      </main>
    );
  if (error)
    return (
      <main className="mx-auto max-w-lg space-y-5 p-6 pt-20">
        <Message error>{error}</Message>
        <button className="primary" onClick={retry}>
          Thử lại
        </button>
      </main>
    );
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={session ? "/app" : "/dang-nhap"} replace />}
      />
      <Route path="/dang-nhap" element={<AuthPage key="login" />} />
      <Route path="/dang-ky" element={<AuthPage key="signup" signup />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/app"
          element={
            <DataProvider key={session?.user.id}>
              <AppShell />
            </DataProvider>
          }
        >
          <Route index element={<Navigate to="tong-quan" replace />} />
          <Route path="tong-quan" element={<DashboardPage />} />
          <Route path="giao-dich" element={<TransactionsPage />} />
          <Route path="danh-muc" element={<CategoriesPage />} />
          <Route path="ngan-sach" element={<BudgetsPage />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <main className="mx-auto max-w-lg space-y-5 p-6 pt-20">
            <h1 className="text-2xl font-semibold">Không tìm thấy trang</h1>
            <Link to="/" className="text-emerald-800 underline">
              Về trang chủ
            </Link>
          </main>
        }
      />
    </Routes>
  );
}
