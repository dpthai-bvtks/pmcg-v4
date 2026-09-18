@echo off
chcp 65001 > nul
echo ========================================================
echo  [MiniPC] CÀI ĐẶT GOOGLE OR-TOOLS CHO TRẠM TÍNH TOÁN
echo ========================================================
echo Đang kiểm tra Python và cài đặt gói thư viện ortools...
python -m pip install -r "%~dp0requirements.txt"
if %errorlevel% neq 0 (
    echo [LỖI] Cài đặt thất bại. Vui lòng kiểm tra lại Python và kết nối mạng.
) else (
    echo [THÀNH CÔNG] Đã cài đặt xong Google OR-Tools CP-SAT!
)
pause
