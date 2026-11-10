import Toast from "../components/Toast";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { readDemo } from "../lib/localData";
import { exportTransactions } from "../lib/api";
import { useEffect, useState } from "react";
import { useData } from "../data/DataProvider";
import { deleteRow } from "../lib/api";
import { typeLabel } from "../lib/finance";
import CategoryForm from "../components/CategoryForm";
import ConfirmDelete from "../components/ConfirmDelete";
import Feedback from "../components/Feedback";

export default function CategoriesPage() {
  const { userId, categories, reload, loading } = useData();
  const { demo } = useAuth();
  const [usage, setUsage] = useState(null);
  const [usageError, setUsageError] = useState("");
  const [usageRevision, setUsageRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setUsage(null);
    setUsageError("");
    async function checkUsage() {
      const transactions = await exportTransactions(
        userId,
        { month: "", search: "", min: "", max: "" },
        controller.signal,
      );
      const used = new Set(transactions.map((row) => row.category_id));
      if (demo) {
        const data = readDemo();
        [...data.budgets, ...(data.recurring_transactions || [])].forEach(
          (row) => used.add(row.category_id),
        );
      } else {
        await Promise.all(
          categories.map(async (category) => {
            for (const table of ["budgets", "recurring_transactions"]) {
              const result = await supabase
                .from(table)
                .select("id")
                .eq("user_id", userId)
                .eq("category_id", category.id)
                .limit(1)
                .abortSignal(controller.signal);
              if (result.error) throw result.error;
              if (result.data.length) {
                used.add(category.id);
                break;
              }
            }
          }),
        );
      }
      if (!controller.signal.aborted) setUsage(used);
    }
    checkUsage().catch(() => {
      if (!controller.signal.aborted)
        setUsageError(
          "Chưa kiểm tra được danh mục đang dùng. Kết nối mạng rồi thử lại trước khi xóa.",
        );
    });
    return () => controller.abort();
  }, [userId, categories, demo, usageRevision]);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState("");
  const [type, setType] = useState("expense");
  const visible = categories.filter((category) => category.type === type);
  function saved() {
    setEditor(null);
    setNotice("Đã lưu danh mục.");
    reload();
  }
  function deleted() {
    setDeleting(null);
    setNotice("Đã xóa danh mục.");
    reload();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sắp xếp theo cách của bạn</p>
          <h1>Danh mục</h1>
          <p className="mt-2 text-stone-500">
            Mỗi khoản thu chi đều có một chỗ riêng.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setNotice("");
            setEditor({});
          }}
          disabled={loading}
        >
          + Thêm danh mục
        </button>
      </div>
      {usageError && (
        <div className="mb-4">
          <Feedback error>{usageError}</Feedback>
          <button
            className="text-button"
            onClick={() => setUsageRevision((v) => v + 1)}
          >
            Thử lại
          </button>
        </div>
      )}
      {notice && <Toast onClose={() => setNotice("")}>{notice}</Toast>}
      <div
        className="mb-6 flex gap-2"
        role="group"
        aria-label="Lọc loại danh mục"
      >
        {["expense", "income"].map((value) => (
          <button
            key={value}
            className={type === value ? "primary" : "secondary"}
            aria-pressed={type === value}
            onClick={() => setType(value)}
          >
            {typeLabel(value)}{" "}
            <span className="ml-2 opacity-60">
              {categories.filter((category) => category.type === value).length}
            </span>
          </button>
        ))}
      </div>
      {loading && (
        <p role="status" className="mb-4 text-sm text-stone-500">
          Đang cập nhật danh mục…
        </p>
      )}
      {visible.length ? (
        <ul className="category-list">
          {visible.map((category) => (
            <li key={category.id} className="panel min-w-0 p-5">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
                  style={{ backgroundColor: `${category.color}20` }}
                  aria-hidden="true"
                >
                  {category.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="break-words font-semibold">{category.name}</h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {typeLabel(category.type)}
                  </p>
                </div>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t border-stone-100 pt-3">
                <button
                  className="text-button"
                  onClick={() => {
                    setNotice("");
                    setEditor({ category });
                  }}
                  aria-label={`Sửa danh mục ${category.name}`}
                >
                  Sửa
                </button>
                <button
                  className="text-button text-red-700"
                  onClick={() => {
                    setNotice("");
                    setDeleting(category);
                  }}
                  disabled={!usage || usage.has(category.id)}
                  title={
                    usage?.has(category.id)
                      ? "Danh mục đang có giao dịch, hạn mức hoặc lịch định kỳ nên không thể xóa"
                      : !usage
                        ? "Đang kiểm tra danh mục"
                        : undefined
                  }
                  aria-describedby={`usage-${category.id}`}
                  aria-label={`Xóa danh mục ${category.name}`}
                >
                  Xóa
                </button>
              </div>
              {(!usage || usage.has(category.id)) && (
                <p
                  id={`usage-${category.id}`}
                  className="text-xs muted text-right mt-1"
                >
                  {usage?.has(category.id)
                    ? "Đang có giao dịch, hạn mức hoặc lịch định kỳ · Không thể xóa"
                    : "Chờ kiểm tra trước khi xóa"}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <section className="panel p-10 text-center">
          <h2 className="mt-4 font-semibold">
            Chưa có danh mục {type === "income" ? "thu" : "chi"}
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Thêm danh mục đầu tiên để bắt đầu ghi giao dịch.
          </p>
          <button className="primary mt-4" onClick={() => setEditor({})}>
            Thêm danh mục
          </button>
        </section>
      )}
      {editor && (
        <CategoryForm
          category={editor.category}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {deleting && (
        <ConfirmDelete
          category
          title="Xóa danh mục?"
          description={`Bạn muốn xóa “${deleting.name}”? Danh mục đang có giao dịch hoặc ngân sách sẽ không bị xóa.`}
          onClose={() => setDeleting(null)}
          action={() => deleteRow("categories", userId, deleting.id)}
          onDeleted={deleted}
        />
      )}
    </>
  );
}
