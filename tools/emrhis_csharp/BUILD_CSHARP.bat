@echo off
title Bien dich QuickFillHIS.exe (C# Native)
cd /d "%~dp0"

echo ======================================================================
echo          BIEN DICH QuickFillHIS.exe (C# .NET Native Automation)
echo ======================================================================
echo.

set CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe

if not exist "%CSC%" (
    echo [LOI] Khong tim thay csc.exe tai %CSC%!
    pause
    exit /b 1
)

echo Dang bien dich QuickFillHIS.cs...
"%CSC%" /target:winexe /optimize+ /out:QuickFillHIS.exe ^
    /reference:System.Windows.Forms.dll ^
    /reference:System.Drawing.dll ^
    /reference:C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF\WindowsBase.dll ^
    /reference:C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF\UIAutomationClient.dll ^
    /reference:C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF\UIAutomationTypes.dll ^
    QuickFillHIS.cs

if %errorlevel% neq 0 (
    echo.
    echo [LOI] Bien dich that bai! Vui long kiem tra thong bao tren.
    pause
    exit /b %errorlevel%
)

echo.
echo ======================================================================
echo  [THANH CONG] Da tao thanh cong file QuickFillHIS.exe (22 KB)!
echo  Chay doc lap 100%%, khong can Python!
echo ======================================================================
echo.
pause
