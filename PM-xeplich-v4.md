# 🏥 PM-XepLich v4 (Multi-Tenant SaaS Commercial Edition)

> **Mô tả hệ thống**: Hệ thống Xếp lịch Thủ thuật Y học cổ truyền & Phục hồi chức năng tự động đa đơn vị (Multi-Tenant SaaS Architecture), chạy 100% trên nền tảng Cloudflare (Pages + Worker API + D1 Database) độc lập theo đơn vị.

---

## 1. 🏢 Kiến Trúc Đa Đơn Vị (Multi-Tenant Architecture)

- **Mã đơn vị mặc định:** `bvtks_cs2` (*Bệnh viện Than - Khoáng sản Cơ sở 2*).
- **Phân tách dữ liệu:** Row-level Tenant Clamping với trường `unit_code TEXT NOT NULL` trên toàn bộ 15 bảng D1.
- **Composite Unique Keys:**
  - `tai_khoan (unit_code, username)`
  - `cai_dat (unit_code, key)`
  - `nhan_su (unit_code, name)`
- **Bảng `tenants`:** `unit_code`, `unit_name`, `logo_url`, `phone`, `email`, `plan_tier`, `max_staff`, `max_patients`, `expires_at`, `is_active`
- **Đăng nhập:**
  - Nhập Mã Đơn Vị trực tiếp tại màn hình Đăng nhập (Mặc định: `bvtks_cs2`)
  - Phụ đề form: *"Nền tảng Xếp lịch thủ thuật YHCT - PHCN"*
  - Tiêu đề tab: *"T.I.M.E.S System - Phần mềm xếp lịch thủ thuật thông minh"*
  - Kiểm tra hạn bản quyền (`expires_at`) và kích hoạt (`is_active`)

---

## 2. 🔐 Phân Quyền & Giao Diện Theo Vai Trò

| Vai Trò | Tab Hiện | Tab Ẩn | Admin Menu |
|:---|:---|:---|:---|
| **SUPER_ADMIN** | Tab Quản Lý Đơn Vị SaaS + Tab Admin | Tất cả tab nghiệp vụ | Chỉ: Sao lưu & Khôi phục, Liên kết nhanh |
| **Admin / Nhân viên** | Tất cả tab nghiệp vụ | Tab Quản Lý Đơn Vị SaaS | Chỉ: Cài đặt, Tài khoản, Nhân sự, AI |

---

## 3. 🎨 Dynamic White-Labeling (Header 3 Dòng)

| Loại Tài Khoản | Dòng 1 | Dòng 2 | Dòng 3 |
|:---|:---|:---|:---|
| **Đơn vị mới** | T.I.M.E.S SYSTEM | Hệ thống xếp lịch thủ thuật YHCT- PHCN thông minh | Nhanh gọn, tối ưu, chính xác |
| **bvtks_cs2** | BỆNH VIỆN THAN - KHOÁNG SẢN CS2 | KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG | Y HỌC TỐT, PHỤC HỒI NHANH |
| **SUPER_ADMIN** | T.I.M.E.S SYSTEM | HỆ THỐNG QUẢN LÝ ĐƠN VỊ & BẢN QUYỀN SAAS | TRUNG TÂM ĐIỀU HÀNH TOÀN CỤC |

Hàm cập nhật: `window.updateAppHeader(unitCode, role)` — gọi ở `init.js` (DOMContentLoaded) và `app.js` (doLogin).

---

## 4. 🦶 Chân Trang (Sticky Footer)

- **Vị trí**: Ghim sát đáy màn hình (`margin-top: auto` + Flexbox `flex: 1 0 auto`)
- **Hiển thị**: Tất cả tài khoản, bao gồm Super Admin (`#tab-tenants.active`)
- **Nội dung cố định (chủ sở hữu bản quyền)**:
  - 🌿 THÔNG TIN CHỦ SỞ HỮU
  - 👤 Họ tên: Đặng Phong Thái
  - 📍 Địa chỉ: Khu Vĩnh Lập, phường Mạo Khê, tỉnh Quảng Ninh
  - 📞 Điện thoại: 0392.283.473

---

## 5. 🔑 Quản Lý Mật Khẩu

- **Nút Đổi Mật Khẩu**: Trong menu dropdown người dùng (`👤 superadmin ▾` → `🔑 Đổi Mật Khẩu`)
- **Super Admin**: Mã băm SHA-256 lưu trong D1 (`cai_dat WHERE unit_code='MASTER' AND key='superadmin_password_hash'`)
- **Tài khoản đơn vị**: Mã băm SHA-256 lưu trong `tai_khoan.password_hash`
- **API backend**: `case "changePassword"`
- **Mật khẩu Super Admin mặc định**: `Master@2026!` (đổi ngay sau lần đầu đăng nhập)

---

## 6. 🗄️ Cache & Data Isolation

- **IndexedDB Dexie**: `PMCG_Offline_DB_${unit_code}`
- **LocalStorage Bootstrap**: `times_bootstrap_cache_${unit_code}`
- **LocalStorage Chấm công**: `med_chamcong_employees_${unit_code}`
- **Đơn vị mới**: Toàn bộ danh sách bệnh nhân, lịch trình, nhân sự chấm công trống sạch (`[]`)
- **Bảng chấm công trống**: Hiển thị thông báo hướng dẫn thêm nhân viên thay vì load 13 nhân sự mặc định của `bvtks_cs2`

---

## 7. 📊 Báo Cáo & Xuất File Động Theo Đơn Vị

Tất cả file xuất Excel/PDF (Chấm công, Thống kê, Bảng thực lĩnh, Lịch trình) tự động lấy tên bệnh viện từ `localStorage.getItem('pm_unit_name')`.

---

## 8. 🧠 3 Bộ Giải Thuật Xếp Lịch

1. **CP Solver** (`js/cp-solver.js`): Branch-and-Bound / CP-SAT giải cứu ca thủ thuật bị rớt.
2. **Simulated Annealing** (`js/scheduler-engine.js`): Web Worker đa luồng tối ưu phòng/giường/máy/KTV.
3. **AI Pattern Scheduler** (`js/ai-scheduler.js`): Học máy lâm sàng 20,000 dòng lịch sử.

---

## 9. 🚀 Lệnh Deploy

```bash
# Kiểm tra cú pháp
node -c js/init.js && node -c js/app.js && node -c js/thongke.js && node -c backend/src/index.js

# Deploy Frontend (Cloudflare Pages)
cd backend && npm run deploy:web

# Deploy Backend API (Cloudflare Worker)
cd backend && npm run deploy

# Deploy tất cả
cd backend && npm run deploy:all

# Push GitHub
git add . && git commit -m "..." && git push origin main
```
- **Repository**: https://github.com/dpthai-bvtks/pmcg-v4
- **Live URL**: https://xeplichthuthuat.io.vn

---

## 10. 📝 Nhật Ký Phát Triển (Changelog)

### [v4.0.0-rev21] - 01/09/2026: Khắc Phục Triệt Để Lỗi Cuộn Màn Hình Tự Động & Khóa Khung Layout
- **Root Cause (Lỗi cuộn tự động / che mất Header)**:
  - Khi hệ thống điều hướng bằng hash (`#tab-...`), trình duyệt tự động kích hoạt hành vi cuộn neo (native anchor jump), kéo `window` nhảy xuống phía dưới 500-700px để đưa phần tử tab lên đỉnh màn hình $ightarrow$ làm toàn bộ phần Header (Logo, Tên bệnh viện, Đồng hồ, Nút bấm) bị trôi ra ngoài viewport, thanh chữ chạy (Marquee) bị kẹp mép trên.
- **Giải Pháp Triệt Để**:
  - Chuyển toàn bộ cơ chế chuyển Tab sang `window.switchTab` sử dụng `history.replaceState(null, '', '#' + targetTab)` thay vì gán trực tiếp hash. Cơ chế này cập nhật URL mà không làm trình duyệt cuộn trang.
  - Khóa chặt `html, body` với `overflow: hidden; height: 100vh; position: fixed; inset: 0;`, đưa toàn bộ hành vi cuộn vào bên trong duy nhất `.tab-scroll-content`.
  - Header và thanh chữ chạy Marquee luôn được ghim cố định ở đỉnh màn hình (`position: sticky; z-index: 1000`).
  - Hàm `loadTenantsList` được chuẩn hóa để xử lý cả response mảng trực tiếp lẫn object chứa `data: [...]`.

### [v4.0.0-rev26] - 01/09/2026: Căn Chỉnh Khung Split-Layout Song Song Ngang Tầm Sidebar
- **Nguyên nhân**: Trên màn hình máy tính thông thường, các thẻ `.main-table` bên trong `.split-layout` thiếu quy tắc flex `min-width: 0` và `height` cố định, khiến bảng dữ liệu bị rớt xuống dưới khung nhập liệu (`.sidebar-form`) thay vì nằm song song bên phải, buộc người dùng phải zoom out (thu nhỏ) mới xem được.
- **Xử lý**:
  - `.split-layout` được thiết lập `display: flex; flex-direction: row; height: calc(100vh - 180px); gap: 14px;`.
  - Cột Form nhập liệu bên trái (`.sidebar-form`) rộng cố định 340px, có thanh cuộn nội bộ (`.sidebar-form-body`) và nút bấm ghim đáy.
  - Cột Bảng dữ liệu bên phải (`.main-table`) chiếm toàn bộ không gian còn lại (`flex: 1 1 0%; min-width: 0;`), cuộn mượt mà hai chiều, tiêu đề bảng (`thead th`) cố định sticky.

### [v4.0.0-rev25] - 01/09/2026: Bổ Sung Safeguard Cho loadSystemSettings
- **Fix**: Thêm kiểm tra an toàn `if (typeof loadSystemSettings === 'function')` trong `DOMContentLoaded` tại dòng 2107 `js/app.js`, loại bỏ hoàn toàn lỗi `ReferenceError: loadSystemSettings is not defined` khi tải trang.

### [v4.0.0-rev24] - 01/09/2026: Khắc Phục Triệt Để Hiện Tượng Nhảy Anchor Khi Chuyển Tab
- **Nguyên nhân gốc rễ**: Khi bấm vào các tab, trình duyệt nhận thấy hash URL (`#tab-...`) khớp với `id` của phần tử HTML nên tự động kích hoạt cơ chế cuộn mốc (Anchor Scroll) của cửa sổ trình duyệt (`window`), làm toàn bộ phần Header bị đẩy lên phía trên đỉnh và phần nội dung tab bị trôi tít xuống đáy màn hình.
- **Giải pháp xử lý triệt để**:
  - Trong `js/app.js`: Chuyển cơ chế cập nhật URL sang `history.replaceState(null, null, '#' + targetTab)`. Phương thức này cập nhật hash trên thanh địa chỉ an toàn mà KHÔNG bao giờ làm trình duyệt cuộn hay nhảy trang.
  - Trong `css/style.css`: Khóa cứng `html, body { height: 100vh; overflow: hidden; }` và định tuyến `.main-wrapper` / `.container` chuẩn xác để chỉ phần `.tab-scroll-content` bên trong mới được phép cuộn độc lập.

### [v4.0.0-rev21..22] - 01/09/2026: Sửa Lỗi Cú Pháp Trùng Lặp & Khôi Phục Hiển Thị Toàn Bộ Tabs
- **Fix Lỗi Trọng Yếu 1 (SyntaxError crash JS)**:
  - Loại bỏ hoàn toàn khối mã nguồn sao lưu cục bộ bị dán lặp lại ở cuối file `js/app.js` gây lỗi `SyntaxError: Identifier 'BK_DB_NAME' has already been declared`. Lỗi này từng khiến trình duyệt ngừng thực thi toàn bộ JS sau khi tải trang.
- **Fix Lỗi Trọng Yếu 2 (Hiển thị tab và xóa inline style)**:
  - Chuẩn hóa quy tắc CSS `.tab-content { display: none !important; }` và `.tab-content.active { display: block !important; }`.
  - Trong `applyPermissions` và `handleHashChange`, xóa sạch các lệnh `c.style.display = 'none'` can thiệp inline, trao toàn quyền ẩn/hiện tab cho class `.active` của CSS.
- **Fix Lỗi Trọng Yếu 3 (API changePassword)**:
  - Cập nhật hàm `submitChangePassword` gọi chuẩn qua `callApi('changePassword', ...)`.

### [v4.0.0-rev20] - 01/09/2026: Tối Ưu Toàn Diện Header, Dòng Chữ Chạy & Tab Super Admin
- **Header & Dòng chữ chạy (Marquee)**:
  - Cố định layout flexbox cho `.header-fixed-section`, tách bạch giữa banner bệnh viện và thanh thông báo chạy.
  - Thanh `.global-marquee-container` có chiều cao cố định 28px, nền xanh dịu (`#f1f8e9`), chữ đỏ nổi bật (`#c0392b`), cuộn mượt mà dưới header.
  - `window.updateAppHeader` tự động cập nhật nội dung dòng chữ chạy phù hợp theo từng loại tài khoản (Super Admin / bvtks_cs2 / Đơn vị mới).
- **Tab Super Admin (#tab-tenants)**:
  - Bổ sung CSS padding và min-height riêng biệt cho `#tab-tenants.active`, đảm bảo giao diện luôn mở rộng đầy đủ nội dung.

### [v4.0.0-rev19] - 01/09/2026: Triệt Để Khắc Phục Màn Hình Trắng Super Admin & Xóa Nút Đăng Xuất Thừa
- **Bug 1 (Màn hình trắng Super Admin)**:
  - Hash Routing listener trong `DOMContentLoaded` mặc định đặt hash là `#tab-home` khi tải trang, khiến tab-home (bị ẩn bởi Super Admin) nhận class `.active`, trong khi `#tab-tenants` không có `.active` → Màn hình trống.
  - Khi `applyPermissions('SUPER_ADMIN')` chạy, chuyển trực tiếp sang hash `#tab-tenants` và gán ngay `targetEl.style.display = 'block'` + gọi `loadTenantsList()`.
- **Bug 2 (Thừa nút Đăng xuất)**:
  - Loại bỏ thẻ `<a>` Đăng xuất thừa nằm ngoài `#user-dropdown-menu` ở thanh header góc trên bên phải.
- **Bug 3 (offline-sync-engine.js:48 SyntaxError)**:
  - Đã dọn dẹp khối code lặp thừa sau `initDexie()` gây crash runtime JS.

### [v4.0.0-rev17] - 01/09/2026: Sửa Lỗi Trang Super Admin Trống
- **Bug**: Khi khôi phục session Super Admin từ localStorage, hàm `applyPermissions` gọi `targetBtn.click()` trước khi tab click listeners được đăng ký → tab-tenants không được kích hoạt → trang trắng.
- **Fix `js/app.js`**:
  - Thêm `setTimeout(..., 80)` bao ngoài `applyPermissions` trong `window.onload` để chờ DOM/listeners sẵn sàng.
  - Thêm `setTimeout(..., 200)` kiểm tra và kích hoạt `tab-tenants` thủ công nếu `active` class chưa được gán.
  - Thêm branch `if (targetTab === 'tab-tenants') loadTenantsList()` vào vòng lặp tab click listener thứ 2.

### [v4.0.0-rev16] - 01/09/2026: Hiển Thị Nút Đổi Mật Khẩu Trong Menu Người Dùng
- **Fix**: Nút `🔑 Đổi Mật Khẩu` bị mất sau lần cập nhật trước do regex replace thay thế sai block HTML dropdown.
- **Fix `index.html`**: Ghi đè toàn bộ block `#user-dropdown-menu` với đủ 3 mục: Quản Trị, Đổi Mật Khẩu, Đăng Xuất.

### [v4.0.0-rev15] - 01/09/2026: Quản Lý Mật Khẩu Super Admin & API changePassword
- **Backend** (`backend/src/index.js`):
  - Thêm `case "changePassword"`: Đổi mật khẩu bảo mật (SHA-256) cho cả Super Admin (lưu D1) và tài khoản đơn vị.
  - Nâng cấp `checkLogin` Super Admin: đọc hash từ D1 thay vì hardcode.
- **Frontend** (`index.html`, `js/app.js`):
  - Modal `#modal-change-password` với glassmorphism backdrop, kiểm tra tối thiểu 6 ký tự.
  - Hàm `window.openChangePasswordModal`, `window.closeChangePasswordModal`, `window.submitChangePassword`.

### [v4.0.0-rev14] - 01/09/2026: Header 3 Dòng Dynamic Theo Nhóm Tài Khoản
- **`index.html`**: Thêm ID `app-hospital-name`, `app-sub-title`, `app-slogan` vào banner header.
- **`js/init.js`**: Hàm `window.updateAppHeader(unitCode, role)` phân biệt 3 nhóm (Super Admin / bvtks_cs2 / Đơn vị mới).
- **`js/app.js`**: Gọi `window.updateAppHeader(uUnit, uRole)` sau khi đăng nhập thành công.

### [v4.0.0-rev13] - 01/09/2026: Sticky Footer & Bảng Chấm Công Sạch Đơn Vị Mới
- **`css/style.css`**: `.tab-scroll-content { display: flex; flex-direction: column }` + `.tab-content.active { flex: 1 0 auto; min-height: 100% }` → Footer ghim sát đáy.
- **`js/thongke.js`**: Hàm `getOrLoadChamCongEmployees` không còn fallback 13 nhân viên mặc định cho đơn vị mới; hiển thị thông báo hướng dẫn thay thế.

### [v4.0.0-rev12] - 01/09/2026: Tên Đơn Vị Động Trong Xuất File Excel/PDF
- **`js/thongke.js`**: Các sheet Excel (Chấm công, Thống kê 3 sheet, Thực lĩnh) thay `'BỆNH VIỆN THAN - KHOÁNG SẢN CS2'` bằng `localStorage.getItem('pm_unit_name').toUpperCase()`.
- **`js/app.js`**: Header Excel Lịch trình và PDF cũng lấy tên đơn vị động.

### [v4.0.0-rev11] - 01/09/2026: CSS Footer Bottom + Cham Cong Clean State
- **`css/style.css`**: `margin-top: auto` + min-height cho `#tab-tenants.active`, `#tab-home.active`, `#tab-chamcong.active`, `#tab-thongke.active`.

### [v4.0.0-rev10] - 01/09/2026: Footer Thông Tin Chủ Sở Hữu & Hiển Thị Trên Super Admin
- **`index.html`**: Cập nhật `<template id="khuon-duc-footer">`: Dòng 1: THÔNG TIN CHỦ SỞ HỮU, Dòng 2: Họ tên: Đặng Phong Thái, giữ nguyên dòng 3–4.
- **`css/style.css`**: Thêm `:not(:has(#tab-tenants.active))` vào selector ẩn footer.

### [v4.0.0-rev8..9] - 01/09/2026: Cache Isolation & Danh Sách Nhân Sự Chấm Công
- **`js/offline-sync-engine.js`**: IndexedDB Dexie scope theo `unit_code`.
- **`js/app.js`**: `getBootstrapCacheKey()` trả về `times_bootstrap_cache_${unit_code}`.
- **`js/init.js`**: Hàm `resetClientStateForNewUser(unitCode)` dọn RAM arrays khi đổi người dùng.
- **`js/thongke.js`**: `getChamCongStorageKey(key)` scope theo `unit_code`.
- **Backend**: `getEmployees`/`saveEmployees` scope `WHERE unit_code = ?`; đơn vị mới trả `[]`.

### [v4.0.0-rev6..7] - 01/09/2026: Tiêu Đề Tab & Login Subtitle
- **Tiêu đề tab**: Cố định `"T.I.M.E.S System - Phần mềm xếp lịch thủ thuật thông minh"` trên tất cả tài khoản.
- **Login subtitle**: `"Nền tảng Xếp lịch thủ thuật YHCT - PHCN"`.

### [v4.0.0-rev5] - 01/09/2026: Sửa Lỗi 500 addTenant & updateTenant
- **Backend**: Composite Unique Keys cho `tai_khoan`, `cai_dat`, `nhan_su`.
- **Backend**: `updateTenant` sanitize `undefined → null` trước khi `db.prepare().bind()`.

### [v4.0.0-rev1..4] - 01/09/2026: Khởi Tạo Multi-Tenant SaaS
- Thêm bảng `tenants`, trường `unit_code` trên 15 bảng D1.
- Bộ API SaaS: `getPublicUnits`, `getTenantsList`, `addTenant`, `updateTenant`, `toggleTenantStatus`, `deleteTenant`, `resetTenantAdminPassword`.
- Màn hình Đăng nhập thêm ô nhập Mã Đơn Vị.
- Tab `tab-tenants` (Cổng Quản Trị Super Admin) với thống kê, bảng danh sách, form thêm/sửa.
- Phân quyền tabs/admin-menu cho Super Admin vs Đơn vị.
