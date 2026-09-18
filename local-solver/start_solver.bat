@echo off
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
title [MiniPC] Trạm Tính Toán Google OR-Tools CP-SAT (Cổng 5055)
echo ========================================================
echo  TRẠM TÍNH TOÁN CỤC BỘ GOOGLE OR-TOOLS CP-SAT (PORT 5055)
echo  Hệ thống Xếp lịch YHCT - PHCN v4-thuongmai
echo  Thư mục thực thi: C:\PMCG-System\PMCG-Solver
echo ========================================================

:: Kiểm tra nếu dịch vụ ngầm đang chạy
netstat -aon 2>nul | findstr ":5055 " | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [THÔNG BÁO] Trạm tính toán cổng 5055 ĐÃ ĐANG CHẠY NGẦM qua Windows Service.
    echo Bạn không cần mở cửa sổ này. Trình duyệt web đã có thể kết nối ngay!
    echo.
    curl -s http://127.0.0.1:5055/api/health
    echo.
    pause
    exit /b 0
)

echo Đang khởi động trực tiếp từ C:\PMCG-System\PMCG-Solver...
cd /d "C:\PMCG-System\PMCG-Solver"
C:\Python314\python.exe -u "C:\PMCG-System\PMCG-Solver\server.py" --port 5055
pause
