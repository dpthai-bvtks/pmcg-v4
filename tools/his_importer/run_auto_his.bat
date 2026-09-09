@echo off
chcp 65001 > nul
title T.I.M.E.S - Auto-HIS Importer
echo ========================================================
echo   ⚡ T.I.M.E.S - KHỞI ĐỘNG CÔNG CỤ TỰ ĐỘNG NHẬP HIS
echo ========================================================
echo.
cd /d "%~dp0"
"C:\Python314\python.exe" app_gui.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Co loi xay ra khi chay chuong trinh!
    pause
)
