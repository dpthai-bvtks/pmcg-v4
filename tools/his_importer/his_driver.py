# -*- coding: utf-8 -*-
"""
Module: his_driver.py
Tự động tương tác với phần mềm emrHIS (WinForms .NET) thông qua Windows UI Automation & PyAutoGUI.
"""

import os
import sys
import time
import ctypes
from ctypes import wintypes
from datetime import datetime, timedelta
from PIL import Image
import uiautomation as auto
import pyautogui
import pyperclip

# ==========================================
# BẢNG ÁNH XẠ HỌ TÊN ĐẦY ĐỦ NHÂN SỰ CHUẨN TRÊN PHẦN MỀM HIS
# ==========================================
STAFF_HIS_FULL_NAMES = {
    # Bác sĩ
    'bs thái': 'Đặng Phong Thái',
    'bs thai': 'Đặng Phong Thái',
    'phong thái': 'Đặng Phong Thái',
    'đặng phong thái': 'Đặng Phong Thái',
    'thái': 'Đặng Phong Thái',
    'dpt': 'Đặng Phong Thái',
    
    'bs đạt': 'Hoàng Đức Đạt',
    'bs dat': 'Hoàng Đức Đạt',
    'hoàng đức đạt': 'Hoàng Đức Đạt',
    'đạt': 'Hoàng Đức Đạt',
    
    'bs hoa': 'Lê Thị Thu Hoa',
    'thu hoa': 'Lê Thị Thu Hoa',
    'lê thị thu hoa': 'Lê Thị Thu Hoa',
    'hoa': 'Lê Thị Thu Hoa',
    
    'bs thảo': 'Nguyễn Thị Duyên Thảo',
    'bs thao': 'Nguyễn Thị Duyên Thảo',
    'duyên thảo': 'Nguyễn Thị Duyên Thảo',
    'nguyễn thị duyên thảo': 'Nguyễn Thị Duyên Thảo',
    'thảo': 'Nguyễn Thị Duyên Thảo',
    
    'bs hằng': 'Nguyễn Thu Hằng',
    'bs hang': 'Nguyễn Thu Hằng',
    'thu hằng': 'Nguyễn Thu Hằng',
    'nguyễn thu hằng': 'Nguyễn Thu Hằng',
    'hằng': 'Nguyễn Thu Hằng',
    
    'bs khuyến': 'Phạm Thạch Khuyến',
    'bs khuyen': 'Phạm Thạch Khuyến',
    'thạch khuyến': 'Phạm Thạch Khuyến',
    'phạm thạch khuyến': 'Phạm Thạch Khuyến',
    'khuyến': 'Phạm Thạch Khuyến',
    
    # Kỹ thuật viên & Điều dưỡng
    'ktv lương': 'Nguyễn Thị Xuân Lương',
    'xuân lương': 'Nguyễn Thị Xuân Lương',
    'nguyễn thị xuân lương': 'Nguyễn Thị Xuân Lương',
    'lương': 'Nguyễn Thị Xuân Lương',
    
    'ktv hà': 'Nguyễn Thị Hà',
    'ktv hà chip': 'Nguyễn Thị Hà',
    'hà chip': 'Nguyễn Thị Hà',
    'nguyễn thị hà': 'Nguyễn Thị Hà',
    'hà': 'Nguyễn Thị Hà',
    
    'phan thị thu hiền': 'Phan Thị Thu Hiền',
    'ktv phan hiền': 'Phan Thị Thu Hiền',
    'phan hiền': 'Phan Thị Thu Hiền',
    
    'lê thị thu hiền': 'Lê Thị Thu Hiền',
    'ktv lê hiền': 'Lê Thị Thu Hiền',
    'ltv lê hiền': 'Lê Thị Thu Hiền',
    'lê hiền': 'Lê Thị Thu Hiền',
    
    'nguyễn văn khính': 'Nguyễn Văn Khính',
    'ktv khính': 'Nguyễn Văn Khính',
    'khính': 'Nguyễn Văn Khính',
    
    'đd thuyến': 'Phạm Thị Thuyến',
    'ktv thuyến': 'Phạm Thị Thuyến',
    'thuyến': 'Phạm Thị Thuyến',
    'phạm thị thuyến': 'Phạm Thị Thuyến',
    
    'đd duyên': 'Trần Thị Duyên',
    'ktv duyên': 'Trần Thị Duyên',
    'duyên': 'Trần Thị Duyên',
    'trần thị duyên': 'Trần Thị Duyên',
}

def get_his_full_name(name):
    if not name:
        return ""
    clean = str(name).strip()
    lower = clean.lower()
    if lower in STAFF_HIS_FULL_NAMES:
        return STAFF_HIS_FULL_NAMES[lower]
    for k, full in STAFF_HIS_FULL_NAMES.items():
        if k in lower:
            return full
    return clean

def normalize_date(d_str):
    if not d_str:
        return datetime.now().strftime("%d/%m/%Y")
    d_str = str(d_str).strip()
    if "-" in d_str:
        parts = d_str.split("-")
        if len(parts) == 3 and len(parts[0]) == 4:
            return f"{parts[2].zfill(2)}/{parts[1].zfill(2)}/{parts[0]}"
    if "/" in d_str:
        parts = d_str.split("/")
        if len(parts) == 3:
            if len(parts[2]) == 4:
                return f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"
            elif len(parts[0]) == 4:
                return f"{parts[2].zfill(2)}/{parts[1].zfill(2)}/{parts[0]}"
    return d_str

def normalize_time(t_str):
    if not t_str:
        return "08:00"
    t_str = str(t_str).strip()
    parts = t_str.split(":")
    if len(parts) >= 2:
        return f"{parts[0].zfill(2)}:{parts[1].zfill(2)}"
    return t_str.zfill(5)

# Cấu hình PyAutoGUI
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.2

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
DESKTOP_ALL = 0x01FF

class HISDriver:
    def __init__(self, log_callback=None):
        self.ensure_default_desktop()
        auto.SetGlobalSearchTimeout(3)
        self.main_window = None
        self.log_callback = log_callback or print

    def log(self, msg):
        try:
            self.log_callback(msg)
        except Exception:
            print(msg)

    def ensure_default_desktop(self):
        """Khởi tạo COM và chuyển thread hiện tại sang Default desktop để nhìn thấy toàn bộ cửa sổ đồ họa"""
        try:
            ctypes.windll.ole32.CoInitialize(None)
        except Exception:
            pass
        try:
            h_desk = user32.OpenDesktopW("Default", 0, False, DESKTOP_ALL)
            if h_desk:
                user32.SetThreadDesktop(h_desk)
        except Exception as e:
            print(f"Lỗi chuyển desktop: {e}")

    def get_main_window(self):
        """Lấy cửa sổ chính emrHIS (FormMain)"""
        self.ensure_default_desktop()
        win = auto.WindowControl(searchDepth=1, AutomationId="FormMain")
        if not win.Exists(0, 0):
            win = auto.WindowControl(searchDepth=1, RegexName=".*emrHIS.*|.*PMQL BỆNH VIỆN.*")
        
        if win.Exists(0, 0):
            self.main_window = win
            return win
        return None

    def bring_to_front(self):
        """Khôi phục cửa sổ nếu đang thu nhỏ và đưa lên trên cùng"""
        win = self.get_main_window()
        if not win:
            raise RuntimeError("Không tìm thấy cửa sổ emrHIS đang chạy!")
        
        hwnd = win.NativeWindowHandle
        user32.ShowWindow(hwnd, 9) # SW_RESTORE
        time.sleep(0.3)
        user32.SetForegroundWindow(hwnd)
        time.sleep(0.4)
        return win

    def get_current_logged_in_user(self):
        """Lấy tên người dùng hiện đang đăng nhập trên thanh trạng thái emrHIS"""
        win = self.bring_to_front()
        status_bar = win.ToolBarControl(AutomationId="StatusBar")
        if status_bar.Exists(1, 0):
            for child in status_bar.GetChildren():
                txt = (child.Name or "").strip()
                if txt and len(txt) > 3 and not any(k in txt.lower() for k in ["bệnh viện", "usd", "sổ thu", "khoa", "thứ", "trợ lý", "đã đăng ký"]):
                    return txt
        return ""

    def search_patient(self, patient_name):
        """
        Tìm kiếm bệnh nhân theo họ tên đầy đủ trên ô txtSearch
        Lưu ý: Chỉ paste/nhập tên, KHÔNG bấm Enter (vì phím Enter sẽ kích hoạt tìm tất cả các ngày có y lệnh trong lịch sử)
        """
        win = self.bring_to_front()
        txt_search = win.EditControl(AutomationId="txtSearch")
        if not txt_search.Exists(2, 0):
            raise RuntimeError("Không tìm thấy ô tìm kiếm bệnh nhân (txtSearch)!")

        rect = txt_search.BoundingRectangle
        center_x = (rect.left + rect.right) // 2
        center_y = (rect.top + rect.bottom) // 2
        
        pyautogui.click(center_x, center_y)
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'a')
        pyautogui.press('backspace')
        time.sleep(0.1)
        
        # Dùng clipboard để gõ tiếng Việt có dấu chuẩn xác 100%
        pyperclip.copy(patient_name)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.5)
        # KHÔNG bấm phím Enter: HIS tự động lọc ngay trên danh sách trong ngày hiện tại
        time.sleep(1.0) # Đợi HIS tự động lọc danh sách bệnh nhân

    def select_first_patient_in_list(self):
        """Click chọn bệnh nhân đầu tiên trong danh sách mListViewData"""
        win = self.bring_to_front()
        lv = win.ListControl(AutomationId="mListViewData")
        if not lv.Exists(2, 0):
            raise RuntimeError("Không tìm thấy danh sách bệnh nhân (mListViewData)!")

        items = [c for c in lv.GetChildren() if c.ControlTypeName == 'ListItemControl']
        if items:
            rect = items[0].BoundingRectangle
            click_x = (rect.left + rect.right) // 2
            click_y = (rect.top + rect.bottom) // 2
        else:
            rect = lv.BoundingRectangle
            click_x = rect.left + 80
            click_y = rect.top + 60

        self.log("Click chọn bệnh nhân trong danh sách...")
        pyautogui.click(click_x, click_y)
        time.sleep(1.2) # Đợi tải thông tin phiếu và thủ thuật

    def check_and_start_execution(self):
        """
        Kiểm tra nút 'Bắt Đầu Thực Hiện' (AutoId: btnBatDauThucHien)
        Nếu chưa bắt đầu: click nút và bấm 'Có' trên hộp thoại xác nhận.
        Nếu đã bắt đầu (hiện 'Hủy Thực Hiện'): bỏ qua bước này.
        """
        win = self.bring_to_front()
        panel_bottom = win.PaneControl(AutomationId='panelBottom')
        if not panel_bottom.Exists(2, 0):
            panel_bottom = win

        # 1. Kiểm tra nếu đã bắt đầu rồi (nút Hủy Thực Hiện xuất hiện)
        btn_cancel = panel_bottom.ButtonControl(AutomationId="btnHuyThucHien")
        if not btn_cancel.Exists(0, 0):
            btn_cancel = panel_bottom.ButtonControl(RegexName="(?i).*hủy thực hiện.*")

        if btn_cancel.Exists(0, 0) and btn_cancel.BoundingRectangle.width() > 0:
            self.log("Ca này đã được 'Bắt đầu thực hiện' từ trước (đang ở trạng thái thực hiện).")
            return True

        # 2. Tìm nút Bắt Đầu Thực Hiện
        btn_start = panel_bottom.ButtonControl(AutomationId="btnBatDauThucHien")
        if not btn_start.Exists(0, 0):
            btn_start = panel_bottom.ButtonControl(RegexName="(?i).*bắt đầu.*")

        if btn_start.Exists(1, 0) and btn_start.BoundingRectangle.width() > 0:
            self.log("Đang bấm nút 'Bắt Đầu Thực Hiện'...")
            rect = btn_start.BoundingRectangle
            click_x = (rect.left + rect.right) // 2
            click_y = (rect.top + rect.bottom) // 2

            user32.SetForegroundWindow(win.NativeWindowHandle)
            time.sleep(0.2)
            pyautogui.click(click_x, click_y)
            time.sleep(0.8)

            # Chờ hộp thoại xác nhận 'emrHIS - Thông báo'
            confirm_dialog = None
            for _ in range(8):
                d = auto.GetRootControl().WindowControl(searchDepth=2, RegexName="(?i).*thông báo.*|.*emrhis.*")
                if d.Exists(0, 0) and d.NativeWindowHandle != win.NativeWindowHandle:
                    confirm_dialog = d
                    break
                time.sleep(0.25)

            if confirm_dialog:
                self.log("Phát hiện hộp thoại xác nhận -> Bấm 'Có'...")
                btn_yes = confirm_dialog.ButtonControl(RegexName="(?i)có|yes")
                if btn_yes.Exists(0.5, 0):
                    btn_yes.Click()
                else:
                    pyautogui.press('enter')
            else:
                self.log("Tự động gửi phím Enter để xác nhận...")
                pyautogui.press('enter')

            time.sleep(1.5) # Đợi HIS hoàn tất bắt đầu ca
            self.log("✅ Đã kích hoạt 'Bắt Đầu Thực Hiện' thành công.")
            return True
        else:
            self.log("ℹ️ Nút 'Bắt Đầu Thực Hiện' không khả dụng hoặc ca đã bắt đầu.")
            return True

    def open_procedure_modal(self, row_index=0, procedure_name=""):
        """
        Quy trình chuẩn:
        1. Click chuột trái chọn dòng thủ thuật cần nhập trong bảng mListViewKetQua.
        2. Chuột phải vào chính dòng đó để mở menu tác vụ (ContextMenu).
        3. Chọn đúng dòng 2: 'Nhập Thông Tin PTTT' (qua nhận diện hình ảnh OpenCV hoặc phím Down x 2 + Enter).
        """
        win = self.bring_to_front()
        lv_kq = win.ListControl(AutomationId="mListViewKetQua")
        if not lv_kq.Exists(3, 0):
            raise RuntimeError("Không tìm thấy danh sách thủ thuật (mListViewKetQua)!")

        rect = lv_kq.BoundingRectangle
        items = [c for c in lv_kq.GetChildren() if c.ControlTypeName in ('ListItemControl', 'DataItemControl', 'CustomControl')]

        target_idx = row_index
        target_rect = None

        # 1. Tìm chính xác dòng thủ thuật theo tên nếu có danh sách item
        if procedure_name and items:
            proc_clean = procedure_name.lower().strip()
            for idx, it in enumerate(items):
                item_text = it.Name.lower()
                for sub in it.GetChildren():
                    item_text += " " + sub.Name.lower()
                if proc_clean in item_text or any(w in item_text for w in proc_clean.split() if len(w) > 4):
                    target_rect = it.BoundingRectangle
                    target_idx = idx
                    self.log(f"-> Đã khớp thủ thuật '{procedure_name}' tại dòng {idx+1}")
                    break

        if not target_rect and items and target_idx < len(items):
            target_rect = items[target_idx].BoundingRectangle

        if target_rect:
            click_x = target_rect.left + 80
            click_y = (target_rect.top + target_rect.bottom) // 2
        else:
            # Tiêu đề bảng ~20px, mỗi dòng ~16px (tâm dòng 0: rect.top + 28px)
            click_x = rect.left + 80
            click_y = rect.top + 28 + (target_idx * 16)

        # Bước 1: Click chuột trái chọn dòng thủ thuật cần nhập
        self.log(f"-> [Bước 1] Click chọn thủ thuật thứ {target_idx + 1} ({procedure_name or 'theo thứ tự'}) tại ({click_x}, {click_y})...")
        user32.SetForegroundWindow(win.NativeWindowHandle)
        time.sleep(0.2)
        pyautogui.click(click_x, click_y)
        time.sleep(0.4)

        # Bước 2: Chuột phải vào dòng thủ thuật để mở Context Menu
        self.log(f"-> [Bước 2] Chuột phải vào thủ thuật để mở Context Menu...")
        pyautogui.rightClick(click_x, click_y)
        time.sleep(0.6)

        # Bước 3: Chọn đúng dòng 2 - 'Nhập Thông Tin PTTT'
        # Cách 1: Dùng OpenCV Template Matching tìm chính xác nút trên màn hình
        needle_path = os.path.join(os.path.dirname(__file__), "assets", "needle_pttt.png")
        found_by_vision = False
        if os.path.exists(needle_path):
            try:
                # Dùng PIL mở ảnh để tránh lỗi đường dẫn Unicode (tiếng Việt có dấu) trên Windows với OpenCV cv2.imread
                needle_img = Image.open(needle_path)
                # Quét quanh khu vực vừa click chuột phải
                search_region = (max(0, click_x - 30), max(0, click_y - 10), 320, 260)
                box = pyautogui.locateOnScreen(needle_img, confidence=0.78, region=search_region)
                if not box:
                    # Thử quét toàn màn hình nếu vùng thu hẹp chưa khớp
                    box = pyautogui.locateOnScreen(needle_img, confidence=0.75)

                if box:
                    cx, cy = pyautogui.center(box)
                    self.log(f"-> [Bước 3 - Nhận diện hình ảnh] Tìm thấy dòng 2 'Nhập Thông Tin PTTT' tại ({cx}, {cy}) -> Click...")
                    pyautogui.moveTo(cx, cy, duration=0.2)
                    time.sleep(0.1)
                    pyautogui.click(cx, cy)
                    found_by_vision = True
            except Exception as e:
                self.log(f"ℹ️ Không quét được hình ảnh: {e}")

        # Cách 2: Nếu chưa tìm thấy qua hình ảnh, dùng bàn phím Down 2 lần rồi Enter (Dòng 1: Thanh toán, Dòng 2: Nhập thông tin PTTT)
        if not found_by_vision:
            self.log("-> [Bước 3 - Bàn phím] Gửi phím Down (2 lần) để chọn đúng dòng 2 'Nhập Thông Tin PTTT'...")
            time.sleep(0.2)
            pyautogui.press('down')
            time.sleep(0.18)
            pyautogui.press('down')
            time.sleep(0.18)
            pyautogui.press('enter')

        # Kiểm tra xem form modal đã xuất hiện chưa
        form = self.get_procedure_form(timeout=2.0)

        # Cách 3: Nếu form vẫn chưa mở, thử gửi lại phím Down x 2 + Enter
        if not form:
            self.log("ℹ️ Chưa phát hiện form, thử gửi lại phím: Down x 2 + Enter...")
            pyautogui.press('down')
            time.sleep(0.15)
            pyautogui.press('down')
            time.sleep(0.15)
            pyautogui.press('enter')
            form = self.get_procedure_form(timeout=2.0)

        # Cách 4: Thử click tọa độ fallback chuẩn xác (click_x + 65, click_y + 58)
        if not form:
            fb_x = click_x + 65
            fb_y = click_y + 58
            self.log(f"ℹ️ Thử click tọa độ fallback tại ({fb_x}, {fb_y})...")
            pyautogui.click(fb_x, fb_y)
            form = self.get_procedure_form(timeout=2.0)

        if not form:
            raise RuntimeError("Không thể mở form 'Cập Nhật Thông Tin Thủ Thuật'! Vui lòng kiểm tra lại màn hình HIS.")

        self.log("✅ Đã mở thành công form 'Cập Nhật Thông Tin Thủ Thuật'.")
        return form

    def get_procedure_form(self, timeout=6):
        """Tìm cửa sổ modal 'Cập Nhật Thông Tin Thủ Thuật' từ Desktop Root"""
        self.ensure_default_desktop()
        start_t = time.time()
        while time.time() - start_t < timeout:
            modal = auto.GetRootControl().WindowControl(searchDepth=3, RegexName="(?i).*cập nhật thông tin.*|.*thủ thuật.*|.*pttt.*")
            if modal.Exists(0, 0) and modal.BoundingRectangle.width() > 150:
                return modal
            for w in auto.GetRootControl().GetChildren():
                if w.ControlTypeName == 'WindowControl' and w.BoundingRectangle.width() > 150:
                    n = w.Name.lower()
                    if "thủ thuật" in n or "cập nhật thông tin" in n or "pttt" in n:
                        return w
            time.sleep(0.25)
        return None

    def fill_procedure_form(self, form=None, start_time_str="", end_time_str="", may_y_te="", nv_chinh=""):
        """
        Điền chuẩn xác 100% các thông tin vào form 'Cập Nhật Thông Tin Thủ Thuật':
        - Thời gian bắt đầu & kết thúc: Định dạng 'HH:MM mm/dd/yyyy' ([Giờ] [Phút] [Tháng] [Ngày] [Năm]).
          Gõ đúng 12 chữ số liên tiếp (tự động chuyển phân đoạn, KHÔNG gửi phím Right).
        - Phương pháp vô cảm: (X: 52.73%, Y: 50.83%) -> 'Khác'.
        - Tình hình PTTT: (X: 16.60%, Y: 54.92%) -> Luôn chọn 'Chủ động' (Home + Enter).
        - Máy y tế: (X: 62.50%, Y: 58.56%) -> [may_y_te].
        - Mô tả thủ thuật: (X: 21.48%, Y: 81.03%) -> '.'.
        - Ê-kíp PTTT - TT viên chính: (X: 90.82%, Y: 22.01%) -> Họ tên đầy đủ chuẩn HIS (ví dụ: 'Đặng Phong Thái').
        - Lưu + Đóng: (X: 93.55%, Y: 96.35%).
        """
        if not form:
            form = self.get_procedure_form(timeout=5)
        if not form:
            raise RuntimeError("Không tìm thấy form 'Cập Nhật Thông Tin Thủ Thuật' sau khi mở menu!")

        form_rect = form.BoundingRectangle
        form_hwnd = form.NativeWindowHandle
        user32.SetForegroundWindow(form_hwnd)
        time.sleep(0.3)

        # Cố định cửa sổ tại (0, 0) với kích thước chuẩn 1686x856 khớp 100% video thực tế test2.mp4
        user32.ShowWindow(form_hwnd, 1) # SW_SHOWNORMAL = 1
        time.sleep(0.1)
        user32.MoveWindow(form_hwnd, 0, 0, 1686, 856, True)
        time.sleep(0.3)

        # Lấy kích thước và vị trí thực tế của form
        form_rect = form.BoundingRectangle
        fw = form_rect.width()
        fh = form_rect.height()
        fx = form_rect.left
        fy = form_rect.top
        self.log(f"Form PTTT: Kích thước {fw}x{fh} tại ({fx}, {fy})")

        # 1. Tách và chuẩn hóa thời gian - ngày tháng
        t_start = "08:00"
        d_start = datetime.now().strftime("%d/%m/%Y")
        if start_time_str:
            parts = str(start_time_str).strip().split(" ")
            if len(parts) >= 1 and parts[0]:
                t_start = normalize_time(parts[0])
            if len(parts) >= 2 and parts[1]:
                d_start = normalize_date(parts[1])

        t_end = "08:30"
        d_end = d_start
        if end_time_str:
            parts = str(end_time_str).strip().split(" ")
            if len(parts) >= 1 and parts[0]:
                t_end = normalize_time(parts[0])
            if len(parts) >= 2 and parts[1]:
                d_end = normalize_date(parts[1])

        # Đảm bảo giờ kết thúc luôn sau giờ bắt đầu
        try:
            dt_s = datetime.strptime(f"{t_start} {d_start}", "%H:%M %d/%m/%Y")
            dt_e = datetime.strptime(f"{t_end} {d_end}", "%H:%M %d/%m/%Y")
            if dt_e <= dt_s:
                dt_e = dt_s + timedelta(minutes=30)
                t_end = dt_e.strftime("%H:%M")
                d_end = dt_e.strftime("%d/%m/%Y")
        except Exception:
            pass

        # Tách các thành phần Giờ, Phút, Ngày, Tháng, Năm theo chuẩn HH:mm dd/MM/yyyy
        t_s_parts = t_start.split(":")
        d_s_parts = d_start.split("/")
        h_s = t_s_parts[0].zfill(2)
        m_s = t_s_parts[1].zfill(2) if len(t_s_parts) > 1 else "00"
        d_s = d_s_parts[0].zfill(2) if len(d_s_parts) > 0 else "10"
        mo_s = d_s_parts[1].zfill(2) if len(d_s_parts) > 1 else "09"
        y_s = d_s_parts[2] if len(d_s_parts) > 2 else "2026"

        t_e_parts = t_end.split(":")
        d_e_parts = d_end.split("/")
        h_e = t_e_parts[0].zfill(2)
        m_e = t_e_parts[1].zfill(2) if len(t_e_parts) > 1 else "30"
        d_e = d_e_parts[0].zfill(2) if len(d_e_parts) > 0 else "10"
        mo_e = d_e_parts[1].zfill(2) if len(d_e_parts) > 1 else "09"
        y_e = d_e_parts[2] if len(d_e_parts) > 2 else "2026"

        # 2. Ánh xạ tên nhân sự sang Họ và tên đầy đủ theo chuẩn HIS
        nv_full = get_his_full_name(nv_chinh)
        if not nv_full:
            nv_full = self.get_current_logged_in_user() or "Đặng Phong Thái"

        # 3. Tọa độ pixel cố định chuẩn 100% trích xuất từ pixel thực tế trong video test2.mp4:
        # Form Thông Tin PTTT có kích thước cố định 1686x856 (Top-Left tại fx, fy):
        x_batdau = fx + 600
        y_batdau = fy + 154

        x_ketthuc = fx + 1070
        y_ketthuc = fy + 154

        x_vocam = fx + 650
        y_vocam = fy + 428

        x_tinhhinh = fx + 240
        y_tinhhinh = fy + 455

        x_may = fx + 1060
        y_may = fy + 484

        x_mota = fx + 250
        y_mota = fy + 660

        x_ekip = fx + 1500
        y_ekip = fy + 160

        x_save = fx + 1600
        y_save = fy + 835

        # [1] Thời gian bắt đầu: định dạng HH:mm dd/MM/yyyy
        self.log(f"-> [1] Điền Thời gian bắt đầu (HH:mm dd/MM/yyyy): {h_s}:{m_s} {d_s}/{mo_s}/{y_s}")
        self._fill_datetime(x_batdau, y_batdau, h_s, m_s, d_s, mo_s, y_s)

        # [2] Thời gian kết thúc: định dạng HH:mm dd/MM/yyyy
        self.log(f"-> [2] Điền Thời gian kết thúc (HH:mm dd/MM/yyyy): {h_e}:{m_e} {d_e}/{mo_e}/{y_e}")
        self._fill_datetime(x_ketthuc, y_ketthuc, h_e, m_e, d_e, mo_e, y_e)

        # [3] Phương pháp vô cảm (mặc định 'Khác')
        self.log("-> [3] Chọn Phương pháp vô cảm: Khác")
        self._select_dropdown(x_vocam, y_vocam, "Khác")

        # [4] Tình hình PTTT (mặc định 'Chủ động')
        self.log("-> [4] Chọn Tình hình PTTT: Chủ động")
        self._select_tinh_hinh_pttt(x_tinhhinh, y_tinhhinh)

        # [5] Máy y tế
        if may_y_te:
            self.log(f"-> [5] Chọn Máy y tế: {may_y_te}")
            self._select_may_y_te(x_may, y_may, may_y_te)

        # [6] Mô tả thủ thuật (mặc định '.')
        self.log("-> [6] Điền Mô tả thủ thuật: .")
        self._click_and_type(x_mota, y_mota, ".")

        # [7] Ê-kíp PTTT: Dòng 1 TT viên chính
        if nv_full:
            self.log(f"-> [7] Điền TT viên chính (Tên đầy đủ chuẩn HIS): '{nv_full}'")
            self._fill_grid_cell(x_ekip, y_ekip, nv_full)

        # [8] Bấm Lưu + Đóng
        self.log("-> [8] Bấm Lưu + Đóng...")
        btn_save_close = form.ButtonControl(RegexName=r"(?i).*lưu \+ đóng.*")
        if btn_save_close.Exists(0.5, 0):
            btn_save_close.Click()
        else:
            pyautogui.click(x_save, y_save)

        # Đợi form đóng hoặc xử lý thông báo popup xác nhận (ví dụ trùng giờ bác sĩ)
        time.sleep(1.2)
        for _ in range(8):
            popup = auto.GetRootControl().WindowControl(searchDepth=2, RegexName="(?i).*thông báo.*|.*cảnh báo.*|.*emrhis.*")
            if popup.Exists(0, 0) and popup.BoundingRectangle.width() < 700:
                self.log("Phát hiện hộp thoại xác nhận (trùng giờ bác sĩ/cảnh báo) -> Chọn 'Có' để tiếp tục...")
                # Trên popup xác nhận, nút mặc định là 'Không'. Bấm phím Left để chuyển sang 'Có', rồi bấm Enter!
                pyautogui.press('left')
                time.sleep(0.12)
                pyautogui.press('enter')
                time.sleep(0.8)
                break
            time.sleep(0.3)

    def click_tra_ket_qua(self):
        """
        Bấm nút 'Trả Kết Quả' ở góc dưới bên phải màn hình chính emrHIS.
        """
        win = self.bring_to_front()
        panel_bottom = win.PaneControl(AutomationId='panelBottom')
        if not panel_bottom.Exists(1, 0):
            panel_bottom = win

        btn_tra_kq = panel_bottom.ButtonControl(AutomationId="btnTraKetQua")
        if not btn_tra_kq.Exists(0, 0):
            btn_tra_kq = panel_bottom.ButtonControl(RegexName=r"(?i).*trả kết quả.*")

        if btn_tra_kq.Exists(1, 0) and btn_tra_kq.BoundingRectangle.width() > 0:
            self.log("Đang bấm nút 'Trả Kết Quả'...")
            rect = btn_tra_kq.BoundingRectangle
            pyautogui.click((rect.left + rect.right) // 2, (rect.top + rect.bottom) // 2)
            time.sleep(1.0)
            return True
        else:
            self.log("Nút 'Trả Kết Quả' không hiển thị hoặc ca này đã được trả kết quả trước đó.")
            return False

    def _fill_datetime(self, x, y, h_val, m_val, d_val, mo_val, y_val):
        """
        Điền DateTimePicker WinForms định dạng 'HH:mm dd/MM/yyyy'
        Gõ 12 chữ số liên tiếp: [Giờ (2)] + [Phút (2)] + [Ngày (2)] + [Tháng (2)] + [Năm (4)]
        - Click trực tiếp vào vị trí 2 chữ số Giờ (HH). Khi click, toàn bộ phân đoạn Giờ được bôi xanh.
        - Gõ liên tiếp 12 chữ số: HH mm dd MM yyyy. Hệ thống DateTimePicker tự động nhảy qua từng phân đoạn.
        - Tuyệt đối không bấm phím điều hướng Left/Right/Home/End tránh làm sai lệch con trỏ.
        """
        digits_12 = f"{h_val}{m_val}{d_val}{mo_val}{y_val}"

        # 1. Click trực tiếp vào vị trí 2 chữ số Giờ
        pyautogui.click(x, y)
        time.sleep(0.15)
        
        # 2. Gõ đúng 12 chữ số liên tiếp với tốc độ 0.05s/phím
        pyautogui.write(digits_12, interval=0.05)
        time.sleep(0.15)

    def _select_tinh_hinh_pttt(self, x, y):
        """
        Chọn Tình hình PTTT: luôn chọn 'Chủ động'
        Trong combobox emrHIS:
        - Mục 0 (trên cùng): 'Cấp cứu'
        - Mục 1 (ở dưới): 'Chủ động'
        Gửi Home để về mục 0, sau đó gửi Down để nhảy xuống 'Chủ động', rồi bấm Enter!
        """
        pyautogui.click(x, y)
        time.sleep(0.15)
        pyautogui.press('home')
        time.sleep(0.08)
        pyautogui.press('down')
        time.sleep(0.08)
        pyautogui.press('enter')
        time.sleep(0.1)

    def _select_may_y_te(self, x, y, may_name):
        """
        Chọn Máy y tế:
        - Click vào ô Máy y tế
        - Gõ mã số máy (ví dụ '1177')
        - Danh sách gợi ý popup xuất hiện
        - Bấm Down rồi Enter để chọn
        """
        if not may_name:
            return
        # Lấy số hiệu máy nếu có (ví dụ '1177' từ 'Máy ĐC MS: 1177')
        digits = "".join(filter(str.isdigit, str(may_name)))
        search_term = digits if digits else str(may_name)
        
        pyautogui.click(x, y)
        time.sleep(0.15)
        pyautogui.hotkey('ctrl', 'a')
        time.sleep(0.05)
        pyperclip.copy(search_term)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.35)
        pyautogui.press('down')
        time.sleep(0.1)
        pyautogui.press('enter')
        time.sleep(0.15)

    def _click_and_type(self, x, y, text):
        pyautogui.click(x, y)
        time.sleep(0.15)
        pyautogui.hotkey('ctrl', 'a')
        pyautogui.press('backspace')
        time.sleep(0.1)
        pyperclip.copy(text)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.15)

    def _select_dropdown(self, x, y, value):
        pyautogui.click(x, y)
        time.sleep(0.15)
        pyautogui.hotkey('ctrl', 'a')
        pyperclip.copy(value)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.15)
        pyautogui.press('enter')
        time.sleep(0.1)

    def _fill_grid_cell(self, x, y, value):
        """
        Điền ô Nhân Viên trong bảng Ê-kíp PTTT (Dòng 1 TT viên chính):
        - Click vào tâm ô Nhân Viên dòng 1
        - Double-click để vào chế độ soạn thảo của ô
        - Nhấn F2
        - Dán tên nhân sự chuẩn HIS (ví dụ: 'Đặng Phong Thái')
        - Danh sách gợi ý (Autocomplete popup) sẽ hiện lên
        - Chờ 0.35s cho popup hiển thị, nhấn phím Down để chọn dòng đầu tiên, rồi nhấn Enter để chốt chọn!
        (TUYỆT ĐỐI KHÔNG nhấn Tab vì Tab sẽ làm mất dữ liệu vừa chọn)
        """
        if not value:
            return
        pyautogui.click(x, y)
        time.sleep(0.15)
        pyautogui.doubleClick(x, y)
        time.sleep(0.15)
        pyautogui.press('f2')
        time.sleep(0.08)
        pyautogui.hotkey('ctrl', 'a')
        time.sleep(0.05)
        pyperclip.copy(value)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.35) # Chờ danh sách popup gợi ý hiện ra
        pyautogui.press('down') # Chọn dòng đầu tiên trong popup
        time.sleep(0.12)
        pyautogui.press('enter') # Chốt chọn nhân viên
        time.sleep(0.25)



