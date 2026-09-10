# -*- coding: utf-8 -*-
"""
Module: app_gui.py
Giao diện đồ họa (GUI) Tkinter tiện lợi cho công cụ tự động nhập liệu HIS.
"""

import sys
import os
import json
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import urllib.request
import urllib.parse
from datetime import datetime

# Import driver và runner
try:
    from his_driver import HISDriver, get_his_full_name
    from auto_runner import AutoRunner
except ImportError:
    from tools.his_importer.his_driver import HISDriver, get_his_full_name
    from tools.his_importer.auto_runner import AutoRunner

class HISImporterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("⚡ T.I.M.E.S - Auto-HIS Importer v1.0 (emrHIS)")
        self.root.geometry("820x650")
        self.root.minsize(750, 550)

        # Style & Font
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Dữ liệu hiện tại
        self.schedule_data = [] # Mảng thô
        self.grouped_by_staff = {} # Phân nhóm theo NV
        self.driver = None
        self.runner = None
        self.worker_thread = None

        self._build_ui()
        self._init_driver()

    def _init_driver(self):
        try:
            self.driver = HISDriver()
            self.runner = AutoRunner(self.driver, log_callback=self.append_log)
            self.append_log("Đã khởi tạo bộ điều khiển HIS Driver thành công.")
        except Exception as e:
            self.append_log(f"Cảnh báo khởi tạo Driver: {e}")

    def _build_ui(self):
        # 1. Header Frame
        header = tk.Frame(self.root, bg="#1e293b", padx=15, pady=10)
        header.pack(fill=tk.X)
        
        lbl_title = tk.Label(header, text="⚡ CÔNG CỤ TỰ ĐỘNG NHẬP THỦ THUẬT VÀO emrHIS", font=("Arial", 13, "bold"), fg="#38bdf8", bg="#1e293b")
        lbl_title.pack(anchor=tk.W)
        
        lbl_sub = tk.Label(header, text="Hỗ trợ nhập ca xếp lịch từ PM-xeplich vào HIS (Có chức năng Trả Kết Quả & Dừng khẩn cấp F12)", font=("Arial", 9), fg="#94a3b8", bg="#1e293b")
        lbl_sub.pack(anchor=tk.W)

        # 2. Controls / Source Frame
        src_frame = tk.LabelFrame(self.root, text=" 1. Nguồn Dữ Liệu Lịch Xếp ", font=("Arial", 10, "bold"), padx=10, pady=8)
        src_frame.pack(fill=tk.X, padx=12, pady=6)

        btn_clip = tk.Button(src_frame, text="📋 Dán từ Clipboard", font=("Arial", 9, "bold"), bg="#e0e7ff", fg="#3730a3", padx=10, pady=4, command=self.load_from_clipboard)
        btn_clip.pack(side=tk.LEFT, padx=5)

        btn_file = tk.Button(src_frame, text="📂 Mở file his_schedule.json", font=("Arial", 9), bg="#f1f5f9", padx=10, pady=4, command=self.load_from_file)
        btn_file.pack(side=tk.LEFT, padx=5)

        self.lbl_data_status = tk.Label(src_frame, text="Chưa nạp dữ liệu", font=("Arial", 9, "italic"), fg="#64748b")
        self.lbl_data_status.pack(side=tk.RIGHT, padx=10)

        # 3. Staff Selection Frame
        staff_frame = tk.LabelFrame(self.root, text=" 2. Chọn Nhân Sự Đang Đăng Nhập HIS ", font=("Arial", 10, "bold"), padx=10, pady=8)
        staff_frame.pack(fill=tk.X, padx=12, pady=6)

        tk.Label(staff_frame, text="Nhân viên:", font=("Arial", 9, "bold")).pack(side=tk.LEFT, padx=5)
        self.cbo_staff = ttk.Combobox(staff_frame, font=("Arial", 10), state="readonly", width=30)
        self.cbo_staff.pack(side=tk.LEFT, padx=5)
        self.cbo_staff.bind("<<ComboboxSelected>>", self.on_staff_selected)

        self.lbl_staff_count = tk.Label(staff_frame, text="0 bệnh nhân (0 thủ thuật)", font=("Arial", 9), fg="#0f172a")
        self.lbl_staff_count.pack(side=tk.LEFT, padx=15)

        # 4. Action Buttons Frame
        act_frame = tk.Frame(self.root, padx=10, pady=4)
        act_frame.pack(fill=tk.X, padx=12, pady=4)

        self.btn_start = tk.Button(act_frame, text="▶️ BẮT ĐẦU NHẬP TỰ ĐỘNG", font=("Arial", 11, "bold"), bg="#16a34a", fg="white", padx=18, pady=6, cursor="hand2", command=self.start_import)
        self.btn_start.pack(side=tk.LEFT, padx=5)

        self.btn_stop = tk.Button(act_frame, text="🛑 DỪNG KHẨN CẤP (F12)", font=("Arial", 11, "bold"), bg="#dc2626", fg="white", padx=15, pady=6, cursor="hand2", command=self.emergency_stop)
        self.btn_stop.pack(side=tk.LEFT, padx=5)

        # 5. Patient & Procedure Preview Table
        list_frame = tk.LabelFrame(self.root, text=" Danh Sách Ca Chuẩn Bị Nhập ", font=("Arial", 10, "bold"), padx=6, pady=6)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=12, pady=4)

        columns = ("stt", "ten_bn", "thu_thuat", "bat_dau", "ket_thuc", "may", "tra_kq")
        self.tree = ttk.Treeview(list_frame, columns=columns, show="headings", height=7)
        self.tree.heading("stt", text="STT")
        self.tree.heading("ten_bn", text="Tên Bệnh Nhân")
        self.tree.heading("thu_thuat", text="Thủ Thuật")
        self.tree.heading("bat_dau", text="Bắt Đầu")
        self.tree.heading("ket_thuc", text="Kết Thúc")
        self.tree.heading("may", text="Máy")
        self.tree.heading("tra_kq", text="Trả KQ")

        self.tree.column("stt", width=40, anchor=tk.CENTER)
        self.tree.column("ten_bn", width=160, anchor=tk.W)
        self.tree.column("thu_thuat", width=200, anchor=tk.W)
        self.tree.column("bat_dau", width=75, anchor=tk.CENTER)
        self.tree.column("ket_thuc", width=75, anchor=tk.CENTER)
        self.tree.column("may", width=120, anchor=tk.W)
        self.tree.column("tra_kq", width=60, anchor=tk.CENTER)

        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # 6. Log Console Frame
        log_frame = tk.LabelFrame(self.root, text=" Nhật Ký Tiến Trình ", font=("Arial", 9, "bold"), padx=6, pady=4)
        log_frame.pack(fill=tk.BOTH, padx=12, pady=6, ipady=2)

        self.txt_log = tk.Text(log_frame, height=7, font=("Consolas", 9), bg="#0f172a", fg="#f8fafc", wrap=tk.WORD)
        log_scroll = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.txt_log.yview)
        self.txt_log.configure(yscroll=log_scroll.set)
        self.txt_log.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        log_scroll.pack(side=tk.RIGHT, fill=tk.Y)

    def append_log(self, text):
        def _log():
            self.txt_log.insert(tk.END, text + "\n")
            self.txt_log.see(tk.END)
        self.root.after(0, _log)

    def load_from_clipboard(self):
        try:
            raw = self.root.clipboard_get()
            data = json.loads(raw)
            self._process_loaded_data(data)
            self.append_log("✅ Đã nạp thành công dữ liệu từ Clipboard!")
        except Exception as e:
            messagebox.showerror("Lỗi dữ liệu", f"Không thể nạp dữ liệu từ Clipboard:\n{e}")

    def load_from_file(self):
        path = filedialog.askopenfilename(filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")])
        if not path:
            return
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._process_loaded_data(data)
            self.append_log(f"✅ Đã nạp thành công từ file: {os.path.basename(path)}")
        except Exception as e:
            messagebox.showerror("Lỗi mở file", f"Không thể đọc file dữ liệu:\n{e}")

    def _process_loaded_data(self, data):
        # Data có thể là mảng danh sách lịch hoặc Object đã group (hỗ trợ cả schema tools/auto và his_importer)
        rows = []
        default_date = ""
        if isinstance(data, list):
            rows = data
        elif isinstance(data, dict):
            default_date = data.get("date", "")
            if "schedule" in data and isinstance(data["schedule"], list):
                rows = data["schedule"]
            elif "data" in data and isinstance(data["data"], list):
                rows = data["data"]
            elif "shifts" in data and isinstance(data["shifts"], list):
                rows = data["shifts"]
            else:
                rows = [data]

        # Chuẩn hóa linh hoạt các trường tiếng Anh / tiếng Việt (kế thừa từ tools/auto)
        normalized_rows = []
        for r in rows:
            p_name = (r.get("tenBN") or r.get("patient") or "").strip()
            if not p_name:
                continue
            staff = (r.get("nvChinh") or r.get("employee") or "Chưa phân công").strip()
            thu_thuat = (r.get("thuThuat") or r.get("procedure") or "").strip()
            start_t = (r.get("gioDienRa") or r.get("start_time") or "").strip()
            end_t = (r.get("gioKetThuc") or r.get("end_time") or "").strip()
            may = (r.get("may") or r.get("device_code") or "").strip()
            ngay = (r.get("ngay") or r.get("date") or default_date).strip()

            norm_r = dict(r)
            norm_r["tenBN"] = p_name
            norm_r["nvChinh"] = staff
            norm_r["thuThuat"] = thu_thuat
            norm_r["gioDienRa"] = start_t
            norm_r["gioKetThuc"] = end_t
            norm_r["may"] = may
            norm_r["ngay"] = ngay
            normalized_rows.append(norm_r)

        self.schedule_data = normalized_rows

        # Tìm các thủ thuật cuối cùng trong ngày của mỗi bệnh nhân để bấm "Trả Kết Quả"
        patient_max_time = {}
        for r in normalized_rows:
            p_name = r.get("tenBN", "")
            end_t = r.get("gioKetThuc", "")
            if p_name and end_t:
                if p_name not in patient_max_time or end_t > patient_max_time[p_name]:
                    patient_max_time[p_name] = end_t

        # Gom nhóm theo Nhân sự -> Bệnh nhân -> Thủ thuật
        self.grouped_by_staff = {}
        for r in normalized_rows:
            staff = r.get("nvChinh", "Chưa phân công")
            p_name = r.get("tenBN", "")
            if staff not in self.grouped_by_staff:
                self.grouped_by_staff[staff] = {}
            if p_name not in self.grouped_by_staff[staff]:
                self.grouped_by_staff[staff][p_name] = []

            is_final = (r.get("gioKetThuc", "") == patient_max_time.get(p_name, ""))
            r_copy = dict(r)
            r_copy["isFinalOfPatient"] = is_final
            self.grouped_by_staff[staff][p_name].append(r_copy)

        # Cập nhật Dropdown
        staff_names = sorted(list(self.grouped_by_staff.keys()))
        self.cbo_staff['values'] = staff_names
        if staff_names:
            self.cbo_staff.current(0)
            self.on_staff_selected()

        self.lbl_data_status.config(text=f"Đã nạp {len(normalized_rows)} ca ({len(staff_names)} nhân viên)", fg="#16a34a")

    def on_staff_selected(self, event=None):
        staff = self.cbo_staff.get()
        if not staff or staff not in self.grouped_by_staff:
            return

        patients = self.grouped_by_staff[staff]
        total_procs = sum(len(p_list) for p_list in patients.values())
        his_name = get_his_full_name(staff)
        self.lbl_staff_count.config(text=f"👉 Chuẩn HIS: {his_name} | {len(patients)} BN ({total_procs} thủ thuật)", fg="#1d4ed8", font=("Arial", 9, "bold"))

        # Hiển thị lên bảng Treeview
        for item in self.tree.get_children():
            self.tree.delete(item)

        stt = 1
        for p_name, procs in patients.items():
            for p in procs:
                self.tree.insert("", tk.END, values=(
                    stt,
                    p_name,
                    p.get("thuThuat", ""),
                    p.get("gioDienRa", ""),
                    p.get("gioKetThuc", ""),
                    p.get("may", ""),
                    "Có" if p.get("isFinalOfPatient") else "Không"
                ))
                stt += 1

    def start_import(self):
        staff = self.cbo_staff.get()
        if not staff or staff not in self.grouped_by_staff:
            messagebox.showwarning("Chưa chọn", "Vui lòng chọn nhân sự trước khi bắt đầu!")
            return

        if self.runner and self.runner.is_running:
            messagebox.showinfo("Đang chạy", "Tiến trình tự động đang chạy!")
            return

        confirm = messagebox.askyesno(
            "Xác nhận bắt đầu",
            f"Bạn đang chuẩn bị tự động nhập {self.lbl_staff_count.cget('text')} của nhân viên:\n👉 {staff}\n\n"
            "Vui lòng chắc chắn:\n"
            "1. Đã đăng nhập đúng tài khoản của nhân viên này trên emrHIS.\n"
            "2. Đang ở màn hình Phân hệ Chuyên Khoa, PTTT.\n\n"
            "Bạn có muốn bắt đầu ngay?"
        )
        if not confirm:
            return

        self.btn_start.config(state=tk.DISABLED, bg="#94a3b8")
        patient_groups = self.grouped_by_staff[staff]

        def _worker():
            try:
                import ctypes
                try:
                    ctypes.windll.ole32.CoInitialize(None)
                except Exception:
                    pass
                self.runner.run_for_staff(staff, patient_groups)
            finally:
                try:
                    import ctypes
                    ctypes.windll.ole32.CoUninitialize()
                except Exception:
                    pass
                self.root.after(0, lambda: self.btn_start.config(state=tk.NORMAL, bg="#16a34a"))

        self.worker_thread = threading.Thread(target=_worker, daemon=True)
        self.worker_thread.start()

    def emergency_stop(self):
        if self.runner:
            self.runner.should_stop = True
            self.append_log("🛑 Người dùng bấm nút Dừng Khẩn Cấp!")

def main():
    root = tk.Tk()
    app = HISImporterApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
