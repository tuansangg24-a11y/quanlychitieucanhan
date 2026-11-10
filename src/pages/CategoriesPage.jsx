import { useState } from "react";
import { useData } from "../data/DataProvider";
import { deleteRow } from "../lib/api";
import { typeLabel } from "../lib/finance";
import CategoryForm from "../components/CategoryForm";
import ConfirmDelete from "../components/ConfirmDelete";
import Feedback from "../components/Feedback";

export default function CategoriesPage() {
  const { userId, categories, reload, loading } = useData();
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
      {notice && (
        <div className="mb-5">
          <Feedback>{notice}</Feedback>
        </div>
      )}
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  aria-label={`Xóa danh mục ${category.name}`}
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <section className="panel p-10 text-center">
          <p className="text-3xl" aria-hidden="true">
            📂
          </p>
          <h2 className="mt-4 font-semibold">
            Chưa có danh mục {type === "income" ? "thu" : "chi"}
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Thêm danh mục đầu tiên để bắt đầu ghi giao dịch.
          </p>
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
