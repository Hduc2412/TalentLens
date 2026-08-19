# PeopleLens

PeopleLens là workspace cá nhân để phát triển hệ thống trực quan hóa, phân tích và mô phỏng điều chuyển nhân sự từ dữ liệu Excel.

## Cấu trúc workspace

```text
PeopleLens/
├── BE/      # FastAPI, Firestore và các API nghiệp vụ
└── FE/      # React + Vite, giao diện Simulation Board
```

## Chạy Frontend

```bash
cd FE
npm install
npm run dev
```

Frontend mặc định chạy tại `http://127.0.0.1:5173`.

## Chạy Backend

Yêu cầu Python 3.13.

```bash
cd BE
python -m venv .venv
python -m pip install -e ".[dev]"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend mặc định chạy tại `http://127.0.0.1:8000`.

## Firestore

Sao chép `BE/.env.example` thành `.env`, cấu hình `GOOGLE_CLOUD_PROJECT`, sau đó đăng nhập Application Default Credentials:

```bash
gcloud auth application-default login
```

Không commit service-account key hoặc thông tin xác thực lên repository.

## Trạng thái hiện tại

- FE Simulation Board đang sử dụng dữ liệu mock.
- Backend đã có health check và nền tảng kết nối Firestore.
- Luồng nhập Excel, lưu Firestore và API nghiệp vụ sẽ được phát triển tiếp trong workspace này.

Tài liệu Word và dữ liệu Excel nội bộ được giữ ngoài Git để tránh đưa dữ liệu nhạy cảm lên repository.
