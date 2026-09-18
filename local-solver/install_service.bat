@echo off
chcp 65001 > nul
title [PMCG] Cài Đặt Trạm Tính Toán CP-SAT - Windows Scheduled Task

echo ============================================================
echo  CAI DAT TRAM GIAI TOAN GOOGLE OR-TOOLS CP-SAT
echo  Tu dong chay ngam khi dang nhap Windows (Task Scheduler)
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

set TASK_NAME=PMCG-OR-Tools-Solver-5055
set WRAPPER=%~dp0run_solver_task.cmd
set LOG=%~dp0solver.log

echo [INFO] Task    : %TASK_NAME%
echo [INFO] Wrapper : %WRAPPER%
echo [INFO] Log     : %LOG%
echo.

:: ---- Tat va xoa task cu neu ton tai ----
schtasks /end /tn "%TASK_NAME%" >nul 2>&1
for /f "tokens=5" %%i in ('netstat -aon 2^>nul ^| findstr ":5055 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%i >nul 2>&1
)
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: ---- Dung PowerShell de tao Scheduled Task (xu ly duong dan co khoang trang) ----
set PS_CMD=powershell -NonInteractive -Command ^
"$u='%USERDOMAIN%\%USERNAME%'; ^
 $a=New-ScheduledTaskAction -Execute 'cmd.exe' -Argument ('/c \"' + '%WRAPPER%' + '\"'); ^
 $t=New-ScheduledTaskTrigger -AtLogOn -User $u; ^
 $s=New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1); ^
 $p=New-ScheduledTaskPrincipal -UserId $u -RunLevel Highest -LogonType Interactive; ^
 Register-ScheduledTask -TaskName '%TASK_NAME%' -Action $a -Trigger $t -Settings $s -Principal $p -Force | Out-Null; ^
 Start-ScheduledTask -TaskName '%TASK_NAME%'; ^
 Start-Sleep 3; ^
 try { $h=Invoke-RestMethod 'http://127.0.0.1:5055/api/health' -TimeoutSec 3; Write-Host ('STATUS:' + $h.status) } catch { Write-Host 'STATUS:offline' }"

%PS_CMD%

if %errorlevel% == 0 (
    echo.
    echo ============================================================
    echo  HOAN TAT! Tram giai toan da chay ngam tai cong 5055.
    echo  - Mo trinh duyet: http://127.0.0.1:5055/api/health
    echo  - Xem log: %LOG%
    echo  - De tat/go: Chay uninstall_service.bat (quyen Admin)
    echo  - Kiem tra: Chay check_service.bat
    echo ============================================================
) else (
    echo [LOI] Co su co. Xem log: %LOG%
)
pause
