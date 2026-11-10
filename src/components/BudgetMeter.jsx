import { formatMoney } from "../lib/finance";
import { budgetProgress } from "../lib/statistics";

export default function BudgetMeter({ spent, limit, name }) {
  const progress = budgetProgress(spent, limit);
  const color =
    progress.state === "over"
      ? "bg-red-600"
      : progress.state === "warning"
        ? "bg-amber-500"
        : "bg-emerald-700";
  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          Đã chi <strong>{formatMoney(spent)}</strong>
        </span>
        <span className="text-stone-500">
          {progress.percentage.toLocaleString("vi-VN", {
            maximumFractionDigits: 1,
          })}
          %
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Ngân sách ${name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.width}
        aria-valuetext={`Đã dùng ${progress.percentage}% hạn mức`}
        className="h-2.5 overflow-hidden rounded-full bg-stone-100"
      >
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${progress.width}%` }}
        />
      </div>
      <p
        className={`text-xs ${progress.state === "over" ? "text-red-700" : progress.state === "warning" ? "text-amber-800" : "text-stone-500"}`}
      >
        {progress.state === "over"
          ? `Vượt hạn mức ${formatMoney(-progress.remaining)}`
          : progress.state === "warning"
            ? `Đã đạt ít nhất 80% · Còn ${formatMoney(progress.remaining)}`
            : `Còn ${formatMoney(progress.remaining)}`}
      </p>
    </div>
  );
}
