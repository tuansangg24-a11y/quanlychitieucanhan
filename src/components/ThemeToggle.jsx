import { useEffect, useState } from "react";
export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("finance-theme") || "system",
  );
  useEffect(() => {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    localStorage.setItem("finance-theme", theme);
  }, [theme]);
  return (
    <label className="flex items-center gap-2 text-xs muted">
      Giao diện
      <select
        aria-label="Giao diện"
        style={{ margin: 0, padding: "8px", minHeight: 44, width: "auto" }}
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
      >
        <option value="system">Theo thiết bị</option>
        <option value="light">Sáng</option>
        <option value="dark">Tối</option>
      </select>
    </label>
  );
}
