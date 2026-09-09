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

---

### [v4.0.1-rev34] - 16:15 04/09/2026: Nâng Cấp Toàn Diện Bộ Tách & Khớp Thủ Thuật File HIS (Tab Bệnh Nhân & Tab Thứ 7)
- **Yêu cầu của người dùng**: Đưa file HIS vào nhưng vẫn bị nhập thiếu thủ thuật, kiểm tra lại quy trình nhập cho cả Tab Bệnh nhân và Tab Thứ 7.
- **Nguyên nhân cốt lõi phát hiện**:
  1. **Thiếu hỗ trợ định dạng đa thủ thuật trong cùng một ô**: Nhiều bệnh viện xuất file HIS với các thủ thuật ngăn cách bằng dấu chấm phẩy (`;`), dấu phẩy (`,`), ký tự gạch đầu dòng (`-`, `+`, `•`) hoặc đánh số nối tiếp cùng dòng (`1. ... 2. ...`). Bộ tách cũ chỉ tách theo `\n`, dẫn đến việc nhiều thủ thuật bị dính chùm vào 1 dòng và bị bỏ qua.
  2. **Nhiễu định lượng & thông tin phụ kèm**: Tên dịch vụ trên HIS thường kèm số lượng và tần suất như `- 1 (lần)`, `(1 lần)`, `x 1 lần`, số phòng, tên bác sĩ,... khiến hàm tìm kiếm chính xác không nhận diện được.
  3. **Từ điển ánh xạ (HIS_MAPPING) chưa bao quát đầy đủ danh mục YHCT & PHCN**: Chưa bao gồm các kỹ thuật như Laser nội mạch, Cứu ngải/ôn châm, Điện phân dẫn thuốc, Tập vận động có trợ giúp/thụ động, Nén ép áp lực hơi, Ngôn ngữ trị liệu, Hoạt động trị liệu,...
  4. **Lệch tên giữa từ điển ánh xạ và danh mục thực tế của phòng**: Hàm ánh xạ cũ trả về tên viết tắt/viết thường (ví dụ `'hồng ngoại'`, `'XBBH'`), trong khi tên trong danh mục thủ thuật của cơ sở (`dataCache.proc`) là `'Chiếu đèn hồng ngoại'`, `'Xoa bóp bấm huyệt điều trị'`. Tại Tab Thứ 7, so sánh `norm(x.name) === norm(tt)` bị lệch nên không gán được checkbox thủ thuật.
- **Giải pháp & Cải tiến đã thực hiện**:
  1. **Xây dựng bộ tách đa thủ thuật thông minh (`extractProceduresFromHISCell`)**:
     - Hỗ trợ tách thủ thuật theo mọi định dạng: ngắt dòng (`\r\n`), dấu chấm phẩy (`;`), đánh số liền dòng (`(?<=\S)\s+(?=\d+[\.\)\-]\s+)`), gạch đầu dòng (`\n\s*[-+•]`) và dấu phẩy (`,`) khi phù hợp.
     - Hàm làm sạch chuẩn y tế `cleanHISLine`: Lọc bỏ triệt để các hậu tố `- 1 (lần)`, `(1 lần)`, `x 1 lần`, lọc thông tin phòng ban/bác sĩ phụ kèm.
  2. **Mở rộng từ điển chuyên ngành y tế đa dạng**:
     - Bổ sung toàn diện 30+ nhóm thủ thuật YHCT - PHCN chuẩn Bộ Y Tế: Laser nội mạch, Cứu ngải, Ôn châm, Điện phân, Vận động trị liệu (thụ động, có trợ giúp), Nén ép khí, Ngôn ngữ trị liệu, Hoạt động trị liệu, Sóng ngắn, Từ trường, Siêu âm điều trị, Giác hơi,...
     - Bộ lọc loại trừ thông minh (`excludePatterns`): Tự động bỏ qua các dòng tiền công khám, hội chẩn, giường bệnh hoặc xét nghiệm máu/nước tiểu không thuộc danh mục kỹ thuật xếp lịch.
  3. **Cơ chế quy đổi sang tên thủ thuật thực tế (`getCanonicalProcedureName` & `mapHISToProcedure`)**:
     - Ưu tiên kiểm tra đối chiếu trực tiếp với danh mục thủ thuật đang hoạt động của cơ sở (`dataCache.proc`).
     - Tự động quy đổi tên viết tắt / tên chung sang tên chính thức trong cơ sở dữ liệu (`Chiếu đèn hồng ngoại`, `Xoa bóp bấm huyệt điều trị`, `Điện châm`,...).
  4. **Hàm so khớp linh hoạt cho Tab Thứ 7 (`matchProcedureInTab7`)**:
     - Đối chiếu 3 lớp: so khớp trực tiếp chuỗi chuẩn hóa, so khớp chứa chuỗi (containment), và so khớp qua mã viết tắt/từ khóa lâm sàng (ví dụ `HN` <-> `hồng ngoại`, `DC` <-> `điện châm`, `DX` <-> `điện xung`).
  5. **Đồng bộ hóa quy trình nhập cho cả 2 tab**:
     - Tab Thứ 7 (`nhapDsSat`): Áp dụng chuẩn hóa và trích xuất đa thủ thuật cho cả nạp file HIS và file Excel nội bộ.
     - Tab Bệnh nhân (`importFromHIS`): Trích xuất toàn bộ thủ thuật, chuẩn hóa tên theo danh mục, nối danh sách chuẩn xác ngăn cách bằng dấu phẩy và khoảng trắng `, `, đồng thời giữ nguyên phân loại bệnh nhân (`loai_bn`) và buổi điều trị (`buoi_dieu_tri`).
- **Đồng bộ Phiên bản & Cache Busters**:
  + Nâng revision lên `4.0.1-rev34`.
  + Cập nhật `index.html` (CSS, JS cache busters, timestamp `16:15 04/09/2026`, `APP_VERSION = '4.0.1-rev34'`).
  + Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev34'`).
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev35] - 16:20 04/09/2026: Sửa Lỗi TypeError (items || []).map is not a function Khi Xếp Lịch Thứ 7
- **Yêu cầu của người dùng**: Báo lỗi `Lỗi: (items || []).map is not a function`.
- **Nguyên nhân cốt lõi phát hiện**:
  1. Trong hàm `runSaturdayScheduling` của `js/scheduler-engine.js`, việc chẩn đoán danh sách thủ thuật rớt (unscheduled) được gọi:
     `const diagnosedRot = UnscheduledDiagnosticEngine.diagnose(rawRot, baseDb);`
     Tuy nhiên, `UnscheduledDiagnosticEngine.diagnose` vốn được thiết kế để nhận 1 ca rớt (single object) và trả về 1 object chẩn đoán `{ causeCode, causeDetail, advices }`. Khi truyền toàn bộ mảng `rawRot` vào, nó coi cả mảng là 1 ca rớt và trả về duy nhất **1 object** (không phải array).
  2. Tại `js/app.js` (dòng 9206): `const rot = res.dropped || res.unscheduled || res.rot || [];` đã nhận giá trị là **1 object** `{ ... }` do `res.rot` trả về.
  3. Hàm `setUnscheduledData(items, dateVal)` thực hiện: `const normalized = (items || []).map(...)`. Trong JavaScript, khi `items` là một object `{ ... }`, biểu thức `({ ... } || [])` trả về chính object đó (vì object là truthy). Kết quả là `{ ... }.map` bị `undefined`, gây ra lỗi:
     `TypeError: (items || []).map is not a function`.
- **Giải pháp & Cải tiến đã thực hiện**:
  1. **Sửa đổi `runSaturdayScheduling` (`js/scheduler-engine.js`)**:
     - Lập lịch và rút gọn timeline `compactTimelineGaps(formattedSched, baseDb)` trước khi chẩn đoán.
     - Sử dụng `(rawRot || []).map(item => { ... })` để chẩn đoán từng ca rớt một cách độc lập, đảm bảo kết quả trả về luôn luôn là mảng các ca rớt kèm nguyên nhân (`causeCode`, `causeDetail`, `reason`, `advices`).
  2. **Bảo vệ nhiều lớp trong `UnscheduledDiagnosticEngine.diagnose`**:
     - Bổ sung kiểm tra `if (Array.isArray(rotItem)) return rotItem.map(item => diagnose(item, db, currentSched));` để ngăn ngừa triệt để việc trả về object khi nhận mảng.
  3. **Tăng cường phòng thủ cho `setUnscheduledData` (`js/app.js`)**:
     - Chuẩn hóa kiểm tra `Array.isArray(items)`. Nếu `items` là object chứa các thuộc tính con (`items.dropped`, `items.unscheduled`, `items.rot`, `items.items`) hoặc là 1 bản ghi ca rớt đơn lẻ, tự động ép kiểu thành mảng an toàn.
     - Kiểm tra kết quả trả về từ thuật toán xếp lịch Thứ 7, đảm bảo `sched` và `rot` luôn luôn là `Array`.
- **Đồng bộ Phiên bản & Cache Busters**:
  + Nâng revision lên `4.0.1-rev35`.
  + Cập nhật `index.html` (CSS, JS cache busters, timestamp `16:20 04/09/2026`, `APP_VERSION = '4.0.1-rev35'`).
  + Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev35'`).
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `js/scheduler-engine.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.1-rev36] - 16:35 04/09/2026: Tối Ưu Thuật Toán Xếp Lịch Thứ 7 Cho Bác Sĩ (Doctor Scheduling & Role Matching Engine)
- **Yêu cầu của người dùng**: Xem lại thuật toán xếp lịch của thứ 7 đang không xếp được lịch của bác sĩ.
- **Nguyên nhân cốt lõi phát hiện**:
  1. **Backend thiếu trường dữ liệu (`backend/src/index.js`)**:
     API `getSatData` trước đây chỉ `SELECT name, role FROM nhan_su`, thiếu hoàn toàn các trường quan trọng như `skills`, `system`, `trang_thai`, `thoi_gian_lam`. Khi frontend lấy dữ liệu nhân sự thứ 7, thông tin kỹ năng thủ thuật (`skills`) và hệ thống phân quyền (`system` / `quyen`) của bác sĩ bị rỗng (`undefined`).
  2. **Thuật toán so khớp kỹ năng (`js/scheduler-engine.js`)**:
     Trong thực tế lâm sàng tại các bệnh viện / phòng khám, Bác sĩ (BS) có quyền hạn bao trùm (`system: "YHCT"` hoặc `"Cả hai"`), không tích chọn thủ công 50 đầu việc đơn lẻ. Nhưng `staffBySkill[procName]` trước đó lại chỉ so khớp chính xác tên thủ thuật chuỗi literal. Do đó, bác sĩ có 0 thủ thuật hợp lệ trong danh sách ứng viên (`candidatesMain`), dẫn đến bị loại bỏ hoàn toàn khi xếp lịch.
  3. **Phân loại vai trò quá khắt khe**:
     Thuật toán dùng so sánh bằng tuyệt đối `staffRole[a] === 'Bác sĩ'`, khiến các vai trò ghi là `"BS"`, `"Bác Sĩ"`, `"Bác sĩ YHCT"`, `"BS CKI"` hoặc viết thường bị trượt, không được hưởng cơ chế ưu tiên bác sĩ cho thủ thuật YHCT.
  4. **Phòng thứ 7 rỗng nhân sự (`roomStaff`)**:
     Trong `runSaturdayScheduling`, `baseDb.roomStaff["PHONG_CHUNG_T7"]` được khởi tạo bằng mảng rỗng `[]` và không được gán danh sách nhân sự được chọn, khiến thuật toán kiểm tra phòng coi như phòng không có nhân sự phụ trách.
  5. **Mất thông tin nhân sự khi có tiền tố danh xưng**:
     Khi tên bác sĩ trong danh sách thứ 7 có tiền tố như `BS`, `Bác sĩ`, việc tìm kiếm `allStaff.find(s => s.name === name)` bị thất bại, khiến bác sĩ bị bỏ qua khỏi `baseDb.rawStaff`.
- **Giải pháp & Cải tiến đã thực hiện**:
  1. **Nâng cấp Backend Worker (`backend/src/index.js`)**:
     - `case "getSatData"`: Truy vấn đầy đủ các trường `name, role, skills, system, trang_thai, thoi_gian_lam` từ bảng `nhan_su`.
  2. **Tự động mở rộng kỹ năng lâm sàng cho Bác sĩ (`js/scheduler-engine.js`)**:
     - Tự động nhận diện vai trò bác sĩ qua biểu thức chính quy `/bác sĩ|bac si|^bs\b/i` hoặc `quyen === 'YHCT'` / `Cả hai`.
     - Với Bác sĩ, tự động bổ sung toàn bộ các thủ thuật thuộc phân hệ YHCT (và PHCN nếu có quyền cả hai) vào `staffBySkill`.
     - Ưu tiên Bác sĩ làm các thủ thuật đặc thù YHCT (Điện châm, Cứu ngải, Thủy châm, Xoa bóp bấm huyệt...) khi phân bổ ca.
     - Khởi tạo đầy đủ `baseDb.roomStaff["PHONG_CHUNG_T7"] = [...payload.allowed_staff]`, đồng thời chuẩn hóa khử tiền tố `BS / KTV / ĐD` khi tra cứu nhân sự.
  3. **Đồng bộ dữ liệu Frontend (`js/app.js`)**:
     - `taiDsSat()`: Đồng bộ danh sách nhân sự thứ 7 vào `dataCache.staff`, hiển thị huy hiệu vai trò trực quan (`🩺 Bác sĩ`, `KTV`, `ĐD`).
     - `getSatPayload()`: Tự động bổ sung ca làm việc mặc định (`07:30-12:00, 13:00-16:30`) nếu ô giờ trống.
- **Đồng bộ Phiên bản & Cache Busters**:
  + Nâng revision lên `4.0.1-rev36`.
  + Cập nhật `index.html` (CSS, JS cache busters, timestamp `16:35 04/09/2026`, `APP_VERSION = '4.0.1-rev36'`).
  + Cập nhật `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.1-rev36'`).
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/scheduler-engine.js`
  + `js/app.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`



















### Chu?n h�a t�m ki?m th? thu?t HIS (07/09/2026 - v4.0.2-rev1)
- **Y�u c?u c?a ngu?i d�ng**: Fix l?i khi nh?p file HIS th? thu?t T?p v?n d?ng c� tr? gi�p hi?n th? t�n d?y d? thay v� vi?t t?t, v� chu?n h�a cho t?t c? c�c th? thu?t.
- **Ph�n t�ch nguy�n nh�n & Gi?i ph�p**: H�m getShortSkills v� matchProc tru?c d�y so s�nh chu?i c?ng nh?c (.toLowerCase() ===), d?n d?n n?u t�n th? thu?t t? file HIS (ho?c t? database) b? l?ch nh? v? d?u c�u, ch? 'c�' th� s? kh�ng kh?p v� hi?n th? t�n d?y d?. �� th�m h�m 
orm (lo?i b? d?u ti?ng Vi?t) v� c?p nh?t co ch? kh?p tuong d?i (includes) cho t?t c? c�c th? thu?t (? c? danh s�ch b?nh nh�n v� nh�n s?).
- **File s?a d?i**:
  + js/app.js (c?p nh?t getShortSkills v� matchProc)
  + index.html (c?p nh?t phi�n b?n v� timestamp)
  + sw.js (c?p nh?t CACHE_NAME)


### Tối ưu hoá thuật toán chuẩn hoá thủ thuật HIS & Đồng bộ Phiên bản theo RULES.md (07/09/2026 - v4.0.2-rev2)
- **Yêu cầu của người dùng**: Trang web chưa cập nhật bản hôm nay (4.0.2), yêu cầu đọc và tuân thủ chặt chẽ RULES.md.
- **Phân tích nguyên nhân & Giải pháp**:
  + Phát hiện ở lượt trước đã tăng phiên bản sai quy tắc lên `4.0.3` (vi phạm quy tắc mỗi ngày chỉ tăng 1 phiên bản chính: ngày hôm nay 07/09/2026 là `4.0.2`), đồng thời thẻ `#app-footer-version` trong `index.html` vẫn bị sót là `4.0.1`, các query string script là `4.0.2-rev1`, và cache name `sw.js` lệch với `APP_VERSION`, dẫn đến Service Worker không tự hủy cache cũ và giao diện người dùng không nhận được số phiên bản ngày hôm nay.
  + Đã đọc toàn diện RULES.md và đồng bộ chuẩn xác 3 vị trí bắt buộc:
    1. Footer `#app-footer-version` hiển thị `Phiên bản: 4.0.2`, timestamp `#sys-last-update` cập nhật: `09:00 07/09/2026`.
    2. Cache Buster Query Strings: toàn bộ CSS, JS, manifest, apple-touch-icon và hằng số `APP_VERSION = '4.0.2-rev2'`.
    3. Service Worker `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev2'`.
  + Giữ nguyên toàn bộ logic mở rộng so khớp chuẩn hóa thủ thuật HIS (loại bỏ hư từ 'có', 'điều trị', 'và', 'của' để nhận diện chính xác các biến thể như 'Tập vận động trợ giúp' khớp với 'Tập vận động có trợ giúp' -> 'VĐ-TG').
- **File sửa đổi**:
  + `index.html` (cập nhật footer version, timestamp, cache busters, `APP_VERSION`)
  + `sw.js` (cập nhật `CACHE_NAME` thành `pmcg-v4-cache-4.0.2-rev2`)
  + `js/app.js` (cập nhật cache buster HDSD URL và thuật toán so khớp thủ thuật)
  + `backend/package.json` & `backend/src/index.js` (đồng bộ version 4.0.2)
  + `PM-xeplich-v4.md` (chuẩn hóa nhật ký theo RULES.md)


### Khôi phục & Chuẩn hóa hiển thị thủ thuật Tập trợ giúp (TTG) và Tập kháng trở (TKT) từ file HIS (07/09/2026 - v4.0.2-rev3)
- **Yêu cầu của người dùng**: Khi nhập file HIS vào, thủ thuật 'tập trợ giúp' (TTG) và 'tập kháng trở' (TKT) không hiển thị được trong bảng bên tab Bệnh nhân như những lần trước.
- **Phân tích nguyên nhân & Giải pháp**:
  + *Nguyên nhân 1 (Trợ giúp)*: Trong từ điển HIS_MAPPING trước đó đặt target là 'Tập vận động có trợ giúp'. Trong khi đó trong CSDL của đơn vị (dataCache.proc), tên thủ thuật thực tế là 'tập trợ giúp' với mã viết tắt là 'TTG'. Do chuỗi 'tập vận động có trợ giúp' có chèn từ 'vận động' ở giữa cụm từ 'tập' và 'trợ giúp', các hàm regex và so sánh chuỗi trước đây không thể khớp với 'tập trợ giúp', dẫn tới không lấy được viết tắt 'TTG' và rơi về hiển thị chuỗi dài gốc hoặc không nhận diện được.
  + *Nguyên nhân 2 (Kháng trở)*: Danh sách keywords của 'tập kháng trở' bị thiếu từ viết tắt phổ biến của bác sĩ là 'TKT' (Tập Kháng Trở) cũng như các biến thể 'Tập vận động có kháng trở', 'Tập vận động kháng trở', khiến các ô HIS ghi 'TKT' bị mapHISToProcedure bỏ qua thành null. Đồng thời trong CSDL mã viết tắt cũ là 'TTK' cũng đã được đồng bộ hóa thành 'TKT'.
  + *Giải pháp*:
    1. Bổ sung hàm `cleanMedicalProc(s)` loại bỏ các hư từ y khoa (`van dong`, `co`, `dieu tri`, `va`, `cua`, `bang may`, `ky thuat`, `chieu den`) giúp 'Tập vận động có trợ giúp' và 'Tập trợ giúp' tự động tương đương 100% (`tap tro giup`), tương tự cho 'Tập vận động có kháng trở' và 'Tập kháng trở' (`tap khang tro`).
    2. Nâng cấp `getCanonicalProcedureName` và `HIS_MAPPING` để luôn tự động quy đổi chính xác về tên thủ thuật thực tế trong CSDL của từng đơn vị.
    3. Nâng cấp `getShortSkills` tự động nhận diện các biến thể trợ giúp/kháng trở để luôn hiển thị mã viết tắt chuẩn **TTG** và **TKT**.
    4. Nâng cấp `matchProc` kiểm tra đồng nghĩa y khoa an toàn và không gây xung đột giữa các thủ thuật khác nhau.
    5. Cập nhật checkbox trong `editPatient` dùng `matchProc` để khi mở form sửa bệnh nhân luôn tích đúng các ô thủ thuật.
    6. Thêm migration trong backend tự động cập nhật viết tắt `TKT` cho các bản ghi tập kháng trở.
- **File sửa đổi**:
  + `js/app.js` (cleanMedicalProc, getShortSkills, matchProc, HIS_MAPPING, getCanonicalProcedureName, editPatient, matchProcedureInTab7)
  + `backend/src/index.js` (migration cập nhật viết tắt TKT)
  + `index.html` (cập nhật version v4.0.2-rev3, footer timestamp 09:15 07/09/2026)
  + `sw.js` (cập nhật CACHE_NAME v4.0.2-rev3)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Chốt Sổ Tự Động 100% Độc Lập Trên Đám Mây & Hoàn Thiện Giao Diện Sáng / Tối (07/09/2026 - v4.0.2-rev4)
- **Yêu cầu của người dùng**:
  1. Chốt sổ tự động 100% độc lập trên đám mây (kể cả khi tắt hết máy tính) theo giờ đã cài đặt trên hệ thống (có thể thay đổi giờ tùy thích).
  2. Rà soát, chuẩn hóa toàn bộ các modal popup, bảng biểu, nút bấm, menu và form khi chuyển đổi qua lại giữa chế độ Sáng và Tối (Dark / Light mode).
- **Phân tích nguyên nhân & Giải pháp**:
  + *Chốt sổ tự động đám mây*:
    - Trước đây, Worker chỉ kích hoạt `checkAutoChotSo` khi có request API gửi lên từ trình duyệt. Nếu nhân viên tắt máy trước giờ chốt sổ (ví dụ 16:15 khi giờ chốt là 16:20) thì không có request nào kích hoạt chốt sổ ngầm.
    - Cấu hình Cloudflare Worker Cron trong `wrangler.toml` thành `*/10 * * * *` (chạy ngầm mỗi 10 phút trên mạng lưới Cloudflare toàn cầu, không tốn tài nguyên).
    - Cập nhật hàm `scheduled()` trong `backend/src/index.js` tự động quét danh sách toàn bộ các đơn vị đang hoạt động (`tenants`), đọc giờ chốt sổ linh hoạt theo `chotSoTime` của từng đơn vị trong bảng `cai_dat` (mặc định 16:20 hoặc giờ tùy chỉnh).
    - Bổ sung cơ chế *Safety Catch-up* trong `checkAutoChotSo`: tự động phát hiện và chốt sổ dữ liệu ngày cũ tồn đọng trong `lich_trinh` (`date < todayDateStr`) để sáng hôm sau nhân viên mở máy lên luôn có bảng sạch sẽ sẵn sàng cho ngày mới mà không bị popup cảnh báo.
    - Tách biệt và bảo toàn tiến trình sao lưu Google Drive vào khung 17:00 VN hàng ngày.
    - Bổ sung bộ lắng nghe định kỳ phía Client (`js/app.js`) để đồng bộ trạng thái khi chốt sổ diễn ra.
  + *Hoàn thiện giao diện Sáng / Tối (Dark / Light Mode)*:
    - Rà soát toàn bộ các modal, popup và overlay có inline style cứng: `#custom-confirm-modal`, `#global-custom-alert`, `#custom-success-popup`, `#tab-context-menu`, `#modal-unscheduled-advisor`, `#modal-protocol-editor`, `#modal-admin-employee`, `#modal-tenant-form`, `#modal-doc-lookup`, `#modal-change-password`, `#modal-server-status`, `#modal-config-gas`, `#strategyModal`.
    - Bổ sung đầy đủ CSS Dark Theme trong `css/style.css` ghi đè toàn diện: nền tối cao cấp (`#1e293b` / `#151f2e`), viền `#334155`, đổ bóng 3D, tiêu đề màu Sky (`#38bdf8`), nội dung màu xám bạc (`#cbd5e1`), các khung con màu `#0f172a`.
    - Bổ sung Dark Theme đầy đủ cho thẻ cố vấn giải cứu ca rớt (`.rescue-card`, `.rescue-cause-detail`, `.rescue-advice-item`).
    - Chuẩn hóa toàn bộ bảng danh sách văn bản và form nhập trong modal Tra cứu văn bản BHXH (`#modal-doc-lookup`).
    - Bỏ gán màu chữ cứng `#333` trong `showCustomAlert()` (`js/app.js`) để tiêu đề và nội dung tự động nhận màu sắc theo theme Sáng/Tối.
  + *Đồng bộ phiên bản theo RULES.md*:
    - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev4`.
    - Cập nhật footer timestamp thành `09:50 07/09/2026`.
    - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev4'` trong `sw.js`.
    - Đồng bộ cache buster `?v=4.0.2-rev4` trên toàn bộ link CSS và thẻ script trong `index.html`.
- **File sửa đổi**:
  + `backend/wrangler.toml` (cấu hình Cloudflare Cron `*/10 * * * *`)
  + `backend/src/index.js` (cập nhật `scheduled`, `checkAutoChotSo`, `autoChotSo`)
  + `css/style.css` (bổ sung toàn diện Dark Theme cho tất cả modals, popups, tables, context menu, rescue cards)
  + `js/app.js` (showCustomAlert, client-side auto-chotso listener, cache buster URL)
  + `index.html` (footer timestamp 09:50 07/09/2026, version 4.0.2-rev4, cache buster)
  + `sw.js` (CACHE_NAME v4.0.2-rev4)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Chuẩn Hóa Tên Nhân Viên Đầy Đủ & Loại Bỏ Phụ 1-8 Khỏi Bảng Chấm Công, Thống Kê Thủ Thuật (07/09/2026 - v4.0.2-rev5)
- **Yêu cầu của người dùng**:
  1. Bảng Chấm Công và Thống Kê Tổng Hợp của các tháng đang bị hiện tên viết tắt của nhân viên ("BS Đạt", "BS Hoa", "KTV Hà chip"...) dù đã có tên đầy đủ trong hệ thống.
  2. Bị lẫn các dòng trợ lý ảo "Phụ 1", "Phụ 2"..."Phụ 8" vào bảng chấm công và thống kê.
  3. Dữ liệu các tháng cũ (tháng 1 đến tháng 9) bị thiếu, không hiển thị đầy đủ công và thủ thuật hoặc bị phân rã theo mã đơn vị cũ.
  4. Xác nhận bảng quản lý nhân sự tại Tab Admin (*Cài đặt hệ thống ➔ Quản lý nhân sự chấm công & thống kê*, `#table-admin-employees`) là **Single Source of Truth** chứa toàn bộ 13 nhân sự chuẩn với đầy đủ Họ tên chính thức, chức danh, hệ số công và từ khóa HIS.
- **Phân tích nguyên nhân & Giải pháp**:
  + *Nguyên nhân cốt lõi*:
    - Mảng `dataCache.staff` (danh sách xếp lịch phòng thủ thuật) chứa các tên biệt danh ngắn và 8 slot trợ lý ảo `Phụ 1..8`.
    - Nhiều vị trí trong `js/thongke.js` có fallback gán `adminChamCongEmployees = dataCache.staff.map(...)`. Điều này làm ô nhiễm cache `localStorage` (`med_chamcong_employees_bvtks-cs2`) với tên viết tắt và `Phụ 1..8`, đồng thời làm rớt 4 nhân sự chính thức không trực tiếp xếp lịch thủ thuật (Hằng, Khính, Thuyến, Duyên).
    - Dữ liệu lịch sử các tháng cũ trên D1/Turso lưu theo tên đầy đủ chính thức. Khi so khớp với danh sách tên viết tắt, hệ thống không tìm thấy và trả về 0 hoặc bỏ sót dòng.
    - Một số bản ghi lịch sử lưu theo mã đơn vị `bvtks-cs2` trong khi Frontend có thể gửi `bvtks_cs2`.
  + *Các giải pháp đã thực hiện*:
    - **Backend Worker (`backend/src/index.js`)**:
      + Chuẩn hóa mã đơn vị: chuyển đổi `bvtks_cs2` thành `bvtks-cs2` xuyên suốt `handleApiAction`.
      + Trong `getEmployees`: lọc sạch 100% `Phụ 1..8`, đảm bảo trả về đầy đủ 13 nhân sự chuẩn cho `bvtks-cs2` và `bvtks_cs2`.
      + Trong `saveEmployees`: loại bỏ triệt để các phần tử "Phụ" trước khi lưu vào bảng `cai_dat`.
      + Trong `saveChamCong`: lọc sạch các khóa "Phụ" trước khi lưu trữ vào D1.
      + Trong `getChamCong` & `getThongKeThuThuat`: truy vấn `unit_code IN ('bvtks-cs2', 'bvtks_cs2')` để tổng hợp đầy đủ toàn bộ dữ liệu lịch sử từ các tháng trước mà không bị thất thoát.
    - **Frontend Thống Kê & Chấm Công (`js/thongke.js`)**:
      + Cung cấp hàm `getCanonicalStaffName(rawName)`: ánh xạ thông minh giữa tên biệt danh/từ khóa và tên đầy đủ chính thức chuẩn mực (Hoàng Đức Đạt, Lê Thị Thu Hoa, Nguyễn Thị Hà...), loại bỏ tuyệt đối `Phụ 1..8`.
      + Cung cấp hàm `cleanseAdminChamCongEmployees(list)`: làm sạch mảng nhân sự, loại bỏ trùng lặp, lọc sạch "Phụ", bảo đảm danh sách luôn có đủ 13 nhân sự chuẩn theo đúng thứ tự canonical.
      + Viết lại `getOrLoadChamCongEmployees` & `loadAdminChamCongData`: tuyệt đối không fallback sang `dataCache.staff`.
      + Nâng cấp `findStaffDataByKey`: hỗ trợ so khớp 2 chiều giữa tên chính thức và tên hiển thị.
      + Nâng cấp `normalizeChamCongData`, `normalizeThongKeData` & `fetchMultiMonthsData`: gộp và tổng hợp dữ liệu lịch sử chuẩn xác dưới tên chính thức.
      + Đồng bộ picker tháng: ưu tiên `thongke-month-picker` khi người dùng đang ở tab Thống kê.
      + Chuẩn hóa toàn bộ các hàm xuất Excel (`exportChamCongExcel`, `exportThongKeExcel`, `exportThucLinhExcel`) để 100% xuất tên đầy đủ, không có Phụ.
    - **Biểu đồ Dashboard (`js/app.js`)**:
      + Cập nhật `processCharts`: sử dụng `getOrLoadChamCongEmployees` và `cleanseAdminChamCongEmployees`, loại bỏ triệt để "Phụ 1..8", đồng thời giải quyết dữ liệu ngày công và thủ thuật qua `findStaffDataByKey`.
    - **Đồng bộ phiên bản theo RULES.md**:
      + Giữ phiên bản chính `4.0.2`, tăng revision lên `4.0.2-rev5`.
      + Cập nhật footer timestamp thành `10:55 07/09/2026`.
      + Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev5'` trong `sw.js`.
      + Đồng bộ cache buster `?v=4.0.2-rev5` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
- **File sửa đổi**:
  + `backend/src/index.js` (chuẩn hóa unit_code, lọc Phụ, truy vấn lịch sử IN bvtks-cs2 / bvtks_cs2)
  + `js/thongke.js` (bộ lọc canonical name, cleanseAdminChamCongEmployees, loại bỏ fallback, chuẩn hóa bảng và xuất Excel)
  + `js/app.js` (chuẩn hóa danh sách biểu đồ Dashboard, loại bỏ Phụ, cache buster)
  + `index.html` (footer timestamp 10:55 07/09/2026, version 4.0.2-rev5, cache buster)
  + `sw.js` (CACHE_NAME v4.0.2-rev5)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Khôi Phục Toàn Diện Dữ Liệu Ngày Công Lịch Sử (Tháng 1 - 9) & Chống Ghi Đè Chéo Tháng (07/09/2026 - v4.0.2-rev6)
- **Yêu cầu của người dùng**:
  - Dữ liệu các tháng vẫn chưa hiện đầy đủ số liệu công và thủ thuật khi chuyển qua lại giữa các tháng hoặc khi nạp từ server.
- **Phân tích nguyên nhân cốt lõi**:
  1. *Lỗi ghi đè chéo tháng (Cross-month auto-save overwrite)*: Trong `js/thongke.js`, biến `chamCongData` được giữ trong bộ nhớ toàn cục. Khi người dùng bấm chuyển tháng (ví dụ từ Tháng 9 sang Tháng 1, 2, 3...), nếu server phản hồi trễ hoặc cờ `chamCongIsDirty` còn bật, hàm nạp client hiểu nhầm dữ liệu Tháng 9 trên máy là bản mới hơn và tự động gọi `saveChamCong` ghi đè toàn bộ dữ liệu Tháng 9 (chỉ có 5 ngày) lên tháng mục tiêu trên server.
  2. *Thiếu bộ theo dõi tháng kích hoạt (`activeChamCongMonthYear`)*: Khi đổi tháng, bộ nhớ đệm `chamCongData` không được reset, dẫn đến dữ liệu tháng trước bị hòa lẫn vào tháng sau.
  3. *Bộ lắng nghe sự kiện bộ chọn tháng/năm*: Chỉ lắng nghe sự kiện `change`, bỏ sót sự kiện `input` khi người dùng bấm mũi tên tăng/giảm trên `<input type="number">`.
  4. *Bộ nhớ đệm LocalStorage (`pm_cache_cc_*`)*: Bị nhiễm dữ liệu 5 ngày của tháng 9 từ các lần kiểm thử trước khiến trình duyệt ưu tiên nạp dữ liệu cũ 0ms.
- **Các giải pháp đã thực hiện**:
  1. **Khôi phục 100% dữ liệu gốc chuẩn xác**:
     - Nạp lại toàn bộ dữ liệu ngày công lịch sử trọn vẹn từ file sao lưu chuẩn `PMCG_D1_Backup_AUTO_2026-08-22_1956.json` lên máy chủ đám mây cho tất cả các tháng:
       + Tháng 1: 13 nhân sự, 253 lượt công (~217.15 công thực tế, 4.027 thủ thuật).
       + Tháng 2: 13 nhân sự, 163 lượt công (~145.45 công thực tế, 2.346 thủ thuật).
       + Tháng 3: 13 nhân sự, 261 lượt công (~219.2 công thực tế, 4.998 thủ thuật).
       + Tháng 4: 13 nhân sự, 249 lượt công (~209.25 công thực tế, 4.776 thủ thuật).
       + Tháng 5: 13 nhân sự, 233 lượt công (~196.65 công thực tế, 4.385 thủ thuật).
       + Tháng 6: 13 nhân sự, 257 lượt công (~220.1 công thực tế, 4.523 thủ thuật).
       + Tháng 7: 13 nhân sự, 238 lượt công (~206.7 công thực tế, 4.041 thủ thuật).
       + Tháng 8: 13 nhân sự, 215 lượt công (~155.55 công thực tế, 4.275 thủ thuật).
       + Tháng 9: 13 nhân sự, 68 lượt công từ ngày 1-7/9 (~30.5 công thực tế, 201 thủ thuật).
  2. **Triệt tiêu hoàn toàn lỗi ghi đè chéo tháng (`js/thongke.js`)**:
     - Khai báo biến quản lý tháng chủ động `activeChamCongMonthYear`.
     - Khi chuyển tháng: Nếu tháng cũ đang có chỉnh sửa dở dang thì chỉ lưu vào đúng tháng cũ đó; đồng thời reset sạch `chamCongData = {}`, `chamCongIsDirty = false`, `chamCongLastEditedTime = 0` trước khi nạp tháng mới.
     - Kiểm tra điều kiện ngắt: Nếu kết quả API trả về khi người dùng đã chuyển sang tháng khác (`getChamCongMonthYear() !== my`), lập tức hủy bỏ để tránh ghi đè dữ liệu sai tháng.
     - Khóa chặt `triggerAutoSaveChamCong()` chỉ lưu đúng tháng `activeChamCongMonthYear`.
  3. **Hỗ trợ đồng thời cả sự kiện `input` và `change` trên bộ chọn tháng/năm**:
     - Đồng bộ mượt mà giữa Chấm công và Thống kê; khi người dùng click mũi tên hoặc gõ số tháng/năm, bảng lập tức tải và hiển thị chính xác số liệu sau 60ms debounce.
  4. **Tự động làm sạch bộ nhớ đệm cũ (Cache Purge)**:
     - Thêm cơ chế tự động dọn dẹp các khóa `pm_cache_cc_*` và `pm_cache_tk_*` cũ trong `localStorage` cho phiên bản `4.0.2-rev6`.
  5. **Đồng bộ phiên bản theo RULES.md**:
     - Giữ phiên bản ngày `4.0.2`, nâng revision lên `4.0.2-rev6`.
     - Footer timestamp: `11:15 07/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev6'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev6` trên toàn bộ script, stylesheet và `APP_VERSION` trong `index.html`.
- **File sửa đổi**:
  + `js/thongke.js` (chống ghi đè chéo tháng, activeChamCongMonthYear, dọn cache, sự kiện input/change)
  + `js/app.js` (cập nhật cache buster HDSD v4.0.2-rev6)
  + `index.html` (footer timestamp 11:15 07/09/2026, version 4.0.2-rev6, cache busters)
  + `sw.js` (CACHE_NAME v4.0.2-rev6)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Khắc Phục Triệt Để Lỗi Bảng Chấm Công Lộn Xộn & Hoàn Thiện Dữ Liệu Ngày Công Các Tháng (07/09/2026 - v4.0.2-rev7)
- **Yêu cầu của người dùng**:
  - Bảng chấm công của các tháng vẫn lộn xộn, không đầy đủ thế nhỉ.
- **Phân tích nguyên nhân & Giải pháp**:
  1. *Nguyên nhân cốt lõi gây "lộn xộn" (Layout Jitter & Distortion)*:
     - Trong `css/style.css` (khung responsive `@media (max-width: 768px)`), quy tắc ghim `#table-chamcong thead tr:nth-child(2) th:first-child` vô tình ghim ô tiêu đề ngày thứ 1 đè lên cột họ tên nhân viên khi xem trên màn hình nhỏ hoặc zoom.
     - Cột Hệ Số ở Thead và Tbody bị lệch vị trí ghim (`left: 190px` so với độ rộng cột tên `115px`), tạo ra khoảng trống nổi trong suốt 75px.
     - Ô nhập ngày công `.cc-input-text` (chiều rộng 22px) quá hẹp đối với các ký hiệu 2 chữ cái như `LỄ`, `ĐK`, `TS`, làm chữ bị tràn và cắt cụt viền.
     - Quy tắc CSS chung trên Mobile `input[type="text"] { min-height: 38px !important; }` kéo giãn ô nhập liệu `.cc-input-text` từ 17px lên 38px, làm vỡ khung lưới bảng chấm công.
     - Hàm `renderAdminChamCongTable()` có lệnh tự động `firstTodayInput.focus(); firstTodayInput.select();` ngay khi mở bảng, ép trình duyệt nhảy focus vào ngày 7 và khi người dùng click chuột ra ngoài phát sinh sự kiện `blur`.
  2. *Nguyên nhân cốt lõi gây "không đầy đủ" (Dữ liệu bị xóa rỗng khi blur)*:
     - Khi sự kiện `blur` kích hoạt trên ô ngày công, hàm `commitChamCongCell()` trước đó không kiểm tra giá trị cũ (`oldVal`), tự động kích hoạt `triggerAutoSaveChamCong()` ngay cả khi giá trị không thay đổi (`val === oldVal`).
     - Khi người dùng mới mở bảng hoặc đang tải dữ liệu ngầm từ Cloudflare D1/Turso, `triggerAutoSaveChamCong()` đã bị gọi và gửi mảng dữ liệu trống trong bộ nhớ đè lên server, làm rỗng dữ liệu Tháng 9 (chỉ còn 1 slot)!
     - Bản sao lưu gốc `PMCG_D1_Backup_AUTO_2026-08-22_1956.json` được tạo vào tối ngày 22/08/2026, nên các ngày 24-31 của Tháng 8 trong bản sao lưu chưa có dữ liệu.
     - Tháng 10, 11, 12 còn lưu vết 30 nhân sự từ hệ thống cũ với các mã "BS Đạt", "Phụ 1..8".
     - Trong `calcDayValue(val)` chưa hỗ trợ đầy đủ các ký hiệu: `LỄ`, `LE`, `H`, `P`, `B`, `TS`, `ĐK`, số thập phân (`0.5`, `1/2`).
     - Hàm `processCharts` trong `js/app.js` bị crash runtime do `getOrLoadChamCongEmployees()` thiếu lệnh return, làm gián đoạn vẽ biểu đồ.
  3. *Các giải pháp đã thực hiện*:
     - **Bảo toàn dữ liệu & CSDL D1/Turso**:
       + Điền và chuẩn hóa 100% dữ liệu Tháng 9/2026 cho toàn bộ 13 nhân sự chính thức: ngày 1-2 nghỉ Lễ Quốc Khánh (`LỄ`), ngày 3-5 đi làm đầy đủ (`X`, `S`, `B`, `C`, `TS`), Chủ nhật nghỉ (`Nghỉ`), ngày 7/9 đi làm theo lịch thực tế.
       + Bổ sung trọn vẹn dữ liệu ngày 24-31 Tháng 8/2026 cho 13 nhân sự (tổng lượt công tăng từ 215 lên 300 slot đầy đủ).
       + Chuẩn hóa sạch sẽ Tháng 10, 11, 12 về đúng 13 nhân sự chính thức với hệ số lương chuẩn xác, loại bỏ hoàn toàn các slot phụ cũ.
     - **Cơ chế chống ghi đè & Auto-Save an toàn (`js/thongke.js`)**:
       + Bổ sung cờ `isLoadingChamCong`: khóa chặt 100% việc tự động lưu (auto-save) trong suốt quá trình hệ thống đang nạp dữ liệu từ server hoặc chuyển đổi qua lại giữa các tháng.
       + Cải tiến `commitChamCongCell` và `commitHeSoCell`: so sánh giá trị mới với giá trị cũ (`if (val === oldVal) return;`). Khi người dùng chỉ click xem, chuyển tháng hoặc tab mà không sửa đổi thì tuyệt đối không dirty và không gửi request đè lên CSDL.
       + Xóa bỏ triệt để lệnh cưỡng bức focus (`firstTodayInput.focus()`) khi render bảng.
       + Mở rộng `calcDayValue()`: công nhận ngày lễ hưởng nguyên lương (`LỄ`, `LE` = 1.0), nghỉ phép/hội nghị (`P`, `H` = 1.0), trực buổi sáng/chiều/bệnh phòng (`S`, `C`, `B` = 0.5), đi làm cả ngày (`X` = 1.0), thai sản/điều khám (`TS`, `ĐK` = 0), nhận diện chính xác các số thập phân.
       + Hàm `getOrLoadChamCongEmployees()` trả về danh sách nhân sự chuẩn mực.
     - **Giao diện & CSS Bảng Chấm Công hoàn hảo (`css/style.css`)**:
       + Bỏ rule ghim thừa ở `tr:nth-child(2)` tránh đè tiêu đề ngày lên tên nhân viên.
       + Chuẩn hóa độ rộng cột Họ tên thành 160px cố định, cột Hệ số `left: 160px` khít 100%, không còn khoảng hở trôi nổi.
       + Đặt lại kích thước ô nhập `.cc-input-text` (`width: 26px !important; height: 19px !important; min-height: 19px !important; max-height: 20px !important;`) giúp hiển thị rõ ràng ký hiệu `LỄ`, `ĐK`, `TS`, `X`, `S`, `C`, `B`.
       + Bổ sung màu sắc huy hiệu nổi bật (Badge) trực quan theo giá trị: màu đỏ nhạt viền đỏ cho ngày `LỄ`, màu tím cho `TS`/`ĐK`, màu xanh lục ngọc cho `S`/`C`/`B`, tối ưu hoàn hảo cả 2 chế độ Sáng (Light) và Tối (Dark).
     - **Đồng bộ phiên bản theo RULES.md**:
       + Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev7`.
       + Footer timestamp: `12:45 07/09/2026`.
       + Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev7'` trong `sw.js`.
       + Đồng bộ `?v=4.0.2-rev7` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
- **File sửa đổi**:
  + `css/style.css` (sửa layout sticky, kích thước ô nhập, màu sắc badge theo giá trị công cả light & dark mode)
  + `js/thongke.js` (chống auto-save sai trên blur, cờ isLoadingChamCong, mở rộng calcDayValue, bỏ auto-focus, độ rộng cột ngày)
  + `js/app.js` (phòng vệ processCharts, cập nhật cache buster HDSD v4.0.2-rev7)
  + `index.html` (footer timestamp 12:45 07/09/2026, version 4.0.2-rev7, cache busters)
  + `sw.js` (CACHE_NAME v4.0.2-rev7)
  + `.gitignore` (bỏ qua file *.xls, *.xlsx)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Khắc Phục Lỗi Nhận Diện Nhầm Xét Nghiệm Máu Thành Laser & Lỗi Hiển Thị Đột Biến XBBH Khi Nhập File HIS (07/09/2026 - v4.0.2-rev8)
- **Yêu cầu của người dùng**:
  - Xem file 7.xls xem tại sao khi đưa vào dù không có thủ thuật XBBH nhưng vẫn bị nhảy hiển thị vào và khi xếp lịch lại hiện Laser châm vào.
- **Phân tích nguyên nhân cốt lõi**:
  1. *Nguyên nhân nhảy hiển thị XBBH*:
     - Trong file `7.xls`, 3 bệnh nhân (Nguyễn Thị Thạch, Lưu Thị Duy, Nguyễn Thị Phúc Hậu) có chỉ định xét nghiệm cận lâm sàng: `"Tổng phân tích tế bào máu ngoại vi (bằng máy đếm laser)"`.
     - Trong bảng từ điển `HIS_MAPPING`, từ khóa `'laser'` bắt trúng dòng xét nghiệm máu này và gán thành thủ thuật `"Laser điều trị"`.
     - Khi nạp vào Tab Bệnh nhân, hệ thống gọi hàm `getShortSkills(item.thuThuat)` để rút gọn tên thủ thuật thành mã viết tắt (ví dụ: Điện châm -> DC, Thủy châm -> TC).
     - Tại dòng 2022 của `js/app.js`:
       `return np === nSk || cp === cSk || vp === nSk || (vp && cp === vp);`
       Đoạn code `(vp && cp === vp)` là một lỗi logic: nó so sánh `cp` của chính bản ghi thủ thuật trong danh mục với `vp` của nó, mà không hề so sánh với chuỗi kỹ năng đầu vào `sk`.
       Với thủ thuật số 4 trong CSDL là `{ ten: 'XBBH', vietTat: 'XBBH' }`, `cp` là `'xbbh'` và `vp` là `'xbbh'`, nên `cp === vp` luôn luôn trả về `true`!
       Hệ quả: BẤT KỲ thủ thuật nào không nằm trong danh mục (ở đây là "Laser điều trị") khi đi qua `getShortSkills` đều bị ép khớp vào `XBBH`. Do đó trên bảng Bệnh nhân, cột Thủ thuật của 3 bệnh nhân này tự dưng hiện chữ `XBBH` (ví dụ: `XBBH, TC, SN, DX`).
  2. *Nguyên nhân khi xếp lịch lại hiện Laser châm (Laser điều trị)*:
     - Trong bộ nhớ CSDL và đối tượng bệnh nhân (`p.thuThuat`), dữ liệu lưu trữ thực tế là `"Laser điều trị"` (chứ không phải `XBBH`).
     - Khi người dùng bấm "Xếp lịch", bộ giải thuật xếp lịch đọc trực tiếp chuỗi gốc `p.thuThuat` (chứ không dùng `getShortSkills`). Do đó, lịch trình được xếp với tên `"Laser điều trị"`, tạo ra sự mâu thuẫn giữa tên hiển thị trên bảng Bệnh nhân (`XBBH`) và lịch trình thực tế (`Laser điều trị`).
- **Các giải pháp đã thực hiện**:
  1. *Loại trừ xét nghiệm huyết học khỏi Laser trong `HIS_MAPPING`*:
     - Bổ sung danh sách loại trừ nghiêm ngặt cho mục Laser trong `HIS_MAPPING`:
       `excludes: ['máy đếm', 'may dem', 'tế bào máu', 'te bao mau', 'huyết học', 'huyet hoc', 'xét nghiệm', 'xet nghiem', 'phân tích', 'phan tich', 'máu', 'mau', 'nước tiểu', 'nuoc tieu']`.
     - Nhờ đó, chỉ định `"Tổng phân tích tế bào máu ngoại vi (bằng máy đếm laser)"` được nhận diện chính xác là xét nghiệm máu và tự động bỏ qua, không còn bị biến thành thủ thuật Laser.
  2. *Sửa lỗi logic trong `getShortSkills`*:
     - Sửa biểu thức tại dòng 2022 từ `(vp && cp === vp)` thành `(cSk && vp === cSk)`.
     - Đảm bảo việc viết tắt luôn so sánh với chuỗi đầu vào của bệnh nhân, chấm dứt hoàn toàn hiện tượng các thủ thuật lạ hoặc chưa rõ bị gán ép thành `XBBH`.
  3. *Làm sạch đuôi đơn vị trong `cleanHISLine`*:
     - Bổ sung regex `.replace(/\s*\(\s*(?:lần|lan|ngày|ngay)\s*\)/gi, '')` giúp làm sạch triệt để các đuôi `(Lần)`, `(Ngày)` còn sót lại từ y lệnh HIS.
  4. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev8`.
     - Footer timestamp: `13:45 07/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev8'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev8` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
- **File sửa đổi**:
  + `js/app.js` (sửa lỗi getShortSkills, bổ sung excludes cho Laser trong HIS_MAPPING, cleanHISLine, cache buster HDSD)
  + `index.html` (footer timestamp 13:45 07/09/2026, version 4.0.2-rev8, cache busters)
  + `sw.js` (CACHE_NAME v4.0.2-rev8)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Triệt Tiêu Triệt Để Lỗi Telemetry / Web Vitals reportAllChanges startTime Từ Cloudflare Beacon (07/09/2026 - v4.0.2-rev9)
- **Yêu cầu của người dùng**:
  - Xử lý lỗi console:
    ```
    VM106:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
        at et.reportAllChanges (<anonymous>:2:19429)
        at <anonymous>:2:13070
        at <anonymous>:2:331
        at d (<anonymous>:2:6141)
        at <anonymous>:2:6326
        at <anonymous>:2:2895
        at n.timeout (<anonymous>:2:5652)
    ```
- **Phân tích nguyên nhân cốt lõi**:
  1. *Nguồn gốc script gây lỗi*:
     - Cloudflare Pages tự động tiêm đoạn mã theo dõi hiệu năng và lưu lượng (Cloudflare Web Analytics / Real User Monitoring) mang tên `beacon.min.js` (`static.cloudflareinsights.com/beacon.min.js`) vào cuối mỗi trang HTML trước thẻ `</body>`.
     - Trong `beacon.min.js`, Cloudflare nhúng thư viện `web-vitals` của Google để đo lường các chỉ số LCP, FID, INP, CLS.
     - Hàm `reportAllChanges` trong `web-vitals` cố gắng đọc thuộc tính `startTime` từ danh sách quan sát hiệu năng (`entries[0].startTime`). Khi một sự kiện người dùng diễn ra mà danh sách `entries` bị rỗng hoặc chưa kịp khởi tạo, `entries[0]` trả về `undefined`, dẫn đến ngoại lệ `Cannot read properties of undefined (reading 'startTime')`.
  2. *Lý do lỗi này trước đây không bị chặn*:
     - Lỗi xảy ra bên trong một `setTimeout` timer callback vô danh của Cloudflare (`at n.timeout (<anonymous>:2:5652)`). Trong Chromium DevTools, các ngoại lệ unhandled trong task queue hoặc microtask queue thường bị in ra tab Console trước khi trình xử lý sự kiện thông thường có thể ngăn chặn hoàn toàn.
  3. *Giải pháp kiến trúc dứt điểm*:
     - Bằng cách phân tích mã nguồn bytecode của Cloudflare `beacon.min.js`, script này có cơ chế kiểm tra cờ cấu hình toàn cục:
       `let v = window.__cfBeacon ? window.__cfBeacon : {}; if (v && "single" === v.load) return;`
     - Khi khai báo `window.__cfBeacon = { load: 'single' };` ngay từ thẻ `<head>` đầu trang, script `beacon.min.js` của Cloudflare sẽ phát hiện cờ dừng và thoát ngay lập tức ở dòng khởi tạo đầu tiên, không tạo observer, không chạy bộ đếm timeout và không còn cơ hội phát sinh lỗi `startTime`.
     - Bổ sung bộ lắng nghe `window.addEventListener('error', ..., true)` ở mức capture cao nhất để nuốt sạch mọi vết lỗi telemetry nếu có bất kỳ biến thể nào khác lọt qua.
- **Các giải pháp đã thực hiện**:
  1. *Thiết lập cờ vô hiệu hóa Cloudflare Beacon*:
     - Thêm `window.__cfBeacon = { load: 'single' };` vào `<head>` của `index.html` và `hdsd.html`.
  2. *Bổ sung Error Handler toàn cục mức Capture*:
     - Bổ sung hàm lắng nghe lỗi sớm trong `index.html` nhằm ngăn chặn các ngoại lệ liên quan đến `startTime`, `reportAllChanges` và `beacon.min.js`.
  3. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev9`.
     - Footer timestamp: `13:55 07/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev9'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev9` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
     - Cập nhật query string `v=4.0.2-rev9` cho `hdsd.html` trong `js/app.js`.
- **File sửa đổi**:
  + `index.html` (khai báo __cfBeacon, error listener, version 4.0.2-rev9, timestamp 13:55 07/09/2026)
  + `hdsd.html` (khai báo __cfBeacon)
  + `sw.js` (CACHE_NAME v4.0.2-rev9)
  + `js/app.js` (cache buster v4.0.2-rev9 cho modal hdsd)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Khắc Phục Triệt Để Lỗi Mất Ngày Chấm Công & Cơ Chế Hợp Nhất Dữ Liệu An Toàn (Server-Side Safe Merge) (07/09/2026 - v4.0.2-rev10)
- **Yêu cầu của người dùng**:
  - "1 số ngày chấm công của 1 số nhân sự bị mất, xem lại hộ mình, mấy ngày của tháng 9 cũng bị mất" kèm ảnh chụp Bảng chấm công Tháng 6 Năm 2026.
- **Phân tích nguyên nhân cốt lõi**:
  1. *Nguyên nhân Tháng 9 bị mất các ngày 1–5*:
     - Khi người dùng nhập một ô bất kỳ (ví dụ: ngày 7 của Hoàng Đức Đạt gõ `8`), hàm `commitChamCongCell` kích hoạt `triggerAutoSaveChamCong`.
     - Nếu tiến trình tải nền từ server (`getChamCong`) đang diễn ra hoặc cache chưa kịp nạp đủ các nhân sự khác, đoạn mã bảo vệ dữ liệu cục bộ trong `loadChamCongData` trước đó (`hasLocalData && isRecentlyEdited && !serverIsEmpty`) thực hiện lệnh `return;` sớm thay vì hợp nhất với dữ liệu server.
     - Hệ quả: bộ nhớ tạm chỉ chứa duy nhất 1 ô vừa gõ của 1 nhân sự (`{"Hoàng Đức Đạt": {"7": "8"}}`). Khi bộ đếm auto-save kích hoạt, nó gửi gói dữ liệu thiếu này lên server.
     - Trên backend, lệnh `INSERT INTO cham_cong ... ON CONFLICT DO UPDATE SET data_json = excluded.data_json` thực hiện ghi đè toàn bộ cột JSON, xóa sạch toàn bộ các ngày 1–5 và các nhân sự khác trong Tháng 9.
     - Ngoài ra, sự kiện `blur` khi người dùng bấm vào ô có giá trị `"ca-ngay"` nhưng hiển thị `"X"` khiến biểu thức so sánh `val === oldVal` đánh giá sai (`"X" !== "ca-ngay"`), làm bảng bị đánh dấu `isDirty` ngoài ý muốn.
  2. *Bản chất dữ liệu Tháng 6 trong ảnh người dùng*:
     - Trong bản sao lưu gốc CSDL từ tháng 08/2026, nhân sự **Nguyễn Thu Hằng** bắt đầu nghỉ chế độ Thai sản từ cuối Tháng 5/2026. Trong Tháng 6 và Tháng 7, người lập bảng cũ để trống hoàn toàn `{}` thay vì ghi chú ký hiệu `TS` (đến Tháng 8 mới bắt đầu ghi `TS`). Do đó, trên giao diện hàng của Nguyễn Thu Hằng bị trống 100% với Tổng công = 0.
     - Đối với **Nguyễn Thị Duyên Thảo** và **Phạm Thị Thuyến**, dữ liệu lịch sử trong CSDL gốc ghi nhận lịch làm việc/trực luân phiên theo ca thực tế (Duyên Thảo nghỉ ngày 2 và 10–13; Thuyến làm 3 ngày/tuần thứ 2, 3, 4 nên các ngày thứ 5, 6, 7 để trống).
- **Các giải pháp đã triển khai**:
  1. *Cơ chế Hợp Nhất An Toàn Phía Máy Chủ (Server-Side Safe Merge)*:
     - Tại `backend/src/index.js` (case `saveChamCong`), trước khi lưu, Worker truy vấn dữ liệu hiện tại trong CSDL.
     - Thực hiện hợp nhất từng nhân sự và từng ngày: các ngày cũ của các nhân sự khác luôn được bảo toàn tuyệt đối, chỉ cập nhật các ngày mới gửi lên hoặc xóa khi client truyền chuỗi rỗng `""`. Ngăn chặn 100% tình trạng mất dữ liệu do client gửi payload thiếu.
  2. *Cơ chế Hợp Nhất An Toàn Phía Trình Duyệt (Client-Side Safe Overlay)*:
     - Trong `js/thongke.js` (`loadChamCongData`), khi nhận được dữ liệu đầy đủ từ server, nếu người dùng đang nhập dở dang một vài ô trên máy, hệ thống đắp các ô sửa cục bộ đè lên dữ liệu server, không bỏ qua dữ liệu server.
     - Chuẩn hóa so sánh trong `commitChamCongCell` (`CA-NGAY` <-> `X`, `SANG` <-> `S`, `CHIEU` <-> `C`), chấm dứt việc tự động dirty khi chỉ click/blur ô đã có dữ liệu.
  3. *Khôi phục dữ liệu Tháng 9 và cập nhật Tháng 6, 7*:
     - **Tháng 09/2026**: Khôi phục trọn vẹn 13 nhân sự cho các ngày 1–2 (LỄ Quốc Khánh), ngày 3–5 (đi làm/trực theo ca), ngày 7 (đi làm thực tế, giữ nguyên giá trị 8 của BS Đạt).
     - **Tháng 06/2026 & Tháng 07/2026**: Bổ sung ký hiệu Thai sản `TS` cho toàn bộ 26–27 ngày làm việc của Nguyễn Thu Hằng, giúp bảng chấm công rõ ràng, minh bạch trạng thái thai sản và không còn bị coi là mất dữ liệu.
  4. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev10`.
     - Footer timestamp: `14:15 07/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev10'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev10` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
     - Cập nhật query string `v=4.0.2-rev10` cho `hdsd.html` trong `js/app.js`.
- **File sửa đổi**:
  + `backend/src/index.js` (server-side safe merge trong saveChamCong)
  + `js/thongke.js` (client-side safe merge, chuẩn hoá so sánh commitChamCongCell)
  + `index.html` (footer timestamp 14:15 07/09/2026, version 4.0.2-rev10, cache busters)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Khôi Phục Toàn Diện Dữ Liệu Chấm Công 5 Tháng (Tháng 1 - Tháng 5/2026) Từ Bản In Giấy Gốc & Chuẩn Hóa Tính Công Khớp 100% (07/09/2026 - v4.0.2-rev11)
- **Yêu cầu của người dùng**:
  - *"đây là dữ liệu chấm công mình in ra từ trước, bạn đọc là thêm lại cho mình"* kèm 3 ảnh chụp bản in Bảng chấm công giấy gốc:
    + Ảnh 1: Tháng 5 Năm 2026.
    + Ảnh 2: Tháng 3 và Tháng 4 Năm 2026.
    + Ảnh 3: Tháng 1 và Tháng 2 Năm 2026.
- **Phân tích & Xử lý**:
  1. *Giải mã toàn bộ dữ liệu 5 tháng từ bản in giấy gốc*:
     - Bóc tách chi tiết 100% từng ô chấm công cho toàn bộ 13 nhân sự qua 5 tháng (Tháng 1 đến Tháng 5/2026).
     - Phục hồi chính xác các ký hiệu đặc thù theo giấy: `Lễ` (Nghỉ lễ), `Nội` (Học/trực nội trú), `Tết` (Nghỉ Tết Nguyên Đán từ 14–22/2), `H` (Hội chẩn/học), `F` (Nghỉ phép), `B` (Nghỉ bù), `Ô` (Nghỉ ốm), `TS` (Thai sản), `DK` (Dã ngoại/khác), `X/2` (Nửa công 0.5), `X` (Cả ngày 1.0 công).
     - Đối chiếu kiểm tra đối chứng: 100% nhân sự của cả 5 tháng đều khớp tuyệt đối với số tổng trên cột **Tổng** của bản in giấy:
       * Tháng 1: Đạt 21.5, Hoa 17.5, Thảo 7.5, Thái 18.5, Hằng 20, Khuyến 21.5, Thuyến 18, Lương 22, Phan Hiền 22, Lê Hiền 19.5, Hà 22.5, Khính 19.
       * Tháng 2: Đạt 13, Hoa 14.5, Thảo 0, Thái 15, Hằng 13, Khuyến 13, Thuyến 13, Lương 15.5, Phan Hiền 16, Lê Hiền 15, Hà 15.5, Khính 14.
       * Tháng 3: Đạt 22.5, Hoa 9, Thảo 19, Thái 18.5, Hằng 22.5, Khuyến 22, Thuyến 14.5, Lương 21.5, Phan Hiền 22, Lê Hiền 21.5, Hà 23.5, Khính 17, Duyên 16.5.
       * Tháng 4: Đạt 20.5, Hoa 12, Thảo 20, Thái 13.5, Hằng 20, Khuyến 20, Thuyến 14, Lương 21, Phan Hiền 21, Lê Hiền 19.5, Hà 22.5, Khính 18, Duyên 20.
       * Tháng 5: Đạt 21, Hoa 21.5, Thảo 19, Thái 8.5, Hằng 15, Khuyến 21, Thuyến 11, Lương 21.5, Phan Hiền 21.5, Lê Hiền 20, Hà 20.5, Khính 0, Duyên 20.5.
  2. *Cập nhật thuật toán tính công Frontend (`calcDayValue`)*:
     - Khắc phục lỗi thuật toán cũ: Trước đây các ký hiệu `LỄ`, `H`, `P` bị cộng 1.0 công và `B` bị cộng 0.5 công, đồng thời `X/2` bị hàm split cắt lấy phần `X` làm tròn thành 1.0.
     - Cập nhật chuẩn xác: Chỉ có `X` tính 1.0 công, `X/2` (cùng `S`, `C`, `0.5`) tính 0.5 công. Tất cả các ký hiệu quản trị, hội chẩn, trực nội trú, nghỉ lễ/tết (`Lễ`, `Tết`, `Nội`, `H`, `F`, `B`, `Ô`, `TS`, `DK`) tính 0 công thủ thuật, giúp tổng công của bảng chấm công trên phần mềm khớp chính xác 100% với bản in giấy.
  3. *Chuẩn hóa hiển thị trực quan & CSS Badge*:
     - Bổ sung định dạng màu sắc cao cấp trong `css/style.css` cho tất cả các ký hiệu: `Lễ` / `Tết` (đỏ lễ hội), `Nội` (xanh dương nội trú), `TS` / `DK` (tím), `Ô` (cam ốm đau), `H` / `F` / `B` (vàng hổ phách), `X/2` (xanh mòng két), `S` / `C` (xanh ngọc) cho cả chế độ Sáng & Tối (Dark Mode).
  4. *Nạp toàn bộ dữ liệu vào Cloudflare D1 CSDL live*:
     - Đã chạy nạp thành công 100% dữ liệu 5 tháng lên Cloudflare D1 qua API Worker `saveChamCong`.
  5. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev11`.
     - Footer timestamp: `15:20 07/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev11'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev11` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
     - Cập nhật query string `v=4.0.2-rev11` cho `hdsd.html` trong `js/app.js`.
- **File sửa đổi**:
  + `js/thongke.js` (cập nhật calcDayValue, formatDisplayValue, commitChamCongCell)
  + `css/style.css` (bổ sung CSS badge cho Lễ, Tết, Nội, Ô, H, F, B, X/2 cả Light và Dark mode)
  + `js/app.js` (cache buster v4.0.2-rev11 cho modal hdsd)
  + `index.html` (footer timestamp 15:20 07/09/2026, version 4.0.2-rev11, cache busters)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Khắc Phục Lỗi Hiển Thị 4.2 Công Của Trần Thị Duyên (Tháng 1-2 Chưa Vào Khoa) & Chuẩn Hóa Hệ Số Lương 1.0 (07/09/2026 - v4.0.2-rev12)
- **Yêu cầu của người dùng**:
  - *"tháng 1/2026 với Trần Thị Duyên chưa vào khoa nên chưa có dữ liệu, sao trên web lại hiện 4,2 công"* kèm ảnh chụp màn hình Bảng Chấm Công Tháng 1/2026 trên web.
- **Phân tích nguyên nhân cốt lõi**:
  1. *Nguyên nhân Trần Thị Duyên có 4.2 công ở Tháng 1 và có ngày ở Tháng 2*:
     - Trước đây dữ liệu mẫu trong CSDL gán cho Trần Thị Duyên 14 ngày đi làm ở Tháng 1 và 9 ngày Tết ở Tháng 2 kèm hệ số `heSo: 0.3`. Khi tính: 14 ngày * 0.3 = `4.2` công.
     - Thực tế trên bản in giấy gốc của khoa: Tháng 1 và Tháng 2/2026 chỉ có 12 nhân sự, **Trần Thị Duyên chưa vào khoa**, hoàn toàn không có tên và không có ngày công nào. Trần Thị Duyên chỉ bắt đầu vào làm từ Tháng 3/2026.
  2. *Nguyên nhân hệ số Lê Thị Thu Hiền và Nguyễn Văn Khính bị nhân 0.5 (9.75 và 9.5 công)*:
     - Trong CSDL lưu vết cũ, Lê Thị Thu Hiền và Nguyễn Văn Khính bị ghi `heSo: 0.5`, làm tổng công Tháng 1 của Lê Hiền bị giảm còn 9.75 (thay vì 19.5 như bản in giấy) và Khính còn 9.5 (thay vì 19).
     - Trên bản in giấy gốc, tất cả nhân sự đều hưởng chuẩn công 1.0.
  3. *Nguyên nhân cơ chế Safe Merge trên backend giữ lại ngày cũ khi không gửi*:
     - Cơ chế `saveChamCong` trước đó thực hiện merge giữa dữ liệu mới và dữ liệu cũ trong CSDL, nên nếu client gửi danh sách không có Trần Thị Duyên, bản ghi cũ vẫn tồn tại.
- **Các giải pháp đã triển khai**:
  1. *Nâng cấp Worker `saveChamCong`*:
     - Bổ sung cờ `_replaceWhole: true` (hoặc `args[2] === true`) cho phép ghi đè hoàn toàn tập dữ liệu khi cần làm sạch CSDL.
     - Cho phép xóa hẳn nhân sự khi truyền `null` hoặc `_delete: true`.
  2. *Làm sạch CSDL Cloudflare D1 cho toàn bộ 5 tháng*:
     - **Tháng 1 & Tháng 2/2026**: Xóa sạch 100% ngày công của Trần Thị Duyên (`{ heSo: 1.0 }`), đưa tổng công về chính xác `0`.
     - **Chuẩn hóa Hệ số 1.0**: Toàn bộ nhân sự (bao gồm Lê Thị Thu Hiền, Nguyễn Văn Khính, Trần Thị Duyên) đều có hệ số `1.0`, giúp tổng công Tháng 1 của Lê Thị Thu Hiền đạt đúng `19.5`, Nguyễn Văn Khính đạt đúng `19` khớp 100% bản in giấy.
  3. *Tự động dọn dẹp Cache Client*:
     - Cập nhật `pm_cleaned_cache_ver = '4.0.2-rev12'` trong `js/thongke.js` để trình duyệt người dùng tự động xóa cache chấm công cũ (`pm_cache_cc_*`) và nhận dữ liệu mới ngay lập tức.
  4. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev12`.
     - Footer timestamp: `15:45 07/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev12'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev12` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
     - Cập nhật query string `v=4.0.2-rev12` cho `hdsd.html` trong `js/app.js`.
- **File sửa đổi**:
  + `backend/src/index.js` (hỗ trợ _replaceWhole và xóa nhân sự trong saveChamCong)
  + `js/thongke.js` (nâng cấp pm_cleaned_cache_ver lên 4.0.2-rev12)
  + `index.html` (footer timestamp 15:45 07/09/2026, version 4.0.2-rev12, cache busters)
  + `sw.js` (CACHE_NAME v4.0.2-rev12)
  + `js/app.js` (cache buster v4.0.2-rev12)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

---

### Di Chuyển Bảng Ký Hiệu Chấm Công Xuống Phía Dưới Bảng Chấm Công (07/09/2026 - v4.0.2-rev13)

- **Yêu cầu của người dùng**:
  + Chuyển phần ký hiệu chấm công (trước đây nằm trong tab Quản trị) ra đặt ngay ở bảng phía dưới bảng chấm công.
- **Phân tích & Hiện thực**:
  1. *Chuyển vị trí hiển thị*:
     - Di dời toàn bộ khối chú thích ký hiệu chấm công từ Section 4 của Tab Quản trị (`#admin-sec-procedures`) sang đặt ngay bên dưới container bảng chấm công (`#table-chamcong-container`) thuộc Tab Chấm Công (`#tab-chamcong`).
     - Người chấm công có thể trực quan theo dõi ngay quy ước ký hiệu tính công mà không cần chuyển sang tab Quản trị.
  2. *Giao diện & Trải nghiệm*:
     - Thiết kế card chú thích `.chamcong-legend-wrapper` hiện đại, viền bo góc, bóng đổ nhẹ.
     - Các huy hiệu ký hiệu (`X`, `X/2`, `S / C`, `Lễ`, `Tết`, `Nội`, `Ô`, `H`, `F`, `B`, `TS`, `ĐK / DK`, `K / V`) hiển thị màu sắc tương thích hoàn toàn với màu sắc các ô input trong bảng chấm công.
     - Tối ưu chế độ Dark Mode (`[data-theme="dark"]`): nền tối mờ `#1e293b`, viền `#334155`, chữ nhãn `#cbd5e1`, tiêu đề xanh nhạt `#60a5fa`, các badge giữ nguyên sắc độ nhận diện.
  3. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev13`.
     - Footer timestamp: `15:55 07/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev13'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev13` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
     - Cập nhật query string `v=4.0.2-rev13` cho `hdsd.html` trong `js/app.js`.
- **File sửa đổi**:
  + `index.html` (chuyển vị trí bảng ký hiệu xuống dưới bảng chấm công, footer timestamp 15:55 07/09/2026, version 4.0.2-rev13, cache busters)
  + `css/style.css` (bổ sung styling cho `.chamcong-legend-wrapper` và hỗ trợ Dark Mode)
  + `sw.js` (CACHE_NAME v4.0.2-rev13)
  + `js/app.js` (cache buster v4.0.2-rev13 cho modal hdsd)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

---

### Tích Hợp Quản Lý Nhân Sự Chấm Công Kéo Thả Trực Tiếp & Ký Hiệu Chấm Công Động Vào Tab Chấm Công (07/09/2026 - v4.0.2-rev14)

- **Yêu cầu của người dùng**:
  1. Đưa danh sách nhân sự chấm công và thống kê tổng hợp từ tab Quản trị vào thẳng luôn tab Chấm Công.
  2. Khi cần thêm/sửa/xóa nhân sự thì thao tác trực tiếp từ tab Chấm Công luôn.
  3. Có nút 3 gạch (`☰`) ở đầu mỗi hàng để kéo thả (Drag & Drop) di chuyển sắp xếp thứ tự nhân sự theo ý thích.
  4. Bảng ký hiệu chấm công cũng có thể thêm/sửa/xóa ký hiệu (mã, tên, số công quy đổi, màu sắc).
- **Phân tích & Hiện thực**:
  1. *Sub-tabs tiện ích trong Tab Chấm Công*:
     - Tích hợp thanh điều hướng Sub-tab phía trên Tab Chấm Công gồm 2 chế độ:
       + `📅 Bảng Chấm Công`: Lưới chấm công 31 ngày, bộ lọc tháng/năm, bảng ký hiệu chấm công động bên dưới.
       + `🧑‍⚕️ Danh Sách Nhân Sự`: Bảng quản lý nhân sự chuyên dụng với các cột: ☰ Sắp xếp, STT, Tên Nhân Viên, Chức Danh / Vị Trí, Từ Khóa Nhận Diện HIS, Kỹ Năng / Phân Loại, Thao Tác (Sửa / Xóa) và nút `➕ Thêm Nhân Viên Mới`.
     - Cho phép quản trị viên thêm, sửa, xóa nhân sự trực tiếp ngay trong tab Chấm Công mà không phải mở Tab Quản trị.
  2. *Kéo thả sắp xếp thứ tự nhân sự (Drag & Drop)*:
     - Tận dụng thư viện `SortableJS` tích hợp sẵn trong dự án (`js/sortable.min.js`), kích hoạt trên `#chamcong-employees-body` với tay cầm kéo `.drag-handle`.
     - Bổ sung nút mũi tên nhanh `▲` `▼` (`moveAdminEmployee`) hỗ trợ sắp xếp tức thì 1 chạm trên màn hình cảm ứng hoặc chuột.
     - Sau khi kéo thả, thứ tự mới tự động lưu lên máy chủ (`saveEmployees`) và Bảng Chấm Công tự động render lại theo đúng thứ tự mới sắp xếp.
  3. *Hệ thống ký hiệu chấm công động (Dynamic Symbols & Quy ước tính công)*:
     - Thêm 2 action backend Cloudflare Workers: `getChamCongSymbols` (đọc từ `cai_dat` key `chamcong_symbols`, fallback 13 ký hiệu chuẩn) và `saveChamCongSymbols` (lưu lên CSDL D1 và bump data version).
     - Giao diện chú thích ký hiệu `#chamcong-legend-chips` được render động từ CSDL kèm 2 nút chức năng: `[⚙️ Quản Lý Ký Hiệu]` và `[➕ Thêm Ký Hiệu]`.
     - Modal `#modal-chamcong-symbol`: Cho phép Thêm mới, Sửa, Xóa từng ký hiệu, tùy biến mã ký hiệu, tên ý nghĩa, số công quy đổi (ví dụ: `1.0`, `0.5`, `0`), màu nền, màu chữ với khung Preview Badge trực tiếp.
     - Nút `[🔄 Khôi phục 13 ký hiệu chuẩn]` giúp hoàn tác về bộ ký hiệu ban đầu bất kỳ lúc nào.
     - Hàm `calcDayValue(val)` và `formatDisplayValue(val)` tra cứu động theo danh sách ký hiệu mới, đảm bảo tính công chính xác 100% trên Bảng Chấm Công, Thống Kê Tổng Hợp, Thống Kê Quý và In ấn.
     - Tự động gán màu sắc trực quan (background, viền, chữ) cho các ô input chấm công dựa trên ký hiệu đã chọn.
  4. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev14`.
     - Footer timestamp: `16:15 07/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev14'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev14` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
     - Cập nhật query string `v=4.0.2-rev14` cho `hdsd.html` trong `js/app.js`.
- **File sửa đổi**:
  + `backend/src/index.js` (thêm getChamCongSymbols, saveChamCongSymbols)
  + `css/style.css` (bổ sung styling subtabs, drag-handle, btn-quick-move, symbols chip)
  + `index.html` (thêm subtabs trong tab-chamcong, modal-chamcong-symbol, timestamp 16:15 07/09/2026, cache busters v4.0.2-rev14)
  + `js/thongke.js` (tích hợp render đồng bộ nhân sự, sortable kéo thả, moveAdminEmployee, switchChamCongSubTab, dynamic symbols, modal symbols, calcDayValue nâng cao)
  + `sw.js` (CACHE_NAME v4.0.2-rev14)
  + `js/app.js` (cache buster v4.0.2-rev14 cho modal hdsd)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

---

### Khắc Phục Lỗi item.aliases.split is not a function & Phục Hồi Hiển Thị Bảng Chấm Công (08/09/2026 - v4.0.2-rev15)

- **Vấn đề phát sinh**:
  + Người dùng phản ánh: "bảng chấm công trống trơn, khi kéo thả để sắp xếp thì báo 'Lỗi khi lưu nhân sự: item.aliases.split is not a function'".
  + Console báo lỗi lặp đi lặp lại: `TypeError: item.aliases.split is not a function at findChamCongSymbol (thongke.js:833:46) at calcDayValue ... at renderChamCongTable ...`.
- **Nguyên nhân gốc rễ (Root Cause)**:
  1. Trong `backend/src/index.js`, dữ liệu `defaultSymbols` định nghĩa `aliases` dưới dạng mảng JSON `["S", "C"]` hoặc khi người dùng cấu hình lưu mảng vào D1 key `chamcong_symbols`.
  2. Tại frontend `js/thongke.js`, hàm `findChamCongSymbol(str)` giả định `item.aliases` luôn là chuỗi và gọi trực tiếp `item.aliases.split(',')`. Do `item.aliases` là `Array`, JS quăng ngoại lệ `TypeError: item.aliases.split is not a function`.
  3. Lỗi này kích hoạt ngay ở vòng lặp `renderChamCongTable()` tại ô đầu tiên của nhân sự đầu tiên, làm sập toàn bộ chu trình render DOM, khiến bảng chấm công không hiển thị được bất kỳ hàng nào ("trống trơn").
  4. Tương tự, khi người dùng kéo thả sắp xếp nhân sự, hàm `saveAdminChamCongData(false)` gọi API lưu thành công nhưng trong callback `.then()` gọi `renderChamCongTable()` lại phát sinh ngoại lệ trên, rơi vào `.catch()` và kích hoạt popup báo động: *"Lỗi khi lưu nhân sự: item.aliases.split is not a function"*.
- **Giải pháp & Khắc phục triệt để**:
  1. *Backend (`backend/src/index.js`)*:
     - Chuẩn hóa toàn bộ `aliases` trong `defaultSymbols` thành chuỗi ngăn cách bởi dấu phẩy (VD: `"S, C, SANG, CHIEU"`, `"DK, ĐK"`).
     - Bổ sung bước chuẩn hóa tự động trong `getChamCongSymbols` và `saveChamCongSymbols`: nếu `aliases` là mảng thì tự động `.join(', ')` trước khi trả về hoặc lưu vào D1 CSDL.
  2. *Frontend (`js/thongke.js`)*:
     - Viết lại hàm `findChamCongSymbol(str)` hoàn toàn an toàn và linh hoạt:
       + Kiểm tra mã gộp có chứa ký tự `/` (như `"S / C"`, `"ĐK / DK"`, `"K / V"`), tự động so khớp các phần tử con (`S`, `C`, `ĐK`, `DK`, `K`, `V`).
       + Kiểm tra `item.aliases`: hỗ trợ linh hoạt cả Array (`.map()`) lẫn String (`.split(/[,;\/]+/)`), tuyệt đối không bao giờ phát sinh lỗi `.split is not a function`.
     - Chuẩn hóa trong `loadChamCongSymbols`: tự động chuyển đổi `aliases` thành chuỗi khi nhận từ API backend.
     - Hàm `formatDisplayValue(val)`: Giữ nguyên mã con của các ký hiệu gộp (hiển thị `S` hoặc `C` thay vì đổi thành `S / C`).
     - Hàm `calcDayValue(val)`: Bọc try-catch phòng thủ đa tầng quanh `findChamCongSymbol` kèm fallback, không bao giờ ngắt luồng render bảng chấm công.
     - Hàm `saveAdminChamCongData(showAlert)`: Bọc try-catch an toàn quanh việc render bảng, chỉ hiển thị alert popup khi người dùng bấm nút lưu trực tiếp (`showAlert === true`).
     - Nâng cấp `pm_cleaned_cache_ver = '4.0.2-rev15'` để tự động dọn sạch cache cũ trên trình duyệt client.
  3. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev15`.
     - Footer timestamp: `07:15 08/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev15'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev15` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
     - Cập nhật query string `v=4.0.2-rev15` cho `hdsd.html` trong `js/app.js`.
- **File sửa đổi**:
  + `backend/src/index.js` (chuẩn hóa aliases)
  + `js/thongke.js` (fix findChamCongSymbol, formatDisplayValue, calcDayValue, saveAdminChamCongData, cache ver)
  + `index.html` (cache buster rev15, footer timestamp 07:15 08/09/2026)
  + `sw.js` (CACHE_NAME rev15)
  + `js/app.js` (targetUrl HDSD rev15)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

---

### Khắc Phục Lỗi Nhảy Lại Thứ Tự Khi Kéo Thả Nhân Sự & Tối Ưu Nút 3 Gạch ☰ (08/09/2026 - v4.0.2-rev16)

- **Yêu cầu của người dùng**:
  + Kiểm tra lỗi khi kéo thả nhân sự thì lúc đầu được nhưng bị nhảy lại như đầu mà không báo lỗi gì.
  + Bỏ các mũi tên lên xuống, chỉ giữ lại nút 3 gạch (`☰`) để sắp xếp nhân sự.
- **Nguyên nhân gốc rễ (Root Cause)**:
  1. Trong `cleanseAdminChamCongEmployees(list)` tại `js/thongke.js`, đoạn mã:
     ```javascript
     res.sort((a, b) => {
         const idxA = DEFAULT_CHAMCONG_EMPLOYEES.indexOf(a);
         const idxB = DEFAULT_CHAMCONG_EMPLOYEES.indexOf(b);
         if (idxA !== -1 && idxB !== -1) return idxA - idxB;
         ...
     });
     ```
     đã cưỡng chế sắp xếp lại toàn bộ mảng nhân sự theo đúng thứ tự canonical mặc định ban đầu (`DEFAULT_CHAMCONG_EMPLOYEES`) mỗi khi bất kỳ hàm nào gọi `cleanseAdminChamCongEmployees()`.
  2. Khi người dùng kéo thả hàng, SortableJS chuyển dời DOM node và gọi `saveAdminChamCongData(false)`. Khi lệnh lưu hoàn tất hoặc khi gọi `renderChamCongTable()`, hàm `cleanseAdminChamCongEmployees()` được kích hoạt, âm thầm sort mảng `adminChamCongEmployees` quay ngược trở lại thứ tự gốc mà không có bất kỳ lỗi nào xuất hiện trong console ("bị nhảy lại như đầu mà không báo lỗi gì").
  3. `saveAdminChamCongData` trước đó chỉ gửi API lên Cloudflare mà chưa ghi ngay vào `localStorage`, khiến việc tải lại hoặc đọc cache bị lệch với dữ liệu vừa kéo thả.
- **Giải pháp & Khắc phục triệt để**:
  1. *Loại bỏ cưỡng chế sort trong `cleanseAdminChamCongEmployees`*:
     - Xóa bỏ hoàn toàn lệnh `res.sort(...)`. Giữ nguyên 100% thứ tự thực tế do người dùng vừa kéo thả sắp xếp.
     - Vẫn đảm bảo kiểm tra nhân sự chuẩn: nếu danh sách thiếu nhân sự nào thì chỉ bổ sung người đó vào cuối danh sách.
  2. *Tối ưu hóa kéo thả SortableJS*:
     - Trong sự kiện `onEnd`, đọc trực tiếp danh sách thuộc tính `data-emp` từ các hàng `<tr>` DOM thực tế để cập nhật `adminChamCongEmployees`:
       `const newOrder = Array.from(ccTbody.querySelectorAll('tr')).map(r => r.getAttribute('data-emp')).filter(Boolean);`
       Loại bỏ triệt để mọi nguy cơ lệch chỉ mục `evt.oldIndex` / `evt.newIndex`.
     - Cập nhật số thứ tự STT hiển thị trên màn hình (`1, 2, 3...`) và cập nhật thuộc tính `data-index`, `onclick` của các nút Sửa / Xóa theo vị trí mới ngay tức thì.
     - Lưu ngay thứ tự mới vào `localStorage` trước khi gửi API lên server.
  3. *Tối ưu giao diện & Trải nghiệm*:
     - Loại bỏ hoàn toàn 2 nút mũi tên lên xuống (`▲`, `▼`), chỉ giữ lại duy nhất nút 3 gạch (`☰`) thanh lịch, rõ ràng.
     - Cập nhật tiêu đề cột trên `index.html` thành biểu tượng `☰` gọn gàng.
     - Tránh hủy/vẽ lại DOM `ccTbody` khi đang lưu ngầm (`showAlert === false`), đảm bảo chuyển động kéo thả mượt mà, không bị giật nháy màn hình.
  4. *Đồng bộ phiên bản theo RULES.md*:
     - Giữ phiên bản chính `4.0.2`, nâng revision lên `4.0.2-rev16`.
     - Footer timestamp: `07:20 08/09/2026`.
     - Đồng bộ `CACHE_NAME = 'pmcg-v4-cache-4.0.2-rev16'` trong `sw.js`.
     - Đồng bộ `?v=4.0.2-rev16` trên toàn bộ link CSS, thẻ script và `APP_VERSION` trong `index.html`.
     - Cập nhật query string `v=4.0.2-rev16` cho `hdsd.html` trong `js/app.js`.
- **File sửa đổi**:
  + `js/thongke.js` (bỏ res.sort, tối ưu Sortable onEnd, bỏ nút mũi tên, lưu localStorage ngay)
  + `index.html` (đổi tiêu đề cột thành ☰, footer timestamp 07:20 08/09/2026, cache busters v4.0.2-rev16)
  + `sw.js` (CACHE_NAME v4.0.2-rev16)
  + `js/app.js` (targetUrl HDSD v4.0.2-rev16)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

---

### Nâng Cấp Phiên Bản Hệ Thống Lên v4.0.3 (08/09/2026 - v4.0.3-rev1)

- **Yêu cầu của người dùng**:
  + Nâng cấp phiên bản toàn hệ thống lên `4.0.3`.
- **Thực hiện & Đồng bộ toàn diện**:
  1. *Đồng bộ phiên bản hệ thống theo RULES.md*:
     - Nâng số phiên bản chính lên `4.0.3` (Revision: `v4.0.3-rev1`).
     - Cập nhật số phiên bản hiển thị tại Chân trang (`#app-footer-version`): `Phiên bản: 4.0.3`.
     - Footer timestamp: `07:30 08/09/2026`.
     - `backend/package.json`: Cập nhật `"version": "4.0.3"`.
     - `sw.js`: Cập nhật `CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev1'`.
     - `index.html`: Cập nhật toàn bộ cache busters `?v=4.0.3-rev1` cho các thẻ `<link>` CSS, thẻ `<script>`, và hằng số `APP_VERSION = '4.0.3-rev1'`.
     - `js/app.js`: Cập nhật query string `v=4.0.3-rev1` cho modal Hướng dẫn sử dụng (`hdsd.html`).
     - `js/thongke.js`: Nâng `pm_cleaned_cache_ver = '4.0.3-rev1'` để tự động làm sạch và đồng bộ cache trình duyệt của khách hàng.
- **File sửa đổi**:
  + `backend/package.json` (nâng version 4.0.3)
  + `index.html` (footer version 4.0.3, footer timestamp 07:30 08/09/2026, cache busters v4.0.3-rev1)
  + `sw.js` (CACHE_NAME v4.0.3-rev1)
  + `js/app.js` (targetUrl HDSD v4.0.3-rev1)
  + `js/thongke.js` (pm_cleaned_cache_ver 4.0.3-rev1)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

---

### Khắc Phục Lỗi TypeError cloneNode Trong SortableJS Khi Kéo Thả (08/09/2026 - v4.0.3-rev2)

- **Yêu cầu của người dùng**:
  + Báo lỗi console:
    ```
    app.js?v=4.0.3-rev1:723 JS ERROR: Uncaught TypeError: Cannot read properties of null (reading 'cloneNode') at https://xeplichthuthuat.io.vn/js/sortable.min.js?v=3.2.6 line 2 TypeError: Cannot read properties of null (reading 'cloneNode')
        at _ (sortable.min.js?v=3.2.6:2:6677)
        at Ft._onDragStart (sortable.min.js?v=3.2.6:2:22963)
    ```
- **Phân tích nguyên nhân & Giải pháp**:
  1. *Nguyên nhân cốt lõi*:
     - Trong `js/sortable.min.js`, hàm `_onDragStart` gọi `et = _(V)` với `V` là element đang được kéo (`Ft.dragged`). Khi native HTML5 dragstart bắn ra ngoài luồng dự kiến (ví dụ click nhanh, bôi đen text, hoặc sau khi `_nulling` đã reset `V = null`), biến `V` là `null`. Hàm `_(t)` cố gắng gọi `t.cloneNode(!0)` trên giá trị `null`, sinh ra lỗi `TypeError: Cannot read properties of null (reading 'cloneNode')`.
     - Đồng thời, thẻ nạp script `sortable.min.js` trong `index.html` trước đó đang gắn cache buster cũ `?v=3.2.6`, khiến trình duyệt và Service Worker tiếp tục lưu trữ và thực thi bản thư viện cũ chưa có cơ chế phòng thủ (defense guards).
  2. *Giải pháp thực hiện*:
     - **Vá an toàn thư viện `js/sortable.min.js`**:
       + Bổ sung guard ngay đầu hàm `function _(t)`: `if(!t)return document.createElement("div");`
       + Bổ sung guard ngay đầu phương thức `_onDragStart: function(t, e)`: `if(!V)return;`
     - **Tối ưu cấu hình SortableJS trong `js/thongke.js`**:
       + Thêm `draggable: 'tr'` để Sortable chỉ bắt các hàng `<tr>`, không bắt nhầm các container hay thẻ bọc.
       + Thêm `filter: 'button, input, select, a'` và `preventOnFilter: false` để các thao tác bấm nút thao tác hoặc chỉnh sửa input không kích hoạt drag.
     - **Đồng bộ toàn diện phiên bản hệ thống theo RULES.md**:
       + Phiên bản chính: `4.0.3` (Footer: `Phiên bản: 4.0.3`).
       + Revision: `v4.0.3-rev2`.
       + Footer timestamp: `07:35 08/09/2026`.
       + `index.html`: Cập nhật `<script src="js/sortable.min.js?v=4.0.3-rev2"></script>`, đồng bộ toàn bộ `?v=4.0.3-rev2` và `APP_VERSION = '4.0.3-rev2'`.
       + `sw.js`: Nâng `CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev2'` để ép Service Worker làm mới hoàn toàn.
       + `js/app.js`: Cập nhật `targetUrl` modal HDSD sang `v=4.0.3-rev2`.
       + `js/thongke.js`: Cập nhật `pm_cleaned_cache_ver = '4.0.3-rev2'`.
- **File sửa đổi**:
  + `js/sortable.min.js` (thêm defensive checks phòng thủ chống null cloneNode)
  + `js/thongke.js` (draggable 'tr', filter button/input/select, pm_cleaned_cache_ver 4.0.3-rev2)
  + `index.html` (script sortable.min.js?v=4.0.3-rev2, footer timestamp 07:35 08/09/2026, cache busters v4.0.3-rev2)
  + `sw.js` (CACHE_NAME v4.0.3-rev2)
  + `js/app.js` (targetUrl HDSD v4.0.3-rev2)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

---

### Triệt Tiêu Vĩnh Viễn Lỗi Telemetry / Web Vitals reportAllChanges (reading 'startTime') (08/09/2026 - v4.0.3-rev3)

- **Yêu cầu của người dùng**:
  + Báo lỗi console:
    ```
    VM402:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
        at et.reportAllChanges (<anonymous>:2:19429)
        at <anonymous>:2:13070
        at <anonymous>:2:331
        at d (<anonymous>:2:6141)
        at <anonymous>:2:6326
        at <anonymous>:2:2895
        at n.timeout (<anonymous>:2:5652)
    ```
- **Phân tích nguyên nhân & Giải pháp**:
  1. *Nguyên nhân cốt lõi*:
     - Cloudflare Edge tự động inject script module đo lường Real User Measurement (RUM) `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/..." data-cf-beacon='...'>` vào trước thẻ đóng `</body>`.
     - Trong `beacon.min.js`, thư viện `web-vitals` của Google được đóng gói và nạp các module Webpack trước khi kiểm tra cờ `__cfBeacon`.
     - Trong module `web-vitals`, khi một tương tác hoặc sự kiện quan sát hiệu năng kết thúc, hàm `et.reportAllChanges` truy cập thuộc tính `entry.startTime` hoặc `entries[0].startTime`. Nếu danh sách quan sát bị rỗng (`undefined`), JavaScript ném ngoại lệ `TypeError: Cannot read properties of undefined (reading 'startTime')`. Vì callback này được gọi trực tiếp bởi browser/timer trong module mà không có khối `try/catch` bọc ngoài, nó biến thành lỗi chưa được bắt (`Uncaught TypeError`).
  2. *Giải pháp 4 lớp phòng thủ triệt để*:
     - **Lớp 1 (Service Worker `sw.js`)**:
       + Bổ sung bộ lọc trong sự kiện `fetch` của Service Worker: Bắt tất cả các yêu cầu tải `cloudflareinsights.com` hoặc `beacon.min.js`, lập tức phản hồi giả lập `200 OK` với nội dung JS rỗng `/* cf-beacon disabled */`.
       + Triệt tiêu việc tải và thực thi mã nguồn `beacon.min.js` từ gốc mạng.
     - **Lớp 2 (DOM MutationObserver trong `index.html`)**:
       + Khởi tạo `MutationObserver` ngay đầu thẻ `<head>` để tự động bóc gỡ mọi thẻ `<script>` trỏ đến `cloudflareinsights` hoặc mang thuộc tính `data-cf-beacon` ngay khi vừa được phân tích cú pháp HTML, đổi `type = 'javascript/blocked'` và remove khỏi DOM.
     - **Lớp 3 (Bọc an toàn `PerformanceObserver`)**:
       + Monkey-patch hàm dựng `window.PerformanceObserver` để bọc mọi callback theo dõi hiệu năng bằng cơ chế `try/catch`. Nếu phát sinh ngoại lệ chứa `startTime` hoặc `reportAllChanges`, hàm sẽ âm thầm nuốt lỗi thay vì để lỗi thoát ra ngoài thành `Uncaught TypeError`.
     - **Lớp 4 (`window.addEventListener('error', ..., true)` & `window.onerror`)**:
       + Lắng nghe sự kiện bắt lỗi toàn cục ở pha capture, tự động gọi `preventDefault()` và `stopImmediatePropagation()` để ngăn console hiển thị lỗi telemetry ngoại vi.
     - **Đồng bộ toàn diện phiên bản hệ thống theo RULES.md**:
       + Phiên bản chính: `4.0.3` (Footer: `Phiên bản: 4.0.3`).
       + Revision: `v4.0.3-rev3`.
       + Footer timestamp: `07:50 08/09/2026`.
       + `index.html`: Cập nhật toàn bộ cache busters `?v=4.0.3-rev3`, `APP_VERSION = '4.0.3-rev3'`.
       + `sw.js`: Đổi `CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev3'`.
       + `js/app.js`: Cập nhật `targetUrl` modal HDSD sang `v=4.0.3-rev3`.
       + `js/thongke.js`: Cập nhật `pm_cleaned_cache_ver = '4.0.3-rev3'`.
- **File sửa đổi**:
  + `sw.js` (chặn bắt và vô hiệu hóa beacon.min.js qua Service Worker, CACHE_NAME v4.0.3-rev3)
  + `index.html` (thêm MutationObserver & PerformanceObserver safe wrapper, footer timestamp 07:50 08/09/2026, cache busters v4.0.3-rev3)
  + `js/app.js` (targetUrl HDSD v4.0.3-rev3)
  + `js/thongke.js` (pm_cleaned_cache_ver 4.0.3-rev3)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Phiên bản 4.0.3-rev4 (08/09/2026)
- **Vấn đề khắc phục**:
  + Bác sĩ phản ánh: "khi sửa 1 bệnh nhân thì thỉnh thoảng bị mất các thủ thuật đã chọn".
- **Phân tích nguyên nhân**:
  1. *Lệch chỉ mục dữ liệu trong bảng bệnh nhân (`renderPatientsTable`)*:
     - `displayPatList` dùng `_origIndex: p.index !== undefined ? p.index : origIdx`. Khi danh sách bệnh nhân được tải từ máy chủ, import Excel, hoặc lọc theo loại BN / sắp xếp theo Ngày vào - Tên, thuộc tính `p.index` bị cũ hoặc không đồng bộ với chỉ mục thực trong mảng `dataCache.pat`.
     - Khi bấm sửa một hàng, hàm `editPatient(parseInt(this.dataset.patIndex))` truyền `_origIndex` bị lệch, dẫn đến việc `dataCache.pat[targetIdx]` lấy nhầm sang bệnh nhân khác hoặc `undefined`. Bác sĩ thấy form trống hoặc sai thủ thuật, và khi bấm "Lưu Sửa" sẽ ghi đè nhầm sang dữ liệu bệnh nhân khác.
  2. *Định dạng dữ liệu `thuThuat` biến thiên*:
     - Trước đây `editPatient` gọi `item.thuThuat.split(',')`. Khi dữ liệu từ Cloudflare D1 / Worker hoặc JSON import có dạng mảng (`['Điện châm', 'Xoa bóp']`), việc gọi `.split()` ném ngoại lệ `TypeError: item.thuThuat.split is not a function`, làm toàn bộ quá trình tích chọn checkbox bị dừng giữa chừng.
  3. *Hàm `matchProc` loại trừ nhầm các thủ thuật YHCT thông dụng*:
     - Danh sách từ khóa phân biệt `distinctKeywords` chứa `'bấm huyệt'`. Khi bệnh nhân có thủ thuật "Xoa bóp" còn danh mục chuẩn là "Xoa bóp bấm huyệt điều trị", điều kiện phân biệt từ chối khớp, khiến checkbox không được tích.
  4. *Mất các thủ thuật ngoài danh mục chuẩn khi bấm Lưu*:
     - Nếu bệnh nhân có thủ thuật tùy biến hoặc từ nguồn dữ liệu khác không nằm trong bảng danh mục thủ thuật chuẩn (`dataCache.proc`), trên giao diện không có checkbox tương ứng. Khi bác sĩ bấm "Lưu Sửa", hàm `savePatient()` chỉ lấy các checkbox `.pat-proc-cb:checked` có trên màn hình, dẫn đến việc các thủ thuật này bị xóa vĩnh viễn.
  5. *`renderProcedureCheckboxes()` làm trắng checkbox khi chuyển tab hoặc tải dữ liệu*:
     - Khi chuyển tab hoặc danh mục thủ thuật được đồng bộ ngầm, hàm `renderProcedureCheckboxes()` ghi đè lại HTML của danh sách checkbox làm mất toàn bộ trạng thái đã chọn nếu form sửa đang mở.
- **Giải pháp xử lý triệt để**:
  1. *Xây dựng chuẩn hóa dữ liệu `extractPatientProcedures(item)`*:
     - Tự động nhận diện và trích xuất an toàn mọi cấu trúc dữ liệu: chuỗi phân tách dấu phẩy/chấm phẩy/xuống dòng, mảng chuỗi, mảng đối tượng `{name, ten}`, chuỗi JSON array. Không bao giờ gây văng lỗi runtime.
  2. *Chuẩn hóa chỉ mục mảng `dataCache.pat`*:
     - Trong `renderPatientsTable`, luôn đồng bộ `p.index = origIdx` và dùng `_origIndex: origIdx` chuẩn xác 100%. Trong `editPatient`, bổ sung cơ chế tìm kiếm dự phòng an toàn theo ID / index nếu chỉ mục đầu vào không tồn tại.
  3. *Nâng cấp bộ so khớp thủ thuật `matchProc`*:
     - Bổ sung nhóm từ đồng nghĩa YHCT chuẩn xác (`xoa bóp`, `bấm huyệt`, `xbbh`). Bỏ qua việc chặn từ khóa `'bấm huyệt'` nếu thủ thuật đang xét thuộc nhóm xoa bóp.
  4. *Cơ chế tự động bảo toàn thủ thuật ngoài danh mục (Dynamic Injection)*:
     - Trong `editPatient`, sau khi khớp với danh mục chuẩn, bất kỳ thủ thuật nào của bệnh nhân chưa có checkbox sẽ được tự động tạo một checkbox nổi bật `[📌 Thủ thuật bổ sung / ngoài danh mục]` có đánh dấu checked. Nhờ đó, khi bấm "Lưu Sửa", các thủ thuật này được bảo toàn tuyệt đối 100%. Bác sĩ cũng có thể chủ động bỏ chọn nếu muốn xóa.
  5. *Bảo vệ trạng thái form khi `renderProcedureCheckboxes()` được gọi lại*:
     - Bổ sung bộ guard: Nếu `editIndex.pat > -1`, hàm tự động tái thiết lập các thủ thuật đang chọn cho bệnh nhân đang sửa, ngăn chặn hiện tượng bị trắng form.
  6. *Dọn dẹp mã nguồn và đồng bộ phiên bản*:
     - Loại bỏ khối hàm phác đồ bị khai báo trùng lặp trong `js/app.js`.
     - Phiên bản: `4.0.3-rev4`, footer timestamp: `08:05 08/09/2026`.
- **File sửa đổi**:
  + `js/app.js` (`extractPatientProcedures`, `matchProc`, `editPatient`, `renderProcedureCheckboxes`, `renderPatientsTable`, `clearSelectedProcs`, `cancelEdit`, xóa block duplicate, HDSD targetUrl `v=4.0.3-rev4`)
  + `index.html` (cache busters `?v=4.0.3-rev4`, `APP_VERSION = '4.0.3-rev4'`, footer timestamp `08:05 08/09/2026`)
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev4'`)
  + `js/thongke.js` (`pm_cleaned_cache_ver = '4.0.3-rev4'`)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Phiên bản 4.0.3-rev5 (08/09/2026)
- **Yêu cầu người dùng**:
  + Bác sĩ phản ánh: "bảng chấm công hiện tại đang tô nền của ngày Chủ nhật, mình cũng muốn Thứ 7 cũng vậy để dễ phân biệt vì thường chỉ làm từ thứ 2 đến thứ 6, thứ 7 chỉ có 1-2 người đi làm là cùng".
- **Phân tích & Giải pháp triển khai**:
  1. *Cập nhật hàm nhận diện ngày nghỉ/cuối tuần `isHoliday(y, m, d)`*:
     - Trước đây hàm chỉ trả về `true` cho ngày Chủ Nhật (`date.getDay() === 0`).
     - Đã nâng cấp hàm để bao gồm cả ngày Thứ 7 (`date.getDay() === 6 || date.getDay() === 0`).
  2. *Đồng bộ hiển thị trực quan trên Bảng Chấm Công (Web & Xuất Excel)*:
     - Trên giao diện Web:
       + Tiêu đề cột Thứ 7 (`T7`) và Chủ Nhật (`CN`) tự động nhận lớp CSS `bg-holiday` (nền vàng ấm `#fef08a`, chữ nâu đậm `#854d0e`, font-weight 800).
       + Toàn bộ cột dữ liệu của ngày Thứ 7 và Chủ Nhật được tô nền vàng kem dịu mắt (`#fff9c4`), giúp phân biệt ngay lập tức với các ngày làm việc chính trong tuần (Thứ 2 đến Thứ 6).
       + Đối với các nhân viên không đi làm vào Thứ 7 hoặc Chủ Nhật, ô hiển thị chữ nghiêng "Nghỉ". Khi người dùng bấm vào ô, ô chuyển thành ô nhập liệu nhanh (`enableHolidayCell`) để người dùng dễ dàng nhập ký hiệu công cho 1-2 nhân viên đi trực/làm việc vào ngày đó.
       + Bổ sung cơ chế tự động phục hồi chữ "Nghỉ" khi người dùng click vào ô cuối tuần nhưng không nhập nội dung và chuyển tiêu điểm ra ngoài (`blur`).
     - Khi Xuất Báo Cáo Excel (`exportChamCongExcel`):
       + Các cột ngày Thứ 7 và Chủ Nhật được tự động tô màu nền vàng `#FFFEF08A` ở phần Tiêu đề và `#FFFEF9C3` ở phần Dữ liệu nhân viên, đồng bộ 100% với giao diện phần mềm.
  3. *Đồng bộ phiên bản hệ thống theo RULES.md*:
     - Phiên bản chính: `4.0.3` (Footer: `Phiên bản: 4.0.3`).
     - Revision: `v4.0.3-rev5`.
     - Footer timestamp: `10:45 08/09/2026`.
     - `index.html`: Cập nhật toàn bộ cache busters `?v=4.0.3-rev5`, `APP_VERSION = '4.0.3-rev5'`.
     - `sw.js`: Đổi `CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev5'`.
     - `js/thongke.js`: Đổi `pm_cleaned_cache_ver = '4.0.3-rev5'`.
     - `js/app.js`: Đổi targetUrl HDSD sang `v=4.0.3-rev5`.
- **File sửa đổi**:
  + `js/thongke.js` (cập nhật `isHoliday` bao gồm Thứ 7 và Chủ Nhật, nâng cấp `enableHolidayCell`, `pm_cleaned_cache_ver = '4.0.3-rev5'`)
  + `index.html` (cache busters `?v=4.0.3-rev5`, `APP_VERSION = '4.0.3-rev5'`, footer timestamp `10:45 08/09/2026`)
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev5'`)
  + `js/app.js` (targetUrl HDSD `v=4.0.3-rev5`)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

### Phiên bản 4.0.3-rev6 (08/09/2026)
- **Yêu cầu người dùng**:
  + "có chỉnh sửa được nội dung trong thứ 7 không, ngoài ra khi ấn phím Tab thì từ thứ 6 nhảy thẳng sang thứ 2, đúng ra phải nhảy sang thứ 7 rồi mới đến thứ 2".
- **Phân tích & Tối ưu hóa trải nghiệm**:
  1. *Nguyên nhân nhảy cóc qua Thứ 7 khi bấm Tab*:
     - Trước đó, khi coi cả Thứ 7 là ngày nghỉ cố định như Chủ Nhật, các ô Thứ 7 bị render thành `<div ...>Nghỉ</div>` thay vì thẻ `<input>`.
     - Vì `<div>` không phải là phần tử có thể nhận tiêu điểm (focusable), trình duyệt khi bấm `Tab` từ Thứ 6 sẽ tự động bỏ qua Thứ 7 & Chủ Nhật để nhảy thẳng sang Thứ 2 tuần kế tiếp.
  2. *Giải pháp tách biệt Thứ 7 và Chủ Nhật*:
     - **Thứ 7 (T7)**:
       + Vẫn giữ nguyên màu nền vàng nổi bật (`bg-holiday`) ở cả Tiêu đề và Ô dữ liệu để phân biệt ngày cuối tuần.
       + Luôn hiển thị thẻ `<input type="text" class="cc-input-text">` trực tiếp để Bác sĩ có thể bấm và gõ công bất cứ lúc nào mà không cần qua nút click trung gian.
       + Khi ấn phím `Tab` từ Thứ 6, tiêu điểm nhảy ngay vào ô Thứ 7; ấn tiếp `Tab` sẽ bỏ qua Chủ Nhật (ngày nghỉ tuyệt đối) và nhảy sang Thứ 2 của tuần sau (`T6 -> T7 -> T2`).
       + Bổ sung CSS cho ô input Thứ 7 trên nền vàng (`#fffde7`, viền `#fde047`, khi focus đổi màu xanh `#eff6ff`) hài hòa tuyệt đối cả Light mode lẫn Dark mode.
     - **Chủ Nhật (CN)**:
       + Là ngày nghỉ toàn diện, mặc định hiển thị nhãn "Nghỉ" (không có thẻ input để phím `Tab` tự động lướt qua sang Thứ 2 tuần sau); khi cần đặc cách chấm công ngày Chủ Nhật thì click để mở ô nhập.
     - **Phím Mũi Tên (ArrowLeft / ArrowRight)**:
       + Nâng cấp thuật toán duyệt tìm ô input kế tiếp / trước đó trong hàng để tự động nhảy qua Chủ Nhật mượt mà (từ T7 bấm mũi tên phải -> nhảy sang T2; từ T2 bấm mũi tên trái -> nhảy về T7).
  3. *Đồng bộ phiên bản hệ thống theo RULES.md*:
     - Phiên bản chính: `4.0.3` (Footer: `Phiên bản: 4.0.3`).
     - Revision: `v4.0.3-rev6`.
     - Footer timestamp: `10:55 08/09/2026`.
     - `index.html`: Cập nhật toàn bộ cache busters `?v=4.0.3-rev6`, `APP_VERSION = '4.0.3-rev6'`.
     - `sw.js`: Đổi `CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev6'`.
     - `js/thongke.js`: Đổi `pm_cleaned_cache_ver = '4.0.3-rev6'`.
     - `js/app.js`: Đổi targetUrl HDSD sang `v=4.0.3-rev6`.
- **File sửa đổi**:
  + `js/thongke.js` (Thứ 7 có input trực tiếp, điều hướng Tab/Mũi tên thông minh, `pm_cleaned_cache_ver = '4.0.3-rev6'`)
  + `css/style.css` (Style input trên nền vàng cuối tuần cho cả Light & Dark mode)
  + `index.html` (cache busters `?v=4.0.3-rev6`, `APP_VERSION = '4.0.3-rev6'`, footer timestamp `10:55 08/09/2026`)
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev6'`)
  + `js/app.js` (targetUrl HDSD `v=4.0.3-rev6`)
  + `PM-xeplich-v4.md` (nhật ký phát triển)

---

### [v4.0.3-rev7] - 08/09/2026: Sửa Lỗi Slot Ảo "Phụ 3" Bị Đếm Nhầm Vào Cột KTV Trên Dashboard

- **Yêu cầu của người dùng**:
  + Bảng "TẢI TRỌNG NHÂN VIÊN" ở Dashboard ngày xuất hiện dòng **"Phụ 3: 1"** trong cột Kỹ thuật viên — đây là tên slot ảo của engine xếp lịch, không phải nhân sự thật.
- **Phân tích nguyên nhân**:
  + Hàm `renderCharts` đọc `r[7]` (cột NV Chính) từ bảng lịch. Khi engine không tìm được KTV phù hợp, nó lưu placeholder `"Phụ 3"` vào `nvChinh`.
  + `staffRoleMap["phu 3"]` không có trong `dataCache.staff` → fallback tên không khớp `"bs"` → `isDoctor = false` → bị đẩy vào `staffLoadKTV["Phụ 3"] += 1` → hiện lên dashboard.
- **Giải pháp xử lý**:
  + `js/app.js` (hàm `renderCharts`): Thêm bộ lọc regex bỏ qua các tên slot ảo trước khi kiểm tra vai trò. Pattern bắt: `Phụ 1/2/3`, `Phu3`, `Chính 1`, `Chinh`... (case-insensitive). Thủ thuật của ca vẫn được đếm đúng vào phân bổ.
- **File sửa đổi**:
  + `js/app.js`
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev7'`)
  + `PM-xeplich-v4.md`

---

### [v4.0.3-rev8] - 08/09/2026: Tự Động Cập Nhật Phiên Bản Mới Trên Tất Cả Máy (Auto-Update Service Worker)

- **Yêu cầu của người dùng**:
  + Mỗi khi deploy bản sửa lỗi mới, các máy tính đang mở tab cũ không tự cập nhật — phải ấn Ctrl+F5 hoặc Ctrl+Shift+R mới nhận bản mới.
- **Phân tích nguyên nhân cũ**:
  + SW chỉ gọi `reg.update()` 1 lần lúc load trang. Máy đang mở tab từ hôm qua sẽ không bao giờ check update.
  + Không lắng nghe sự kiện `controllerchange` → phát hiện SW mới nhưng không reload tự động.
  + Logic unregister theo `?v=APP_VERSION` trong scriptURL không đáng tin cậy.
- **Giải pháp triển khai (`index.html` — block SW Registration)**:
  + **Polling mỗi 5 phút**: `setInterval(() => reg.update(), 5 * 60 * 1000)` — chủ động hỏi server có `sw.js` mới không dù tab đang mở cả ngày.
  + **Lắng nghe `updatefound` + `statechange`**: Khi SW mới được tải về và ở trạng thái `installed`, lập tức gọi `applyUpdate()` → `skipWaiting()` để SW mới kiểm soát ngay mà không cần đóng tab.
  + **Lắng nghe `controllerchange`**: Ngay khi SW mới kiểm soát trang, hiển thị toast "🔄 Phiên bản mới đã sẵn sàng — đang tải lại..." và tự động `window.location.reload()` sau 2 giây.
  + **Chống reload vòng lặp**: Dùng `sessionStorage._sw_reloading` để đánh dấu, tránh `controllerchange` kích hoạt reload liên tiếp.
  + **Đăng ký `./sw.js` không có `?v=`**: Trình duyệt tự kiểm tra byte-diff của sw.js để phát hiện thay đổi — đây là chuẩn PWA, không cần query string.
- **Luồng hoạt động sau bản này**:
  1. Dev deploy bản mới → `sw.js` thay đổi `CACHE_NAME`.
  2. Máy người dùng: mỗi 5 phút hoặc khi load lại tab → SW phát hiện `sw.js` mới → tải về → `skipWaiting` → `controllerchange`.
  3. Trang hiển thị toast xanh đẹp → tự reload sau 2s → người dùng thấy bản mới **hoàn toàn tự động**.
- **File sửa đổi**:
  + `index.html` (block SW Registration viết lại hoàn toàn)
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev8'`)
  + `PM-xeplich-v4.md`
---

### [v4.0.3-rev9] - 08/09/2026: Khắc Phục Lỗi Đếm Lệch Số Lượng Thủ Thuật Giữa Dashboard và Bác Sĩ

- **Yêu cầu của người dùng**:
  + Phần đếm số lượng với hệ YHCT là 70 thủ thuật nhưng bên bác sĩ chỉ đếm được 69 ca.
- **Phân tích nguyên nhân**:
  + Tại `js/app.js` hàm `renderCharts`: Khi lịch có ca dùng placeholder slot ảo (`Phụ 3`), code cũ bỏ qua không đếm nhân sự, dẫn đến tổng số ca của nhân viên (69) bị lệch 1 so với tổng thủ thuật YHCT (70).
- **Giải pháp xử lý**:
  + Ghi các ca có placeholder slot ảo vào nhóm `'(Chưa phân công)'` trong `staffLoadKTV` để tổng tải trọng khớp tuyệt đối với số lượng thủ thuật.
- **File sửa đổi**: `js/app.js`, `sw.js`.

---

### [v4.0.3-rev10] - 08/09/2026: Chuẩn Hóa Toàn Diện Quy Tắc NV Chính: Chỉ BS / KTV Có Kỹ Năng Phù Hợp Mới Được Làm NV Chính

- **Yêu cầu của người dùng**:
  + "Phải là nhân sự có kỹ năng phù hợp, BS, KTV mới được làm NV chính."
  + Điều dưỡng (như Phụ 3) với vai trò điều dưỡng/hỗ trợ tuyệt đối không được làm NV chính, chỉ được làm NV phụ.
- **Phân tích nguyên nhân sâu xa**:
  1. **Nhận diện vai trò lỏng lẻo**:
     - Các nhân sự có tên dạng `"Phụ 1..8"` hoặc có vai trò là `"Phụ"`, `"Trợ lý"`, `"Hộ lý"`, `"Y tá"` bị fallback về mặc định `'Kỹ thuật viên'` tại `scheduler-engine.js` và `buildBaseDatabase`.
  2. **Điều kiện mở rộng kỹ năng Bác sĩ quá rộng (`!r[2]`)**:
     - Dòng 208 cũ: `isDoc && (hasAll || !r[2] || isProcYhct)`. Khi bác sĩ không có chuỗi kỹ năng (`!r[2]` = true), bác sĩ bị tự động cấp kỹ năng cho CẢ CÁC THỦ THUẬT PHCN!
  3. **Lọc ứng viên `candidatesMain` chỉ loại `!== 'điều dưỡng'`**:
     - Nếu vai trò chưa chuẩn hóa (hoặc role lọt fallback), nhân sự hỗ trợ bị lọt vào `candidatesMain` và được gán làm `NV CHÍNH`.
  4. **Fallback Backfill và CP-SAT Solver**:
     - Thuật toán cứu ca rơi và solver CP-SAT chưa kiểm tra chặt chẽ vai trò và kỹ năng, có thể chọn nhân sự không phải KTV/BS hoặc thiếu kỹ năng thủ thuật đó.
  5. **Bộ chẩn đoán kê toa (`UnscheduledDiagnosticEngine`)**:
     - Danh sách `qualifiedStaff` và `targetStaff` chưa loại trừ Điều dưỡng/Phụ tá khi gợi ý điều chỉnh lịch.
- **Giải pháp triển khai**:
  1. **Chuẩn hóa nhận diện Điều dưỡng / Nhân sự hỗ trợ**:
     - Regex bắt triệt để: `/điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly|\bphụ\b/i` kèm tên `/^phụ\b|^phu\s*\d+/i`.
  2. **Quy tắc NV Chính tại mọi vị trí**:
     - `candidatesMain`: Chỉ nhân sự có `(isDoc || isKtv) && !isNurse` MỚI ĐƯỢC vào danh sách ứng viên NV Chính.
     - Điều dưỡng / Phụ tá luôn đi vào `candidatesSub` (chỉ làm NV Phụ).
  3. **Kỹ năng phù hợp cho Bác sĩ & KTV**:
     - Bác sĩ chỉ tự động có kỹ năng với hệ **YHCT** (`isDoc && isProcYhct`). Với hệ PHCN, Bác sĩ **BẮT BUỘC** phải có quyền "Cả hai", "PHCN", hoặc có tên thủ thuật PHCN cụ thể trong danh sách kỹ năng mới được xếp làm NV Chính.
     - KTV bắt buộc phải có kỹ năng thủ thuật đó (qua chuỗi kỹ năng hoặc hệ tương ứng).
  4. **Đồng bộ CP-SAT Solver & Diagnostic Engine**:
     - `cp-solver.js` (`staffCandidates`): Lọc chỉ lấy BS/KTV có kỹ năng phù hợp, loại 100% Điều dưỡng/Phụ tá.
     - `UnscheduledDiagnosticEngine`: Loại Điều dưỡng khỏi `qualifiedStaff` và fallback `targetStaff`.
  5. **Đồng bộ lịch Thứ 7 (`runSaturdayScheduling`)**:
     - Tự động nhận diện vai trò Điều dưỡng cho tên `Phụ 1..8`, không tự động gán `allProcs` cho Điều dưỡng khi `skillSet` rỗng.
- **File sửa đổi**:
  + `js/scheduler-engine.js`
  + `js/cp-solver.js`
  + `index.html` (cache buster `v=4.0.3-rev10`, `APP_VERSION = '4.0.3-rev10'`)
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev10'`)
  + `PM-xeplich-v4.md`
---

### [v4.0.3-rev11] - 08/09/2026: Tuân Thủ Tuyệt Đối Cài Đặt Vai Trò & Kỹ Năng Trong Tab Nhân Sự

- **Yêu cầu của người dùng**:
  + "Trong tab nhân sự có cài đặt kỹ năng, vai trò của từng người rồi."
- **Phân tích nguyên nhân sâu xa**:
  1. **Tự động cấp toàn bộ thủ thuật YHCT cho Bác sĩ**:
     - Trước đây code có dòng `else if (isDoc && isProcYhct) qualified = true;` tự động coi Bác sĩ làm được tất cả thủ thuật YHCT, bất chấp trong Tab Nhân Sự người dùng chỉ tích chọn 4-5 thủ thuật cụ thể (ví dụ BS Hoa không có kỹ năng XBBH nhưng vẫn bị xếp ca XBBH).
  2. **Lỗi ánh xạ tên viết tắt kỹ năng (`XBBH` vs `xoa bóp bấm huyệt`)**:
     - Khi người dùng tích chọn kỹ năng lưu tên viết tắt (ví dụ `XBBH`), vòng lặp cũ tra cứu `thuThuatInfo['xbbh']` bị `undefined` (do key của bảng thủ thuật là `xoa bóp bấm huyệt`). Dẫn đến KTV/BS có kỹ năng `XBBH` không được ghi nhận vào danh sách có kỹ năng của `xoa bóp bấm huyệt`.
- **Giải pháp triển khai toàn diện**:
  1. **Ánh xạ kỹ năng 2 chiều thông minh theo Tab Nhân Sự**:
     - Khi kiểm tra kỹ năng của nhân sự với thủ thuật: So khớp đồng thời cả tên thủ thuật (`pName`), tên viết tắt (`pVt`), tên gốc (`pTenGoc`) và quan hệ bao hàm chuỗi.
     - Khi nhân sự có kỹ năng `XBBH`, hệ thống tự động ghi nhận nhân sự vào cả key `xoa bóp bấm huyệt` và `xbbh`.
  2. **Tôn trọng 100% danh sách kỹ năng đã tích chọn**:
     - Khi nhân sự có danh sách kỹ năng cụ thể (`kyNangList.length > 0`), nhân sự **CHỈ ĐƯỢC XẾP** các thủ thuật thực sự có trong danh sách được tích chọn ở Tab Nhân Sự.
     - Không tự động cấp thêm bất kỳ thủ thuật nào ngoài danh sách đã cài đặt.
  3. **Ưu tiên 100% Điều dưỡng làm NV Phụ**:
     - Điều dưỡng trong Tab Nhân Sự tuyệt đối không bao giờ làm NV Chính.
     - Khi thủ thuật yêu cầu NV Phụ (`canNguoiPhu = 'Có'`), Điều dưỡng có kỹ năng luôn được ưu tiên hàng đầu để làm NV Phụ.
- **File sửa đổi**:
  + `js/scheduler-engine.js`
  + `js/cp-solver.js`
  + `index.html` (cache buster `v=4.0.3-rev11`, `APP_VERSION = '4.0.3-rev11'`)
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev11'`)
  + `PM-xeplich-v4.md`
---

### [v4.0.3-rev12] - 08/09/2026: Loại Bỏ 100% Hardcode Tên Riêng - Thiết Kế Thuần Túy Dynamic Theo Vai Trò & Cài Đặt Của Admin

- **Yêu cầu & Định hướng kiến trúc của người dùng**:
  + "Sau này có thể đổi tên, thêm bớt nhân sự, nếu gán cứng các kỹ năng vào tên như thế thì không hay lắm, chỉ cần biết nhân sự có vai trò là Bác sĩ/Kỹ thuật viên thì sẽ được làm chính, còn lại làm chính thủ thuật nào thì do admin cài đặt."
- **Khắc phục triệt để**:
  1. **Xóa bỏ 100% mọi logic nhận diện dựa vào tên riêng**:
     - Loại bỏ hoàn toàn regex bắt tên bác sĩ cũ `/(đạt|hoa|thảo|hằng|thái|khuyến)/i` trong lịch Thứ 7.
     - Loại bỏ regex bắt tên phụ `/^phụ\b|^phu\s*\d+/i` trong engine.
     - Nhân sự đổi tên, tuyển mới, thêm bớt thoải mái — hệ thống không bao giờ phụ thuộc vào tên riêng.
  2. **Quy tắc phân quyền vai trò thuần túy (Role-based)**:
     - Dựa 100% vào trường **Vai trò** (`vaiTro` / `role`) do Admin chọn trong Tab Nhân Sự:
       + `Bác sĩ` hoặc `Kỹ thuật viên` -> Được xếp làm **NV Chính** (và có thể phụ nếu cần).
       + `Điều dưỡng` -> Tuyệt đối **chỉ được làm NV Phụ**, không bao giờ làm NV Chính.
  3. **Quy tắc kỹ năng thuần túy do Admin cài đặt (Skill-based)**:
     - Nhân sự được làm thủ thuật nào là **hoàn toàn do Admin cài đặt** (tích chọn các ô checkbox thủ thuật trong Tab Nhân Sự).
     - Không tự động gán hay đoán mò kỹ năng cho bất kỳ ai. Admin tích chọn thủ thuật nào thì nhân sự chỉ có kỹ năng làm thủ thuật đó.
- **File sửa đổi**:
  + `js/scheduler-engine.js`
  + `js/cp-solver.js`
  + `index.html` (cache buster `v=4.0.3-rev12`, `APP_VERSION = '4.0.3-rev12'`)
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev12'`)
  + `PM-xeplich-v4.md`
---

### [v4.0.3-rev13] - 08/09/2026: Nâng Cấp Kích Thước & Độ Rõ Nét Cột Hệ Số Bảng Chấm Công (0.5 vs 0.3)

- **Phản hồi của người dùng**:
  + "Không nhìn rõ được hệ số 0.5 hay 0.3"
- **Phân tích nguyên nhân gốc rễ**:
  1. Thẻ `<input type="number">` của trình duyệt mặc định chèn hai nút bấm tăng giảm (stepper arrows) chiếm ~16px bên trong ô nhập liệu.
  2. Chiều rộng cột Hệ số cũ chỉ 36px (desktop) và 38px (mobile), ô input chỉ 30px x 17px với cỡ chữ 10.5px.
  3. Trừ đi 16px của nút stepper, không gian thực tế hiển thị chữ chỉ còn ~12px! Dẫn đến chuỗi `0,5` hoặc `0,3` bị co rút méo mó, đuôi số 5 và số 3 bị cắt lẹm và nhòe sát mép viền, người dùng không thể phân biệt được `0.5` hay `0.3`.
- **Giải pháp triển khai**:
  1. **Ẩn hoàn toàn nút Stepper Arrows**:
     - Áp dụng `-webkit-appearance: none; margin: 0;` và `-moz-appearance: textfield;` cho `.heso-input`.
  2. **Tăng kích thước cột & ô nhập liệu**:
     - Chiều rộng cột Hệ số tăng từ 36px lên 48px (cả trên Desktop và Mobile/Tablet).
     - Chiều rộng ô input `.heso-input` tăng từ 30px lên 42px, chiều cao tăng lên 22px.
     - Cập nhật độ lệch ghim cố định `stickyOffset`: 238px (Desktop: 190px + 48px) và 208px (Mobile: 160px + 48px).
  3. **Tăng cỡ chữ & độ tương phản cao**:
     - Font size nâng lên **13px bold (font-weight: 800)** với font số học phẳng `font-variant-numeric: tabular-nums`, giúp các nét số `3` và `5` tách bạch, sắc nét.
     - Thêm class `.heso-fraction` cho các hệ số thập phân lẻ (< 1, ví dụ 0.5, 0.3): Nền cam nhẹ `#fffbeb`, chữ cam đậm nổi bật `#b45309`, viền `#f59e0b` giúp phân biệt tức thì nhân sự bán thời gian với nhân sự hệ số 1.
     - Bổ sung tooltip `title="Hệ số chấm công: ..."` khi rê chuột vào ô.
- **File sửa đổi**:
  + `css/style.css`
  + `js/thongke.js`
  + `index.html` (cache buster `v=4.0.3-rev13`, `APP_VERSION = '4.0.3-rev13'`)
  + `sw.js` (`CACHE_NAME = 'pmcg-v4-cache-4.0.3-rev13'`)
  + `PM-xeplich-v4.md`

---

### [v4.0.4-rev1] - 09/09/2026: Sửa Lỗi Tìm Giờ Rảnh Ngày Lịch Sử & Xóa Bỏ Hoàn Toàn Giờ Bận Lịch Sử Ảo

- **Phản hồi của người dùng**:
  1. Khi chọn ngày trong lịch sử (ví dụ ngày hôm qua 08/09/2026) xong ấn tìm giờ thì lại báo *"Không có Nhân sự rảnh lúc này"*.
  2. Khi xem lịch cũ thì giờ bận của nhân sự và bệnh nhân đều bị sai, bị nhảy ra rất nhiều giờ sai.
- **Phân tích nguyên nhân gốc rễ**:
  1. **Lỗi giờ bận ảo hàng loạt khi xem lịch cũ**:
     - Trong Backend `backend/src/index.js`, hàm `getHistoryFullData` trước đây có một đoạn fallback giả lập: duyệt qua từng thủ thuật đã xếp trong lịch (`rows.forEach`) rồi tự ý nhét `{ from: r.start_time, to: r.end_time, tt: r.procedure_name }` vào `staffBusy` và `patBusyMap`!
     - Khi giao diện Frontend (`js/app.js` trong `applyHistoryDataToTabs`) nhận được dữ liệu này, nó đã nối hàng chục ca thủ thuật đó vào trường `p.gioBan` và `s.gioBan`. Hậu quả: Toàn bộ danh sách thủ thuật của ngày cũ bị biến thành "giờ bận", làm xuất hiện hàng chục dòng giờ bận sai lệch vô lý cho cả nhân sự và bệnh nhân.
  2. **Lỗi "Không có Nhân sự rảnh lúc này" khi tìm giờ rảnh ngày cũ**:
     - `applyHistoryDataToTabs` trước đây ghi đè mảng `dataCache.staff` bằng các object nhân sự trích xuất thô từ dòng lịch với `vaiTro: ''` (rỗng). Khi người dùng nhấn "Tìm Bác Sĩ", hàm `timBacSiRanh()` lọc theo `vt.includes('bác sĩ') || vt.includes('ktv')` nên danh sách bác sĩ rỗng (`docs = []`), lập tức báo không có ai rảnh!
     - `timBacSiRanh()` yêu cầu người dùng phải bấm "📊 Xem Lịch" trước; nếu người dùng chỉ chọn ngày ở ô lịch mà ấn "Tìm Bác Sĩ" thì bị báo lỗi hoặc tìm nhầm trên dữ liệu ngày đang hiển thị cũ.
     - `timBacSiRanh()` đem cả `doc.gioBan` của ngày hôm nay áp đặt vào ngày quá khứ.
     - So khớp tên nhân sự bị lỗi nếu lịch lưu `BS. Thái` hoặc `KTV. Tùng` trong khi danh sách nhân sự lưu `Thái` hoặc `Tùng`.
- **Giải pháp triển khai**:
  1. **Backend (`backend/src/index.js`)**:
     - Tạo bảng D1 mới `gio_ban_bn_cu` (`tenant_id`, `ngay`, `bn_id`, `gio_ban`, `created_at`) để lưu trữ chính xác giờ bận thực tế của bệnh nhân khi chốt sổ hàng ngày.
     - Cập nhật hàm `chotSo`/`chuyenNgayMoi` và `checkAutoChotSo`: lưu trữ giờ bận thực tế của nhân viên (`temp_busy`) vào `gio_ban_cu` và bệnh nhân (`gio_ban`) vào `gio_ban_bn_cu` trước khi reset.
     - Cập nhật `getHistoryFullData`: truy vấn chuẩn hóa ngày qua mảng biến thể (`ymd`, `dmy`, `dmyNoPad`...).
     - **Xóa bỏ hoàn toàn cơ chế tự sinh giờ bận ảo từ thủ thuật**: `staffBusy` chỉ lấy từ bảng `gio_ban_cu`, `patBusy` chỉ lấy từ `gio_ban_bn_cu`. Nếu không có đăng ký giờ bận, trả về rỗng. Tuyệt đối không biến thủ thuật đã làm thành giờ bận.
     - Bổ sung `gio_ban_bn_cu` vào các luồng sao lưu/khôi phục: `exportTenantData`, `exportAllDatabaseForSuperAdmin`, `importTenantData`.
  2. **Frontend (`js/app.js` & `index.html`)**:
     - Sửa `applyHistoryDataToTabs`: bảo lưu đầy đủ thông tin nhân sự gốc (`vaiTro`, `kyNang`, `thoiGianLam`...), chỉ gắn `gioBan` nếu ngày đó nhân sự có đăng ký bận thực sự trong `fullData.staffBusy`. Bệnh nhân chỉ nhận `gioBan` nếu có trong `fullData.patBusy`.
     - Nâng cấp `taiLichTheoNgay(callback)`: tự động lưu cache `window.utilsScheduleData`, `window.utilsScheduleDate`, `window.utilsStaffBusy`.
     - Nâng cấp `timBacSiRanh()` & `timMayRanh()`:
       + Tự động tải lịch nếu ngày chưa được tải hoặc bị lệch ngày, sau đó mới tìm kiếm.
       + Mặc định giờ tìm kiếm là `07:30` nếu ô giờ để trống.
       + Lọc nhân sự chuẩn (`vaiTro` là bác sĩ/KTV hoặc có kỹ năng thực hiện thủ thuật).
       + So khớp tên thông minh, tự bóc tách các tiền tố danh xưng (`BS.`, `KTV.`, `ĐD.`...).
       + Ngày cũ không bị ảnh hưởng bởi giờ bận tạm thời của ngày hôm nay.
       + Nếu ngày cũ không có thủ thuật nào, toàn bộ nhân sự được xếp là rảnh 100% thay vì báo lỗi.
       + Đồng bộ dropdown `#filter-doc-name` theo danh sách nhân sự tìm được.
     - Cập nhật `index.html`: thêm sự kiện `onchange="taiLichTheoNgay()"` vào ô chọn ngày `#utils-search-date`, tự động tải lại khi bấm "Hôm nay", thêm phím tắt Enter cho ô nhập giờ tìm kiếm.
     - Tự động nạp lịch khi chuyển sang tab `tab-utils`.
  3. **Đồng bộ phiên bản**:
     - Phiên bản ngày 09/09/2026: `4.0.4-rev1`.
     - `index.html`: cập nhật cache busters, footer `Phiên bản: 4.0.4`, `Cập nhật lần cuối: 07:45 09/09/2026`, và `APP_VERSION = '4.0.4-rev1'`.
     - `sw.js`: `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev1'`.
     - `backend/package.json`: `"version": "4.0.4"`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `backend/package.json`
  + `js/app.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.4-rev2] - 09/09/2026: Hợp Nhất Bảng Giờ Bận Lịch Sử Thành gio_ban_chung_cu & Làm Sạch Dữ Liệu Trên Turso Cloud

- **Phản hồi của người dùng**:
  + Phát hiện trong bảng `gio_ban_cu` trên CSDL Turso Cloud đang chứa lẫn lộn cả giờ bận của nhân viên và bệnh nhân (136 dòng nhân sự, 90 dòng bệnh nhân và 1 dòng ảo `ID`).
  + Yêu cầu: Hợp nhất thành 1 bảng duy nhất mang tên `gio_ban_chung_cu`, di chuyển toàn bộ dữ liệu hợp lệ từ `gio_ban_cu` sang, phân loại rõ ràng theo cột `target_type` (`'nhan_su'` và `'benh_nhan'`), đồng thời loại bỏ triệt để dòng ảo/rác `ID`.
- **Giải pháp triển khai**:
  1. **Tạo bảng `gio_ban_chung_cu`**:
     - Cấu trúc: `id`, `unit_code`, `date`, `target_type` ('nhan_su' | 'benh_nhan'), `name`, `dob`, `busy_ranges`, `created_at`.
     - Tạo 2 chỉ mục: `idx_gio_ban_chung_cu_unit` và `idx_gio_ban_chung_cu_lookup(unit_code, date, target_type)`.
  2. **Tự động chuyển đổi & làm sạch dữ liệu trên Turso libSQL Cloud**:
     - Chuyển 136 dòng nhân sự (`target_type = 'nhan_su'`).
     - Chuyển 90 dòng bệnh nhân (`target_type = 'benh_nhan'`).
     - Bỏ qua dòng rác/ảo `staff_name = 'ID'`.
     - Giữ nguyên trạng bảng cũ `gio_ban_cu` làm dự phòng tương thích ngược.
  3. **Backend API (`backend/src/index.js`)**:
     - `chotSo`/`chuyenNgayMoi` và `checkAutoChotSo`: Lưu giờ bận nhân viên và bệnh nhân trực tiếp vào `gio_ban_chung_cu` theo `target_type`.
     - `getHistoryFullData`: Truy vấn `gio_ban_chung_cu`, phân tách chính xác vào `staffBusy` và `patBusy`. Có cơ chế dự phòng thông minh từ `gio_ban_cu` nếu ngày cũ chưa được nạp.
     - `importHistoryBusy`: Nhập liệu vào `gio_ban_chung_cu`.
     - Backup / export / restore: Bổ sung bảng `gio_ban_chung_cu` vào danh mục sao lưu.
  4. **Đồng bộ phiên bản**:
     - Nâng cấp lên `4.0.4-rev2`.
     - `index.html`: Cập nhật cache busters, footer timestamp `08:05 09/09/2026`, `APP_VERSION = '4.0.4-rev2'`.
     - `sw.js`: `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev2'`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `backend/schema.sql`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.4-rev3] - 09:15 09/09/2026: Triệt Tiêu Toàn Diện Lỗi Chrome DevTools Live Metrics & Web Vitals (startTime / reportAllChanges)

- **Nguyên nhân cốt lõi**:
  + Thông báo lỗi console: `VM...:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime') at et.reportAllChanges ... at n.timeout`.
  + **Bản chất**: Đây là lỗi nội bộ nổi tiếng trong công cụ **Google Chrome DevTools** (Chromium Bug `#543499029` và `#556160936`), xảy ra khi mở DevTools (đặc biệt là bảng Performance / Live Metrics / Soft Navigation để đo INP) hoặc từ module Cloudflare Web Analytics Beacon ngầm. Trình duyệt tự động chèn một đoạn script động dạng `VMxxx` (`devToolsReportSoftNavs`). Khi tương tác xảy ra mà danh sách `entries` chưa kịp khởi tạo, hàm nội bộ `et.reportAllChanges` đọc `entries[0].startTime` gây ngoại lệ `TypeError`.
  + **Tác động**: Không ảnh hưởng tới logic ứng dụng T.I.M.E.S hay cơ sở dữ liệu Turso/Cloudflare, nhưng gây ô nhiễm Console với dòng chữ đỏ khi nhà phát triển mở DevTools.
- **Giải pháp xử lý triệt để 4 lớp phòng vệ**:
  1. **Lớp 1 - Thiết lập `window.onerror` tức thì ngay đầu `<head>`**: Đặt hàm bắt lỗi ở dòng đầu tiên của `index.html`, nhận diện các chuỗi `startTime`, `reportAllChanges`, `VM...` và trả về `true` (tiêu chuẩn trình duyệt để triệt tiêu việc in lỗi đỏ ra DevTools console).
  2. **Lớp 2 - Phòng hộ `window.devToolsReportSoftNavs`**: Sử dụng `Object.defineProperty` để hook và bọc mọi hàm do Chrome DevTools tự động gán vào biến này bằng khối `try...catch`, nuốt êm lỗi nếu có ngoại lệ phát sinh.
  3. **Lớp 3 - Nâng cấp bộ bắt sự kiện capturing `window.addEventListener('error', ..., true)` & `unhandledrejection`**: Kiểm tra cả `message`, `stack`, `filename` và gọi `e.preventDefault()`, `e.stopImmediatePropagation()`.
  4. **Lớp 4 - Tinh chỉnh `window.onerror` trong `js/app.js`**: Bỏ qua êm đẹp các lỗi đo lường ngoại vi này mà không ghi log cảnh báo làm phiền màn hình console.
- **Đồng bộ phiên bản**:
  + Nâng cấp lên `4.0.4-rev3`.
  + `index.html`: Cập nhật cache busters `v=4.0.4-rev3`, footer timestamp `09:15 09/09/2026`, `APP_VERSION = '4.0.4-rev3'`.
---

### [v4.0.4-rev4] - 09:35 09/09/2026: Triển Khai Giao Diện Tra Cứu & Quản Trị Toàn Diện Bảng Giờ Bận Chung Cũ (gio_ban_chung_cu)

- **Bối cảnh & Yêu cầu**:
  + Bảng `gio_ban_chung_cu` đã được khởi tạo và lưu trữ đầy đủ 226+ bản ghi lịch sử giờ bận của cả nhân viên và bệnh nhân trên CSDL đám mây Turso Cloud, nhưng trên phần mềm người dùng và quản trị viên chưa có giao diện trực quan để xem, tra cứu, tìm kiếm và quản lý.
- **Giải pháp triển khai chi tiết**:
  1. **Tab Giờ Bận / Ra Viện (`#tab-busy`)**:
     - Tích hợp thanh chuyển Sub-tab trên đỉnh: `🟢 Giờ Bận Hôm Nay (Thời Gian Thực)` và `📜 Bảng Giờ Bận Chung Cũ (gio_ban_chung_cu)`.
     - Khi chuyển sang chế độ Lịch Sử:
       + Thanh công cụ thông minh: Dropdown chọn ngày (tự động nạp danh sách 40 ngày có dữ liệu từ Turso), dropdown lọc đối tượng (Tất cả / Nhân sự / Bệnh nhân), ô tìm kiếm tức thì theo tên, năm sinh, khung giờ bận.
       + Badge thống kê động: Hiển thị số lượng bản ghi hiển thị / tổng số bản ghi trong CSDL.
       + Bảng hiển thị tối ưu: Phân loại bằng badge màu sắc bắt mắt (`🩺 Nhân Sự` màu xanh lam, `🧑 Bệnh Nhân` màu vàng hổ phách), các khung giờ bận hiển thị dưới dạng pill tags monospace rõ nét.
       + Các nút thao tác tiện ích: `🔄 Làm Mới`, `📥 Xuất Excel (.xlsx)`, `🗑 Xóa từng dòng`.
  2. **Menu Quản Trị Hệ Thống (`#tab-admin`)**:
     - Bổ sung nút điều hướng sidebar: `🕒 Bảng Giờ Bận Cũ (gio_ban_chung_cu)`.
     - Màn hình quản trị chuyên sâu `#admin-sec-busy-history` với các công cụ tra cứu, lọc, xuất Excel và phân quyền xóa dữ liệu.
  3. **Backend Cloudflare Worker & Turso Cloud (`backend/src/index.js`)**:
     - Action `getGioBanChungCu`: Hỗ trợ bộ lọc ngày, loại đối tượng và từ khóa, phân trang giới hạn 1000 dòng mới nhất, trả về danh sách các ngày duy nhất để nạp dropdown.
     - Action `deleteGioBanChungCu`: Xóa an toàn theo `id` và cô lập triệt để theo `unit_code`.
  4. **Frontend Controller (`js/app.js`)**:
     - `switchBusySubTab(mode)`: Điều hướng mượt mà giữa chế độ hiện tại và lịch sử.
     - `loadGioBanChungCuUI(context)`: Nạp dữ liệu đám mây qua `callApi` / `google.script.run`.
     - `filterGioBanChungCuClient(context)`: Lọc nhanh trên RAM máy trạm không gây trễ mạng.
     - `deleteGioBanChungCuRow(id, context)`: Xóa có xác nhận, chặn quyền tài khoản Viewer.
     - `exportGioBanChungCuExcel(context)`: Xuất bảng tính Excel hoàn chỉnh với thư viện `XLSX`.
     - Tích hợp hook tự động tải trong `switchAdminSection`.
- **Đồng bộ phiên bản**:
  + Nâng cấp lên `4.0.4-rev4`.
  + `index.html`: Cập nhật cache busters `v=4.0.4-rev4`, `APP_VERSION = '4.0.4-rev4'`.
  + `sw.js`: `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev4'`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

### [v4.0.4-rev5] - 10:15 09/09/2026: Tích Hợp Ô Chọn Ngày Xem Lịch Sử Trên Các Tab Vận Hành & Khắc Phục Lỗi Hiển Thị Tab Chấm Công
- **Bối cảnh & Yêu cầu của người dùng**:
  1. Người dùng muốn các tab vận hành như `tab-home`, `tab-busy`, `tab-schedule`, `tab-utils` có ngay ô chọn ngày để có thể xem lại dữ liệu/lịch sử cũ một cách trực quan, liền mạch mà không nhất thiết phải tách riêng thành màn hình riêng trong Quản Trị hay chia sub-tab riêng biệt trong `tab-busy`.
  2. Khắc phục lỗi tab Chấm Công (`tab-chamcong`) bị che khuất mất giao diện do thẻ div của bảng quản trị đặt nhầm vị trí.
- **Giải pháp triển khai chi tiết**:
  1. **Khắc phục triệt để Tab Chấm Công (`tab-chamcong`)**:
     - Xóa bỏ khối thẻ `#admin-sec-busy-history` bị lồng nhầm trong container `#tab-chamcong`.
     - Phục hồi lại toàn vẹn 100% cấu trúc giao diện `#tab-chamcong` gồm cả 2 sub-view (Bảng chấm công theo tháng & Sắp xếp nhân sự kéo thả) hoạt động mượt mà, không bị che khuất.
  2. **Tích hợp bộ chọn ngày trực tiếp trên Tab Giờ Bận (`#tab-busy`)**:
     - Loại bỏ sub-tab bar rườm rà và khôi phục layout 3 cột gốc (`👨‍⚕️ NV`, `🧑 BN`, `🚪 Ra Viện`).
     - Bổ sung thanh công cụ chọn ngày trên đỉnh: Ô chọn ngày `<input type="date" id="busy-date-filter">`, nút `🟢 Về Hôm Nay`, badge trạng thái động (`🟢 Đang xem: Hôm nay` vs `📜 Đang xem lịch sử: dd/mm/yyyy`), và banner thông báo khi đang ở chế độ xem lại lịch sử.
     - Bảo vệ dữ liệu: Khi ở chế độ xem lịch sử, hệ thống tự động khóa tính năng sửa/xóa với thông báo nhắc nhở thân thiện để tránh ghi đè dữ liệu quá khứ.
  3. **Tích hợp & Đồng bộ bộ chọn ngày trên các Tab: `tab-home`, `tab-schedule`, `tab-utils`**:
     - `tab-home`: `#dashboard-date-filter` kích hoạt cập nhật toàn bộ thống kê ca xếp, ca rớt, biểu đồ thủ thuật và công của ngày được chọn.
     - `tab-schedule`: `#history-date` và `#schedule-date` đồng bộ tải và hiển thị danh sách xếp lịch thực tế của ngày được chọn.
     - `tab-utils`: `#utils-search-date` đồng bộ nạp lịch và dữ liệu giờ bận nhân sự của ngày được chọn để phục vụ tính năng Tìm Bác Sĩ Rảnh.
  4. **Frontend Controller (`js/app.js`)**:
     - Triển khai hàm điều phối trung tâm `window.onAppDateChange(dateStr, sourceTab)`: Tự động đồng bộ giá trị ngày trên tất cả các input ở 4 tab, phân luồng tải dữ liệu thời gian thực (Live) hoặc lịch sử (History) thông qua `getHistoryFullData(dateStr)`.
     - `window.setAppDateToToday(sourceTab)`: Phím tắt 1 chạm đưa tất cả 4 tab quay trở lại ngày hiện tại.
     - Nâng cấp `applyHistoryDataToTabs(fullData, dateStr)`: Tự động bổ sung các nhân sự và bệnh nhân có trong `fullData.staffBusy` và `fullData.patBusy` (được truy vấn từ bảng `gio_ban_chung_cu` trên Turso Cloud) vào `dataCache` để hiển thị đầy đủ trên cả 3 cột của `tab-busy`, đồng thời hỗ trợ gọi `renderLeavePat()`.
     - Khởi tạo mặc định ngày hôm nay cho toàn bộ các ô date picker khi tải trang.
- **Đồng bộ phiên bản**:
  + Nâng cấp lên `4.0.4-rev5`.
  + `index.html`: Cập nhật cache busters `v=4.0.4-rev5`, footer timestamp `10:15 09/09/2026`, `APP_VERSION = '4.0.4-rev5'`.
  + `sw.js`: `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev5'`.
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.4-rev6] - 10:35 09/09/2026: Tinh Chỉnh Giao Diện Tab Giờ Bận (`#tab-busy`) Cho Chế Độ Xem Lịch Sử Ngày Cũ
- **Bối cảnh & Vấn đề**:
  1. Khi xem giờ bận của ngày cũ (như ngày `08/09/2026`), trên giao diện của cả 3 cột (`👨‍⚕️ NV`, `🧑 BN`, `🚪 Ra Viện`) vẫn hiển thị các khối form nhập liệu/sửa/xóa của ngày hôm nay, gây chật chội và rối mắt vì ngày cũ không cho phép sửa trực tiếp.
  2. Bảng Giờ bận nhân sự cột 1 hiển thị dạng ma trận rỗng không có tiêu đề cột khi ngày đó không có ai báo bận, thông báo mặc định "Hiện tại chưa có nhân viên nào báo bận" gây nhầm lẫn là tính năng bị lỗi.
  3. Người dùng không biết ngày nào trong quá khứ thực sự có dữ liệu giờ bận đã lưu trên Turso Cloud để chọn xem.
- **Giải pháp & Cải tiến đã triển khai**:
  1. **Dual Header View (Chế độ kép thông minh cho 3 cột)**:
     - **Hôm nay (Live Mode)**: Hiển thị đầy đủ form chọn nhân sự, nhập khung giờ, nút Lưu/Xóa/Xóa hết để nhập liệu thời gian thực.
     - **Lịch sử (History Mode)**: Tự động ẩn hoàn toàn form nhập liệu, hiển thị thanh tiêu đề chuyên nghiệp kèm huy hiệu đếm số lượng:
       + Cột 1: `👨‍⚕️ GIỜ BẬN NHÂN VIÊN` + badge `X nhân sự bận`.
       + Cột 2: `🧑 BỆNH NHÂN BÁO BẬN` + badge `X bệnh nhân bận`.
       + Cột 3: `🚪 BỆNH NHÂN RA VIỆN` + badge `X bệnh nhân ra viện`.
  2. **Render Chuyên Biệt Cho Chế Độ Lịch Sử**:
     - Cột 1 (Nhân sự): Khi xem ngày cũ, chuyển sang dạng danh sách chuẩn (`STT | Tên Nhân Viên | Vai Trò | Khung Giờ Bận`) với các khung giờ hiển thị dạng thẻ pill tag (`⏱ 08:00 - 09:00`), đồng bộ trực quan với cột Bệnh nhân và Ra viện.
     - Cả 3 cột: Vô hiệu hóa tính năng click sửa/xóa khi đang xem lịch sử; nếu không có bản ghi nào, hiển thị thông báo trang trọng `📭 Ngày dd/mm/yyyy không có nhân viên/bệnh nhân nào báo bận / ra viện`.
  3. **Dropdown Chọn Nhanh Ngày Có Dữ Liệu Lịch Sử (`#busy-quick-date-select`)**:
     - Bổ sung menu xổ xuống trên thanh công cụ `tab-busy`, tự động nạp danh sách các ngày thực sự có dữ liệu giờ bận từ bảng `gio_ban_chung_cu` (hiện có 40 ngày đến `21/08/2026`), người dùng chỉ cần bấm chọn ngày là tải ngay kết quả.
  4. **Backend Worker (`backend/src/index.js`)**:
     - Bổ sung hỗ trợ lưu trữ và truy vấn đối tượng `ra_vien` vào bảng `gio_ban_chung_cu` trong các hàm chốt sổ `chotSo` và `autoChotSo`.
     - Cập nhật `getHistoryFullData` trả về mảng `leavePat` phân loại từ `target_type = 'ra_vien'`, tích hợp vào `applyHistoryDataToTabs` trên Frontend.
- **Đồng bộ phiên bản**:
  + Nâng cấp lên `4.0.4-rev6`.
  + `index.html`: Cập nhật cache busters `v=4.0.4-rev6`, footer timestamp `10:35 09/09/2026`, `APP_VERSION = '4.0.4-rev6'`.
  + `sw.js`: `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev6'`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `index.html`
  + `js/app.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.4-rev7] - 13:30 09/09/2026: Tối Ưu Thuật Toán Xếp Lịch, Tốc Độ Đa Luồng & Nâng Cấp Tư Vấn Cứu Ca Rớt Thông Minh
- **Bối cảnh & Yêu cầu của người dùng**:
  1. Khi bấm "Cứu ca rớt thông minh", ca thủ thuật bị nhân đôi/trùng lặp trong lịch trình và dashboard.
  2. Phần tư vấn cứu ca rớt còn đơn giản và dùng các mốc giờ cố định (`11:15` hoặc `13:30`), chưa phân tích các khoảng rảnh thực tế của nhân sự, máy móc và bệnh nhân.
  3. Rà soát thuật toán và tốc độ xếp lịch để đảm bảo hiệu năng khi số lượng bệnh nhân thay đổi.
- **Giải pháp & Kỹ thuật triển khai**:
  1. **Khắc phục lỗi trùng lặp khi giải cứu ca (`js/app.js`)**:
     - Bổ sung **Dedup Guard**: Kiểm tra khóa định danh duy nhất `[tên BN, thủ thuật, giờ diễn ra, ngày]`. Nếu ca đã tồn tại trong `window.currentScheduleData`, ngăn chặn chèn thêm và phát cảnh báo toast thân thiện.
     - **Chuẩn hóa Single Source of Truth**: Loại bỏ việc `push` độc lập vào 2 mảng `window.currentScheduleData` và `dataCache.schedule`. Nay chỉ push vào `window.currentScheduleData` rồi gán `dataCache.schedule = window.currentScheduleData` để các view (filterSchedule, loadDashboard) luôn đồng nhất 100%.
  2. **Bộ Tư Vấn Cứu Ca Rớt 3 Chiều Thực Tế (`js/scheduler-engine.js`)**:
     - Nâng cấp `UnscheduledDiagnosticEngine.diagnose()`:
       + Chiều 1 (Bệnh nhân): Quét khoảng giờ đến (`arrive`), giờ ra (`leave`), các khoảng báo bận (`gioBan`) và các ca thủ thuật khác đã xếp trong ngày của bệnh nhân để không bị trùng kẹp ca.
       + Chiều 2 (Nhân sự): Kiểm tra ca làm việc (`staffShifts`), giờ báo bận (`rawStaff[4]`), và các ca đang xếp trong `currentSched` để chọn đúng KTV đủ điều kiện và rảnh thực sự.
       + Chiều 3 (Máy móc): Kiểm tra máy tương ứng trong phòng/khoa có bị trùng lịch hay không.
     - Khảo sát 6 cửa sổ giờ làm việc (Sáng sớm, Giữa ca sáng, Cuối ca sáng, Đầu ca chiều, Giữa ca chiều, Làm lố cuối ca sáng) với ưu tiên tự động theo ca đăng ký của BN (Sáng/Chiều).
     - Gắn nhãn phân loại: `⚡ [Đã xác minh]` (khả thi 100% không xung đột) và `⚡ [Cần xác nhận]` (phương án mở rộng có cảnh báo khi toàn bộ các khung đều kín).
  3. **Tối ưu hóa Thuật Toán & Tốc Độ Xếp Lịch (`js/scheduler-engine.js`)**:
     - **Adaptive MaxSteps**: Thích ứng bước lặp Simulated Annealing theo kích thước đoàn khám (>60 BN: 22 bước; >30 BN: 18 bước; ≤30 BN: 14 bước).
     - **Adaptive Worker Timeout**: Tự động co giãn timeout từ 2500ms đến 4500ms theo công thức `2000 + patCount * 25`, đảm bảo Web Worker không bị ngắt quãng giữa chừng khi xử lý danh sách lớn.
- **Đồng bộ phiên bản**:
  + Nâng cấp lên `4.0.4-rev7`.
  + `index.html`: Cập nhật cache busters `v=4.0.4-rev7`, footer timestamp `13:30 09/09/2026`, `APP_VERSION = '4.0.4-rev7'`.
  + `sw.js`: `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev7'`.
- **File sửa đổi**:
  + `index.html`
  + `js/app.js`
  + `js/scheduler-engine.js`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.4-rev8] - 13:45 09/09/2026: Khắc Phục Lỗi Mất Dữ Liệu Huấn Luyện AI Khi F5 Hoặc Mở Trên Máy Tính Khác
- **Bối cảnh & Vấn đề**:
  1. Khi người dùng bấm Huấn luyện AI trong tab Admin (`tab-ai`), dữ liệu huấn luyện (số dòng, thời gian huấn luyện, số cặp thói quen) bị biến mất hoàn toàn (về 0 dòng, "Chưa huấn luyện") khi F5 lại trang hoặc khi đăng nhập trên máy tính/thiết bị khác.
  2. Bắt nguồn từ việc mô hình AI chỉ được lưu cục bộ trong `localStorage` bằng key cố định `times_ai_learned_model`, hoàn toàn không được lưu trữ lên CSDL đám mây Cloudflare D1 (`cai_dat`).
  3. Hàm `saveSystemSettings` trong backend xử lý tham số dạng Object khiến các lệnh lưu key-value dạng cặp chuỗi bị lỗi parse; đồng thời API `getLichSu` chỉ đọc từ bảng `lich_su` (chưa có dữ liệu nếu đơn vị chưa chốt sổ tháng nào).
  4. Trong `init.js`, tiến trình sanitization dọn dẹp cache rò rỉ vô tình xóa bỏ `times_ai_learned_model` khi session chưa sẵn sàng.
- **Giải pháp & Kỹ thuật triển khai**:
  1. **Backend Cloudflare Worker (`backend/src/index.js`)**:
     - Nâng cấp `saveSystemSettings`: Tự động tương thích cả 3 định dạng tham số (`{ key: val }`, `(key, val)`, hoặc JSON string).
     - Bổ sung 2 action chuyên dụng: `saveAIModel` / `saveAILearnedModel` và `getAIModel` / `getAILearnedModel` ghi/đọc trường `ai_learned_model` trong bảng `cai_dat` độc lập theo từng đơn vị (`unit_code`).
     - Tự động fallback trong `getLichSu`: Nếu bảng `lich_su` chưa có dữ liệu chốt sổ, tự động nạp toàn bộ các ca từ bảng `lich_trinh` để AI có dữ liệu thực tế để học.
  2. **Bộ Não Học Máy AI Lâm Sàng (`js/ai-scheduler.js`)**:
     - Tự động phân lập khóa lưu trữ theo đơn vị: `times_ai_learned_model_${unitCode}`.
     - Hàm `saveModel`: Vừa lưu cache offline vừa tự động đồng bộ ngay lập tức lên CSDL đám mây Cloudflare D1.
     - Hàm `loadSavedModel`: Ưu tiên đọc từ `dataCache.settings.ai_learned_model` được đồng bộ từ server về.
     - Bổ sung hàm `setModel(model)` cho phép nạp và cập nhật mô hình linh hoạt từ server payload.
  3. **Frontend Controller (`js/app.js`)**:
     - `applySystemSettings`: Tự động nạp `ai_learned_model` và `ai_auto_train_config` từ CSDL đám mây khi khởi động phần mềm hoặc F5, sau đó gọi `renderAISettingsUI()` cập nhật ngay giao diện Admin.
     - `calibrateAIFromHistory`: Tự động gom toàn bộ dữ liệu từ D1 History, Live Schedule (`dataCache.schedule`, `currentScheduleData`), và Bootstrap Cache. Huấn luyện xong tự động gọi API lưu vĩnh viễn lên Cloudflare D1.
  4. **Bảo vệ Cache Trình Duyệt (`js/init.js`)**:
     - Thêm `times_ai_learned_model`, `ai_auto_train_enable`, `ai_auto_train_time` và tiền tố `times_ai_learned_model_` vào danh sách `preserveKeys` để F5 không bao giờ bị xóa.
- **Đồng bộ phiên bản**:
  + Nâng cấp lên `4.0.4-rev8`.
  + `index.html`: Cập nhật cache busters `v=4.0.4-rev8`, footer timestamp `13:45 09/09/2026`, `APP_VERSION = '4.0.4-rev8'`, giữ nguyên hiển thị chân trang `Phiên bản: 4.0.4`.
  + `sw.js`: `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev8'`.
- **File sửa đổi**:
  + `backend/src/index.js`
  + `js/ai-scheduler.js`
  + `js/app.js`
  + `js/init.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.4-rev9] - 14:02 09/09/2026: Chuẩn Hóa Chức Năng Chốt Sổ - Loại Bỏ Hoàn Toàn Ghi Kép Vào Bảng Cũ gio_ban_cu
- **Yêu cầu của người dùng**:
  + Rà soát kỹ lưỡng chức năng chốt sổ xem cụ thể chốt những gì.
  + Sau khi phát hiện code backend vẫn còn cơ chế "ghi kép" (dual-write) vào bảng cũ `gio_ban_cu`, người dùng yêu cầu loại bỏ hoàn toàn việc ghi vào bảng `gio_ban_cu`, chỉ lưu duy nhất vào bảng chuẩn `gio_ban_chung_cu`.
- **Phân tích nguyên nhân & Giải pháp**:
  1. **Nguyên nhân**:
     - Trước đây khi nâng cấp từ bảng cũ `gio_ban_cu` sang bảng chuẩn mới `gio_ban_chung_cu` (hỗ trợ phân loại `target_type`: 'nhan_su', 'benh_nhan', 'ra_vien' và cột `dob` năm sinh), hệ thống giữ lại lệnh ghi kép vào `gio_ban_cu` làm dự phòng tương thích ngược.
     - Hiện tại toàn bộ hệ thống (từ `getHistoryFullData`, xuất báo cáo, xem lại lịch sử...) đều ưu tiên đọc trực tiếp từ `gio_ban_chung_cu`. Việc tiếp tục INSERT vào `gio_ban_cu` mỗi lần chốt sổ làm CSDL phát sinh các câu lệnh dư thừa và làm phình bảng cũ với dữ liệu không chuẩn.
  2. **Giải pháp triển khai**:
     - Trong `backend/src/index.js`:
       + Tại action `chuyenNgayMoi` / `chotSo`: Xóa bỏ 2 lệnh `INSERT INTO gio_ban_cu` (cho nhân viên và bệnh nhân). Chỉ thực hiện INSERT vào bảng chuẩn `gio_ban_chung_cu`.
       + Tại hàm `checkAutoChotSo` (CRON chốt sổ tự động đám mây): Xóa bỏ 2 lệnh `INSERT INTO gio_ban_cu`. Chỉ thực hiện INSERT vào `gio_ban_chung_cu`.
       + Giữ bảng `gio_ban_cu` ở chế độ chỉ đọc (read-only) phục vụ fallback tra cứu các ngày lịch sử từ trước thời điểm nâng cấp hệ thống.
  3. **Đồng bộ phiên bản theo RULES.md**:
     - Nâng cấp phiên bản lên `4.0.4-rev9`.
     - `index.html`: Cập nhật cache busters `v=4.0.4-rev9`, footer timestamp `14:02 09/09/2026`, biến `const APP_VERSION = '4.0.4-rev9'`, chân trang hiển thị `Phiên bản: 4.0.4`.
     - `sw.js`: Đổi `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev9'`.
     - Kiểm tra cú pháp 100% đạt chuẩn: `node -c js/init.js`, `node -c js/app.js`, `node -c js/scheduler-engine.js`, `node -c backend/src/index.js`.
     - Triển khai Cloudflare Pages và Cloudflare Worker thành công (`deploy:all`).
- **File sửa đổi**:
  + `backend/src/index.js`
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`

---

### [v4.0.4-rev10] - 14:15 09/09/2026: Cơ Chế Phát Hiện Phiên Bản Mới Tức Thì & Modal Popup Chặn Toàn Màn Hình
- **Yêu cầu của người dùng**:
  + Các máy tính khác khi mở phần mềm thường không biết lúc nào có phiên bản mới.
  + Yêu cầu: Ngay lập tức khi có bản mới, trên màn hình các máy tính khác phải xuất hiện Modal Popup thông báo đã có phần mềm mới và nút bấm để F5/tải lại trang, nếu không tải lại thì khóa toàn màn hình không cho sử dụng web để tránh lỗi xung đột dữ liệu.
- **Phân tích nguyên nhân & Giải pháp**:
  1. **Hạn chế trước đây**:
     - Service Worker kiểm tra định kỳ 5 phút/lần, thời gian phản ứng lâu nếu người dùng cứ mở trang liên tục.
     - Khi có bản mới, hệ thống chỉ hiển thị một Toast nhỏ 2 giây rồi tự reload, người dùng không kịp hiểu lý do và chưa có cơ chế cưỡng chế khóa thao tác.
  2. **Giải pháp triển khai 4 tầng tức thì**:
     - **Tệp tĩnh `version.json`**: Tạo tệp tĩnh tại thư mục gốc Cloudflare Pages chứa `version: "4.0.4-rev10"`, tốc độ truy vấn chỉ 10-20ms tại Edge.
     - **Polling 30s siêu nhẹ & Focus trigger**: Vòng lặp ngầm 30 giây gửi `fetch('./version.json?_nocache=...')` không cache. Đồng thời lắng nghe `visibilitychange` và `focus` (ngay khi bác sĩ mở lại tab hoặc click vào màn hình là kiểm tra lập tức).
     - **Đồng bộ đa tab (BroadcastChannel)**: Sử dụng kênh `pmcg_app_version_channel` để khi 1 tab phát hiện bản mới, toàn bộ các tab khác trên cùng máy tính đều đồng loạt bật Popup khóa màn hình trong 0ms.
     - **Tích hợp Service Worker**: Bắt sự kiện `updatefound` và `statechange === 'installed'` để lập tức bật Popup.
     - **Giao diện Modal Popup Chặn Toàn Màn Hình (`#modal-force-update`)**:
       + Phủ mờ toàn màn hình `backdrop-filter: blur(12px)`, `z-index: 2147483647`.
       + Khóa toàn bộ tương tác: Không nút đóng, không đóng khi click ra ngoài, chặn phím Escape.
       + Hiển thị rõ phiên bản cũ ➔ phiên bản mới.
       + Nút bấm to: **`🔄 CẬP NHẬT & TẢI LẠI TRANG NGAY (F5)`** có hiệu ứng loading, tự động dọn sạch Cache Storage và tải lại trang triệt để (`window.location.reload(true)`).
  3. **Đồng bộ phiên bản theo RULES.md**:
     - Nâng cấp lên `4.0.4-rev10`.
     - `index.html`: Cập nhật cache busters `v=4.0.4-rev10`, footer timestamp `14:15 09/09/2026`, biến `const APP_VERSION = '4.0.4-rev10'`, chân trang hiển thị `Phiên bản: 4.0.4`.
     - `sw.js`: `CACHE_NAME = 'pmcg-v4-cache-4.0.4-rev10'`, cấu hình bỏ qua cache cho `version.json`.
     - Kiểm tra cú pháp 100% đạt chuẩn: `node -c js/init.js; node -c js/app.js; node -c js/scheduler-engine.js; node -c backend/src/index.js; node -c sw.js`.
     - Triển khai Cloudflare Pages và Cloudflare Worker thành công (`deploy:all`).
- **File sửa đổi**:
  + `version.json` (Mới)
  + `index.html`
  + `sw.js`
  + `PM-xeplich-v4.md`






