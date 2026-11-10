import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
let client = null;
let configurationError = "";
try {
  if (
    !url ||
    !key ||
    url.includes("your-project") ||
    key === "your-public-anon-key"
  ) {
    throw new Error("missing");
  }
  if (!["https:", "http:"].includes(new URL(url).protocol))
    throw new Error("url");
  // Public client only. Database authorization is enforced by RLS.
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} catch {
  configurationError =
    "Chưa kết nối được cấu hình Supabase. Hãy điền URL và khóa anon công khai trong .env rồi khởi động lại ứng dụng.";
}
export const supabase = client;
export const configError = configurationError;
