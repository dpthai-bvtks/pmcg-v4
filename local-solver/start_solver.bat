@echo off
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
title [MiniPC] Trạm Tính Toán Google OR-Tools CP-SAT (Cổng 5055)
echo ========================================================
echo  TRẠM TÍNH TOÁN CỤC BỘ GOOGLE OR-TOOLS CP-SAT (PORT 5055)
echo  Hệ thống Xếp lịch YHCT - PHCN v4-thuongmai
echo ========================================================
echo Đang lắng nghe yêu cầu tính toán từ Trình duyệt Web...
echo (Để cửa sổ này chạy ngầm hoặc thu nhỏ xuống taskbar)
python "%~dp0server.py" --port 5055
pause
