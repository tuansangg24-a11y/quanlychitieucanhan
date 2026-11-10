export function dataError(error, action = "save") {
  if (error?.code === "PGRST205" || error?.code === "42P01")
    return "Chưa tìm thấy bảng dữ liệu của ứng dụng trong Supabase. Hãy chạy supabase/schema.sql trong SQL Editor của đúng dự án, rồi bấm tải lại.";
  if (error?.code === "PGRST204" || error?.code === "42703")
    return "Cấu trúc cơ sở dữ liệu chưa khớp với ứng dụng. Hãy kiểm tra các cột theo supabase/schema.sql trước khi thử lại.";
  if (error?.code === "23503")
    return action === "delete-category"
      ? "Danh mục đang được dùng trong giao dịch hoặc ngân sách nên chưa thể xóa. Hãy chuyển dữ liệu sang danh mục khác trước."
      : "Danh mục đang được sử dụng hoặc đã thay đổi. Hãy tải lại và kiểm tra loại thu/chi.";
  if (error?.code === "23505")
    return "Tên danh mục này đã có trong cùng loại thu/chi. Hãy dùng tên khác.";
  if (error?.code === "23514" || error?.code === "22003")
    return "Dữ liệu chưa hợp lệ. Hãy kiểm tra số tiền và các trường đã nhập.";
  if (
    error?.code === "42501" ||
    error?.status === 401 ||
    error?.code === "PGRST301"
  )
    return "Phiên đăng nhập hoặc quyền truy cập không hợp lệ. Hãy đăng nhập lại.";
  if (error?.code === "PGRST116")
    return "Dữ liệu đã thay đổi hoặc không còn tồn tại. Hãy tải lại danh sách.";
  if (/fetch|network|offline/i.test(error?.message || ""))
    return "Không thể kết nối. Hãy kiểm tra mạng rồi thử lại.";
  return "Chưa thể tải hoặc lưu dữ liệu. Vui lòng thử lại sau.";
}
