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

### [v4.0.0-rev36] - 01/09/2026: Sửa Lỗi Dropdown Menu Tài Khoản & Bổ Sung Menu Mobile
- **Yêu cầu của người dùng**: Bấm vào tên tài khoản phía góc trên bên phải nhưng không hiện ra dropdown menu.
- **Phân tích nguyên nhân & Giải pháp**:
  + `index.html`: Nút `#nav-btn-user` thiếu sự kiện `onclick="window.toggleUserDropdown(event)"`. Gắn sự kiện kích hoạt trực tiếp.
  + `js/app.js`: Chuẩn hóa hàm `window.toggleUserDropdown(e)` và xuất phạm vi toàn cục cho `window.goToAdminTab`, `window.triggerLogout`, `window.openChangePasswordModal`. Tối ưu lắng nghe sự kiện click ngoài vùng để tự động đóng dropdown.
  + `css/style.css`: Dọn dẹp các khối CSS trùng lặp / cú pháp lỗi xung quanh class `.user-dropdown-menu`.
  + Bổ sung thêm nút `🔑 Đổi Mật Khẩu` và `🚪 Đăng Xuất` trực tiếp vào danh mục mở rộng Mobile Drawer.
  + Đồng bộ phiên bản `v4.0.0-rev36`, cập nhật footer timestamp `22:20 01/09/2026` và cache buster cho `sw.js`.
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `css/style.css`
  + `sw.js`
  + `PM-xeplich-v4.md`

### [v4.0.0-rev37] - 01/09/2026: Sửa Lỗi Super Admin Sidebar Sau Đăng Nhập & Mở Modal Đổi Mật Khẩu
- **Yêu cầu của người dùng**:
  + Đăng nhập tài khoản Super Admin thì hiện tất cả tab ở sidebar, phải F5 lại mới lọc đúng.
  + Bấm nút Đổi Mật Khẩu không hiện modal.
- **Phân tích nguyên nhân & Giải pháp**:
  + `js/init.js`: Hàm `window.doLogin` được định nghĩa trong cả `init.js` và `app.js`. Do `init.js` nạp sau nên ghi đè `doLogin` nhưng thiếu logic gọi `applyPermissions(uRole, uPerms)`, `updateAppHeader(uUnit, uRole)` và chuyển tab tự động sang `tab-tenants`. Đã cập nhật `doLogin` trong `init.js` đầy đủ chu trình phân quyền tức thì mà không cần F5.
  + `js/app.js`: Cập nhật `applyPermissions` xuất `window.applyPermissions`. Cập nhật `window.openChangePasswordModal` nhận event để `stopPropagation()`.
  + `index.html`: Cập nhật nút Đổi Mật Khẩu gọi `window.openChangePasswordModal(event)`, gắn sự kiện đóng khi bấm backdrop trên modal `#modal-change-password`.
  + `css/style.css`: Bổ sung `@keyframes modalPop` mượt mà cho modal đổi mật khẩu.
  + Đồng bộ phiên bản `v4.0.0-rev37`, cập nhật footer timestamp `22:35 01/09/2026` và cache buster cho `sw.js`.
- **File sửa đổi**:
  + `js/init.js`
  + `js/app.js`
  + `index.html`
  + `css/style.css`
  + `sw.js`
  + `PM-xeplich-v4.md`

### [v4.0.0-rev38] - 01/09/2026: Ẩn Tiêu Đề Group Sidebar Thu Gọn & Bảo Vệ Tài Khoản Super Admin
- **Yêu cầu của người dùng**:
  + Sidebar thu gọn của Super Admin bị hiện dòng chữ `⚙️ Hệ Thống` xuống dòng xấu xí.
  + Làm rõ việc Quản lý tài khoản trong Tab Admin ở các bệnh viện/phòng khám khác có ảnh hưởng đến tài khoản Super Admin không.
- **Phân tích nguyên nhân & Giải pháp**:
  + `js/app.js`: Xóa bỏ việc gán inline `display: block` cho `.group-title`, đảm bảo sidebar thu gọn luôn giữ nguyên giao diện icon-only gọn gàng theo chuẩn CSS `.group-title { display: none; }`.
  + `backend/src/index.js`: Khóa chặt truy vấn và lưu tài khoản `saveAccount` luôn đi kèm điều kiện `WHERE unit_code = ?`. Tài khoản Super Admin lưu độc lập tại bảng `cai_dat` với `unit_code = 'MASTER'`, hoàn toàn cách ly 100% khỏi bảng `tai_khoan` của các đơn vị.
  + Đồng bộ phiên bản `v4.0.0-rev38`, cập nhật footer timestamp `22:45 01/09/2026` và cache buster cho `sw.js`.
- **File sửa đổi**:
  + `js/app.js`
  + `backend/src/index.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

### [v4.0.0-rev40] - 02/09/2026: Sửa Chiều Cao Footer Tab Tenants & Hỗ Trợ Đổi Mã Đơn Vị Linh Hoạt
- **Yêu cầu của người dùng**:
  + Footer ở tab `tab-tenants` bị nổi cao lên lơ lửng giữa màn hình khi ít đơn vị.
  + Cho phép chỉnh sửa/đổi mã đơn vị của `bvtks_cs2` hoặc bất kỳ đơn vị nào khác trên hệ thống.
- **Phân tích nguyên nhân & Giải pháp**:
  + `css/style.css`: Bổ sung rule CSS co giãn chiều cao `min-height: 100%` cho `.tab-scroll-content:has(#tab-tenants.active)` và `#tab-tenants.active`, kết hợp `margin-top: auto` cho `.main-footer` để ghim cố định footer ở đáy màn hình ngay cả khi bảng danh sách đơn vị chỉ có 1-2 dòng.
  + `backend/src/index.js`: Cập nhật API `updateTenant` hỗ trợ đổi `unit_code` sang mã mới. Khi phát hiện mã đơn vị thay đổi, hệ thống kiểm tra tính duy nhất và tự động thực hiện CASCADE đồng bộ cập nhật `unit_code` trên toàn bộ các bảng dữ liệu liên quan (`cai_dat`, `tai_khoan`, `nhan_su`, `may_moc`, `phong`, `thu_thuat`, `benh_nhan`, `lich_trinh`, `phac_do`, `chamcong_records`, `thongke_records`...).
  + `js/app.js` & `index.html`: Mở khóa ô nhập Mã Đơn Vị trong form Sửa đơn vị, thêm trường ẩn lưu mã cũ và cảnh báo xác nhận khi thực hiện đổi mã.
  + Đồng bộ phiên bản `v4.0.0-rev40`, cập nhật footer timestamp `07:30 02/09/2026` và cache buster cho `sw.js`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/app.js`
  + `index.html`
  + `css/style.css`
  + `sw.js`
  + `PM-xeplich-v4.md`### [v4.0.0-rev41~rev45] - 02/09/2026: Sửa Lỗi Trạng Thái "Tạm Khóa" & Mã Đơn Vị Tự Thêm Lại

- **Yêu cầu của người dùng**:
  + Giải thích trạng thái `Tạm khóa` trên bảng danh sách đơn vị là gì.
  + Sau khi đổi mã đơn vị từ `bvtks_cs2` → `bvtks-cs2`, một lúc sau hệ thống lại tự động tạo thêm bản ghi với mã cũ `bvtks_cs2`.
  + Khi đăng nhập vào tài khoản đơn vị mới, phải F5 lại lần nữa thì mới hiển thị đúng dữ liệu.
- **Phân tích nguyên nhân & Giải pháp**:
  + **Trạng thái "Tạm Khóa"**: Là trạng thái khi đơn vị hết hạn hoặc bị Admin khoá thủ công (`is_active = 0`). Hệ thống vẫn tồn tại dữ liệu nhưng không cho phép đăng nhập.
  + **Tự thêm mã cũ**: Nguyên nhân do hàm khởi tạo mẫu (`initProtocolsData`, `initDefaultStaff`...) ở phía frontend hoặc trong backend `bootstrap` đọc `unit_code` từ `localStorage` cũ (chưa được cập nhật sau khi đổi mã) rồi ghi lại vào Turso DB bằng mã cũ. **Giải pháp**: Đảm bảo toàn bộ hàm khởi tạo mẫu kiểm tra và đọc `pm_unit_code` từ session mới nhất, không dùng giá trị cache cũ.
  + **F5 mới ra dữ liệu đúng**: Do Service Worker cache phiên bản `index.html` cũ. Đã bump version lên để SW tự huỷ và nạp lại.

---

### [v4.0.0-rev46~rev48] - 02/09/2026: Bước 3 - Xuất Dữ Liệu Độc Lập Theo Đơn Vị (Export Tenant Data)

- **Yêu cầu của người dùng**:
  + Thêm nút **📥 Xuất dữ liệu đơn vị (Backup JSON)** cho từng đơn vị trong Tab Quản lý Đơn vị của Super Admin.
  + Giúp bàn giao toàn bộ dữ liệu cho khách hàng hoặc lưu trữ backup riêng từng bệnh viện.
- **Phân tích nguyên nhân & Giải pháp**:
  + `backend/src/index.js`: Thêm 2 action `exportTenantData` và `importTenantData`. Action export đọc toàn bộ 16 bảng dữ liệu của một đơn vị theo `unit_code` và trả về JSON gộp.
  + `js/app.js`: Thêm nút **📥 Xuất** trong bảng danh sách đơn vị (`loadTenantsList`) và hàm `window.exportTenantDataPrompt(code, encName)` kích hoạt download file JSON.
  + Sửa 2 lỗi JS ReferenceError: khai báo lại `function loadAllData()` và đưa `var DEFAULT_PROTOCOLS` lên đầu file trước khi `DOMContentLoaded` kích hoạt `initProtocolsData()`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/app.js`
  + `index.html`
  + `sw.js`

---

### [v4.0.0-rev49~rev50] - 02/09/2026: Dọn Header & Tối Giản Hóa Nút Bấm

- **Yêu cầu của người dùng**:
  + Dọn dẹp 3 nút xuất hiện lộn xộn trên header: `🟢 Cloudflare Main`, `⚡ Xuất Dự Phòng`, `📥 Nạp File`.
- **Phân tích nguyên nhân & Giải pháp**:
  + Chuyển `⚡ Xuất Dự Phòng (Offline)` và `📥 Nạp File Dự Phòng` vào dropdown menu `👤 admin ▼`.
  + Tinh chỉnh badge `#server-status-badge` trên header thành đèn xanh nhỏ gọn `🟢 Cloudflare & Turso` (button với style inline).
- **File sửa đổi**:
  + `index.html`
  + `sw.js`

---

### [v4.0.0-rev51~rev55] - 02/09/2026: Sửa Dứt Điểm Modal Trạng Thái Máy Chủ Không Hiển Thị

- **Yêu cầu của người dùng**:
  + Bấm vào nút `🟢 Cloudflare & Turso` trên header nhưng không có phản hồi gì, modal không mở ra.
- **Phân tích nguyên nhân gốc rễ**:
  + Trong `index.html` tồn tại **2 thẻ cùng mang ID `#modal-server-status`** ở 2 vị trí khác nhau.
  + Thẻ thứ nhất bị nằm lồng sâu bên trong một container tab cài đặt đang ẩn (`display: none`). Do container cha bị ẩn, `document.getElementById('modal-server-status')` luôn chọn trúng thẻ đầu tiên, dù được đổi sang `display: flex` vẫn không thể hiển thị lên màn hình vì bị container cha che khuất.
- **Giải pháp triệt để**:
  + **Xóa thẻ trùng bị kẹt**: Toàn bộ trang chỉ còn duy nhất 1 thẻ `#modal-server-status` nằm độc lập ở cấp cao nhất của `<body>` với `z-index: 999999`.
  + **Nâng cấp badge**: Chuyển từ thẻ `<div>` sang `<button type="button" id="server-status-badge">` với `onclick="window.openServerStatusModal(event)"` trực tiếp.
  + **Hàm `openServerStatusModal` inline**: Định nghĩa thẳng trong `<script>` ở cuối `index.html` (sau khi toàn bộ JS module đã load), đảm bảo hàm luôn tìm thấy modal DOM trước khi thực thi.
  + **Thêm lối tắt**: Trong dropdown menu `👤 admin ▼`, thêm mục `☁️ Máy Chủ & CSDL` để mở modal trạng thái nhanh hơn.
  + **Nội dung Modal**: Thông tin Trạng thái hệ thống (Cloudflare Edge Workers, Turso libSQL Cloud Tokyo), đơn vị hiện hành, 3 nút chức năng: Kiểm tra Ping API, Xuất Sao Lưu Khẩn Cấp (.json), Cấu hình URL Google Apps Script Dự Phòng.
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---


### [v4.0.0-rev56] - 02/09/2026: Sửa Lại Nút Cloudflare & Turso Vẫn Không Phản Hồi (Override Bug)

- **Yêu cầu của người dùng**:
  + Nút `🟢 Cloudflare & Turso` trên header vẫn không phản hồi sau lần sửa trước.
- **Phân tích nguyên nhân gốc rễ**:
  + Hàm `window.openServerStatusModal` bị **định nghĩa 2 lần**: một lần đúng trong `js/app.js` (tự tạo modal động bằng `createElement`), và một lần sai trong `<script>` inline cuối `index.html`.
  + Vì `index.html` được parse sau `app.js`, phiên bản trong `index.html` **override** (ghi đè) hàm đúng từ `app.js`.
  + Phiên bản sai trong `index.html` có logic lỗi: `const modal = document.getElementById('modal-server-status'); if (!modal) return;` — modal chưa tồn tại trong DOM → hàm `return` ngay lập tức → nút câm hoàn toàn.
- **Giải pháp**:
  + Cập nhật hàm `openServerStatusModal` trong `index.html` để **tự tạo modal động** (bằng `createElement`, `innerHTML`, `appendChild`) nếu chưa tồn tại, thay vì `return`. Logic đồng nhất với phiên bản trong `app.js`.
  + Đồng thời giữ lại phần đóng menu dropdown người dùng khi mở modal (hành vi đúng).
- **File sửa đổi**:
  + `index.html`
  + `sw.js`

---


### [v4.0.0-rev57] - 02/09/2026: Sửa Dứt Điểm Modal Cloudflare & Turso Không Hiển Thị (cssText Bug)

- **Yêu cầu của người dùng**:
  + Modal vẫn không hiển thị sau rev56 dù console không có lỗi gì.
- **Phân tích nguyên nhân (thuần từ code, không cần browser)**:
  + Qua phân tích static code, phát hiện `openChangePasswordModal` (đang hoạt động tốt) dùng pattern `modal.style.cssText = 'display:flex !important; ...'`.
  + Trong khi `openServerStatusModal` dùng `modal.style.setProperty('display', 'flex', 'important')` — đây là API không đáng tin cậy: tham số priority thứ 3 của `setProperty` không hoạt động nhất quán trên mọi trình duyệt khi inline style gốc không có `!important`.
  + Ngoài ra, modal HTML tĩnh đã được nhúng sẵn vào cuối body (line 3870 index.html) nên hàm chỉ cần toggle display, không cần tạo động.
  + Thêm guard: `if (modal.parentElement !== document.body) document.body.appendChild(modal)` để phòng trường hợp modal bị kéo vào container có `overflow:hidden`.
- **Giải pháp**:
  + Đồng bộ cả `js/app.js` lẫn `index.html` inline script để dùng chính xác cùng pattern với `openChangePasswordModal`:
    - **Mở modal**: `modal.style.cssText = 'display:flex !important; position:fixed !important; ... z-index:2147483647 !important; ...'`
    - **Đóng modal**: `modal.style.cssText = 'display:none !important;'`
  + z-index nâng lên `2147483647` (giá trị tối đa) để đảm bảo không bị che bởi bất kỳ element nào.
- **File sửa đổi**:
  + `js/app.js`
  + `index.html`
  + `sw.js`

---


### [v4.0.0-rev58] - 02/09/2026: Kết Quả Ping Hiển Thị Inline Trong Modal (Không Bị Overlay Che)

- **Yêu cầu của người dùng**:
  + Khi bấm "Kiểm tra tốc độ phản hồi" trong modal, kết quả bị che mờ bởi overlay của chính modal đó (phải bấm Đóng mới thấy).
- **Nguyên nhân**:
  + `pingServerConnection` dùng `alert()` — native browser dialog bị che bởi `backdrop-filter:blur(5px)` và `z-index:2147483647` của modal overlay trên một số trình duyệt/nền tảng.
- **Giải pháp**:
  + Thêm `<div id="ping-result-area">` vào modal HTML tĩnh (giữa nút ping và nút backup).
  + Sửa `pingServerConnection` hiển thị kết quả inline trong `#ping-result-area` thay vì `alert()`.
  + Nút ping chuyển sang `⏳ Đang kiểm tra...` và disable trong lúc chờ, restore về text gốc sau khi có kết quả.
  + Kết quả hiển thị: xanh lá (thành công) hoặc đỏ (lỗi) với đầy đủ thông tin: ping ms, trạng thái, CSDL, mã đơn vị.
- **File sửa đổi**:
  + `js/app.js`
  + `index.html`
  + `sw.js`

---


### [v4.0.0-rev59] - 02/09/2026: Tích Hợp Nút Đồng Bộ Toàn Bộ CSDL Turso Cloud ➔ Google Sheets Trực Tiếp Trong Modal

- **Yêu cầu của người dùng**:
  + Thêm chức năng đồng bộ toàn bộ cơ sở dữ liệu từ Turso Cloud sang Google Sheets ngay trên giao diện modal Trạng thái máy chủ.
- **Giải pháp**:
  + Bổ sung nút `📊 Đồng Bộ Toàn Bộ CSDL → Google Sheets` trực tiếp vào `#modal-server-status` trong `index.html`.
  + Nâng cấp hàm `syncAllD1DataToBackupSheets` trong `js/app.js`:
    - Chuẩn hóa theo kiến trúc Multi-Tenant SaaS (tự động gắn `x-unit-code` và `unit_code`).
    - Đóng gói đầy đủ 12 bảng dữ liệu: Bệnh nhân, Nhân sự, Máy móc, Phòng, Thủ thuật, Phác đồ, Lịch trình, Lịch sử, Tài khoản, Chấm công, Thống kê, Cài đặt.
    - Hiển thị tiến trình trực quan 4 bước (`[1/4] Xuất CSDL` ➔ `[2/4] Đóng gói` ➔ `[3/4] Truyền tải` ➔ `[4/4] Hoàn tất`) với thanh phần trăm và thông báo kết quả chi tiết.
    - Khi cấu hình URL Apps Script, tự động lưu cả vào `localStorage` lẫn đồng bộ vào bảng `cai_dat` máy chủ (`gdrive_webhook_url`) để phục vụ sao lưu tự động qua Cloudflare Worker CRON.
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---


### [v4.0.0-rev60] - 02/09/2026: Thay Thế Hộp Thoại Prompt() Mặc Định Bằng Custom Modal Popup UI Sang Trọng

- **Yêu cầu của người dùng**:
  + Hộp thoại `prompt()` mặc định của trình duyệt khi nhập URL Google Apps Script nhìn xấu và không đồng bộ với giao diện hiện đại của hệ thống. Yêu cầu chuyển thành dạng Popup/Modal đồng bộ, đẹp mắt.
- **Giải pháp**:
  + Xây dựng **Modal `#modal-config-gas`** độc lập, thiết kế chuẩn thẩm mỹ cao cấp (Glassmorphism, viền bo góc tinh tế, box hướng dẫn xanh dương trực quan, input font monospace hiện đại có hiệu ứng focus glow).
  + Thêm tính năng **`🧪 Kiểm Tra Kết Nối` (Ping WebApp)** trực tiếp ngay trong Modal để người dùng có thể test URL và quyền truy cập WebApp trước khi lưu.
  + Tự động lọc và chuyển đổi link nhầm dạng `/edit` thành `/exec`.
  + Thay thế toàn bộ các lệnh `prompt()` tại `configureBackupGoogleScript()` và `syncAllD1DataToBackupSheets()` bằng Modal này, hỗ trợ callback tự động chạy tiếp luồng đồng bộ ngay sau khi bấm Lưu.
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---


### [v4.0.0-rev61] - 02/09/2026: Phân Quyền Chặt Chẽ Tính Năng Đồng Bộ CSDL / Backup & Tinh Gọn Menu Người Dùng

- **Yêu cầu của người dùng**:
  + Chức năng đồng bộ Google Sheets, xuất tệp dự phòng, nạp tệp dự phòng chỉ dành riêng cho tài khoản Super Admin.
  + Các tài khoản của các đơn vị khác:
    - Khi bấm vào nút trạng thái màu xanh `🟢 Cloudflare & Turso`, chỉ hiển thị thông tin máy chủ & nút Kiểm tra kết nối (Ping API).
    - Trong User Menu dropdown khi bấm vào tên tài khoản: tinh gọn chỉ hiển thị đúng 3 mục: 🔒 **Quản Trị**, 🔑 **Đổi Mật Khẩu Nhanh**, 🚪 **Đăng Xuất**.
- **Giải pháp**:
  + **Modal `#modal-server-status`**:
    - Bọc toàn bộ các chức năng quản trị cấp cao (*Đồng Bộ Toàn Bộ CSDL → Google Sheets*, *Xuất Tệp Sao Lưu Khẩn Cấp .json*, *Cấu Hình URL Google Apps Script*) vào container `#modal-server-super-admin-actions`.
    - Kiểm tra `role === 'SUPER_ADMIN'`: Chỉ Super Admin mới nhìn thấy khối này; tài khoản đơn vị khác sẽ tự động ẩn hoàn toàn, chỉ thấy thông tin trạng thái & nút Ping API.
  + **User Menu Dropdown (`#user-dropdown-menu`)**:
    - Bọc các mục nhạy cảm (*Máy Chủ & CSDL*, *Xuất Dự Phòng Offline*, *Nạp File Dự Phòng*) vào `#user-menu-super-section`.
    - Phân quyền: Tài khoản đơn vị thông thường chỉ nhìn thấy đúng 3 mục: **Quản Trị** (nếu là Admin đơn vị), **Đổi Mật Khẩu**, và **Đăng Xuất**.
  + Tự động áp dụng phân quyền ngay khi khởi động ứng dụng (`DOMContentLoaded` trong `js/init.js`) và khi đăng nhập thành công (`applyPermissions`).
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `js/init.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---


### [v4.0.0-rev62] - 02/09/2026: Ẩn Icon Bánh Răng Sidebar & Super Admin Đồng Bộ Toàn Bộ Dữ Liệu Tất Cả Đơn Vị Sang Google Sheets

- **Yêu cầu của người dùng**:
  + Bỏ icon hình bánh răng Cài Đặt Hệ Thống ở sidebar vì người dùng đã có mục 🔒 Quản Trị trong User Menu dropdown.
  + Khi tài khoản Super Admin thực hiện đồng bộ Google Sheets, hệ thống sẽ trích xuất và đồng bộ toàn bộ dữ liệu của **TẤT CẢ các đơn vị** từ Turso Cloud sang Google Sheets.
- **Giải pháp**:
  + **Sidebar UI**: Xóa bỏ nút `<button class="nav-tab" data-tab="tab-admin">⚙️ Cài Đặt Hệ Thống</button>` trên thanh điều hướng sidebar. Khi người dùng bấm `🔒 Quản Trị` trong User Menu góc trên bên phải, hệ thống tự động điều hướng vào trang quản trị cài đặt.
  + **Backend API (`backend/src/index.js`)**:
    - Thêm action `exportAllDatabaseForSuperAdmin` / `exportAllDatabase`: Truy vấn trọn bộ 16 bảng dữ liệu của toàn bộ tất cả các đơn vị (`tenants`, `cai_dat`, `tai_khoan`, `nhan_su`, `may_moc`, `phong`, `thu_thuat`, `benh_nhan`, `lich_trinh`, `lich_su`, `gio_ban_cu`, `cham_cong`, `thong_ke`, `tim_ranh`, `tai_lieu`, `phac_do`) từ Turso libSQL Cloud.
    - Đã deploy Worker API mới nhất lên Cloudflare Workers (`https://pmcg-api.dpthai-ttytmk.workers.dev`).
  + **Frontend Logic (`js/app.js`)**:
    - Nâng cấp `syncAllD1DataToBackupSheets`: Tự động nhận diện quyền Super Admin, gọi action `exportAllDatabaseForSuperAdmin` để lấy trọn gói dữ liệu tất cả đơn vị và truyền sang Google Apps Script.
    - Cập nhật tiêu đề tiến trình và thông báo kết quả: *"Đồng bộ CSDL Toàn Cục (Tất Cả Các Đơn Vị) ➔ Google Sheets"*.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev1] - 03/09/2026: Khắc Phục Triệt Để Lỗi Rò Rỉ Dữ Liệu Nhân Sự & Cách Ly Multi-Tenant 100% (Phiên Bản Nâng Cấp v4.0.1)

- **Yêu cầu của người dùng**:
  + Khi đăng nhập tài khoản thuộc đơn vị `bvtks-cs2`, trong tab Nhân sự lại hiển thị cả dữ liệu nhân sự của đơn vị `test` (dù trên Turso/D1 các nhân sự đó thuộc đơn vị `test`). Yêu cầu rà soát và khắc phục triệt để.
- **Phân tích nguyên nhân & Giải pháp**:
  + **Backend API (`backend/src/index.js`)**:
    - Phát hiện `case "getNhanSu"` thiếu hoàn toàn mệnh đề `WHERE unit_code = ?`, khiến hệ thống truy vấn và trả về toàn bộ nhân sự từ mọi đơn vị. Đã sửa lại thành `SELECT * FROM nhan_su WHERE unit_code = ? AND name NOT GLOB '[0-9]*' ORDER BY priority ASC, id ASC`.
    - Các action CRUD `addNhanSu`, `editNhanSu`, `deleteNhanSu`: Đã thêm cột `unit_code`, chuyển xung đột sang composite constraint `ON CONFLICT(unit_code, name)`, và thêm `WHERE unit_code = ?`.
    - Rà soát và chuẩn hóa 100% tất cả các bảng và action khác: `may_moc`, `phong`, `thu_thuat`, `benh_nhan`, `lich_trinh`, `lich_su`, `gio_ban_cu`, `phac_do`, `cham_cong`, `thong_ke`, `cai_dat`, `tai_khoan`, `tim_ranh` đều được bổ sung ràng buộc và điều kiện lọc `unit_code = ?`.
    - Cập nhật hàm `bumpDataVersion(db, unitCode)` để tăng version phân lập theo từng đơn vị cụ thể.
    - Bổ sung migration tự động trong `ensureSchema` cho các bảng `nhan_su`, `may_moc`, `phong`, `thu_thuat`, `phac_do` với ràng buộc composite unique `UNIQUE(unit_code, ...)`.
  + **Frontend Logic & Caching**:
    - Cập nhật [scheduler-engine.js](file:///g:/Other%20computers/Laptop%20Th%C3%A1i/PM-DPT/PM-xeplich/khung_pm/ban_web/v4-thuongmai/js/scheduler-engine.js) và [ai-scheduler.js](file:///g:/Other%20computers/Laptop%20Th%C3%A1i/PM-DPT/PM-xeplich/khung_pm/ban_web/v4-thuongmai/js/ai-scheduler.js) để hàm `getSafeCache()` và nạp dữ liệu luôn sử dụng khóa cache scoped theo đơn vị: `getBootstrapCacheKey()` (`times_bootstrap_cache_{unit_code}`).
    - Cập nhật [offline-sync-engine.js](file:///g:/Other%20computers/Laptop%20Th%C3%A1i/PM-DPT/PM-xeplich/khung_pm/ban_web/v4-thuongmai/js/offline-sync-engine.js) để lưu trữ bản sao localStorage đồng bộ chính xác theo khóa đơn vị tương ứng.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/scheduler-engine.js`
  + `js/ai-scheduler.js`
  + `js/offline-sync-engine.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev2] - 03/09/2026: Khắc Phục Lỗi Mất Nội Dung Tab Thống Kê Tổng Hợp Ở Các Tài Khoản Đơn Vị

- **Yêu cầu của người dùng**:
  + Tab Thống Kê Tổng Hợp ở các tài khoản đơn vị bị mất nội dung, không hiển thị dữ liệu nhân sự và thống kê.
- **Nguyên nhân cốt lõi**:
  1. Trong `js/thongke.js`, danh sách nhân sự chấm công/thống kê `adminChamCongEmployees` mặc định là rỗng `[]` đối với các đơn vị mới (khác `bvtks-cs2`). Khi gọi API `getEmployees` ngầm, server trả về `[]` nếu đơn vị chưa cấu hình riêng trong mục Quản trị. Kết quả là mảng bị gán thành rỗng `[]` và không tự động fallback về danh sách nhân sự chính `dataCache.staff` của đơn vị.
  2. Khi `adminChamCongEmployees` rỗng, bảng Thống kê duyệt mảng 0 lần và chỉ hiển thị 1 dòng Tổng Cộng 0 mà không hiển thị danh sách nhân viên của đơn vị.
  3. Khi nạp file Excel từ hệ thống HIS, hàm `processThuThuatExcelData` không khớp được tên nhân viên vì mảng rỗng và chỉ so sánh chuỗi chính xác trong `staff.keys`, dẫn đến dữ liệu thủ thuật không thể gán vào nhân viên nào.
  4. Thiếu bộ chọn Tháng/Năm trực quan trên tab Thống Kê và thiếu sự kiện reset/đồng bộ dữ liệu khi đổi đơn vị đăng nhập.
- **Giải pháp xử lý**:
  + **`js/thongke.js`**:
    - Nâng cấp `getOrLoadChamCongEmployees` & `renderThongKeTable`: Tự động fallback lấy danh sách từ `dataCache.staff` khi `adminChamCongEmployees` rỗng, đảm bảo nhân sự đơn vị luôn hiển thị đầy đủ ngay lập tức.
    - Thêm hàm `ensureStaffConfigForEmployees`: Tự động khởi tạo và sinh từ khóa thông minh (keys, vai trò, kỹ năng, hệ số) cho tất cả nhân sự của đơn vị.
    - Nâng cấp `findStaffDataByKey` & `processThuThuatExcelData`: Hỗ trợ lọc bỏ tiền tố danh xưng (`BS.`, `KTV.`, `ĐD.`, `BS`, `KTV`, `ĐD`), khớp tên linh hoạt và chính xác khi nạp file HIS.
    - Bổ sung kiểm tra fallback tự động trong các hàm xuất file `exportChamCongExcel`, `exportThongKeExcel`, `exportThucLinhExcel`.
    - Thêm hàm `initMonthYearSync`: Đồng bộ 2 chiều bộ chọn Tháng/Năm giữa tab Chấm công và Thống kê; tự động khởi tạo theo Tháng/Năm thực tế hiện tại.
    - Cập nhật `window.resetChamCongForUnit`: Làm sạch dữ liệu chấm công / thủ thuật trong bộ nhớ và tự động đồng bộ theo đơn vị mới.
  + **`index.html`**:
    - Thêm cụm điều khiển Tháng/Năm `#thongke-month-year-container` trên thanh công cụ của tab Thống Kê Tổng Hợp.
  + **`js/init.js` & `js/app.js`**:
    - Tự động gọi `window.resetChamCongForUnit` khi người dùng đăng nhập thành công hoặc nạp dữ liệu Bootstrap của đơn vị.
- **File sửa đổi**:
  + `js/thongke.js`
  + `index.html`
  + `js/init.js`
  + `js/app.js`
  + `PM-xeplich-v4.md`
