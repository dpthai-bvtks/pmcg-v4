@echo off
:: Wrapper script cho Windows Scheduled Task
:: File nay duoc goi boi Task Scheduler de chay Tram giai toan CP-SAT
set PYTHONIOENCODING=utf-8
set SOLVER_DIR=%~dp0
cd /d "%SOLVER_DIR%"
C:\Python314\python.exe -u "%SOLVER_DIR%server.py" --port 5055 >> "%SOLVER_DIR%solver.log" 2>&1
