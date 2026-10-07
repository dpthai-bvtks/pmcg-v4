@echo off
title QuickFillHIS (C# Native)
cd /d "%~dp0"
if not exist "QuickFillHIS.exe" (
    call BUILD_CSHARP.bat
)
start "" "QuickFillHIS.exe"
