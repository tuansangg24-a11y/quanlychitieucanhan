import Toast from "../components/Toast";
import { useEffect, useRef, useState } from "react";
import Modal from "../components/Modal";
import Skeleton from "../components/Skeleton";
import { Link } from "react-router-dom";
import { useData } from "../data/DataProvider";
import { deleteRow, exportTransactions, PAGE_SIZE } from "../lib/api";
import { dataError } from "../lib/dataError";
import { downloadCsv, makeCsv } from "../lib/csv";
import {
  formatDate,
  formatMoney,
  normalizeFilters,
  todayVN,
  typeLabel,
} from "../lib/finance";
import Feedback from "../components/Feedback";
import TransactionForm from "../components/TransactionForm";
import ConfirmDelete from "../components/ConfirmDelete";

const initialFilters = () => ({
  search: "",
  month: todayVN().slice(0, 7),
  category: "",
  type: "",
  min: "",
  max: "",
});

export default function TransactionsPage() {
  const {
    syncRevision,
    userId,
    categories,
    loading: categoriesLoading,
  } = useData();
  const seededFilters = () => ({
    ...initialFilters(),
    category: new URLSearchParams(window.location.search).get("category") || "",
    month:
      new URLSearchParams(window.location.search).get("month") ||
      initialFilters().month,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState(seededFilters);
  const [filters, setFilters] = useState(seededFilters);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [dayTotals, setDayTotals] = useState(new Map());
  const [result, setResult] = useState({ rows: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const exportController = useRef(null);
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );
  useEffect(() => () => exportController.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    exportTransactions(userId, filters, controller.signal)
      .then((allRows) => {
        const data = {
          rows: allRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
          count: allRows.length,
        };
        if (controller.signal.aborted) return;
        const totals = new Map();
        allRows
          .filter((row) => row.type === "expense")
          .forEach((row) =>
            totals.set(
              row.date,
              (totals.get(row.date) || 0n) + BigInt(row.amount),
            ),
          );
        setDayTotals(totals);
        const lastPage = Math.max(0, Math.ceil(data.count / PAGE_SIZE) - 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setResult((current) => ({
          ...data,
          rows:
            page === 0
              ? data.rows
              : [
                  ...current.rows.filter(
                    (row) => !data.rows.some((next) => next.id === row.id),
                  ),
                  ...data.rows,
                ],
        }));
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(dataError(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [userId, filters, page, revision, syncRevision]);

  function changeFilter(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "type" ? { category: "" } : {}),
    }));
  }
  function applyFilters(event) {
    event.preventDefault();
    try {
      const next = normalizeFilters(draft);
      setFilterError("");
      setFilters(next);
      setFilterOpen(false);
      setPage(0);
      setNotice("");
    } catch (failure) {
      setFilterError(failure.message);
    }
  }
  function resetFilters() {
    const next = { ...initialFilters(), month: "" };
    setDraft(next);
    setFilters(next);
    setPage(0);
    setFilterError("");
    setNotice("");
  }
  useEffect(() => {
    setPage(0);
  }, [syncRevision]);
  function saved(payload) {
    setPage(0);
    setEditor(null);
    setNotice("Đã lưu giao dịch");
    setRevision((value) => value + 1);
  }
  function deleted() {
    setPage(0);
    setDeleting(null);
    setNotice("Đã xóa giao dịch.");
    setRevision((value) => value + 1);
  }
  async function exportCsv() {
    if (exporting) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    setExportError("");
    try {
      const rows = await exportTransactions(userId, filters, controller.signal);
      if (controller.signal.aborted) return;
      downloadCsv(
        makeCsv(rows, categories),
        `giao-dich-${filters.month || "tat-ca"}-${todayVN()}.csv`,
      );
      setNotice(`Đã xuất ${rows.length} giao dịch theo bộ lọc đã áp dụng.`);
    } catch (failure) {
      if (!controller.signal.aborted) setExportError(dataError(failure));
    } finally {
      if (!controller.signal.aborted) setExporting(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Ghi lại để hiểu rõ hơn</p>
          <h1>Giao dịch</h1>
          <p className="mt-2 text-stone-500">
            Một vài giây hôm nay, một thói quen tốt mỗi ngày.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setNotice("");
            setEditor({});
          }}
          disabled={categoriesLoading}
        >
          + Thêm giao dịch
        </button>
      </div>
      {filterError && !filterOpen && <Feedback error>{filterError}</Feedback>}
      {notice && <Toast onClose={() => setNotice("")}>{notice}</Toast>}
      {!categories.length && !categoriesLoading && (
        <div className="mb-5">
          <Feedback>
            Bạn chưa có danh mục.{" "}
            <Link to="/app/danh-muc" className="font-semibold underline">
              Tạo danh mục
            </Link>{" "}
            trước khi ghi giao dịch.
          </Feedback>
        </div>
      )}
      <form className="filter-toolbar" onSubmit={applyFilters}>
        <input
          aria-label="Tìm trong ghi chú"
          type="search"
          placeholder="Tìm trong ghi chú…"
          value={draft.search}
          onChange={(e) => changeFilter("search", e.target.value)}
        />
        <button className="secondary shrink-0" type="submit">
          Tìm
        </button>
        <button
          className="secondary shrink-0"
          type="button"
          onClick={() => setFilterOpen(true)}
        >
          Bộ lọc ·{" "}
          {
            Object.entries(filters).filter(
              ([k, v]) => k !== "search" && v !== "" && v !== null,
            ).length
          }
        </button>
      </form>
      {filterOpen && (
        <Modal title="Lọc giao dịch" onClose={() => setFilterOpen(false)}>
          <form
            onSubmit={applyFilters}
            className="space-y-4"
            aria-label="Bộ lọc giao dịch"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="field">
                Tìm trong ghi chú
                <input
                  type="search"
                  placeholder="Cà phê, bữa trưa…"
                  maxLength={2000}
                  value={draft.search}
                  onChange={(event) =>
                    changeFilter("search", event.target.value)
                  }
                />
              </label>
              <label className="field">
                Tháng
                <input
                  type="month"
                  value={draft.month}
                  onChange={(event) =>
                    changeFilter("month", event.target.value)
                  }
                />
              </label>
              <label className="field">
                Loại
                <select
                  aria-label="Loại"
                  value={draft.type}
                  onChange={(event) => changeFilter("type", event.target.value)}
                >
                  <option value="">Tất cả thu / chi</option>
                  <option value="expense">Chi tiêu</option>
                  <option value="income">Thu nhập</option>
                </select>
              </label>
              <label className="field">
                Danh mục
                <select
                  aria-label="Danh mục"
                  value={draft.category}
                  onChange={(event) =>
                    changeFilter("category", event.target.value)
                  }
                >
                  <option value="">Tất cả danh mục</option>
                  {categories
                    .filter(
                      (category) => !draft.type || category.type === draft.type,
                    )
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.name} ·{" "}
                        {typeLabel(category.type)}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                Số tiền từ (VND)
                <input
                  inputMode="numeric"
                  pattern="[0-9]{0,15}"
                  maxLength={15}
                  placeholder="0"
                  value={draft.min}
                  onChange={(event) => changeFilter("min", event.target.value)}
                />
              </label>
              <label className="field">
                Số tiền đến (VND)
                <input
                  inputMode="numeric"
                  pattern="[0-9]{0,15}"
                  maxLength={15}
                  placeholder="Không giới hạn"
                  value={draft.max}
                  onChange={(event) => changeFilter("max", event.target.value)}
                />
              </label>
            </div>
            {filterError && <Feedback error>{filterError}</Feedback>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="primary">
                Áp dụng bộ lọc
              </button>
              <button
                type="button"
                className="text-button"
                onClick={resetFilters}
              >
                Xóa bộ lọc
              </button>
              <p className="text-xs text-stone-500 sm:ml-auto">
                Để trống tháng để xem tất cả thời gian.
              </p>
            </div>
          </form>
        </Modal>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">
          Lịch sử giao dịch{" "}
          {!loading && !error && (
            <span className="ml-2 text-sm font-normal text-stone-500">
              {result.count} giao dịch
            </span>
          )}
        </h2>
        <details className="relative">
          <summary
            className="text-button cursor-pointer"
            aria-label="Tùy chọn giao dịch"
          >
            ⋯
          </summary>
          <button
            className="secondary"
            onClick={exportCsv}
            disabled={exporting || loading || !!error}
          >
            {exporting ? "Đang xuất…" : "Xuất CSV"}
          </button>
        </details>
      </div>
      {exportError && (
        <div className="mb-4">
          <Feedback error>{exportError}</Feedback>
        </div>
      )}
      {loading && page === 0 ? (
        <Skeleton label="Đang tải giao dịch…" />
      ) : error ? (
        <section className="panel space-y-4 p-6">
          <Feedback error>{error}</Feedback>
          <button
            className="secondary"
            onClick={() => setRevision((value) => value + 1)}
          >
            Thử lại
          </button>
        </section>
      ) : result.rows.length ? (
        <>
          <ul className="panel divide-y divide-stone-100">
            {result.rows.map((transaction, index) => {
              const category = categoriesById.get(transaction.category_id);
              return (
                <li key={transaction.id} className="p-4 sm:p-5">
                  {(index === 0 ||
                    result.rows[index - 1].date !== transaction.date) && (
                    <h3 className="flex flex-wrap justify-between gap-2 text-xs muted mb-4">
                      <time dateTime={transaction.date}>
                        {formatDate(transaction.date)}
                      </time>
                      <span>
                        Đã chi{" "}
                        {formatMoney(dayTotals.get(transaction.date) || 0n)}
                      </span>
                    </h3>
                  )}
                  <div className="flex gap-3">
                    <span
                      className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl"
                      style={{
                        backgroundColor: `${category?.color || "#64748B"}20`,
                      }}
                      aria-hidden="true"
                    >
                      {category?.emoji || "📌"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="break-words font-semibold">
                          {transaction.note ||
                            category?.name ||
                            "Danh mục không còn khả dụng"}
                        </h3>
                        <p
                          className={`whitespace-nowrap font-semibold tabular-nums ${transaction.type === "income" ? "text-emerald-700" : "text-stone-900"}`}
                        >
                          <span className="sr-only">
                            {typeLabel(transaction.type)}{" "}
                          </span>
                          {transaction.type === "income" ? "+" : "−"}
                          {formatMoney(transaction.amount)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        <time dateTime={transaction.date}>
                          {formatDate(transaction.date)}
                        </time>{" "}
                        · {category?.name} · {typeLabel(transaction.type)}{" "}
                        {(transaction.recurring_id ||
                          transaction.occurrence_date) && (
                          <span> · Định kỳ</span>
                        )}{" "}
                        {transaction.pending && (
                          <strong className="text-amber-800">
                            {" "}
                            · Chờ đồng bộ
                          </strong>
                        )}
                      </p>
                      <details className="mt-2 text-right">
                        <summary
                          className="inline-flex min-h-11 min-w-11 items-center justify-center cursor-pointer"
                          aria-label="Thao tác giao dịch"
                        >
                          ⋯
                        </summary>
                        <div className="flex justify-end gap-2">
                          <button
                            className="text-button"
                            aria-label={`Sửa giao dịch ${transaction.note || category?.name || ""} ngày ${formatDate(transaction.date)}`}
                            onClick={() => setEditor({ transaction })}
                          >
                            Sửa
                          </button>
                          <button
                            className="text-button text-red-700"
                            aria-label={`Xóa giao dịch ${transaction.note || category?.name || ""} ngày ${formatDate(transaction.date)}`}
                            onClick={() => setDeleting(transaction)}
                          >
                            Xóa
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 text-center">
            <p className="text-xs muted mb-3">
              Đã tải {result.rows.length} / {result.count} giao dịch
            </p>
            {result.rows.length < result.count && (
              <button
                className="secondary"
                disabled={loading}
                onClick={() => setPage((v) => v + 1)}
              >
                {loading ? "Đang tải…" : "Tải thêm"}
              </button>
            )}
          </div>
        </>
      ) : (
        <section className="panel p-10 text-center">
          <h2 className="mt-4 font-semibold">Chưa có giao dịch phù hợp</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
            Thử đổi bộ lọc hoặc thêm khoản thu, chi đầu tiên của bạn.
          </p>
          <button className="secondary mt-5" onClick={() => setEditor({})}>
            Thêm giao dịch đầu tiên
          </button>
        </section>
      )}
      {editor && (
        <TransactionForm
          transaction={editor.transaction}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title="Xóa giao dịch?"
          description={`Bạn muốn xóa khoản ${deleting.type === "income" ? "thu" : "chi"} ${formatMoney(deleting.amount)} ngày ${formatDate(deleting.date)}? Thao tác này không thể hoàn tác.`}
          onClose={() => setDeleting(null)}
          action={() => deleteRow("transactions", userId, deleting.id)}
          onDeleted={deleted}
        />
      )}
    </>
  );
}
