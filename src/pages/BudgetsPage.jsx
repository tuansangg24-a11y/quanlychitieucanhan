import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../data/DataProvider";
import useMonthData from "../data/useMonthData";
import { deleteRow } from "../lib/api";
import { formatMoney, todayVN } from "../lib/finance";
import { summarizeMonth } from "../lib/statistics";
import MonthPicker from "../components/MonthPicker";
import BudgetMeter from "../components/BudgetMeter";
import BudgetForm from "../components/BudgetForm";
import ConfirmDelete from "../components/ConfirmDelete";
import Feedback from "../components/Feedback";

export default function BudgetsPage() {
  const { userId, categories } = useData();
  const [month, setMonth] = useState(() => todayVN().slice(0, 7));
  const data = useMonthData(month);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState("");
  const stats = summarizeMonth(data.transactions, categories, month);
  const byId = new Map(categories.map((category) => [category.id, category]));
  const available = categories.some(
    (category) =>
      category.type === "expense" &&
      !data.budgets.some((budget) => budget.category_id === category.id),
  );
  const totalLimit = data.budgets.reduce(
    (sum, budget) => sum + BigInt(budget.amount),
    0n,
  );
  const budgetedSpend = data.budgets.reduce(
    (sum, budget) => sum + (stats.categoryTotals.get(budget.category_id) || 0n),
    0n,
  );
  function saved() {
    setEditor(null);
    setNotice("Đã lưu ngân sách.");
    data.reload();
  }
  function deleted() {
    setDeleting(null);
    setNotice("Đã xóa hạn mức. Các giao dịch được giữ nguyên.");
    data.reload();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Chủ động từng khoản chi</p>
          <h1>Ngân sách</h1>
          <p className="mt-2 text-stone-500">
            Hạn mức riêng cho mỗi danh mục, mỗi tháng.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => setEditor({})}
          disabled={data.loading || !!data.error || !available}
        >
          + Đặt ngân sách
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
        <p role="status">Đang tải ngân sách…</p>
      ) : data.error ? (
        <section className="space-y-4">
          <Feedback error>{data.error}</Feedback>
          <button className="secondary" onClick={data.reload}>
            Thử lại
          </button>
        </section>
      ) : (
        <>
          {data.budgets.length > 0 && (
            <section className="panel mb-6 grid gap-5 p-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-stone-500">Tổng hạn mức đã đặt</p>
                <p className="mt-2 break-words text-2xl font-semibold">
                  {formatMoney(totalLimit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-stone-500">
                  Chi trong các danh mục có ngân sách
                </p>
                <p className="mt-2 break-words text-2xl font-semibold">
                  {formatMoney(budgetedSpend)}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Tổng chi cả tháng: {formatMoney(stats.expense)}
                </p>
              </div>
            </section>
          )}
          {data.budgets.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.budgets.map((budget) => {
                const category = byId.get(budget.category_id);
                return (
                  <li key={budget.id} className="panel min-w-0 p-5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden="true">
                        {category?.emoji || "📌"}
                      </span>
                      <div className="min-w-0">
                        <h2 className="break-words font-semibold">
                          {category?.name || "Danh mục khác"}
                        </h2>
                        <p className="mt-1 text-xs text-stone-500">
                          Hạn mức {formatMoney(budget.amount)}
                        </p>
                      </div>
                    </div>
                    <BudgetMeter
                      spent={stats.categoryTotals.get(budget.category_id) || 0n}
                      limit={budget.amount}
                      name={category?.name || "Danh mục"}
                    />
                    <div className="mt-4 flex justify-end gap-2 border-t border-stone-100 pt-2">
                      <button
                        className="text-button"
                        aria-label={`Sửa ngân sách ${category?.name}`}
                        onClick={() => setEditor({ budget })}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-button text-red-700"
                        aria-label={`Xóa ngân sách ${category?.name}`}
                        onClick={() => setDeleting(budget)}
                      >
                        Xóa
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <section className="panel p-9 text-center">
              <p className="text-3xl" aria-hidden="true">
                🎯
              </p>
              <h2 className="mt-4 font-semibold">
                Chưa đặt ngân sách tháng này
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Bắt đầu từ một danh mục bạn muốn theo dõi sát hơn.
              </p>
              {available ? (
                <button className="primary mt-5" onClick={() => setEditor({})}>
                  Đặt ngân sách đầu tiên
                </button>
              ) : (
                <Link
                  className="mt-5 inline-block text-emerald-800 underline"
                  to="/app/danh-muc"
                >
                  Thêm danh mục chi tiêu
                </Link>
              )}
            </section>
          )}
          <p className="mt-5 text-xs leading-6 text-stone-500">
            Vàng từ 80%, đỏ khi vượt 100%. Hạn mức chỉ nhắc nhở, không ngăn bạn
            ghi giao dịch.
          </p>
        </>
      )}
      {editor && (
        <BudgetForm
          budget={editor.budget}
          month={month}
          budgets={data.budgets}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title="Xóa ngân sách?"
          description="Xóa hạn mức của danh mục trong tháng này? Giao dịch và các tháng khác được giữ nguyên."
          onClose={() => setDeleting(null)}
          action={() => deleteRow("budgets", userId, deleting.id)}
          onDeleted={deleted}
        />
      )}
    </>
  );
}
