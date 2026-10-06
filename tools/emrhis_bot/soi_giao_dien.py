# -*- coding: utf-8 -*-
"""
SOI GIAO DIEN emrHIS (UI Inspector)
-----------------------------------
Muc dich: Lay "ten noi bo" (AutomationId / ClassName / Name) cua tung o nhap tren emrHIS
de bot tim o theo TEN thay vi theo TOA DO -> khong bao gio click lech nua.

Cach dung:
  1. Mo emrHIS, mo san cua so "Cap Nhat Thong Tin Thu Thuat".
  2. Chay file SOI_GIAO_DIEN.bat
  3. Re chuot vao TUNG O can soi roi bam phim F6:
       - O Thoi gian bat dau, Thoi gian ket thuc
       - O Phuong phap vo cam, Tinh hinh PTTT, May y te
       - O Mo ta thu thuat
       - O Nhan Vien dong 1 (bang E-Kip PTTT)
       - Nut Luu + Dong
     (Moi lan bam F6 se ghi thong tin o duoi con chuot vao file)
  4. Bam F9 de chup TOAN BO cay giao dien cua cua so dang hien tren cung.
  5. Bam ESC de thoat. Gui lai file "ket_qua_soi_giao_dien.txt" cho nguoi lap trinh.
"""
import ctypes
import os
import sys
import time

try:
    import uiautomation as auto
except ImportError:
    print("[LOI] Chua cai thu vien uiautomation. Dang cai dat...")
    os.system(f'"{sys.executable}" -m pip install uiautomation')
    import uiautomation as auto

OUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ket_qua_soi_giao_dien.txt")

VK_F6 = 0x75
VK_F9 = 0x78
VK_ESC = 0x1B


def key_down(vk):
    return (ctypes.windll.user32.GetAsyncKeyState(vk) & 0x8000) != 0


def describe(ctrl):
    try:
        r = ctrl.BoundingRectangle
        rect = f"({r.left},{r.top},{r.right},{r.bottom})"
    except Exception:
        rect = "?"
    value = ""
    try:
        vp = ctrl.GetValuePattern()
        if vp:
            value = vp.Value
    except Exception:
        pass
    return (f"Type={ctrl.ControlTypeName} | AutomationId='{ctrl.AutomationId}' | "
            f"Class='{ctrl.ClassName}' | Name='{ctrl.Name}' | Value='{value}' | Rect={rect}")


def write(text):
    print(text)
    with open(OUT_FILE, "a", encoding="utf-8") as f:
        f.write(text + "\n")


def dump_under_cursor():
    x, y = auto.GetCursorPos()
    ctrl = auto.ControlFromPoint(x, y)
    write("")
    write("=" * 100)
    write(f"[F6] O DUOI CHUOT tai ({x},{y}) - {time.strftime('%H:%M:%S')}")
    if not ctrl:
        write("  (Khong lay duoc control)")
        return
    write("  >> " + describe(ctrl))
    # Ghi chuoi cha (toi da 8 cap) de biet o nam trong khung nao
    parent = ctrl.GetParentControl()
    depth = 1
    while parent and depth <= 8:
        write("  " + "  " * depth + "cha: " + describe(parent))
        parent = parent.GetParentControl()
        depth += 1


def dump_tree(ctrl, depth=0, max_depth=25, counter=None):
    if counter is None:
        counter = [0]
    if depth > max_depth or counter[0] > 4000:
        return
    counter[0] += 1
    write("  " * depth + describe(ctrl))
    try:
        for child in ctrl.GetChildren():
            dump_tree(child, depth + 1, max_depth, counter)
    except Exception:
        pass


def dump_foreground_tree():
    fg = auto.GetForegroundControl()
    write("")
    write("#" * 100)
    write(f"[F9] CAY GIAO DIEN CUA SO TREN CUNG - {time.strftime('%H:%M:%S')}")
    if not fg:
        write("  (Khong lay duoc cua so tren cung)")
        return
    top = fg.GetTopLevelControl() or fg
    dump_tree(top)
    write("#" * 100)


def main():
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(f"KET QUA SOI GIAO DIEN emrHIS - {time.strftime('%d/%m/%Y %H:%M:%S')}\n")
    print("=" * 70)
    print(" SOI GIAO DIEN emrHIS")
    print("  - Re chuot vao o can soi + bam F6")
    print("  - Bam F9 de chup toan bo cay giao dien cua so tren cung")
    print("  - Bam ESC de thoat")
    print(f"  - Ket qua luu tai: {OUT_FILE}")
    print("=" * 70)

    prev = {VK_F6: False, VK_F9: False}
    while True:
        time.sleep(0.05)
        if key_down(VK_ESC):
            break
        for vk, fn in ((VK_F6, dump_under_cursor), (VK_F9, dump_foreground_tree)):
            now = key_down(vk)
            if now and not prev[vk]:
                try:
                    fn()
                except Exception as e:
                    write(f"  [LOI] {e}")
            prev[vk] = now

    print(f"\nDa luu ket qua vao: {OUT_FILE}")
    try:
        os.startfile(OUT_FILE)
    except Exception:
        pass


if __name__ == "__main__":
    main()
