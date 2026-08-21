# Hướng dẫn chạy TalentLens Frontend

## 1. Yêu cầu môi trường

- Node.js `^20.19.0` hoặc `>=22.12.0`.
- npm đi kèm Node.js.
- Không cần backend: mặc định giao diện chạy bằng dữ liệu mẫu.

```bash
node --version
npm --version
```

## 2. Cài đặt thư viện

```bash
npm ci
```

Nếu chưa có `package-lock.json`, dùng `npm install`.

## 3. Cấu hình môi trường

Sao chép `.env.example` thành `.env`:

```powershell
Copy-Item .env.example .env
```

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK=true
VITE_AUTO_SIGN_IN=true
```

- `VITE_USE_MOCK=true` — chạy bằng dữ liệu mẫu tổng hợp, không có dữ liệu thật.
- `VITE_USE_MOCK=false` — đọc từ backend. **Lưu ý:** các endpoint backend hiện
  chưa tồn tại, xem [docs/backend-contract-gaps.md](docs/backend-contract-gaps.md).
- `VITE_AUTO_SIGN_IN=true` — tự đăng nhập sẵn quyền HR Admin để mở thẳng vào
  bảng tổ chức. Đặt `false` nếu muốn thấy màn hình đăng nhập thật mà vẫn dùng dữ
  liệu mẫu — đây là cách thử luồng đăng nhập, đăng ký, quên mật khẩu khi chưa có
  hệ thống định danh.

Ở chế độ mock, danh sách tài khoản demo và mật khẩu dùng chung được in ngay trên
màn hình đăng nhập.

## 4. Chạy ứng dụng

```bash
npm run dev
```

Mở `http://127.0.0.1:5173/`.

## 5. Kiểm tra chất lượng

Chạy trước khi commit hoặc tạo pull request:

```bash
npm run verify
```

Lệnh này chạy tuần tự: `format:check` → `typecheck` → `lint` → `test` → `build`
→ `audit`. Tất cả phải xanh. Thư mục `dist/` sinh ra khi build và không commit.

`npm run audit` kiểm tra những quy tắc kiến trúc mà linter không diễn đạt được:
giới hạn số dòng mỗi file, chỉ dùng named export, không dùng giá trị Tailwind
tuỳ ý, mọi `className` đều bọc qua `cn()`, không hardcode chuỗi hiển thị, khớp
key `ja`/`en`, và không import xuyên feature vòng qua barrel.

## 6. Nguyên tắc bảo mật dữ liệu

- Dữ liệu mẫu là **tổng hợp**. Bộ dữ liệu thật chứa điểm tâm lý được bảo vệ
  (Machiavellianism, sự vô cảm, ái kỷ, chỉ số căng thẳng và sức khoẻ tinh thần)
  — tuyệt đối không được đóng gói vào bundle trình duyệt. Chỉ tên phòng ban thật
  được giữ lại.
- Bộ chọn role trên giao diện chỉ mô phỏng workflow, **không phải** cơ chế phân
  quyền.
- Frontend không thể bảo vệ field mà backend đã gửi tới trình duyệt. Backend
  phải xác minh JWT và loại bỏ trường nhạy cảm trước khi trả response.
- Không commit `.env`, access token, service-account key hay thông tin xác thực.

## 7. Lỗi thường gặp

- **Cổng 5173 bận** — tắt tiến trình Vite cũ, hoặc `npm run dev -- --port 5174`.
- **FE không gọi được BE** — kiểm tra `VITE_API_BASE_URL`, backend có đang chạy ở
  cổng 8000 không, và backend đã bật CORS chưa (hiện chưa).
- **Sửa `.env` chưa có hiệu lực** — Vite chỉ đọc lúc khởi động, cần chạy lại.
- **`npm ci` thất bại** — kiểm tra phiên bản Node.js, không sửa tay
  `package-lock.json`.
