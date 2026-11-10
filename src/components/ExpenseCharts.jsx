import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "../lib/finance";

function compactMoney(value) {
  if (value >= 1e9) return `${Number((value / 1e9).toFixed(1))} tỷ`;
  if (value >= 1e6) return `${Number((value / 1e6).toFixed(1))} tr`;
  if (value >= 1e3) return `${Number((value / 1e3).toFixed(1))}k`;
  return value;
}
export default function ExpenseCharts({ stats }) {
  if (stats.expense === 0n)
    return (
      <section className="panel p-8 text-center">
        <p className="text-3xl" aria-hidden="true">
          🌿
        </p>
        <h2 className="mt-4 font-semibold">Tháng này chưa có khoản chi</h2>
        <p className="mt-2 text-sm text-stone-500">
          Biểu đồ sẽ xuất hiện khi bạn ghi giao dịch chi tiêu.
        </p>
      </section>
    );
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="panel min-w-0 p-5">
        <h2 className="font-semibold">Chi theo danh mục</h2>
        <div
          className="mt-4 h-64 w-full"
          role="img"
          aria-label="Biểu đồ tròn chi tiêu theo danh mục. Chi tiết ở danh sách bên dưới."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.byCategory}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={2}
                isAnimationActive={false}
              >
                {stats.byCategory.map((item) => (
                  <Cell key={item.id} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(_value, _name, entry) => [
                  formatMoney(entry.payload.total),
                  "Đã chi",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 space-y-3">
          {stats.byCategory.map((item) => (
            <li
              key={item.id}
              className="flex min-w-0 items-baseline justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="break-words">
                  {item.emoji} {item.name}
                </span>
              </span>
              <span className="shrink-0 font-medium">
                {formatMoney(item.total)}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel min-w-0 p-5">
        <h2 className="font-semibold">Chi theo ngày</h2>
        <p className="mt-2 text-xs text-stone-500">
          Đơn vị: VND · Chạm vào cột để xem số tiền.
        </p>
        <div
          className="mt-6 h-72 w-full"
          role="img"
          aria-label="Biểu đồ cột chi tiêu theo ngày trong tháng."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.days}
              margin={{ top: 12, right: 0, bottom: 0, left: -8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={12}
              />
              <YAxis
                tickFormatter={compactMoney}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={62}
              />
              <Tooltip
                labelFormatter={(label) => `Ngày ${label}`}
                formatter={(_value, _name, entry) => [
                  formatMoney(entry.payload.total),
                  "Đã chi",
                ]}
              />
              <Bar
                dataKey="value"
                fill="#166534"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-emerald-800">
            Xem số liệu từng ngày
          </summary>
          <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto">
            {stats.days.map((day) => (
              <li key={day.date} className="flex justify-between gap-3">
                <span>Ngày {day.day}</span>
                <span>{formatMoney(day.total)}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
