@echo off
chcp 65001 > nul
title [PMCG] Gỡ Cài Đặt Trạm Tính Toán CP-SAT

echo ============================================================
echo  GO CAI DAT TRAM GIAI TOAN GOOGLE OR-TOOLS CP-SAT
echo ============================================================
echo.

set TASK_NAME=PMCG-OR-Tools-Solver-5055

:: ---- Kiểm tra quyền Administrator ----
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Can chay voi quyen Administrator!
    echo Nhan chuot phai vao file nay -> "Run as administrator"
    pause
    exit /b 1
)

:: ---- Dừng task đang chạy ----
echo [INFO] Dang dung Tram giai toan...
schtasks /end /tn "%TASK_NAME%" >nul 2>&1

:: ---- Tìm và kill tiến trình Python đang lắng nghe cổng 5055 ----
echo [INFO] Dang tat tien trinh tren cong 5055...
for /f "tokens=5" %%i in ('netstat -aon 2^>nul ^| findstr ":5055 " ^| findstr "LISTENING"') do (
    echo [INFO] Dang tat tien trinh PID: %%i
    taskkill /f /pid %%i >nul 2>&1
)

:: ---- Xóa Scheduled Task ----
echo [INFO] Dang xoa Scheduled Task...
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

if %errorlevel% == 0 (
    echo [OK] Da xoa Task: %TASK_NAME%
) else (
    echo [INFO] Task khong ton tai hoac da bi xoa tu truoc.
)

echo.
echo [OK] Go cai dat hoan tat. Tram se KHONG tu dong chay khi Windows bat len nua.
echo.
pause
