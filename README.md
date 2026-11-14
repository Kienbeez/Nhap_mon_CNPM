# 💰 Personal Finance Tracker (Quản lý Thu Chi Cá nhân)

Hệ thống Quản lý Tài chính Cá nhân hiện đại, chuẩn kiến trúc Fullstack xây dựng trên nền tảng **Next.js 14 (App Router)**, **TypeScript**, **TailwindCSS**, **Shadcn/ui**, **Prisma ORM** và **PostgreSQL** thông qua **Docker Compose**.

---

## 🚀 Trạng thái triển khai: Sprint 1 (Nền tảng & Danh mục)

Đã hoàn thành toàn bộ mục tiêu của **Sprint 1** theo đúng Kế hoạch Agile:
- [x] **Task 1.1: Thiết kế CSDL & Giao diện khung (UI)**
  - Cấu hình hạ tầng Docker Compose (`PostgreSQL 16` + `Node.js 20 Alpine`) hỗ trợ Hot-Reloading trên Windows.
  - Thiết kế Schema Prisma chuẩn cho 3 thực thể: `User`, `Category`, `Transaction` (dùng `Decimal` chống sai số tiền tệ).
  - Khởi tạo tự động 13 danh mục Thu/Chi mặc định bằng Tiếng Việt (`prisma/seed.ts`).
  - Giao diện khung chuẩn mực với Sidebar, Top Navbar, Responsive Menu cho thiết bị di động.
- [x] **Task 1.2: Đăng ký & Đăng nhập tài khoản (Core / Auth)**
  - Mã hóa mật khẩu bảo mật bằng `bcryptjs`.
  - Cấp phát và quản lý phiên bằng JWT Token thông qua **HTTP-Only Cookie** (bảo mật tuyệt đối, chống XSS).
  - Next.js Edge `middleware.ts` bảo vệ route Dashboard và tự động điều hướng.
  - Trang Đăng nhập (`/login`) & Đăng ký (`/register`) đẹp mắt, xử lý validation và hiển thị lỗi tức thì.
- [x] **Task 1.3: Quản lý Danh mục Thu/Chi (Core Feature)**
  - Toàn bộ API CRUD: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/[id]`, `DELETE /api/categories/[id]`.
  - **Ràng buộc nghiệp vụ nghiêm ngặt**:
    - Danh mục mặc định hệ thống: Mọi người dùng đều thấy, nhưng được gắn huy hiệu *Khóa* và **chặn sửa/xóa tuyệt đối (403 Forbidden)**.
    - Danh mục cá nhân: Người dùng toàn quyền Thêm, Sửa (tên, màu, icon), Xóa.
    - Chặn trùng tên danh mục trong cùng một nhóm Thu/Chi.
  - Giao diện quản lý danh mục dạng Grid Card, hỗ trợ chuyển Tab (Khoản Chi / Khoản Thu / Tất cả), tìm kiếm tức thì, bảng chọn 24 icon và 10 palette màu sắc trực quan.
- [x] **Kiểm thử & Tiêu chuẩn nghiệm thu**:
  - Viết bộ Unit Tests hoàn chỉnh với Vitest (`src/lib/__tests__/core.test.ts`) cho Auth, JWT, Zod Validation và format tiền tệ VND.

---

## 🛠 Hướng dẫn khởi chạy bằng Docker Compose

### Bước 1: Mở Docker Desktop
Đảm bảo ứng dụng **Docker Desktop** trên máy tính của bạn đã được khởi động và icon hiển thị trạng thái màu xanh (Running).

### Bước 2: Khởi động hệ thống
Mở Terminal tại thư mục dự án (`e:\Antigravity project`) và chạy lệnh:

```bash
docker compose up --build
```

Container sẽ tự động thực hiện:
1. Khởi động PostgreSQL 16 và kiểm tra Healthcheck.
2. Build môi trường Node 20, cài đặt dependencies.
3. Chạy `prisma db push` đồng bộ bảng dữ liệu.
4. Chạy `npm run db:seed` nạp sẵn 13 danh mục mặc định Tiếng Việt.
5. Khởi động máy chủ Next.js tại cổng `3000`.

### Bước 3: Truy cập ứng dụng
Mở trình duyệt web và truy cập:
👉 **[http://localhost:3000](http://localhost:3000)**

Hệ thống sẽ tự động chuyển bạn đến trang Đăng ký / Đăng nhập. Sau khi tạo tài khoản, bạn sẽ được đưa ngay vào trang Quản lý Danh mục.

---

## 🧪 Chạy Unit Test

Để kiểm tra toàn bộ test case (Mã hóa bcrypt, JWT jose, Zod Schemas, Format VND):

```bash
docker compose exec web npm run test
```

---

## 📂 Cấu trúc thư mục

```text
├── docker-compose.yml       # Điều phối container web và postgres
├── Dockerfile.dev           # Docker image môi trường development
├── prisma/
│   ├── schema.prisma        # Thiết kế CSDL (User, Category, Transaction)
│   └── seed.ts              # Script nạp 13 danh mục mặc định Tiếng Việt
├── src/
│   ├── app/
│   │   ├── (auth)/          # Layout và các trang Login / Register
│   │   ├── (dashboard)/     # Layout Dashboard (Sidebar, Header) & Categories UI
│   │   └── api/             # API Routes (auth, categories)
│   ├── components/
│   │   ├── ui/              # Shadcn components (Button, Input, Dialog, Tabs, Card, Badge...)
│   │   └── category-icon.tsx# Bộ ánh xạ Icon và Palette màu danh mục
│   ├── lib/
│   │   ├── auth.ts          # Mã hóa bcrypt, JWT sign/verify bằng jose
│   │   ├── prisma.ts        # Prisma Client singleton
│   │   ├── validations.ts   # Zod validation schemas
│   │   ├── utils.ts         # Tiện ích format VND (₫) và ngày tháng VN
│   │   └── __tests__/       # Bộ unit tests cho các hàm lõi
│   └── middleware.ts        # Route protection bằng JWT Cookie
└── README.md
```
