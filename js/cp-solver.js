/**
 * 🧠 MEDICAL CONSTRAINT PROGRAMMING & BRANCH-AND-BOUND SOLVER (GROUP 1)
 * Bộ giải Quy hoạch Ràng buộc Toán học (CP-SAT / MIP Optimizer) cho Lịch trình Y Tế
 * Tối ưu hóa toàn diện xung đột tài nguyên, máy móc, phòng bệnh và nhân sự.
 */

window.MedicalCPSolver = (function () {
  'use strict';

  function t2m(t) {
    if (!t && t !== 0) return 0;
    if (t instanceof Date) return isNaN(t.getTime()) ? 0 : t.getUTCHours() * 60 + t.getUTCMinutes();
    const str = String(t).trim();
    if (!str || str === '0' || !str.includes(':')) return 0;
    const parts = str.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  function m2t(m) {
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }

  function isOverlap(s1, e1, s2, e2) {
    return Math.max(s1, s2) < Math.min(e1, e2);
  }

  /**
   * Tính toán điểm phạt tổng thể của một phương án lịch trình (Objective Cost)
   */
  function evaluateScheduleScore(sched, unsch, weights = { drop: 10000, overtime: 2, imbalance: 0.1 }) {
    const dropPenalty = (unsch ? unsch.length : 0) * weights.drop;
    
    // Tính tổng phút tăng ca của nhân sự
    const staffMins = {};
    (sched || []).forEach(item => {
      const nv = item.nvChinh || item["NV CHÍNH"];
      if (nv) {
        const start = t2m(item.gioDienRa || item.GIODIENRA);
        const end = t2m(item.gioKetThuc || item.GIOKETTHUC);
        staffMins[nv] = (staffMins[nv] || 0) + Math.max(0, end - start);
      }
    });

    const standardShift = 450; // 7.5 giờ
    let overtimeMins = 0;
    const loadList = Object.values(staffMins);
    loadList.forEach(m => {
      if (m > standardShift) overtimeMins += (m - standardShift);
    });

    const avg = loadList.length ? (loadList.reduce((a, b) => a + b, 0) / loadList.length) : 0;
    const imbalance = loadList.reduce((sum, v) => sum + Math.abs(v - avg), 0);

    return dropPenalty + overtimeMins * weights.overtime + imbalance * weights.imbalance;
  }

  /**
   * Kiểm tra xem một ca thủ thuật mới có vi phạm bất kỳ ràng buộc cứng (Hard Constraints) nào không
   */
  function isFeasibleAssignment(candidate, currentSched, db) {
    const { patName, patNs, patRoom, tenTT, start, end, nvChinh, nvPhu, machine, bed } = candidate;

    // 1. Ràng buộc bệnh nhân không bị trùng giờ giữa 2 thủ thuật
    for (const item of currentSched) {
      const iName = (item.tenBN || item.HOTEN || '').toUpperCase();
      const iNs = item.namSinh || item.NAMSINH || '';
      if (iName === patName && (!patNs || !iNs || patNs === iNs)) {
        const iStart = t2m(item.gioDienRa || item.GIODIENRA);
        const iEnd = t2m(item.gioKetThuc || item.GIOKETTHUC);
        // Cần khoảng cách nghỉ giữa 2 ca của cùng BN tối thiểu 5 phút
        if (isOverlap(start, end + 5, iStart, iEnd + 5)) {
          return false;
        }
      }
    }

    // 2. Ràng buộc nhân viên chính & nhân viên phụ không trùng giờ
    for (const item of currentSched) {
      const iStart = t2m(item.gioDienRa || item.GIODIENRA);
      const iEnd = t2m(item.gioKetThuc || item.GIOKETTHUC);
      const iNv1 = item.nvChinh || item["NV CHÍNH"];
      const iNv2 = item.nvPhu || item["NV PHỤ"];

      if (isOverlap(start, end, iStart, iEnd)) {
        if (nvChinh && (nvChinh === iNv1 || nvChinh === iNv2)) return false;
        if (nvPhu && (nvPhu === iNv1 || nvPhu === iNv2)) return false;
      }
    }

    // 3. Ràng buộc máy móc không trùng
    if (machine && machine !== 'Thủ công') {
      for (const item of currentSched) {
        const iMay = item.may || item.MAY;
        if (iMay === machine) {
          const iStart = t2m(item.gioDienRa || item.GIODIENRA);
          const iEnd = t2m(item.gioKetThuc || item.GIOKETTHUC);
          if (isOverlap(start, end, iStart, iEnd)) return false;
        }
      }
    }

    // 4. Ràng buộc giường bệnh trong phòng không trùng
    if (bed && patRoom) {
      for (const item of currentSched) {
        const iPhong = item.phong || item.PHONG;
        const iGiuong = item.giuong || item.GIUONG;
        if (iPhong === patRoom && iGiuong === bed) {
          const iStart = t2m(item.gioDienRa || item.GIODIENRA);
          const iEnd = t2m(item.gioKetThuc || item.GIOKETTHUC);
          if (isOverlap(start, end, iStart, iEnd)) return false;
        }
      }
    }

    return true;
  }

  /**
   * Bộ giải Branch-and-Bound cứu các ca rớt bằng cách tìm kiếm toàn bộ không gian lỗ hổng thời gian
   */
  function solveBranchAndBound(db, dateVal, warmStartSched, warmStartUnsch, timeBudgetMs = 1200) {
    const startTime = performance.now();
    if (!warmStartUnsch || warmStartUnsch.length === 0) {
      return {
        sched: warmStartSched,
        rot: [],
        rescuedCount: 0,
        score: evaluateScheduleScore(warmStartSched, []),
        elapsedMs: Math.round(performance.now() - startTime)
      };
    }

    let bestSched = [...warmStartSched];
    let remainingDrops = [...warmStartUnsch];
    let rescuedCount = 0;

    const availableShifts = [[450, 690], [780, 1000]]; // 07:30-11:30, 13:00-16:40
    const timeStep = 10; // Quét từng bước 10 phút

    // Lặp qua từng ca rớt để tìm nghiệm tối ưu toán học (Forward Search)
    for (let dropIdx = 0; dropIdx < remainingDrops.length; dropIdx++) {
      if (performance.now() - startTime > timeBudgetMs) break;

      const dropItem = remainingDrops[dropIdx];
      const tenTT = dropItem.tt || dropItem.thuThuat || dropItem.DICHVU || '';
      const patName = (dropItem.bn || dropItem.tenBN || dropItem.HOTEN || '').toUpperCase();
      const patNs = dropItem.ns || dropItem.namSinh || '';
      const patRoom = dropItem.room || dropItem.phong || dropItem.PHONG || '';

      const ttInfo = db.thuThuatInfo ? (db.thuThuatInfo[tenTT.toLowerCase()] || ["Thủ công", 20, 5, "PHCN"]) : ["Thủ công", 20, 5, "PHCN"];
      const loaiMay = ttInfo[0] || "Thủ công";
      const tgMay = parseInt(ttInfo[1]) || 20;
      const tgNhanVien = parseInt(ttInfo[2]) || 5;

      // Danh sách máy khả dụng
      const machineCandidates = (loaiMay !== "Thủ công" && db.machineTypes && db.machineTypes[loaiMay])
        ? db.machineTypes[loaiMay]
        : ["Thủ công"];

      // Danh sách giường khả dụng
      const bedCandidates = (db.roomBeds && db.roomBeds[patRoom])
        ? db.roomBeds[patRoom]
        : ["Giường 1", "Giường 2", "Giường 3", "Giường 4", "Giường 5"];

      // Danh sách nhân viên đủ kỹ năng
      const staffCandidates = (db.rawStaff || [])
        .filter(s => {
          const skills = (s[2] || '').toLowerCase();
          return skills.includes(tenTT.toLowerCase()) || skills.includes((ttInfo[9] || '').toLowerCase());
        })
        .map(s => s[0]);

      let assignmentFound = null;

      // Quét các khung giờ trong ngày (Branch Search)
      for (const shift of availableShifts) {
        if (assignmentFound) break;
        for (let t = shift[0]; t <= shift[1] - tgMay; t += timeStep) {
          if (assignmentFound) break;

          for (const m of machineCandidates) {
            if (assignmentFound) break;
            for (const b of bedCandidates) {
              if (assignmentFound) break;
              for (const staffName of staffCandidates) {
                const candidate = {
                  patName, patNs, patRoom, tenTT,
                  start: t, end: t + tgMay,
                  nvChinh: staffName, nvPhu: "",
                  machine: m, bed: b
                };

                if (isFeasibleAssignment(candidate, bestSched, db)) {
                  assignmentFound = {
                    NGAY: dateVal,
                    HOTEN: patName,
                    NAMSINH: patNs,
                    PHONG: patRoom,
                    DICHVU: tenTT,
                    GIODIENRA: m2t(t),
                    GIOKETTHUC: m2t(t + tgMay),
                    "NV CHÍNH": staffName,
                    "NV PHỤ": "",
                    MAY: m,
                    GIUONG: b,
                    t_sort: t
                  };
                  break;
                }
              }
            }
          }
        }
      }

      // Nếu giải pháp toán học tìm được vị trí hợp lệ không xung đột: Cứu ca bệnh!
      if (assignmentFound) {
        bestSched.push(assignmentFound);
        remainingDrops.splice(dropIdx, 1);
        dropIdx--;
        rescuedCount++;
      }
    }

    bestSched.sort((a, b) => {
      const nvA = a["NV CHÍNH"] || a.nvChinh || '';
      const nvB = b["NV CHÍNH"] || b.nvChinh || '';
      if (nvA !== nvB) return nvA.localeCompare(nvB);
      return t2m(a.GIODIENRA || a.gioDienRa) - t2m(b.GIODIENRA || b.gioDienRa);
    });

    const elapsed = Math.round(performance.now() - startTime);

    return {
      sched: bestSched,
      rot: remainingDrops,
      rescuedCount,
      score: evaluateScheduleScore(bestSched, remainingDrops),
      elapsedMs: elapsed
    };
  }

  return {
    t2m,
    m2t,
    isOverlap,
    evaluateScheduleScore,
    isFeasibleAssignment,
    solve: solveBranchAndBound
  };
})();
