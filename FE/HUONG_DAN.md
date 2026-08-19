# Hướng dẫn chạy PeopleLens Frontend

## 1. Yêu cầu môi trường

- Node.js `^20.19.0` hoặc `>=22.12.0`.
- npm đi kèm Node.js.
- Backend PeopleLens chạy tại `http://127.0.0.1:8000` khi sử dụng chế độ API.

Kiểm tra phiên bản:

```bash
node --version
npm --version
```

## 2. Cài đặt thư viện

Từ thư mục frontend:

```bash
npm ci
```

Nếu dự án chưa có `package-lock.json`, sử dụng `npm install` thay cho `npm ci`.

## 3. Cấu hình môi trường

Sao chép `.env.example` thành `.env`:

```powershell
Copy-Item .env.example .env
```

Cấu hình mặc định:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DATA_SOURCE=mock
```

- `mock`: chạy giao diện bằng dữ liệu mẫu không nhạy cảm.
- `api`: đọc phòng ban và nhân sự từ backend.

Chỉ chuyển sang `api` sau khi backend cung cấp `GET /api/departments` và `GET /api/employees`, xác thực JWT, đồng thời loại bỏ hoàn toàn trường nhạy cảm khỏi response của người dùng không có quyền.

## 4. Chạy ứng dụng

```bash
npm run dev -- --host 127.0.0.1
```

Mở `http://127.0.0.1:5173/`.

## 5. Kiểm tra chất lượng

Chạy lần lượt trước khi commit hoặc tạo pull request:

```bash
npm test -- --run
npm run lint
npm run build
```

Cả ba lệnh phải thành công. Thư mục `dist/` được sinh ra khi build và không được commit.

## 6. Nguyên tắc bảo mật dữ liệu

- Role lựa chọn trên giao diện chỉ dùng để mô phỏng workflow, không phải cơ chế phân quyền.
- Frontend không chứa dữ liệu tâm lý nhạy cảm trong mock data.
- Frontend không thể bảo vệ field đã được backend gửi tới trình duyệt.
- Backend phải xác minh JWT và lọc response theo quyền trước khi gửi dữ liệu.
- Không commit `.env`, access token, service-account key hoặc thông tin xác thực.

## 7. Lỗi thường gặp

- Không mở được cổng `5173`: kiểm tra terminal chạy Vite và thử lại lệnh ở mục 4.
- FE không gọi được BE: kiểm tra `VITE_API_BASE_URL`, cổng `8000` và cấu hình CORS của backend.
- Thay đổi `.env` chưa có hiệu lực: dừng rồi chạy lại Vite.
- `npm ci` thất bại: kiểm tra phiên bản Node.js và không sửa thủ công `package-lock.json`.
