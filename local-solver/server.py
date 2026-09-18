#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🏥 TRẠM TÍNH TOÁN GOOGLE OR-TOOLS CP-SAT CỤC BỘ (LOCAL SOLVER SERVER)
Dành cho Mini PC & Mạng nội bộ Bệnh viện / Phòng khám (v4-thuongmai)
Cung cấp REST API HTTP/JSON chạy song song với ứng dụng Web.
"""

import sys
import os
import json
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver
import traceback

# Đảm bảo đường dẫn import solver.py cùng thư mục
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    from solver import solve_schedule
    ORTOOLS_AVAILABLE = True
except Exception as e:
    solve_schedule = None
    ORTOOLS_AVAILABLE = False
    _import_err = str(e)


class SolverHTTPRequestHandler(BaseHTTPRequestHandler):
    """Bộ xử lý HTTP Request với hỗ trợ đầy đủ CORS cho Web Browser"""

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        """Xử lý preflight CORS request từ trình duyệt web"""
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Kiểm tra tình trạng hoạt động của Trạm tính toán Mini PC"""
        path = self.path.split("?")[0]
        if path in ("/", "/api/health", "/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._set_cors_headers()
            self.end_headers()

            status_obj = {
                "status": "ok" if ORTOOLS_AVAILABLE else "degraded",
                "engine": "Google OR-Tools CP-SAT",
                "version": "4.1.1",
                "ortoolsLoaded": ORTOOLS_AVAILABLE,
                "workers": 4,
                "device": "Mini PC Station (Core i5-4350U)",
                "description": "Trạm giải toán quy hoạch xếp lịch YHCT - PHCN v4-thuongmai"
            }
            if not ORTOOLS_AVAILABLE:
                status_obj["error"] = _import_err

            self.wfile.write(json.dumps(status_obj, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Not Found"}')

    def do_POST(self):
        """Nhận payload từ Web App và kích hoạt giải toán Google OR-Tools CP-SAT"""
        path = self.path.split("?")[0]
        if path not in ("/api/solve", "/solve"):
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Endpoint not found"}')
            return

        if not ORTOOLS_AVAILABLE:
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._set_cors_headers()
            self.end_headers()
            res = {
                "success": False,
                "error": f"Google OR-Tools chưa sẵn sàng trên Mini PC: {_import_err}"
            }
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                raise ValueError("Nội dung payload trống (Content-Length: 0)")

            raw_body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(raw_body)

            db = payload.get("db", {})
            options = payload.get("options", {})

            # Kích hoạt bộ giải toán C++ native thông qua Python wrapper
            solve_result = solve_schedule(db, options)
            solve_result["success"] = True

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._set_cors_headers()
            self.end_headers()

            self.wfile.write(json.dumps(solve_result, ensure_ascii=False).encode("utf-8"))

        except Exception as ex:
            traceback.print_exc()
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._set_cors_headers()
            self.end_headers()
            error_res = {
                "success": False,
                "error": str(ex),
                "trace": traceback.format_exc()
            }
            self.wfile.write(json.dumps(error_res, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        """Định dạng log ngắn gọn, chuyên nghiệp"""
        sys.stderr.write(f"[{self.log_date_time_string()}] [MiniPC-Solver] {format % args}\n")


class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True


def run_server(port: int = 5055):
    server_address = ("0.0.0.0", port)
    httpd = ThreadingHTTPServer(server_address, SolverHTTPRequestHandler)
    print("=" * 60)
    print(f" 🚀 TRẠM GIẢI TOÁN GOOGLE OR-TOOLS CP-SAT ĐÃ KHỞI ĐỘNG THÀNH CÔNG")
    print(f" 🌐 Địa chỉ lắng nghe: http://127.0.0.1:{port} (hoặc IP mạng LAN)")
    print(f" ⚡ Nhân tính toán: 4 Luồng C++ Native (Tối ưu hóa đa nhân CPU Mini PC)")
    print(f" 🔗 Sẵn sàng tiếp nhận yêu cầu từ Web App v4-thuongmai")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Đang dừng Trạm tính toán Mini PC...")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mini PC Google OR-Tools Local Solver Server")
    parser.add_argument("--port", type=int, default=5055, help="Cổng mạng lắng nghe HTTP (mặc định: 5055)")
    args = parser.parse_args()
    run_server(args.port)
