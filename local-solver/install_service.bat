@echo off
chcp 65001 > nul
title [PMCG] Cài Đặt Trạm Tính Toán CP-SAT (C:\PMCG-System\PMCG-Solver)

echo ============================================================
echo  CAI DAT TRAM GIAI TOAN GOOGLE OR-TOOLS CP-SAT
echo  Tu dong chay ngam khi khoi dong Windows (SYSTEM BootTrigger)
echo  Hoan toan doc lap voi Google Drive - Luon san sang tai cong 5055
echo ============================================================
echo.

:: ---- Kiem tra quyen Administrator ----
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Can chay voi quyen Administrator!
    echo Nhan chuot phai vao file nay ^> "Run as administrator"
    pause
    exit /b 1
)

set TARGET_DIR=C:\PMCG-System\PMCG-Solver
set TASK_NAME=PMCG_ORTools_Solver
set LOG=%TARGET_DIR%\solver.log

echo [INFO] Thu muc dich : %TARGET_DIR%
echo [INFO] Task Name    : %TASK_NAME%
echo.

:: ---- Tao thu muc C:\PMCG-System\PMCG-Solver neu chua co ----
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: ---- Sao chep ma nguon solver sang C:\PMCG-System\PMCG-Solver ----
echo [INFO] Dang copy ma nguon sang %TARGET_DIR%...
copy /y "%~dp0server.py" "%TARGET_DIR%\server.py" >nul
copy /y "%~dp0solver.py" "%TARGET_DIR%\solver.py" >nul
if exist "%~dp0requirements.txt" copy /y "%~dp0requirements.txt" "%TARGET_DIR%\requirements.txt" >nul
if exist "%~dp0test_solver.py" copy /y "%~dp0test_solver.py" "%TARGET_DIR%\test_solver.py" >nul

:: ---- Tao file run_solver.cmd tai TARGET_DIR ----
echo @echo off > "%TARGET_DIR%\run_solver.cmd"
echo set PYTHONIOENCODING=utf-8 >> "%TARGET_DIR%\run_solver.cmd"
echo cd /d "%TARGET_DIR%" >> "%TARGET_DIR%\run_solver.cmd"
echo C:\Python314\python.exe -u "%TARGET_DIR%\server.py" --port 5055 ^>^> "%LOG%" 2^>^&1 >> "%TARGET_DIR%\run_solver.cmd"

:: ---- Dung va xoa task cu neu co ----
schtasks /end /tn "%TASK_NAME%" >nul 2>&1
schtasks /end /tn "PMCG-OR-Tools-Solver-5055" >nul 2>&1
for /f "tokens=5" %%i in ('netstat -aon 2^>nul ^| findstr ":5055 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%i >nul 2>&1
)
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
schtasks /delete /tn "PMCG-OR-Tools-Solver-5055" /f >nul 2>&1

:: ---- Dang ky Task Scheduler SYSTEM BootTrigger qua PowerShell ----
set PS_CMD=powershell -NonInteractive -Command ^
"$act = New-ScheduledTaskAction -Execute 'C:\Python314\python.exe' -Argument '-u C:\PMCG-System\PMCG-Solver\server.py --port 5055' -WorkingDirectory 'C:\PMCG-System\PMCG-Solver'; ^
 $trig = New-ScheduledTaskTrigger -AtStartup; ^
 $prin = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest; ^
 $set = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries; ^
 Register-ScheduledTask -TaskName '%TASK_NAME%' -Action $act -Trigger $trig -Principal $prin -Settings $set -Force | Out-Null; ^
 Start-ScheduledTask -TaskName '%TASK_NAME%'; ^
 Start-Sleep 2; ^
 try { $h = Invoke-RestMethod 'http://127.0.0.1:5055/api/health' -TimeoutSec 3; Write-Host ('STATUS:' + $h.status) } catch { Write-Host 'STATUS:offline' }"

%PS_CMD%

if %errorlevel% == 0 (
    echo.
    echo ============================================================
    echo  HOAN TAT! Tram giai toan da chay ngam tai cong 5055.
    echo  - Duong dan: %TARGET_DIR%
    echo  - Tu dong bat cung Windows (khong can dang nhap hay mo Google Drive)
    echo  - Kiem tra: http://127.0.0.1:5055/api/health
    echo ============================================================
) else (
    echo [LOI] Co su co khi dang ky Scheduled Task.
)
pause
