# -*- coding: utf-8 -*-
"""
Module: his_driver.py
Tự động tương tác với phần mềm emrHIS (WinForms .NET) thông qua Windows UI Automation & PyAutoGUI.
"""

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
    def __init__(self):
        self.ensure_default_desktop()
        auto.SetGlobalSearchTimeout(3)
        self.main_window = None

    def ensure_default_desktop(self):
        """Chuyển thread hiện tại sang Default desktop để nhìn thấy toàn bộ cửa sổ đồ họa"""
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
        time.sleep(0.5)
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
        time.sleep(0.3)
        pyautogui.press('enter')
        time.sleep(1.0) # Đợi tải danh sách bệnh nhân

    def select_first_patient_in_list(self):
        """Click chọn bệnh nhân đầu tiên trong danh sách mListViewData"""
        win = self.bring_to_front()
        lv = win.ListControl(AutomationId="mListViewData")
        if not lv.Exists(2, 0):
            raise RuntimeError("Không tìm thấy danh sách bệnh nhân (mListViewData)!")

        rect = lv.BoundingRectangle
        # Click vào dòng đầu tiên (khoảng 35px dưới đỉnh bảng danh sách)
        click_x = rect.left + 50
        click_y = rect.top + 35
        pyautogui.click(click_x, click_y)
        time.sleep(1.0) # Đợi tải thông tin phiếu và thủ thuật

    def check_and_start_execution(self):
        """
        Kiểm tra nút 'Bắt đầu thực hiện'
        Nếu chưa bắt đầu: click nút và bấm 'Có' trên hộp thoại xác nhận.
        """
        win = self.bring_to_front()
        btn_start = win.ButtonControl(searchDepth=6, Name="Bắt đầu thực hiện")
        if not btn_start.Exists(1, 0):
            btn_start = win.ButtonControl(searchDepth=6, AutomationId="btnBatDau")

        if btn_start.Exists(1, 0) and btn_start.BoundingRectangle.width() > 0:
            print("Đang bấm 'Bắt đầu thực hiện'...")
            rect = btn_start.BoundingRectangle
            pyautogui.click((rect.left + rect.right) // 2, (rect.top + rect.bottom) // 2)
            time.sleep(0.8)

            # Chờ hộp thoại xác nhận 'emrHIS - Thông báo'
            confirm_dialog = auto.WindowControl(searchDepth=2, RegexName=".*Thông báo.*")
            if confirm_dialog.Exists(2, 0):
                btn_yes = confirm_dialog.ButtonControl(Name="Có")
                if btn_yes.Exists(1, 0):
                    btn_yes.Click()
                else:
                    pyautogui.press('enter')
            else:
                pyautogui.press('enter')
            time.sleep(1.0)
            return True
        return False

    def open_procedure_modal(self, row_index=0):
        """
        Chuột phải vào dòng thủ thuật (mListViewKetQua) -> chọn 'Nhập Thông Tin PTTT'
        """
        win = self.bring_to_front()
        lv_kq = win.ListControl(AutomationId="mListViewKetQua")
        if not lv_kq.Exists(2, 0):
            raise RuntimeError("Không tìm thấy danh sách thủ thuật (mListViewKetQua)!")

        rect = lv_kq.BoundingRectangle
        target_x = rect.left + 80
        target_y = rect.top + 35 + (row_index * 26) + 13

        pyautogui.rightClick(target_x, target_y)
        time.sleep(0.5)

        # Chọn 'Nhập Thông Tin PTTT' (mục thứ 3 trong menu ngữ cảnh)
        pyautogui.press('down')
        time.sleep(0.1)
        pyautogui.press('down')
        time.sleep(0.1)
        pyautogui.press('down')
        time.sleep(0.1)
        pyautogui.press('enter')
        time.sleep(1.5) # Đợi form mở

    def get_procedure_form(self):
        """Tìm cửa sổ modal 'Cập Nhật Thông Tin Thủ Thuật'"""
        self.ensure_default_desktop()
        modal = auto.WindowControl(searchDepth=2, RegexName=".*Cập Nhật Thông Tin Thủ Thuật.*")
        if modal.Exists(3, 0):
            return modal
        return None

    def fill_procedure_form(self, start_time_str, end_time_str, may_y_te="", nv_chinh=""):
        """
        Điền các thông tin vào form 'Cập Nhật Thông Tin Thủ Thuật'
        """
        form = self.get_procedure_form()
        if not form:
            raise RuntimeError("Không tìm thấy form 'Cập Nhật Thông Tin Thủ Thuật'!")

        form_rect = form.BoundingRectangle
        form_hwnd = form.NativeWindowHandle
        user32.SetForegroundWindow(form_hwnd)
        time.sleep(0.3)

        fx = form_rect.left
        fy = form_rect.top

        # 1. Thời gian bắt đầu
        print(f"Nhập Thời gian bắt đầu: {start_time_str}")
        self._click_and_type(fx + 310, fy + 215, start_time_str)

        # 2. Thời gian kết thúc
        print(f"Nhập Thời gian kết thúc: {end_time_str}")
        self._click_and_type(fx + 650, fy + 215, end_time_str)

        # 3. Phương pháp vô cảm (mặc định 'Khác')
        print("Chọn Phương pháp vô cảm: Khác")
        self._select_dropdown(fx + 350, fy + 515, "Khác")

        # 4. Tình hình PTTT (mặc định 'Chủ động')
        print("Chọn Tình hình PTTT: Chủ động")
        self._select_dropdown(fx + 160, fy + 545, "Chủ động")

        # 5. Máy y tế
        if may_y_te:
            print(f"Chọn Máy y tế: {may_y_te}")
            self._select_dropdown(fx + 620, fy + 580, may_y_te)

        # 6. Mô tả thủ thuật (mặc định '.')
        print("Nhập Mô tả thủ thuật: .")
        self._click_and_type(fx + 100, fy + 750, ".")

        # 7. Ê-kíp PTTT: Dòng 1 (TT viên chính)
        if nv_chinh:
            print(f"Nhập TT viên chính: {nv_chinh}")
            self._click_and_type(fx + 850, fy + 215, nv_chinh)

        # 8. Bấm Lưu + Đóng
        print("Bấm Lưu + Đóng...")
        btn_save_close = form.ButtonControl(Name="Lưu + Đóng")
        if btn_save_close.Exists(1, 0):
            btn_save_close.Click()
        else:
            pyautogui.click(form_rect.right - 55, form_rect.bottom - 25)

        time.sleep(1.5)

    def click_tra_ket_qua(self):
        """
        Bấm nút 'Trả Kết Quả' ở góc dưới bên phải màn hình chính emrHIS.
        """
        win = self.bring_to_front()
        btn_tra_kq = win.ButtonControl(searchDepth=6, Name="Trả Kết Quả")
        if not btn_tra_kq.Exists(1, 0):
            btn_tra_kq = win.ButtonControl(searchDepth=6, AutomationId="btnTraKetQua")

        if btn_tra_kq.Exists(1, 0) and btn_tra_kq.BoundingRectangle.width() > 0:
            print("Đang bấm nút 'Trả Kết Quả'...")
            rect = btn_tra_kq.BoundingRectangle
            pyautogui.click((rect.left + rect.right) // 2, (rect.top + rect.bottom) // 2)
            time.sleep(1.0)
            return True
        else:
            print("Nút 'Trả Kết Quả' không hiển thị hoặc ca này đã được trả kết quả trước đó.")
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
