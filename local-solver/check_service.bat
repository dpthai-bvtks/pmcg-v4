@echo off
chcp 65001 > nul
title [PMCG] Kiểm Tra Trạm Tính Toán CP-SAT

echo ============================================================
echo  KIEM TRA TRANG THAI TRAM GIAI TOAN CP-SAT (CONG 5055)
echo ============================================================
echo.

set TASK_NAME=PMCG-OR-Tools-Solver-5055

:: ---- Kiểm tra Scheduled Task ----
echo [1] Trang thai Scheduled Task:
schtasks /query /tn "%TASK_NAME%" /fo LIST 2>nul | findstr /i "Status Task Name Next Run"
if %errorlevel% neq 0 (
    echo     -> Chua cai dat (chay install_service.bat truoc)
)
echo.

:: ---- Kiểm tra tiến trình Python trên cổng 5055 ----
echo [2] Tien trinh dang lang nghe cong 5055:
netstat -aon 2>nul | findstr ":5055 " | findstr "LISTENING"
if %errorlevel% neq 0 (
    echo     -> Khong co tien trinh nao lang nghe cong 5055 (Tram dang tat)
)
echo.

:: ---- Gọi API health check ----
echo [3] Ket qua kiem tra API (http://127.0.0.1:5055/api/health):
curl -s --max-time 2 http://127.0.0.1:5055/api/health 2>nul
if %errorlevel% neq 0 (
    echo     -> Khong ket noi duoc (Tram dang tat hoac chua san sang)
)
echo.
echo ============================================================

:: ---- Hỏi người dùng có muốn khởi động/dừng không ----
echo.
echo Tuy chon:
echo   [1] Khoi dong Tram ngay bay gio (start task)
echo   [2] Dung Tram ngay bay gio (stop + kill port 5055)
echo   [3] Thoat
echo.
set /p choice=Chon so (1/2/3): 

if "%choice%"=="1" (
    echo.
    net session >nul 2>&1
    if %errorlevel% neq 0 (
        echo [LOI] Can quyen Administrator de chay Task.
    ) else (
        schtasks /run /tn "%TASK_NAME%" >nul 2>&1
        echo [OK] Da yeu cau khoi dong Tram. Doi vai giay roi thu lai.
    )
)

if "%choice%"=="2" (
    echo.
    schtasks /end /tn "%TASK_NAME%" >nul 2>&1
    for /f "tokens=5" %%i in ('netstat -aon 2^>nul ^| findstr ":5055 " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%i >nul 2>&1
        echo [OK] Da tat tien trinh PID %%i tren cong 5055.
    )
    echo [OK] Tram da dung.
)

echo.
pause
