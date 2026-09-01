# 🏥 PM-XepLich v4 (Multi-Tenant SaaS Commercial Edition)

> **Mô tả hệ thống**: Hệ thống Xếp lịch Thủ thuật Y học cổ truyền & Phục hồi chức năng tự động đa đơn vị (Multi-Tenant SaaS Architecture), chạy 100% trên nền tảng Cloudflare (Pages + Worker API + D1 Database) độc lập theo đơn vị.

---

## 1. 🏢 Kiến Trúc Đa Đơn Vị (Multi-Tenant Architecture)

- **Mã đơn vị mặc định:** `bvtks_cs2` (*Bệnh viện Than - Khoáng sản Cơ sở 2*).
- **Phân tách dữ liệu:** Sử dụng cơ chế Row-level Tenant Clamping với trường `unit_code TEXT NOT NULL` trên toàn bộ 15 bảng dữ liệu D1.
- **Ràng buộc Composite Unique Keys:** Các bảng `tai_khoan (unit_code, username)`, `cai_dat (unit_code, key)`, `nhan_su (unit_code, name)` cho phép mỗi đơn vị tự tạo tài khoản `admin`, danh sách nhân sự và cấu hình mà không bị xung đột với đơn vị khác.
- **Bảng `tenants`:** Quản lý thông tin từng bệnh viện/phòng khám (`unit_code`, `unit_name`, `logo_url`, `phone`, `email`, `plan_tier`, `max_staff`, `max_patients`, `expires_at`, `is_active`).
- **Xác thực Đăng nhập:**
  - Nhập Mã Đơn Vị trực tiếp tại màn hình Đăng nhập (Mặc định: `bvtks_cs2`).
  - Phụ đề form đăng nhập: *"Nền tảng Xếp lịch thủ thuật YHCT - PHCN"*.
  - Tiêu đề tab trình duyệt cố định: *"T.I.M.E.S System - Phần mềm xếp lịch thủ thuật thông minh"*.
  - Tự động kiểm tra bản quyền (`expires_at`) và trạng thái kích hoạt (`is_active`).
  - Hỗ trợ tài khoản `SUPER_ADMIN` quản trị trung tâm và các tài khoản Admin/KTV riêng biệt theo từng đơn vị.
- **Đổi Mật Khẩu An Toàn (Super Admin & All Users):**
  - Tích hợp nút **"🔑 Đổi Mật Khẩu"** ngay trên Menu người dùng ở góc trên bên phải.
  - Mật khẩu Super Admin được băm SHA-256 lưu trực tiếp trong Cloudflare D1 (`cai_dat WHERE unit_code = 'MASTER' AND key = 'superadmin_password_hash'`).
- **Phân Quyền & Bố Cục Tab Giao Diện:**
  - **Super Admin:** Chỉ hiển thị 1 tab duy nhất **"🏢 Quản Lý Đơn Vị SaaS" (`tab-tenants`)**, ẩn toàn bộ các tab nghiệp vụ chuyên môn; Tab Admin của Super Admin chỉ giữ lại *Sao lưu & Khôi phục* và *Liên kết nhanh*.
  - **Tài khoản Đơn vị:** Hiển thị đầy đủ các tab Lịch trình, Chấm công, Thống kê, Quản trị đơn vị (Cài đặt, Tài khoản, Nhân sự, Huấn luyện AI), ẩn tab Quản lý đơn vị SaaS.
- **Dynamic Brand White-Labeling (Đầu Trang & Báo Cáo):**
  - **Đơn vị mới:** Dòng 1: `T.I.M.E.S SYSTEM`, Dòng 2: `Hệ thống xếp lịch thủ thuật YHCT- PHCN thông minh`, Dòng 3: `Nhanh gọn, tối ưu, chính xác`.
  - **Đơn vị mặc định (`bvtks_cs2`):** `BỆNH VIỆN THAN - KHOÁNG SẢN CS2`, `KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG`, `Y HỌC TỐT, PHỤC HỒI NHANH`.
  - **Super Admin:** `T.I.M.E.S SYSTEM`, `HỆ THỐNG QUẢN LÝ ĐƠN VỊ & BẢN QUYỀN SAAS`, `TRUNG TÂM ĐIỀU HÀNH TOÀN CỤC`.
  - **Xuất file Excel & PDF:** Tự động điền đúng tên Bệnh viện / Phòng khám của đơn vị đang thao tác.
- **Thông Tin Chủ Sở Hữu & Ghim Chân Trang (Sticky Footer):**
  - Cố định thông tin chủ sở hữu bản quyền ở Footer:
    - 🌿 **THÔNG TIN CHỦ SỞ HỮU**
    - 👤 **Họ tên: Đặng Phong Thái**
    - 📍 **Địa chỉ: Khu Vĩnh Lập, phường Mạo Khê, tỉnh Quảng Ninh**
    - 📞 **Điện thoại: 0392.283.473**
  - Bố cục Flexbox tự động ghim chân trang sát đáy màn hình (`margin-top: auto`).
- **Client Cache Isolation & Data Cleanliness:**
  - Bộ nhớ đệm IndexedDB Dexie: `PMCG_Offline_DB_${unit_code}`.
  - Bộ nhớ LocalStorage: `times_bootstrap_cache_${unit_code}`, `med_chamcong_employees_${unit_code}`.
  - Khi tạo đơn vị mới, toàn bộ danh sách bệnh nhân, lịch trình và danh sách chấm công hoàn toàn sạch sẽ (`[]`), không bị trộn dữ liệu của `bvtks_cs2`.

---

## 2. 🧠 3 Bộ Giải Thuật Xếp Lịch Tích Hợp

1. **Group 1 - Medical CP Solver (`js/cp-solver.js`):** Giải thuật quy hoạch nhánh cận (Branch-and-Bound / CP-SAT) giải cứu tối đa các ca thủ thuật bị rớt.
2. **Group 2 - Web Worker Simulated Annealing (`js/scheduler-engine.js`):** Động cơ xếp lịch đa luồng tối ưu hóa công suất phòng, giường, máy móc và KTV.
3. **Group 3 - Clinical AI Pattern Scheduler (`js/ai-scheduler.js`):** Học máy lâm sàng từ 20,000 dòng dữ liệu lịch sử, ma trận tương thích KTV và chỉ số tắc nghẽn máy.

---

## 3. 🚀 Lệnh Vận Hành & Deploy

- **Kiểm tra cú pháp trước khi deploy:**
  ```bash
  node -c js/init.js && node -c js/app.js && node -c js/thongke.js && node -c backend/src/index.js
  ```
- **Deploy Frontend lên Cloudflare Pages:**
  ```bash
  cd backend && npm run deploy:web
  ```
- **Deploy Backend Worker API lên Cloudflare Workers:**
  ```bash
  cd backend && npm run deploy
  ```
- **Deploy Toàn Diện (Worker API + D1 + Pages):**
  ```bash
  cd backend && npm run deploy:all
  ```
- **Đẩy mã nguồn lên GitHub:**
  ```bash
  git add . && git commit -m "..." && git push origin main
  ```
  *(Repository: `https://github.com/dpthai-bvtks/pmcg-v4`)*

---

## 4. 📝 Nhật Ký Phát Triển (Changelog)

### [v4.0.0-rev16] - 01/09/2026: Tích Hợp Menu Đổi Mật Khẩu Trực Tiếp
- **Mô tả:** Bổ sung nút **"🔑 Đổi Mật Khẩu"** vào menu dropdown người dùng ở góc trên bên phải, kích hoạt modal đổi mật khẩu tức thì cho Super Admin và tài khoản các đơn vị.

### [v4.0.0-rev15] - 01/09/2026: Quản Lý Mật Khẩu Super Admin & API changePassword
- **Backend:** Thêm action `changePassword` hỗ trợ đổi mật khẩu bảo mật (băm SHA-256) lưu vào bảng `cai_dat` với `unit_code = 'MASTER'`. Cập nhật `checkLogin` xác thực theo mã băm D1.
- **Frontend:** Xây dựng modal popup `#modal-change-password` với hiệu ứng làm mờ nền glassmorphism và kiểm tra độ dài tối thiểu 6 ký tự.

### [v4.0.0-rev14] - 01/09/2026: Cập Nhật Header Thương Hiệu Theo Từng Nhóm Đơn Vị
- **Mô tả:** Triển khai hàm `window.updateAppHeader(unitCode, role)` tự động cập nhật 3 dòng tiêu đề banner:
  - Đơn vị mới: *T.I.M.E.S SYSTEM / Hệ thống xếp lịch thủ thuật YHCT- PHCN thông minh / Nhanh gọn, tối ưu, chính xác*.
  - Đơn vị gốc `bvtks_cs2`: *BỆNH VIỆN THAN - KHOÁNG SẢN CS2 / KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG / Y HỌC TỐT, PHỤC HỒI NHANH*.
  - Super Admin: *T.I.M.E.S SYSTEM / HỆ THỐNG QUẢN LÝ ĐƠN VỊ & BẢN QUYỀN SAAS / TRUNG TÂM ĐIỀU HÀNH TOÀN CỤC*.

### [v4.0.0-rev13] - 01/09/2026: Căn Chỉnh Sticky Footer & Làm Sạch Bảng Chấm Công Đơn Vị Mới
- **CSS:** Sửa `.tab-scroll-content` và `.tab-content.active` sang Flexbox (`flex: 1 0 auto; min-height: 100%`), ghim chân trang (Footer) sát tận đáy màn hình khi tab có ít nội dung.
- **JS Chấm Công (`js/thongke.js`):** Loại bỏ gán cứng 13 nhân viên `bvtks_cs2` cho đơn vị mới; hiển thị thông báo hướng dẫn thêm nhân viên khi danh sách trống.

### [v4.0.0-rev12] - 01/09/2026: Dynamic White-Labeling Tên Đơn Vị Xuất Báo Cáo
- **Excel & PDF:** Chuyển đổi tên bệnh viện cứng trong các file xuất Excel Chấm công, Thống kê, Bảng thực lĩnh và Lịch trình sang lấy động theo `localStorage.getItem('pm_unit_name')`.

### [v4.0.0-rev10] - 01/09/2026: Cập Nhật Thông Tin Bản Quyền Chủ Sở Hữu Footer
- **Footer:** Cố định thông tin chủ sở hữu (Chủ sở hữu: Đặng Phong Thái, SĐT: 0392.283.473, Địa chỉ: Khu Vĩnh Lập, Mạo Khê, Quảng Ninh) và hiển thị đồng bộ trên mọi tài khoản bao gồm Super Admin.

### [v4.0.0-rev8] - 01/09/2026: Cách Ly Bộ Nhớ Cache Client Giữa Các Đơn Vị
- **IndexedDB & LocalStorage:** Phân tách khóa lưu trữ IndexedDB Dexie (`PMCG_Offline_DB_${unit_code}`) và LocalStorage (`times_bootstrap_cache_${unit_code}`). Bổ sung hàm dọn dẹp RAM State khi chuyển đổi người dùng.

### [v4.0.0-rev5] - 01/09/2026: Sửa Lỗi Schema Migration Composite Unique Keys
- **D1 Database:** Nâng cấp cấu trúc bảng `tai_khoan`, `cai_dat`, `nhan_su` với khóa `UNIQUE(unit_code, ...)`, xử lý triệt để lỗi 500 khi thêm đơn vị mới có cùng tên tài khoản `admin`.

### [v4.0.0-rev1] - 01/09/2026: Khởi Tạo Phiên Bản Thương Mại Đa Đơn Vị (Multi-Tenant SaaS)
- **Kiến trúc:** Bổ sung trường `unit_code` trên 15 bảng D1, tạo bảng `tenants`, xây dựng Cổng Quản trị Super Admin (`tab-tenants`), hỗ trợ đăng nhập đa cơ sở.
