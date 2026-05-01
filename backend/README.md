# Start Innova - Backend API Khởi Nghiệp

Dự án này là API Backend Node.js / Express cho Start Innova, kết hợp với Supabase Authentication để quản lý Role-Based Access Control (RBAC).

## Cấu trúc thư mục
- `server.js`: Web server chính của Express.
- `database-schema.sql`: Mã nguồn SQL để chạy trong **Supabase SQL Editor** (Dùng để khởi tạo Database, Enum Roles và Trigger).
- `src/config/supabase.js`: Xử lý kết nối tới Supabase qua SDK.
- `src/middlewares/authMiddleware.js`: Nơi chứa `checkRole` logic xử lý phân quyền.
- `src/controllers/userController.js`: Logic xử lý yêu cầu thay đổi Role, lấy dữ liệu nội bộ.
- `src/routes/userRoutes.js`: Định tuyến API.

---

## 🛠 Cách hệ thống Phân Quyền (RBAC) Hoạt Động

Yêu cầu dự án chia thành các role (chức năng): `head`, `admin`, `member`, `guest`, `customer`.

### 1. Luồng chạy cơ bản:
1. Bạn đăng nhập vào Frontend thông qua Google/Email (bằng SDK của Supabase). Supabase trả về một `access_token` (JWT).
2. Frontend gắn JWT đó vào Header của Request: `Authorization: Bearer <token>`.
3. Gửi Request lên Backend NodeJS (ví dụ: `/api/users/club-data`).

### 2. Các Middleware chặn ở Backend:

**A. `requireAuth` Middleware:**
- Bóc tách token từ Request.
- Dùng `supabase.auth.getUser(token)` để xác minh token này có hợp lệ hay không.
- Nếu hợp lệ, lấy `user.id` và truy vấn vào bảng `public.users` (do ta tự thiết kế) để lấy `role` thực tế của họ.
- Gắn dữ liệu role này vào Object Server `req.user` và cho phép đi tiếp.

**B. `checkRole` Middleware:**
- Được định nghĩa khi thiết lập Route API. Ví dụ: `checkRole(['head', 'admin'])`.
- Nó nhận `req.user.role` từ bước trên và so sánh với mảng các role được phép.
- Nếu `req.user.role` là `'member'`, mà route yêu cầu `['head', 'admin']` -> Trả về lỗi `403 Forbidden` (`Truy cập bị từ chối`).
- Nếu role hợp lệ -> Cho phép đi tiếp vào `Controller` xử lý dữ liệu.

---

## 🛡️ Yêu Cầu 4: Bảo mật & Biến Môi Trường (.env)

Mã nguồn được thiết kế sạch (Clean Code), an toàn, các API keys không bao giờ được hard code (viết cứng) trong code mà được lấy thông qua thư viện `dotenv` từ tệp `.env`.

Tồn tại 2 khóa bảo mật chính:
- `SUPABASE_ANON_KEY`: Đi kèm với JWT cho các thao tác mượn danh nghĩa user.
- `SUPABASE_SERVICE_ROLE_KEY`: **Key Quyền Lực Nhất**, có khả năng bỏ qua Row Level Security của Supabase. API Endpoint thay đổi Role (`updateUserRole`) sử dụng key này bởi Admin để ép đổi thông tin bảng `users`.

## 🚀 Hướng Dẫn Kích Hoạt (Chạy Dự Án Lần Đầu)

1. Cài đặt Node.js trên máy (nếu chưa có).
2. Bật Terminal, điều hướng (`cd`) vào thư mục `backend`.
3. Chạy `npm install` để tự động tải các thư viện: _express, cors, dotenv, @supabase/supabase-js_.
4. Đổi tên file `.env.example` thành `.env` và nhập các API key lấy từ mục Project Settings của hệ thống Supabase của bạn.
5. Truy cập Supabase SQL Editor và copy dán/chạy đoạn code trong `database-schema.sql`.
6. Chạy ứng dụng bằng lệnh: `npm start` (hoặc `npm run dev` nếu có cài _Nodemon_).
