@echo off
chcp 65001 > nul
title TIMES - Auto-HIS Importer
echo ========================================================
echo   [TIMES] - KHOI DONG CONG CU TU DONG NHAP HIS
echo ========================================================
echo.
cd /d "%~dp0"
"C:\Python314\python.exe" app_gui.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Co loi xay ra khi chay chuong trinh!
    pause
)
