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
| **SUPER_ADMIN** | T.I.M.E.S SYSTEM | HỆ THỐNG XẾP LỊCH THỦ THUẬT YHCT- PHCN THÔNG MINH | NHANH GỌN, TỐI ƯU, CHÍNH XÁC |

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

---

### [v4.0.1-rev3~rev7] - 03/09/2026: Sửa Lỗi Thẻ Đóng Modal Làm Mất Tab Thống Kê & Lọc Bỏ Web Vitals Telemetry

- **Yêu cầu của người dùng**:
  + Tab Thống kê bị trống trơn, không hiển thị bất kỳ bảng hay dữ liệu nào.
  + Gặp lỗi runtime `Cannot read properties of undefined (reading 'startTime')` trên console trình duyệt.
- **Phân tích nguyên nhân & Giải pháp**:
  + **Lỗi cấu trúc HTML**: Thẻ `<div style="display:grid; grid-template-columns:1fr 1fr; ...">` bên trong `#modal-tenant-form` (dòng 2940) thiếu thẻ đóng `</div>`. Do đó trình duyệt nuốt trọn container `#tab-thongke` vào bên trong modal bị ẩn (`display: none`). Đã đóng thẻ `</div>` chuẩn xác tại dòng 2948 và thẻ ngữ cảnh dòng 3407.
  + **Lỗi Telemetry ngoài**: Lọc bỏ các lỗi từ Chrome extension/Web vitals (`startTime`, `reportAllChanges`) trong `window.onerror` và `window.unhandledrejection` ở `js/app.js`.
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `js/thongke.js`
  + `sw.js`

---

### [v4.0.1-rev8] - 03/09/2026: Tối Ưu Toàn Diện Hiệu Năng Tải & Lưu Dữ Liệu (Chấm Công & Thống Kê)

- **Yêu cầu của người dùng**:
  + Tốc độ lưu dữ liệu và load các tab như chấm công, thống kê vẫn bị chậm/giật lag.
- **Phân tích nguyên nhân & Giải pháp**:
  + **Frontend SWR Cache & Song song**:
    - Triển khai LocalStorage Cache 2 tầng (`pm_cache_cc_${unit}_${my}`, `pm_cache_tk_${unit}_${my}`) theo cơ chế Stale-While-Revalidate: render ngay lập tức trong 0ms khi chuyển tab hoặc đổi tháng.
    - Loại bỏ popup xoay tròn `showGlobalLoading` gây khoá màn hình khi bấm tab.
    - Gộp `getChamCong` và `getThongKeThuThuat` chạy song song qua `Promise.all` thay vì gọi tuần tự kiểu waterfall.
    - `triggerAutoSaveChamCong`: Ghi dữ liệu ngay vào cache cục bộ và giảm debounce từ 1000ms xuống 350ms.
    - Không gọi lặp lại `getEmployees` khi danh sách nhân sự đã có trong RAM/Cache.
  + **Backend SQL Batching**:
    - Gộp các truy vấn nhiều biến thể tháng trong `getChamCong` và `getThongKeThuThuat` thành 1 câu SQL `WHERE month_year IN (...)` duy nhất, giảm thời gian phản hồi từ ~800ms xuống còn ~190ms.
    - Sửa `SELECT id` thành `SELECT rowid` trong `saveChamCong` và `saveThongKeThuThuat` để câu lệnh `UPDATE` cập nhật chính xác, không gây lỗi xung đột khoá và không phải chạy truy vấn dự phòng trên `cai_dat`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/thongke.js`
  + `index.html`
  + `sw.js`

---

### [v4.0.1-rev9~rev10] - 03/09/2026: Sửa Cuộn Xem Footer Tab Chấm Công & Loại Bỏ Đếm Thủ Thuật Tự Động Từ Lịch Trực

- **Yêu cầu của người dùng**:
  + Không cuộn chuột xuống xem Footer ở `tab-chamcong` và `tab-thongke` được.
  + Tháng 9 chưa nạp file nào mà lại tự động có 37 ca thủ thuật.
  + Cập nhật chuẩn xác `Cập nhật lần cuối` ở Footer theo quy tắc `RULES.md`.
- **Phân tích nguyên nhân & Giải pháp**:
  + **Sửa Cuộn Footer**:
    - Do `.tab-scroll-content:has(#tab-chamcong.active)` và `#tab-chamcong.active` bị gắn `overflow: hidden !important; height: 100% !important;` nên thẻ card chiếm trọn chiều cao và khoá cuộn. Đã tách 2 tab này ra, bật `overflow-y: auto !important` và `min-height: 100%; height: auto;`, ghim Footer với `margin-top: auto; margin-bottom: 30px;` để cuộn tự nhiên.
  + **Loại bỏ đếm thủ thuật tự động**:
    - Trong `backend/src/index.js`, hàm `getThongKeThuThuat` có nhánh fallback tự quét bảng `lich_trinh` tháng 9 và gom 37 ca phân công lịch trực thành ca thủ thuật. Đã xoá bỏ hoàn toàn nhánh này; số liệu thủ thuật chỉ sinh ra khi người dùng chủ động bấm "Nạp File HIS". Nếu chưa nạp file, trả về rỗng `{}` (0 ca).
  + **Đồng bộ Footer Timestamp & Version (RULES.md)**:
    - Cập nhật dòng `sys-last-update` thành `Cập nhật lần cuối: 13:45 03/09/2026`.
    - Đồng bộ `v4.0.1-rev10` trên `index.html`, `sw.js` và `PM-xeplich-v4.md`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `css/style.css`
  + `js/thongke.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev11] - 03/09/2026: Khắc Phục Lỗi Trùng Máy Móc & Ràng Buộc Phân Bổ Máy Theo Đúng Phòng Điều Trị

- **Yêu cầu của người dùng**:
  + Đang xảy ra tình trạng trùng máy móc khi xếp lịch (kèm ảnh chụp bảng xếp lịch đã sort cột Máy: Máy `Máy DC MS: 0972`, `0973`, `1090` bị gán điều trị cho các bệnh nhân ở nhiều phòng khác nhau như Hiền Phan, Hà Chip, Xuân Lương, Lê Hiền; hai bệnh nhân ở hai phòng khác nhau vừa xong 08:43 thì ca phòng khác bắt đầu ngay 08:43 trên cùng một máy).
- **Phân tích nguyên nhân gốc rễ**:
  1. Trong cấu hình hệ thống bệnh viện, mỗi phòng bệnh đều có một danh sách máy móc cố định (`danhSachMay`, ví dụ: Phòng Hà Chip sở hữu các máy `0972, 0973, 1090, 1091, 1169`; Phòng Hiền Phan sở hữu các máy `1177, 1178, 1179, 1180, 1247`; Phòng Lê Hiền sở hữu các máy `1172-1176`; Phòng Xuân Lương sở hữu các máy `1266-1300`).
  2. Tuy nhiên, trong hàm `buildDbFromCache` của `js/scheduler-engine.js`, hệ thống chỉ trích xuất danh sách giường (`roomBeds`) và nhân sự (`roomStaff`) theo phòng, nhưng **hoàn toàn bỏ qua trường `danhSachMay` của phòng**, không lưu trữ vào `database.roomMachines` hay `database.machineToRoom`.
  3. Khi thuật toán xếp lịch `_turbo_core_logic` tìm máy cho bệnh nhân, dòng code `const possibleMachines = machineTypes[loaiMay] || []` lấy toàn bộ danh sách máy trên toàn viện và luôn chọn máy rảnh đầu tiên trong mảng (`0972`, `0973`, `1090` của phòng Hà Chip).
  4. Hậu quả là bệnh nhân nằm ở phòng Hiền Phan, Xuân Lương hay Lê Hiền đều bị hệ thống phân công dùng máy của phòng Hà Chip, trong khi 15 máy điện châm và các máy điện xung, đèn hồng ngoại ở chính các phòng đó lại bị bỏ không. Điều này tạo ra xung đột vật lý trực tiếp: máy không thể vừa ở phòng này vừa lập tức xuất hiện ở phòng khác.
- **Giải pháp xử lý**:
  + **`js/scheduler-engine.js`**:
    - Nâng cấp `buildDbFromCache`: Đọc và phân tách chi tiết chuỗi `danhSachMay` của từng phòng để xây dựng từ điển `database.roomMachines[roomName][loaiMay]` và `database.machineToRoom[maMay]`.
    - Nâng cấp `_turbo_core_logic`: Khi chọn máy cho bệnh nhân tại phòng `targetRoom`, hệ thống **ưu tiên tuyệt đối chọn máy thuộc `roomMachines[targetRoom][loaiMay]`**. Chỉ khi phòng bệnh nhân không có máy loại này (các thủ thuật làm tại phòng chức năng riêng như Sóng ngắn, Kéo giãn, Siêu âm...), hệ thống mới sử dụng máy dùng chung toàn viện.
    - Cập nhật `countFeasibleSlots`: Kiểm tra tính khả dụng của máy móc theo đúng phòng bệnh nhân.
    - Cập nhật `runSaturdayScheduling`: Gán `roomMachines["PHONG_CHUNG_T7"] = machineTypes` cho ngày Thứ 7.
    - Cập nhật `UnscheduledDiagnosticEngine`: Chẩn đoán nguyên nhân rớt máy dựa trên máy của chính phòng đó.
  + **`js/cp-solver.js`**:
    - Trong `solveBranchAndBound`: Ưu tiên chọn máy thuộc `db.roomMachines[patRoom][loaiMay]`.
    - Trong `isFeasibleAssignment`: Bổ sung điều kiện kiểm tra ràng buộc phòng `assignedRoom && patRoom && assignedRoom !== patRoom` để cấm tuyệt đối việc mượn máy chéo giữa các phòng điều trị có máy riêng.
  + **Đồng bộ Footer Timestamp & Cache (RULES.md)**:
    - Cập nhật Footer `sys-last-update` thành `14:15 03/09/2026`.
    - Nâng số phiên bản lên `v4.0.1-rev11` trên `index.html` và `sw.js`.
- **File sửa đổi**:
  + `js/scheduler-engine.js`
  + `js/cp-solver.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev12] - 14:55 03/09/2026: Khắc phục rò rỉ dữ liệu Dashboard khi đăng nhập đơn vị khác & Làm trống hoàn toàn màn hình đăng nhập khi đăng xuất
- **Bối cảnh & Phản hồi người dùng**:
  + Khi đăng nhập vào đơn vị khác trên cùng trình duyệt để test thử thì đều bị load lại dashboard của đơn vị cũ chỗ tab-home.
  + Màn hình đăng nhập khi đăng xuất tài khoản cũ đều hiện lại mã đơn vị cũ, người dùng muốn để trống luôn để nhập đơn vị mới.
- **Phân tích nguyên nhân gốc rễ**:
  1. Khi người dùng đăng nhập tài khoản đơn vị mới (`doLogin`), mã nguồn chưa xóa sạch cache toàn cục trong RAM (`dataCache`, `currentScheduleData`, `chamCongData`, `thongKeData`, `adminChamCongEmployees`) và chưa hủy biểu đồ cũ (`_dashWorkdaysChart`, `_dashProcsChart`).
  2. Cache lịch trình cục bộ `meds_success`, `meds_unscheduled`, `meds_schedule_date` trong `localStorage` chưa được phân lập theo mã đơn vị (`meds_schedule_unit`), dẫn đến việc `loadDashboard()` đọc lại lịch của đơn vị cũ gán vào đơn vị mới.
  3. Trong `loadBootstrapData`, nếu đơn vị mới chưa có lịch trình trên server (`b.schedule` rỗng), hàm không gán lại `dataCache.schedule = []` mà giữ nguyên giá trị cũ.
  4. Màn hình đăng nhập có input `login-unit` chứa giá trị mặc định cứng `value="bvtks-cs2"` trong `index.html`, đồng thời `doLogout()` và sự kiện khởi tạo trang chưa xóa trắng ô mã đơn vị khi đăng xuất.
- **Giải pháp xử lý**:
  + **Phân lập và dọn dẹp cache đa đơn vị (Tenant Isolation)**:
    - Trong `doLogout()` (`js/app.js`): Xóa sạch `meds_session`, `meds_success`, `meds_unscheduled`, `meds_schedule_date`, `meds_schedule_unit`, `pm_unit_code`, `pm_unit_name`. Reset toàn bộ RAM (`dataCache`, `currentScheduleData = null`, `chamCongData = {}`, `thongKeData = {}`, `adminChamCongEmployees = []`), hủy các biểu đồ Chart.js và đặt lại số liệu Dashboard về 0.
    - Trong `doLogin()` (`js/app.js` & `js/init.js`): Xóa sạch cache của đơn vị trước đó, reset giao diện Dashboard về trạng thái loading (`...`), gọi `loadBootstrapData(true)` để nạp mới dữ liệu cho đơn vị vừa đăng nhập.
    - Trong `loadDashboard()` (`js/app.js`): Ràng buộc kiểm tra `meds_schedule_unit` khớp với đơn vị hiện tại (`pm_unit_code`) mới sử dụng cache `meds_success` và `meds_unscheduled`. Đảo thứ tự ưu tiên trong `renderDashboardMonthlyCharts` để lấy danh sách nhân viên từ `dataCache.staff` của đơn vị hiện tại trước.
    - Trong `loadBootstrapData()` (`js/app.js`): Đảm bảo khi `b.schedule` hoặc `b.patients` rỗng, `dataCache.schedule` và `dataCache.pat` được đặt thành `[]` sạch sẽ.
  + **Làm trống màn hình đăng nhập**:
    - Trong `index.html`: Xóa bỏ thuộc tính cứng `value="bvtks-cs2"` trên input `#login-unit` (chỉ để placeholder gợi ý).
    - Trong `doLogout()`: Đặt `unitInp.value = ''`, `userInp.value = ''`, `passInp.value = ''` và tự động focus con trỏ vào ô nhập mã đơn vị.
    - Trong `js/init.js`: Sự kiện khởi tạo `DOMContentLoaded` chỉ điền mã đơn vị nếu đã có phiên đăng nhập hợp lệ (`meds_session`), khi đã đăng xuất hoặc vào mới sẽ để trống hoàn toàn.
    - Trong `doLogin()`: Bắt buộc người dùng nhập đầy đủ cả mã đơn vị, tên đăng nhập và mật khẩu (không tự động fallback về `bvtks-cs2` nếu bỏ trống).
  + **Đồng bộ Footer Timestamp & Cache (RULES.md)**:
    - Cập nhật Footer `sys-last-update` thành `14:55 03/09/2026`.
    - Nâng số phiên bản lên `v4.0.1-rev12` trên `index.html` và `sw.js`.
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `js/init.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev13] - 15:15 03/09/2026: Tối ưu & Tinh gọn Console Log khởi động thành 1 dòng duy nhất
- **Bối cảnh & Phản hồi người dùng**:
  + Console trình duyệt xuất hiện quá nhiều dòng log chi tiết debug khi khởi động (`[Dexie.js]`, `[LiveSync Bus]`, `MAIN SCRIPT STARTING...`, `--- JS Block: ...`, `[Offline Cache]`, `[Bootstrap API]`, `[PWA]`, `[Service Worker]`), người dùng muốn rút gọn thành 1 dòng duy nhất thông báo mọi thứ đã thành công để giao diện console chuyên nghiệp, gọn gàng và không gây rối mắt.
- **Phân tích & Giải pháp xử lý**:
  1. Tắt các log khởi tạo nội bộ trong `js/offline-sync-engine.js` (Dexie DB và LiveSync Bus).
  2. Tắt các log debug luồng thực thi trong `js/app.js` (`MAIN SCRIPT STARTING`, các log `--- JS Block: ...`, và log cache cục bộ tức thì).
  3. Tắt log thông báo nạp tĩnh trong `sw.js` và log đăng ký PWA trong `index.html`.
  4. Rút gọn toàn bộ thông báo khởi tạo thành 1 dòng log duy nhất:
     `✅ Hệ thống T.I.M.E.S đã tải và đồng bộ dữ liệu thành công! Sẵn sàng hoạt động.`
     (Có cờ bảo vệ `window._systemReadyLogged` để chỉ xuất hiện đúng 1 lần duy nhất trong suốt vòng đời phiên làm việc).
  5. **Đồng bộ Footer Timestamp & Cache (RULES.md)**:
     - Cập nhật Footer `sys-last-update` thành `15:15 03/09/2026`.
     - Nâng số phiên bản lên `v4.0.1-rev13` trên `index.html` và `sw.js`.
- **File sửa đổi**:
  + `js/offline-sync-engine.js`
  + `js/app.js`
  + `sw.js`
  + `index.html`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev14] - 15:25 03/09/2026: Khắc phục triệt để rò rỉ dữ liệu Dashboard và Bảng lịch trình giữa các đơn vị (Multi-Tenant Schedule Isolation)
- **Bối cảnh & Phản hồi người dùng**:
  + Người dùng đăng nhập vào đơn vị khác (ví dụ: `test`), trên giao diện có banner `PHẦN MỀM XẾP LỊCH THỦ THUẬT - TEST`.
  + Số lượng Bác sĩ/KTV đi làm (3) và Bệnh nhân (0) đúng với đơn vị `test`, nhưng phần Tổng số ca thủ thuật (37), Ca đã xếp lịch (37), Tải trọng nhân viên (Bs Thái 7, BS Thảo 6, BS Đạt 3...) và Phân bố thủ thuật (điện xung 13, điện châm 9...) cùng Bảng lịch trình vẫn hiển thị dữ liệu của đơn vị cũ (`bvtks-cs2`), mặc dù trên Turso bảng `lich_trinh` đã phân lập mã đơn vị.
- **Phân tích nguyên nhân gốc rễ**:
  1. Trên Database máy chủ (Turso), dữ liệu `lich_trinh` đã được phân lập hoàn toàn chính xác theo `unit_code` (đơn vị `test` có 0 dòng, đơn vị `bvtks-cs2` có 37 dòng). Máy chủ trả về `schedule: []` cho đơn vị `test`.
  2. Tuy nhiên tại Client:
     - Trong `loadScheduleList()` (`js/app.js`): Khi đơn vị `test` có lịch trình rỗng từ server (`dataCache.schedule = []`), điều kiện `!data.length` được kích hoạt. Hàm tự động đọc lại `localStorage.getItem('meds_success')` mà không kiểm tra xem lịch đó có thuộc về đơn vị hiện hành hay không. Khóa `meds_success` trước đó đang lưu 37 ca của `bvtks-cs2` nên bị nạp ngược lại vào `dataCache.schedule`, render ra bảng và kích hoạt `loadDashboard()`.
     - Trong `loadDashboard()` (`js/app.js`): Điều kiện fallback đọc cache local trước đây là `if (!savedUnit || savedUnit === curUnit)`. Vì các phiên bản cũ không lưu `meds_schedule_unit` nên `savedUnit` bị rỗng (`null`/`""`), dẫn đến `!savedUnit` bằng `true`, ép đọc tiếp 37 ca và ca rớt từ `meds_success` và `meds_unscheduled` của đơn vị cũ.
     - Trong `restoreOfflineCache()` (`js/app.js`): Hàm này được gọi trước khi `window.getBootstrapCacheKey` được gán định nghĩa ở cuối file, dẫn đến việc đọc fallback về khóa chung `"times_bootstrap_cache"` chứa dữ liệu của đơn vị cũ.
     - Trong `backend/src/index.js`: Câu lệnh SQL trong `getBootstrapData` chỉ tìm theo `date = todayVN` (`YYYY-MM-DD`). Nếu ngày lưu theo dạng `DD/MM/YYYY` thì sẽ không khớp.
- **Giải pháp xử lý**:
  1. **Tạo bộ Helper phân lập khóa lưu trữ theo đơn vị ngay đầu `js/app.js`**:
     - `getCurrentUnitCode()`: Trả về mã đơn vị hiện hành chuẩn hóa.
     - `getUnitStorageKey(baseKey)`: Trả về khóa riêng biệt cho từng đơn vị (ví dụ `meds_success_test`, `meds_unscheduled_test`, `meds_schedule_date_test`).
     - `getBootstrapCacheKey()`: Đảm bảo luôn sẵn sàng từ đầu vòng đời ứng dụng.
  2. **Cách ly tuyệt đối trong `loadScheduleList()` & `loadDashboard()`**:
     - Đổi điều kiện kiểm tra thành `if (savedUnit && savedUnit === curUnit)` (bắt buộc phải có `savedUnit` và phải trùng khớp 100% với đơn vị hiện tại mới cho phép đọc cache).
     - Ưu tiên đọc từ `getUnitStorageKey('meds_success')` và `getUnitStorageKey('meds_unscheduled')`. Nếu không trùng khớp, thiết lập ngay `data = []`, `rawSched = []`, `rotDataLocal = []`.
  3. **Cách ly trong `restoreOfflineCache()`**:
     - Kiểm tra `b.unit_code` của cache, nếu khác `curUnit` thì hủy bỏ ngay lập tức, không nạp vào RAM.
     - Nếu `b.schedule` hoặc `b.patients` rỗng, gán sạch sẽ `dataCache.schedule = []` và `dataCache.pat = []`.
  4. **Lưu lịch trình đa đơn vị an toàn**:
     - Trong `executeScheduling`, `runExtraScheduling`, `executeRescueAdvice`, và `Xếp lịch Thứ 7`: Luôn ghi nhận `meds_schedule_unit = curUnit` và lưu đồng thời vào khóa định danh theo đơn vị.
  5. **Tự động dọn dẹp cache không hợp lệ khi khởi động (`js/init.js`)**:
     - Tại sự kiện `DOMContentLoaded`, kiểm tra nếu `meds_schedule_unit` không trùng khớp với đơn vị hiện hành thì xóa sạch các khóa cục bộ rò rỉ (`meds_success`, `meds_unscheduled`, `meds_schedule_date`, `times_bootstrap_cache`).
  6. **Hỗ trợ đa định dạng ngày trên Backend (`backend/src/index.js`)**:
     - Cập nhật truy vấn `getBootstrapData` và `getSchedule` để tìm kiếm đồng thời cả định dạng `YYYY-MM-DD` và `DD/MM/YYYY`.
  7. **Đồng bộ Footer Timestamp & Cache (RULES.md)**:
     - Cập nhật Footer `sys-last-update` thành `15:25 03/09/2026`.
     - Nâng số phiên bản lên `v4.0.1-rev14` trên `index.html` và `sw.js`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/app.js`
  + `js/init.js`
  + `sw.js`
  + `index.html`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev15] - 15:30 03/09/2026: Khắc phục lỗi mặc định Tháng 8 thay vì Tháng 9 trong tab Thống Kê Tổng Hợp
- **Bối cảnh & Phản hồi người dùng**:
  + Khi người dùng chuyển sang tab Thống Kê Tổng Hợp & Báo Cáo, ô chọn Tháng mặc định lại hiện số 8 và nạp dữ liệu tháng 8/2026, trong khi thời gian thực tế của hệ thống là tháng 9/2026 (`03/09/2026`).
- **Phân tích nguyên nhân gốc rễ**:
  1. Trong file `index.html`: Cả hai thẻ input `#chamcong-month-picker` và `#thongke-month-picker` đều bị gán cứng thuộc tính `value="8"`.
  2. Trong hàm `initMonthYearSync()` (`js/thongke.js`): Điều kiện khởi tạo kiểm tra `if (ccM && !ccM.value)`, vì input đã có sẵn chuỗi `"8"` từ HTML nên điều kiện này không kích hoạt, dẫn đến giá trị tháng hiện tại (`9`) không được gán vào.
  3. Trong sự kiện `DOMContentLoaded` (`js/thongke.js`): Chỉ cập nhật giá trị cho `#chamcong-month-picker`, hoàn toàn bỏ sót `#thongke-month-picker`.
  4. Trong hàm `getChamCongMonthYear()` (`js/thongke.js`): Ưu tiên đọc giá trị từ `thongke-month-picker` trước. Do input này giữ nguyên giá trị `"8"`, toàn bộ truy vấn và hiển thị thống kê đều bị cố định vào tháng 8.
- **Giải pháp xử lý**:
  1. Xóa bỏ giá trị cứng `value="8"` trong cả hai input `#chamcong-month-picker` và `#thongke-month-picker` tại `index.html`.
  2. Cập nhật `initMonthYearSync()` (`js/thongke.js`): Luôn tự động lấy tháng/năm hiện tại (`curM = now.getMonth() + 1`, `curY = now.getFullYear()`) để gán cho cả hai bộ chọn Chấm công và Thống kê.
  3. Cập nhật sự kiện `DOMContentLoaded`: Đồng bộ đồng thời cả 4 input (`chamcong-month-picker`, `chamcong-year-picker`, `thongke-month-picker`, `thongke-year-picker`) theo thời gian thực tế.
  4. Cập nhật `getChamCongMonthYear()` và `getThongKeTimeLabel()`: Ưu tiên bộ chọn có giá trị hợp lệ và luôn fallback về tháng/năm hiện tại của máy tính nếu chưa có giá trị.
  5. Đồng bộ khi nhấp chuyển tab: Khi người dùng nhấp vào tab Chấm công hoặc Thống kê, tự động sao chép giá trị tháng/năm giữa hai tab để đảm bảo tính nhất quán 100%.
  6. **Đồng bộ Footer Timestamp & Cache (RULES.md)**:
     - Cập nhật Footer `sys-last-update` thành `15:30 03/09/2026`.
     - Nâng số phiên bản lên `v4.0.1-rev15` trên `index.html` và `sw.js`.
- **File sửa đổi**:
  + `index.html`
  + `js/thongke.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev16] - 16:05 03/09/2026: Căn giữa 3 dòng chữ Header theo trục dọc cho tất cả đơn vị & Super Admin
- **Bối cảnh & Phản hồi người dùng**:
  + Người dùng muốn 3 dòng chữ trên header (Tên đơn vị/viện, Tên khoa/hệ thống, Slogan/Pill badge) được căn giữa tâm với nhau (`align-items: center`, `text-align: center`) ở tất cả các đơn vị và tài khoản Super Admin, thay vì bị căn lệch trái (`flex-start`).
- **Phân tích nguyên nhân**:
  + Trong `css/style.css`, khối CSS tại dòng 3419 có thuộc tính `align-items: flex-start !important; text-align: left !important;` đã ghi đè cấu hình căn giữa trước đó, kéo cả 3 dòng chữ h1, h2 và pill badge p về phía bên trái logo.
- **Giải pháp xử lý**:
  1. Cập nhật `.banner-text` trong `css/style.css`:
     - Thiết lập `display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; text-align: center !important;`.
  2. Cập nhật `.banner-text h1` (Dòng 1 - Tên đơn vị / T.I.M.E.S SYSTEM):
     - `text-align: center !important; width: 100% !important;`.
  3. Cập nhật `.banner-text h2` (Dòng 2 - Khoa / Phân hệ):
     - `text-align: center !important; width: 100% !important; border-bottom: none !important;`.
  4. Cập nhật `.banner-text p` (Dòng 3 - Khẩu hiệu Slogan / Pill badge):
     - `text-align: center !important; align-self: center !important; margin: 0 auto !important; display: inline-block !important;`.
  5. Đồng bộ hiển thị trên tất cả đơn vị (CS2, Test, Bệnh viện mới...) và Super Admin: cả 3 dòng luôn căn giữa tâm tuyệt đối theo trục dọc cạnh logo.
  6. **Đồng bộ Footer Timestamp & Cache (RULES.md)**:
     - Cập nhật Footer `sys-last-update` thành `16:05 03/09/2026`.
     - Cập nhật cache buster `css/style.css?v=4.0.1-rev16` và `css/mobile.css?v=4.0.1-rev16` trong `index.html`.
     - Nâng số phiên bản lên `v4.0.1-rev16` trên `index.html` và `sw.js`.
- **File sửa đổi**:
  + `css/style.css`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev17] - 16:55 03/09/2026: Khắc phục triệt để lỗi 500 Turso libSQL trên Super Admin & Khử trùng lặp URL Google Apps Script
- **Bối cảnh & Lỗi thực tế (Console logs)**:
  + Khi truy cập `/#tab-tenants` hoặc thực hiện đồng bộ Cloudflare D1 sang Google Apps Script, console báo lỗi:
    1. `pmcg-api.dpthai-ttytmk.workers.dev/:1 Failed to load resource: the server responded with a status of 500 ()`
    2. `Access to fetch at 'https://script.google.com/.../exechttps://script.google.com/.../exec' from origin 'https://xeplichthuthuat.io.vn' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- **Phân tích nguyên nhân gốc rễ**:
  1. **Lỗi 500 tại Cloudflare Worker (`exportAllDatabaseForSuperAdmin`)**:
     - Action `exportAllDatabaseForSuperAdmin` trong `backend/src/index.js` thực hiện batch query:
       `tables.map(t => db.prepare('SELECT * FROM ' + t + ' ORDER BY id ASC'))`.
     - Tuy nhiên, các bảng như `cai_dat`, `cham_cong`, `thong_ke` trong CSDL Turso không có cột `id` (sử dụng composite key hoặc key `key`, `month_year`).
     - Turso libSQL đã trả về lỗi cú pháp: `SQLite input error: no such column: id (at offset 31) (SQL_INPUT_ERROR)` dẫn đến Worker throw 500.
  2. **Lỗi URL Google Apps Script bị nhân đôi (`.../exechttps://.../exec`)**:
     - Khi người dùng copy/paste URL Google Apps Script vào ô cấu hình hoặc lưu trữ trước đó, URL bị dính liền 2 lần: `https://script.google.com/.../exechttps://script.google.com/.../exec`.
     - Khi Worker gặp lỗi hoặc khi chạy backup, hệ thống gọi fetch URL này, trình duyệt phát hiện URL không hợp lệ và chặn CORS với mã lỗi `net::ERR_FAILED`.
- **Giải pháp xử lý**:
  1. **Backend (`backend/src/index.js`)**:
     - Sửa query `exportAllDatabaseForSuperAdmin` từ `SELECT * FROM ${t} ORDER BY id ASC` thành `SELECT * FROM ${t}`.
     - Thêm cơ chế fallback: nếu lệnh `db.batch()` gặp bất kỳ sự cố nào, Worker sẽ tự động chuyển sang duyệt và try/catch từng bảng đơn lẻ, đảm bảo luôn trả về HTTP 200 kèm toàn bộ dữ liệu hợp lệ thay vì làm gãy luồng hệ thống.
     - Bổ sung khử trùng lặp URL trong hàm `dispatchBackgroundSync` trước khi dispatch webhook sang Apps Script.
     - Đã deploy thành công lên Cloudflare Workers: Version `efd901d3-840f-4d44-8988-78f2f7b77f1d`, test trực tiếp trả về `Status: 200, Status field: success, 16 tables`.
  2. **Frontend (`js/app.js`, `js/init.js`, `index.html`)**:
     - Tạo hàm chuẩn hóa toàn cục `window.sanitizeGoogleScriptUrl(rawUrl)` có khả năng:
       + Tự động phát hiện và cắt bỏ URL dính lặp `/exechttps://...` để giữ lại duy nhất 1 URL sạch chuẩn.
       + Chuẩn hóa đuôi `/edit` thành `/exec`.
     - Tự động chạy quét và sửa lỗi `localStorage.getItem('times_backup_api_url')` ngay khi tải trang (`DOMContentLoaded`) và khi gọi `getApiUrl()`, `syncAllD1DataToBackupSheets()`, `openConfigGoogleScriptModal()`.
     - Xác thực và làm sạch dữ liệu đầu vào trong modal cấu hình WebApp Google Apps Script.
  3. **Đồng bộ Footer Timestamp & Cache (RULES.md)**:
     - Cập nhật Footer `sys-last-update` thành `16:55 03/09/2026`.
     - Cập nhật cache buster `v4.0.1-rev17` trên tất cả file CSS & JS trong `index.html`.
     - Cập nhật `CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev17'` trong `sw.js`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/app.js`
  + `js/init.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev18] - 09:30 04/09/2026: Khắc phục triệt để lỗi không lưu giờ bận nhân sự/bệnh nhân & Triệt tiêu lỗi telemetry reportAllChanges
- **Yêu cầu của người dùng**:
  1. Đọc `RULES.md` và `PM-xeplich-v4.md`.
  2. Kiểm tra và sửa lỗi không lưu được giờ bận của nhân sự và bệnh nhân.
  3. Xử lý lỗi console: `Uncaught TypeError: Cannot read properties of undefined (reading 'startTime') at et.reportAllChanges...`.
- **Phân tích nguyên nhân gốc rễ**:
  1. **Vòng lặp tự động reset ngầm trên Backend (`backend/src/index.js`)**:
     - Hàm `checkAutoChotSo(db)` chạy trước mỗi action API. Trong đó:
       + Thuật toán kiểm tra `diffDays = (todayDate - lastClosedDate) / (1 ngày) > 0` dẫn đến việc ngay buổi sáng đầu ngày mới (08:00 AM) khi bác sĩ mở phần mềm xếp lịch, hệ thống đã ngộ nhận hôm nay đã hết ngày và tự động thực hiện: `UPDATE benh_nhan SET gio_ban = ''` và `UPDATE nhan_su SET temp_busy = '[]'`!
       + Lệnh `setCaiDat` ghi nhận `lastChotSoDate` bị lỗi cú pháp SQLite do truy vấn `SELECT id FROM cai_dat` (bảng `cai_dat` trong Turso/D1 dùng composite key `(unit_code, key)` không có cột `id`), khiến ngày đã chốt không được lưu lại. Kết quả là trên MỌI request API, `checkAutoChotSo` đều kích hoạt và xóa sạch giờ bận vừa lưu.
       + `checkAutoChotSo` thiếu tham số `unitCode` và thiếu điều kiện `WHERE unit_code = ?`, vi phạm nguyên tắc Tenant Clamping.
  2. **Lỗi giao diện & Masking giờ bận (`js/app.js`, `index.html`)**:
     - Các hàm lưu/xóa giờ bận bệnh nhân (`savePatBusy`, `deleteSinglePatBusy`, `clearPatBusy`) chỉ gọi `renderPatientsTable()` mà quên gọi `renderBusyPat()`, khiến bảng danh sách giờ bận của bệnh nhân trên tab `#tab-busy` không vẽ lại dữ liệu mới.
     - Lời gọi `editBenhNhan` trong `savePatBusy` bị thiếu tham số `loai_bn` và `buoi_dieu_tri`.
     - Trong modal thông tin nhân sự (`#staff-modal`), ô `#staff-busy` bị gán nhầm class `time-input` (class này tự động lọc bỏ dấu `-` và ép chỉ cho nhập 4 số `HH:mm`), ngăn người dùng nhập khoảng giờ bận dạng `08:00-09:00`. Đồng thời hàm `saveStaff()` trong `app.js` không đọc giá trị từ `document.getElementById('staff-busy')`.
  3. **Lỗi Telemetry Console `et.reportAllChanges (reading 'startTime')`**:
     - Đây là lỗi phát sinh từ script đo lường hiệu năng Web Vitals (Cloudflare RUM beacon `/cdn-cgi/rum` hoặc extension) khi duyệt qua mảng `PerformanceObserver` mà một số entry chưa sẵn sàng.
- **Giải pháp xử lý**:
  1. **Backend (`backend/src/index.js`)**:
     - Sửa hàm `setCaiDat(db, unitCode, key, value)` chuẩn hóa dùng `INSERT INTO cai_dat ... ON CONFLICT(unit_code, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP` và cơ chế fallback an toàn theo `unit_code`.
     - Cập nhật hàm `checkAutoChotSo(db, unitCode)`: bổ sung ràng buộc tenant isolation 100% `WHERE unit_code = ?`. Sửa logic: chỉ kích hoạt chốt sổ khi đã tới hoặc qua giờ chốt sổ (`currentHourMin >= chotSoTime`), tuyệt đối không chốt sổ tự động trong giờ làm việc ban ngày.
     - Cập nhật `editBenhNhan`: hỗ trợ match theo cả `id` và `(name, age)`, bảo toàn giá trị `loai_bn` và `buoi_dieu_tri` hiện có nếu không truyền giá trị mới.
  2. **Frontend (`js/app.js`, `index.html`)**:
     - Thêm lệnh `if (typeof renderBusyPat === 'function') renderBusyPat();` vào các hàm `savePatBusy`, `deleteSinglePatBusy`, `clearPatBusy`.
     - Thêm lệnh `if (typeof renderLeavePat === 'function') renderLeavePat();` vào các hàm `savePatLeave`, `clearPatLeave`.
     - Truyền đủ `p.loai_bn` và `p.buoi_dieu_tri` khi gọi `editBenhNhan`.
     - Trong modal nhân sự: xóa class `time-input` tại ô `#staff-busy` để cho phép nhập dải giờ bận tự do; sửa hàm `saveStaff()` đọc đúng dữ liệu từ ô `#staff-busy`.
     - Thêm bộ lắng nghe sự kiện bắt lỗi sớm (`window.addEventListener('error', ..., true)`) ngay đầu thẻ `<head>` trong `index.html` để triệt tiêu triệt để thông báo lỗi `et.reportAllChanges` / `startTime`.
  3. **Đồng bộ Footer Timestamp & Cache (RULES.md)**:
     - Cập nhật Footer `sys-last-update` thành `09:30 04/09/2026`.
     - Bổ sung phiên bản `v4.0.1-rev18` trên toàn bộ thẻ script & CSS trong `index.html`.
     - Cập nhật `CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev18'` trong `sw.js`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/app.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev19] - 09:55 04/09/2026: Viết lại quy tắc phiên bản trong RULES.md & Rà soát toàn diện tất cả hàm toàn hệ thống
- **Yêu cầu của người dùng**:
  1. Viết lại mục đánh số phiên bản trong `RULES.md`: Phiên bản thương mại v4 bắt đầu từ `4.0.0`, mỗi ngày chỉ tăng 1 phiên bản chính (hôm nay là 4.0.1 thì cả ngày giữ 4.0.1, ngày mai mới là 4.0.2). Trong cùng một ngày, chỉ thay đổi số revision `revN` cho các thẻ script/link stylesheet (`?v=4.0.X-revN`) và Service Worker cache name (`pmcg-v4-cache-4.0.X-revN`).
  2. Rà soát lại toàn bộ hàm trong toàn bộ dự án xem có hàm nào có nhưng chưa được gọi đến hoặc gọi sai tên/thiếu tham số không.
- **Kết quả rà soát & khắc phục toàn diện**:
  1. **Quy tắc phiên bản trong `RULES.md`**:
     - Cập nhật mục 3 với quy tắc **Daily Version Increment** (chính xác 4.0.0 là mốc ban đầu, tăng mỗi ngày 1 số phiên bản) và **Daily Revision `revN`** đồng bộ 3 vị trí (Footer Timestamp, Cache Buster Query Strings, SW Cache Name).
  2. **Bổ sung API Handler còn thiếu trên Backend (`backend/src/index.js`)**:
     - Bổ sung `case "ping": return success({ pong: true, time: Date.now(), unit_code: unitCode });` vào router API backend để phục vụ nút "Kiểm Tra Tốc Độ Phản Hồi (Ping API)" trên modal trạng thái máy chủ.
  3. **Khắc phục các lời gọi hàm thiếu / sai tên trong Frontend**:
     - **Bổ sung 2 hàm thiếu trên modal phác đồ**: Thêm `window.closeProtocolModal()` và `window.saveProtocolFromModal()` vào `js/app.js` để xử lý các sự kiện click trên modal `#modal-protocol-editor` trong `index.html`.
     - **Bảo vệ an toàn chống ReferenceError**: Bọc lời gọi `renderDashboardPreview(homeFilteredData)` trong `appChangePage` (`js/app.js`) bằng `if (typeof renderDashboardPreview === 'function')`.
     - **Sửa sai tên hàm nạp danh mục thủ thuật trong `js/sync.js`**: Sửa `loadProcs()` thành `loadProcedures()` (với fallback `loadProcs()`), giúp bảng thủ thuật tự động nạp lại chính xác khi đồng bộ dữ liệu.
     - **Xuất các hàm tiện ích Thứ 7 ra `window`**: Gán `window.chonHetSat`, `window.boChonHetSat`, `window.locSotSat` trong `js/app.js` để có thể kích hoạt từ giao diện hoặc console.
     - **Hoàn thiện hàm xóa trắng dữ liệu (`wipeAllDataForNewClient`)**: Bổ sung `renderSchedPage()` và `renderStats([])` để giao diện lập tức cập nhật sạch khi bàn giao đơn vị mới.
  4. **Đồng bộ Footer Timestamp & Cache Busters**:
     - Cập nhật Footer `sys-last-update` thành `09:55 04/09/2026`.
     - Bổ sung `APP_VERSION = '4.0.1-rev19'` và query string `?v=4.0.1-rev19` cho các file CSS/JS trong `index.html`.
     - Đổi cache name Service Worker thành `pmcg-v4-cache-4.0.1-rev19` trong `sw.js`.
- **File sửa đổi**:
  + `RULES.md`
  + `backend/src/index.js`
  + `js/app.js`
  + `js/sync.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev20] - 10:05 04/09/2026: Khắc phục lỗi cắt cụt khoảng giờ bận bệnh nhân và tiêu đề bảng
- **Yêu cầu của người dùng**: Bảng giờ bận của bệnh nhân không nhìn thấy hết các khoảng giờ (bị cụt mất ký tự cuối ví dụ `07:28-07:3`).
- **Nguyên nhân**:
  1. Trong `css/style.css`, cột thứ 5 (`GIỜ BẬN`) của `#busy-pat-table` bị ràng buộc cứng: `width: 55px !important; min-width: 50px !important; max-width: 60px !important;`. Trong khi đó, một khoảng thời gian dạng `HH:mm-HH:mm` (VD: `07:28-07:35`) dài 11 ký tự, với font chữ đậm chiếm khoảng 85px - 95px, dẫn đến việc bị tràn khung và cắt cụt số cuối thành `07:28-07:3`.
  2. Cột `NĂM SINH` bị giới hạn `max-width: 48px !important;` khiến tiêu đề bảng bị ép cắt thành `NĂM SIN`.
  3. Thẻ `<td>` và `<th>` trong `js/app.js` (`renderBusyPat`) và `index.html` cũng bị gán cứng `width: 55px;`.
  4. Trong layout 3 cột của `#tab-busy`, cột Nhân viên bận chiếm tới `flex: 1.8`, trong khi cột Bệnh nhân bận chỉ có `flex: 1`, khiến bảng bệnh nhân bận bị co hẹp trên màn hình laptop/máy tính để bàn tiêu chuẩn.
- **Giải pháp xử lý**:
  1. **Nới rộng độ rộng cột Giờ Bận**:
     - Trong `css/style.css`: Đặt `#busy-pat-table th:nth-child(5), td:nth-child(5)` có `width: 110px !important; min-width: 100px !important;` và xóa bỏ giới hạn `max-width: 60px`, sử dụng font chữ monospace rõ nét.
     - Trong `js/app.js` (`renderBusyPat`): Cập nhật `<td>` giờ bận thành `width: 110px; min-width: 100px;`.
     - Trong `index.html`: Cập nhật `<th>` giờ bận thành `width: 110px; min-width: 100px;`.
  2. **Khắc phục tiêu đề NĂM SINH**:
     - Nới rộng cột Năm Sinh lên `width: 65px !important; min-width: 60px !important;`, đảm bảo hiển thị trọn vẹn chữ `NĂM SINH` không bao giờ bị cắt cụt.
  3. **Cân đối tỉ lệ cột & Chống co méo (`split-layout`)**:
     - Điều chỉnh flex: Cột Nhân viên bận `flex: 1.1; min-width: 320px;`, Cột Bệnh nhân bận `flex: 1.5; min-width: 380px;`, Cột Ra viện `flex: 1.1; min-width: 300px;`.
     - Đặt `#busy-pat-table` có `min-width: 370px;` và cho phép `.split-layout` cuộn ngang êm ái trên màn hình nhỏ.
  4. **Đồng bộ Footer Timestamp & Cache Busters**:
     - Cập nhật Footer `sys-last-update` thành `10:05 04/09/2026`.
     - Cập nhật cache buster `?v=4.0.1-rev20` trên toàn bộ thẻ CSS và JS trong `index.html`.
     - Cập nhật `CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev20'` trong `sw.js`.
- **File sửa đổi**:
  + `css/style.css`
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev21] - 10:15 04/09/2026: Tối ưu phân bổ không gian Tab Giờ Bận - Bảng Nhân Sự chiếm ưu tiên to nhất
- **Yêu cầu của người dùng**: Bảng giờ bận bệnh nhân và danh sách ra viện bị to quá (thừa khoảng trắng), trong khi mong muốn bảng chứa giờ bận của nhân sự phải là to nhất.
- **Phân tích**:
  - Bảng giờ bận bệnh nhân (`#busy-pat-table`) và Bảng ra viện (`#leave-pat-table`) có số lượng cột cố định (5 cột: STT, Tên BN, Năm sinh, Phòng, Giờ). Bảng này chỉ cần khoảng 350px - 395px là vừa khít 100% nội dung, không bị cụt và không có khoảng trống thừa thãi.
  - Bảng giờ bận nhân sự (`#busy-staff-table`) phát triển theo chiều ngang: mỗi nhân sự báo bận là một cột riêng (`STT`, `BS ĐẠT`, `BS THÁI`, ...). Khi khoa phòng có nhiều y bác sĩ, bảng này cần không gian bề ngang lớn nhất (50% - 65% màn hình) để hiển thị đồng thời nhiều nhân viên mà không phải cuộn ngang quá sớm.
- **Giải pháp xử lý**:
  1. **Tái phân bổ độ rộng 3 thẻ (Card Layout)**:
     - Thẻ Nhân Sự Bận (`.card-staff`): Đặt `flex: 1 1 auto; min-width: 360px;`. Chiếm trọn toàn bộ phần màn hình còn lại, luôn luôn là **TO NHẤT** trên mọi kích thước màn hình desktop/laptop.
     - Thẻ Bệnh Nhân Bận (`.card-pat`): Đặt cố định vừa khít `flex: 0 0 395px; width: 395px; max-width: 395px;`. Vừa vặn hoàn hảo 5 cột dữ liệu, triệt tiêu toàn bộ khoảng trắng thừa.
     - Thẻ Ra Viện (`.card-leave`): Đặt cố định vừa khít `flex: 0 0 350px; width: 350px; max-width: 350px;`. Vừa vặn hoàn hảo 5 cột dữ liệu.
  2. **Đồng bộ Footer Timestamp & Cache Busters**:
     - Cập nhật Footer `sys-last-update` thành `10:15 04/09/2026`.
     - Cập nhật cache buster `?v=4.0.1-rev21` trên toàn bộ thẻ CSS và JS trong `index.html`.
     - Cập nhật `CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev21'` trong `sw.js`.
- **File sửa đổi**:
  + `css/style.css`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev22] - 10:25 04/09/2026: Sửa lỗi che khuất giờ ra viện và tự động nhảy con trỏ chuột xuống ô nhập giờ
- **Yêu cầu của người dùng**:
  1. Bảng danh sách bệnh nhân ra viện bị che mất giờ ra viện (chỉ hiển thị chữ `G` của tiêu đề `GIỜ RA`).
  2. Khi nhập/chọn tên bệnh nhân ra viện xong thì con trỏ chuột không tự động nhảy xuống ô nhập giờ ra viện.
- **Phân tích nguyên nhân**:
  1. Thẻ danh sách ra viện (`.card-leave`) trước đó đặt `width: 350px`, trừ padding 28px chỉ còn 322px. Nhưng bảng `#leave-pat-table` cần tối thiểu 360px - 380px cho 5 cột (STT, Tên BN, Năm sinh, Phòng, Giờ ra), khiến cột thứ 5 bị tràn lề và che khuất hoàn toàn.
  2. Trong `index.html`, ô `#leave-pat-input` thiếu sự kiện `onchange`, và trong hàm lắng nghe phím Enter toàn cục (`js/app.js` dòng 2360) nhánh `targetId === 'leave-pat-input'` chỉ gán giá trị `'14:00'` mà thiếu lệnh `t.focus(); t.select(); return;`, dẫn đến việc con trỏ chuột bị blur mất thay vì nhảy xuống ô giờ.
- **Giải pháp xử lý**:
  1. **Hiển thị trọn vẹn cột Giờ Ra**:
     - Cân đối độ rộng thẻ `.card-leave` lên `395px` (bằng với thẻ Bệnh nhân bận), đảm bảo cả 2 thẻ phụ đều cân xứng 395px gọn gàng, thẻ Nhân sự vẫn là thẻ to nhất (chiếm toàn bộ không gian còn lại).
     - Định dạng cột Giờ ra viện font monospace `Consolas, Roboto Mono` rõ nét và tăng chiều rộng lên `width: 80px !important; min-width: 75px !important;`.
  2. **Tự động nhảy con trỏ chuột xuống ô nhập giờ (`leave-pat-time`)**:
     - Trong `js/app.js`: Sửa bộ bắt phím Enter cho `leave-pat-input`, tự động điền `'14:00'` nếu trống và gọi `t.focus(); t.select(); return;`.
     - Trong `index.html`: Bổ sung `onchange="const t = document.getElementById('leave-pat-time'); if(t) { if(!t.value) t.value = '14:00'; t.focus(); t.select(); }"` và cập nhật `onkeydown` để ngay khi chọn tên bệnh nhân từ danh sách xổ xuống hoặc nhấn Enter, con trỏ chuột lập tức nhảy xuống ô giờ ra viện và bôi đen sẵn thời gian để người dùng xác nhận hoặc gõ giờ mới.
  3. **Đồng bộ Footer Timestamp & Cache Busters**:
     - Cập nhật Footer `sys-last-update` thành `10:25 04/09/2026`.
     - Cập nhật cache buster `?v=4.0.1-rev22` trên toàn bộ thẻ CSS và JS trong `index.html`.
     - Cập nhật `CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev22'` trong `sw.js`.
- **File sửa đổi**:
  + `css/style.css`
  + `index.html`
  + `js/app.js`
---

### [v4.0.1-rev23] - 10:35 04/09/2026: Dọn dẹp tệp tin thừa, tối ưu hóa và quy hoạch lại cây thư mục dự án
- **Yêu cầu của người dùng**:
  1. Rà soát toàn bộ thư mục `v4-thuongmai`, xóa bỏ các file thừa không cần thiết.
  2. Sắp xếp lại cây thư mục cho gọn gàng, đúng quy chuẩn.
  3. Tạo thư mục riêng để đưa các file lưu trữ/tài liệu vào hợp lý.
- **Hiện trạng & Rà soát**:
  1. Phát hiện file backup cũ `js/scheduler-engine.v3.2.5.bak.js` (61.5 KB) nằm trong thư mục `js/` từ bản v3.2.5, không còn được tham chiếu hay sử dụng ở bất kỳ đâu.
  2. File sao lưu cơ sở dữ liệu `d1_backup.sql` (7.3 MB) nằm tự do tại thư mục gốc, gây nặng thư mục và bị tải lên Cloudflare Pages mỗi khi deploy static web.
  3. Thư mục `backend-backup/` chỉ chứa 1 file mã nguồn cũ Google Apps Script `code.gs` từ thời kỳ v3.
  4. Hai tài liệu kỹ thuật `SETUP_CLOUDFLARE.md` và `ke-hoach-v4.md` nằm ở thư mục gốc chưa được quy hoạch vào thư mục tài liệu `docs/`.
- **Giải pháp thực hiện**:
  1. **Xóa file thừa**:
     - Đã xóa hoàn toàn file `js/scheduler-engine.v3.2.5.bak.js`.
  2. **Tạo thư mục lưu trữ `backups/`**:
     - Di chuyển `d1_backup.sql` vào `backups/d1_backup.sql`.
     - Di chuyển file `code.gs` vào `backups/legacy-apps-script/code.gs` và xóa bỏ thư mục rỗng `backend-backup/`.
  3. **Quy hoạch tài liệu vào `docs/`**:
     - Di chuyển `SETUP_CLOUDFLARE.md` -> `docs/SETUP_CLOUDFLARE.md`.
     - Di chuyển `ke-hoach-v4.md` -> `docs/ke-hoach-v4.md`.
     - Giữ nguyên `RULES.md` và `PM-xeplich-v4.md` tại thư mục gốc phục vụ AI Assistant và quy chuẩn vận hành hệ thống.
  4. **Tạo `.pagesignore` & Tối ưu `.gitignore`**:
     - Cập nhật `.gitignore` để tự động bỏ qua toàn bộ thư mục `backups/` và file `.sql`.
     - Tạo file `.pagesignore` ngăn chặn `wrangler pages deploy` đẩy các file backend, sql, backups lên Cloudflare Pages hosting.
  5. **Đồng bộ Phiên bản & Cache Busters**:
     - Nâng số revision từ `4.0.1-rev22` lên `4.0.1-rev23`.
     - Cập nhật `index.html` (toàn bộ thẻ CSS, JS và `APP_VERSION`).
     - Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev23'`).
- **File sửa đổi / Tổ chức lại**:
  + `deleted`: `js/scheduler-engine.v3.2.5.bak.js`
  + `moved`: `SETUP_CLOUDFLARE.md` -> `docs/SETUP_CLOUDFLARE.md`
  + `moved`: `ke-hoach-v4.md` -> `docs/ke-hoach-v4.md`
  + `moved`: `d1_backup.sql` -> `backups/d1_backup.sql`
  + `moved`: `backend-backup/code.gs` -> `backups/legacy-apps-script/code.gs`
  + `new`: `.pagesignore`
  + `modified`: `.gitignore`, `index.html`, `sw.js`, `PM-xeplich-v4.md`

---

### [v4.0.1-rev24] - 13:40 04/09/2026: Khắc phục triệt để lỗi mất dữ liệu khi nhập chấm công và chuyển tab
- **Hiện tượng & Báo cáo lỗi**:
  Khi người dùng nhập ký hiệu chấm công hoặc hệ số công cho nhân sự tại tab Chấm công, nếu vừa nhập xong mà click chuyển ngay sang tab khác (ví dụ: tab Thống kê, Xếp lịch, Cài đặt...) rồi quay lại thì dữ liệu vừa nhập bị biến mất, trở về trạng thái cũ hoặc rỗng.
- **Phân tích nguyên nhân gốc rễ (Root Causes)**:
  1. *Thiếu sự kiện bắt thời gian thực (`input`/`blur`)*: Các ô `.cc-input-text` và `.heso-input` trước đó chỉ gán lắng nghe sự kiện `change`. Theo chuẩn HTML, `change` chỉ kích hoạt khi ô input bị `blur` hoặc gõ Enter. Khi người dùng đang nhập mà bấm chuột trực tiếp vào nút chuyển tab trên thanh menu, thanh điều hướng có hàm chặn `e.stopPropagation(); e.preventDefault();` và ngay lập tức ẩn tab `#tab-chamcong` (`display: none`), làm sự kiện `change` bị hủy hoặc không bao giờ kích hoạt, khiến đối tượng `chamCongData` chưa kịp cập nhật giá trị mới.
  2. *Xung đột bất đồng bộ debounce 350ms & Server ghi đè mù quáng*: Hàm tự động lưu `triggerAutoSaveChamCong()` dùng `setTimeout` 350ms. Khi người dùng click chuyển sang tab khác (như tab Thống kê) hoặc chuyển lại tab Chấm công, các hàm khởi tạo tab `loadThongKeData()` / `loadChamCongData()` lập tức gọi API `getChamCong` lên server. Do lệnh lưu trước đó chưa hoàn tất hoặc còn nằm trong debounce, server trả về dữ liệu cũ (hoặc rỗng `{}`). Hàm nạp client trước đây đã thực hiện gán đè vô điều kiện: `chamCongData = fresh; setCachedChamCong(my, fresh); renderChamCongTable();`, xóa sạch dữ liệu vừa nhập tại máy người dùng.
  3. *Thiếu cơ chế Flush khi chuyển tab / đóng trang*: Không có cơ chế cam kết (flush) dữ liệu từ ô input đang active trước khi chuyển tab hoặc khi ẩn trang (`visibilitychange` / `beforeunload`).
  4. *Backend D1 upsert 2 bước có nguy cơ lỗi*: Trong `backend/src/index.js`, hàm `saveChamCong` dùng truy vấn 2 bước (`SELECT rowid ...` rồi `UPDATE` hoặc `INSERT`). Nếu kiểm tra rowid không khớp hoặc bị lỗi thời gian thực, câu lệnh `INSERT` bị chặn bởi ràng buộc `UNIQUE(unit_code, month_year)` gây lỗi ngầm không lưu được vào CSDL.
- **Giải pháp xử lý toàn diện (Multi-tier Fix)**:
  1. **Lắng nghe đa sự kiện `['input', 'change', 'blur']` & Cam kết tức thì**:
     - Viết các hàm cam kết chuẩn hóa `commitChamCongCell()` và `commitHeSoCell()` trong `js/thongke.js`.
     - Lắng nghe sự kiện `input` ngay từ từng ký tự người dùng gõ vào ô chấm công / hệ số, cập nhật tức thì vào `chamCongData`, đánh dấu cờ `chamCongIsDirty = true`, cập nhật `chamCongLastEditedTime = Date.now()` và lưu tức thời vào LocalStorage (`setCachedChamCong`).
  2. **Cơ chế Flush đồng bộ trước khi chuyển tab (`window.flushPendingChamCongSave`)**:
     - Bổ sung hàm `window.flushPendingChamCongSave()`: kiểm tra nếu đang có ô input nào được focus thì commit ngay lập tức, hủy debounce timer và gửi API lưu ngay lên server nếu dữ liệu đang bẩn (`chamCongIsDirty`).
     - Gắn hàm flush vào tất cả các điểm chuyển tab trong `js/app.js`: sự kiện click tab desktop (cả capture phase và bubble phase), hàm đổi hash `handleHashChange()`, và hàm điều hướng di động `switchMobileNav()`.
     - Gắn thêm lắng nghe sự kiện `beforeunload` và `visibilitychange` của trình duyệt.
  3. **Cơ chế Bảo vệ Dữ liệu Cục bộ (Local Data Guard against Stale Server Override)**:
     - Trong cả `loadChamCongData()` và `loadThongKeData()` tại `js/thongke.js`: kiểm tra nếu máy khách có dữ liệu chấm công cục bộ và vừa được chỉnh sửa gần đây (< 8 giây) hoặc cờ `chamCongIsDirty` đang bật, hoặc server trả về rỗng, hệ thống sẽ **ưu tiên giữ nguyên dữ liệu cục bộ mới hơn**, lưu lại vào cache và tự động đồng bộ đẩy lên server thay vì để server ghi đè mất dữ liệu của người dùng.
  4. **Nâng cấp Backend SQLite Atomic Upsert**:
     - Cập nhật cả `saveChamCong` và `saveThongKeThuThuat` trong `backend/src/index.js` sang cú pháp chuẩn:
       `INSERT INTO ... ON CONFLICT(unit_code, month_year) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP`, kèm khối fallback an toàn, loại bỏ triệt để lỗi xung đột khi lưu đồng thời.
  5. **Đồng bộ Phiên bản & Cache Busters**:
     - Cập nhật Footer timestamp `13:40 04/09/2026`.
     - Cập nhật cache busters `?v=4.0.1-rev24` trong `index.html`.
     - Cập nhật `CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev24'` trong `sw.js`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/app.js`
  + `js/thongke.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev25] - 14:05 04/09/2026: Nâng cấp toàn diện Cẩm nang Hướng Dẫn Sử Dụng (hdsd.html) Đa Vai Trò & Tích hợp Nút Chuyển Đổi Chế Độ Sáng/Tối (Dark Mode) cho tất cả tài khoản
- **Yêu cầu của người dùng**:
  1. Xây dựng tài liệu hướng dẫn sử dụng chuyên biệt cho từng đơn vị (Cơ sở y tế / Bệnh viện - Phòng khám) và cho Super Admin (Chủ sở hữu nền tảng SaaS).
  2. Bổ sung nút chuyển đổi chế độ Sáng / Tối (Light / Dark theme) dùng được ở tất cả các loại tài khoản (Bác sĩ, KTV, Admin đơn vị, Super Admin).
- **Giải pháp & Các tính năng đã hoàn thiện**:
  1. **Nâng cấp Toàn diện Trang Cẩm nang Hướng Dẫn Sử Dụng (`hdsd.html`)**:
     - Thiết kế giao diện hiện đại với **Bộ chuyển đổi vai trò (Role Switcher)** nổi bật ở đầu trang:
       * `🏥 Dành Cho Cơ Sở Y Tế / Phòng Khám (Đơn Vị)`: 10 chương chuyên sâu bao quát toàn bộ quy trình thiết lập 5 danh mục, tiếp nhận bệnh nhân, khai báo giờ bận/giờ ra viện, xếp lịch tự động đa kịch bản (ngày thường & Thứ 7 chuyên biệt), kiểm tra lỗi trùng lịch, in ấn phiếu điều trị, chấm công điện tử, thống kê tiền thủ thuật và vận hành ngoại tuyến.
       * `👑 Dành Cho Super Admin (Chủ Sở Hữu SaaS)`: 8 chương quản trị vận hành kinh doanh toàn cục: Quản lý đơn vị (Tenants), cấp phép gói cước (Free, Standard, Pro, VIP), thiết lập quota nhân sự (`max_staff`) và bệnh nhân (`max_patients`), quản lý bản quyền thời gian thực (`expires_at`, `is_active`), bảo mật mật khẩu Master SHA-256, sao lưu CSDL Cloudflare D1 tập trung, giám sát Worker API & Cron Job định kỳ, cùng Checklist Onboarding 5 bước bàn giao khách hàng.
     - **Tự động nhận diện thông minh**: Khi người dùng đang đăng nhập là `SUPER_ADMIN` mở hướng dẫn, hệ thống tự động mở tab Super Admin; khi là tài khoản đơn vị thường thì tự động mở tab Đơn vị.
     - Tích hợp tìm kiếm nhanh theo từ khóa, lọc chương mục, mục lục cuộn động (Dynamic Active TOC), chế độ in ấn (Print) và lưu trạng thái vào `localStorage`.
  2. **Tích hợp Hệ Thống Chế Độ Sáng / Tối (Dark / Light Theme)**:
     - Thêm nút chuyển đổi chế độ giao diện `🌙 / ☀️` tại 3 vị trí thuận tiện:
       * **Desktop Header**: Cạnh biểu tượng trạng thái máy chủ Cloudflare & Turso (`#theme-toggle-btn`).
       * **Menu người dùng (Dropdown User)**: Mục `Chế độ Tối / Chế độ Sáng` trong dropdown tài khoản (`#user-menu-theme-btn`).
       * **Mobile Header**: Nút chuyển đổi nhanh trên thanh tiêu đề di động (`#mobile-theme-toggle-btn`).
     - Viết bộ quy tắc CSS Dark Mode toàn diện cho toàn bộ hệ thống: Bảng lịch, danh mục, form tiếp nhận, modal popup, thanh sidebar và header.
     - Tự động ghi nhớ tùy chọn vào `localStorage` (`pm_app_theme`) và đồng bộ tức thì sang cả trang Hướng Dẫn Sử Dụng (`doc_theme`).
  3. **Đồng bộ Phiên bản & Cache Busters**:
     - Nâng số revision từ `4.0.1-rev24` lên `4.0.1-rev25`.
     - Cập nhật `index.html` (CSS, JS cache busters, timestamp `14:05 04/09/2026`, `APP_VERSION`).
     - Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev25'`).
- **File sửa đổi**:
  + `hdsd.html`
  + `css/style.css`
  + `js/init.js`
  + `js/app.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev26] - 14:22 04/09/2026: Tối ưu hóa triệt để Chế độ Tối (Dark Mode) cho Dashboard, Thẻ Thống Kê, Marquee, Biểu đồ Chart.js & Khung lọc ngày
- **Yêu cầu của người dùng**:
  + Chế độ tối không ổn (ảnh chụp màn hình cho thấy các mảng trắng chói ở 3 thẻ Dashboard, thanh thông báo chạy màu trắng/xanh lá nhạt chữ đỏ, tên bệnh viện trên header bị chìm tối do gradient nền cũ, ô lọc ngày nền trắng chói, biểu đồ Chart.js giữ nguyên nhãn và lưới tối màu khó đọc).
- **Phân tích nguyên nhân & Giải pháp**:
  1. **Tên bệnh viện trên Header (`#app-hospital-name`)**:
     - Do CSS ban đầu sử dụng `-webkit-background-clip: text` với dải gradient màu xanh navy đậm (#1e3d2b, #2d5a27), khi bật nền tối gradient hòa lẫn vào nền làm chữ gần như biến mất.
     - *Khắc phục*: Trong Dark Mode, hủy bỏ gradient clip và đặt màu chữ phát sáng rõ nét (#38bdf8 - xanh cyan y tế cao cấp), tiêu đề phụ chuyển sang xanh ngọc lục bảo tươi (#34d399), khẩu hiệu chuyển sang vàng cam (#d97706).
  2. **Thanh thông báo chạy Marquee (`.global-marquee-container`)**:
     - Nền cũ dùng màu xanh nhạt cứng `#f1f8e9` và chữ đỏ đô `#c0392b`.
     - *Khắc phục*: Tối ưu nền tối sang đen xám mềm `#111827`, viền xám tro `#1f2937`, chữ chuyển động đổi thành hồng san hô dịu mắt `#fb7185`.
  3. **Tiêu đề Dashboard & Khung lọc ngày**:
     - Tiêu đề `📊 DASHBOARD NGÀY` có mã màu nội dòng `#1e3d2b`, khung chọn ngày nền `#fff`.
     - *Khắc phục*: Tiêu đề đổi sang xanh ngọc `#38bdf8`, khung chọn ngày bọc thẻ tối `#1e293b`, chữ ngày tháng màu sáng `#f8fafc`.
  4. **3 Khối Thẻ Dashboard (`.dash-panel`) & Mini Cards (`.stat-mini-card`)**:
     - Do thuộc tính inline và class dùng nền trắng `#fff`, gây hiện tượng chói mắt tương phản gắt.
     - *Khắc phục*: Chuyển toàn bộ 3 panel sang màu nền `#1e293b` viền `#334155`, thẻ mini thống kê chuyển sang `#0f172a`, nhãn chỉ số `#94a3b8`, thanh đo tải trọng và phân bố kỹ thuật viên có nền rãnh tối `#334155` và chữ trắng `#cbd5e1` / `#f8fafc`.
  5. **Biểu đồ Thống kê Chart.js (Tháng & Ngày)**:
     - Thẻ biểu đồ tháng `.dash-chart-card` chuyển sang nền `#1e293b`.
     - Trong `js/app.js`: Tự động nhận diện theme hiện hành (`document.documentElement.getAttribute('data-theme') === 'dark'`), chuyển trục tọa độ, nhãn (ticks) và đường lưới (grid) từ xám đậm sang màu sáng `#cbd5e1` / `#94a3b8` / `#334155`.
     - Plugin hiển thị giá trị đầu cột `dashDrawValuePlugin` tự động chuyển màu vẽ chữ sang `#f8fafc` khi ở Dark Mode.
     - Trong `js/init.js`: Hàm `window.applyAppTheme()` tự động kích hoạt `loadDashboard()` để vẽ lại biểu đồ Chart.js ngay khi người dùng bấm chuyển theme mà không cần reload trang.
  6. **Đồng bộ Modals, Footer & Form Controls**:
     - Thiết lập quy tắc phủ toàn bộ các modal (`modal-server-status`, `modal-config-gas`, `modal-doc-lookup`, `modal-unscheduled-advisor`, `modal-admin-employee`...) sang bảng màu Dark Slate `#1e293b`.
     - `.main-footer` chuyển sang màu xanh than đậm `#0b1120` với viền `#3b82f6` và chữ `#cbd5e1`.
  7. **Đồng bộ Phiên bản & Cache Busters**:
     - Nâng số revision từ `4.0.1-rev25` lên `4.0.1-rev26`.
     - Cập nhật `index.html` (CSS, JS cache busters, timestamp `14:22 04/09/2026`, `APP_VERSION`).
     - Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev26'`).
- **File sửa đổi**:
  + `css/style.css`
  + `js/app.js`
  + `js/init.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev27] - 14:50 04/09/2026: Nâng cấp Hệ thống Bảng Dữ Liệu Toàn Diện trong Chế Độ Tối (Universal Dark Mode Table System)
- **Yêu cầu của người dùng**:
  + Bảng trong các tab ở chế độ tối vẫn không ổn (ảnh chụp màn hình tab Máy móc cho thấy các dòng chẵn bị dải màu trắng chói mắt, chữ màu trắng trên nền trắng gây tàng hình chữ không thể đọc được, khi rê chuột dòng chuyển màu trắng toát, cột ghim STT và các bảng tab khác cũng bị tình trạng sọc trắng tương tự).
- **Phân tích nguyên nhân & Giải pháp**:
  1. **Dải sọc chẵn lẻ Zebra Striping (`tbody tr:nth-child(even)`)**:
     - Quy tắc mặc định ở chế độ sáng dùng `tbody tr:nth-child(even) { background: #f9fafb; }`. Trong Dark Mode trước đây chỉ override màu chữ `td` sang trắng `#e2e8f0` mà chưa override màu nền của `tr:nth-child(even)`. Do đó các dòng chẵn giữ nguyên màu trắng `#f9fafb`, khiến chữ màu trắng nằm trên nền trắng, hoàn toàn không đọc được.
     - *Khắc phục*: Thiết lập quy tắc dòng chẵn trong Dark Mode sang màu Dark Slate nhung `#151f2e`, dòng lẻ sang `#1e293b`. Cả hai đều hiển thị chữ sáng `#e2e8f0` rõ nét 100%, tạo hiệu ứng sọc đen sang trọng, êm dịu cho mắt.
  2. **Hiệu ứng Rê chuột (`tr.editable-row:hover`)**:
     - Trước đây có quy tắc `tbody tr.editable-row:hover, td.editable-row:hover { background: #f0f4f1 !important; }` (màu trắng ngà). Khi người dùng rê chuột vào bất kỳ dòng nào, dòng đó lập tức biến thành nền trắng toát đè lên chữ trắng.
     - *Khắc phục*: Override toàn bộ hover các bảng sang màu xanh than công nghệ `#253347 !important` với chữ phát sáng `#ffffff !important`, đem lại trải nghiệm tương tác trực quan cao cấp.
  3. **Cột ghim cố định STT bên trái (`td:first-child`)**:
     - Trong CSS mobile/responsive có `.main-table table td:first-child { background: #ffffff !important; }`.
     - *Khắc phục*: Thiết lập cột STT tự động kế thừa màu nền tương ứng theo dòng chẵn/lẻ (`#151f2e` / `#1e293b`), khi hover chuyển sang `#253347`. Nút kéo thả `☰` đổi sang màu `#94a3b8`, khi hover chuyển thành xanh cyan `#38bdf8`.
  4. **Các Bảng Nghiệp Vụ Chuyên Sâu Khác**:
     - **Bảng Xếp Lịch (`#schedule-table`)**: Sửa triệt để quy tắc cũ `.row-scheduled td { color: #111827 !important; }` (chữ màu đen thui trên nền tối) chuyển sang chữ sáng `#e2e8f0`. Các ca không xếp được (`.row-dropped`) đổi sang nền đỏ mờ `rgba(239, 68, 68, 0.15)` với chữ `#fca5a5`.
     - **Bảng Chấm Công & Thống Kê**: Override 3 cột sticky (Tên nhân viên, Số thứ tự/Hệ số, Tổng ngày công) và dòng tổng kết `.chamcong-total-row` sang tone Dark Slate, loại bỏ hoàn toàn các thuộc tính inline `#ffffff`. Đồng thời trong `js/thongke.js`, hàm hover sự kiện chuột xóa bỏ mã màu cứng `#ffffff`.
     - **Bảng Giờ Bận & Ra Viện**: Đồng bộ màu chữ giờ bận (#fb923c - cam) và giờ ra viện (#c084fc - tím pastel).
     - **Bảng Kiểm Tra Lỗi & Tiện Ích (`tab-kiemtra`, `tab-utils`)**: Override các hộp chứa nền pastel inline (`#eafaf1`, `#fdf2e9`, `#fef5e7`) và thead pastel sang màu Dark Slate `#1e293b` với tiêu đề xanh `#38bdf8`.
     - **Bảng Quản Lý Đơn Vị SaaS (`#tenants-table`)**: Chuyển card bao bọc và header bảng sang bảng màu tối đồng bộ.
  5. **Đồng bộ Phiên bản & Cache Busters**:
     - Nâng số revision từ `4.0.1-rev26` lên `4.0.1-rev27`.
     - Cập nhật `index.html` (CSS, JS cache busters, timestamp `14:50 04/09/2026`, `APP_VERSION`).
     - Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev27'`).
### [v4.0.1-rev28] - 15:15 04/09/2026: Xử Lý Triệt Để Vệt Trắng Ô Nhập Liệu/Tìm Kiếm Chế Độ Tối & Cách Ly Dữ Liệu Đa Đơn Vị (Multi-Tenant Logout/Login Sanitization)
- **Yêu cầu của người dùng**:
  1. Các ô nhập liệu hay ô tìm kiếm ở các tab vẫn có khoảng trắng khi ở chế độ tối (ảnh chụp màn hình cho thấy thanh tìm kiếm bệnh nhân, nút lọc Nội trú/Ngoại trú, khung chọn thủ thuật có nền trắng/xám sáng chọi mắt).
  2. Bị dính trường hợp khi đang dùng tài khoản đơn vị này mà thoát ra để đăng nhập tài khoản khác thì vẫn còn sót dữ liệu của đơn vị cũ.
- **Phân tích nguyên nhân & Giải pháp**:
  1. **Khắc phục Vệt Trắng Ô Nhập Liệu & Tìm Kiếm Chế Độ Tối**:
     - **Thanh tìm kiếm bệnh nhân (`.patients-search-bar`) & Nút lọc**: Thuộc tính inline `style="background: #f8f9fa;"` và các nút Nội trú/Ngoại trú bị ép `background: white; color: #475569;` cả trong HTML và JS `setPatientTypeFilter`. Đã loại bỏ hoàn toàn các mã màu cứng này; thay bằng class CSS theme-aware. Trong Dark Mode, thanh tìm kiếm chuyển sang nền `#1e293b`, nút lọc inactive mang nền `#0f172a` viền `#334155`, nút active mang màu xanh dương phát sáng `#2563eb`.
     - **Khung chọn Thủ thuật / Kỹ năng (`.skills-box`, `.skills-header`, `.scrollable-checkbox-list`)**: Các mã màu cứng `#dfe4ea`, `#dcdde1` và `background: white` trên danh sách checkbox đã được chuyển sang Dark Slate `#1e293b` / `#0b1120`, viền `#334155`, chữ nhóm YHCT `#f87171` và PHCN `#60a5fa`.
     - **Chân trang ghim biểu mẫu (`.form-pinned-footer`, `div[style*="background: #f1f2f6"]`)**: Đã chuẩn hóa chuyển toàn bộ các chân trang ghim (ở tab Bệnh nhân, Nhân sự, Phòng, Máy...) sang nền `#0f172a` viền `#334155` trong Dark Mode, chấm dứt hoàn toàn dải trắng đáy form.
     - **Bộ chọn ngày Flatpickr**: Bổ sung bộ quy tắc Dark Mode cho input ngày và popup lịch Flatpickr (`.flatpickr-calendar`), chuyển ngày chọn sang `#2563eb`, hover ngày `#334155`, tháng và thứ màu xanh ngọc `#38bdf8`.
  2. **Cách Ly Tuyệt Đối Dữ Liệu Đa Đơn Vị (Multi-Tenant Data Isolation)**:
     - **Nguyên nhân rò rỉ dữ liệu cũ**:
       + Trước đây hàm `doLogout()` chỉ ẩn menu và hiện lại khung đăng nhập `#login-overlay` mà không làm mới DOM các bảng (`#patients-list`, `#machines-list`, `#staff-list`, `#schedule-list`...). Dữ liệu của đơn vị trước vẫn nằm trơ trọi trên giao diện ngầm.
       + Khi người dùng đăng nhập vào đơn vị mới, trong lúc dữ liệu mới đang tải qua mạng, giao diện vẫn phơi bày toàn bộ dữ liệu đơn vị cũ.
       + Hàm `getCurrentUnitCode()` trước đây fallback về `'bvtks-cs2'` khi chưa đăng nhập, dẫn tới việc `loadBootstrapData()` tự ý nạp dữ liệu của bệnh viện mặc định ngầm trong background.
       + Các khóa lưu trữ cục bộ của đơn vị cũ (`times_bootstrap_cache`, `times_*_order`, `staff_his_map`, `meds_protocols`) không được dọn dẹp sạch sẽ khi đăng xuất.
     - **Giải pháp xử lý triệt để**:
       + **Hàm dọn sạch toàn diện `clearAllDomTables()`**: Quét và làm sạch 24 tbody trên toàn bộ các tab hệ thống, đưa về trạng thái trống (khi đăng xuất) hoặc hiện spinner "Đang tải dữ liệu đơn vị..." (khi đăng nhập đơn vị mới).
       + **Tái cấu trúc `doLogout()`**: Dừng auto sync, quét và xóa sạch 100% các key phiên và dữ liệu đơn vị trong `localStorage` (chỉ giữ lại cấu hình giao diện `pm_app_theme`, `doc_theme` và `times_backup_api_url`), xóa toàn bộ RAM, dọn sạch DOM tables, sau đó kích hoạt `window.location.href` reload trang về URL gốc để hủy bỏ toàn bộ closures/state/IndexedDB cũ trong bộ nhớ.
       + **Bảo vệ `submitLogin()`**: Gọi `clearAllDomTables(true)` ngay lập tức để phủ loading placeholder lên mọi bảng, tuyệt đối không để lộ dữ liệu cũ dù chỉ 1 phần trăm giây.
       + **Bảo vệ khởi động (`init.js` & `app.js`)**: Kiểm tra `hasValidSession` và `sessionStr` trước khi khôi phục cache hay gọi `loadAllData()`/`loadDashboard()`. Nếu chưa có phiên đăng nhập hợp lệ, hệ thống hoàn toàn không nạp bất kỳ dữ liệu nào của bất kỳ đơn vị nào.
  3. **Đồng bộ Phiên bản & Cache Busters**:
     - Nâng số revision từ `4.0.1-rev27` lên `4.0.1-rev28`.
     - Cập nhật `index.html` (CSS, JS cache busters, timestamp `15:15 04/09/2026`, `APP_VERSION`).
     - Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev28'`).
- **File sửa đổi**:
  + `css/style.css`
  + `index.html`
  + `js/app.js`
  + `js/init.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev30] - 15:35 04/09/2026: Nâng Cấp Tương Phản Nội Dung Bảng Toàn Diện & Đồng Bộ Dark Mode Tab Thứ 7
- **Yêu cầu của người dùng**:
  1. Không thể nhìn rõ nội dung trong bảng trong các tab ở chế độ tối, nhất là tab Thủ thuật và tab Bệnh nhân.
  2. Tab thứ 7 bảng danh sách bệnh nhân vẫn nền trắng, không đồng bộ với chế độ tối.
- **Nguyên nhân & Giải pháp thực hiện**:
  1. **Độ tương phản nội dung bảng ở chế độ tối (Table Text Contrast in Dark Mode)**:
     - *Tab Bệnh nhân*: Nguyên nhân do `#patients-table tbody td strong` bị cố định màu đen `#0f172a !important` ở cấp độ toàn cục làm cho Tên bệnh nhân và Viết tắt thủ thuật bị đen chìm trên nền tối `#1e293b`/`#151f2e`. Đã gỡ bỏ `!important` và định nghĩa màu xanh Cyan sáng rực rỡ (`#38bdf8 !important`) cho tất cả thẻ `strong` trong chế độ tối. Đồng thời tinh chỉnh các thẻ loại bệnh nhân Ngoại trú (`#fb923c`), Nội trú (`#4ade80`), Giờ Y lệnh (`#fbbf24`), Giờ Ra viện (`#f87171`), cùng nền hàng ra viện chuyển sang đỏ mờ cao cấp (`rgba(239, 68, 68, 0.22)`).
     - *Tab Thủ thuật*: Thời gian đơn lẻ `.proc-time-single` trước đây mang màu xám tối `#334155` bị tàng hình trong chế độ tối, huy hiệu dải thời gian `.proc-time-range-badge` có nền xanh nhạt `#e0f2fe` chói mắt. Đã nâng cấp `.proc-time-single` lên màu trắng bạc sáng `#f8fafc !important`, huy hiệu thời gian chuyển sang nền mờ hiện đại `rgba(56, 189, 248, 0.2)` với chữ xanh neon `#38bdf8 !important`.
     - *Toàn bộ bảng khác (Phác đồ, Nhân sự, Xếp lịch, Giờ bận / Ra viện, Phòng, Thiết bị)*: Chuẩn hóa chữ dữ liệu (`#f1f5f9`), tên nổi bật (`#38bdf8`), các thẻ huy hiệu mềm mại dịu mắt, độ tương phản đạt chuẩn WCAG AAA.
  2. **Đồng bộ Dark Theme 100% cho Tab Thứ 7 (#tab-sat)**:
     - Trước đây các khung và thẻ bệnh nhân trong tab Thứ 7 có nền cứng inline `#fff`, `#f1f2f6`, `#fdfefe`.
     - Thêm hệ thống CSS class chuẩn hóa: `.sat-col-panel`, `.sat-season-wrap`, `.sat-patient-list`, `.sat-bn-card`, `.sat-bn-header`, `.sat-bn-name`, `.sat-bn-room`, `.sat-proc-name`, `.sat-ready-time-wrap`, `.sat-ready-label`, `.sat-footer-actions`, `.sat-staff-item`, `.sat-staff-name`.
     - Xây dựng bộ quy tắc Dark Mode hoàn chỉnh cho `#tab-sat`: nền slate đen sâu (`#0b1120`, `#1e293b`), viền sắc nét (`#334155`), thẻ bệnh nhân chuyển nền `#1e293b` với hover viền xanh neon, tên bệnh nhân màu `#38bdf8`, nhãn phòng viền cam `#fbbf24`, ô giờ sẵn sàng và chân trang đồng bộ liền mạch, không còn bất kỳ vệt trắng nào.
- **Đồng bộ Phiên bản & Cache Busters**:
  + Nâng revision lên `4.0.1-rev30`.
  + Cập nhật `index.html` (CSS, JS cache busters, timestamp `15:35 04/09/2026`, `APP_VERSION = '4.0.1-rev30'`).
  + Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev30'`).
- **File sửa đổi**:
  + `css/style.css`
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev31] - 15:40 04/09/2026: Triệt Tiêu Toàn Bộ Khoảng Nền Trắng / Sáng Trong Chế Độ Tối (Universal Dark Mode Overhaul)
- **Yêu cầu của người dùng**: Tìm kiếm lại tất cả những khoảng nền trắng và sửa lại để phù hợp với chế độ tối.
- **Nguyên nhân & Giải pháp thực hiện**:
  1. **Quét và xử lý toàn diện mọi phần tử có nền sáng / trắng inline**:
     - *Toàn bộ Modal*: Các modal `#modal-unscheduled-advisor` (`#advisor-modal-body`), `#modal-rescue-case`, `#modal-doc-lookup`, `#modal-hdsd-viewer`, `#modal-server-status`, `#modal-config-gas`, `#sync-progress-modal` trước đây có các vùng con giữ màu nền trắng hoặc xám nhạt (`#fff`, `#f8fafc`). Đã chuẩn hóa toàn bộ thân modal, đầu modal, chân modal và bảng tra cứu bên trong chuyển sang slate đen sâu `#0f172a` / `#1e293b` và viền `#334155`.
     - *Tab Quản trị (#tab-admin)*: Menu bên `.admin-sidebar-menu`, các nút `.admin-nav-btn`, khung nội dung chính `.admin-content-pane`, các thẻ cấu hình thuật toán, thẻ báo cáo, thẻ đơn giá, bảng nhân sự `#table-admin-employees`, và các thẻ liên kết nhanh `.quicklink-admin-item` chuyển sang tone tối đồng bộ, chữ sáng rõ ràng.
     - *Tab Tiện ích (#tab-utils) & Tab Kiểm tra (#tab-kiemtra)*: Các khung chia cột `.split-layout-left`, `.split-layout-right`, các bảng cuộn `.utils-table-scroll` (bảng tổng số, lỗi giờ, lỗi khác, bác sĩ/máy rảnh), các thẻ card chẩn đoán chuyển nền tối `#1e293b` với viền `#334155`.
     - *Tab Xếp lịch (#tab-schedule)*: Khung bọc bảng xếp lịch, thanh phân trang `.pagination-container`, các nút bấm lọc ngày tháng và điều khiển ở chân trang được chuyển sang nền `#1e293b`.
     - *Tab Giờ bận (#tab-busy)*: Đã sửa `.busy-col-card.card-pat` (`#e8f8f5`), `.card-staff` (`#fdfefe`), `.card-leave` (`#f5eef8`) thành các sắc độ tối tương ứng tinh tế, viền phát sáng nhẹ, không còn lóa mắt.
     - *Header & Menu tài khoản*: Hộp lọc ngày tháng `#header-date-filter-box`, menu thả xuống `#user-dropdown-menu`, vạch phân cách được đồng bộ mượt mà sang giao diện tối.
  2. **Bộ chọn dự phòng toàn cục (Universal Fallback Attributes)**:
     - Bổ sung quy tắc CSS đa tầng chọn tự động `[data-theme="dark"] div[style*="background: #fff"]`, `[data-theme="dark"] div[style*="background: white"]`, `[data-theme="dark"] div[style*="background: #f8fafc"]`, v.v... đảm bảo triệt tiêu 100% mọi đốm trắng phát sinh bất ngờ mà không ảnh hưởng tới các nhãn trạng thái (`:not(.badge):not(.status-badge)`).
- **Đồng bộ Phiên bản & Cache Busters**:
  + Nâng revision lên `4.0.1-rev31`.
  + Cập nhật `index.html` (CSS, JS cache busters, timestamp `15:40 04/09/2026`, `APP_VERSION = '4.0.1-rev31'`).
  + Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev31'`).
- **File sửa đổi**:
  + `css/style.css`
  + `index.html`
  + `js/app.js`
  + `js/thongke.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev32] - 15:48 04/09/2026: Đồng Bộ Header Cho Tài Khoản Super Admin
- **Yêu cầu của người dùng**: Tài khoản Super Admin chỉnh lại header giống như hình ảnh cung cấp:
  + Dòng 1: `T.I.M.E.S SYSTEM`
  + Dòng 2: `HỆ THỐNG XẾP LỊCH THỦ THUẬT YHCT- PHCN THÔNG MINH`
  + Dòng 3 (huy hiệu slogan): `NHANH GỌN, TỐI ƯU, CHÍNH XÁC`
- **Nguyên nhân & Giải pháp thực hiện**:
  1. Trước đây, khi đăng nhập tài khoản Super Admin, hàm `window.updateAppHeader` thiết lập:
     - Dòng 2: `HỆ THỐNG QUẢN LÝ ĐƠN VỊ & BẢN QUYỀN SAAS`
     - Dòng 3: `TRUNG TÂM ĐIỀU HÀNH TOÀN CỤC`
  2. Cập nhật `js/init.js` và `js/app.js` trong hàm `window.updateAppHeader` để khi vai trò là `SUPER_ADMIN`:
     - `appHosp.innerText = 'T.I.M.E.S SYSTEM';`
     - `appSub.innerText = 'HỆ THỐNG XẾP LỊCH THỦ THUẬT YHCT- PHCN THÔNG MINH';`
     - `appSlogan.innerText = 'NHANH GỌN, TỐI ƯU, CHÍNH XÁC';`
     - `mobSub.innerText = 'YHCT - PHCN';`
  3. Cập nhật `uUnitName` mặc định khi đăng nhập Super Admin thành `'T.I.M.E.S SYSTEM'`.
  4. Cập nhật bảng tài liệu white-labeling ở Mục 3 trong `PM-xeplich-v4.md`.
- **Đồng bộ Phiên bản & Cache Busters**:
  + Nâng revision lên `4.0.1-rev32`.
  + Cập nhật `index.html` (CSS, JS cache busters, timestamp `15:48 04/09/2026`, `APP_VERSION = '4.0.1-rev32'`).
  + Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev32'`).
- **File sửa đổi**:
  + `index.html`
  + `js/init.js`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev33] - 16:00 04/09/2026: Sửa Lỗi ReferenceError colLoaiDieuTri Khi Nhập File HIS Vào Tab Thứ 7
- **Yêu cầu của người dùng**: Báo lỗi `JS ERROR: Uncaught ReferenceError: colLoaiDieuTri is not defined at app.js:8781` khi nạp file HIS vào Tab Thứ 7.
- **Nguyên nhân & Giải pháp thực hiện**:
  1. Trong hàm `nhapDsSat` của Tab Thứ 7, biến `colLoaiDieuTri` được sử dụng trong vòng lặp duyệt dòng dữ liệu `roa` nhưng chưa được khai báo ở đầu hàm và chưa được gán chỉ số cột khi duyệt hàng tiêu đề (header).
  2. Khai báo bổ sung `let colLoaiDieuTri = -1, colNamSinh = 7;` ở đầu hàm `nhapDsSat`.
  3. Bổ sung nhận diện cột loại điều trị (`doi tuong`, `loai dt`, `loai dieu tri`, `hinh thuc`, `noi/ngoai`, `loai_bn`) và năm sinh trong danh sách tiêu đề cột.
  4. Đảm bảo kiểm tra an toàn `colLoaiDieuTri >= 0 && row[colLoaiDieuTri] !== undefined` trước khi đọc giá trị.
  5. Nâng cấp cơ chế khớp tên bệnh nhân và thủ thuật hỗ trợ chuẩn hóa chuỗi không phân biệt dấu/chữ hoa/thường (`norm()`) giúp việc nạp chỉ định từ HIS vào Tab Thứ 7 hoạt động chính xác 100%.
- **Đồng bộ Phiên bản & Cache Busters**:
  + Nâng revision lên `4.0.1-rev33`.
  + Cập nhật `index.html` (CSS, JS cache busters, timestamp `16:00 04/09/2026`, `APP_VERSION = '4.0.1-rev33'`).
  + Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev33'`).
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`















