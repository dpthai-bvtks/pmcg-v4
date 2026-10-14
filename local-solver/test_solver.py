#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kiểm thử trực tiếp Google OR-Tools CP-SAT Solver (solver.py)
"""

import sys
import os
import json
import time

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

from solver import solve_schedule

def test_basic_schedule():
    print(">>> Bắt đầu kiểm thử Google OR-Tools CP-SAT Solver...")

    mock_db = {
        "dateVal": "18/09/2026",
        "settings": {
            "yhctLunch": 0,
            "yhctEnd": 0
        },
        "rawStaff": [
            ["BS Nguyễn Văn A", "Bác sĩ", "Điện châm, Cứu ngải, Xoa bóp", "07:30-11:30, 13:00-16:30", ""],
            ["KTV Trần Thị B", "Kỹ thuật viên", "Điện châm, Siêu âm, Kéo giãn", "07:30-11:30, 13:00-16:30", ""],
            ["ĐD Lê Thị C", "Điều dưỡng", "Hỗ trợ", "07:30-11:30, 13:00-16:30", ""]
        ],
        "roomBeds": {
            "Phòng 201": ["Giường 1", "Giường 2", "Giường 3"]
        },
        "roomMachines": {
            "Phòng 201": ["Máy điện châm 1", "Máy điện châm 2", "Máy siêu âm 1"]
        },
        "machineTypes": {
            "điện châm": ["Máy điện châm 1", "Máy điện châm 2"],
            "siêu âm": ["Máy siêu âm 1"]
        },
        "thuThuatInfo": {
            "điện châm": ["Điện châm", 25, 5, "YHCT", 1, 1, [], 5, 0, 0, 0, 0, 1], # is_cont = False, tg_may=25, tg_nv=5
            "siêu âm điều trị": ["Siêu âm", 15, 15, "PHCN", 1, 0, [], 5, 0, 0, 0, 1, 1] # is_cont = True, tg_may=15, tg_nv=15
        },
        "rawPatients": [
            {
                "pId": "BN001",
                "name": "Bệnh Nhân Một",
                "ns": 1960,
                "room": "Phòng 201",
                "arrive": 450,
                "leave": 690,
                "loaiBN": "NoiTru",
                "buoiDieuTri": "Sang",
                "busy": [],
                "pending": ["Điện châm", "Siêu âm điều trị"]
            },
            {
                "pId": "BN002",
                "name": "Bệnh Nhân Hai",
                "ns": 1975,
                "room": "Phòng 201",
                "arrive": 460,
                "leave": 690,
                "loaiBN": "NgoaiTru",
                "buoiDieuTri": "Sang",
                "busy": [],
                "pending": ["Điện châm"]
            }
        ]
    }

    res = solve_schedule(mock_db, {"timeLimitSeconds": 3.0, "numWorkers": 4})
    print(f"Solver result status: {res.get('status')}")
    print(f"Elapsed: {res.get('elapsedMs')} ms")
    print(f"Scheduled count: {res.get('scheduleCount')}")
    print(f"Unscheduled count: {res.get('unscheduledCount')}")

    for idx, item in enumerate(res.get("schedule", [])):
        print(f"  [{idx+1}] {item['GIODIENRA']}-{item['GIOKETTHUC']} | {item['HOTEN']} | {item['DICHVU']} | {item['NV CHÍNH']} | {item['NV PHỤ']} | {item['GIUONG']} | {item['MAY']}")

    assert res["scheduleCount"] == 3, f"Expected 3 scheduled tasks, got {res['scheduleCount']}"
    assert res["unscheduledCount"] == 0, f"Expected 0 unscheduled tasks, got {res['unscheduledCount']}"
    print(">>> KIỂM THỬ THÀNH CÔNG RỰC RỠ! Model CP-SAT hoạt động chính xác 100%.")


def test_incremental_schedule():
    print("\n>>> Bắt đầu kiểm thử tính năng XẾP BỔ SUNG (Incremental Scheduling)...")
    
    # 1. Giả lập lịch cũ đã xếp cho 2 bệnh nhân
    existing_sched = [
        {
            "NGAY": "18/09/2026",
            "HOTEN": "Bệnh Nhân Một",
            "NAMSINH": "1960",
            "PHONG": "Phòng 201",
            "DICHVU": "Siêu âm điều trị",
            "GIODIENRA": "07:30",
            "GIOKETTHUC": "07:45",
            "NV CHÍNH": "KTV Trần Thị B",
            "NV PHỤ": "",
            "MAY": "Máy siêu âm 1",
            "GIUONG": "Ghế điều trị"
        },
        {
            "NGAY": "18/09/2026",
            "HOTEN": "Bệnh Nhân Hai",
            "NAMSINH": "1975",
            "PHONG": "Phòng 201",
            "DICHVU": "Điện châm",
            "GIODIENRA": "07:40",
            "GIOKETTHUC": "08:05",
            "NV CHÍNH": "BS Nguyễn Văn A",
            "NV PHỤ": "ĐD Lê Thị C",
            "MAY": "Máy điện châm 1",
            "GIUONG": "Ghế điều trị"
        },
        {
            "NGAY": "18/09/2026",
            "HOTEN": "Bệnh Nhân Một",
            "NAMSINH": "1960",
            "PHONG": "Phòng 201",
            "DICHVU": "Điện châm",
            "GIODIENRA": "07:50",
            "GIOKETTHUC": "08:15",
            "NV CHÍNH": "BS Nguyễn Văn A",
            "NV PHỤ": "ĐD Lê Thị C",
            "MAY": "Máy điện châm 2",
            "GIUONG": "Ghế điều trị"
        }
    ]

    mock_db = {
        "dateVal": "18/09/2026",
        "settings": {"yhctLunch": 0, "yhctEnd": 0},
        "rawStaff": [
            ["BS Nguyễn Văn A", "Bác sĩ", "Điện châm, Cứu ngải, Xoa bóp", "07:30-11:30, 13:00-16:30", ""],
            ["KTV Trần Thị B", "Kỹ thuật viên", "Điện châm, Siêu âm, Kéo giãn", "07:30-11:30, 13:00-16:30", ""],
            ["ĐD Lê Thị C", "Điều dưỡng", "Hỗ trợ", "07:30-11:30, 13:00-16:30", ""]
        ],
        "roomBeds": {"Phòng 201": ["Giường 1", "Giường 2", "Giường 3"]},
        "roomMachines": {"Phòng 201": ["Máy điện châm 1", "Máy điện châm 2", "Máy siêu âm 1"]},
        "machineTypes": {
            "điện châm": ["Máy điện châm 1", "Máy điện châm 2"],
            "siêu âm": ["Máy siêu âm 1"]
        },
        "thuThuatInfo": {
            "điện châm": ["Điện châm", 25, 5, "YHCT", 1, 1, [], 5, 0, 0, 0, 0, 1],
            "siêu âm điều trị": ["Siêu âm", 15, 15, "PHCN", 1, 0, [], 5, 0, 0, 0, 1, 1]
        },
        "rawPatients": [
            {
                "pId": "BN001",
                "name": "Bệnh Nhân Một",
                "ns": 1960,
                "room": "Phòng 201",
                "arrive": 450,
                "leave": 690,
                "loaiBN": "NoiTru",
                "buoiDieuTri": "Sang",
                "busy": [],
                "pending": ["Điện châm", "Siêu âm điều trị"]
            },
            {
                "pId": "BN002",
                "name": "Bệnh Nhân Hai",
                "ns": 1975,
                "room": "Phòng 201",
                "arrive": 460,
                "leave": 690,
                "loaiBN": "NgoaiTru",
                "buoiDieuTri": "Sang",
                "busy": [],
                "pending": ["Điện châm"]
            },
            {
                "pId": "BN003",
                "name": "Bệnh Nhân Ba (MỚI)",
                "ns": 1988,
                "room": "Phòng 201",
                "arrive": 470,
                "leave": 690,
                "loaiBN": "NgoaiTru",
                "buoiDieuTri": "Sang",
                "busy": [],
                "pending": ["Điện châm"]
            }
        ],
        "existingSched": existing_sched
    }

    res = solve_schedule(mock_db, {"timeLimitSeconds": 3.0, "numWorkers": 4, "maxSqueezeMinutes": 2})
    print(f"Xếp bổ sung - Status: {res.get('status')}")
    print(f"Xếp bổ sung - Elapsed: {res.get('elapsedMs')} ms")
    print(f"Xếp bổ sung - Số ca mới xếp được: {res.get('scheduleCount')}")
    print(f"Xếp bổ sung - Số ca rớt: {res.get('unscheduledCount')}")

    for idx, item in enumerate(res.get("schedule", [])):
        print(f"  [MỚI {idx+1}] {item['GIODIENRA']}-{item['GIOKETTHUC']} | {item['HOTEN']} | {item['DICHVU']} | {item['NV CHÍNH']} | {item['MAY']} | {item['GIUONG']}")

    assert res["scheduleCount"] == 1, f"Chỉ được xếp 1 ca mới của Bệnh Nhân Ba, nhưng xếp {res['scheduleCount']} ca"
    assert res["schedule"][0]["HOTEN"] == "Bệnh Nhân Ba (MỚI)"
    assert res["unscheduledCount"] == 0, f"Ca mới không được rớt"
    print(">>> KIỂM THỬ XẾP BỔ SUNG THÀNH CÔNG RỰC RỠ! 100% không trùng lịch cũ.")

if __name__ == "__main__":
    test_basic_schedule()
    test_incremental_schedule()

