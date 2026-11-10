import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { formatMoney } from "../lib/finance";
export default function ExpenseCharts({ stats, transactions, month }) {
  const days = stats.days.map((day) => ({
    ...day,
    income: transactions
      .filter((t) => t.date === day.date && t.type === "income")
      .reduce((n, t) => n + Number(t.amount), 0),
  }));
  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <section className="min-w-0">
        <h2 className="section-title">Chi theo danh mục</h2>
        {!stats.byCategory.length ? (
          <p className="muted mt-5 text-sm">
            Chưa có khoản chi. Bấm “Ghi giao dịch” để bắt đầu.
          </p>
        ) : (
          <ul className="mt-4 space-y-1">
            {stats.byCategory.map((item) => (
              <li key={item.id}>
                <Link
                  className="block py-3 rounded-lg"
                  to={`/app/giao-dich?category=${encodeURIComponent(item.id)}&month=${month}`}
                >
                  <div className="flex justify-between gap-3 text-sm">
                    <span>
                      {item.emoji} {item.name}
                    </span>
                    <span className="row-amount">
                      {formatMoney(item.total)}
                    </span>
                  </div>
                  <div className="category-bar">
                    <span
                      style={{
                        width: `${Number((item.total * 100n) / stats.expense)}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="min-w-0">
        <h2 className="section-title">Thu chi theo ngày</h2>
        <p className="text-xs muted mt-2">
          Đơn vị: đồng · Cuộn ngang để xem cả tháng
        </p>
        <p className="text-xs my-3">
          <span className="income">▰ Thu nhập</span>{" "}
          <span className="ml-4" style={{ color: "var(--expense)" }}>
            ▰ Chi tiêu
          </span>
        </p>
        <div
          className="chart-scroll"
          role="img"
          aria-label={`Thu ${formatMoney(stats.income)}, chi ${formatMoney(stats.expense)}. Xem bảng số liệu bên dưới.`}
        >
          <div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1e6 ? `${v / 1e6} tr` : `${v / 1000}k`
                  }
                  width={65}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  labelFormatter={(v) => `Ngày ${v}`}
                  formatter={(v, name) => [formatMoney(v), name]}
                />
                <Bar
                  name="Thu nhập"
                  dataKey="income"
                  fill="var(--income)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  name="Chi tiêu"
                  dataKey="value"
                  fill="var(--expense)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <details className="mt-3 text-sm">
          <summary className="text-button cursor-pointer">
            Xem số liệu từng ngày
          </summary>
          <ul className="max-h-52 overflow-auto">
            {days.map((d) => (
              <li
                key={d.date}
                className="py-2 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                Ngày {d.day} · Thu {formatMoney(d.income)} · Chi{" "}
                {formatMoney(d.total)}
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
