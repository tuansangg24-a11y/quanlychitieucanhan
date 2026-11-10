import { shiftMonth } from "../lib/statistics";

export default function MonthPicker({ month, onChange }) {
  return (
    <div
      className="flex min-w-0 items-center gap-2"
      role="group"
      aria-label="Chọn tháng"
    >
      <button
        type="button"
        className="secondary shrink-0"
        aria-label="Tháng trước"
        disabled={month <= "1900-01"}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        ←
      </button>
      <label className="min-w-0">
        <span className="sr-only">Tháng thống kê</span>
        <input
          className="mt-0 w-full"
          type="month"
          min="1900-01"
          max="2099-12"
          value={month}
          onChange={(event) => {
            const value = event.target.value;
            if (
              /^\d{4}-(0[1-9]|1[0-2])$/.test(value) &&
              value >= "1900-01" &&
              value <= "2099-12"
            )
              onChange(value);
          }}
        />
      </label>
      <button
        type="button"
        className="secondary shrink-0"
        aria-label="Tháng sau"
        disabled={month >= "2099-12"}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        →
      </button>
    </div>
  );
}
