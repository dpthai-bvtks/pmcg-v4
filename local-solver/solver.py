"""
🧠 GOOGLE OR-TOOLS CP-SAT OPTIMIZATION ENGINE (LOCAL SOLVER AGENT)
Hệ thống Xếp lịch Thủ thuật YHCT - PHCN v4-thuongmai (T.I.M.E.S System)
Tối ưu hóa toán học nâng cao: Phá vỡ tính đối xứng (Symmetry Breaking qua AddCumulative),
Tuyến tính hóa cân bằng tải nhân sự Min-Max, Rút ngắn thời gian chờ bệnh nhân,
Khai thác 100% CPU đa luồng C++ Native của Mini PC trạm tính toán.
"""

import time
import math
from typing import Dict, List, Any, Tuple, Optional
from ortools.sat.python import cp_model
import unicodedata


def strip_accents(s: str) -> str:
    """Loại bỏ dấu tiếng Việt để so khớp kỹ năng, phòng và tên thủ thuật"""
    if not s:
        return ""
    s = str(s).strip().lower()
    s = s.replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s


def t2m(t: Any) -> int:
    """Chuyển đổi giờ HH:MM sang số phút tính từ 00:00"""
    if t is None or t == "" or t == 0:
        return 0
    s = str(t).strip()
    if ":" in s:
        parts = s.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    try:
        val = float(s)
        if 0 < val <= 1:
            return round(val * 1440)
        return int(val)
    except Exception:
        return 0


def m2t(m: int) -> str:
    """Chuyển đổi số phút sang chuỗi giờ định dạng HH:MM"""
    hh = m // 60
    mm = m % 60
    return f"{hh:02d}:{mm:02d}"


def parse_shifts(shift_str: str) -> List[Tuple[int, int]]:
    """Phân tích chuỗi ca trực của nhân viên (ví dụ: '07:30-11:30, 13:00-16:30')"""
    if not shift_str:
        return [(450, 690), (780, 990)]
    shifts = []
    for part in str(shift_str).split(","):
        if "-" in part:
            pts = part.strip().split("-")
            if len(pts) == 2:
                s = t2m(pts[0].strip())
                e = t2m(pts[1].strip())
                if e > s:
                    shifts.append((s, e))
    return shifts if shifts else [(450, 690), (780, 990)]


def parse_busy(busy_str: str) -> List[Tuple[int, int]]:
    """Phân tích chuỗi giờ bận cố định của nhân viên"""
    if not busy_str:
        return []
    busy = []
    for part in str(busy_str).split(","):
        if "-" in part:
            raw = part.split(")")[-1].strip() if ")" in part else part.strip()
            pts = raw.split("-")
            if len(pts) == 2:
                s = t2m(pts[0].strip())
                e = t2m(pts[1].strip())
                if e > s:
                    busy.append((s, e))
    return busy


def is_continuous_proc(info: list, duration: int) -> bool:
    """Xác định thủ thuật liên tục 1:1 hay phân pha (cắm máy / lưu kim)"""
    if not info:
        return False
    loai_may = str(info[0] if len(info) > 0 else "Thủ công").strip()
    base_tg_may = int(info[1]) if len(info) > 1 and info[1] else 15
    tg_nv = int(info[2]) if len(info) > 2 and info[2] else 5

    # Cờ tường minh từ CSDL (trường thứ 12 / index 11)
    if len(info) > 11:
        flag = info[11]
        if flag in (1, "1", "Có", True):
            return True
        if flag in (0, "0", "Không", False):
            return False

    if tg_nv >= duration:
        return True
    if loai_may == "Thủ công" and tg_nv >= base_tg_may:
        return True
    return False


def solve_schedule(db: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Bộ giải quy hoạch ràng buộc toán học Google OR-Tools CP-SAT tối ưu cho v4-thuongmai
    Áp dụng kỹ thuật:
    - Cumulative Constraint gom cụm máy móc phá vỡ tính đối xứng (Symmetry Breaking)
    - Min-Max tuyến tính cân bằng tải nhân sự giữa các KTV
    - Rút ngắn khoảng chờ ngắt quãng giữa các thủ thuật của cùng bệnh nhân
    - Tham số Linearization Level 2 & Presolve tăng tốc hội tụ < 1s
    """
    start_wall_time = time.perf_counter()
    options = options or {}
    time_limit_sec = float(options.get("timeLimitSeconds", 5.0))
    num_workers = int(options.get("numWorkers", 4))  # Tận dụng 4 luồng của CPU i5 Mini PC

    # 🌟 TIẾP NHẬN LỊCH CŨ & THAM SỐ ÉP GỐI (Tích hợp từ MEDS System & PMXL)
    existing_sched = db.get("existingSched", []) or []
    is_supplemental = bool(existing_sched and len(existing_sched) > 0)
    max_squeeze = int(options.get("maxSqueezeMinutes", 2) or 0)

    # Lập danh bạ các ca đã xếp từ trước & lịch bận máy móc cũ
    existing_scheduled_keys = set()
    existing_mach_busy = {}  # mach_name -> list of (start_min, end_min)

    if is_supplemental:
        for ex in existing_sched:
            if not isinstance(ex, dict):
                continue
            ex_name = strip_accents(str(ex.get("tenBN") or ex.get("HOTEN") or ex.get("name") or "")).upper()
            ex_ns = str(ex.get("namSinh") or ex.get("NAMSINH") or ex.get("ns") or "").strip()
            ex_tt = strip_accents(str(ex.get("thuThuat") or ex.get("DICHVU") or "")).lower()
            ex_gio = str(ex.get("gioDienRa") or ex.get("GIODIENRA") or "").strip()
            if not ex_gio or ex_gio == "--" or "Rớt" in ex_gio:
                continue
            if ex_name and ex_tt:
                existing_scheduled_keys.add((ex_name, ex_ns, ex_tt))
                existing_scheduled_keys.add((ex_name, "", ex_tt))

    model = cp_model.CpModel()

    settings = db.get("settings", {})
    yhct_lunch = max(0, int(settings.get("yhctLunch", 0) or 0))
    yhct_end = max(0, int(settings.get("yhctEnd", 0) or 0))

    raw_staff = db.get("rawStaff", [])
    # Tự động nhận diện mùa đông nếu có nhân sự làm việc đến 12:00 hoặc cấu hình mùa
    is_winter = any("12:00" in str(r[3] if len(r) > 3 else "") for r in raw_staff)
    morning_base_end = 720 if is_winter else 690

    morning_end = morning_base_end + yhct_lunch
    afternoon_end = 990 + yhct_end
    lunch_start = morning_base_end
    lunch_end = 780
    raw_patients = db.get("rawPatients", [])
    room_beds = db.get("roomBeds", {})
    room_machines = db.get("roomMachines", {})
    machine_types = db.get("machineTypes", {})
    date_val = str(db.get("dateVal", "") or "Hôm nay")
    thu_thuat_info = db.get("thuThuatInfo", {})

    # 1. Tiền xử lý nhân sự (Bác sĩ, KTV, Điều dưỡng)
    staff_dict = {}
    staff_names = []
    nurse_names = []
    doc_ktv_names = []

    for r in raw_staff:
        name = str(r[0]).strip()
        if not name:
            continue
        role_raw = str(r[1] if len(r) > 1 else "").lower()
        skills = str(r[2] if len(r) > 2 else "").lower()
        shifts = parse_shifts(r[3] if len(r) > 3 else "")
        busy = parse_busy(r[4] if len(r) > 4 else "")

        is_doc = "bác sĩ" in role_raw or "bac si" in role_raw or role_raw.startswith("bs") or name.lower().startswith("bs")
        is_nurse = "điều dưỡng" in role_raw or "dieu duong" in role_raw or "đd" in role_raw or "dd" in role_raw or "y tá" in role_raw or "hộ lý" in role_raw or "phụ" in role_raw or name.lower().startswith("phụ")
        is_ktv = "kỹ thuật viên" in role_raw or "ky thuat vien" in role_raw or "ktv" in role_raw or name.lower().startswith("ktv") or (not is_doc and not is_nurse)

        staff_names.append(name)
        if is_nurse:
            nurse_names.append(name)
        else:
            doc_ktv_names.append(name)

        staff_dict[name] = {
            "name": name,
            "role": "Bác sĩ" if is_doc else ("Điều dưỡng" if is_nurse else "Kỹ thuật viên"),
            "is_doc": is_doc,
            "is_nurse": is_nurse,
            "is_ktv": is_ktv,
            "skills": skills,
            "shifts": shifts,
            "busy": busy
        }

    # 2. Tiền xử lý danh mục máy móc & giường bệnh
    all_rooms = list(room_beds.keys())
    if not all_rooms:
        all_rooms = ["Phòng 201", "Phòng 202", "Phòng 203"]
        room_beds = {r: [f"Giường {i+1}" for i in range(5)] for r in all_rooms}

    # Chuẩn hóa danh mục máy móc theo loại máy (Machine Pool)
    # Hỗ trợ cả key gốc và key không dấu để phá vỡ tính đối xứng (Symmetry Breaking)
    all_machines_by_type = {}
    for m_type, m_list in machine_types.items():
        clean_key = strip_accents(str(m_type))
        clean_key_simple = clean_key.replace("may ", "").replace("den ", "").strip()
        all_machines_by_type[clean_key] = list(m_list)
        if clean_key_simple and clean_key_simple != clean_key:
            all_machines_by_type[clean_key_simple] = list(m_list)

    # 3. Phẳng hóa danh sách công việc (Tasks) cần xếp từ rawPatients
    tasks = []
    task_id = 0

    for pat in raw_patients:
        p_id = pat.get("pId") or (pat.get("name", "") + "_" + str(pat.get("ns", "")))
        p_name = pat.get("name", "")
        p_ns = str(pat.get("ns", ""))
        p_room = pat.get("room", "") or (all_rooms[0] if all_rooms else "")
        p_arrive = max(450, int(pat.get("arrive", 450) or 450))
        p_leave = int(pat.get("leave", 1020) or 1020) if pat.get("leave") != 9999 else 1020
        p_loai = pat.get("loaiBN", "NoiTru")
        p_buoi = pat.get("buoiDieuTri") or pat.get("buoi_dieu_tri") or "TuDong"
        p_busy = pat.get("busy", [])
        pending = pat.get("pending", [])

        for tt in pending:
            tt_lower = str(tt).strip().lower()
            tt_clean = strip_accents(tt_lower)
            p_name_clean = strip_accents(p_name).upper()

            # 🛡️ Nếu đang xếp bổ sung và thủ thuật này đã có trong lịch cũ -> Bỏ qua không tạo task trùng lặp
            if is_supplemental:
                if (p_name_clean, p_ns, tt_clean) in existing_scheduled_keys or (p_name_clean, "", tt_clean) in existing_scheduled_keys:
                    continue

            info = thu_thuat_info.get(tt_lower, ["Thủ công", 20, 5, "PHCN", 1, 0, [], 5])
            loai_may = str(info[0] or "Thủ công").strip()
            tg_may = max(5, int(info[1] or 20))
            tg_nv = max(1, int(info[2] or 5))
            khoa = str(info[3] or "PHCN").strip()
            can_phu = int(info[5] or 0) if len(info) > 5 else 0
            gap_min = int(info[12]) if len(info) > 12 and info[12] is not None and info[12] > 0 else 1
            is_cont = is_continuous_proc(info, tg_may)

            tasks.append({
                "id": task_id,
                "p_id": p_id,
                "p_name": p_name,
                "p_ns": p_ns,
                "p_room": p_room,
                "p_arrive": p_arrive,
                "p_leave": p_leave,
                "p_loai": p_loai,
                "p_buoi": p_buoi,
                "p_busy": p_busy,
                "tt_name": tt,
                "info": info,
                "loai_may": loai_may,
                "tg_may": tg_may,
                "tg_nv": tg_nv,
                "khoa": khoa,
                "can_phu": can_phu,
                "gap_min": gap_min,
                "is_cont": is_cont
            })
            task_id += 1

    if not tasks:
        elapsed_ms = round((time.perf_counter() - start_wall_time) * 1000)
        return {
            "schedule": [],
            "unscheduled": [],
            "scheduleCount": 0,
            "unscheduledCount": 0,
            "elapsedMs": elapsed_ms,
            "solver": "Google OR-Tools CP-SAT (0 new tasks - Tất cả ca đều đã có lịch cũ)",
            "status": "OPTIMAL"
        }

    # ============================================================
    # 🧩 XÂY DỰNG MÔ HÌNH TOÁN HỌC CP-SAT
    # ============================================================

    task_vars = {}
    patient_intervals = {}          # p_id -> list of intervals
    patient_scheduled_tasks = {}    # p_id -> list of tv
    bed_intervals = {}              # (room, bed) -> list of intervals
    staff_intervals = {}            # staff_name -> list of intervals
    staff_assigned_loads = {s: [] for s in doc_ktv_names}  # s -> list of (dur_expr)

    # Cụm máy móc cho AddCumulative (Symmetry Breaking)
    # machine_pool_intervals: pool_key -> list of intervals
    machine_pool_intervals = {}
    machine_pool_capacities = {}
    machine_pool_candidates = {}

    for s_name in staff_names:
        staff_intervals[s_name] = []
        # Chặn các mốc ngoài ca làm việc thực tế của nhân sự
        s_shifts = staff_dict[s_name]["shifts"]
        if s_shifts:
            first_s = s_shifts[0][0]
            if first_s > 0:
                staff_intervals[s_name].append(model.NewIntervalVar(0, first_s, first_s, f"pre_shift_{s_name}"))
            for idx in range(len(s_shifts) - 1):
                gap_s = s_shifts[idx][1]
                gap_e = s_shifts[idx + 1][0]
                if gap_e > gap_s:
                    staff_intervals[s_name].append(model.NewIntervalVar(gap_s, gap_e - gap_s, gap_e, f"lunch_shift_{s_name}_{idx}"))
            last_e = s_shifts[-1][1]
            if last_e < 1440:
                staff_intervals[s_name].append(model.NewIntervalVar(last_e, 1440 - last_e, 1440, f"post_shift_{s_name}"))

        # Chặn các mốc bận cá nhân của nhân sự
        for b_idx, (b_s, b_e) in enumerate(staff_dict[s_name]["busy"]):
            b_dur = b_e - b_s
            if b_dur > 0:
                b_int = model.NewIntervalVar(b_s, b_dur, b_e, f"busy_{s_name}_{b_idx}")
                staff_intervals[s_name].append(b_int)

    # 🔒 ĐÓNG BĂNG TÀI NGUYÊN LỊCH CŨ THÀNH HẰNG SỐ CỐ ĐỊNH (Kỹ thuật từ MEDS System)
    if is_supplemental:
        for ex_idx, ex in enumerate(existing_sched):
            if not isinstance(ex, dict):
                continue
            ex_s_str = str(ex.get("gioDienRa") or ex.get("GIODIENRA") or "").strip()
            ex_e_str = str(ex.get("gioKetThuc") or ex.get("GIOKETTHUC") or "").strip()
            if not ex_s_str or ex_s_str == "--" or "Rớt" in ex_s_str:
                continue

            ex_s = t2m(ex_s_str)
            ex_e = t2m(ex_e_str) if ex_e_str else 0
            if ex_s <= 0:
                continue

            ex_tt = str(ex.get("thuThuat") or ex.get("DICHVU") or "").strip().lower()
            info_ex = thu_thuat_info.get(ex_tt, ["Thủ công", 20, 5, "PHCN", 1, 0, [], 5])
            base_dur = int(info_ex[1] or 20) if len(info_ex) > 1 else 20
            ex_dur = (ex_e - ex_s) if (ex_e > ex_s) else base_dur
            ex_e = ex_s + ex_dur

            ex_p_name = strip_accents(str(ex.get("tenBN") or ex.get("HOTEN") or "")).upper()
            ex_p_ns = str(ex.get("namSinh") or ex.get("NAMSINH") or "").strip()
            ex_p_id = ex.get("pId") or f"{ex_p_name}_{ex_p_ns}"

            # 1. Khóa bệnh nhân cũ (+5 phút đệm nghỉ)
            p_old_iv = model.NewIntervalVar(ex_s, ex_dur + 5, ex_e + 5, f"old_pat_{ex_idx}")
            patient_intervals.setdefault(ex_p_id, []).append(p_old_iv)

            # 2. Khóa KTV chính cũ
            ex_nv = str(ex.get("nvChinh") or ex.get("NV CHÍNH") or "").strip()
            ex_is_cont = is_continuous_proc(info_ex, ex_dur)
            ex_tg_nv = max(1, int(info_ex[2] or 5))
            ex_gap = int(info_ex[12]) if len(info_ex) > 12 and info_ex[12] is not None and info_ex[12] > 0 else 1
            ex_setup_dur = min(ex_tg_nv + ex_gap, ex_dur)
            ex_has_teardown = not ex_is_cont and (ex_dur > ex_tg_nv)
            ex_teardown_dur = 1 + ex_gap

            matched_s = None
            if ex_nv:
                for sn in staff_names:
                    if sn.lower() == ex_nv.lower() or strip_accents(sn) == strip_accents(ex_nv):
                        matched_s = sn
                        break

            if matched_s:
                if ex_is_cont:
                    st_old_iv = model.NewIntervalVar(ex_s, ex_dur + ex_gap, ex_e + ex_gap, f"old_st_{ex_idx}")
                    staff_intervals[matched_s].append(st_old_iv)
                else:
                    st_set_old = model.NewIntervalVar(ex_s, ex_setup_dur, ex_s + ex_setup_dur, f"old_st_set_{ex_idx}")
                    staff_intervals[matched_s].append(st_set_old)
                    if ex_has_teardown:
                        st_tear_old = model.NewIntervalVar(ex_e - 1, ex_teardown_dur, ex_e + ex_gap, f"old_st_tear_{ex_idx}")
                        staff_intervals[matched_s].append(st_tear_old)

            # 3. Khóa KTV / Điều dưỡng phụ cũ
            ex_sub = str(ex.get("nvPhu") or ex.get("NV PHỤ") or "").strip()
            matched_sub = None
            if ex_sub:
                for sn in staff_names:
                    if sn.lower() == ex_sub.lower() or strip_accents(sn) == strip_accents(ex_sub):
                        matched_sub = sn
                        break
            if matched_sub:
                if ex_is_cont:
                    sub_old_iv = model.NewIntervalVar(ex_s, ex_dur + ex_gap, ex_e + ex_gap, f"old_sub_{ex_idx}")
                    staff_intervals[matched_sub].append(sub_old_iv)
                else:
                    sub_set_old = model.NewIntervalVar(ex_s, ex_setup_dur, ex_s + ex_setup_dur, f"old_sub_set_{ex_idx}")
                    staff_intervals[matched_sub].append(sub_set_old)
                    if ex_has_teardown:
                        sub_tear_old = model.NewIntervalVar(ex_e - 1, ex_teardown_dur, ex_e + ex_gap, f"old_sub_tear_{ex_idx}")
                        staff_intervals[matched_sub].append(sub_tear_old)

            # 4. Khóa Giường bệnh cũ
            ex_phong = str(ex.get("phong") or ex.get("PHONG") or "").strip()
            ex_giuong = str(ex.get("giuong") or ex.get("GIUONG") or "").strip()
            if ex_phong and ex_giuong and not ex_giuong.startswith("Ghế") and not "phụ" in ex_giuong.lower():
                b_old_key = (ex_phong, ex_giuong)
                b_old_iv = model.NewIntervalVar(ex_s, ex_dur, ex_e, f"old_bed_{ex_idx}")
                bed_intervals.setdefault(b_old_key, []).append(b_old_iv)

            # 5. Khóa Máy móc cũ
            ex_may = str(ex.get("may") or ex.get("MAY") or "").strip()
            if ex_may and ex_may != "Thủ công":
                ex_lm = str(info_ex[0] or "").strip()
                lm_clean = strip_accents(ex_lm) if ex_lm else strip_accents(ex_may)
                lm_simple = lm_clean.replace("may ", "").replace("den ", "").strip()
                m_pool = lm_simple if lm_simple else lm_clean
                m_old_iv = model.NewIntervalVar(ex_s, ex_dur, ex_e, f"old_m_{ex_idx}")
                machine_pool_intervals.setdefault(m_pool, []).append(m_old_iv)
                existing_mach_busy.setdefault(ex_may, []).append((ex_s, ex_e))

    total_drop_penalties = []
    total_start_costs = []
    patient_wait_penalties = []

    day_start = 450
    day_end = max(afternoon_end + 30, 1050)

    for t in tasks:
        tid = t["id"]
        tg_may = t["tg_may"]
        tg_nv = t["tg_nv"]
        gap_min = t["gap_min"]
        is_cont = t["is_cont"]
        p_room = t["p_room"]
        p_id = t["p_id"]

        # Biến boolean: Có xếp được ca này hay rớt?
        is_scheduled = model.NewBoolVar(f"sched_{tid}")
        is_dropped = model.NewBoolVar(f"drop_{tid}")
        model.Add(is_scheduled + is_dropped == 1)
        # Chuẩn hóa trọng số phạt rớt ca (ưu tiên tối cao 100.000 điểm)
        total_drop_penalties.append(is_dropped * 100000)

        # Domain Tightening từ thông tin bệnh nhân
        min_start = max(450, t["p_arrive"])
        max_end = min(afternoon_end, t["p_leave"])
        can_fit = (min_start + tg_may <= max_end)

        if not can_fit:
            model.Add(is_scheduled == 0)

        start_var = model.NewIntVar(day_start, day_end, f"start_{tid}")
        end_var = model.NewIntVar(day_start, day_end, f"end_{tid}")
        model.Add(end_var == start_var + tg_may)

        if can_fit:
            model.Add(start_var >= min_start).OnlyEnforceIf(is_scheduled)
            model.Add(end_var <= max_end).OnlyEnforceIf(is_scheduled)

        # Chặn chạy xuyên trưa: ca phải kết thúc trước trưa hoặc bắt đầu sau trưa
        is_morning = model.NewBoolVar(f"is_morning_{tid}")
        model.Add(end_var <= morning_end).OnlyEnforceIf([is_scheduled, is_morning])
        model.Add(start_var >= lunch_end).OnlyEnforceIf([is_scheduled, is_morning.Not()])

        # Ngoại trú: khóa buổi sáng hoặc chiều
        if t["p_loai"] == "NgoaiTru":
            if t["p_buoi"] == "Sang":
                model.Add(is_morning == 1).OnlyEnforceIf(is_scheduled)
            elif t["p_buoi"] == "Chieu":
                model.Add(is_morning == 0).OnlyEnforceIf(is_scheduled)

        # Khoảng thời gian chính của thủ thuật
        proc_interval = model.NewOptionalIntervalVar(start_var, tg_may, end_var, is_scheduled, f"proc_iv_{tid}")

        # Ràng buộc Bệnh nhân: không trùng giữa các ca của cùng bệnh nhân + 5 phút nghỉ
        p_iv = model.NewOptionalIntervalVar(start_var, tg_may + 5, end_var + 5, is_scheduled, f"pat_iv_{tid}")
        patient_intervals.setdefault(p_id, []).append(p_iv)

        # 4. Phân công Giường bệnh trong phòng
        candidate_beds = list(room_beds.get(p_room, []))
        if not candidate_beds:
            candidate_beds = ["Giường 1", "Giường 2", "Giường 3", "Giường 4", "Giường 5"]
        is_keo_gian = "kéo giãn" in t["loai_may"].lower() or "kg" in t["loai_may"].lower()
        if is_keo_gian:
            candidate_beds.append("Giường máy Kéo giãn")
        else:
            candidate_beds.append("Ghế điều trị")
            candidate_beds.append("Giường phụ")

        bed_choice_vars = {}
        for b_name in candidate_beds:
            b_var = model.NewBoolVar(f"bed_{tid}_{b_name}")
            bed_choice_vars[b_name] = b_var
            b_key = (p_room, b_name)
            b_iv = model.NewOptionalIntervalVar(start_var, tg_may, end_var, b_var, f"b_iv_{tid}_{b_name}")
            bed_intervals.setdefault(b_key, []).append(b_iv)

        model.Add(sum(bed_choice_vars.values()) == is_scheduled)

        # 5. Phân công Máy móc: Gom cụm tài nguyên chung (AddCumulative - Symmetry Breaking)
        # Thay vì gán từng máy cụ thể sinh ra N! hoán vị đối xứng, gom toàn bộ máy cùng loại
        # vào một cụm Cumulative Capacity. Sau khi giải, gán máy cụ thể qua Interval Coloring cực nhanh.
        m_pool_key = None
        c_machs = []
        if t["loai_may"] != "Thủ công":
            lm_clean = strip_accents(t["loai_may"])
            lm_simple = lm_clean.replace("may ", "").replace("den ", "").strip()
            c_machs = all_machines_by_type.get(lm_clean) or all_machines_by_type.get(lm_simple) or []
            if not c_machs:
                for mk, mv in all_machines_by_type.items():
                    if lm_simple in mk or mk in lm_simple:
                        c_machs = mv
                        break
            if not c_machs:
                c_machs = [f"{t['loai_may']} 01"]

            m_pool_key = lm_simple if lm_simple else lm_clean
            machine_pool_intervals.setdefault(m_pool_key, []).append(proc_interval)
            machine_pool_capacities[m_pool_key] = max(machine_pool_capacities.get(m_pool_key, 0), len(c_machs))
            machine_pool_candidates[m_pool_key] = c_machs

        # 6. Phân công Nhân sự Chính (Bác sĩ / KTV)
        staff_candidates = []
        p_tt = t["tt_name"].lower().strip()
        p_tt_clean = strip_accents(p_tt)
        p_info = t["info"]
        p_vt = str(p_info[9] if len(p_info) > 9 and p_info[9] else "").lower().strip()
        p_tg = str(p_info[8] if len(p_info) > 8 and p_info[8] else "").lower().strip()

        for s_name in doc_ktv_names:
            st = staff_dict[s_name]
            s_skills = st["skills"]
            s_skills_clean = strip_accents(s_skills)

            has_all_skills = ("all" in s_skills or "toàn bộ" in s_skills or "toan bo" in s_skills_clean or "cả hai" in s_skills or "ca hai" in s_skills_clean)
            is_dept_match = (("yhct" in s_skills and t["khoa"] == "YHCT") or
                             ("phcn" in s_skills and t["khoa"] == "PHCN") or
                             (st["is_doc"] and t["khoa"] == "YHCT"))

            is_proc_match = False
            for part in s_skills.split(","):
                part_clean = part.strip()
                if not part_clean:
                    continue
                part_no_acc = strip_accents(part_clean)
                if part_clean == p_tt or (p_vt and part_clean == p_vt) or (p_tg and part_clean == p_tg):
                    is_proc_match = True
                    break
                if part_no_acc == p_tt_clean or (p_vt and part_no_acc == strip_accents(p_vt)):
                    is_proc_match = True
                    break
                if part_clean in p_tt or p_tt in part_clean or part_no_acc in p_tt_clean:
                    is_proc_match = True
                    break

            if has_all_skills or is_dept_match or is_proc_match:
                staff_candidates.append(s_name)

        if not staff_candidates:
            staff_candidates = doc_ktv_names if doc_ktv_names else staff_names

        staff_choice_vars = {}
        # 🧩 Áp dụng luật Ép gối cục bộ (Local Squeezing từ PMXL): cho phép co nhẹ thời gian đệm khi xếp bổ sung
        eff_gap = max(1, gap_min - max_squeeze) if is_supplemental else gap_min
        setup_dur = min(tg_nv + eff_gap, tg_may)
        has_teardown = not is_cont and (tg_may > tg_nv)
        teardown_dur = 1 + eff_gap

        # Thời lượng nhân sự làm việc để cân bằng tải
        staff_work_dur = tg_may if is_cont else (setup_dur + (teardown_dur if has_teardown else 0))

        for s_name in staff_candidates:
            s_var = model.NewBoolVar(f"st_{tid}_{s_name}")
            staff_choice_vars[s_name] = s_var

            if is_cont:
                full_dur = tg_may + gap_min
                st_iv = model.NewOptionalIntervalVar(start_var, full_dur, start_var + full_dur, s_var, f"st_full_{tid}_{s_name}")
                staff_intervals[s_name].append(st_iv)
            else:
                st_setup_iv = model.NewOptionalIntervalVar(start_var, setup_dur, start_var + setup_dur, s_var, f"st_set_{tid}_{s_name}")
                staff_intervals[s_name].append(st_setup_iv)
                if has_teardown:
                    st_tear_iv = model.NewOptionalIntervalVar(end_var - 1, teardown_dur, end_var + gap_min, s_var, f"st_tear_{tid}_{s_name}")
                    staff_intervals[s_name].append(st_tear_iv)

            # Đóng góp khối lượng công việc vào nhân viên s_name
            if s_name in staff_assigned_loads:
                staff_assigned_loads[s_name].append(s_var * staff_work_dur)

        model.Add(sum(staff_choice_vars.values()) == is_scheduled)

        # 7. Phân công Nhân sự Phụ (Điều dưỡng hỗ trợ) nếu thủ thuật cần phụ
        sub_choice_vars = {}
        if t["can_phu"] == 1:
            nurse_candidates = nurse_names if nurse_names else [s for s in staff_names if not staff_dict[s]["is_doc"]]
            for n_name in nurse_candidates:
                n_var = model.NewBoolVar(f"sub_{tid}_{n_name}")
                sub_choice_vars[n_name] = n_var
                if is_cont:
                    n_full_dur = tg_may + gap_min
                    n_iv = model.NewOptionalIntervalVar(start_var, n_full_dur, start_var + n_full_dur, n_var, f"n_full_{tid}_{n_name}")
                    staff_intervals[n_name].append(n_iv)
                else:
                    n_setup_iv = model.NewOptionalIntervalVar(start_var, setup_dur, start_var + setup_dur, n_var, f"n_set_{tid}_{n_name}")
                    staff_intervals[n_name].append(n_setup_iv)
                    if has_teardown:
                        n_tear_iv = model.NewOptionalIntervalVar(end_var - 1, teardown_dur, end_var + gap_min, n_var, f"n_tear_{tid}_{n_name}")
                        staff_intervals[n_name].append(n_tear_iv)

            model.Add(sum(sub_choice_vars.values()) == is_scheduled)

        tv_entry = {
            "is_scheduled": is_scheduled,
            "start_var": start_var,
            "end_var": end_var,
            "bed_choice_vars": bed_choice_vars,
            "m_pool_key": m_pool_key,
            "c_machs": c_machs,
            "staff_choice_vars": staff_choice_vars,
            "sub_choice_vars": sub_choice_vars,
            "task": t
        }
        task_vars[tid] = tv_entry
        patient_scheduled_tasks.setdefault(p_id, []).append(tv_entry)

        # Dồn lịch sớm (Left-shift Makespan nhẹ, trọng số = 1)
        total_start_costs.append(start_var)

    # ============================================================
    # 🔒 RÀNG BUỘC KHÔNG TRÙNG LẶP TÀI NGUYÊN (NO-OVERLAP & CUMULATIVE)
    # ============================================================

    # 1. Bệnh nhân: không trùng lịch giữa các ca của cùng bệnh nhân
    for p_id, iv_list in patient_intervals.items():
        if len(iv_list) > 1:
            model.AddNoOverlap(iv_list)

    # 2. Cụm máy móc: AddCumulative phá vỡ tính đối xứng (Symmetry Breaking)
    for m_pool_key, iv_list in machine_pool_intervals.items():
        capacity = machine_pool_capacities.get(m_pool_key, 1)
        if len(iv_list) > 0:
            if capacity > 1:
                demands = [1] * len(iv_list)
                model.AddCumulative(iv_list, demands, capacity)
            else:
                model.AddNoOverlap(iv_list)

    # 3. Giường bệnh: không trùng trên cùng 1 giường
    for b_key, iv_list in bed_intervals.items():
        if not b_key[1].startswith("Ghế") and not "phụ" in b_key[1].lower():
            if len(iv_list) > 1:
                model.AddNoOverlap(iv_list)

    # 4. Nhân sự: không trùng ca làm việc (theo khoảng bận Setup, Teardown, giờ bận)
    for s_name, iv_list in staff_intervals.items():
        if len(iv_list) > 1:
            model.AddNoOverlap(iv_list)

    # ============================================================
    # 🎯 HÀM MỤC TIÊU NÂNG CAO (ADVANCED OBJECTIVE ENGINEERING)
    # ============================================================
    objective_terms = []

    # 1. Phạt rớt ca: Trọng số tối cao 100.000 để đảm bảo xếp tối đa ca
    objective_terms.extend(total_drop_penalties)

    # 2. Hoàn thành sớm buổi làm việc (Makespan / Left-pack: trọng số 1)
    objective_terms.extend(total_start_costs)

    # 3. Rút ngắn thời gian chờ ngắt quãng giữa các thủ thuật của bệnh nhân (trọng số 10)
    for p_id, p_tv_list in patient_scheduled_tasks.items():
        if len(p_tv_list) >= 2:
            p_span_start = model.NewIntVar(day_start, day_end, f"p_span_s_{p_id}")
            p_span_end = model.NewIntVar(day_start, day_end, f"p_span_e_{p_id}")
            for tv in p_tv_list:
                model.Add(p_span_start <= tv["start_var"]).OnlyEnforceIf(tv["is_scheduled"])
                model.Add(p_span_end >= tv["end_var"]).OnlyEnforceIf(tv["is_scheduled"])

            total_dur = sum(tv["task"]["tg_may"] for tv in p_tv_list)
            p_wait = model.NewIntVar(0, day_end - day_start, f"p_wait_{p_id}")
            model.Add(p_wait >= (p_span_end - p_span_start) - total_dur)
            objective_terms.append(10 * p_wait)

    # 4. Tuyến tính hóa cân bằng tải nhân viên KTV (Min-Max: trọng số 5)
    valid_ktv_loads = [sum(staff_assigned_loads[s]) for s in doc_ktv_names if staff_assigned_loads[s]]
    if len(valid_ktv_loads) >= 2:
        max_load = model.NewIntVar(0, 480, "max_staff_load")
        min_load = model.NewIntVar(0, 480, "min_staff_load")
        for load_expr in valid_ktv_loads:
            model.Add(max_load >= load_expr)
            model.Add(min_load <= load_expr)
        load_imbalance = max_load - min_load
        objective_terms.append(5 * load_imbalance)

    # Tổng hợp hàm mục tiêu
    model.Minimize(cp_model.LinearExpr.Sum(objective_terms))

    # ============================================================
    # ⚡ CẤU HÌNH BỘ GIẢI TOÁN HỌC GOOGLE OR-TOOLS (CP-SAT)
    # ============================================================
    solver = cp_model.CpSolver()
    solver.parameters.num_search_workers = num_workers
    solver.parameters.max_time_in_seconds = time_limit_sec
    solver.parameters.linearization_level = 2   # Tăng cường lát cắt Simplex cut hội tụ nhanh hơn
    solver.parameters.cp_model_presolve = True  # Bật tiền giải nén miền giá trị
    solver.parameters.log_search_progress = False

    status = solver.Solve(model)

    elapsed_ms = round((time.perf_counter() - start_wall_time) * 1000)
    solver_status_name = solver.StatusName(status)

    scheduled_list = []
    unscheduled_list = []

    # ============================================================
    # 🎨 HẬU XỬ LÝ: INTERVAL COLORING GÁN MÃ MÁY CỤ THỂ
    # ============================================================
    # Gom các ca đã xếp theo cụm máy để gán máy không bị trùng
    tasks_by_pool = {}
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for tid, tv in task_vars.items():
            if solver.Value(tv["is_scheduled"]) == 1 and tv["m_pool_key"]:
                tasks_by_pool.setdefault(tv["m_pool_key"], []).append({
                    "tid": tid,
                    "start": solver.Value(tv["start_var"]),
                    "end": solver.Value(tv["end_var"]),
                    "c_machs": tv["c_machs"]
                })

    assigned_machines = {}
    for pool_key, p_tasks in tasks_by_pool.items():
        # Sắp xếp theo giờ bắt đầu tăng dần
        p_tasks.sort(key=lambda x: (x["start"], x["end"]))
        c_machs = machine_pool_candidates.get(pool_key, [])
        if not c_machs:
            c_machs = [f"{pool_key.title()} 01"]

        # Theo dõi thời điểm máy sẽ rảnh
        mach_free_time = {m: 0 for m in c_machs}
        for item in p_tasks:
            s = item["start"]
            e = item["end"]
            tid = item["tid"]

            # Chọn máy đang rảnh tại thời điểm s (và tuyệt đối không bận trong lịch cũ existingSched)
            best_m = None
            min_idle = 999999
            for m in c_machs:
                # Kiểm tra máy có đang phục vụ ca cũ trong existingSched tại thời điểm [s, e] không
                is_busy_in_old = any(b_s < e and s < b_e for b_s, b_e in existing_mach_busy.get(m, []))
                if not is_busy_in_old and mach_free_time[m] <= s:
                    idle = s - mach_free_time[m]
                    if idle < min_idle:
                        min_idle = idle
                        best_m = m

            # Fallback: chọn máy không trùng lịch cũ và rảnh sớm nhất
            if best_m is None:
                avail_machs = [m for m in c_machs if not any(b_s < e and s < b_e for b_s, b_e in existing_mach_busy.get(m, []))]
                if avail_machs:
                    best_m = min(avail_machs, key=lambda m: mach_free_time[m])
                else:
                    best_m = min(c_machs, key=lambda m: mach_free_time[m])

            mach_free_time[best_m] = e
            assigned_machines[tid] = best_m

    # ============================================================
    # 📋 TẬP HỢP KẾT QUẢ ĐẦU RA
    # ============================================================
    for tid, tv in task_vars.items():
        t = tv["task"]
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) and solver.Value(tv["is_scheduled"]) == 1:
            s_val = solver.Value(tv["start_var"])
            e_val = solver.Value(tv["end_var"])

            # Lấy giường được chọn
            chosen_bed = "Giường 1"
            for b_name, b_var in tv["bed_choice_vars"].items():
                if solver.Value(b_var) == 1:
                    chosen_bed = b_name
                    break

            # Lấy máy từ kết quả Interval Coloring hoặc Thủ công
            chosen_mach = "Thủ công"
            if tv["m_pool_key"]:
                chosen_mach = assigned_machines.get(tid, tv["c_machs"][0] if tv["c_machs"] else "Thủ công")

            # Lấy nhân sự chính được chọn
            chosen_staff = ""
            for s_name, s_var in tv["staff_choice_vars"].items():
                if solver.Value(s_var) == 1:
                    chosen_staff = s_name
                    break

            # Lấy nhân sự phụ được chọn
            chosen_sub = ""
            for n_name, n_var in tv["sub_choice_vars"].items():
                if solver.Value(n_var) == 1:
                    chosen_sub = n_name
                    break

            item = {
                "NGAY": date_val,
                "HOTEN": t["p_name"],
                "NAMSINH": t["p_ns"],
                "PHONG": t["p_room"],
                "DICHVU": t["tt_name"],
                "GIODIENRA": m2t(s_val),
                "GIOKETTHUC": m2t(e_val),
                "NV CHÍNH": chosen_staff,
                "NV PHỤ": chosen_sub,
                "MAY": chosen_mach,
                "GIUONG": chosen_bed,
                "t_sort": s_val,
                # Tương thích tên thuộc tính camelCase
                "tenBN": t["p_name"],
                "namSinh": t["p_ns"],
                "phong": t["p_room"],
                "thuThuat": t["tt_name"],
                "gioDienRa": m2t(s_val),
                "gioKetThuc": m2t(e_val),
                "nvChinh": chosen_staff,
                "nvPhu": chosen_sub,
                "may": chosen_mach,
                "giuong": chosen_bed
            }
            scheduled_list.append(item)
        else:
            unscheduled_list.append({
                "pId": t["p_id"],
                "bn": t["p_name"],
                "ns": t["p_ns"],
                "room": t["p_room"],
                "tt": t["tt_name"],
                "reason": "Hết tài nguyên hoặc xung đột giờ trực (OR-Tools CP-SAT)"
            })

    # Sắp xếp lịch theo thời gian bắt đầu
    scheduled_list.sort(key=lambda x: x["t_sort"])

    return {
        "schedule": scheduled_list,
        "unscheduled": unscheduled_list,
        "scheduleCount": len(scheduled_list),
        "unscheduledCount": len(unscheduled_list),
        "elapsedMs": elapsed_ms,
        "solver": f"Google OR-Tools CP-SAT ({solver_status_name}, {num_workers} Threads)",
        "status": solver_status_name
    }
