#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kiểm thử HTTP API của local-solver/server.py (GET /api/health và POST /api/solve)
"""

import sys
import os
import json
import time
import urllib.request
import urllib.parse
import threading

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

from server import ThreadingHTTPServer, SolverHTTPRequestHandler

def run_test():
    test_port = 5056
    server = ThreadingHTTPServer(("127.0.0.1", test_port), SolverHTTPRequestHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    print(f">>> Đã khởi chạy test server trên cổng {test_port}...")
    time.sleep(0.5)

    try:
        # 1. Test GET /api/health
        health_url = f"http://127.0.0.1:{test_port}/api/health"
        req = urllib.request.Request(health_url)
        with urllib.request.urlopen(req, timeout=2) as res:
            assert res.status == 200
            data = json.loads(res.read().decode("utf-8"))
            print(">>> GET /api/health OK:", data)
            assert data["status"] == "ok"
            assert data["ortoolsLoaded"] is True

        # 2. Test POST /api/solve
        solve_url = f"http://127.0.0.1:{test_port}/api/solve"
        payload = {
            "db": {
                "dateVal": "18/09/2026",
                "rawStaff": [
                    ["BS Nguyễn Văn A", "Bác sĩ", "Điện châm", "07:30-11:30", ""]
                ],
                "rawPatients": [
                    {
                        "pId": "BN001",
                        "name": "Bệnh Nhân A",
                        "ns": 1980,
                        "room": "Phòng 1",
                        "arrive": 450,
                        "leave": 690,
                        "loaiBN": "NoiTru",
                        "buoiDieuTri": "Sang",
                        "pending": ["Điện châm"]
                    }
                ],
                "thuThuatInfo": {
                    "điện châm": ["Điện châm", 25, 5, "YHCT", 1, 0, [], 5, 0, 0, 0, 0, 1]
                }
            },
            "options": {
                "timeLimitSeconds": 2.0,
                "numWorkers": 2
            }
        }

        req_data = json.dumps(payload).encode("utf-8")
        post_req = urllib.request.Request(
            solve_url,
            data=req_data,
            headers={"Content-Type": "application/json"}
        )

        with urllib.request.urlopen(post_req, timeout=5) as res:
            assert res.status == 200
            solve_res = json.loads(res.read().decode("utf-8"))
            print(">>> POST /api/solve OK:", {
                "success": solve_res.get("success"),
                "status": solve_res.get("status"),
                "scheduledCount": solve_res.get("scheduleCount"),
                "elapsedMs": solve_res.get("elapsedMs")
            })
            assert solve_res["success"] is True
            assert solve_res["scheduleCount"] == 1

        print(">>> TẤT CẢ KIỂM THỬ API REST CỦA LOCAL SOLVER ĐỀU THÀNH CÔNG!")
    finally:
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    run_test()
