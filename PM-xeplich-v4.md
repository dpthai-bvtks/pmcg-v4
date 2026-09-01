# 🏥 PM-XepLich v4 (Multi-Tenant SaaS Commercial Edition)

> **Mô tả hệ thống**: Hệ thống Xếp lịch Thủ thuật Y học cổ truyền & Phục hồi chức năng tự động đa đơn vị (Multi-Tenant SaaS Architecture), chạy 100% trên nền tảng Cloudflare (Pages + Worker API + D1 Database) độc lập theo đơn vị.

---

## 1. 🏢 Kiến Trúc Đa Đơn Vị (Multi-Tenant Architecture)

- **Mã đơn vị mặc định:** `bvtks_cs2` (*Bệnh viện Than - Khoáng sản Cơ sở 2*).
- **Phân tách dữ liệu:** Sử dụng cơ chế Row-level Tenant Clamping với trường `unit_code TEXT NOT NULL` trên toàn bộ 15 bảng dữ liệu.
- **Bảng `tenants`:** Quản lý thông tin từng bệnh viện/phòng khám (`unit_code`, `unit_name`, `logo_url`, `phone`, `email`, `plan_tier`, `max_staff`, `max_patients`, `expires_at`, `is_active`).
- **Xác thực Đăng nhập:**
  - Nhập Mã Đơn Vị trực tiếp tại màn hình Đăng nhập.
  - Tự động kiểm tra bản quyền (`expires_at`) và trạng thái kích hoạt (`is_active`).
  - Hỗ trợ tài khoản `SUPER_ADMIN` quản trị trung tâm và các tài khoản Admin/KTV riêng biệt theo từng đơn vị.
- **Dynamic White-Labeling:** Tự động hiển thị tên bệnh viện, logo, và cấu hình giao diện riêng theo đơn vị sau khi đăng nhập.
- **Offline Cache Isolation:** Khóa lưu trữ IndexedDB/LocalStorage được cách ly riêng theo `unit_code` (`times_bootstrap_cache_${unit_code}`, `pm_unit_code`).

---

## 2. 🧠 3 Bộ Giải Thuật Xếp Lịch Tích Hợp

1. **Group 1 - Medical CP Solver (`js/cp-solver.js`)**: Giải thuật quy hoạch nhánh cận (Branch-and-Bound / CP-SAT) giải cứu tối đa các ca thủ thuật bị rớt.
2. **Group 2 - Web Worker Simulated Annealing (`js/scheduler-engine.js`)**: Động cơ xếp lịch đa luồng tối ưu hóa công suất phòng, giường, máy móc và KTV.
3. **Group 3 - Clinical AI Pattern Scheduler (`js/ai-scheduler.js`)**: Học máy lâm sàng từ 20,000 dòng dữ liệu lịch sử, ma trận tương thích KTV và chỉ số tắc nghẽn máy.

---

## 3. 🚀 Lệnh Vận Hành & Deploy

- **Kiểm tra cú pháp trước khi deploy:**
  `node -c js/init.js && node -c js/app.js && node -c js/scheduler-engine.js && node -c backend/src/index.js`
- **Deploy Frontend lên Cloudflare Pages:**
  `cd backend && npm run deploy:web` (Pages: `pmcg-v4`)
- **Deploy Toàn Diện (Worker API + D1 + Pages):**
  `cd backend && npm run deploy:all`
- **Đẩy mã nguồn lên GitHub:**
  `git add . && git commit -m "..." && git push origin main` (Repo: `https://github.com/dpthai-bvtks/pmcg-v4`)

---

## 4. 📝 Nhật Ký Phát Triển (Changelog)

### [v4.0.0-rev1] - 01/09/2026: Khởi Tạo Phiên Bản Thương Mại Đa Đơn Vị (Multi-Tenant SaaS)
- **Yêu cầu:** Thương mại hóa phần mềm hỗ trợ nhiều bệnh viện/phòng khám dùng chung trên tên miền `xeplichthuthuat.io.vn`, người dùng nhập mã đơn vị khi đăng nhập, đơn vị gốc là `bvtks_cs2` (*Bệnh viện Than - Khoáng sản Cơ sở 2*).
- **Backend Worker (`backend/src/index.js` & `backend/schema.sql`):**
  - Tạo bảng `tenants` quản lý bản quyền, gói cước và ngày hết hạn.
  - Bổ sung trường `unit_code` và bộ Index đa cột trên 15 bảng dữ liệu.
  - Cập nhật `processApiRequest` bóc tách `unit_code` từ header `x-unit-code`, query param hoặc body payload.
  - Nâng cấp `verifyLogin`/`checkLogin` xác thực mã đơn vị, kiểm tra hạn dùng bản quyền, và hỗ trợ tài khoản Super Admin Master.
  - Bổ sung bộ API quản trị SaaS: `getPublicUnits`, `getPublicTenantInfo`, `getTenantsList`, `addTenant`, `updateTenant`, `toggleTenantStatus`, `deleteTenant`, `resetTenantAdminPassword`.
  - Ràng buộc `WHERE unit_code = ?` trên 100% các API CRUD.
- **Frontend Client (`index.html`, `js/init.js`, `js/app.js`):**
  - Cập nhật Màn hình Đăng nhập thêm ô nhập Mã Đơn Vị (Text input) với giá trị mặc định `bvtks_cs2`.
  - Tự động ghi nhớ mã đơn vị vào `localStorage.getItem('pm_unit_code')`.
  - Triển khai Dynamic White-Labeling hiển thị thương hiệu bệnh viện trên Header và Tiêu đề trang.
  - Bổ sung Cổng Quản Trị Khách Hàng SaaS (`tab-tenants`) dành riêng cho Super Admin: Thống kê, thêm bệnh viện, gia hạn ngày dùng, đặt lại mật khẩu admin.
- **Quy tắc & Tài liệu (`RULES.md`, `package.json`, `sw.js`):**
  - Cập nhật `RULES.md` chuẩn hóa quy tắc phát triển v4 Multi-Tenant SaaS.
  - Cập nhật `backend/package.json` deploy target `pmcg-v4`.
  - Cập nhật `sw.js` cache name `pmcg-v4-cache-4.0.0-rev1`.
