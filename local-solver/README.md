# 🏥 TRẠM TÍNH TOÁN GOOGLE OR-TOOLS CP-SAT CỤC BỘ (C:\PMCG-System\PMCG-Solver)
> Dành cho Mini PC Công Nghiệp Bệnh Viện (Core i5-4350U, 4 luồng C++ Native)
> Cổng lắng nghe: 5055 | Giao thức: HTTP REST JSON

## 📂 Danh mục tệp tin:
1. `server.py`: HTTP REST API Server xử lý các request `/api/health` và `/api/solve` từ Web App.
2. `solver.py`: Nhân giải toán quy hoạch ràng buộc chuyên sâu Google OR-Tools CP-SAT 4 luồng song song.
3. `check_service.bat`: Kiểm tra trạng thái dịch vụ Scheduled Task, cổng mạng 5055 và kết quả API.
4. `start_solver.bat`: Chạy trực tiếp qua cửa sổ dòng lệnh CMD (nếu không dùng Task ngầm).
5. `install_service.bat`: Cài đặt và đăng ký Scheduled Task `PMCG_ORTools_Solver` khởi động cùng Windows dưới quyền SYSTEM.
6. `uninstall_service.bat`: Gỡ bỏ Scheduled Task và tắt tiến trình cổng 5055.
7. `test_solver.py`: Kịch bản kiểm thử thuật toán CP-SAT độc lập (Optimal trong ~130ms).
8. `test_server.py`: Kịch bản kiểm thử API REST server trên cổng thử nghiệm.
9. `run_solver.cmd`: Wrapper thực thi ngầm và ghi log `solver.log` cho Task Scheduler.

## 🚀 Cách thức hoạt động:
- Trạm chạy ngầm dưới quyền `NT AUTHORITY\SYSTEM` ngay từ khi bật nguồn Mini PC (`BootTrigger`).
- Không phụ thuộc vào việc đăng nhập tài khoản Windows hay khởi động Google Drive.
- Web App tự động nhận diện `🟢 Trạm Mini PC: Sẵn sàng` khi kết nối vào mạng LAN hoặc localhost.
