@echo off
title emrHIS-AutoBot v2.0
cd /d "%~dp0"

echo ======================================================================
echo                  KHOI DONG emrHIS-AutoBot v2.0
echo ======================================================================
echo.
echo Dang kiem tra moi truong Python...

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python tren may tinh!
    echo Vui long cai dat Python va tick chon 'Add Python to PATH'.
    pause
    exit /b
)

echo Dang mo giao dien emrHIS-AutoBot...
python emrhis_bot.py

if %errorlevel% neq 0 (
    echo.
    echo [CHU Y] Chuong trinh ket thuc voi ma loi: %errorlevel%
    pause
)
