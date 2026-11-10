import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../data/DataProvider";
import useMonthData from "../data/useMonthData";
import { formatDate, formatMoney, todayVN } from "../lib/finance";
import { shiftMonth, summarizeMonth } from "../lib/statistics";
import Feedback from "../components/Feedback";
import MonthPicker from "../components/MonthPicker";
import BudgetMeter from "../components/BudgetMeter";
import Skeleton from "../components/Skeleton";
const ExpenseCharts = lazy(() => import("../components/ExpenseCharts"));
export default function DashboardPage() {
  const { categories } = useData();
  const [month, setMonth] = useState(() => todayVN().slice(0, 7));
  const data = useMonthData(month, true);
  const stats = summarizeMonth(data.transactions, categories, month);
  const previous = summarizeMonth(
    data.previous,
    categories,
    shiftMonth(month, -1),
  );
  const limit = data.budgets.reduce((sum, b) => sum + BigInt(b.amount), 0n);
  const byId = new Map(categories.map((c) => [c.id, c]));
  return (
    <>
      <div className="page-heading">
        <h1>Tổng quan</h1>
        <button className="text-button" onClick={data.reload}>
          Làm mới
        </button>
      </div>
      <MonthPicker month={month} onChange={setMonth} />
      {data.loading ? (
        <Skeleton label="Đang tổng hợp thu chi…" />
      ) : data.error ? (
        <>
          <Feedback error>{data.error}</Feedback>
          <button className="secondary mt-4" onClick={data.reload}>
            Thử lại
          </button>
        </>
      ) : (
        <>
          <section className="hero">
            <h2 className="muted text-sm">
              {limit > 0n ? "Còn có thể chi" : "Số dư tháng"}
            </h2>
            <p className="hero-amount" data-testid="summary-balance">
              {formatMoney(limit > 0n ? limit - stats.expense : stats.balance)}
            </p>
            {limit > 0n ? (
              <>
                <BudgetMeter
                  spent={stats.expense}
                  limit={limit}
                  name="tổng tháng"
                />
                <p className="muted text-xs mt-3">
                  Tổng hạn mức {formatMoney(limit)} · Tính trên toàn bộ khoản
                  chi trong tháng.
                </p>
              </>
            ) : (
              <p className="text-sm muted">
                Thu trừ chi trong tháng.{" "}
                <Link className="underline" to="/app/ngan-sach">
                  Đặt hạn mức để biết còn bao nhiêu có thể chi
                </Link>
              </p>
            )}
          </section>
          <div className="summary-line">
            {[
              ["Tổng thu", "income"],
              ["Tổng chi", "expense"],
            ].map(([label, key]) => {
              const delta = stats[key] - previous[key];
              return (
                <section key={key}>
                  <h2 className="muted text-sm">{label}</h2>
                  <p
                    className={`text-xl font-semibold tabular-nums mt-2 ${key === "income" ? "income" : ""}`}
                    data-testid={`summary-${key}`}
                  >
                    {formatMoney(stats[key])}
                  </p>
                  <p className="text-xs muted mt-3">
                    {delta === 0n
                      ? "Không đổi so với tháng trước"
                      : `${delta > 0n ? "↑" : "↓"} ${key === "income" ? "Thu" : "Chi"} ${delta > 0n ? "nhiều" : "ít"} hơn tháng trước ${formatMoney(delta < 0n ? -delta : delta)}`}
                  </p>
                </section>
              );
            })}
          </div>
          <p className="muted text-xs mb-5">
            So sánh với toàn bộ tháng trước; tháng hiện tại có thể chưa kết
            thúc.
          </p>
          <Suspense fallback={<Skeleton rows={2} />}>
            <ExpenseCharts
              stats={stats}
              transactions={data.transactions}
              month={month}
            />
          </Suspense>
          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">Giao dịch gần đây</h2>
              <Link to="/app/giao-dich" className="text-button underline">
                Xem tất cả
              </Link>
            </div>
            {[...data.transactions]
              .sort(
                (a, b) =>
                  b.date.localeCompare(a.date) ||
                  String(b.created_at || "").localeCompare(
                    String(a.created_at || ""),
                  ),
              )
              .slice(0, 5)
              .map((t) => {
                const c = byId.get(t.category_id);
                return (
                  <div className="transaction-row" key={t.id}>
                    <span
                      aria-hidden="true"
                      className="transaction-icon"
                      style={{ background: `${c?.color || "#64748b"}20` }}
                    >
                      {c?.emoji || "📌"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{t.note || c?.name}</p>
                      <p className="text-xs muted">
                        {c?.name} · {formatDate(t.date)}
                        {t.pending ? " · Chờ đồng bộ" : ""}
                      </p>
                    </div>
                    <p
                      className={`row-amount ${t.type === "income" ? "income" : ""}`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatMoney(t.amount)}
                    </p>
                  </div>
                );
              })}
            {!data.transactions.length && (
              <p className="mt-4 muted">
                Chưa có giao dịch. Bấm “Ghi giao dịch” để thêm khoản đầu tiên.
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}
