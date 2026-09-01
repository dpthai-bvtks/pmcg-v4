# 🤖 Project Rules for AI Assistants (PM-XepLich v4 - Multi-Tenant SaaS)

*Đây là bộ quy tắc bắt buộc áp dụng cho mọi tương tác của AI trong tương lai đối với phiên bản Thương mại PM-XepLich v4.*

---

## 1. 🧪 Kiểm tra trước khi đẩy code (Test Before Push)
- **Tuyệt đối không push code mù.** 
- Trước khi đẩy code lên Github hay Cloudflare, AI phải tự rà soát cú pháp bằng lệnh:
  `node -c js/init.js && node -c js/app.js && node -c js/scheduler-engine.js && node -c backend/src/index.js`
- Đảm bảo logic xếp lịch và tính toán của 3 bộ giải thuật (`cp-solver.js`, `scheduler-engine.js`, `ai-scheduler.js`) không bị xung đột hoặc phát sinh lỗi cú pháp.

---

## 2. 🏢 Quy tắc Kiến trúc Đa Đơn Vị (Multi-Tenant SaaS Architecture Rules)
- **Mã đơn vị mặc định:** `bvtks_cs2` (*Bệnh viện Than - Khoáng sản Cơ sở 2*).
- **Cách ly dữ liệu 100% (Tenant Clamping):** Mọi truy vấn SQL CRUD trong `backend/src/index.js` **bắt buộc** phải có ràng buộc `WHERE unit_code = ?`. Tuyệt đối không query dữ liệu không kèm `unit_code`.
- **Đính kèm context trong API Calls:** Mọi lời gọi API từ Frontend qua `callApi` / `executeApiTask` bắt buộc gửi header `x-unit-code` và trường `unit_code` trong body payload.
- **Phân tách Cache & LocalStorage:** Khóa lưu trữ Offline / Cache / Flatpickr / Session phải phân tách theo `unit_code` (ví dụ: `pm_unit_code`, `times_bootstrap_cache_${unit_code}`).
- **Phân quyền Super Admin:** Tài khoản `role === 'SUPER_ADMIN'` có quyền truy cập tab `tab-tenants` để quản lý, cấp phép, gia hạn và khởi tạo bệnh viện/phòng khám mới.

---

## 3. 🔄 Đồng bộ số phiên bản, Footer Timestamp & Cache Buster
Mỗi khi có bản nâng cấp hoặc sửa đổi code, **bắt buộc** thực hiện đồng bộ 3 vị trí:
1. **Footer Timestamp trong `index.html`**:
   - Cập nhật chính xác ngày giờ hiện tại tại dòng:
     `⏰ Cập nhật lần cuối: HH:mm DD/MM/YYYY` (ví dụ: `12:55 01/09/2026`).
2. **Cache Buster Query Strings trong `index.html`**:
   - Tăng số revision cho các thẻ nạp script và stylesheet:
     `js/app.js?v=4.0.0-revN`, `js/init.js?v=4.0.0-revN`, `js/scheduler-engine.js?v=4.0.0-revN`, `sw.js?v=4.0.0-revN`...
3. **Service Worker Cache Name trong `sw.js`**:
   - Đổi tên cache tương ứng: `const CACHE_NAME = 'pmcg-v4-cache-4.0.0-revN';` để đảm bảo trình duyệt người dùng luôn nhận bản mới nhất ngay tức thì.

---

## 4. 🚀 Tự động Deploy lên Cloudflare Toàn diện & Báo cáo kết quả
Hệ thống chạy 100% trên nền tảng Cloudflare (Pages + Worker API + D1 Database). Sau mỗi lần sửa đổi, AI **bắt buộc tự động chạy lệnh deploy** từ thư mục `backend`:
- **Chỉ sửa Frontend (HTML/JS/CSS/Assets):**
  Chạy lệnh trong `backend/`: `npm run deploy:web` (đẩy trực tiếp lên Cloudflare Pages `pmcg-v4`).
- **Sửa cả Backend Worker / Database API:**
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
