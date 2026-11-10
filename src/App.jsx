import ThemeToggle from "./components/ThemeToggle";
import Skeleton from "./components/Skeleton";
import RecurringPage from "./pages/RecurringPage";
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
  const { session, demo, startDemo, exitDemo } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const target = location.state?.from;
  if (session && !demo)
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
    exitDemo();
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
  async function resendConfirmation() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/app` },
      });
      if (failure) throw failure;
      setNotice(
        "Đã yêu cầu gửi lại thư xác nhận. Kiểm tra hộp thư và thư rác; có thể mất vài phút.",
      );
    } catch (failure) {
      setError(authError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section>
        <div className="flex flex-wrap justify-between gap-3">
          <Brand />
          <ThemeToggle />
        </div>
        <h1>
          Biết tiền đi đâu.
          <br /> Chủ động mỗi ngày.
        </h1>
        <p className="muted">
          Ghi thu chi nhanh, theo dõi hạn mức và biết tháng này còn bao nhiêu để
          tiêu.
        </p>
        <p className="mt-8 text-sm text-stone-500">
          Dành cho những thói quen nhỏ, bền lâu.
        </p>
      </section>
      <section
        aria-labelledby="auth-title"
        className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9"
      >
        <h2 id="auth-title" className="mt-3 text-2xl font-semibold">
          {signup ? "Tạo tài khoản" : "Đăng nhập"}
        </h2>
        <p className="mb-7 mt-2 text-sm text-stone-500">
          {signup
            ? "Lưu sổ chi tiêu riêng và mở lại trên các thiết bị của bạn."
            : "Chào mừng bạn trở lại với Sổ chi tiêu."}
        </p>
        <Link
          to="/demo"
          className="secondary mb-5 block text-center"
          onClick={startDemo}
        >
          Dùng thử không cần đăng ký
        </Link>
        {configError && <Message error>{configError}</Message>}
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
                Dùng ít nhất 8 ký tự để bảo vệ tài khoản.
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
          {notice && (
            <>
              <Message>{notice}</Message>
              <button
                type="button"
                className="secondary w-full"
                disabled={busy}
                onClick={resendConfirmation}
              >
                Gửi lại thư xác nhận
              </button>
            </>
          )}
          <button disabled={busy || !!configError} className="primary w-full">
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
function DemoEntry({ startDemo, demo }) {
  const { session } = useAuth();
  return demo || session ? (
    <Navigate to="/app" replace />
  ) : (
    <button className="primary m-8" onClick={startDemo}>
      Dùng thử không cần đăng ký
    </button>
  );
}
export default function App() {
  const { loading, error, retry, session, demo, startDemo } = useAuth();
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="w-full max-w-lg p-6">
          <Skeleton label="Đang kiểm tra phiên đăng nhập…" />
        </div>
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
      <Route
        path="/demo"
        element={<DemoEntry startDemo={startDemo} demo={demo} />}
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
          <Route path="dinh-ky" element={<RecurringPage />} />
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
