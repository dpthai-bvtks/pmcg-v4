@echo off
chcp 65001 > nul
title [PMCG] Đồng Bộ Mã Nguồn Solver Sang C:\PMCG-System\PMCG-Solver

echo ============================================================
echo  DONG BO MA NGUON SOLVER SANG C:\PMCG-System\PMCG-Solver
echo ============================================================
echo.

set TARGET_DIR=C:\PMCG-System\PMCG-Solver
set TASK_NAME=PMCG_ORTools_Solver

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [1] Dang copy server.py...
copy /y "%~dp0server.py" "%TARGET_DIR%\server.py" >nul

echo [2] Dang copy solver.py...
copy /y "%~dp0solver.py" "%TARGET_DIR%\solver.py" >nul

echo [3] Dang khoi dong lai dich vu solver...
schtasks /end /tn "%TASK_NAME%" >nul 2>&1
for /f "tokens=5" %%i in ('netstat -aon 2^>nul ^| findstr ":5055 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%i >nul 2>&1
)
schtasks /run /tn "%TASK_NAME%" >nul 2>&1

timeout /t 2 /nobreak >nul
curl -s --max-time 2 http://127.0.0.1:5055/api/health
echo.
echo [OK] Da dong bo va restart thanh cong!
echo.
pause
