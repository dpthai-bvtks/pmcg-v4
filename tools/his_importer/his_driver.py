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
import uiautomation as auto
import pyautogui
import pyperclip

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
                # Quét quanh khu vực vừa click chuột phải
                search_region = (max(0, click_x - 30), max(0, click_y - 10), 320, 260)
                box = pyautogui.locateOnScreen(needle_path, confidence=0.78, region=search_region)
                if not box:
                    # Thử quét toàn màn hình nếu vùng thu hẹp chưa khớp
                    box = pyautogui.locateOnScreen(needle_path, confidence=0.75)

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
        Điền chuẩn xác các thông tin vào form 'Cập Nhật Thông Tin Thủ Thuật'
        Tọa độ được tính theo tỉ lệ phần trăm chuẩn xác từ ảnh thực tế giao diện:
        - Thời gian bắt đầu: (X: 41.50%, Y: 20.99%)
        - Thời gian kết thúc: (X: 63.96%, Y: 20.99%)
        - Phương pháp vô cảm: (X: 52.73%, Y: 50.83%) -> 'Khác'
        - Tình hình PTTT: (X: 17.58%, Y: 54.70%) -> 'Chủ động'
        - Máy y tế: (X: 62.50%, Y: 58.56%) -> [may_y_te]
        - Mô tả thủ thuật: (X: 21.48%, Y: 81.03%) -> '.'
        - Ê-kíp PTTT - TT viên chính: (X: 87.89%, Y: 21.92%) -> [nv_chinh]
        - Lưu + Đóng: (X: 94.73%, Y: 97.24%)
        """
        if not form:
            form = self.get_procedure_form(timeout=5)
        if not form:
            raise RuntimeError("Không tìm thấy form 'Cập Nhật Thông Tin Thủ Thuật' sau khi mở menu!")

        form_rect = form.BoundingRectangle
        form_hwnd = form.NativeWindowHandle
        user32.SetForegroundWindow(form_hwnd)
        time.sleep(0.3)

        fw = form_rect.width()
        fh = form_rect.height()
        fx = form_rect.left
        fy = form_rect.top
        self.log(f"Form PTTT: Kích thước {fw}x{fh} tại ({fx}, {fy})")

        # 1. Thời gian bắt đầu: ô giờ bắt đầu (X: 41.50%, Y: 20.99%)
        self.log(f"-> [1] Điền Thời gian bắt đầu: {start_time_str}")
        self._click_and_type(fx + int(fw * 0.4150), fy + int(fh * 0.2099), start_time_str)

        # 2. Thời gian kết thúc: ô giờ kết thúc (X: 63.96%, Y: 20.99%)
        self.log(f"-> [2] Điền Thời gian kết thúc: {end_time_str}")
        self._click_and_type(fx + int(fw * 0.6396), fy + int(fh * 0.2099), end_time_str)

        # 3. Phương pháp vô cảm (mặc định 'Khác') (X: 52.73%, Y: 50.83%)
        self.log("-> [3] Chọn Phương pháp vô cảm: Khác")
        self._select_dropdown(fx + int(fw * 0.5273), fy + int(fh * 0.5083), "Khác")

        # 4. Tình hình PTTT (mặc định 'Chủ động') (X: 17.58%, Y: 54.70%)
        self.log("-> [4] Chọn Tình hình PTTT: Chủ động")
        self._select_dropdown(fx + int(fw * 0.1758), fy + int(fh * 0.5470), "Chủ động")

        # 5. Máy y tế (X: 62.50%, Y: 58.56%)
        if may_y_te:
            self.log(f"-> [5] Chọn Máy y tế: {may_y_te}")
            self._select_dropdown(fx + int(fw * 0.6250), fy + int(fh * 0.5856), may_y_te)

        # 6. Mô tả thủ thuật (mặc định '.') (X: 21.48%, Y: 81.03%)
        self.log("-> [6] Điền Mô tả thủ thuật: .")
        self._click_and_type(fx + int(fw * 0.2148), fy + int(fh * 0.8103), ".")

        # 7. Ê-kíp PTTT: Dòng 1 (TT viên chính) (X: 87.89%, Y: 21.92%)
        if nv_chinh:
            self.log(f"-> [7] Điền TT viên chính: {nv_chinh}")
            self._fill_grid_cell(fx + int(fw * 0.8789), fy + int(fh * 0.2192), nv_chinh)

        # 8. Bấm Lưu + Đóng (X: 94.73%, Y: 97.24%)
        self.log("-> [8] Bấm Lưu + Đóng...")
        btn_save_close = form.ButtonControl(RegexName=r"(?i).*lưu \+ đóng.*")
        if btn_save_close.Exists(0.5, 0):
            btn_save_close.Click()
        else:
            pyautogui.click(fx + int(fw * 0.9473), fy + int(fh * 0.9724))

        time.sleep(1.5)

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
            btn_tra_kq = panel_bottom.ButtonControl(RegexName="(?i).*trả kết quả.*")

        if btn_tra_kq.Exists(1, 0) and btn_tra_kq.BoundingRectangle.width() > 0:
            self.log("Đang bấm nút 'Trả Kết Quả'...")
            rect = btn_tra_kq.BoundingRectangle
            pyautogui.click((rect.left + rect.right) // 2, (rect.top + rect.bottom) // 2)
            time.sleep(1.0)
            return True
        else:
            self.log("Nút 'Trả Kết Quả' không hiển thị hoặc ca này đã được trả kết quả trước đó.")
            return False

    def _click_and_type(self, x, y, text):
        pyautogui.click(x, y)
        time.sleep(0.15)
        pyautogui.hotkey('ctrl', 'a')
        pyautogui.press('backspace')
        time.sleep(0.1)
        pyperclip.copy(text)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.15)
        pyautogui.press('tab')
        time.sleep(0.1)

    def _select_dropdown(self, x, y, value):
        pyautogui.click(x, y)
        time.sleep(0.15)
        pyautogui.hotkey('ctrl', 'a')
        pyperclip.copy(value)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.15)
        pyautogui.press('enter')
        time.sleep(0.15)
        pyautogui.press('tab')
        time.sleep(0.1)

    def _fill_grid_cell(self, x, y, value):
        pyautogui.click(x, y)
        time.sleep(0.15)
        pyautogui.doubleClick(x, y)
        time.sleep(0.15)
        pyautogui.hotkey('ctrl', 'a')
        pyperclip.copy(value)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.2)
        pyautogui.press('enter')
        time.sleep(0.15)
        pyautogui.press('tab')
        time.sleep(0.1)
