# -*- coding: utf-8 -*-
"""
Module: auto_runner.py
Điều phối quy trình chạy tự động nhập HIS theo nhân viên và bệnh nhân.
"""

import sys
import os
import time
import ctypes
from datetime import datetime

user32 = ctypes.windll.user32
VK_F12 = 0x7B
VK_ESCAPE = 0x1B

class AutoRunner:
    def __init__(self, driver, log_callback=None):
        self.driver = driver
        self.log_callback = log_callback or print
        self.is_running = False
        self.is_paused = False
        self.should_stop = False

    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        full_msg = f"[{timestamp}] {message}"
        self.log_callback(full_msg)

    def check_emergency_stop(self):
        """Kiểm tra phím F12 để dừng khẩn cấp"""
        # GetAsyncKeyState returns negative if key is currently pressed
        if (user32.GetAsyncKeyState(VK_F12) & 0x8000) != 0:
            self.log("⚠️ PHÁT HIỆN PHÍM F12 - DỪNG KHẨN CẤP TOÀN BỘ TIẾN TRÌNH!")
            self.should_stop = True
            return True
        return False

    def wait_with_stop_check(self, seconds):
        """Chờ một khoảng thời gian nhưng vẫn phản hồi ngay lập tức nếu bấm F12"""
        start = time.time()
        while time.time() - start < seconds:
            if self.check_emergency_stop():
                return False
            time.sleep(0.05)
        return True

    def run_for_staff(self, staff_name, patient_groups):
        """
        Chạy tự động cho 1 nhân viên cụ thể.
        patient_groups: {
            "tenBN": [
                {
                    "thuThuat": "...",
                    "gioDienRa": "08:56",
                    "gioKetThuc": "09:11",
                    "ngay": "09/09/2026",
                    "may": "...",
                    "nvChinh": "...",
                    "isFinalOfPatient": True/False
                },
                ...
            ]
        }
        """
        self.is_running = True
        self.should_stop = False
        self.log(f"🚀 Bắt đầu tiến trình tự động nhập HIS cho nhân sự: {staff_name}")

        try:
            # 1. Khôi phục cửa sổ emrHIS
            self.log("Đang kích hoạt cửa sổ phần mềm emrHIS...")
            self.driver.bring_to_front()
            self.wait_with_stop_check(0.8)

            total_patients = len(patient_groups)
            current_idx = 0

            for patient_name, procs in patient_groups.items():
                if self.check_emergency_stop() or self.should_stop:
                    break

                current_idx += 1
                self.log(f"--- ({current_idx}/{total_patients}) Xử lý Bệnh nhân: {patient_name} ({len(procs)} thủ thuật) ---")

                # Tìm kiếm bệnh nhân
                self.log(f"Tìm bệnh nhân: {patient_name}")
                self.driver.search_patient(patient_name)
                if not self.wait_with_stop_check(1.0):
                    break

                # Chọn bệnh nhân đầu tiên trong danh sách
                self.driver.select_first_patient_in_list()
                if not self.wait_with_stop_check(1.0):
                    break

                # Bắt đầu thực hiện (nếu chưa bắt đầu)
                self.driver.check_and_start_execution()
                if not self.wait_with_stop_check(0.8):
                    break

                # Nhập từng thủ thuật
                for p_idx, p in enumerate(procs):
                    if self.check_emergency_stop() or self.should_stop:
                        break

                    tt_name = p.get("thuThuat", "")
                    start_str = f"{p.get('gioDienRa', '')} {p.get('ngay', '')}".strip()
                    end_str = f"{p.get('gioKetThuc', '')} {p.get('ngay', '')}".strip()
                    may = p.get("may", "")
                    nv = p.get("nvChinh", staff_name)

                    self.log(f"  + [{p_idx+1}/{len(procs)}] Chuột phải mở: {tt_name}...")
                    self.driver.open_procedure_modal(p_idx)
                    if not self.wait_with_stop_check(1.2):
                        break

                    self.log(f"    Điền thông tin: {start_str} -> {end_str}, Máy: {may}")
                    self.driver.fill_procedure_form(
                        start_time_str=start_str,
                        end_time_str=end_str,
                        may_y_te=may,
                        nv_chinh=nv
                    )
                    self.log(f"    ✅ Đã Lưu + Đóng thủ thuật: {tt_name}")
                    if not self.wait_with_stop_check(1.0):
                        break

                # Kiểm tra nếu bệnh nhân đã hoàn thành tất cả thủ thuật thì ấn Trả kết quả
                has_final = any(p.get("isFinalOfPatient", False) for p in procs)
                if has_final and not self.should_stop:
                    self.log(f"Bệnh nhân {patient_name} đã hoàn tất ca cuối trong ngày -> Tiến hành bấm 'Trả Kết Quả'...")
                    res = self.driver.click_tra_ket_qua()
                    if res:
                        self.log(f"✅ Đã bấm Trả Kết Quả thành công cho BN {patient_name}")
                    else:
                        self.log(f"ℹ️ Không cần bấm Trả Kết Quả hoặc đã trả trước đó.")
                    self.wait_with_stop_check(1.0)

            if not self.should_stop:
                self.log(f"🎉 HOÀN TẤT TOÀN BỘ CA CỦA NHÂN SỰ: {staff_name}!")
            else:
                self.log(f"🛑 ĐÃ DỪNG TIẾN TRÌNH THEO LỆNH NGƯỜI DÙNG.")

        except Exception as e:
            self.log(f"❌ Xảy ra lỗi trong quá trình tự động: {e}")
        finally:
            self.is_running = False
