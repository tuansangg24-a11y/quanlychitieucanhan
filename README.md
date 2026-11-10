# Sổ chi tiêu — Giai đoạn 3

**Bản dùng thật:** [https://so-chi-tieu-delta.vercel.app](https://so-chi-tieu-delta.vercel.app). Đăng nhập bằng tài khoản Supabase hiện có; dữ liệu dùng chung với bản chạy trên máy. Phiên đăng nhập riêng theo địa chỉ nên cần đăng nhập lại trên tên miền mới.

React 18 + Vite + Tailwind CSS, JavaScript, React Router, date-fns, Recharts và Supabase JS. Đã có xác thực, giao dịch/danh mục, tìm kiếm/lọc, CSV, Dashboard, ngân sách và PWA.

## Giai đoạn 3: Tổng quan và ngân sách

- `/app` chuyển đến `/app/tong-quan`: tổng thu, tổng chi và số dư của tháng; biểu đồ tròn theo danh mục chi; biểu đồ cột theo ngày; số liệu văn bản bên dưới để đọc bằng bàn phím/trình đọc màn hình.
- Dùng nút tháng trước/sau hoặc ô tháng. Các thẻ so sánh với **toàn bộ tháng trước**, không phải cùng số ngày đã trôi qua. Nếu tháng trước bằng 0 sẽ không chia tỷ lệ phần trăm; vẫn hiển thị chênh lệch VND. Số dư là thu trừ chi trong tháng, không cộng dồn số dư cũ.
- Có thể thêm nhanh giao dịch ngay trên Tổng quan. Sau khi lưu, tổng hợp và ngân sách được tải lại; dữ liệu vẫn lọc theo tháng đang chọn.
- `/app/ngan-sach`: đặt/sửa/xóa hạn mức theo danh mục chi cho từng tháng. Danh mục đã có hạn mức tháng đó không được tạo trùng; mỗi tháng độc lập. Xóa hạn mức không xóa giao dịch.
- Thanh tiến độ: xanh dưới 80%, vàng từ 80% đến hết 100%, đỏ khi vượt 100%. Luôn có số tiền còn lại/vượt hạn mức và tỷ lệ thực tế; chiều dài thanh giới hạn 100%.
- Tổng hạn mức và chi trong danh mục có ngân sách hiển thị riêng với tổng chi cả tháng, để không nhầm khoản chi chưa đặt ngân sách.
- Tổng hợp đọc đầy đủ các trang dữ liệu trong từng tháng (không chỉ trang giao dịch đầu tiên). Tổng tiền và chênh lệch dùng số nguyên chính xác; đồ thị dùng giá trị số để vẽ, phần tiền bằng văn bản giữ chính xác.
- Không cần chạy thêm SQL cho Giai đoạn 3 nếu ba bảng đã được cài. Dùng nguyên bảng `budgets` và RLS hiện có. Tải lại/Làm mới để cập nhật thay đổi từ thiết bị khác.

## PWA: cài lên màn hình chính

### Triển khai HTTPS trên Vercel

Đã có `vercel.json` cho Vite và rewrite SPA để mở trực tiếp `/app/tong-quan`, `/app/giao-dich`, `/app/danh-muc`, `/app/ngan-sach`. Service worker và manifest được yêu cầu kiểm tra lại phiên bản; tài nguyên giao diện được build vào `dist`.

- Trên project Vercel, cấu hình `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` cho môi trường Production. Chỉ dùng khóa công khai của project Supabase hiện tại.
- Cài bằng `pnpm install --frozen-lockfile`, build bằng `pnpm run build`, thư mục output `dist` (đã khai báo trong cấu hình).
- Supabase Auth đã được cấu hình Site URL `https://so-chi-tieu-delta.vercel.app` và Redirect URL `https://so-chi-tieu-delta.vercel.app/app`; địa chỉ localhost cũ vẫn được giữ.
- Tệp `.vercelignore` loại các tệp môi trường, thư mục làm việc và dữ liệu cục bộ khỏi nguồn tải lên. Chưa có Git remote; lần triển khai đầu dùng nguồn hiện tại, không tự bật triển khai theo Git.
- Sau phát hành kiểm tra HTTPS, đăng nhập, mở trực tiếp đường dẫn sâu, manifest, service worker, rồi thêm vào màn hình chính.

Đã phát hành production thành công bằng Vercel CLI với Node.js 22, dự án `so-chi-tieu`, ngày 10/11/2026. Deployment ID: `dpl_FWX1K42mtKnZhmxF5Zp4uv53HLfZ`. Bản dựng READY; kiểm tra công khai `/`, đường dẫn sâu, manifest, service worker và PNG icon đều trả 200 đúng loại nội dung. Hai biến build chỉ gồm URL và khóa anon công khai; tệp môi trường cục bộ không được tải lên. Không cần chạy lại SQL.

Manifest tiếng Việt, biểu tượng 192/512px, maskable và Apple icon, service worker đã tích hợp bằng `vite-plugin-pwa`.

```powershell
npm run build
npm run preview
```

- PWA được bật trong **bản build**, không bật service worker ở `npm run dev` để tránh giữ bản mã cũ khi phát triển. Preview mặc định ở `http://localhost:4173`; thêm `http://localhost:4173/app` vào Redirect URLs nếu kiểm tra xác nhận email trên cổng này.
- Trên Chrome/Edge/Android, khi trình duyệt cho phép sẽ có **Cài ứng dụng**, hoặc dùng menu Cài ứng dụng/Thêm vào màn hình chính. Trên iPhone, dùng Safari → Chia sẻ → Thêm vào màn hình chính.
- Trên điện thoại mở `https://so-chi-tieu-delta.vercel.app` để dùng và cài PWA qua **HTTPS**. Địa chỉ LAN dạng `http://192.168...` chỉ dùng thử giao diện; localhost trên chính máy phát triển là ngoại lệ của trình duyệt.
- Service worker chỉ cache các tài nguyên giao diện. Không cache response Supabase, giao dịch, danh mục hoặc ngân sách. **Cần mạng để tải/lưu dữ liệu**; chưa có hàng đợi giao dịch ngoại tuyến. Khi mất mạng, thông báo rõ và lỗi lưu giữ nguyên form.
- Khi có bản mới sẽ hỏi **Cập nhật / Để sau**, không tự tải lại lúc đang nhập. Lưu hoặc đóng biểu mẫu trước khi cập nhật.

## Kiểm tra Giai đoạn 3

- [ ] Tổng quan khớp giao dịch trong tháng; chuyển qua tháng 12/1 và tháng 2 năm nhuận đúng. Tháng rỗng hiển thị 0, không có tỷ lệ vô hạn hoặc biểu đồ giả.
- [ ] Thêm/sửa/xóa giao dịch rồi vào Tổng quan/Ngân sách hoặc bấm Làm mới: số liệu được cập nhật.
- [ ] Đặt hạn mức riêng theo tháng/danh mục chi; không chọn danh mục thu hoặc đặt trùng; sửa/xóa có tác dụng đúng tháng.
- [ ] Kiểm tra đúng mốc 79,9%, 80%, 100%, trên 100%; còn lại/vượt hạn mức đúng số tiền. Xóa ngân sách giữ nguyên giao dịch.
- [ ] Biểu đồ có tooltip số VND; danh sách danh mục và số liệu từng ngày đọc được khi không tương tác đồ thị.
- [ ] Trên bản build, manifest và `sw.js` tải thành công; cài ứng dụng bằng menu trình duyệt hoặc nút Cài ứng dụng nếu có.
- [ ] Sau khi service worker hoạt động, tắt mạng và tải lại: mở được khung giao diện, báo ngoại tuyến; không hiện dữ liệu riêng từ cache của service worker. Bật mạng rồi Làm mới tải dữ liệu lại.
- [ ] Hai tài khoản chỉ thấy ngân sách/giao dịch của chính mình. Không tràn ngang ở 360px và máy tính.

Đã kiểm tra: 11 nhóm unit test đạt; bản production tạo manifest/service worker thành công; trình duyệt với API fixture kiểm tra tổng hợp qua nhiều trang, tháng trước/sau, cả hai đồ thị, CRUD ngân sách, cảnh báo, lỗi/thử lại; kiểm tra hồi quy Giai đoạn 2 đạt. Bản PWA preview được service worker điều khiển, tải lại được khung khi ngoại tuyến, cache không có URL Supabase. Tên miền HTTPS thật đã tải được trang đăng nhập và tài nguyên PWA; cấu hình Site URL/redirect trong Supabase đã lưu thành công. Chưa xác nhận cài thực tế trên thiết bị iPhone/Android hoặc đăng nhập/xác nhận email trên tên miền mới bằng tài khoản người dùng.

## Giai đoạn 2: sử dụng

- `/app/giao-dich`: thêm/sửa/xóa khoản thu và chi, xóa có xác nhận. Khi thêm mới đã chọn loại chi, ngày hôm nay theo giờ Việt Nam và danh mục đầu tiên để nhập nhanh. Nhập `50000` cho `50.000 ₫`; ghi chú tùy chọn.
- Đổi **Khoản thu** để chọn danh mục thu. Số tiền phải là số nguyên dương, tối đa 15 chữ số; không dùng dấu chấm, dấu phẩy hay ký hiệu khoa học.
- Điền bộ lọc rồi bấm **Áp dụng bộ lọc**: ghi chú, tháng, danh mục, thu/chi, số tiền từ/đến. Để trống tháng để xem mọi thời gian; **Đặt lại** về tháng hiện tại. Phân trang 20 giao dịch, mới nhất trước.
- Giao dịch vừa lưu có thể không thuộc bộ lọc hiện tại. Thông báo lưu thành công giải thích rằng danh sách vẫn giữ bộ lọc đã áp dụng.
- **Xuất CSV** lấy toàn bộ giao dịch theo bộ lọc đã áp dụng, qua nhiều trang, không lấy phần bộ lọc đang sửa dở. UTF-8 BOM giữ tiếng Việt; dấu nháy, dấu phẩy, xuống dòng được escape; chuỗi có thể thành công thức được thêm dấu nháy đơn để mở trong bảng tính an toàn.
- `/app/danh-muc`: thêm/sửa tên, màu, emoji và loại; xóa có xác nhận. Danh mục đã có giao dịch hoặc ngân sách không thể xóa/đổi loại. Muốn xóa, chuyển các giao dịch sang danh mục khác cùng loại trước.
- Lỗi lưu giữ nguyên dữ liệu nhập, lỗi tải có nút thử lại. Dialog hỗ trợ bàn phím/Escape; trong khi đang ghi dữ liệu thì không đóng hoặc gửi tiếp.

**Nâng cấp từ Giai đoạn 1:** giữ `.env`/`.env.local` và cơ sở dữ liệu hiện có. Không chạy lại `schema.sql`; Giai đoạn 2 không đổi schema. Tài khoản cũ chưa có danh mục có thể tạo qua giao diện. `.env.local` được Vite ưu tiên hơn `.env`, tránh hai bộ cấu hình khác nhau.

## Kiểm tra Giai đoạn 2

```powershell
npm test
npm run build
```

- [ ] Thêm khoản chi `50000`, sửa thành `60000`, tải lại vẫn giữ dữ liệu. Thử khoản thu và ngày giao dịch ở tháng khác.
- [ ] Hủy xóa giữ nguyên giao dịch; xác nhận xóa biến mất; xóa dòng cuối trang cuối tự quay về trang có dữ liệu.
- [ ] Từ chối số 0, số âm, số thập phân, số có dấu ngăn cách; loại danh mục luôn phù hợp thu/chi.
- [ ] Thêm/sửa/xóa danh mục trống thành công; tên trùng cùng loại báo lỗi; danh mục đã dùng bị chặn xóa/đổi loại.
- [ ] Kết hợp đủ bộ lọc, chuyển trang vẫn giữ lọc; khoảng tiền từ lớn hơn đến báo lỗi; để trống tháng thấy mọi thời gian.
- [ ] Xuất CSV có hơn 20 kết quả: đủ tất cả dòng đang lọc, đúng tiếng Việt, giữ dấu nháy/xuống dòng; số tiền là chữ số để Excel đọc. Nếu Excel không tự chia cột, dùng Data / From Text/CSV và chọn dấu phẩy.
- [ ] Mất mạng/lỗi đọc có thử lại; lỗi lưu giữ nguyên form. Không tràn ngang ở 360px và trên máy tính.
- [ ] Dùng tài khoản A/B trên Supabase thật: không đọc/ghi/sửa/xóa hoặc tham chiếu danh mục của nhau.

Kết quả đã chạy: bản dựng production đạt; 5 nhóm kiểm tra tự động về tiền VND, tháng/ngày, loại danh mục, tìm kiếm ký tự đặc biệt, CSV BOM/escape/chống công thức đều đạt. Edge với API Supabase giả lập đã kiểm tra CRUD, xác nhận/Hủy xóa, lỗi lưu giữ dữ liệu, chặn xóa danh mục đang dùng, phân trang, bộ lọc, xuất đủ 6 dòng đang lọc và 22 dòng qua nhiều trang, lỗi tải/thử lại; không lỗi JavaScript và không tràn ngang ở 360px/1280px.

Không ghi dữ liệu thử vào Supabase thật. Email/Data API/RLS trên dịch vụ thật cần nghiệm thu sau khi cấu hình project. Request đọc được hủy khi đổi lọc/đổi trang/rời trang; chưa có Realtime giữa nhiều thiết bị, tải lại trang để thấy thay đổi nơi khác. CSV đọc qua nhiều request, không phải snapshot cơ sở dữ liệu: tránh chỉnh sửa đồng thời khi đang xuất danh sách lớn.

## Thiết lập

Nếu đã đăng ký tài khoản trước khi cài schema, sau khi chạy `supabase/schema.sql` hãy chạy thêm `supabase/backfill-default-categories.sql`. Script bổ sung 10 danh mục cho tài khoản chưa có danh mục, giữ nguyên tài khoản đã tự tạo danh mục và có thể chạy lại mà không tạo bản sao.

Nếu gặp `PGRST205`, API chưa tìm thấy bảng. Kiểm tra đúng project URL và schema trước khi chạy cài đặt; không chạy lại schema tạo bảng trên project đã cài thành công. Lỗi thiếu cột được hiển thị riêng để tránh nhầm với thiếu bảng.

Yêu cầu Node.js 22.12+ và npm. Từ thư mục dự án:

```powershell
npm install
Copy-Item .env.example .env
```

Chỉ sao chép `.env.example` nếu chưa có `.env` hoặc `.env.local`. Với project đã chạy Giai đoạn 1, giữ cấu hình và schema hiện có.

1. Tạo project Supabase. Trong SQL Editor, chạy toàn bộ `supabase/schema.sql` **một lần trên project mới**, trước khi đăng ký tài khoản. File chạy trong transaction; không tự xóa bảng hay ghi đè dữ liệu cũ. Không chạy lặp lại trên schema đã tồn tại.
2. Trong Project Settings / API, lấy Project URL và khóa **anon công khai**, điền vào `.env`. Tuyệt đối không đặt `service_role` hoặc secret key vào biến `VITE_*` (các biến này được đưa vào trình duyệt).
3. Auth / Providers: bật Email và đăng ký bằng mật khẩu. Nên bật Confirm email. Auth / URL Configuration: đặt Site URL `http://localhost:5173`, thêm Redirect URL `http://localhost:5173/app`. Khi dùng tên miền khác, cập nhật cả hai giá trị.
4. Nếu dùng điện thoại cùng Wi-Fi, mở URL mạng LAN của máy chạy Vite và thêm URL tương ứng `/app` vào Redirect URLs. Session riêng theo origin. Không đưa khóa bí mật lên mạng.

```powershell
npm run dev
```

Mở `http://localhost:5173`. Đổi `.env` cần khởi động lại Vite.

```powershell
npm run build
npm run preview
```

Dự án kèm `pnpm-lock.yaml` đã kiểm tra. Nếu dùng pnpm, chạy `pnpm install --frozen-lockfile`, `pnpm run dev` / `pnpm run build` để dùng đúng toàn bộ phiên bản phụ thuộc đã khóa. Các lệnh npm ở trên cũng được hỗ trợ; lần cài đầu sẽ tạo `package-lock.json` riêng.

Khi kiểm tra preview, thêm `http://localhost:4173/app` vào Redirect URLs. Hosting sau này cần rewrite các đường dẫn SPA về `index.html`.

## Cơ sở dữ liệu

- `user_id` mặc định `auth.uid()` và tham chiếu `auth.users` với `ON DELETE CASCADE` trên cả ba bảng.
- `type`: `income` (thu), `expense` (chi). Số tiền VND nguyên dương, `numeric(15,0)`; ngày giao dịch là `date`. `budgets.month` là ngày đầu tháng, duy nhất theo người dùng/danh mục/tháng.
- Khóa ngoại tổng hợp bảo đảm giao dịch cùng loại và cùng chủ với danh mục; ngân sách chỉ tham chiếu danh mục chi của chính người dùng. Không thể đổi loại danh mục đã được tham chiếu. Xóa danh mục đang dùng bị chặn để tránh mất lịch sử.
- RLS của từng bảng có đủ SELECT/INSERT/UPDATE/DELETE, `TO authenticated`, kiểm tra chủ sở hữu bằng `USING` / `WITH CHECK`. Không cấp quyền cho `anon`.
- Trigger tạo 10 danh mục khi thêm người dùng mới: 9 tên được yêu cầu, với “Khác” riêng cho thu và chi. Trigger không tự bổ sung cho tài khoản đã có trước khi chạy schema.
- Hàm trigger nằm trong schema `private`, khóa `search_path`, thu hồi quyền gọi trực tiếp. `SECURITY DEFINER` chỉ phục vụ tạo danh mục từ `NEW.id` khi đăng ký.
- Protected route phục vụ điều hướng; RLS mới là lớp phân quyền dữ liệu. Không có logic ghi danh mục trong trình duyệt nên đăng nhập lại không tạo bản sao.

## Checklist xác thực và cơ sở dữ liệu (Giai đoạn 1)

- [ ] Thiếu `.env`: hiển thị hướng dẫn cấu hình bằng tiếng Việt, không trắng trang.
- [ ] Chạy schema thành công; cả ba bảng bật RLS, đủ 12 policy.
- [ ] Đăng ký email mới; mật khẩu dưới 8 ký tự hoặc nhập lại sai được chặn.
- [ ] Nếu Confirm email bật: thấy hướng dẫn kiểm tra thư, chưa vào app trước khi xác nhận; liên kết xác nhận trở về `/app`.
- [ ] Nếu Confirm email tắt: đăng ký xong vào app. Trong SQL Editor, kiểm tra người dùng mới có 10 danh mục, không có giao dịch/ngân sách.
- [ ] Sai mật khẩu, email chưa xác nhận, mất mạng hoặc giới hạn gửi email: có thông báo, nút hết trạng thái chờ và thử lại được.
- [ ] Truy cập `/app` khi chưa đăng nhập: chuyển tới `/dang-nhap`; đăng nhập thành công vào app.
- [ ] Tải lại trang và đóng/mở trình duyệt: phiên còn hiệu lực được giữ; thay đổi phiên ở tab khác được đồng bộ.
- [ ] Đăng xuất: trở về đăng nhập; nút Back và tải lại `/app` không xem được app shell.
- [ ] Ở chiều rộng 360px và trên máy tính: không tràn ngang, nhãn rõ ràng, dùng bàn phím được.
- [ ] Dùng hai tài khoản A/B với Data API và JWT tương ứng (không dùng SQL Editor mặc định vì role postgres bỏ qua RLS): A chỉ đọc/sửa/xóa dữ liệu A; không chèn hay đổi `user_id` sang B; không tham chiếu danh mục B. Không có JWT thì không đọc/ghi được.
- [ ] Ngân sách trùng tháng/danh mục, tháng không phải ngày 1, số tiền <= 0, danh mục sai loại hoặc khác chủ đều bị từ chối.
- [ ] Trên project thử nghiệm, xóa tài khoản có dữ liệu: danh mục/giao dịch/ngân sách của tài khoản được xóa theo.

## Tài liệu đã đối chiếu

- [Supabase Auth signUp](https://supabase.com/docs/reference/javascript/auth-signup)
- [Theo dõi phiên](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Trigger khi tạo người dùng](https://supabase.com/docs/guides/auth/managing-user-data)

Không cần tài khoản Supabase để build. Kiểm tra Auth/email và RLS trên dịch vụ thật cần URL/key cùng project đã chạy schema.

## Kết quả kiểm tra nền Giai đoạn 1

- `vite build`: thành công với React 18.3.1 và Supabase JS 2.110.0.
- PostgreSQL chạy trong bộ nhớ (PGlite): chạy nguyên file schema, trigger tạo 20 danh mục cho hai người dùng; xác minh RLS, khóa ngoại, các thao tác bị từ chối, và xóa cascade từ `auth.users` đều đạt. Đây là kiểm tra PostgreSQL độc lập, chưa phải kiểm tra một project Supabase thật.
- Trình duyệt Edge với Auth API giả lập: protected route, thông báo sai mật khẩu, xác nhận mật khẩu, thông báo xác nhận email, đăng nhập thành công, giữ phiên sau tải lại, đăng xuất, chặn vào lại `/app` đều đạt; không lỗi JavaScript, không tràn ngang ở 360px/1280px.
- Chưa kiểm tra gửi email/xác thực hoặc Data API trên dịch vụ Supabase thật vì chưa có cấu hình project. Dùng checklist bên trên để nghiệm thu sau khi thiết lập.
