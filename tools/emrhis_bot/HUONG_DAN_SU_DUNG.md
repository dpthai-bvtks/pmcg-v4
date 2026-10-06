# 🤖 HƯỚNG DẪN SỬ DỤNG emrHIS-AutoBot v2.0
> **Công cụ tự động hóa nhập liệu thông tin Phẫu thuật - Thủ thuật vào phần mềm emrHIS từ PM-XếpLịch**

---

## 🚀 QUY TRÌNH 3 BƯỚC SIÊU TỐC

### Bước 1: Xuất lệnh từ PM-XếpLịch
1. Trên giao diện Web **PM-XếpLịch**, sau khi đã xếp lịch xong trong ngày.
2. Tại tab **LỊCH TRÌNH**, bấm nút màu xanh dương: **`🤖 XUẤT LỆNH emrHIS`** (nằm cạnh nút "XUẤT PDF" và "IN LỊCH").
3. Phần mềm sẽ:
   - **Tự động sao chép toàn bộ danh sách ca vào Bộ nhớ tạm (Clipboard)**.
   - Đồng thời tải về file dự phòng: `emrhis_tasks_[ngày].json`.

### Bước 2: Nạp dữ liệu vào emrHIS-AutoBot
1. Nhấp đúp chuột vào file **`CHAY_BOT_EMRHIS.bat`** để mở Bot.
2. Trên thanh công cụ của Bot, bấm nút:
   👉 **`📋 Dán từ Clipboard (PM-XếpLịch)`**
3. Toàn bộ danh sách ca thủ thuật, giờ bắt đầu, giờ kết thúc, kỹ thuật viên chính (mã `hdd`, `dpt`,...), máy y tế sẽ hiển thị ngay lập tức trên bảng danh sách.

---

## 🎯 2 CHẾ ĐỘ VẬN HÀNH TIỆN LỢI

### Chế độ 1: Điền siêu tốc Form đang mở (Phím tắt `[F8]`) - *Khuyên dùng hàng ngày*
*Cách này cực kỳ nhanh, an toàn và bạn luôn kiểm soát 100%:*
1. Bạn mở sẵn phần mềm **emrHIS**, chọn bệnh nhân và mở cửa sổ **"Cập Nhật Thông Tin Thủ Thuật"**.
2. Nhấn phím **`[F8]`** trên bàn phím (hoặc bấm nút **`⚡ ĐIỀN FORM ĐANG MỞ (F8)`** trên Bot).
3. Bot sẽ tự động:
   - Điền **Thời gian bắt đầu** (đúng định dạng `HH:mm dd/MM/yyyy`).
   - Điền **Thời gian kết thúc**.
   - Chọn **Tình hình PTTT**: *Chủ động*.
   - Chọn **Phương pháp vô cảm**: *Khác*.
   - Chọn **Máy y tế** (nếu ca đó có phân bổ máy).
   - Điền **Mô tả thủ thuật**: dấu `.`
   - Điền **Thủ thuật viên chính**: gõ mã nhân viên vào ô Nhân viên của dòng 1 bảng Ê-kíp.
   - Bấm nút **`Lưu + Đóng`** và tự động xác nhận thông báo!
4. Ca đó sẽ tự động đánh dấu `Hoàn thành` và chuyển sang ca kế tiếp trong danh sách.

### Chế độ 2: Tự động chạy hoàn toàn toàn bộ ca (Phím tắt `[F9]`)
1. Bật sẵn **emrHIS**, mở đúng phòng thủ thuật cần nhập.
2. Bấm nút **`▶️ CHẠY TỰ ĐỘNG (F9)`** trên Bot.
3. Bot sẽ tự động thực hiện tuần tự từng bệnh nhân:
   - Tìm kiếm họ tên bệnh nhân trong ô tìm kiếm $\rightarrow$ Chọn bệnh nhân.
   - Bấm *Bắt đầu thực hiện* $\rightarrow$ Tự bấm Có nếu có cảnh báo.
   - Chuột phải vào dòng thủ thuật $\rightarrow$ Chọn *Nhập Thông Tin PTTT*.
   - Tự động điền đầy đủ form và bấm *Lưu + Đóng*.
   - Chuyển sang bệnh nhân tiếp theo cho đến khi xong hết danh sách!

---

## 🎯 CÂN CHỈNH TỌA ĐỘ MÀN HÌNH (LÀM 1 LẦN DUY NHẤT)

Vì mỗi máy tính (laptop, máy bàn, minipc) có độ phân giải và kích thước cửa sổ khác nhau, bạn nên cân chỉnh 1 lần duy nhất:

1. Bấm nút **`🎯 Cân Chỉnh Tọa Độ`** trên thanh công cụ của Bot.
2. Một cửa sổ hướng dẫn từng bước sẽ hiện ra.
3. Làm theo hướng dẫn trên màn hình:
   - Rê chuột đến vị trí yêu cầu (ví dụ: ô Tìm kiếm bệnh nhân, nút Bắt đầu, ô Thời gian bắt đầu,...).
   - Nhấn phím **`[C]`** trên bàn phím để bot ghi nhận tọa độ.
   - Nếu ô nào không cần thiết, bấm nút **"⏭ Bỏ Qua Bước Này"**.
4. Sau khi xong, bấm **"💾 Lưu và Đóng"**. File cấu hình `emrhis_config.json` sẽ lưu lại vĩnh viễn cho máy tính của bạn.

---

## 🛑 BẢO VỆ AN TOÀN & PHÍM TẮT KHẨN CẤP

- **Dừng khẩn cấp**: Bấm phím **`[ESC]`** hoặc **`[F12]`** bất kỳ lúc nào để Bot lập tức dừng lại mọi thao tác chuột và phím.
- **Fail-Safe cơ học**: Di chuột thật nhanh vào **góc trên cùng bên trái màn hình** (tọa độ 0, 0) - cơ chế bảo vệ của hệ thống sẽ ngắt Bot ngay lập tức.
- **Thanh điều chỉnh tốc độ**: Kéo thanh trượt trễ (0.15s - 1.5s) trên Bot để tăng/giảm tốc độ phù hợp với độ phản hồi nhanh hay chậm của phần mềm emrHIS tại viện.
