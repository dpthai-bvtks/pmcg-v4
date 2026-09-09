# HƯỚNG DẪN SỬ DỤNG CÔNG CỤ TỰ ĐỘNG NHẬP HIS (AUTO-HIS IMPORTER)

Công cụ giúp tự động hóa 100% quá trình nhập ca thủ thuật từ phần mềm **PM-xeplich** vào phần mềm bệnh viện **emrHIS (v2026.9.7.2)**.

---

## 1. Khởi động công cụ
- Vào thư mục: `PM-xeplich/khung_pm/ban_web/v4-thuongmai/tools/his_importer/`
- Nhấp đúp chuột vào file: **`run_auto_his.bat`**
- Cửa sổ giao diện đồ họa **T.I.M.E.S - Auto-HIS Importer** sẽ hiện lên.

---

## 2. Quy trình làm việc (Chỉ 3 bước đơn giản)

### 🔹 BƯỚC 1: Xuất dữ liệu từ Web PM-xeplich
1. Trên trình duyệt web, vào mục **Xếp Lịch** (bảng danh sách ca đã xếp).
2. Bấm nút màu xanh dương: **`⚡ Xuất HIS Auto`**.
3. Hệ thống sẽ:
   - Tự động **Sao chép dữ liệu vào Clipboard**.
   - Tự động tải file `his_schedule_YYYY-MM-DD.json` về máy để lưu trữ.

---

### 🔹 BƯỚC 2: Nạp dữ liệu vào công cụ Auto-HIS
1. Trên cửa sổ **Auto-HIS Importer**, bấm nút: **`📋 Dán từ Clipboard`** (hoặc bấm *Mở file his_schedule.json*).
2. Hệ thống sẽ tự động:
   - Phân tích danh sách ca.
   - Gom nhóm toàn bộ ca theo từng **Nhân viên**.
   - Tự động xác định ca nào là ca cuối cùng trong ngày của bệnh nhân để chuẩn bị bấm **Trả Kết Quả**.

---

### 🔹 BƯỚC 3: Đăng nhập tài khoản & Bắt đầu nhập
1. Trên phần mềm **emrHIS**, đảm bảo bạn đang đăng nhập tài khoản của nhân viên tương ứng (ví dụ: *Phan Thị Thu Hiền*) và đang ở phân hệ **Chuyên Khoa, PTTT**.
2. Trên công cụ **Auto-HIS Importer**, chọn đúng tên nhân viên đó tại ô **Nhân viên**.
3. Bấm nút màu xanh lá cây: **`▶️ BẮT ĐẦU NHẬP TỰ ĐỘNG`**.
4. Công cụ sẽ tự động:
   - Kích hoạt cửa sổ `emrHIS`.
   - Tìm bệnh nhân theo họ tên đầy đủ (ví dụ: *Hoàng Thế Dân*).
   - Click chọn bệnh nhân trong danh sách.
   - Bấm **`Bắt đầu thực hiện`** -> xác nhận **`Có`** (nếu chưa thực hiện).
   - Chuột phải vào từng thủ thuật -> chọn **`Nhập Thông Tin PTTT`**.
   - Click chuột và điền chính xác từng trường:
     - **Thời gian bắt đầu \*** (hh:mm dd/MM/yyyy).
     - **Thời gian kết thúc \*** (hh:mm dd/MM/yyyy).
     - **Phương pháp vô cảm \***: `Khác`.
     - **Tình hình PTTT \***: `Chủ động`.
     - **Máy y tế**: Theo máy đã xếp.
     - **Mô tả thủ thuật**: `.`.
     - **Ê-kíp thực hiện**: TT viên chính.
     - Bấm **`💾 Lưu + Đóng`**.
   - Sau khi hoàn thành thủ thuật cuối của bệnh nhân: Tự động bấm nút **`Trả Kết Quả`** ở góc dưới bên phải màn hình HIS!
5. Khi hoàn tất nhân viên đó, chuyển sang đăng nhập nhân viên tiếp theo và lặp lại bước 3.

---

## 3. Phím Tắt Khẩn Cấp (An toàn tuyệt đối)
- Bất kỳ lúc nào bạn muốn dừng ngay lập tức mọi thao tác chuột/phím của robot, chỉ cần nhấn phím:
  👉 **`F12`** trên bàn phím.
- Hoặc bấm nút đỏ **`🛑 DỪNG KHẨN CẤP (F12)`** trên màn hình. Robot sẽ lập tức giải phóng chuột phím và nhả quyền điều khiển lại cho bạn.
