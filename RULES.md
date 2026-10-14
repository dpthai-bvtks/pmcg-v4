# 🤖 Project Rules for AI Assistants (PM-XepLich v4 - Multi-Tenant SaaS)

*Đây là bộ quy tắc bắt buộc áp dụng cho mọi tương tác của AI trong tương lai đối với phiên bản Thương mại PM-XepLich v4.*

---

## 1. 🧪 Kiểm tra trước khi đẩy code (Test Before Push - Super-Verify 9 Tầng)
- **Tuyệt đối không push code mù.** 
- Trước khi đẩy code lên Github hay Cloudflare, AI **bắt buộc chạy bộ kiểm tra toàn diện 9 tầng (Super-Verify Suite)**:
  `node scripts/verify-build.mjs`
  *(Bộ kiểm tra bao gồm 9 tầng bảo vệ nghiêm ngặt:*
  *1. Kiểm tra cú pháp (node -c) 100% tệp JS cốt lõi & backend router;*
  *2. Trích xuất & kiểm tra cú pháp toàn bộ inline <script> trong HTML;*
  *3. Quét tĩnh các lệnh gán top-level window.xyz = xyz tránh biến undefined/ReferenceError;*
  *4. Mô phỏng thực thi Runtime trong Node VM Sandbox để phát hiện TDZ và crash khởi tạo;*
  *5. Quét Bảo Mật & Rò Rỉ Khóa Bí Mật (chống hardcode Turso Token, Private Key, mật khẩu ở Frontend);*
  *6. Kiểm thử Tính Đúng Đắn Thuật Toán Xếp Lịch & Ràng Buộc Y Tế (0 xung đột máy/nhân viên, benchmark < 2s);*
  *7. Kiểm thử Tích Hợp API Cloudflare Worker & Turso Edge In-Memory Cache (Live Contract Test);*
  *8. Kiểm thử Mô Hình Ngoại Tuyến Offline-First & Dexie IndexedDB (đủ 7 Stores cốt lõi & conflict handler);*
  *9. Kiểm thử Toàn Vẹn Tài Nguyên DOM, PWA & Zero Broken Links (quét 100% link asset tĩnh, zero 404, đủ 18 ID cốt lõi).*
- Chỉ khi lệnh trên trả về exit code `0` (`TẤT CẢ 9 TẦNG SUPER-VERIFY ĐÃ VƯỢT QUA 100%!`) mới được phép tiến hành deploy và commit Git.
- Đảm bảo logic xếp lịch và tính toán của 3 bộ giải thuật (`cp-solver.js`, `scheduler-engine.js`, `ai-scheduler.js`) không bị xung đột hoặc phát sinh lỗi cú pháp.

---

## 2. 🏢 Quy tắc Kiến trúc Đa Đơn Vị (Multi-Tenant SaaS Architecture Rules)
- **Mã đơn vị mặc định:** `bvtks-cs2` (*Bệnh viện Than - Khoáng sản Cơ sở 2*, hệ thống tự động hỗ trợ bí danh `bvtks_cs2`).
- **Cách ly dữ liệu 100% (Tenant Clamping):** Mọi truy vấn SQL CRUD trong `backend/src/index.js` **bắt buộc** phải có ràng buộc `WHERE unit_code = ?`. Tuyệt đối không query dữ liệu không kèm `unit_code`.
- **Đính kèm context trong API Calls:** Mọi lời gọi API từ Frontend qua `callApi` / `executeApiTask` bắt buộc gửi header `x-unit-code` và trường `unit_code` trong body payload.
- **Phân tách Cache & LocalStorage:** Khóa lưu trữ Offline / Cache / Flatpickr / Session phải phân tách theo `unit_code` (ví dụ: `pm_unit_code`, `times_bootstrap_cache_${unit_code}`).
- **Phân quyền Super Admin:** Tài khoản `role === 'SUPER_ADMIN'` có quyền truy cập tab `tab-tenants` để quản lý, cấp phép, gia hạn và khởi tạo bệnh viện/phòng khám mới.

---

## 3. 🔄 Quy tắc Đánh số Phiên bản, Footer Timestamp & Cache Buster
- **Quy tắc phiên bản theo ngày (Daily Version Increment):**
  - Bản thương mại v4 bắt đầu từ `4.0.0`.
  - **Mỗi ngày chỉ tăng tối đa 1 phiên bản** (Ví dụ: ngày hôm nay là `4.0.0` thì toàn bộ các thay đổi trong ngày hôm nay vẫn giữ nguyên `4.0.0`; sang ngày mới tiếp theo mới tăng lên `4.0.1`, ngày kế tiếp là `4.0.2`...`4.0.9` tiếp đến là `4.1.0`...).
  - ⚠️ **QUY TẮC HIỂN THỊ PHIÊN BẢN Ở CHÂN TRANG (FOOTER):**
    + Tại thẻ `#app-footer-version` (trong khối *THÔNG TIN HỆ THỐNG* ở chân trang): **CHỈ HIỂN THỊ PHIÊN BẢN CHÍNH (ví dụ: `Phiên bản: 4.0.6`), TUYỆT ĐỐI KHÔNG HIỂN THỊ ĐOẠN HẬU TỐ `revN` (KHÔNG ĐỂ `rev13` Ở CHÂN TRANG)**.
    + Hậu tố `revN` chỉ dùng cho kỹ thuật nội bộ: Cache Buster (`?v=4.0.X-revN`), Service Worker `CACHE_NAME`, popup `modal-force-update` và tệp `version.json`.
- **Đánh số Revision trong ngày (`revN`):**
  - Trong cùng một ngày, mỗi khi có chỉnh sửa hoặc cập nhật code, **chỉ tăng số revision `revN`** (ví dụ: `4.0.X-rev1`, `4.0.X-rev2`, `4.0.X-rev3`...).
  - **Bắt buộc đồng bộ các vị trí**:
    1. **Footer Timestamp ("Cập nhật lần cuối")**:
       - Cập nhật chính xác giờ phút ngày tháng hiện tại tại thẻ `#sys-last-update`:
         `⏱ Cập nhật lần cuối: HH:mm DD/MM/YYYY` (ví dụ: `14:32 11/09/2026`).
       - Đồng bộ trong tệp `version.json` trường `releaseTime`.
       - Hàm `checkVersionDirectly()` sẽ tự động đồng bộ giá trị `releaseTime` này vào giao diện mọi tab.
    2. **Cache Buster Query Strings trong `index.html`**:
       - Cập nhật `?v=4.0.X-revN` cho toàn bộ các thẻ script và link CSS:
         `css/style.css?v=4.0.X-revN`, `css/mobile.css?v=4.0.X-revN`, `js/app.js?v=4.0.X-revN`, `js/init.js?v=4.0.X-revN`, `js/scheduler-engine.js?v=4.0.X-revN`... và biến `const APP_VERSION = '4.0.X-revN';`.
    3. **Service Worker Cache Name trong `sw.js`**:
       - Đổi tên cache tương ứng: `const CACHE_NAME = 'pmcg-v4-cache-4.0.X-revN';` để trình duyệt người dùng luôn hủy cache cũ và nhận bản mới nhất ngay tức thì.
    4. **Tệp `version.json`**:
       - Cập nhật `version`: `"4.0.X-revN"`, `releaseTime`: `"HH:mm DD/MM/YYYY"` và `notes`.

---

## 4. 🚀 Tự động Deploy lên Cloudflare Toàn diện & Báo cáo kết quả
Hệ thống Frontend & API chạy trên nền tảng Cloudflare (Pages + Worker API `pmcg-api`).
- **Cơ sở dữ liệu hoạt động:** Lưu trữ chính trên **MiniPC** và sao lưu đồng bộ 2 chiều ngầm (**Dual-Write**) trên **Turso Cloud (libSQL Tokyo)**; **Cloudflare D1 hiện đang đóng băng/ngủ đông không sử dụng**. Mọi câu lệnh SQL qua Worker đều được `createTursoAdapter` chuyển tiếp tới MiniPC và Turso.
- Sau mỗi lần sửa đổi, AI **bắt buộc tự động chạy lệnh deploy** từ thư mục `backend`:
  + **Chỉ sửa Frontend (HTML/JS/CSS/Assets):**
    Chạy lệnh trong `backend/`: `npm run deploy:web` (đẩy trực tiếp lên Cloudflare Pages `pmcg-v4`).
  + **Sửa cả Backend Worker / Database API:**
    Chạy lệnh trong `backend/`: `npm run deploy:all` (deploy cả Worker `pmcg-api` và Pages `pmcg-v4`).
- **Kiểm tra trạng thái:** Đảm bảo kết quả trả về `Deployment complete!` và trang web `https://pmcg-v4.pages.dev` / `https://www.xeplichthuthuat.io.vn` hoạt động bình thường.

---

## 5. 📦 Sao lưu & Quản lý phiên bản trên GitHub (GitHub Main Branch)
Ngay sau khi kiểm tra và deploy Cloudflare thành công, **bắt buộc** đẩy toàn bộ mã nguồn lên GitHub:
- **Lệnh thực hiện:** `git add .`, `git commit -m "..."`, `git push origin main`.
- **Commit Message:** Rõ ràng, mô tả đúng nội dung vừa làm với các tiền tố chuẩn (`feat:`, `fix:`, `style:`, `refactor:`, `perf:`...).
- **Repository:** `https://github.com/dpthai-bvtks/pmcg-v4` (nhánh `main`).

---

## 6. 📝 Ghi nhật ký phát triển vào `PM-xeplich-v4.md`
Sau mỗi lần giải quyết xong một yêu cầu hoặc nâng cấp tính năng, **bắt buộc** ghi thêm vào cuối file `PM-xeplich-v4.md`:
- **Tiêu đề mục:** Tên tính năng/Lỗi được sửa + Phiên bản & Ngày tháng (ví dụ: `### Nâng Cấp Multi-Tenant SaaS (01/09/2026 - v4.0.0-rev1)`).
- **Nội dung:**
  + *Yêu cầu của người dùng*: Mô tả ngắn gọn vấn đề/mong muốn.
  + *Phân tích nguyên nhân & Giải pháp*: Chi tiết kỹ thuật đã thực hiện.
  + *File sửa đổi*: Danh sách cụ thể các file đã can thiệp.
- **Mục đích:** Đảm bảo tính liên tục của dự án khi chuyển giao phiên làm việc cho các AI khác.

---

## 7. 🧹 Dọn dẹp thư mục & Báo cáo kết quả cho người dùng
- Xóa bỏ mọi file tạm, file scratch hoặc file test phát sinh trong quá trình làm việc.
- Trả lời người dùng ngắn gọn, súc tích:
  + Tóm tắt những thay đổi đã hoàn thành.
  + Báo cáo trạng thái Deploy Cloudflare (kèm link kiểm tra).
  + Báo cáo trạng thái Git commit/push.

---

## 8. 🛡️ Tiêu chuẩn An toàn Bảo mật & Chống rò rỉ dữ liệu (Hardening Checklist theo vibecode)
*Áp dụng nghiêm ngặt 20 điểm kiểm tra bảo mật (7 nhóm) trước khi public phiên bản thương mại:*

1. **Nhóm 1 - Quản lý Tài khoản & Đăng nhập:**
   - **Băm mật khẩu (Password Hashing):** Sử dụng PBKDF2-SHA256 (tối thiểu 100.000 vòng lặp) hoặc Argon2/bcrypt qua Web Crypto API. Tuyệt đối không lưu mật khẩu dạng văn bản thô (plaintext).
   - **Chống Brute-force (Rate Limiting):** Trang đăng nhập bắt buộc có giới hạn thử mật khẩu (tối đa 5 lần sai trong 15 phút, khóa tài khoản/IP 15 phút) trên cả bảng SQLite `login_attempts` và In-Memory fallback.
   - **Thời hạn Phiên làm việc (Session Expiration):** Token JWT bắt buộc có thời hạn sống (`exp`) từ 1 đến 7 ngày, tự động vô hiệu khi hết hạn; không cấp token vô thời hạn.

2. **Nhóm 2 - Chống Rò rỉ Thông tin & Lộ đồ (Information Disclosure):**
   - **Dọn dẹp Debug Log:** Tuyệt đối không in log `console.log` chứa dữ liệu nhạy cảm của người bệnh, mật khẩu, JWT token hay payload nội bộ khi chạy trên môi trường Production.
   - **Bảo vệ Secret & Khóa bí mật:** `JWT_SECRET`, `TURSO_TOKEN`, `FALLBACK_TOKEN` chỉ được lưu trong biến môi trường Cloudflare Worker Secrets (`wrangler secret put`). Tuyệt đối không xuất hiện trong mã nguồn Client/Frontend.
   - **Không lộ Stack Trace:** Khi Backend gặp lỗi 500, chỉ phản hồi thông báo an toàn và mã lỗi `SERVER_ERROR` cho người dùng; stack trace chi tiết chỉ được ghi nhận nội bộ trong Cloudflare Worker Logs.

3. **Nhóm 3 - Kiểm soát Dữ liệu Người dùng Gửi lên (Input & Upload Validation):**
   - **Giới hạn loại file upload:** Chỉ chấp nhận các định dạng file quy định (.xlsx, .json, .csv) phục vụ sao lưu/nhập dữ liệu bệnh nhân và nhân sự.
   - **Giới hạn dung lượng Payload:** Chặn các request có body vượt quá 10MB-15MB tại Worker để ngăn ngừa tấn công làm tràn bộ nhớ (Memory Exhaustion) của Cloudflare Worker (giới hạn 128MB RAM).
   - **Xác thực tại Server (Server-side Validation):** Mọi tham số CRUD, kiểu dữ liệu, độ dài chuỗi và mã đơn vị bắt buộc phải được kiểm tra lại tại Backend Router trước khi ghi vào Database.

4. **Nhóm 4 - Tự Thử Phá & Kiểm soát Quyền Truy cập (IDOR & RBAC):**
   - **Chống IDOR & Cách ly Đơn vị (Tenant Clamping):** Không cho phép thay đổi `unit_code` trên URL hoặc Body để đọc trộm/ghi đè dữ liệu của bệnh viện khác. Mọi câu lệnh SQL đều phải kẹp chặt `WHERE unit_code = ?`.
   - **Phân quyền chặt chẽ (RBAC):** Tài khoản người dùng thông thường (`staff`, `viewer`) tuyệt đối không thể gọi các hành động quản trị viên (`Admin`, `SUPER_ADMIN`).
   - **Tham số hóa Truy vấn (100% Parameterized Queries):** 100% câu truy vấn cơ sở dữ liệu phải dùng `db.prepare(...).bind(...)`. Cấm triệt để việc cộng chuỗi SQL (`+`) thô.

5. **Nhóm 5 - Bảo vệ Phía Trình duyệt (Browser Hardening):**
   - **Bắt buộc HTTPS:** Cloudflare Pages và CDN domain tự động kích hoạt HSTS và chuyển hướng 100% từ HTTP sang HTTPS.
   - **Security Headers đẩy đủ:** API responses bắt buộc đính kèm: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy`.
   - **Cờ Cookie An toàn:** Nếu sử dụng Cookie phải có đủ 3 cờ `HttpOnly; Secure; SameSite=Lax/Strict`.

6. **Nhóm 6 - Đóng kín Cửa Server (Server Hardening):**
   - **CORS Whitelist khắt khe:** Chỉ cho phép các domain chính thức (`xeplichthuthuat.io.vn`, `pmcg-v4.pages.dev`) và localhost lúc phát triển. Không dùng wildcard `*`.
   - **Cơ sở dữ liệu an toàn:** SQLite trên MiniPC và Turso Cloud chỉ kết nối qua giao thức mã hóa HTTPS/Pipeline có Token xác thực, không mở cổng public không bảo vệ ra ngoài Internet.
   - **Cấp quyền tối thiểu (Least Privilege):** Token và tài khoản chỉ được cấp đúng phạm vi quyền cần thiết.

7. **Nhóm 7 - Lớp Phòng vệ Ngoài cùng & Dự phòng Thảm họa:**
   - **Cloudflare Edge Protection:** Đưa toàn bộ Website và API qua Cloudflare để phòng vệ DDoS và tăng tốc độ phản hồi qua Edge In-Memory Caching.
   - **Sao lưu 3 Cấp Tự động (Disaster Recovery):** Cấp 1 tại MiniPC SQLite → Cấp 2 tự động đồng bộ ngầm lên Google Sheets sạch → Cấp 3 chốt sổ hàng ngày lên Turso Cloud Tokyo lúc 16:00 VN.

