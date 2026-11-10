import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../data/DataProvider";
import useMonthData from "../data/useMonthData";
import { formatMoney, todayVN } from "../lib/finance";
import { comparison, shiftMonth, summarizeMonth } from "../lib/statistics";
import Feedback from "../components/Feedback";
import MonthPicker from "../components/MonthPicker";
import TransactionForm from "../components/TransactionForm";
import BudgetMeter from "../components/BudgetMeter";

const ExpenseCharts = lazy(() => import("../components/ExpenseCharts"));
function SummaryCard({
  label,
  amount,
  previous,
  expense = false,
  balance = false,
}) {
  const change = comparison(amount, previous);
  const direction =
    change.delta > 0n ? "Tăng" : change.delta < 0n ? "Giảm" : "Không đổi";
  const favorable = expense ? change.delta <= 0n : change.delta >= 0n;
  return (
    <section
      className={`min-w-0 rounded-2xl border p-5 ${balance ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-200 bg-white"}`}
    >
      <h2
        className={`text-sm ${balance ? "text-emerald-100" : "text-stone-500"}`}
      >
        {label}
      </h2>
      <p
        className="mt-3 break-words text-2xl font-semibold tabular-nums"
        data-testid={`summary-${balance ? "balance" : expense ? "expense" : "income"}`}
      >
        {formatMoney(amount)}
      </p>
      <p
        className={`mt-4 text-xs leading-5 ${balance ? "text-emerald-100" : favorable ? "text-emerald-700" : "text-amber-800"}`}
      >
        {direction}
        {change.delta !== 0n
          ? ` ${formatMoney(change.delta < 0n ? -change.delta : change.delta)}`
          : ""}
        {change.percentage !== null && change.delta !== 0n
          ? ` (${Math.abs(change.percentage).toLocaleString("vi-VN")}%)`
          : ""}
      </p>
      <p
        className={`mt-1 text-xs ${balance ? "text-emerald-100" : "text-stone-500"}`}
      >
        Tháng trước: {formatMoney(previous)}
        {previous === 0n && amount !== 0n ? " · chưa có tỷ lệ so sánh" : ""}
      </p>
    </section>
  );
}
export default function DashboardPage() {
  const { categories } = useData();
  const [month, setMonth] = useState(() => todayVN().slice(0, 7));
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const data = useMonthData(month, true);
  const stats = summarizeMonth(data.transactions, categories, month);
  const previous = summarizeMonth(
    data.previous,
    categories,
    shiftMonth(month, -1),
  );
  const byId = new Map(categories.map((category) => [category.id, category]));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Bức tranh tài chính của bạn</p>
          <h1>Tổng quan</h1>
          <p className="mt-2 text-stone-500">
            Thu, chi và những thói quen trong tháng.
          </p>
        </div>
        <button className="primary" onClick={() => setAdding(true)}>
          + Thêm giao dịch
        </button>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <MonthPicker
          month={month}
          onChange={(value) => {
            setMonth(value);
            setNotice("");
          }}
        />
        <button className="text-button" onClick={data.reload}>
          Làm mới
        </button>
      </div>
      {notice && (
        <div className="mb-5">
          <Feedback>{notice}</Feedback>
        </div>
      )}
      {data.loading ? (
        <p role="status">Đang tổng hợp thu chi…</p>
      ) : data.error ? (
        <section className="space-y-4">
          <Feedback error>{data.error}</Feedback>
          <button className="secondary" onClick={data.reload}>
            Thử lại
          </button>
        </section>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              label="Tổng thu"
              amount={stats.income}
              previous={previous.income}
            />
            <SummaryCard
              label="Tổng chi"
              amount={stats.expense}
              previous={previous.expense}
              expense
            />
            <SummaryCard
              label="Số dư trong tháng"
              amount={stats.balance}
              previous={previous.balance}
              balance
            />
          </div>
          <p className="mb-6 mt-3 text-xs leading-6 text-stone-500">
            Số dư trong tháng = thu − chi, không bao gồm số dư các tháng trước.
            So sánh với toàn bộ tháng trước; tháng hiện tại có thể chưa kết
            thúc.
          </p>
          <Suspense fallback={<p role="status">Đang tải biểu đồ…</p>}>
            <ExpenseCharts stats={stats} />
          </Suspense>
          <section className="panel mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Theo dõi ngân sách</h2>
              <Link
                to="/app/ngan-sach"
                className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
              >
                Quản lý ngân sách →
              </Link>
            </div>
            {data.budgets.length ? (
              <ul className="mt-4 grid gap-5 sm:grid-cols-2">
                {data.budgets.map((budget) => (
                  <li
                    key={budget.id}
                    className="min-w-0 rounded-xl border border-stone-100 p-4"
                  >
                    <h3 className="break-words text-sm font-semibold">
                      {byId.get(budget.category_id)?.emoji}{" "}
                      {byId.get(budget.category_id)?.name || "Danh mục khác"}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      Hạn mức {formatMoney(budget.amount)}
                    </p>
                    <BudgetMeter
                      spent={stats.categoryTotals.get(budget.category_id) || 0n}
                      limit={budget.amount}
                      name={byId.get(budget.category_id)?.name || "Danh mục"}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-stone-500">
                Chưa đặt hạn mức cho tháng này. Chọn một danh mục để bắt đầu
                theo dõi.
              </p>
            )}
          </section>
        </>
      )}
      {adding && (
        <TransactionForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setNotice(
              "Đã lưu giao dịch. Tổng quan hiển thị theo tháng đang chọn.",
            );
            data.reload();
          }}
        />
      )}
    </>
  );
}
