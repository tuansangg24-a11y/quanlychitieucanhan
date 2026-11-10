# Sổ chi tiêu cá nhân

Ứng dụng web tiếng Việt giúp ghi chép thu chi, xem thống kê theo tháng và theo dõi ngân sách cho từng danh mục. Giao diện hỗ trợ máy tính, điện thoại và cài đặt dưới dạng PWA.

**[Mở ứng dụng](https://so-chi-tieu-delta.vercel.app)** · **[Mã nguồn](https://github.com/tuansangg24-a11y/quanlychitieucanhan)**

Ứng dụng yêu cầu đăng ký hoặc đăng nhập bằng email. Mỗi tài khoản quản lý dữ liệu riêng.

## Tính năng

- **Tài khoản:** đăng ký, đăng nhập, đăng xuất và duy trì phiên qua Supabase Auth.
- **Tổng quan:** tổng thu, tổng chi, số dư trong tháng, so sánh với tháng trước; biểu đồ chi theo danh mục và thu chi theo ngày.
- **Giao dịch:** thêm, sửa, xóa khoản thu/chi; lọc theo ghi chú, tháng, danh mục, loại giao dịch và khoảng tiền; phân trang kết quả.
- **Danh mục:** tùy chỉnh tên, màu sắc, biểu tượng và loại thu/chi. Tài khoản mới được tạo sẵn 10 danh mục.
- **Ngân sách:** đặt hạn mức theo danh mục chi cho từng tháng; cảnh báo từ 80% và khi vượt hạn mức.
- **Xuất CSV:** xuất toàn bộ kết quả theo bộ lọc, hỗ trợ tiếng Việt và xử lý nội dung có thể trở thành công thức khi mở bằng Excel.
- **PWA:** cài lên màn hình chính, mở khung giao diện khi ngoại tuyến và thông báo khi có phiên bản mới.

Số tiền được nhập bằng VND nguyên dương, tối đa 15 chữ số. Số dư trên trang Tổng quan là thu trừ chi của tháng đang chọn.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện | React 18, React Router 6, Tailwind CSS 3 |
| Công cụ phát triển | Vite 6, JavaScript |
| Xác thực và dữ liệu | Supabase Auth, PostgreSQL, Row Level Security |
| Biểu đồ và ngày tháng | Recharts 3, date-fns 4 |
| PWA | vite-plugin-pwa, Workbox |
| Triển khai | Vercel |

## Chạy trên máy

### 1. Cài đặt

Yêu cầu Node.js **22.12 trở lên** và pnpm. Dự án có `pnpm-lock.yaml` để cài đúng phiên bản phụ thuộc.

```sh
git clone https://github.com/tuansangg24-a11y/quanlychitieucanhan.git
cd quanlychitieucanhan
pnpm install --frozen-lockfile
```

### 2. Thiết lập Supabase

1. Tạo một project Supabase mới.
2. Trong SQL Editor, chạy toàn bộ [supabase/schema.sql](supabase/schema.sql) **một lần**, trước khi đăng ký tài khoản trong ứng dụng.
3. Bật đăng nhập Email trong phần cấu hình Authentication. Nên bật xác nhận email.
4. Đặt Site URL thành `http://localhost:5173` và thêm Redirect URL `http://localhost:5173/app`.

Nếu tài khoản đã được tạo trước khi cài schema, chạy thêm [supabase/backfill-default-categories.sql](supabase/backfill-default-categories.sql) để bổ sung danh mục cho tài khoản chưa có danh mục.

**Với project đã có các bảng của ứng dụng, giữ cấu hình và dữ liệu hiện tại; không chạy lại script tạo schema.**

### 3. Cấu hình môi trường

Sao chép `.env.example` thành `.env.local` nếu chưa có tệp cấu hình. Trên PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Điền URL và khóa anon công khai của project Supabase:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Các biến `VITE_*` được đưa vào mã chạy trên trình duyệt. Chỉ dùng khóa anon công khai; không dùng `service_role` hoặc khóa bí mật. Tệp `.env.local` đã được loại khỏi Git. Nếu cùng có `.env` và `.env.local`, Vite ưu tiên `.env.local`.

### 4. Khởi động

```sh
pnpm dev
```

Mở [http://localhost:5173](http://localhost:5173). Khởi động lại máy chủ phát triển sau khi đổi biến môi trường.

## Các lệnh thường dùng

| Lệnh | Chức năng |
| --- | --- |
| `pnpm dev` | Chạy môi trường phát triển |
| `pnpm test` | Chạy kiểm tra tự động |
| `pnpm build` | Tạo bản production trong `dist/` |
| `pnpm preview` | Xem thử bản production |

Preview mặc định chạy tại `http://localhost:4173`. Thêm `http://localhost:4173/app` vào Redirect URLs trong Supabase nếu kiểm tra luồng xác nhận email ở địa chỉ này.

Các bài kiểm tra hiện có bao gồm xử lý tiền VND, ngày/tháng, kiểm tra giao dịch, tìm kiếm, CSV, thống kê, ngưỡng ngân sách và thông báo lỗi dữ liệu. Kiểm tra tự động không thay thế việc kiểm tra đăng nhập, xác nhận email và phân quyền trên project Supabase thật.

## Cấu trúc dự án

```text
public/icons/       Biểu tượng ứng dụng và PWA
src/
  auth/             Quản lý phiên đăng nhập
  components/       Biểu mẫu, biểu đồ và thành phần giao diện
  data/             Trạng thái và tải dữ liệu
  lib/              Supabase, API, xử lý tiền, thống kê và CSV
  pages/            Tổng quan, giao dịch, danh mục, ngân sách
supabase/           Schema, policy và script bổ sung danh mục
tests/              Kiểm tra tự động
vercel.json         Cấu hình build và định tuyến SPA
vite.config.js      Cấu hình Vite và PWA
```

## Dữ liệu và phân quyền

Ba bảng chính là `categories`, `transactions` và `budgets`. Mỗi bản ghi gắn với người dùng; các policy Row Level Security kiểm tra quyền đọc và ghi theo `auth.uid()`.

Khóa ngoại ràng buộc danh mục và giao dịch cùng chủ sở hữu, cùng loại thu/chi. Ngân sách chỉ áp dụng cho danh mục chi. Danh mục đang được tham chiếu không thể bị xóa hoặc đổi loại; xóa ngân sách không xóa giao dịch.

Khi tự triển khai, cần kiểm tra bằng hai tài khoản độc lập để xác nhận mỗi tài khoản chỉ truy cập được dữ liệu của mình. Việc ẩn trang sau đăng nhập không thay thế phân quyền tại cơ sở dữ liệu.

## Triển khai

Dự án đã có `vercel.json` với thư mục đầu ra `dist` và rewrite về `index.html` cho các đường dẫn React Router.

Khi triển khai trên Vercel:

1. Import kho mã nguồn và chọn Node.js 22.
2. Cấu hình `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong Environment Variables.
3. Dùng lệnh cài `pnpm install --frozen-lockfile`, lệnh build `pnpm run build`, output `dist`.
4. Trong Supabase, đặt Site URL theo tên miền triển khai và thêm Redirect URL tương ứng với đường dẫn `/app`.
5. Kiểm tra đăng nhập, xác nhận email, tải trực tiếp các trang `/app/*` và tài nguyên PWA.

## Cài ứng dụng lên điện thoại

Mở ứng dụng qua HTTPS. Trên Chrome/Edge/Android, dùng nút **Cài ứng dụng** khi trình duyệt hỗ trợ hoặc menu cài đặt của trình duyệt. Trên iPhone, mở bằng Safari rồi chọn **Chia sẻ → Thêm vào Màn hình chính**.

PWA chỉ hoạt động trong bản production. Service worker lưu tài nguyên giao diện, không cache dữ liệu Supabase. **Cần kết nối mạng để tải và lưu giao dịch**; chưa hỗ trợ hàng đợi ghi dữ liệu ngoại tuyến.

Khi có phiên bản mới, ứng dụng hỏi **Cập nhật / Để sau**. Nên lưu hoặc đóng biểu mẫu trước khi cập nhật.

## Giới hạn hiện tại

- Dữ liệu chưa đồng bộ Realtime giữa các thiết bị; dùng Làm mới hoặc tải lại trang để nhận thay đổi.
- Xuất CSV đọc qua nhiều request, không phải ảnh chụp dữ liệu tại một thời điểm; tránh sửa đồng thời khi xuất tập dữ liệu lớn.
- Cài đặt PWA và xác nhận email cần được kiểm tra trên trình duyệt, thiết bị và tên miền thực tế.

## Xử lý lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
| --- | --- |
| Thông báo chưa cấu hình Supabase | Kiểm tra hai biến môi trường và khởi động lại Vite; với bản triển khai, build lại sau khi đổi biến |
| Lỗi `PGRST205` | Kiểm tra đúng project URL và sự tồn tại của các bảng; chỉ cài schema khi project chưa có bảng |
| Liên kết xác nhận email chuyển sai địa chỉ | Kiểm tra Site URL và Redirect URLs trong Supabase |
| Tải trực tiếp trang con bị lỗi 404 | Kiểm tra hosting đã rewrite đường dẫn SPA về `index.html` |
| Không thấy nút cài PWA | Dùng HTTPS và bản production; kiểm tra tùy chọn cài trong menu trình duyệt |
