# HƯỚNG DẪN KÍCH HOẠT VÀ TRIỂN KHAI CLOUDFLARE BACKEND & D1 DATABASE CHO PM-XEPLICH V3 (100% MIỄN PHÍ)

Tài liệu này hướng dẫn từng bước kích hoạt **Cloudflare Workers** và **D1 Database (SQL Serverless)** để chạy backend cho phiên bản **PM-xeplich v3**, giúp ứng dụng phản hồi siêu tốc (**10 - 30ms**), loại bỏ hoàn toàn Google Apps Script và không bao giờ gặp lỗi CORS hay giới hạn quota.

---

## BƯỚC 1: Đăng Ký Tài Khoản Cloudflare (Nếu chưa có)
1. Truy cập [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Đăng ký bằng Email của bạn (hoàn toàn miễn phí, **không cần thẻ Visa/MasterCard**).
3. Xác nhận email kích hoạt.

---

## BƯỚC 2: Cài Đặt Wrangler & Đăng Nhập trên Máy Tính
Mở cửa sổ **PowerShell** hoặc **Terminal** tại máy tính và chạy các lệnh sau:

```powershell
# 1. Di chuyển vào thư mục backend của v3
cd "D:\PM-DPT\PM-xeplich\khung_pm\ban_web\v3-Cloudflare\backend"

# 2. Đăng nhập vào Cloudflare (Trình duyệt sẽ tự mở để bạn bấm Xác nhận)
npx wrangler login
```

---

## BƯỚC 3: Tạo D1 Database trên Cloudflare
Chạy lệnh tạo Database SQL có tên `pmcg-db`:

```powershell
npx wrangler d1 create pmcg-db
```

Sau khi tạo xong, màn hình sẽ hiển thị thông tin dạng:
```toml
[[d1_databases]]
binding = "DB"
database_name = "pmcg-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

👉 **Hãy copy dòng `database_id = "..."` đó và dán vào file `backend/wrangler.toml`.**

---

## BƯỚC 4: Khởi Tạo Cấu Trúc Bảng Dữ Liệu (Schema Migration)
Chạy lệnh sau để tự động tạo toàn bộ các bảng SQL (nhân sự, bệnh nhân, lịch trình, chấm công, v.v.):

```powershell
npx wrangler d1 execute pmcg-db --file=./schema.sql --remote
```

---

## BƯỚC 5: Deploy Backend Worker lên Cloudflare
Chạy lệnh triển khai mã nguồn API:

```powershell
npx wrangler deploy
```

Sau khi deploy thành công, Cloudflare sẽ cấp cho bạn một đường dẫn URL cố định, ví dụ:
`https://pmcg-api.your-account.workers.dev`

---

## BƯỚC 6: Cập Nhật URL API vào Giao Diện Web v3
1. Mở file `D:\PM-DPT\PM-xeplich\khung_pm\ban_web\v3-Cloudflare\js\init.js`.
2. Thay thế `CF_API_URL` bằng đường dẫn Worker vừa nhận được:
```javascript
const CF_API_URL = "https://pmcg-api.your-account.workers.dev";
```
3. Mở web `index.html` của `v3-Cloudflare` và tận hưởng tốc độ tức thì **10ms - 30ms**!

---

## ⚡ TÍNH NĂNG MIGRATION 1-CLICK (KÉO DỮ LIỆU TỪ GOOGLE SANG D1)
Bạn không cần nhập lại danh sách nhân sự hay danh mục!
Trên giao diện Web v3, vào màn hình **Cài đặt Hệ thống (Admin)** -> bấm nút **"📥 Chuyển Dữ Liệu Từ Google Sheets Sang Cloudflare D1"**, hệ thống sẽ tự động sao chép toàn bộ dữ liệu hiện tại sang Cloudflare trong 1 giây!
