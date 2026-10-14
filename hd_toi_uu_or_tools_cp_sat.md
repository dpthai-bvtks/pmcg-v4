# Hướng Dẫn Tối Ưu Hàm Mục Tiêu Và Tốc Độ Giải Google OR-Tools (CP-SAT)
## Ứng Dụng Trong Bài Toán Xếp Lịch Thủ Thuật Y Tế (YHCT - PHCN)

Tài liệu kỹ thuật tổng hợp các giải pháp mô hình hóa toán học, kỹ thuật tuyến tính hóa hàm mục tiêu và tinh chỉnh tham số solver trong **Google OR-Tools CP-SAT** nhằm đạt tốc độ giải dưới 1 giây trên máy trạm cục bộ.

---

## 1. Đặc Thù Bài Toán & Thách Thức Kỹ Thuật

Xếp lịch thủ thuật trong khoa Y học cổ truyền - Phục hồi chức năng mang tính chất lai ghép phức tạp:
* **Mô hình tài nguyên kép:** Cần đồng thời cả giường/máy điều trị lẫn nhân sự (Bác sĩ, Kỹ thuật viên, Điều dưỡng).
* **Phân pha thủ thuật (Multi-phase):** Không phải thủ thuật nào cũng chiếm nhân sự $100\%$ thời gian. Ví dụ: Điện châm gồm 3 pha: Cắm kim (5 phút - cần BS/KTV) $\to$ Lưu kim (20 phút - chỉ chiếm máy & giường, nhân viên rảnh) $\to$ Rút kim (2 phút - cần ĐD/KTV).
* **Bùng nổ tổ hợp (Combinatorial Explosion):** Khi số lượng bệnh nhân tăng ($> 30$ người/buổi) và số máy tương đương nhau (hàng chục máy điện châm, đèn hồng ngoại), không gian tìm kiếm nhánh cận (Branch and Bound) tăng theo cấp số nhân nếu không phá vỡ tính đối xứng.

---

## 2. Kỹ Thuật Thiết Kế Hàm Mục Tiêu (Objective Engineering)

CP-SAT xử lý tốt nhất hàm mục tiêu tuyến tính dạng số nguyên:
$$\min \sum_{i} c_i \cdot X_i$$

### 2.1. Chuẩn Hóa Thang Đo Trọng Số (Weight Scaling)
Tránh dùng các hệ số lũy thừa quá chênh lệch ($10^9, 10^6, 10^3$) vì dễ gây tràn số nguyên 64-bit và làm phẳng gradient cắt nhánh của bộ giải SAT. Thay vào đó, quy đổi mọi tiêu chí về cùng đơn vị cơ sở là **phút phạt**:

| Mục tiêu | Ý nghĩa lâm sàng / Vận hành | Trọng số đề xuất ($c_i$) |
| :--- | :--- | :--- |
| **Trễ giờ cam kết** | Bệnh nhân phải đợi quá giờ hẹn hoặc giờ ra viện | $100 \times \Delta t_{\text{trễ}}$ |
| **Thời gian chết của bệnh nhân** | Khoảng trống ngắt quãng giữa 2 thủ thuật của 1 người | $10 \times \Delta t_{\text{chờ}}$ |
| **Lệch tải nhân sự** | Chênh lệch khối lượng công việc giữa các kỹ thuật viên | $5 \times \Delta W$ |
| **Tổng thời gian kết thúc (Makespan)** | Hoàn thành ca làm việc buổi sáng/chiều càng sớm càng tốt | $1 \times T_{\text{kết thúc}}$ |

### 2.2. Tuyến Tính Hóa Cân Bằng Tải Nhân Sự
Hàm phi tuyến bình phương $\sum (t_i - \bar{t})^2$ sẽ làm chậm nghiêm trọng tiến trình giải. Sử dụng kỹ thuật **Min-Max** tuyến tính:

```python
# staff_loads: dict chứa biến tổng phút làm việc của từng nhân viên
max_load = model.NewIntVar(0, 480, 'max_load')
min_load = model.NewIntVar(0, 480, 'min_load')

for staff_id, load_var in staff_loads.items():
    model.Add(load_var <= max_load)
    model.Add(load_var >= min_load)

# Phạt khoảng cách chênh lệch giữa người làm nhiều nhất và ít nhất
load_imbalance = max_load - min_load
objective_terms.append(5 * load_imbalance)
```

### 2.3. Rút Ngắn Khoảng Chờ Giữa Các Thủ Thuật Của Bệnh Nhân
Khi một bệnh nhân có nhiều chỉ định (ví dụ: Điện châm + Thủy châm + Parafin):
```python
# Giả sử task_A kết thúc trước khi task_B bắt đầu
wait_time = model.NewIntVar(0, 240, f'wait_{patient_id}')
model.Add(wait_time == task_B_start - task_A_end)

# Phạt thời gian nằm chờ vô ích
objective_terms.append(10 * wait_time)
```

### 2.4. Chiến Lược Giải 2 Pha (Hierarchical / Lexicographic Solving)
Khi hai mục tiêu xung đột mạnh (ví dụ: Tối ưu Makespan vs Cân bằng tải nhân sự):
1. **Pha 1:** Giải bài toán với mục tiêu duy nhất $\min \text{Makespan}$ (giới hạn thời gian 1.5 giây). Thu được giá trị tối ưu $M^*$.
2. **Pha 2:** Bổ sung ràng buộc $\text{Makespan} \le M^* + \epsilon$ ($\epsilon$ cho phép giãn từ 5 đến 10 phút), sau đó đổi mục tiêu sang $\min \text{Lệch tải nhân sự}$ và tiếp tục giải.

---

## 3. Cắt Giảm Không Gian Nghiệm (Search Space Reduction)

### 3.1. Thu Hẹp Miền Giá Trị Biến Ban Đầu (Domain Tightening)
Không khởi tạo biến thời gian bắt đầu trên toàn bộ dải ca làm việc `[420, 1020]`. Hãy tận dụng ràng buộc thực tế:
* Chặn dưới: $\text{Lower Bound} = \max(\text{Giờ vào viện}, \text{Bắt đầu ca làm việc})$.
* Chặn trên: $\text{Upper Bound} = \min(\text{Giờ ra viện} - \text{Thời lượng thủ thuật}, \text{Kết thúc ca})$.

### 3.2. Phá Vỡ Tính Đối Xứng Bằng Cumulative Constraint (Symmetry Breaking)
Khi có 20 máy điện châm hoặc 10 đèn hồng ngoại giống hệt nhau, việc gán từng thủ thuật vào cụm máy cụ thể $1, 2, \dots, N$ sẽ sinh ra $N!$ trạng thái tương đương, làm tê liệt nhánh duyệt.

* **Giải pháp:** Coi toàn bộ cụm máy như một tài nguyên công suất chung bằng cách dùng `model.AddCumulative()`:

```python
# Gom toàn bộ interval của các ca điện châm
intervals = [task['interval'] for task in dien_cham_tasks]
demands = [1] * len(intervals)
total_capacity = 20  # Tổng số máy điện châm sẵn sàng

# Không cần quan tâm bệnh nhân nào dùng máy số mấy ở bước giải toán
model.AddCumulative(intervals, demands, total_capacity)
```
*Sau khi solver tìm ra khung giờ khả thi, dùng một thuật toán gán tham lam (Greedy / Interval Graph Coloring) cực nhanh ở tầng hậu xử lý để chỉ định mã máy thực tế.*

### 3.3. Mô Hình Hóa Phân Pha 3 Giai Đoạn (Cắm - Lưu - Rút)
Giải phóng nhân lực trong lúc bệnh nhân đang chạy máy:

```python
# Giai đoạn 1: Chuẩn bị & Cắm kim (Cần Bác sĩ/KTV + Giường/Máy)
p1_interval = model.NewIntervalVar(t_start, dur_prep, t_p1_end, f'p1_{task_id}')

# Giai đoạn 2: Lưu kim (Chỉ chiếm Giường/Máy, Nhân sự rảnh)
p2_interval = model.NewIntervalVar(t_p1_end, dur_stay, t_p2_end, f'p2_{task_id}')

# Giai đoạn 3: Rút kim (Cần Điều dưỡng/KTV + Giường/Máy)
p3_interval = model.NewIntervalVar(t_p2_end, dur_clean, t_final, f'p3_{task_id}')

# Giai đoạn toàn bộ để kiểm soát giường và máy
full_interval = model.NewIntervalVar(t_start, dur_prep + dur_stay + dur_clean, t_final, f'full_{task_id}')
```

---

## 4. Tinh Chỉnh Tham Số Solver (`CpSolver`)

Cấu hình khai thác tối đa năng lực phần cứng đa luồng của máy trạm:

```python
solver = cp_model.CpSolver()

# 1. Đa luồng: Tận dụng toàn bộ luồng vật lý/logic của CPU
solver.parameters.num_search_workers = 4

# 2. Ngưỡng thời gian: Điểm bão hòa tối ưu cho ca làm việc thực tế
solver.parameters.max_time_in_seconds = 5.0

# 3. Mức độ tuyến tính hóa LP: Tăng cường các lát cắt Simplex cut
# Giúp hội tụ cận dưới (lower bound) nhanh hơn cho các bài toán nhiều ràng buộc mềm
solver.parameters.linearization_level = 2

# 4. Tắt log console trên production để triệt tiêu độ trễ I/O
solver.parameters.log_search_progress = False

# 5. Bật presolve
solver.parameters.cp_model_presolve = True
```

---

## 5. Kỹ Thuật Mồi Nghiệm (Solution Hinting / Warm-Start)

Khi xếp lịch bổ sung theo thời gian thực (bệnh nhân mới vào viện hoặc nhân viên xin nghỉ đột xuất), không giải lại từ đầu. Sử dụng phương thức `AddHint()` từ kết quả cũ:

```python
# Mồi nghiệm từ bảng lịch đang chạy
for task_id, previous_start_time in cached_schedule.items():
    if task_id in current_tasks:
        model.AddHint(current_tasks[task_id]['start_var'], previous_start_time)
```
* **Lợi ích:** Solver có ngay nghiệm khả thi đầu tiên trong $< 20\text{ ms}$ và dành toàn bộ thời gian CPU còn lại cho các kỹ thuật tìm kiếm lân cận lớn (Large Neighborhood Search - LNS) để cải thiện điểm mục tiêu.

---

## 6. Khung Mã Nguồn Chuẩn Mẫu (Production Template)

```python
"""
Module tối ưu hóa phân bổ lịch thủ thuật YHCT - PHCN
Engine: Google OR-Tools CP-SAT
"""
from typing import Dict, List, Any
from ortools.sat.python import cp_model


def solve_medical_schedule(data: Dict[str, Any], time_limit: float = 5.0) -> Dict[str, Any]:
    model = cp_model.CpModel()
    
    # 1. Cấu hình khung thời gian (phút tính từ 00:00)
    DAY_START = 450   # 07:30
    DAY_END = 990     # 16:30
    
    tasks = data.get("tasks", [])
    staff_members = data.get("staff", [])
    machine_pools = data.get("machines", {})  # vd: {"dien_cham": 20, "dien_xung": 4}
    
    task_vars = {}
    staff_intervals = {s["id"]: [] for s in staff_members}
    pool_intervals = {m_type: [] for m_type in machine_pools}
    
    objective_penalties = []
    
    # 2. Khởi tạo Intervals và Domain Tightening
    for t in tasks:
        tid = t["id"]
        dur = t["duration"]
        
        # Domain Tightening từ thông tin bệnh nhân
        earliest = max(DAY_START, t.get("ready_time", DAY_START))
        latest = min(DAY_END, t.get("leave_time", DAY_END))
        
        start = model.NewIntVar(earliest, latest - dur, f"start_{tid}")
        end = model.NewIntVar(earliest + dur, latest, f"end_{tid}")
        interval = model.NewIntervalVar(start, dur, end, f"interval_{tid}")
        
        task_vars[tid] = {"start": start, "end": end, "interval": interval, "meta": t}
        
        # Gom tài nguyên máy móc
        m_type = t.get("machine_type")
        if m_type in pool_intervals:
            pool_intervals[m_type].append(interval)
            
        # Phạt trễ giờ hẹn
        if "target_time" in t:
            lateness = model.NewIntVar(0, DAY_END, f"late_{tid}")
            model.Add(lateness >= start - t["target_time"])
            objective_penalties.append(100 * lateness)
            
    # 3. Ràng buộc cụm máy (Symmetry Breaking qua AddCumulative)
    for m_type, intervals in pool_intervals.items():
        capacity = machine_pools[m_type]
        demands = [1] * len(intervals)
        model.AddCumulative(intervals, demands, capacity)
        
    # 4. Ràng buộc nhân sự không bị trùng giờ (NoOverlap)
    for s in staff_members:
        sid = s["id"]
        # Lọc danh sách interval được phân công cho nhân viên s
        assigned_intervals = [
            task_vars[tid]["interval"] 
            for tid, tinfo in task_vars.items() 
            if tinfo["meta"].get("assigned_staff") == sid
        ]
        if assigned_intervals:
            model.AddNoOverlap(assigned_intervals)
            
    # 5. Hàm mục tiêu tổng hợp
    model.Minimize(cp_model.LinearExpr.Sum(objective_penalties))
    
    # 6. Thiết lập tham số và tiến hành giải
    solver = cp_model.CpSolver()
    solver.parameters.num_search_workers = 4
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.linearization_level = 2
    
    status = solver.Solve(model)
    
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        schedule = []
        for tid, tinfo in task_vars.items():
            schedule.append({
                "task_id": tid,
                "start": solver.Value(tinfo["start"]),
                "end": solver.Value(tinfo["end"]),
                "duration": tinfo["meta"]["duration"]
            })
        return {
            "status": "SUCCESS",
            "is_optimal": (status == cp_model.OPTIMAL),
            "wall_time": solver.WallTime(),
            "schedule": schedule
        }
        
    return {"status": "INFEASIBLE", "wall_time": solver.WallTime()}
```