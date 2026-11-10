# Thiết kế giao diện Sổ chi tiêu

Ngày: 10/11/2026. Phạm vi: components, trang, CSS và nội dung tiếng Việt. Giữ nguyên route, field, schema, các module lib/data/auth, API CRUD, hàng đợi và đồng bộ.

## Thiết kế

Điểm nhấn duy nhất: số tiền còn có thể chi, 40px. Tổng hạn mức danh mục trừ toàn bộ chi trong tháng; khi chưa có hạn mức, hiển thị thu trừ chi. Các khoản thu/chi khác trình bày thành hai cột đơn giản. Chi theo danh mục dùng thanh ngang, có biểu tượng và tên, liên kết tới bộ lọc giao dịch. Biểu đồ cột thu/chi cuộn trong khung và có số liệu văn bản.

Be Vietnam Pro từ Google Fonts, fallback system-ui. CSS variables quản lý sáng/tối; lựa chọn Theo thiết bị/Sáng/Tối lưu trên thiết bị. Màu danh mục dùng bộ màu Okabe-Ito kết hợp biểu tượng. Native dialog giữ focus, Esc và khôi phục focus; mobile hiện bottom sheet, desktop hiện dialog. Không thêm thư viện UI.

## Các bước đã triển khai và cần kiểm tra tay

| Bước | Tệp | Kết quả | Kiểm tra tay |
|---|---|---|---|
| Tokens/theme | styles.css, ThemeToggle.jsx, AppShell.jsx | Nền trung tính xanh, theme, sidebar/bottom nav, FAB | Sáng/tối, 360/390/1024/1440px, safe-area |
| Thành phần chung | Skeleton.jsx, Toast.jsx, Feedback.jsx, styles.css, BudgetMeter.jsx | Loading skeleton, toast, lỗi, dialog, tiến độ | Tab/Shift+Tab/Esc, đọc màn hình, reduced motion |
| Tổng quan | DashboardPage.jsx, ExpenseCharts.jsx | Số dư nổi bật, so sánh, thanh danh mục, thu/chi ngày, 5 giao dịch | Chuyển tháng, không ngân sách, vượt ngân sách, chạm danh mục |
| Ghi giao dịch | TransactionForm.jsx, AppShell.jsx | Bàn phím số, dấu chấm, cộng nhanh, nhớ danh mục theo tài khoản và loại, lưu dính đáy | Nhập một tay, bàn phím iOS/Android, 15 chữ số, lưu ngoài tháng đang xem |
| Giao dịch | TransactionsPage.jsx | Tìm cố định, sheet lọc, tổng ngày theo bộ lọc đầy đủ, tải thêm, menu sửa/xóa/CSV | Lọc kết hợp, tải thêm rồi sửa/xóa, CSV, xác nhận xóa |
| Ngân sách | BudgetsPage.jsx, BudgetMeter.jsx | Từng dòng, tổng hạn mức, ngưỡng bằng chữ, sửa qua sheet | Đúng 80%, đúng 100%, vượt 100%, chưa đặt hạn mức |
| Danh mục | CategoriesPage.jsx, CategoryForm.jsx | Bảng màu/biểu tượng, xem trước, khóa xóa khi có tham chiếu | Danh mục dùng bởi giao dịch, ngân sách tháng khác, lịch định kỳ; lỗi mạng khi kiểm tra |
| Tài khoản | App.jsx | Một cột, lợi ích rõ, demo, gửi lại xác nhận | Đăng ký/xác nhận email/đăng nhập trên Supabase thật |

## Xác minh

- pnpm test: 23/23 bài qua.
- pnpm build: tạo production và PWA thành công.
- Không sửa module lib, data, auth, route hay field.
- Trình duyệt tự động không mở được localhost/127.0.0.1 (navigation timeout). Chưa xác minh hình ảnh, responsive và tương tác trên thiết bị; không có ảnh chụp mới. Bảng trên là các kiểm tra cần thực hiện thực tế, không phải kết quả đã qua.
- Gửi lại xác nhận dùng Supabase Auth hiện có; cần kiểm tra rate limit/email thực tế.
- Khóa xóa danh mục có đọc tham chiếu qua Supabase hiện có, không sửa hợp đồng API hay dữ liệu.
