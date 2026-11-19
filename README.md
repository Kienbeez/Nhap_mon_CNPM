# Personal Finance Tracker (Quản lý Thu Chi Cá nhân)

Hệ thống Quản lý Tài chính Cá nhân hiện đại, chuẩn kiến trúc Fullstack xây dựng trên nền tảng **Next.js 14 (App Router)**, **TypeScript**, **TailwindCSS**, **Shadcn/ui**, **Prisma ORM** và **PostgreSQL** thông qua **Docker Compose**.

---

## Trạng thái triển khai: Sprint 1 & Sprint 2 (Hoàn thành)

### Sprint 1: Nền tảng & Quản lý Danh mục
- [x] **Task 1.1: Thiết kế CSDL & Giao diện khung (UI)**
  - Cấu hình hạ tầng Docker Compose (`PostgreSQL 16` + `Node.js 20 Alpine`) hỗ trợ Hot-Reloading trên Windows.
  - Thiết kế Schema Prisma chuẩn cho 3 thực thể: `User`, `Category`, `Transaction` (dùng `Decimal(15, 2)` chống sai số tiền tệ).
  - Khởi tạo tự động 13 danh mục Thu/Chi mặc định bằng Tiếng Việt (`prisma/seed.ts`).
  - Giao diện khung chuẩn mực với Sidebar, Top Navbar, Responsive Menu cho thiết bị di động.
- [x] **Task 1.2: Đăng ký & Đăng nhập tài khoản (Core / Auth)**
  - Mã hóa mật khẩu bảo mật bằng `bcryptjs`.
  - Cấp phát và quản lý phiên bằng JWT Token thông qua **HTTP-Only Cookie** (chống XSS).
  - Next.js Edge `middleware.ts` bảo vệ toàn bộ route Dashboard và API (`/api/categories/*`, `/api/transactions/*`).
  - Trang Đăng nhập (`/login`) & Đăng ký (`/register`) trực quan, tích hợp bộ chọn nhanh 3 Tài khoản Demo dựng sẵn.
- [x] **Task 1.3: Quản lý Danh mục Thu/Chi (`/categories`)**
  - Toàn bộ API CRUD: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/[id]`, `DELETE /api/categories/[id]`.
  - Danh mục mặc định hệ thống được gắn khóa bảo vệ (**403 Forbidden** nếu cố sửa/xóa); danh mục cá nhân được phép Thêm, Sửa, Xóa (chặn xóa hoặc đổi loại nếu đã có giao dịch phát sinh).

### Sprint 2: Trang chủ Điều hướng, 3 Tài khoản Demo & Quản lý Giao dịch Thu/Chi
- [x] **Task 2.1: Trang chủ (`/`) chứa danh sách các trang con**
  - Xây dựng Trang chủ Dashboard (`src/app/(dashboard)/page.tsx`) hiển thị danh mục điều hướng trực quan đến tất cả các trang con (`/categories`, `/transactions`, `/reports`), thẻ tóm tắt tài chính và 5 giao dịch gần nhất.
- [x] **Task 2.2: Khởi tạo sẵn 3 Tài khoản Demo (`prisma/seed.ts`)**
  - Tự động tạo 3 tài khoản Demo độc lập kèm danh mục riêng và giao dịch mẫu đa dạng để kiểm thử ngay khi khởi chạy Docker.
  - Bổ sung nút chọn nhanh 3 Tài khoản Demo (1-Click) ngay trên trang Đăng nhập (`/login`).
- [x] **Task 2.3: RESTful API Quản lý Giao dịch (`/api/transactions` & `/api/transactions/[id]`)**
  - Hỗ trợ đầy đủ CRUD giao dịch Thu/Chi (`GET`, `POST`, `PUT`, `DELETE`).
  - Hỗ trợ bộ lọc đa chiều: lọc theo loại (`INCOME`/`EXPENSE`), theo danh mục (`categoryId`), theo khoảng thời gian (`startDate` - `endDate`), tìm kiếm từ khóa (`search`) và phân trang (`page`, `limit`).
  - Tự động tính toán chính xác `summary` gồm: **Tổng Thu nhập (`totalIncome`)**, **Tổng Chi tiêu (`totalExpense`)** và **Số dư (`balance`)**.
  - **Ràng buộc nghiệp vụ nghiêm ngặt**:
    - Phân quyền sở hữu giao dịch chặt chẽ giữa các tài khoản (`403 Forbidden` nếu truy cập chéo).
    - Chặn sử dụng danh mục cá nhân của người dùng khác (`403 Forbidden`).
    - Bắt buộc đồng nhất phân loại Thu/Chi giữa giao dịch và danh mục (`transaction.type === category.type`, trả về `400 Bad Request` nếu lệch loại).
- [x] **Task 2.4: Giao diện Quản lý Giao dịch (`/transactions`)**
  - 3 Thẻ Tổng quan Tài chính (Tổng Thu, Tổng Chi, Số dư cân đối).
  - Thanh bộ lọc đa chiều kết hợp Tabs (`Tất cả` | `Khoản Chi` | `Khoản Thu`), Dropdown Danh mục, Bộ lọc Từ ngày - Đến ngày (kèm nút chọn nhanh *Tháng này*) và Ô tìm kiếm tức thì.
  - Modal Thêm/Sửa giao dịch thông minh: tự động lọc danh mục theo loại giao dịch, nút gợi ý mệnh giá VND nhanh và xem trước định dạng tiền tệ (`1.500.000 ₫`).
- [x] **Task 2.5: Kiểm thử Tự động (Vitest)**
  - Bộ Unit Tests đầy đủ cho Auth, JWT, Zod Schemas (`transactionSchema`), API Danh mục (`categories-api.test.ts`) và API Giao dịch (`transactions-api.test.ts`).

---

## 3 Tài khoản Demo dựng sẵn

Khi khởi chạy hệ thống, `prisma/seed.ts` đã nạp sẵn **3 tài khoản Demo** (hoặc bạn có thể click chọn nhanh ngay trên màn hình `/login`):

| STT | Họ và tên | Email đăng nhập | Mật khẩu | Dữ liệu mẫu đi kèm |
| :-: | :--- | :--- | :--- | :--- |
| **1** | Nguyễn Văn An (Demo 1) | `demo1@financetracker.vn` | `Password123!` | 6 giao dịch Thu/Chi tiêu biểu trong tháng |
| **2** | Trần Thị Bình (Demo 2) | `demo2@financetracker.vn` | `Password123!` | 1 danh mục riêng (*Cà phê & Trà sữa*) + 5 giao dịch |
| **3** | Lê Hoàng Cường (Demo 3) | `demo3@financetracker.vn` | `Password123!` | 5 giao dịch cơ bản (Lương, Đầu tư, Giáo dục, Y tế...) |

---

## Hướng dẫn khởi chạy bằng Docker Compose

### Bước 1: Mở Docker Desktop
Đảm bảo ứng dụng **Docker Desktop** trên máy tính của bạn đã được khởi động và hiển thị trạng thái đang chạy (Running).

### Bước 2: Khởi động hệ thống
Mở Terminal tại thư mục dự án (`e:\Antigravity project`) và chạy lệnh:

```bash
docker compose up --build
```

Container sẽ tự động thực hiện:
1. Khởi động PostgreSQL 16 và kiểm tra Healthcheck.
2. Build môi trường Node 20, cài đặt dependencies.
3. Chạy `prisma db push` đồng bộ bảng dữ liệu (`users`, `categories`, `transactions`).
4. Chạy `npm run db:seed` nạp sẵn **13 danh mục mặc định** và **3 tài khoản Demo kèm giao dịch mẫu**.
5. Khởi động máy chủ Next.js tại cổng `3000`.

### Bước 3: Truy cập ứng dụng
Mở trình duyệt web và truy cập:
**[http://localhost:3000](http://localhost:3000)**

- Sau khi đăng nhập (bằng 1 trong 3 tài khoản Demo hoặc tài khoản mới), bạn sẽ được đưa tới **Trang chủ (`/`)** chứa danh sách điều hướng đến các trang con:
  - **Trang chủ (`/`)**: Trung tâm điều hướng các trang con & tổng quan tài chính.
  - **Danh mục Thu/Chi (`/categories`)**: Quản lý danh mục hệ thống và cá nhân.
  - **Quản lý Giao dịch (`/transactions`)**: Ghi chép, lọc và quản lý lịch sử giao dịch Thu/Chi.

---

## Chạy Unit Test

Để kiểm tra toàn bộ bộ test case (Auth, JWT, Zod Schemas, API Danh mục & API Giao dịch):

```bash
docker compose exec web npm run test
```

---

## Cấu trúc thư mục

```text
├── docker-compose.yml       # Điều phối container web và postgres
├── Dockerfile.dev           # Docker image môi trường development
├── prisma/
│   ├── schema.prisma        # Thiết kế CSDL (User, Category, Transaction)
│   └── seed.ts              # Script nạp 13 danh mục mặc định & 3 tài khoản Demo
├── src/
│   ├── app/
│   │   ├── (auth)/          # Layout và các trang Login (kèm chọn nhanh Demo) / Register
│   │   ├── (dashboard)/     # Layout Dashboard, Trang chủ (/), Danh mục (/categories) & Giao dịch (/transactions)
│   │   └── api/             # RESTful API Routes (auth, categories, transactions)
│   ├── components/
│   │   ├── ui/              # Shadcn components (Button, Input, Dialog, Tabs, Card, Badge...)
│   │   └── category-icon.tsx# Bộ ánh xạ 25 Icon và Palette màu danh mục
│   ├── lib/
│   │   ├── auth.ts          # Mã hóa bcrypt, đọc session từ cookie
│   │   ├── jwt.ts           # Ký và xác thực JWT bằng jose
│   │   ├── prisma.ts        # Prisma Client singleton
│   │   ├── validations.ts   # Zod validation schemas (Auth, Category, Transaction)
│   │   ├── utils.ts         # Tiện ích format VND (₫) và ngày tháng VN
│   │   └── __tests__/       # Bộ unit tests cho các hàm lõi, API Danh mục & API Giao dịch
│   └── middleware.ts        # Route protection bằng JWT Cookie
└── README.md
```
