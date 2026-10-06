# -*- coding: utf-8 -*-
"""
================================================================================
                    emrHIS-AutoBot v2.0 - BẢN THƯƠNG MẠI
   Công cụ Tự động hóa Nhập Thông tin Phẫu thuật - Thủ thuật vào emrHIS
   Tích hợp trực tiếp với PM Xếp Lịch Phục Hồi Chức Năng & YHCT v4
================================================================================
"""

import os
import sys
import time
import json
import threading
import subprocess
import ctypes
from ctypes import wintypes
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

import pyautogui
import pyperclip
import pygetwindow as gw

try:
    import uiautomation as auto
except ImportError:
    auto = None

# Cấu hình an toàn cho PyAutoGUI
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.05

APP_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(APP_DIR, "emrhis_config.json")

# Win32 Virtual Keys cho Global Hotkeys
VK_ESCAPE = 0x1B
VK_F7 = 0x76
VK_F8 = 0x77
VK_F9 = 0x78
VK_F12 = 0x7B
VK_KEY_C = 0x43


def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Lỗi đọc config: {e}")
    return {
        "settings": {
            "step_delay": 0.35,
            "key_interval": 0.02,
            "wait_window_timeout": 5.0,
            "failsafe": True,
            "window_main_title_contains": "emrHIS",
            "window_form_title_contains": "Cập Nhật Thông Tin Thủ Thuật",
            "auto_dismiss_popups": True
        },
        "defaults": {
            "tinh_hinh": "Chủ động",
            "vo_cam": "Khác",
            "mo_ta": ".",
            "may_y_te": ""
        },
        "staff_mapping": {},
        "calibration": {
            "is_calibrated": False,
            "screen_resolution": [1920, 1080],
            "main_window": {},
            "form_pttt": {}
        }
    }


def save_config(cfg):
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Lỗi lưu config: {e}")
        return False


def is_key_pressed(vk_code):
    """Kiểm tra xem phím vật lý có đang được ấn không bằng Win32 GetAsyncKeyState"""
    return (ctypes.windll.user32.GetAsyncKeyState(vk_code) & 0x8000) != 0


class EmrHisBotApp:
    def __init__(self, root):
        self.root = root
        self.root.title("emrHIS-AutoBot v2.0 - Tự động nhập thông tin PTTT")
        self.root.geometry("1020x720")
        self.root.minsize(880, 600)

        # Trạng thái
        self.config = load_config()
        self.tasks = []
        self.current_task_index = 0
        self.is_running = False
        self.stop_requested = False
        self.is_calibrating = False

        self._setup_style()
        self._build_ui()
        self._start_global_hotkey_listener()

    def _setup_style(self):
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview", rowheight=26, font=("Segoe UI", 10))
        style.configure("Treeview.Heading", font=("Segoe UI", 10, "bold"))
        style.map("Treeview", background=[("selected", "#0284c7")])

    def _build_ui(self):
        # 1. Top Bar / Header
        header_frame = tk.Frame(self.root, bg="#0f172a", height=60)
        header_frame.pack(fill=tk.X, side=tk.TOP)

        title_lbl = tk.Label(
            header_frame,
            text="🤖 emrHIS-AutoBot | Trợ lý Tự Động Nhập Thủ Thuật",
            font=("Segoe UI", 15, "bold"),
            fg="#f8fafc",
            bg="#0f172a"
        )
        title_lbl.pack(side=tk.LEFT, padx=15, pady=12)

        status_sub = tk.Label(
            header_frame,
            text="Phím tắt: [F7] Chạy thử 1 ca | [F8] Điền form hiện tại | [F9] Chạy tự động | [ESC / F12] Dừng khẩn cấp",
            font=("Segoe UI", 9),
            fg="#94a3b8",
            bg="#0f172a"
        )
        status_sub.pack(side=tk.RIGHT, padx=15, pady=15)

        # 2. Thanh điều khiển chính (Action Bar)
        toolbar = tk.Frame(self.root, bg="#f1f5f9", padx=10, pady=8)
        toolbar.pack(fill=tk.X)

        btn_paste = tk.Button(
            toolbar,
            text="📋 Dán từ Clipboard (PM-XếpLịch)",
            bg="#0284c7",
            fg="white",
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=12,
            pady=5,
            command=self.load_from_clipboard
        )
        btn_paste.pack(side=tk.LEFT, padx=4)

        btn_open = tk.Button(
            toolbar,
            text="📂 Mở file JSON",
            bg="#475569",
            fg="white",
            font=("Segoe UI", 10),
            relief=tk.FLAT,
            padx=10,
            pady=5,
            command=self.load_from_file
        )
        btn_open.pack(side=tk.LEFT, padx=4)

        btn_open_his = tk.Button(
            toolbar,
            text="🏥 Mở / Bật emrHIS",
            bg="#0284c7",
            fg="white",
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=10,
            pady=5,
            command=self.user_click_open_his
        )
        btn_open_his.pack(side=tk.LEFT, padx=4)

        sep1 = ttk.Separator(toolbar, orient=tk.VERTICAL)
        sep1.pack(side=tk.LEFT, fill=tk.Y, padx=10)

        self.btn_run_test = tk.Button(
            toolbar,
            text="🧪 CHẠY THỬ 1 CA (F7)",
            bg="#7c3aed",
            fg="white",
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=12,
            pady=5,
            command=self.run_single_test_task
        )
        self.btn_run_test.pack(side=tk.LEFT, padx=4)

        self.btn_run_all = tk.Button(
            toolbar,
            text="▶️ CHẠY TỰ ĐỘNG (F9)",
            bg="#16a34a",
            fg="white",
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=14,
            pady=5,
            command=self.start_auto_run
        )
        self.btn_run_all.pack(side=tk.LEFT, padx=4)

        self.btn_fill_one = tk.Button(
            toolbar,
            text="⚡ ĐIỀN FORM ĐANG MỞ (F8)",
            bg="#d97706",
            fg="white",
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=12,
            pady=5,
            command=self.fill_current_open_form
        )
        self.btn_fill_one.pack(side=tk.LEFT, padx=4)

        self.btn_stop = tk.Button(
            toolbar,
            text="⏹ DỪNG (ESC)",
            bg="#dc2626",
            fg="white",
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=12,
            pady=5,
            state=tk.DISABLED,
            command=self.request_stop
        )
        self.btn_stop.pack(side=tk.LEFT, padx=4)

        btn_calib = tk.Button(
            toolbar,
            text="🎯 Cân Chỉnh Tọa Độ",
            bg="#6366f1",
            fg="white",
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=10,
            pady=5,
            command=self.open_calibration_wizard
        )
        btn_calib.pack(side=tk.RIGHT, padx=4)

        btn_clear = tk.Button(
            toolbar,
            text="🗑 Xóa DS",
            bg="#e2e8f0",
            fg="#334155",
            font=("Segoe UI", 9),
            relief=tk.FLAT,
            padx=8,
            pady=5,
            command=self.clear_task_list
        )
        btn_clear.pack(side=tk.RIGHT, padx=4)

        # 3. Main Split Area: Danh sách ca (trên) & Log trạng thái (dưới)
        paned = tk.PanedWindow(self.root, orient=tk.VERTICAL, sashrelief=tk.RAISED, bg="#cbd5e1")
        paned.pack(fill=tk.BOTH, expand=True, padx=8, pady=5)

        # 3.1 Bảng danh sách ca
        table_frame = tk.Frame(paned, bg="white")
        paned.add(table_frame, height=360)

        # Header bảng có thống kê
        tbl_info_frame = tk.Frame(table_frame, bg="#f8fafc", padx=8, pady=4)
        tbl_info_frame.pack(fill=tk.X)

        self.lbl_stats = tk.Label(
            tbl_info_frame,
            text="Tổng cộng: 0 ca | Chờ: 0 | Đã nhập: 0 | Lỗi: 0",
            font=("Segoe UI", 10, "bold"),
            fg="#1e293b",
            bg="#f8fafc"
        )
        self.lbl_stats.pack(side=tk.LEFT)

        cols = ("stt", "ten_bn", "nam_sinh", "thu_thuat", "gio_bd", "gio_kt", "ktv", "may", "trang_thai")
        self.tree = ttk.Treeview(table_frame, columns=cols, show="headings", selectmode="browse")

        self.tree.heading("stt", text="STT")
        self.tree.heading("ten_bn", text="Họ Tên Bệnh Nhân")
        self.tree.heading("nam_sinh", text="Năm Sinh")
        self.tree.heading("thu_thuat", text="Tên Thủ Thuật")
        self.tree.heading("gio_bd", text="Giờ BĐ")
        self.tree.heading("gio_kt", text="Giờ KT")
        self.tree.heading("ktv", text="KTV (Mã)")
        self.tree.heading("may", text="Máy Y Tế")
        self.tree.heading("trang_thai", text="Trạng Thái")

        self.tree.column("stt", width=45, anchor=tk.CENTER)
        self.tree.column("ten_bn", width=170, anchor=tk.W)
        self.tree.column("nam_sinh", width=75, anchor=tk.CENTER)
        self.tree.column("thu_thuat", width=220, anchor=tk.W)
        self.tree.column("gio_bd", width=70, anchor=tk.CENTER)
        self.tree.column("gio_kt", width=70, anchor=tk.CENTER)
        self.tree.column("ktv", width=110, anchor=tk.W)
        self.tree.column("may", width=110, anchor=tk.W)
        self.tree.column("trang_thai", width=110, anchor=tk.CENTER)

        tree_scroll_y = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        tree_scroll_x = ttk.Scrollbar(table_frame, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=tree_scroll_y.set, xscrollcommand=tree_scroll_x.set)

        tree_scroll_y.pack(side=tk.RIGHT, fill=tk.Y)
        tree_scroll_x.pack(side=tk.BOTTOM, fill=tk.X)
        self.tree.pack(fill=tk.BOTH, expand=True)

        # 3.2 Khung Log & Cấu hình nhanh
        bottom_frame = tk.Frame(paned, bg="#f8fafc")
        paned.add(bottom_frame, height=200)

        log_header = tk.Frame(bottom_frame, bg="#e2e8f0", padx=8, pady=3)
        log_header.pack(fill=tk.X)

        tk.Label(
            log_header,
            text="📝 Nhật ký vận hành (Live Activity Log):",
            font=("Segoe UI", 9, "bold"),
            bg="#e2e8f0",
            fg="#334155"
        ).pack(side=tk.LEFT)

        # Speed slider
        speed_frame = tk.Frame(log_header, bg="#e2e8f0")
        speed_frame.pack(side=tk.RIGHT)
        tk.Label(speed_frame, text="Tốc độ trễ (s):", font=("Segoe UI", 9), bg="#e2e8f0").pack(side=tk.LEFT, padx=3)
        self.speed_var = tk.DoubleVar(value=self.config.get("settings", {}).get("step_delay", 0.35))
        speed_scale = ttk.Scale(speed_frame, from_=0.15, to_=1.5, variable=self.speed_var, orient=tk.HORIZONTAL, length=100)
        speed_scale.pack(side=tk.LEFT, padx=3)
        self.lbl_speed_val = tk.Label(speed_frame, text=f"{self.speed_var.get():.2f}s", font=("Segoe UI", 9, "bold"), bg="#e2e8f0")
        self.lbl_speed_val.pack(side=tk.LEFT, padx=2)
        speed_scale.configure(command=lambda v: self.lbl_speed_val.config(text=f"{float(v):.2f}s"))

        # Log Text Area
        log_scroll = ttk.Scrollbar(bottom_frame, orient=tk.VERTICAL)
        self.log_txt = tk.Text(
            bottom_frame,
            font=("Consolas", 9),
            bg="#0f172a",
            fg="#f1f5f9",
            yscrollcommand=log_scroll.set,
            wrap=tk.WORD
        )
        log_scroll.config(command=self.log_txt.yview)
        log_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_txt.pack(fill=tk.BOTH, expand=True)

        # 4. Status Footer
        footer = tk.Frame(self.root, bg="#e2e8f0", height=24, padx=8)
        footer.pack(fill=tk.X, side=tk.BOTTOM)
        self.lbl_status = tk.Label(footer, text="Sẵn sàng. Vui lòng nạp danh sách ca từ PM-XếpLịch.", font=("Segoe UI", 9), bg="#e2e8f0", fg="#475569")
        self.lbl_status.pack(side=tk.LEFT)

        self.log("Khởi động emrHIS-AutoBot thành công. Hệ thống sẵn sàng!")
        is_cal = self.config.get("calibration", {}).get("is_calibrated", False)
        if not is_cal:
            self.log("⚠️ Chú ý: Chưa thực hiện cân chỉnh tọa độ cho máy tính này. Vui lòng bấm '🎯 Cân Chỉnh Tọa Độ' một lần trước khi chạy tự động.", level="WARN")

    def log(self, msg, level="INFO"):
        ts = datetime.now().strftime("%H:%M:%S")
        prefix = f"[{ts}] [{level}] "
        self.log_txt.insert(tk.END, prefix + msg + "\n")
        self.log_txt.see(tk.END)
        self.lbl_status.config(text=msg)

    # =========================================================================
    # GLOBAL HOTKEYS LISTENER (Chạy ngầm liên tục qua Win32 API)
    # =========================================================================
    def _start_global_hotkey_listener(self):
        def listener():
            prev_f7 = False
            prev_f8 = False
            prev_f9 = False
            prev_esc = False
            prev_f12 = False

            while True:
                time.sleep(0.04)
                # ESC / F12 -> Emergency Stop
                now_esc = is_key_pressed(VK_ESCAPE)
                now_f12 = is_key_pressed(VK_F12)
                if (now_esc and not prev_esc) or (now_f12 and not prev_f12):
                    if self.is_running:
                        self.root.after(0, self.request_stop)

                # F7 -> Run Single Test Task
                now_f7 = is_key_pressed(VK_F7)
                if now_f7 and not prev_f7:
                    if not self.is_running and not self.is_calibrating:
                        self.root.after(0, self.run_single_test_task)

                # F8 -> Fill Current Form
                now_f8 = is_key_pressed(VK_F8)
                if now_f8 and not prev_f8:
                    if not self.is_running and not self.is_calibrating:
                        self.root.after(0, self.fill_current_open_form)

                # F9 -> Start Auto
                now_f9 = is_key_pressed(VK_F9)
                if now_f9 and not prev_f9:
                    if not self.is_running and not self.is_calibrating:
                        self.root.after(0, self.start_auto_run)

                prev_f7 = now_f7
                prev_f8 = now_f8
                prev_f9 = now_f9
                prev_esc = now_esc
                prev_f12 = now_f12

        t = threading.Thread(target=listener, daemon=True)
        t.start()

    # =========================================================================
    # NẠP DỮ LIỆU
    # =========================================================================
    def load_from_clipboard(self):
        try:
            raw = pyperclip.paste().strip()
            if not raw:
                messagebox.showwarning("Clipboard rỗng", "Bộ nhớ tạm (Clipboard) không có dữ liệu!\nVui lòng vào PM-XếpLịch bấm nút '🤖 XUẤT LỆNH emrHIS' trước.")
                return
            data = json.loads(raw)
            self._process_loaded_data(data)
        except json.JSONDecodeError:
            messagebox.showerror("Sai định dạng", "Dữ liệu trong Clipboard không phải là JSON hợp lệ từ PM-XếpLịch!")
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc dữ liệu: {e}")

    def load_from_file(self):
        path = filedialog.askopenfilename(
            title="Chọn file lệnh emrHIS từ PM-XếpLịch",
            filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")]
        )
        if not path:
            return
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._process_loaded_data(data)
        except Exception as e:
            messagebox.showerror("Lỗi đọc file", f"Không thể đọc file: {e}")

    def _process_loaded_data(self, data):
        tasks = []
        if isinstance(data, dict) and "tasks" in data:
            tasks = data["tasks"]
        elif isinstance(data, list):
            tasks = data
        elif isinstance(data, dict) and "schedule" in data:
            # Fallback convert from schedule
            sched = data.get("schedule", [])
            for idx, r in enumerate(sched):
                tasks.append({
                    "stt": idx + 1,
                    "ten_bn": r.get("tenBN", ""),
                    "nam_sinh": r.get("namSinh", ""),
                    "thu_thuat": r.get("thuThuat", ""),
                    "gio_bat_dau": r.get("gioDienRa", "08:00"),
                    "gio_ket_thuc": r.get("gioKetThuc", "08:30"),
                    "ngay": data.get("dateDisplay", ""),
                    "ngay_gio_bd": f"{r.get('gioDienRa', '08:00')} {data.get('dateDisplay', '')}",
                    "ngay_gio_kt": f"{r.get('gioKetThuc', '08:30')} {data.get('dateDisplay', '')}",
                    "tinh_hinh": "Chủ động",
                    "vo_cam": "Khác",
                    "may_y_te": r.get("mayMoc", ""),
                    "mo_ta": ".",
                    "ktv_ma": r.get("nvChinh", ""),
                    "ktv_ten": r.get("nvChinh", "")
                })

        if not tasks:
            messagebox.showwarning("Trống", "Không tìm thấy danh sách ca thủ thuật nào trong dữ liệu!")
            return

        self.tasks = tasks
        self._refresh_table()
        self.log(f"Đã nạp thành công {len(tasks)} ca thủ thuật từ PM-XếpLịch!")
        messagebox.showinfo("Thành công", f"Đã nạp {len(tasks)} ca thủ thuật!\nBạn có thể bấm '⚡ ĐIỀN FORM ĐANG MỞ (F8)' hoặc '▶️ CHẠY TỰ ĐỘNG (F9)'.")

    def _refresh_table(self):
        for item in self.tree.get_children():
            self.tree.delete(item)

        cho = 0
        xong = 0
        loi = 0

        for idx, t in enumerate(self.tasks):
            stt = t.get("stt", idx + 1)
            ten = t.get("ten_bn", "")
            ns = t.get("nam_sinh", "")
            tt = t.get("thu_thuat", "")
            bd = t.get("gio_bat_dau", "")
            kt = t.get("gio_ket_thuc", "")
            ktv = t.get("ktv_ma") or t.get("ktv_ten", "")
            may = t.get("may_y_te", "")
            st = t.get("status", "Chờ thực hiện")

            if st == "Hoàn thành":
                xong += 1
            elif "Lỗi" in st:
                loi += 1
            else:
                cho += 1

            self.tree.insert("", tk.END, iid=str(idx), values=(stt, ten, ns, tt, bd, kt, ktv, may, st))

        self.lbl_stats.config(text=f"Tổng cộng: {len(self.tasks)} ca | Chờ: {cho} | Đã nhập: {xong} | Lỗi: {loi}")

    def clear_task_list(self):
        if self.is_running:
            return
        if messagebox.askyesno("Xác nhận", "Bạn có chắc muốn xóa toàn bộ danh sách ca hiện tại?"):
            self.tasks = []
            self._refresh_table()
            self.log("Đã xóa danh sách ca.")

    # =========================================================================
    # TÌM VÀ ACTIVATE CỬA SỔ emrHIS (ĐA CƠ CHẾ + AUTO LAUNCH + FORCE FOREGROUND)
    # =========================================================================
    def user_click_open_his(self):
        """Người dùng chủ động bấm nút '🏥 Mở / Bật emrHIS' trên thanh công cụ"""
        self.log("🔍 Đang tìm hoặc mở giao diện emrHIS...")
        w = self.find_emrhis_window(auto_launch=True)
        if w:
            self.log("✅ Giao diện emrHIS đã sẵn sàng trên màn hình!")
        else:
            messagebox.showwarning(
                "Thông báo",
                "Chưa kết nối được với giao diện emrHIS.\n\nVui lòng mở emrHIS và đăng nhập tài khoản trước khi thực hiện!"
            )

    def force_activate_window(self, win):
        """
        Đưa cửa sổ lên trên cùng (Foreground) một cách cưỡng bức và tin cậy tuyệt đối:
        Khắc phục triệt để lỗi Windows chặn SetForegroundWindow hoặc chỉ nhấp nháy taskbar
        """
        if not win:
            return False
        try:
            hwnd = getattr(win, '_hWnd', None) or getattr(win, 'hwnd', None)
            if not hwnd and isinstance(win, int):
                hwnd = win

            user32 = ctypes.windll.user32
            kernel32 = ctypes.windll.kernel32

            if hwnd and user32.IsWindow(hwnd):
                # 1. Khôi phục nếu đang bị thu nhỏ
                SW_RESTORE = 9
                SW_SHOW = 5
                if user32.IsIconic(hwnd):
                    user32.ShowWindow(hwnd, SW_RESTORE)
                else:
                    user32.ShowWindow(hwnd, SW_SHOW)

                # 2. AttachThreadInput để bypass Foreground Lock của Windows
                cur_tid = kernel32.GetCurrentThreadId()
                fg_hwnd = user32.GetForegroundWindow()
                fg_tid = user32.GetWindowThreadProcessId(fg_hwnd, None)
                target_tid = user32.GetWindowThreadProcessId(hwnd, None)

                if fg_tid != target_tid:
                    user32.AttachThreadInput(cur_tid, fg_tid, True)
                    user32.AttachThreadInput(cur_tid, target_tid, True)
                    user32.AllowSetForegroundWindow(-1)
                    user32.SetForegroundWindow(hwnd)
                    user32.BringWindowToTop(hwnd)
                    user32.AttachThreadInput(cur_tid, fg_tid, False)
                    user32.AttachThreadInput(cur_tid, target_tid, False)
                else:
                    user32.SetForegroundWindow(hwnd)
                    user32.BringWindowToTop(hwnd)

                time.sleep(0.3)
                return True
            else:
                if hasattr(win, 'isMinimized') and win.isMinimized:
                    win.restore()
                if hasattr(win, 'activate'):
                    win.activate()
                time.sleep(0.3)
                return True
        except Exception as e:
            self.log(f"Cảnh báo force_activate: {e}", level="WARN")
        return False

    def launch_emrhis(self):
        """Khởi động ứng dụng emrHIS nếu chưa mở trên máy"""
        exe_path = self.config.get("settings", {}).get("emrhis_path", r"C:\PRIVATE-DPT\HIS\emrHIS.exe")
        if not os.path.exists(exe_path):
            self.log(f"⚠️ Không tìm thấy tệp emrHIS tại: {exe_path}", level="WARN")
            return None

        try:
            self.log(f"🚀 Đang khởi chạy phần mềm: {exe_path}...")
            subprocess.Popen([exe_path], cwd=os.path.dirname(exe_path))
            self.log("⏳ Đang chờ giao diện emrHIS xuất hiện (tối đa 15 giây)...")

            for _ in range(30):
                time.sleep(0.5)
                w = self._search_any_emrhis_window()
                if w:
                    self.force_activate_window(w)
                    self.log("✅ Giao diện emrHIS đã khởi động và hiển thị thành công!")
                    return w
        except Exception as e:
            self.log(f"❌ Lỗi khi khởi động emrHIS: {e}", level="ERROR")
        return None

    def _search_any_emrhis_window(self, title_part=None):
        """Tìm bất kỳ cửa sổ nào của emrHIS bằng đa cơ chế (Tiêu đề, UIA, HWND Process)"""
        # 1. Thử theo pygetwindow title thông thường
        if title_part:
            candidates = [title_part]
        else:
            cfg_title = self.config.get("settings", {}).get("window_main_title_contains", "emrHIS")
            candidates = [cfg_title, "emrHIS", "HIS", "Medibox", "Sanita", "Quản Lý", "Khám"]

        for cand in candidates:
            try:
                wins = gw.getWindowsWithTitle(cand)
                if wins:
                    return wins[0]
                all_wins = gw.getAllTitles()
                matches = [t for t in all_wins if cand.lower() in t.lower() and t.strip()]
                if matches:
                    wins = gw.getWindowsWithTitle(matches[0])
                    if wins:
                        return wins[0]
            except Exception:
                pass

        # 2. Thử tìm qua UIAutomation AutomationId='FormMain'
        if auto is not None:
            try:
                main_uia = self._find_form_main_uia()
                if main_uia and main_uia.Exists(0.1):
                    hwnd = getattr(main_uia, 'NativeWindowHandle', None)
                    if hwnd and ctypes.windll.user32.IsWindow(hwnd):
                        return gw.Win32Window(hwnd)
            except Exception:
                pass

        # 3. Thử quét tất cả HWND thuộc tiến trình có tên emrHIS.exe
        try:
            user32 = ctypes.windll.user32
            kernel32 = ctypes.windll.kernel32
            PROCESS_QUERY_INFORMATION = 0x0400
            PROCESS_VM_READ = 0x0010

            target_hwnd = []

            def _enum_cb(hwnd, _):
                if not user32.IsWindowVisible(hwnd):
                    return True
                rect = wintypes.RECT()
                user32.GetWindowRect(hwnd, ctypes.byref(rect))
                w = rect.right - rect.left
                h = rect.bottom - rect.top
                if w < 200 or h < 200:
                    return True

                pid = wintypes.DWORD()
                user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                h_proc = kernel32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, False, pid.value)
                if h_proc:
                    buf = ctypes.create_unicode_buffer(512)
                    size = wintypes.DWORD(512)
                    if kernel32.QueryFullProcessImageNameW(h_proc, 0, buf, ctypes.byref(size)):
                        exe_name = os.path.basename(buf.value).lower()
                        if "emrhis" in exe_name or exe_name == "emrhis.exe":
                            target_hwnd.append(hwnd)
                    kernel32.CloseHandle(h_proc)
                return True

            WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
            user32.EnumWindows(WNDENUMPROC(_enum_cb), 0)

            if target_hwnd:
                return gw.Win32Window(target_hwnd[0])
        except Exception:
            pass

        return None

    def find_emrhis_window(self, title_part=None, auto_launch=True):
        r"""
        Tìm và kích hoạt cửa sổ emrHIS lên màn hình:
        - Quét đa cơ chế (Tiêu đề, UIA, HWND Process)
        - Nếu chưa mở và auto_launch=True: Tự động khởi chạy từ C:\PRIVATE-DPT\HIS\emrHIS.exe
        - Kích hoạt cửa sổ cưỡng bức (Force Activate)
        """
        w = self._search_any_emrhis_window(title_part)

        if not w and auto_launch and title_part is None:
            self.log("⚠️ Chưa phát hiện cửa sổ emrHIS trên màn hình. Đang tự động mở phần mềm...")
            w = self.launch_emrhis()

        if w:
            self.force_activate_window(w)
            return w
        return None

    def get_safe_pos(self, pos_dict, win=None):
        """
        Xác định tọa độ click an toàn tuyệt đối:
        - Ưu tiên tọa độ tuyệt đối x, y mà người dùng đã cân chỉnh trên màn hình
        - Luôn kẹp cách mép màn hình tối thiểu 10px để không bao giờ chạm góc (0,0) kích hoạt FailSafeException
        """
        if not pos_dict:
            return None
        screen_w, screen_h = pyautogui.size()

        target_x = pos_dict.get("x", 0)
        target_y = pos_dict.get("y", 0)

        use_rel = self.config.get("settings", {}).get("coordinate_mode") == "window_relative"
        if use_rel and win and "rx" in pos_dict and "ry" in pos_dict:
            rx = pos_dict["rx"]
            ry = pos_dict["ry"]
            if rx > 0 and ry > 0:
                rel_x = win.left + rx
                rel_y = win.top + ry
                if 10 <= rel_x <= screen_w - 10 and 10 <= rel_y <= screen_h - 10:
                    target_x = rel_x
                    target_y = rel_y

        target_x = max(10, min(screen_w - 10, int(target_x)))
        target_y = max(10, min(screen_h - 10, int(target_y)))
        return target_x, target_y

    # =========================================================================
    # HÀM XỬ LÝ HỘP THOẠI CẢNH BÁO TỰ ĐỘNG BẤM 'CÓ' (UIA + PHÍM TẮT)
    # =========================================================================
    def auto_click_dialog_yes(self, timeout=2.0):
        """
        Tự động tìm và bấm nút 'Có' (hoặc '&Có', 'Yes', 'Đồng ý') trên hộp thoại cảnh báo:
        - Quét cửa sổ popup ở trên cùng (Foreground Control) và các cửa sổ con.
        - Sử dụng UIAutomation để tìm nút bấm theo tên và lấy tọa độ thực tế (BoundingRectangle),
          bất kể vị trí hay kích thước của cảnh báo thay đổi như thế nào trên màn hình.
        - Fallback gửi phím tắt Alt+C (chuẩn Windows cho &Có) và Enter khi phát hiện có dialog.
        """
        start_time = time.time()
        dialog_detected = False

        while time.time() - start_time < timeout:
            try:
                if auto is not None:
                    # 1. Quét control / cửa sổ đang Foreground
                    fg = auto.GetForegroundControl()
                    if fg:
                        fg_name = (fg.Name or "").strip().lower()
                        is_likely_dialog = any(k in fg_name for k in ["cảnh báo", "thông báo", "xác nhận", "hỏi", "lưu ý", "warning", "confirm", "question", "emrhis"])

                        # A. Tìm trực tiếp theo ButtonControl
                        target_names = ["Có", "&Có", "Yes", "&Yes", "Đồng ý", "Chấp nhận", "Xác nhận"]
                        for target_name in target_names:
                            btn = fg.ButtonControl(searchDepth=5, Name=target_name)
                            if btn.Exists(0.04):
                                dialog_detected = True
                                rect = btn.BoundingRectangle
                                if rect and (rect.right > rect.left) and (rect.bottom > rect.top):
                                    cx = (rect.left + rect.right) // 2
                                    cy = (rect.top + rect.bottom) // 2
                                    pyautogui.click(cx, cy)
                                    self.log(f"🔔 Đã tự động click nút '{btn.Name}' tại tọa độ thực tế ({cx}, {cy}) trên cảnh báo.")
                                else:
                                    btn.Click()
                                    self.log(f"🔔 Đã click nút '{btn.Name}' qua UIA trên cảnh báo.")
                                time.sleep(0.3)
                                return True

                        # B. Tìm theo SubName nếu tên có tiền tố/hậu tố
                        for sub_name in ["Có", "Yes", "Đồng ý"]:
                            btn = fg.ButtonControl(searchDepth=5, SubName=sub_name)
                            if btn.Exists(0.04):
                                dialog_detected = True
                                rect = btn.BoundingRectangle
                                if rect and (rect.right > rect.left) and (rect.bottom > rect.top):
                                    cx = (rect.left + rect.right) // 2
                                    cy = (rect.top + rect.bottom) // 2
                                    pyautogui.click(cx, cy)
                                    self.log(f"🔔 Đã click nút chứa '{sub_name}' tại tọa độ thực tế ({cx}, {cy}) trên cảnh báo.")
                                else:
                                    btn.Click()
                                    self.log(f"🔔 Đã click nút chứa '{sub_name}' qua UIA.")
                                time.sleep(0.3)
                                return True

                        # C. Nếu là hộp thoại có nút Không / Hủy -> Chắc chắn có dialog
                        btn_no = fg.ButtonControl(searchDepth=3, Name="Không")
                        if btn_no.Exists(0.04):
                            dialog_detected = True
                            pyautogui.hotkey('alt', 'c')
                            time.sleep(0.1)
                            pyautogui.press('enter')
                            self.log("🔔 Đã chọn 'Có' (Alt+C/Enter) trên hộp thoại xác nhận.")
                            time.sleep(0.3)
                            return True

                        if is_likely_dialog:
                            dialog_detected = True

                    # 2. Quét thêm các cửa sổ con của Desktop (RootControl) nếu fg không bắt được
                    root = auto.GetRootControl()
                    for win in root.GetChildren():
                        if win.ControlType == auto.ControlType.WindowControl:
                            w_rect = win.BoundingRectangle
                            # Nếu là cửa sổ nhỏ (kích thước của popup/dialog)
                            if w_rect and (w_rect.width() < 900 and w_rect.height() < 600):
                                for target_name in ["Có", "&Có", "Yes", "&Yes", "Đồng ý"]:
                                    btn = win.ButtonControl(searchDepth=4, Name=target_name)
                                    if btn.Exists(0.03):
                                        dialog_detected = True
                                        rect = btn.BoundingRectangle
                                        if rect and (rect.right > rect.left):
                                            cx = (rect.left + rect.right) // 2
                                            cy = (rect.top + rect.bottom) // 2
                                            pyautogui.click(cx, cy)
                                            self.log(f"🔔 Đã click nút '{btn.Name}' tại tọa độ ({cx}, {cy}) trên cửa sổ '{win.Name}'.")
                                        else:
                                            btn.Click()
                                            self.log(f"🔔 Đã click nút '{btn.Name}' qua UIA.")
                                        time.sleep(0.3)
                                        return True
            except Exception:
                pass
            time.sleep(0.08)

        # 3. Nếu phát hiện có Dialog đang mở mà chưa click được nút
        if dialog_detected:
            pyautogui.hotkey('alt', 'c')
            time.sleep(0.1)
            pyautogui.press('enter')
            self.log("🔔 Đã gửi Alt+C / Enter để đóng hộp thoại cảnh báo.")
            return True

        # Nếu không có dialog nào xuất hiện sau thời gian chờ -> Tiếp tục an toàn
        self.log("ℹ️ Không phát hiện cảnh báo xuất hiện sau thao tác.")
        return False

    # =========================================================================
    # HÀM CHUẨN HÓA VÀ ĐIỀN THỜI GIAN (DEVEXPRESS DATEEDIT MASK)
    # =========================================================================
    def normalize_time_str(self, t_val):
        """Đảm bảo định dạng giờ HH:mm (2 chữ số giờ, 2 chữ số phút)"""
        if not t_val:
            return "08:00"
        t_clean = str(t_val).strip()
        parts = t_clean.split(":")
        if len(parts) >= 2:
            h = parts[0].strip().zfill(2)
            m = parts[1].strip()[:2].zfill(2)
            return f"{h}:{m}"
        return t_clean

    def normalize_datetime_str(self, dt_val, fallback_date=""):
        """Đảm bảo định dạng ngày giờ chuẩn emrHIS: HH:mm dd/MM/yyyy"""
        if not dt_val:
            dt_val = ""
        dt_clean = str(dt_val).strip()

        if " " not in dt_clean:
            time_part = self.normalize_time_str(dt_clean)
            date_part = fallback_date or time.strftime("%d/%m/%Y")
            return f"{time_part} {date_part}"

        parts = dt_clean.split(" ", 1)
        time_part = self.normalize_time_str(parts[0])
        date_part = parts[1].strip()

        d_parts = date_part.replace("-", "/").split("/")
        if len(d_parts) == 3:
            d = d_parts[0].zfill(2)
            m = d_parts[1].zfill(2)
            y = d_parts[2]
            if len(y) == 2:
                y = "20" + y
            date_part = f"{d}/{m}/{y}"
        elif not date_part:
            date_part = time.strftime("%d/%m/%Y")

        return f"{time_part} {date_part}"

    def set_datetime_field(self, pos, dt_str, form_window=None):
        """
        Điền chính xác ngày giờ vào ô DevExpress DateEdit (mask HH:mm dd/MM/yyyy)
        Bằng cách xóa sạch ô, dán chuẩn định dạng HH:mm dd/MM/yyyy
        """
        if not pos:
            return
        delay = self.speed_var.get()
        cx, cy = pos
        dt_formatted = self.normalize_datetime_str(dt_str)

        # 1. Click vào ô thời gian
        pyautogui.click(cx, cy)
        time.sleep(delay * 0.2)
        pyautogui.click(cx, cy, clicks=3)
        time.sleep(delay * 0.1)

        # 2. Xóa sạch ô bằng Home -> Shift+End -> Backspace
        pyautogui.press("home")
        time.sleep(0.05)
        pyautogui.hotkey("ctrl", "a")
        time.sleep(0.05)
        pyautogui.press("backspace")
        time.sleep(0.05)

        # 3. Dán qua clipboard chuỗi đầy đủ HH:mm dd/MM/yyyy
        pyperclip.copy(dt_formatted)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(delay * 0.25)
        pyautogui.press("enter")
        time.sleep(delay * 0.1)

        self.log(f"🕒 Đã nhập thời gian: {dt_formatted}")

    # =========================================================================
    # HÀM CHỌN MỤC TỪ DROPDOWN COMBOBOX (UIA + PHÍM ĐIỀU HƯỚNG)
    # =========================================================================
    def select_dropdown_item(self, pos_safe, item_name, form_win=None):
        """
        Chọn một mục từ danh sách thả xuống (Dropdown ComboBox):
        - Click mở dropdown (nút mũi tên dropdown hoặc Alt+Down)
        - Chọn item từ danh sách (End cho 'Khác', Home + Down cho 'Chủ động')
        - Dán đồng thời giá trị để DevExpress LookUpEdit nhận dạng
        """
        if not pos_safe or not item_name:
            return

        delay = self.speed_var.get()
        cx, cy = pos_safe
        clean = item_name.strip().lower()

        # 1. Click vào ô ComboBox để focus
        pyautogui.click(cx, cy)
        time.sleep(delay * 0.25)

        # 2. Dán text trước để LookUpEdit nhận gợi ý
        pyautogui.hotkey("ctrl", "a")
        pyperclip.copy(item_name)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(delay * 0.2)

        # 3. Mở danh sách xổ xuống: Click nút mũi tên dropdown bên phải hoặc Alt+Down
        arrow_x = cx + 150
        screen_w, _ = pyautogui.size()
        if arrow_x < screen_w - 20:
            pyautogui.click(arrow_x, cy)
            time.sleep(delay * 0.25)
        pyautogui.hotkey("alt", "down")
        time.sleep(delay * 0.25)

        # 4. Điều hướng chọn từ dropdown list
        if "khác" in clean or "khac" in clean:
            # Mục 'Khác' thường nằm ở cuối danh sách dropdown
            pyautogui.press("end")
            time.sleep(delay * 0.15)
            pyautogui.press("enter")
            self.log(f"🔽 Đã chọn '{item_name}' từ dropdown (phím End + Enter).")
        elif "chủ động" in clean or "chu dong" in clean:
            # Trong dropdown: Mục 1 là 'Cấp cứu', Mục 2 là 'Chủ động'
            # Do đó phải bấm Home rồi bấm Down (mũi tên xuống) để chọn 'Chủ động'
            pyautogui.press("home")
            time.sleep(delay * 0.1)
            pyautogui.press("down")
            time.sleep(delay * 0.15)
            pyautogui.press("enter")
            self.log(f"🔽 Đã chọn '{item_name}' từ dropdown (phím Home + Down + Enter).")
        else:
            first_char = clean[0] if clean else "c"
            pyautogui.press(first_char)
            time.sleep(delay * 0.2)
            pyautogui.press("enter")
            self.log(f"🔽 Đã chọn '{item_name}' từ dropdown ({first_char} + Enter).")

        time.sleep(delay * 0.2)

    # =========================================================================
    # HÀM XỬ LÝ NHẬP NHÂN VIÊN Ê-KÍP PTTT
    # =========================================================================
    def get_ktv_code(self, name_or_code):
        """Lấy mã nhân viên viết tắt (ví dụ: Hoàng Đức Đạt -> hdd)"""
        if not name_or_code:
            return "hdd"
        name_clean = str(name_or_code).strip()
        if len(name_clean) <= 5 and " " not in name_clean:
            return name_clean.lower()

        # Tra trong bảng staff_mapping nếu có
        mapping = self.config.get("staff_mapping", {})
        for k, v in mapping.items():
            if k.lower() in name_clean.lower() or name_clean.lower() in k.lower():
                return v.strip().lower()

        return ""

    def _find_form_pttt_uia(self):
        """Tìm đối tượng WindowControl của popup 'FormThuThuat_Ekip' bằng UIAutomation"""
        if auto is None:
            return None
        try:
            # 1. Tìm trực tiếp theo AutomationId='FormThuThuat_Ekip'
            form = auto.WindowControl(searchDepth=4, AutomationId="FormThuThuat_Ekip")
            if form.Exists(0.2):
                return form

            # 2. Tìm theo Name/SubName
            form = auto.WindowControl(searchDepth=4, SubName="Cập Nhật Thông Tin Thủ Thuật")
            if form.Exists(0.2):
                return form

            # 3. Quét từ FormMain con
            main_win = auto.WindowControl(searchDepth=2, AutomationId="FormMain")
            if main_win.Exists(0.1):
                f = main_win.WindowControl(searchDepth=3, AutomationId="FormThuThuat_Ekip")
                if f.Exists(0.2):
                    return f
                f = main_win.WindowControl(searchDepth=3, SubName="Cập Nhật Thông Tin Thủ Thuật")
                if f.Exists(0.2):
                    return f
        except Exception as e:
            self.log(f"Lỗi tìm form qua UIA: {e}", level="WARN")
        return None

    def _find_form_main_uia(self):
        """Tìm đối tượng WindowControl của FormMain emrHIS bằng UIAutomation"""
        if auto is None:
            return None
        try:
            # 1. Tìm trực tiếp theo AutomationId='FormMain'
            form = auto.WindowControl(searchDepth=3, AutomationId="FormMain")
            if form.Exists(0.2):
                return form
            # 2. Tìm theo SubName='emrHIS'
            form = auto.WindowControl(searchDepth=3, SubName="emrHIS")
            if form.Exists(0.2):
                return form
            # 3. Quét các cửa sổ Desktop cấp 1
            root = auto.GetRootControl()
            for win in root.GetChildren():
                if win.ControlType == auto.ControlType.WindowControl:
                    w_name = (win.Name or "").lower()
                    if "emrhis" in w_name or win.AutomationId == "FormMain":
                        return win
        except Exception:
            pass
        return None

    def _find_button_start_uia(self, main_uia=None):
        """Tìm nút 'Bắt đầu thực hiện' trên FormMain emrHIS bằng UIAutomation"""
        if auto is None:
            return None
        try:
            if not main_uia:
                main_uia = self._find_form_main_uia()
            if main_uia:
                for name in ["Bắt đầu thực hiện", "Bắt đầu", "Thực hiện"]:
                    btn = main_uia.ButtonControl(searchDepth=6, SubName=name)
                    if btn.Exists(0.08):
                        return btn
                    ctrl = main_uia.Control(searchDepth=6, SubName=name)
                    if ctrl.Exists(0.08) and ctrl.ControlType in [auto.ControlType.ButtonControl, auto.ControlType.MenuItemControl]:
                        return ctrl
        except Exception:
            pass
        return None

    def _find_context_menu_item_uia(self, target_names=None, timeout=1.0):
        """
        Tìm MenuItemControl trên Context Menu vừa mở bằng UIAutomation
        Giúp click chính xác 100% vào mục 'Nhập Thông Tin PTTT' mà không lo lệch chuột
        """
        if auto is None:
            return None
        if target_names is None:
            target_names = ["Nhập Thông Tin PTTT", "PTTT", "Thủ thuật", "Nhập thông tin"]

        start_t = time.time()
        while time.time() - start_t < timeout:
            try:
                root = auto.GetRootControl()
                for name in target_names:
                    # 1. Quét MenuItem trực tiếp trên Desktop root
                    item = root.MenuItemControl(searchDepth=5, SubName=name)
                    if item.Exists(0.04):
                        return item
                    # 2. Quét trong MenuControl
                    menu = root.MenuControl(searchDepth=4)
                    if menu.Exists(0.04):
                        item = menu.MenuItemControl(searchDepth=3, SubName=name)
                        if item.Exists(0.04):
                            return item
            except Exception:
                pass
            time.sleep(0.08)
        return None

    def _get_control_center_pos(self, ctrl):
        """Lấy tọa độ tâm thực tế (cx, cy) của một UIAutomation Control"""
        if ctrl and ctrl.Exists(0.1):
            try:
                rect = ctrl.BoundingRectangle
                if rect and rect.width() > 0 and rect.height() > 0:
                    cx = (rect.left + rect.right) // 2
                    cy = (rect.top + rect.bottom) // 2
                    return cx, cy
            except Exception:
                pass
        return None

    def _set_control_text(self, ctrl, text, pos_fallback=None):
        """
        Gán giá trị văn bản cho Control thông minh và siêu tốc:
        1. Thử dùng UIAutomation ValuePattern.SetValue() (chạy tức thì trong 0.005s, không cần chuột hay phím ảo)
        2. Nếu không thành công, tự động fallback click tâm BoundingRectangle hoặc pos_fallback, rồi paste qua Clipboard
        """
        delay = self.speed_var.get()
        if ctrl and auto is not None:
            try:
                val_pat = ctrl.GetPattern(auto.PatternId.ValuePattern) if hasattr(ctrl, 'GetPattern') else None
                if val_pat and hasattr(val_pat, 'SetValue'):
                    val_pat.SetValue(str(text))
                    self.log(f"⚡ Đã gán trực tiếp qua UIA ValuePattern: '{text}'")
                    return True
            except Exception:
                pass

        pos = self._get_control_center_pos(ctrl) if ctrl else pos_fallback
        if pos:
            pyautogui.click(pos[0], pos[1])
            time.sleep(delay * 0.2)
            pyautogui.hotkey("ctrl", "a")
            time.sleep(0.05)
            pyautogui.press("backspace")
            pyperclip.copy(str(text))
            pyautogui.hotkey("ctrl", "v")
            time.sleep(delay * 0.2)
            pyautogui.press("enter")
            return True
        return False

    def fill_ekip_ktv(self, pos_ekip, task, form_window=None):
        """
        Điền KTV chính vào ô 'Nhân Viên' dòng 1 của bảng 'Ê-Kip PTTT':
        - Dò đúng tọa độ cột 'Nhân Viên' dòng 1 (x~1640, y~257)
        - Nhập mã KTV (nếu có như hdd) hoặc dán tên đầy đủ KTV rồi bấm Enter
        """
        if not pos_ekip:
            return
        delay = self.speed_var.get()

        nv_name = task.get("ktv_ten", "").strip()
        ktv_code = task.get("ktv_ma", "").strip()
        if not ktv_code or ktv_code == nv_name:
            ktv_code = self.get_ktv_code(nv_name)

        cell_x, cell_y = pos_ekip

        self.log(f"👨‍⚕️ Nhập KTV chính: '{nv_name}' (mã: '{ktv_code}') tại ô ({cell_x}, {cell_y})...")

        # 1. Click vào ô Nhân Viên dòng 1
        pyautogui.click(cell_x, cell_y)
        time.sleep(delay * 0.25)
        pyautogui.doubleClick(cell_x, cell_y)
        time.sleep(delay * 0.25)

        # 2. Mở chế độ gõ bằng F2 hoặc Enter
        pyautogui.press("f2")
        time.sleep(0.1)

        # 3. Nếu có mã ngắn (ví dụ: hdd), gõ mã; nếu không có mã thì gõ/dán tên đầy đủ
        if ktv_code:
            pyautogui.write(ktv_code, interval=0.06)
            time.sleep(delay * 0.3)
            pyautogui.press("enter")
            self.log(f"👨‍⚕️ Đã gõ mã KTV: '{ktv_code}'")
        else:
            pyperclip.copy(nv_name)
            pyautogui.hotkey("ctrl", "v")
            time.sleep(delay * 0.3)
            pyautogui.press("enter")
            self.log(f"👨‍⚕️ Đã dán tên KTV: '{nv_name}'")

        time.sleep(delay * 0.25)
        pyautogui.press("enter")
        time.sleep(delay * 0.15)

    # =========================================================================
    # ĐIỀN FORM "CẬP NHẬT THÔNG TIN THỦ THUẬT" (CORE ENGINE - UIA AUTOMATIONIDS)
    # =========================================================================
    def fill_form_pttt(self, task, form_window=None):
        """
        Thực hiện điền toàn bộ trường vào cửa sổ 'Cập Nhật Thông Tin Thủ Thuật'
        Sử dụng UIAutomation theo AutomationId chuẩn 100% từ emrHIS,
        có fallback an toàn tuyệt đối theo tọa độ cấu hình.
        """
        delay = self.speed_var.get()
        cal = self.config.get("calibration", {}).get("form_pttt", {})

        if not form_window:
            form_title = self.config.get("settings", {}).get("window_form_title_contains", "Cập Nhật Thông Tin Thủ Thuật")
            form_window = self.find_emrhis_window(form_title)

        if not form_window:
            raise Exception("Không tìm thấy cửa sổ 'Cập Nhật Thông Tin Thủ Thuật' đang mở trên màn hình!")

        try:
            form_window.activate()
            time.sleep(delay * 0.5)
        except Exception:
            pass

        self.log(f"👉 Bắt đầu điền form: {task.get('ten_bn')} - {task.get('thu_thuat')}")

        # Tìm đối tượng UIA của form
        form_uia = self._find_form_pttt_uia()
        if form_uia:
            self.log("🎯 Đã liên kết UIAutomation với cửa sổ 'FormThuThuat_Ekip' thành công!")
        else:
            self.log("⚠️ Không gắn được UIA trực tiếp, sử dụng tọa độ màn hình chuẩn hóa.", level="WARN")

        # Chuẩn bị dữ liệu
        ngay_gio_bd = task.get("ngay_gio_bd") or f"{task.get('gio_bat_dau', '08:00')} {task.get('ngay', '')}".strip()
        ngay_gio_kt = task.get("ngay_gio_kt") or f"{task.get('gio_ket_thuc', '08:30')} {task.get('ngay', '')}".strip()
        tinh_hinh = task.get("tinh_hinh") or self.config.get("defaults", {}).get("tinh_hinh", "Chủ động")
        vo_cam = task.get("vo_cam") or self.config.get("defaults", {}).get("vo_cam", "Khác")
        may_y_te = task.get("may_y_te", "").strip()
        mo_ta = task.get("mo_ta") or "."

        # =====================================================================
        # 1. THỜI GIAN BẮT ĐẦU (txtNgayPTTT)
        # =====================================================================
        pos_bd = None
        if form_uia:
            ctrl_bd = form_uia.PaneControl(AutomationId="txtNgayPTTT")
            pos_bd = self._get_control_center_pos(ctrl_bd)
        if not pos_bd:
            pos_bd = self.get_safe_pos(cal.get("thoi_gian_bat_dau"), form_window)
        if pos_bd:
            self.set_datetime_field(pos_bd, ngay_gio_bd, form_window)
        time.sleep(delay * 0.2)

        # =====================================================================
        # 2. THỜI GIAN KẾT THÚC (txtNgayPTTT_End)
        # =====================================================================
        pos_kt = None
        if form_uia:
            ctrl_kt = form_uia.PaneControl(AutomationId="txtNgayPTTT_End")
            pos_kt = self._get_control_center_pos(ctrl_kt)
        if not pos_kt:
            pos_kt = self.get_safe_pos(cal.get("thoi_gian_ket_thuc"), form_window)
        if pos_kt:
            self.set_datetime_field(pos_kt, ngay_gio_kt, form_window)
        time.sleep(delay * 0.2)

        # =====================================================================
        # 3. PHƯƠNG PHÁP VÔ CẢM (txtPPVoCam) - EditControl chuẩn
        # =====================================================================
        ctrl_vc = form_uia.EditControl(AutomationId="txtPPVoCam") if form_uia else None
        pos_vc = self._get_control_center_pos(ctrl_vc) if ctrl_vc else self.get_safe_pos(cal.get("cbo_vo_cam"), form_window)
        if ctrl_vc or pos_vc:
            self._set_control_text(ctrl_vc, vo_cam, pos_fallback=pos_vc)
            self.log(f"💉 Đã nhập Phương pháp vô cảm: '{vo_cam}'")
        time.sleep(delay * 0.2)

        # =====================================================================
        # 4. TÌNH HÌNH PTTT (txtTinhHinhPTTT) - ComboBoxControl ('Chủ động')
        # =====================================================================
        pos_th = None
        if form_uia:
            ctrl_th = form_uia.ComboBoxControl(AutomationId="txtTinhHinhPTTT")
            if ctrl_th.Exists(0.1):
                btn_open = ctrl_th.ButtonControl(Name="Open")
                if btn_open.Exists(0.1):
                    pos_th = self._get_control_center_pos(btn_open)
                else:
                    pos_th = self._get_control_center_pos(ctrl_th)
        if not pos_th:
            pos_th = self.get_safe_pos(cal.get("cbo_tinh_hinh"), form_window)

        if pos_th:
            # Click mở dropdown và chọn 'Chủ động' (Home -> Down -> Enter)
            pyautogui.click(pos_th[0], pos_th[1])
            time.sleep(delay * 0.25)
            clean_th = tinh_hinh.strip().lower()
            if "chủ" in clean_th or "chu" in clean_th:
                pyautogui.press("home")
                time.sleep(delay * 0.1)
                pyautogui.press("down")
                time.sleep(delay * 0.15)
                pyautogui.press("enter")
                self.log(f"🔽 Đã chọn Tình hình PTTT: '{tinh_hinh}' (Home + Down + Enter)")
            elif "cấp" in clean_th or "cap" in clean_th:
                pyautogui.press("home")
                time.sleep(delay * 0.1)
                pyautogui.press("enter")
                self.log(f"🔽 Đã chọn Tình hình PTTT: '{tinh_hinh}' (Home + Enter)")
            else:
                self.select_dropdown_item(pos_th, tinh_hinh, form_window)
        time.sleep(delay * 0.2)

        # =====================================================================
        # 5. MÁY Y TẾ (txtMayThucHien) - EditControl
        # =====================================================================
        if may_y_te and len(may_y_te) > 1:
            ctrl_may = form_uia.EditControl(AutomationId="txtMayThucHien") if form_uia else None
            pos_may = self._get_control_center_pos(ctrl_may) if ctrl_may else self.get_safe_pos(cal.get("cbo_may_y_te"), form_window)
            if ctrl_may or pos_may:
                self._set_control_text(ctrl_may, may_y_te, pos_fallback=pos_may)
                self.log(f"⚙️ Đã nhập Máy y tế: '{may_y_te}'")

        # =====================================================================
        # 6. MÔ TẢ THỦ THUẬT (txtMoTaPTTT) - EditControl (Mặc định: '.')
        # =====================================================================
        ctrl_mt = form_uia.EditControl(AutomationId="txtMoTaPTTT") if form_uia else None
        pos_mt = self._get_control_center_pos(ctrl_mt) if ctrl_mt else self.get_safe_pos(cal.get("txt_mo_ta"), form_window)
        if ctrl_mt or pos_mt:
            self._set_control_text(ctrl_mt, mo_ta, pos_fallback=pos_mt)
            self.log(f"📝 Đã nhập Mô tả: '{mo_ta}'")

        # =====================================================================
        # 7. Ê-KÍP PTTT -> CỘT NHÂN VIÊN DÒNG 1 (mListViewData)
        # =====================================================================
        pos_ekip = None
        if form_uia:
            try:
                lv = form_uia.ListControl(AutomationId="mListViewData")
                if lv.Exists(0.1):
                    item1 = lv.ListItemControl(Name="1")
                    if item1.Exists(0.1):
                        row_rect = item1.BoundingRectangle
                        # Lấy tọa độ cột Nhân Viên từ Header hoặc ước lượng
                        hdr_nv = lv.HeaderItemControl(Name="Nhân Viên")
                        if hdr_nv.Exists(0.1):
                            nv_rect = hdr_nv.BoundingRectangle
                            cx = (nv_rect.left + min(nv_rect.right, lv.BoundingRectangle.right)) // 2
                        else:
                            cx = row_rect.left + int(row_rect.width() * 0.65)
                        cy = (row_rect.top + row_rect.bottom) // 2
                        pos_ekip = (cx, cy)
            except Exception as e:
                self.log(f"Lỗi dò ô KTV qua UIA: {e}", level="WARN")

        if not pos_ekip:
            pos_ekip = self.get_safe_pos(cal.get("grid_ekip_cell_nhanvien"), form_window)

        if pos_ekip:
            self.fill_ekip_ktv(pos_ekip, task, form_window)

        # =====================================================================
        # 8. BẤM NÚT "LƯU + ĐÓNG" (btnSaveClose)
        # =====================================================================
        btn_save_uia = None
        saved_by_invoke = False
        if form_uia:
            btn_save_uia = form_uia.ButtonControl(AutomationId="btnSaveClose")
            if not btn_save_uia.Exists(0.1):
                btn_save_uia = form_uia.ButtonControl(SubName="Lưu")

            if btn_save_uia and btn_save_uia.Exists(0.1):
                # Thử InvokePattern trước để phản hồi tức thì
                try:
                    inv = btn_save_uia.GetPattern(auto.PatternId.InvokePattern) if hasattr(btn_save_uia, 'GetPattern') else None
                    if inv and hasattr(inv, 'Invoke'):
                        inv.Invoke()
                        saved_by_invoke = True
                        self.log("💾 Đã kích hoạt 'Lưu + Đóng' qua UIA InvokePattern siêu tốc.")
                except Exception:
                    pass

        if not saved_by_invoke:
            pos_save = self._get_control_center_pos(btn_save_uia) if btn_save_uia else None
            if not pos_save:
                pos_save = self.get_safe_pos(cal.get("btn_luu_dong"), form_window)

            if pos_save:
                pyautogui.click(pos_save[0], pos_save[1])
                self.log(f"💾 Đã bấm 'Lưu + Đóng' tại ({pos_save[0]}, {pos_save[1]}).")
            elif btn_save_uia:
                btn_save_uia.Click()
                self.log("💾 Đã click 'Lưu + Đóng' qua UIAutomation Click.")

        time.sleep(delay * 1.2)

        # Tự động đóng popup cảnh báo/xác nhận nếu có
        if self.config.get("settings", {}).get("auto_dismiss_popups", True):
            self.auto_click_dialog_yes(timeout=2.0)

        self.log(f"✅ Hoàn thành điền form cho: {task.get('ten_bn')}")

    # =========================================================================
    # PHÍM TẮT F8: ĐIỀN NHANH 1 FORM ĐANG MỞ
    # =========================================================================
    def fill_current_open_form(self):
        if not self.tasks:
            messagebox.showwarning("Chưa có dữ liệu", "Vui lòng nạp danh sách ca trước (Dán từ Clipboard hoặc mở file JSON)!")
            return

        # Lấy ca đang được chọn trong bảng hoặc ca đầu tiên chưa làm
        selected_iid = self.tree.focus()
        task_idx = None
        if selected_iid:
            try:
                task_idx = int(selected_iid)
            except ValueError:
                pass

        if task_idx is None:
            # Tìm ca đầu tiên chưa hoàn thành
            for idx, t in enumerate(self.tasks):
                if t.get("status") != "Hoàn thành":
                    task_idx = idx
                    break
            if task_idx is None:
                task_idx = 0

        task = self.tasks[task_idx]

        def run_thread():
            try:
                self.btn_fill_one.config(state=tk.DISABLED)
                self.log(f"⚡ [F8] Đang điền form hiện tại cho ca #{task_idx + 1}: {task.get('ten_bn')}...")
                self.fill_form_pttt(task)
                task["status"] = "Hoàn thành"
                self.root.after(0, self._refresh_table)
                self.root.after(0, lambda: self._select_next_row(task_idx))
            except Exception as e:
                self.log(f"❌ Lỗi [F8]: {e}", level="ERROR")
                messagebox.showerror("Lỗi điền form", str(e))
            finally:
                self.btn_fill_one.config(state=tk.NORMAL)

        threading.Thread(target=run_thread, daemon=True).start()

    def _select_next_row(self, current_idx):
        next_idx = current_idx + 1
        if next_idx < len(self.tasks):
            self.tree.selection_set(str(next_idx))
            self.tree.focus(str(next_idx))
            self.tree.see(str(next_idx))

    # =========================================================================
    # CORE PIPELINE: THỰC HIỆN ĐẦY ĐỦ 1 CA THỦ THUẬT
    # =========================================================================
    def execute_single_task_pipeline(self, task, idx=0):
        """
        Thực hiện toàn bộ chu trình nhập cho 1 ca thủ thuật:
        Tìm BN -> Chọn BN -> Bắt đầu thực hiện -> Mở PTTT -> Điền form -> Lưu + Đóng
        """
        delay = self.speed_var.get()
        cal_main = self.config.get("calibration", {}).get("main_window", {})
        form_title = self.config.get("settings", {}).get("window_form_title_contains", "Cập Nhật Thông Tin Thủ Thuật")
        ten_bn = task.get("ten_bn", "").strip()

        # 1. Kích hoạt cửa sổ chính emrHIS
        main_win = self.find_emrhis_window()
        if not main_win:
            raise Exception("Không tìm thấy cửa sổ emrHIS! Vui lòng mở emrHIS lên.")

        main_uia = self._find_form_main_uia()

        # 2. Tìm kiếm bệnh nhân theo tên (Không ấn Enter để tránh ra danh sách nhiều ngày)
        pos_search = self.get_safe_pos(cal_main.get("search_box"), main_win)
        if pos_search:
            pyautogui.click(pos_search[0], pos_search[1])
            time.sleep(delay * 0.5)
            pyautogui.hotkey("ctrl", "a")
            pyautogui.press("backspace")
            pyperclip.copy(ten_bn)
            pyautogui.hotkey("ctrl", "v")
            if self.config.get("settings", {}).get("search_press_enter", False):
                pyautogui.press("enter")
            time.sleep(delay * 0.8)
            # Chuyển con trỏ xuống chọn ngay dòng bệnh nhân đầu tiên trong kết quả lọc
            pyautogui.press("down")
            time.sleep(delay * 0.4)

        if self.stop_requested:
            return False

        # 3. Chọn dòng bệnh nhân trong danh sách
        pos_pt_row = self.get_safe_pos(cal_main.get("patient_first_row"), main_win)
        if pos_pt_row:
            click_pt_x, click_pt_y = pos_pt_row
            # Đảm bảo không click đè lên ô tìm kiếm nếu y bị trùng
            if pos_search and abs(click_pt_y - pos_search[1]) < 25:
                click_pt_y = pos_search[1] + 50
            pyautogui.click(click_pt_x, click_pt_y)
            time.sleep(delay)

        if self.stop_requested:
            return False

        # 4. Bấm "Bắt đầu thực hiện" (Tự động phát hiện nút qua UIA, fallback sang tọa độ)
        btn_start_uia = self._find_button_start_uia(main_uia)
        pos_btn_start = self._get_control_center_pos(btn_start_uia) if btn_start_uia else None
        if not pos_btn_start:
            pos_btn_start = self.get_safe_pos(cal_main.get("btn_bat_dau_thuc_hien"), main_win)

        if pos_btn_start:
            pyautogui.click(pos_btn_start[0], pos_btn_start[1])
            self.log(f"▶️ Đã bấm 'Bắt đầu thực hiện' tại ({pos_btn_start[0]}, {pos_btn_start[1]}). Đang kiểm tra cảnh báo...")
            time.sleep(delay * 0.8)

            # Tự động quét và click nút 'Có' (dò tìm tọa độ thực tế bất kể vị trí nút Có thay đổi)
            if self.config.get("settings", {}).get("auto_dismiss_popups", True):
                self.auto_click_dialog_yes(timeout=2.0)
                time.sleep(delay * 0.5)

        if self.stop_requested:
            return False

        # 5. Chuột phải vào dòng thủ thuật -> chọn "Nhập Thông Tin PTTT"
        pos_proc = self.get_safe_pos(cal_main.get("procedure_first_row"), main_win)
        if pos_proc:
            pyautogui.rightClick(pos_proc[0], pos_proc[1])
            time.sleep(delay * 0.4)

            # Thử tìm MenuItem "Nhập Thông Tin PTTT" bằng UIAutomation để click chuẩn 100%
            menu_item_uia = self._find_context_menu_item_uia(target_names=["Nhập Thông Tin PTTT", "PTTT", "Thủ thuật"])
            pos_menu_uia = self._get_control_center_pos(menu_item_uia) if menu_item_uia else None

            if pos_menu_uia:
                pyautogui.click(pos_menu_uia[0], pos_menu_uia[1])
                self.log(f"🎯 Đã click Menu 'Nhập Thông Tin PTTT' qua UIA tại ({pos_menu_uia[0]}, {pos_menu_uia[1]})!")
            else:
                pos_menu = self.get_safe_pos(cal_main.get("menu_nhap_tt_pttt"), main_win)
                if pos_menu:
                    pyautogui.click(pos_menu[0], pos_menu[1])
                    self.log(f"🎯 Đã click Menu theo tọa độ cấu hình ({pos_menu[0]}, {pos_menu[1]}).")
                else:
                    pyautogui.press("down")
                    pyautogui.press("enter")
                    self.log("🎯 Đã chọn Menu bằng phím tắt Down + Enter.")

            time.sleep(delay * 1.5)

        if self.stop_requested:
            return False

        # 6. Đợi cửa sổ popup form hiện lên
        form_win = None
        for _ in range(15):
            form_win = self.find_emrhis_window(form_title)
            if form_win:
                break
            time.sleep(0.3)

        # 7. Điền form PTTT và ấn Lưu + Đóng
        self.fill_form_pttt(task, form_window=form_win)
        task["status"] = "Hoàn thành"
        return True

    # =========================================================================
    # PHÍM TẮT F7: CHẠY THỬ NGHIỆM ĐÚNG 1 CA (SINGLE TEST RUN)
    # =========================================================================
    def run_single_test_task(self):
        if not self.tasks:
            messagebox.showwarning("Chưa có dữ liệu", "Vui lòng nạp danh sách ca trước (Dán từ Clipboard hoặc mở file JSON)!")
            return

        if self.is_running:
            return

        # Lấy ca đang chọn trong bảng hoặc ca đầu tiên chưa làm
        selected_iid = self.tree.focus()
        task_idx = None
        if selected_iid:
            try:
                task_idx = int(selected_iid)
            except ValueError:
                pass

        if task_idx is None:
            for idx, t in enumerate(self.tasks):
                if t.get("status") != "Hoàn thành":
                    task_idx = idx
                    break
            if task_idx is None:
                task_idx = 0

        task = self.tasks[task_idx]
        ten_bn = task.get("ten_bn", "").strip()
        tt_name = task.get("thu_thuat", "").strip()

        # Đánh dấu chọn trên giao diện
        self.tree.selection_set(str(task_idx))
        self.tree.focus(str(task_idx))
        self.tree.see(str(task_idx))

        self.is_running = True
        self.stop_requested = False
        self.btn_run_all.config(state=tk.DISABLED)
        self.btn_run_test.config(state=tk.DISABLED)
        self.btn_fill_one.config(state=tk.DISABLED)
        self.btn_stop.config(state=tk.NORMAL)

        def worker():
            try:
                self.log(f"🧪 [CHẠY THỬ] Bắt đầu thử nghiệm trọn vẹn 1 ca duy nhất (#{task_idx + 1}): {ten_bn} [{tt_name}]...")
                task["status"] = "Đang chạy thử..."
                self.root.after(0, self._refresh_table)

                success = self.execute_single_task_pipeline(task, task_idx)
                if success:
                    self.log(f"🎉 [CHẠY THỬ THÀNH CÔNG] Hoàn tất ca #{task_idx + 1}: {ten_bn} - {tt_name}!")
                    self.root.after(0, lambda: messagebox.showinfo(
                        "Chạy Thử Nghiệm Thành Công",
                        f"🎉 ĐÃ HOÀN TẤT THỬ NGHIỆM 1 CA:\n\n"
                        f"• Bệnh nhân: {ten_bn}\n"
                        f"• Thủ thuật: {tt_name}\n"
                        f"• Giờ: {task.get('gio_bat_dau')} - {task.get('gio_ket_thuc')}\n"
                        f"• KTV: {task.get('ktv_ma') or task.get('ktv_ten')}\n\n"
                        f"👉 Bạn hãy kiểm tra lại trên emrHIS xem thông tin đã lưu đúng chưa nhé!"
                    ))
            except pyautogui.FailSafeException:
                task["status"] = "Đã dừng (Fail-Safe)"
                self.log("🛑 Nhận lệnh dừng khẩn cấp từ chuột (Fail-Safe) khi đang chạy thử!", level="WARN")
            except Exception as ex:
                task["status"] = f"Lỗi: {str(ex)[:30]}"
                self.log(f"❌ [CHẠY THỬ THẤT BẠI] Lỗi ca #{task_idx + 1} ({ten_bn}): {ex}", level="ERROR")
                self.root.after(0, lambda: messagebox.showerror("Lỗi chạy thử 1 ca", f"Không thể hoàn thành ca thử nghiệm:\n{ex}"))
            finally:
                self.is_running = False
                self.stop_requested = False
                self.root.after(0, self._refresh_table)
                self.root.after(0, lambda: (
                    self.btn_run_all.config(state=tk.NORMAL),
                    self.btn_run_test.config(state=tk.NORMAL),
                    self.btn_fill_one.config(state=tk.NORMAL),
                    self.btn_stop.config(state=tk.DISABLED)
                ))

        threading.Thread(target=worker, daemon=True).start()

    # =========================================================================
    # CHẠY TỰ ĐỘNG TOÀN BỘ DANH SÁCH (F9)
    # =========================================================================
    def start_auto_run(self):
        if not self.tasks:
            messagebox.showwarning("Chưa có ca nào", "Vui lòng nạp danh sách ca trước khi chạy!")
            return

        cal = self.config.get("calibration", {})
        if not cal.get("is_calibrated", False):
            if not messagebox.askyesno(
                "Chưa cân chỉnh tọa độ",
                "Máy tính này chưa được cân chỉnh tọa độ cho emrHIS!\n\n"
                "Bạn có muốn vào phần '🎯 Cân Chỉnh Tọa Độ' ngay bây giờ không?\n"
                "(Bấm No nếu bạn vẫn muốn thử chạy)"
            ):
                pass
            else:
                self.open_calibration_wizard()
                return

        self.is_running = True
        self.stop_requested = False
        self.btn_run_all.config(state=tk.DISABLED)
        self.btn_run_test.config(state=tk.DISABLED)
        self.btn_fill_one.config(state=tk.DISABLED)
        self.btn_stop.config(state=tk.NORMAL)

        def worker():
            self.log("🚀 BẮT ĐẦU CHẠY TỰ ĐỘNG TOÀN BỘ DANH SÁCH CA...")
            delay = self.speed_var.get()

            for idx, task in enumerate(self.tasks):
                if self.stop_requested:
                    self.log("⏹ Đã nhận lệnh dừng từ người dùng!", level="WARN")
                    break

                if task.get("status") == "Hoàn thành":
                    continue

                self.root.after(0, lambda i=idx: (self.tree.selection_set(str(i)), self.tree.focus(str(i)), self.tree.see(str(i))))
                ten_bn = task.get("ten_bn", "").strip()
                tt_name = task.get("thu_thuat", "").strip()
                self.log(f"--- Đang xử lý ca {idx + 1}/{len(self.tasks)}: {ten_bn} [{tt_name}] ---")
                task["status"] = "Đang chạy..."
                self.root.after(0, self._refresh_table)

                try:
                    self.execute_single_task_pipeline(task, idx)
                    self.log(f"✅ Hoàn tất ca #{idx + 1}: {ten_bn}")
                except pyautogui.FailSafeException:
                    self.stop_requested = True
                    task["status"] = "Đã dừng (Fail-Safe)"
                    self.log("🛑 Phát hiện chuột di chuyển vào góc màn hình (Fail-Safe). Đã tạm dừng toàn bộ tiến trình để đảm bảo an toàn!", level="WARN")
                    break
                except Exception as ex:
                    task["status"] = f"Lỗi: {str(ex)[:30]}"
                    self.log(f"❌ Lỗi ca #{idx + 1} ({ten_bn}): {ex}", level="ERROR")

                self.root.after(0, self._refresh_table)
                time.sleep(delay * 1.0)

            self.is_running = False
            self.stop_requested = False
            self.root.after(0, lambda: (
                self.btn_run_all.config(state=tk.NORMAL),
                self.btn_run_test.config(state=tk.NORMAL),
                self.btn_fill_one.config(state=tk.NORMAL),
                self.btn_stop.config(state=tk.DISABLED)
            ))
            self.log("🏁 Hoàn tất phiên chạy tự động!")

        threading.Thread(target=worker, daemon=True).start()

    def request_stop(self):
        if self.is_running:
            self.stop_requested = True
            self.log("⚠️ ĐANG DỪNG KHẨN CẤP...", level="WARN")

    # =========================================================================
    # HƯỚNG DẪN CÂN CHỈNH TỌA ĐỘ TRỰC QUAN (CALIBRATION WIZARD)
    # =========================================================================
    def open_calibration_wizard(self):
        wizard = tk.Toplevel(self.root)
        wizard.title("🎯 Hướng Dẫn Cân Chỉnh Tọa Độ Cho Màn Hình")
        wizard.geometry("640x520")
        wizard.resizable(False, False)
        wizard.attributes("-topmost", True)

        self.is_calibrating = True

        steps = [
            # Màn hình chính
            ("main_window", "search_box", "1. Ô Tìm kiếm Bệnh nhân", "Rê chuột vào Ô TÌM KIẾM BỆNH NHÂN (trên màn hình chính emrHIS) rồi bấm phím [C]"),
            ("main_window", "patient_first_row", "2. Dòng Bệnh nhân đầu tiên", "Rê chuột vào DÒNG BỆNH NHÂN ĐẦU TIÊN trong bảng danh sách rồi bấm phím [C]"),
            ("main_window", "btn_bat_dau_thuc_hien", "3. Nút 'Bắt đầu thực hiện'", "Rê chuột vào NÚT 'BẮT ĐẦU THỰC HIỆN' rồi bấm phím [C]"),
            ("main_window", "procedure_first_row", "4. Dòng Thủ thuật cần chuột phải", "Rê chuột vào DÒNG THỦ THUẬT tương ứng rồi bấm phím [C]"),
            ("main_window", "menu_nhap_tt_pttt", "5. Menu 'Nhập Thông Tin PTTT'", "Chuột phải vào dòng thủ thuật để menu hiện ra, rê vào 'Nhập Thông Tin PTTT' rồi bấm [C]"),
            # Form PTTT
            ("form_pttt", "thoi_gian_bat_dau", "6. Ô 'Thời gian bắt đầu *'", "Mở cửa sổ PTTT lên. Rê chuột vào ô THỜI GIAN BẮT ĐẦU rồi bấm phím [C]"),
            ("form_pttt", "thoi_gian_ket_thuc", "7. Ô 'Thời gian kết thúc *'", "Rê chuột vào ô THỜI GIAN KẾT THÚC rồi bấm phím [C]"),
            ("form_pttt", "cbo_vo_cam", "8. Dropdown 'Phương pháp vô cảm *'", "Rê chuột vào ô PHƯƠNG PHÁP VÔ CẢM rồi bấm phím [C]"),
            ("form_pttt", "cbo_tinh_hinh", "9. Dropdown 'Tình hình PTTT *'", "Rê chuột vào ô TÌNH HÌNH PTTT rồi bấm phím [C]"),
            ("form_pttt", "cbo_may_y_te", "10. Dropdown 'Máy y tế'", "Rê chuột vào ô MÁY Y TẾ (nếu có, hoặc bấm Bỏ Qua) rồi bấm phím [C]"),
            ("form_pttt", "txt_mo_ta", "11. Ô 'Mô tả thủ thuật'", "Rê chuột vào khung MÔ TẢ THỦ THUẬT (ô lớn bên dưới) rồi bấm phím [C]"),
            ("form_pttt", "grid_ekip_cell_nhanvien", "12. Ô Nhân viên dòng 1 (Thủ thuật chính)", "Rê chuột vào ô NHÂN VIÊN dòng 1 của bảng 'Ê-Kip PTTT' rồi bấm phím [C]"),
            ("form_pttt", "btn_luu_dong", "13. Nút 'Lưu + Đóng'", "Rê chuột vào nút 'LƯU + ĐÓNG' (góc dưới cùng bên phải) rồi bấm phím [C]")
        ]

        current_step_idx = [0]
        cal_data = {
            "is_calibrated": True,
            "screen_resolution": [pyautogui.size().width, pyautogui.size().height],
            "main_window": dict(self.config.get("calibration", {}).get("main_window", {})),
            "form_pttt": dict(self.config.get("calibration", {}).get("form_pttt", {}))
        }

        # UI
        lbl_step_num = tk.Label(wizard, text="Bước 1/13", font=("Segoe UI", 12, "bold"), fg="#0284c7")
        lbl_step_num.pack(pady=8)

        lbl_step_title = tk.Label(wizard, text="", font=("Segoe UI", 13, "bold"), fg="#0f172a")
        lbl_step_title.pack(pady=4)

        lbl_step_desc = tk.Label(wizard, text="", font=("Segoe UI", 10), wraplength=580, justify=tk.CENTER, fg="#475569")
        lbl_step_desc.pack(pady=10)

        lbl_pos_live = tk.Label(wizard, text="Tọa độ chuột hiện tại: X=0, Y=0", font=("Consolas", 11, "bold"), fg="#16a34a")
        lbl_pos_live.pack(pady=10)

        btn_box = tk.Frame(wizard)
        btn_box.pack(pady=15)

        def update_step():
            if current_step_idx[0] >= len(steps):
                # Hoàn thành
                lbl_step_num.config(text="🎉 ĐÃ HOÀN TẤT CÂN CHỈNH!")
                lbl_step_title.config(text="Đã lưu toàn bộ tọa độ thành công.")
                lbl_step_desc.config(text="Các thông số đã được lưu vào file emrhis_config.json.\nGiờ đây bạn có thể chạy tự động mượt mà!")
                btn_skip.pack_forget()
                btn_finish.pack(side=tk.LEFT, padx=5)
                return

            sec, key, title, desc = steps[current_step_idx[0]]
            lbl_step_num.config(text=f"Bước {current_step_idx[0] + 1}/{len(steps)}")
            lbl_step_title.config(text=title)
            lbl_step_desc.config(text=desc)

        def on_skip():
            current_step_idx[0] += 1
            update_step()

        def on_finish():
            self.config["calibration"] = cal_data
            save_config(self.config)
            self.is_calibrating = False
            self.log("🎯 Đã cập nhật tọa độ cân chỉnh mới vào emrhis_config.json!")
            wizard.destroy()

        btn_skip = tk.Button(btn_box, text="⏭ Bỏ Qua Bước Này", font=("Segoe UI", 10), command=on_skip)
        btn_skip.pack(side=tk.LEFT, padx=5)

        btn_finish = tk.Button(btn_box, text="💾 Lưu và Đóng", font=("Segoe UI", 10, "bold"), bg="#16a34a", fg="white", command=on_finish)

        # Thread theo dõi chuột & phím C
        def cal_tracker():
            prev_c = False
            while self.is_calibrating and wizard.winfo_exists():
                time.sleep(0.04)
                x, y = pyautogui.position()
                try:
                    lbl_pos_live.config(text=f"Tọa độ chuột hiện tại: X={x}, Y={y}")
                except Exception:
                    break

                now_c = is_key_pressed(VK_KEY_C)
                if now_c and not prev_c:
                    # Bấm phím C
                    if current_step_idx[0] < len(steps):
                        sec, key, _, _ = steps[current_step_idx[0]]

                        # Tính tọa độ tương đối theo cửa sổ nếu tìm thấy
                        rx = x
                        ry = y
                        target_win = self.find_emrhis_window()
                        if target_win and target_win.left >= 0 and target_win.top >= 0:
                            rx = x - target_win.left
                            ry = y - target_win.top
                        if rx < 0 or ry < 0:
                            rx = x
                            ry = y

                        cal_data[sec][key] = {"x": x, "y": y, "rx": rx, "ry": ry}
                        self.log(f"🎯 Đã bắt tọa độ {key}: Screen({x}, {y}) - Relative({rx}, {ry})")
                        current_step_idx[0] += 1
                        wizard.after(0, update_step)

                prev_c = now_c

        threading.Thread(target=cal_tracker, daemon=True).start()
        update_step()

        def on_close():
            self.is_calibrating = False
            wizard.destroy()

        wizard.protocol("WM_DELETE_WINDOW", on_close)


def main():
    root = tk.Tk()
    app = EmrHisBotApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
