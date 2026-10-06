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
import ctypes
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
    # TÌM VÀ ACTIVATE CỬA SỔ emrHIS
    # =========================================================================
    def find_emrhis_window(self, title_part=None):
        if title_part is None:
            title_part = self.config.get("settings", {}).get("window_main_title_contains", "emrHIS")

        windows = gw.getWindowsWithTitle(title_part)
        if not windows:
            # Tìm không phân biệt hoa thường
            all_wins = gw.getAllTitles()
            matches = [t for t in all_wins if title_part.lower() in t.lower()]
            if matches:
                windows = gw.getWindowsWithTitle(matches[0])

        if windows:
            w = windows[0]
            try:
                if w.isMinimized:
                    w.restore()
                w.activate()
                time.sleep(0.3)
            except Exception as e:
                self.log(f"Cảnh báo activate cửa sổ: {e}", level="WARN")
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
    # HÀM CHỌN MỤC TỪ DROPDOWN COMBOBOX (UIA + PHÍM ĐIỀU HƯỚNG)
    # =========================================================================
    def select_dropdown_item(self, pos_safe, item_name, form_win=None):
        """
        Chọn một mục từ danh sách thả xuống (Dropdown ComboBox):
        - Click vào ô Dropdown để focus
        - Bấm F4 hoặc Alt+Down để mở danh sách xổ xuống
        - Dùng UIAutomation quét tìm ListItem có tên tương ứng và click đúng tọa độ tâm
        - Nếu không, dùng phím tắt tương ứng: 'k' cho 'Khác', 'c' / Home cho 'Chủ động', rồi Enter
        """
        if not pos_safe or not item_name:
            return

        delay = self.speed_var.get()
        cx, cy = pos_safe

        # 1. Click vào ô ComboBox để focus
        pyautogui.click(cx, cy)
        time.sleep(delay * 0.35)

        # 2. Mở danh sách dropdown bằng phím F4 (chuẩn WinForms/DevExpress)
        pyautogui.press("f4")
        time.sleep(delay * 0.35)

        # 3. Thử tìm và click ListItem qua UIAutomation
        selected = False
        if auto is not None:
            try:
                fg = auto.GetForegroundControl()
                if fg:
                    target_item = fg.ListItemControl(searchDepth=5, SubName=item_name)
                    if not target_item.Exists(0.08):
                        # Thử quét các cửa sổ top-level popup menu
                        root = auto.GetRootControl()
                        for win in root.GetChildren():
                            candidate = win.ListItemControl(searchDepth=4, SubName=item_name)
                            if candidate.Exists(0.05):
                                target_item = candidate
                                break

                    if target_item.Exists(0.08):
                        rect = target_item.BoundingRectangle
                        if rect and (rect.right > rect.left) and (rect.bottom > rect.top):
                            item_cx = (rect.left + rect.right) // 2
                            item_cy = (rect.top + rect.bottom) // 2
                            pyautogui.click(item_cx, item_cy)
                        else:
                            target_item.Click()
                        selected = True
                        self.log(f"🔽 Đã chọn '{item_name}' từ dropdown (UIA click).")
            except Exception:
                pass

        # 4. Fallback bằng phím điều hướng dropdown chuẩn của WinForms / DevExpress
        if not selected:
            clean = item_name.strip().lower()
            if "khác" in clean or "khac" in clean:
                pyautogui.press("k")
                time.sleep(delay * 0.2)
                pyautogui.press("enter")
                self.log(f"🔽 Đã chọn '{item_name}' từ dropdown (phím K + Enter).")
            elif "chủ động" in clean or "chu dong" in clean:
                pyautogui.press("home")
                time.sleep(delay * 0.15)
                pyautogui.press("c")
                time.sleep(delay * 0.15)
                pyautogui.press("enter")
                self.log(f"🔽 Đã chọn '{item_name}' từ dropdown (phím Home + C + Enter).")
            else:
                first_char = clean[0] if clean else "c"
                pyautogui.press(first_char)
                time.sleep(delay * 0.2)
                pyautogui.press("enter")
                self.log(f"🔽 Đã chọn '{item_name}' từ dropdown ({first_char} + Enter).")

        time.sleep(delay * 0.25)

    # =========================================================================
    # ĐIỀN FORM "CẬP NHẬT THÔNG TIN THỦ THUẬT" (CORE ENGINE)
    # =========================================================================
    def fill_form_pttt(self, task, form_window=None):
        """
        Thực hiện điền toàn bộ trường vào cửa sổ 'Cập Nhật Thông Tin Thủ Thuật'
        Dựa trên tọa độ cân chỉnh hoặc phím Tab/Click
        """
        delay = self.speed_var.get()
        cal = self.config.get("calibration", {}).get("form_pttt", {})

        if not form_window:
            form_title = self.config.get("settings", {}).get("window_form_title_contains", "Cập Nhật Thông Tin Thủ Thuật")
            form_window = self.find_emrhis_window(form_title)

        if not form_window:
            raise Exception("Không tìm thấy cửa sổ 'Cập Nhật Thông Tin Thủ Thuật' đang mở trên màn hình!")

        # Kích hoạt cửa sổ form lên trên cùng
        try:
            form_window.activate()
            time.sleep(delay)
        except Exception:
            pass

        self.log(f"👉 Bắt đầu điền form: {task.get('ten_bn')} - {task.get('thu_thuat')}")

        # Chuẩn bị dữ liệu
        ngay_gio_bd = task.get("ngay_gio_bd") or f"{task.get('gio_bat_dau', '08:00')} {task.get('ngay', '')}".strip()
        ngay_gio_kt = task.get("ngay_gio_kt") or f"{task.get('gio_ket_thuc', '08:30')} {task.get('ngay', '')}".strip()
        tinh_hinh = task.get("tinh_hinh") or self.config.get("defaults", {}).get("tinh_hinh", "Chủ động")
        vo_cam = task.get("vo_cam") or self.config.get("defaults", {}).get("vo_cam", "Khác")
        may_y_te = task.get("may_y_te", "").strip()
        mo_ta = task.get("mo_ta") or "."
        ktv_code = task.get("ktv_ma") or task.get("ktv_ten", "")

        # 1. Thời gian bắt đầu
        pos_bd = self.get_safe_pos(cal.get("thoi_gian_bat_dau"), form_window)
        if pos_bd:
            pyautogui.click(pos_bd[0], pos_bd[1])
            time.sleep(delay * 0.5)
            pyautogui.hotkey("ctrl", "a")
            pyautogui.press("backspace")
            pyperclip.copy(ngay_gio_bd)
            pyautogui.hotkey("ctrl", "v")
            time.sleep(delay * 0.5)

        # 2. Thời gian kết thúc
        pos_kt = self.get_safe_pos(cal.get("thoi_gian_ket_thuc"), form_window)
        if pos_kt:
            pyautogui.click(pos_kt[0], pos_kt[1])
            time.sleep(delay * 0.5)
            pyautogui.hotkey("ctrl", "a")
            pyautogui.press("backspace")
            pyperclip.copy(ngay_gio_kt)
            pyautogui.hotkey("ctrl", "v")
            time.sleep(delay * 0.5)

        # 3. Phương pháp vô cảm (Chọn từ Dropdown: 'Khác')
        pos_vc = self.get_safe_pos(cal.get("cbo_vo_cam"), form_window)
        if pos_vc:
            self.select_dropdown_item(pos_vc, vo_cam, form_window)

        # 4. Tình hình PTTT (Chọn từ Dropdown: 'Chủ động')
        pos_th = self.get_safe_pos(cal.get("cbo_tinh_hinh"), form_window)
        if pos_th:
            self.select_dropdown_item(pos_th, tinh_hinh, form_window)

        # 5. Máy y tế (nếu có, chọn từ Dropdown)
        pos_may = self.get_safe_pos(cal.get("cbo_may_y_te"), form_window)
        if pos_may and may_y_te:
            self.select_dropdown_item(pos_may, may_y_te, form_window)

        # 6. Mô tả thủ thuật (Mặc định: '.')
        pos_mt = self.get_safe_pos(cal.get("txt_mo_ta"), form_window)
        if pos_mt:
            pyautogui.click(pos_mt[0], pos_mt[1])
            time.sleep(delay * 0.5)
            pyautogui.hotkey("ctrl", "a")
            pyperclip.copy(mo_ta)
            pyautogui.hotkey("ctrl", "v")
            time.sleep(delay * 0.5)

        # 7. Ê-Kíp PTTT -> Ô Nhân Viên dòng 1 (Thủ thuật chính)
        pos_ekip = self.get_safe_pos(cal.get("grid_ekip_cell_nhanvien"), form_window)
        if pos_ekip and ktv_code:
            pyautogui.doubleClick(pos_ekip[0], pos_ekip[1])
            time.sleep(delay * 0.5)
            pyperclip.copy(ktv_code)
            pyautogui.hotkey("ctrl", "v")
            time.sleep(delay * 0.5)
            pyautogui.press("enter")
            time.sleep(delay * 0.5)

        # 8. Bấm nút "Lưu + Đóng"
        pos_save = self.get_safe_pos(cal.get("btn_luu_dong"), form_window)
        if pos_save:
            pyautogui.click(pos_save[0], pos_save[1])
            self.log("💾 Đã click 'Lưu + Đóng'.")
            time.sleep(delay * 1.5)

            # Tự động đóng popup cảnh báo/xác nhận nếu có
            if self.config.get("settings", {}).get("auto_dismiss_popups", True):
                self.auto_click_dialog_yes(timeout=1.2)

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

        # 2. Tìm kiếm bệnh nhân theo tên (Không ấn Enter để tránh ra danh sách nhiều ngày)
        pos_search = self.get_safe_pos(cal_main.get("search_box"), main_win)
        if pos_search:
            pyautogui.click(pos_search[0], pos_search[1])
            time.sleep(delay)
            pyautogui.hotkey("ctrl", "a")
            pyautogui.press("backspace")
            pyperclip.copy(ten_bn)
            pyautogui.hotkey("ctrl", "v")
            if self.config.get("settings", {}).get("search_press_enter", False):
                pyautogui.press("enter")
            time.sleep(delay * 1.0)

        if self.stop_requested:
            return False

        # 3. Chọn dòng bệnh nhân trong danh sách
        pos_pt_row = self.get_safe_pos(cal_main.get("patient_first_row"), main_win)
        if pos_pt_row:
            pyautogui.click(pos_pt_row[0], pos_pt_row[1])
            time.sleep(delay)

        if self.stop_requested:
            return False

        # 4. Bấm "Bắt đầu thực hiện" (Tự bấm Có nếu có cảnh báo, xử lý tọa độ động theo cảnh báo)
        pos_btn_start = self.get_safe_pos(cal_main.get("btn_bat_dau_thuc_hien"), main_win)
        if pos_btn_start:
            pyautogui.click(pos_btn_start[0], pos_btn_start[1])
            self.log("▶️ Đã bấm 'Bắt đầu thực hiện'. Đang kiểm tra cảnh báo xác nhận...")
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
            time.sleep(delay * 0.8)

            pos_menu = self.get_safe_pos(cal_main.get("menu_nhap_tt_pttt"), main_win)
            if pos_menu:
                pyautogui.click(pos_menu[0], pos_menu[1])
            else:
                pyautogui.press("down")
                pyautogui.press("enter")

            time.sleep(delay * 2.0)

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
