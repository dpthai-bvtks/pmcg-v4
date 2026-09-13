# 🖥️ KẾ HOẠCH TRIỂN KHAI DATABASE TẠI MINI PC CÔNG NGHIỆP
> **Dự án**: Hệ thống Quản lý & Xếp lịch Thủ thuật YHCT - PHCN (`xeplichthuthuat.io.vn`)  
> **Phiên bản**: v4-thuongmai (Multi-Tenant SaaS)  
> **Ngày lập**: 12/09/2026  
> **Tác giả**: Đặng Phong Thái

---

## 1. 📌 TỔNG QUAN & HIỆN TRẠNG PHẦN CỨNG

### 1.1. Cấu hình phần cứng Mini PC
* **CPU**: Intel Core i5-4350U (Haswell 4th Gen, 2 lõi 4 luồng, TDP 15W siêu tiết kiệm điện).
* **RAM**: 8GB DDR3L (đủ sức gánh hàng trăm kết nối đồng thời với SQLite/LibSQL).
* **Ổ cứng 1**: SSD 128GB (Cài Windows 10 Pro + Chứa File Database chính đang hoạt động).
* **Ổ cứng 2**: HDD 500GB (Kho lưu trữ sao lưu tự động - Backup Vault định kỳ).
* **Hệ điều hành**: Windows 10 Pro (Giữ nguyên theo yêu cầu).
* **Vị trí lắp đặt**: Tại bệnh viện (Nguồn điện ổn định, ít mất điện).
* **Chu kỳ hoạt động hiện tại**: Bật lúc 06:00 sáng (thủ công) – Tắt lúc 19:00 - 20:00 tối (tự động).

### 1.2. Kiến trúc phần mềm hiện tại
* **Frontend**: Hosted trên Cloudflare Pages (`xeplichthuthuat.io.vn`), Service Worker offline PWA, Dexie IndexedDB cache.
* **Backend API**: Cloudflare Worker Hono (`pmcg-api.dpthai-ttytmk.workers.dev`), tương thích API D1 / Turso HTTP Pipeline (`/v2/pipeline`).
* **Database hiện tại**: Turso Database Cloud (LibSQL).

---

## 2. 🏗️ KIẾN TRÚC HỆ THỐNG ĐỀ XUẤT (HYBRID EDGE - ON-PREMISE)

```
[ Bác sĩ / KTV tại viện ]         [ Người dùng ngoài viện / Di động ]
             │                                   │
             ▼                                   ▼
   ┌─────────────────────────────────────────────────────────┐
   │         Tên miền chính: xeplichthuthuat.io.vn          │
   │           Cloudflare Pages (Frontend Web App)           │
   └────────────────────────────┬────────────────────────────┘
                                │ API Fetch
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │       Cloudflare Worker API (backend/src/index.js)      │
   │    Biến môi trường: TURSO_URL = https://db.xeplichthuthuat.io.vn │
   └────────────────────────────┬────────────────────────────┘
                                │ HTTPS qua Encrypted Tunnel
                                ▼ (Vượt Firewall / NAT Bệnh Viện)
   ┌─────────────────────────────────────────────────────────┐
   │  Mini PC Công Nghiệp (Windows 10 Pro - Đặt tại Viện)    │
   │                                                         │
   │  1. Cloudflare Tunnel Service (cloudflared.exe)         │
   │     └─ Nhận traffic từ db.xeplichthuthuat.io.vn         │
   │     └─ Forward về http://127.0.0.1:8080                 │
   │                                                         │
   │  2. Windows Service: sqld / Local LibSQL Engine         │
   │     └─ Lắng nghe cổng 8080                              │
   │     └─ Hỗ trợ native giao thức HTTP /v2/pipeline        │
   │                                                         │
   │  3. Phân vùng lưu trữ:                                  │
   │     ├─ Ổ C (SSD 128GB):                                │
   │     │   └─ C:\PMCG-Data\pmcg.db (Hot DB - Chế độ WAL)  │
   │     └─ Ổ D (HDD 500GB):                                │
   │         └─ D:\PMCG-Backups\ (Lưu bản sao lưu định kỳ)  │
   └─────────────────────────────────────────────────────────┘
```

---

## 3. ⚖️ ĐÁNH GIÁ ƯU NHƯỢC ĐIỂM & MA TRẬN RỦI RO

### 3.1. So sánh Ưu điểm & Nhược điểm

| Tiêu chí | Dùng Turso Cloud (Hiện tại) | Dùng Mini PC tại viện (Đề xuất) |
| :--- | :--- | :--- |
| **Quyền làm chủ dữ liệu** | Dữ liệu lưu tại máy chủ đám mây nước ngoài. | **100% On-Premise** tại bệnh viện, bảo mật tuyệt đối. |
| **Dung lượng lưu trữ** | Giới hạn theo hạn mức gói Turso (Free: 9GB). | **Không giới hạn** (500GB HDD tha hồ lưu trữ nhiều năm). |
| **Chi phí vận hành** | Nguy cơ phát sinh cước khi lượng đọc/ghi tăng. | **0 VNĐ/tháng**, tận dụng tối đa phần cứng có sẵn. |
| **Khả năng tương thích** | Đang chạy chuẩn `/v2/pipeline`. | **Tương thích 100%**, giữ nguyên toàn bộ code backend. |
| **Độ sẵn sàng (Uptime)** | 99.99% 24/7/365. | Phụ thuộc vào giờ bật máy, mạng viện và nguồn điện. |

---

### 3.2. Ma trận rủi ro nghiêm trọng & Giải pháp khắc phục

> [!CAUTION]
> ### 🚨 RỦI RO 1: Tê liệt hệ thống khi tắt máy từ 20h00 đến 06h00 sáng hôm sau
> * **Hiện tượng**: Khi máy tính tắt lúc 20h, người dùng bên ngoài, bác sĩ ca trực đêm hoặc người chuẩn bị lịch sớm trước 6h sáng truy cập `xeplichthuthuat.io.vn` sẽ bị lỗi sập kết nối (`502 Bad Gateway` / `Database Connection Refused`).
> * **Giải pháp đề xuất (2 Lựa chọn)**:
>   * **Lựa chọn A (Khuyên dùng tối đa - Chạy 24/7)**: Mini PC công nghiệp dòng chip U (15W) được thiết kế đặc thù để chạy 24/24 trong nhiều năm. Điện năng tiêu thụ chỉ bằng bóng đèn ngủ nhỏ (~10–12 số điện/tháng, khoảng **25.000 – 30.000 VNĐ**). Để máy chạy 24/7 đảm bảo độ sẵn sàng của phần mềm SaaS y tế mọi lúc mọi nơi.
>   * **Lựa chọn B (Nếu vẫn tắt lúc 20h)**: Bắt buộc cấu hình trong BIOS tính năng **RTC Alarm / Auto Power-On** để máy **tự động bật nguồn lúc 05:45 sáng** (không chờ người bật tay). Trên giao diện web hiển thị banner cảnh báo khung giờ bảo trì ban đêm (20h00 - 06h00).

> [!WARNING]
> ### ⚠️ RỦI RO 2: Máy khởi động lên nhưng Database và Tunnel không chạy vì chưa có người Login Windows
> * **Hiện tượng**: Khi máy bật (hoặc tự bật), Windows dừng ở màn hình khóa (Lock Screen). Nếu ứng dụng chạy bằng tay (mở cửa sổ CMD) thì database sẽ không khởi động cho tới khi có người bấm mật khẩu đăng nhập.
> * **Giải pháp**: Cài đặt cả **`sqld` (Database Engine)** và **`cloudflared` (Tunnel)** dưới dạng **Windows Service ngầm** (chạy bằng quyền `Local System`). Máy vừa có điện bật lên tới màn hình Boot là Database và Tunnel đã tự động chạy ngầm, không cần ai đăng nhập.

> [!WARNING]
> ### ⚠️ RỦI RO 3: Windows 10 Pro tự động cập nhật (Windows Update) và khởi động lại giữa giờ làm việc
> * **Hiện tượng**: Windows Update tự động tải bản vá và restart máy lúc 9h-10h sáng khiến việc xếp lịch bị gián đoạn.
> * **Giải pháp**: Dùng Group Policy (`gpedit.msc`) tắt hoàn toàn quyền tự động khởi động lại khi đang có phiên làm việc của người dùng.

> [!WARNING]
> ### ⚠️ RỦI RO 4: Hỏng file SQLite do tắt máy đột ngột hoặc mất điện
> * **Hiện tượng**: Dù viện ít mất điện nhưng nếu bị rút dây nguồn bất thình lình khi đang ghi dữ liệu, file `.db` có thể bị hỏng (corrupted).
> * **Giải pháp**: Cấu hình chế độ nhật ký **`PRAGMA journal_mode = WAL;` (Write-Ahead Logging)** và đặt **`PRAGMA synchronous = NORMAL;`**. Cơ chế WAL bảo vệ cơ sở dữ liệu an toàn ngay cả khi mất điện đột ngột.

---

## 4. 💽 PHÂN BỔ Ổ CỨNG HỢP LÝ (SSD 128GB + HDD 500GB)

1. **Ổ C: (SSD 128GB) — Dành cho Hiệu năng & Tốc độ cao (Hot Storage)**:
   * Chứa Windows 10 Pro và các ứng dụng hệ thống.
   * Thư mục Database đang hoạt động: `C:\PMCG-Data\pmcg.db`.
   * *Lý do*: Tốc độ truy xuất ngẫu nhiên (IOPS) của SSD nhanh gấp hàng chục lần HDD, giúp thao tác chạy thuật toán xếp lịch, lọc danh sách bệnh nhân chỉ mất dưới 5ms.
2. **Ổ D: (HDD 500GB) — Dành cho Sao lưu & Lưu trữ dung lượng lớn (Cold Storage)**:
   * Thư mục: `D:\PMCG-Backups\`.
   * Chứa các bản snapshot nén tự động mỗi ngày (`pmcg_backup_YYYY-MM-DD_HH-mm.db`).
   * Dung lượng 500GB có thể chứa hàng chục ngàn bản backup trong suốt nhiều năm mà không lo đầy ổ C.

---

## 5. 📋 KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT (5 BƯỚC THỰC HIỆN)

### BƯỚC 1: Tối ưu hóa BIOS & Windows 10 Pro trên Mini PC
1. **Cấu hình BIOS**:
   * Khởi động Mini PC, nhấn liên tục phím `Del` hoặc `F2` để vào BIOS.
   * Tìm menu `Power Management` / `Chipset`:
     * **Restore AC Power Loss**: Đặt thành `Power On` (Khi có điện lại máy sẽ tự bật, không cần bấm nút).
     * **Wake Up by RTC / Auto Power-On**: Nếu vẫn chọn tắt máy lúc 20h, đặt giờ tự bật vào `05:45:00` hàng ngày.
2. **Tối ưu nguồn điện Windows 10**:
   * Vào `Control Panel` -> `Power Options` -> Chọn profile **High Performance**.
   * Nhấn `Change plan settings` -> Đặt cả hai mục `Turn off the display` và `Put the computer to sleep` thành **Never**.
3. **Chặn Windows 10 Update tự restart**:
   * Nhấn tổ hợp `Win + R`, gõ `gpedit.msc` nhấn Enter.
   * Tìm đến: `Computer Configuration` -> `Administrative Templates` -> `Windows Components` -> `Windows Update`.
   * Kích hoạt chính sách: **No auto-restart with logged on users for scheduled automatic updates installations** -> Chọn `Enabled`.

---

### BƯỚC 2: Cài đặt LibSQL Engine (`sqld`) chạy dưới dạng Windows Service

1. **Chuẩn bị thư mục dữ liệu trên ổ C**:
   * Tạo thư mục: `C:\PMCG-Data`
   * Tạo thư mục: `C:\PMCG-Engine`
2. **Cài đặt Engine Database tương thích Turso**:
   * Tải bản phát hành của `sqld` (LibSQL Server binary) hoặc chạy qua Node.js LibSQL Pipeline Wrapper.
   * Tạo file cấu hình môi trường `C:\PMCG-Engine\config.env`:
     ```env
     SQLD_NODE=standalone
     SQLD_HTTP_LISTEN_ADDR=127.0.0.1:8080
     SQLD_DB_PATH=C:\PMCG-Data\pmcg.db
     SQLD_AUTH_JWT_KEY=your_secret_admin_token_2026
     ```
3. **Đăng ký chạy tự động cùng Windows bằng NSSM (Non-Sucking Service Manager)**:
   * Tải công cụ `nssm.exe` (miễn phí) chép vào `C:\PMCG-Engine\`.
   * Mở CMD với quyền Run as Administrator:
     ```cmd
     nssm.exe install PMCG_Database_Service "C:\PMCG-Engine\sqld.exe" "--config-path C:\PMCG-Engine\config.env"
     nssm.exe set PMCG_Database_Service AppDirectory "C:\PMCG-Engine"
     nssm.exe set PMCG_Database_Service Start SERVICE_AUTO_START
     nssm.exe start PMCG_Database_Service
     ```
   * *Kết quả*: Database luôn chạy ngầm ở port 8080 ngay khi máy có điện, không cần đăng nhập user.

---

### BƯỚC 3: Thiết lập Cloudflare Tunnel kết nối ra ngoài Internet

1. **Tạo Tunnel trên trang quản trị Cloudflare**:
   * Truy cập [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/) (miễn phí).
   * Vào mục: **Networks** -> **Tunnels** -> Nhấn **Create a tunnel**.
   * Đặt tên tunnel: `minipc-bvtks-db`.
   * Chọn môi trường: `Windows` (64-bit).
2. **Cài đặt Cloudflare Service trên Mini PC**:
   * Tải bộ cài `cloudflared-windows-amd64.msi` và cài đặt.
   * Copy mã cài đặt dịch vụ có chứa Token do Cloudflare cung cấp, chạy trong CMD (Admin):
     ```cmd
     cloudflared.exe service install <TOKEN_DO_CLOUDFLARE_CẤP>
     ```
3. **Định tuyến Subdomain về Mini PC**:
   * Trên giao diện Cloudflare Tunnel Dashboard: Thêm **Public Hostname**:
     * **Subdomain**: `db`
     * **Domain**: `xeplichthuthuat.io.vn` (Hoặc domain bạn đang quản lý)
     * **Type**: `HTTP`
     * **URL**: `localhost:8080`
   * *Xác nhận thành công*: Từ điện thoại (dùng 4G), mở trình duyệt truy cập `https://db.xeplichthuthuat.io.vn/version` hoặc `/health` -> Thấy phản hồi `OK` từ Mini PC là đã thông mạng hoàn toàn!

---

### BƯỚC 4: Di chuyển dữ liệu từ Turso về Mini PC & Cấu hình Backend

1. **Xuất dữ liệu hiện có từ Turso**:
   * Dùng Turso CLI trên máy dev:
     ```bash
     turso db dump pmcg-db > backup_turso_latest.sql
     ```
2. **Nạp dữ liệu vào Mini PC**:
   * Chép file `backup_turso_latest.sql` vào Mini PC:
     ```cmd
     sqlite3 C:\PMCG-Data\pmcg.db < backup_turso_latest.sql
     ```
   * Bật chế độ tối ưu và WAL mode:
     ```cmd
     sqlite3 C:\PMCG-Data\pmcg.db "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;"
     ```
3. **Cập nhật biến môi trường cho Cloudflare Worker Backend**:
   * Mở file cấu hình hoặc truy cập Dashboard Cloudflare Worker `pmcg-api` -> **Settings** -> **Variables**:
     * `TURSO_URL`: Sửa thành `https://db.xeplichthuthuat.io.vn`
     * `TURSO_TOKEN`: Sửa thành mã Token bí mật bạn đặt ở Bước 2
   * Deploy lại worker:
     ```bash
     cd backend && npm run deploy
     ```
4. **Kiểm tra nghiệp vụ**:
   * Đăng nhập tài khoản `bvtks_cs2`, kiểm tra danh sách bệnh nhân, phòng bệnh, chạy thử xếp lịch.

---

### BƯỚC 5: Thiết lập Kịch bản Tự động Sao lưu sang ổ HDD 500GB

1. **Tạo file Script PowerShell sao lưu**:
   * Tạo thư mục: `D:\PMCG-Backups`
   * Tạo file `D:\PMCG-Backups\auto_backup.ps1` với nội dung sau:
     ```powershell
     # Script tự động sao lưu an toàn SQLite Database
     $SourceDb = "C:\PMCG-Data\pmcg.db"
     $BackupDir = "D:\PMCG-Backups"
     $DateStr = Get-Date -Format "yyyy-MM-dd_HH-mm"
     $DestFile = "$BackupDir\pmcg_backup_$DateStr.db"

     # Thực hiện online backup bằng lệnh SQLite VACUUM INTO an toàn tuyệt đối
     & sqlite3 $SourceDb "VACUUM INTO '$DestFile';"

     # Tự động dọn dẹp các bản backup cũ hơn 90 ngày để tránh rác ổ đĩa
     Get-ChildItem -Path $BackupDir -Filter "pmcg_backup_*.db" | Where-Object {
         $_.CreationTime -lt (Get-Date).AddDays(-90)
     } | Remove-Item -Force
     ```
2. **Đặt lịch chạy tự động bằng Windows Task Scheduler**:
   * Mở `Task Scheduler` trên Windows 10 -> Nhấn **Create Task**:
     * **General**: Đặt tên `PMCG_Auto_Backup_HDD`, chọn *Run whether user is logged on or not*, tích chọn *Run with highest privileges*.
     * **Triggers**: Tạo 2 lịch kích hoạt hàng ngày:
       * Lịch 1: Đúng **12:00 PM** (Giờ nghỉ trưa).
       * Lịch 2: Đúng **18:50 PM** (Trước thời điểm tắt máy buổi tối).
     * **Actions**:
       * Program/script: `powershell.exe`
       * Add arguments: `-ExecutionPolicy Bypass -File "D:\PMCG-Backups\auto_backup.ps1"`

---

## 6. 🛡️ CHIẾN LƯỢC DỰ PHÒNG SONG SONG (FAILOVER)

Trong **14 ngày đầu tiên** sau khi chuyển đổi, để tránh bất kỳ gián đoạn nào đối với bệnh viện, áp dụng cơ chế dự phòng hai lớp:
1. **Không xóa database trên Turso Cloud**.
2. Trong Cloudflare Worker `backend/src/index.js`, giữ Turso làm điểm dự phòng khẩn cấp:
   * Nếu gửi truy vấn tới Mini PC bị timeout (> 4 giây do mạng viện chập chờn hoặc máy tính đang tắt), Worker tự động chuyển hướng gửi yêu cầu truy vấn sang Turso Cloud Database.
3. Khi hệ thống Mini PC chạy ổn định liên tục qua 2 tuần không có lỗi, bạn có thể chính thức ngắt hoàn toàn Turso Cloud.

---

## 7. ✅ CHECKLIST NGHIỆM THU HỆ THỐNG

- [ ] BIOS đã kích hoạt *Restore on AC Power Loss* và *Auto Power-On (05:45)*.
- [ ] Windows 10 đã tắt Sleep/Hibernate và tắt tự động reboot của Windows Update.
- [ ] Database Engine đã được đăng ký thành Windows Service (`SERVICE_AUTO_START`).
- [ ] Cloudflare Tunnel đã chạy ngầm và hiển thị trạng thái `HEALTHY` trên Dashboard.
- [ ] Thử nghiệm tắt nguồn Mini PC, cắm điện lại: Kiểm tra web ngoài mạng có tự vào lại được sau 60 giây không.
- [ ] Script backup chạy thành công và tạo file `.db` tại ổ `D:\PMCG-Backups`.
- [ ] Thử đăng nhập, xếp lịch, in phiếu và chốt công từ mạng ngoài (4G trên điện thoại).
