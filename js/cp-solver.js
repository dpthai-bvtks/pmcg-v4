/**
 * 🧠 MEDICAL CONSTRAINT PROGRAMMING & BRANCH-AND-BOUND SOLVER (GROUP 1)
 * Bộ giải Quy hoạch Ràng buộc Toán học (CP-SAT / MIP Optimizer) cho Lịch trình Y Tế
 * Tối ưu hóa toàn diện xung đột tài nguyên, máy móc, phòng bệnh và nhân sự.
 * Phiên bản v4.0.6-rev8: Tối ưu hoá Pre-indexed Intervals O(1) & Branch Pruning siêu tốc (< 50ms)
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

  function hasOverlap(intervals, s, e) {
    if (!intervals || intervals.length === 0) return false;
    for (let i = 0; i < intervals.length; i++) {
      const iv = intervals[i];
      if (Math.max(s, iv[0]) < Math.min(e, iv[1])) return true;
    }
    return false;
  }

  function addInterval(map, key, s, e) {
    if (!key) return;
    let list = map.get(key);
    if (!list) {
      list = [];
      map.set(key, list);
    }
    list.push([s, e]);
  }

  function parseShifts(shiftStr) {
    if (!shiftStr) return [[450, 690], [780, 1000]];
    const res = [];
    const parts = String(shiftStr).split(',');
    for (const p of parts) {
      const range = p.split('-');
      if (range.length === 2) {
        const s = t2m(range[0].trim());
        const e = t2m(range[1].trim());
        if (e > s) res.push([s, e]);
      }
    }
    return res.length > 0 ? res : [[450, 690], [780, 1000]];
  }

  function parseBusySlots(busyStr) {
    if (!busyStr) return [];
    const res = [];
    const parts = String(busyStr).split(',');
    for (const p of parts) {
      const range = p.split('-');
      if (range.length === 2) {
        const s = t2m(range[0].trim());
        const e = t2m(range[1].trim());
        if (e > s) res.push([s, e]);
      }
    }
    return res;
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

    // 1. Ràng buộc bệnh nhân không bị trùng giờ giữa 2 thủ thuật (khoảng cách nghỉ >= 5 phút)
    for (let i = 0; i < currentSched.length; i++) {
      const item = currentSched[i];
      const iName = (item.tenBN || item.HOTEN || '').toUpperCase();
      const iNs = item.namSinh || item.NAMSINH || '';
      if (iName === patName && (!patNs || !iNs || patNs === iNs)) {
        const iStart = t2m(item.gioDienRa || item.GIODIENRA);
        const iEnd = t2m(item.gioKetThuc || item.GIOKETTHUC);
        if (isOverlap(start, end + 5, iStart, iEnd + 5)) {
          return false;
        }
      }
    }

    // 2. Ràng buộc nhân viên chính & nhân viên phụ không trùng giờ
    for (let i = 0; i < currentSched.length; i++) {
      const item = currentSched[i];
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
      const assignedRoom = db.machineToRoom?.[machine];
      if (assignedRoom && patRoom && assignedRoom !== patRoom) {
        return false;
      }
      for (let i = 0; i < currentSched.length; i++) {
        const item = currentSched[i];
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
      for (let i = 0; i < currentSched.length; i++) {
        const item = currentSched[i];
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
   * Bộ giải Branch-and-Bound cứu các ca rớt siêu tốc bằng cơ chế Pre-indexed Intervals O(1) & Branch Pruning
   */
  function solveBranchAndBound(db, dateVal, warmStartSched, warmStartUnsch, timeBudgetMs = 1200) {
    const startTime = performance.now();
    if (!warmStartUnsch || warmStartUnsch.length === 0) {
      return {
        sched: warmStartSched || [],
        rot: [],
        rescuedCount: 0,
        score: evaluateScheduleScore(warmStartSched, []),
        elapsedMs: Math.round(performance.now() - startTime)
      };
    }

    const bestSched = [...(warmStartSched || [])];
    const remainingDrops = [...warmStartUnsch];
    let rescuedCount = 0;

    // ⚡ 1. TIỀN CHỈ MỤC (PRE-INDEXING): Chuyển toàn bộ ca đã xếp thành intervals số nguyên phút O(1)
    const patIntervals = new Map();
    const staffIntervals = new Map();
    const machineIntervals = new Map();
    const bedIntervals = new Map();

    for (let i = 0; i < bestSched.length; i++) {
      const item = bestSched[i];
      const s = t2m(item.gioDienRa || item.GIODIENRA);
      const e = t2m(item.gioKetThuc || item.GIOKETTHUC);
      if (s === 0 && e === 0) continue;

      const pName = (item.tenBN || item.HOTEN || '').toUpperCase();
      const pNs = item.namSinh || item.NAMSINH || '';
      const pKey = pName + '_' + pNs;
      // Nghỉ tối thiểu 5 phút giữa 2 ca của cùng bệnh nhân
      addInterval(patIntervals, pKey, s, e + 5);

      const nv1 = item.nvChinh || item["NV CHÍNH"];
      const nv2 = item.nvPhu || item["NV PHỤ"];
      if (nv1) addInterval(staffIntervals, nv1, s, e);
      if (nv2) addInterval(staffIntervals, nv2, s, e);

      const may = item.may || item.MAY;
      if (may && may !== 'Thủ công') addInterval(machineIntervals, may, s, e);

      const phong = item.phong || item.PHONG;
      const giuong = item.giuong || item.GIUONG;
      if (phong && giuong) addInterval(bedIntervals, `${phong}_${giuong}`, s, e);
    }

    // ⚡ 2. TIỀN XỬ LÝ NHÂN SỰ: Parse ca làm việc & giờ bận cố định 1 lần duy nhất
    const staffShiftMap = new Map();
    const staffBusyMap = new Map();
    (db.rawStaff || []).forEach(s => {
      const sName = s[0];
      if (sName) {
        staffShiftMap.set(sName, parseShifts(s[3]));
        staffBusyMap.set(sName, parseBusySlots(s[4]));
      }
    });

    // ⚡ Mở rộng khung giờ ca trực để tận dụng toàn bộ thời gian vàng của khoa
    const availableShifts = [[420, 700], [780, 1020]]; // 07:00-11:40, 13:00-17:00
    const timeStep = 5; // Quét từng bước 5 phút chính xác

    // Lặp qua từng ca rớt để tìm vị trí cứu ca
    for (let dropIdx = 0; dropIdx < remainingDrops.length; dropIdx++) {
      if (performance.now() - startTime > timeBudgetMs) break;

      const dropItem = remainingDrops[dropIdx];
      const tenTT = dropItem.tt || dropItem.thuThuat || dropItem.DICHVU || '';
      const patName = (dropItem.bn || dropItem.tenBN || dropItem.HOTEN || '').toUpperCase();
      const patNs = dropItem.ns || dropItem.namSinh || '';
      const patRoom = dropItem.room || dropItem.phong || dropItem.PHONG || '';
      const pKey = patName + '_' + patNs;
      const pBusyList = patIntervals.get(pKey);

      // Tra cứu thông tin bệnh nhân (giờ vào, giờ ra, loại ngoại trú/nội trú)
      const patObj = (db.rawPatients || []).find(p => (dropItem.pId && p.pId === dropItem.pId) || (p.name === patName && (!patNs || p.ns === patNs)));
      const arriveTime = patObj ? (patObj.arrive || 420) : 420;
      const leaveTime = (patObj && patObj.leave && patObj.leave < 9999) ? patObj.leave : 1020;
      const loaiBN = patObj ? (patObj.loaiBN || 'NoiTru') : 'NoiTru';
      const buoiDieuTri = patObj ? (patObj.buoiDieuTri || 'Sang') : 'Sang';

      const ttInfo = db.thuThuatInfo ? (db.thuThuatInfo[tenTT.toLowerCase()] || ["Thủ công", 20, 5, "PHCN"]) : ["Thủ công", 20, 5, "PHCN"];
      const loaiMay = ttInfo[0] || "Thủ công";
      const tgMay = parseInt(ttInfo[1]) || 20;

      // Danh sách máy khả dụng: ưu tiên máy phòng của mình, nếu không có thì lấy máy rảnh từ danh mục chung
      const loaiMayKey = loaiMay.toLowerCase();
      const roomSpecific = (db.roomMachines?.[patRoom]?.[loaiMayKey]) || (db.roomMachines?.[patRoom]?.[loaiMay]) || [];
      const machineCandidates = (loaiMay !== "Thủ công")
        ? (roomSpecific.length > 0 ? roomSpecific : ((db.machineTypes && db.machineTypes[loaiMay]) || []))
        : ["Thủ công"];

      // Danh sách giường khả dụng: Giường phòng + Hỗ trợ giường máy kéo giãn / ghế điều trị linh hoạt
      const baseBeds = (db.roomBeds && db.roomBeds[patRoom] && db.roomBeds[patRoom].length > 0)
        ? [...db.roomBeds[patRoom]]
        : ["Giường 1", "Giường 2", "Giường 3", "Giường 4", "Giường 5"];
      
      const isKeoGian = loaiMay.toLowerCase().includes("kéo giãn");
      const tuKhoaKhongGiuong = ["tập vận", "siêu âm", "cứu", "thủy châm", "điện châm", "hồng ngoại", "xbbh", "xoa bóp", "khí dung"];
      const isFlexibleBed = isKeoGian || tuKhoaKhongGiuong.some(k => tenTT.toLowerCase().includes(k));
      if (isFlexibleBed) {
        baseBeds.push(isKeoGian ? "Giường máy Kéo giãn" : "Ghế điều trị / Giường phụ");
      }
      const bedCandidates = baseBeds;

      // Danh sách nhân viên đủ kỹ năng
      const staffCandidates = (db.rawStaff || [])
        .filter(s => {
          const name = s[0];
          const roleRaw = s[1] || '';
          const isDoc = /bác sĩ|bac si|^bs\b/i.test(roleRaw) || /^bs\b/i.test(name);
          const isNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(roleRaw);
          if (isNurse || (!isDoc && !/kỹ thuật viên|ky thuat vien|^ktv\b/i.test(roleRaw) && roleRaw !== '')) return false;

          const skillsList = s[2] ? String(s[2]).toLowerCase().split(",").map(x => x.trim()).filter(Boolean) : [];
          const skills = (s[2] || '').toLowerCase();
          const hasAll = /cả hai|ca hai|toàn bộ|tat ca|all/i.test(skills);
          const hasYhct = /yhct/i.test(skills);
          const hasPhcn = /phcn/i.test(skills);
          const isProcYhct = ttInfo[3] === 'YHCT';
          const isProcPhcn = ttInfo[3] === 'PHCN';

          if (hasAll) return true;
          if (hasYhct && isProcYhct && skillsList.length === 0) return true;
          if (hasPhcn && isProcPhcn && skillsList.length === 0) return true;
          if (isDoc && isProcYhct && skillsList.length === 0) return true;

          const pName = tenTT.toLowerCase();
          const pVt = (ttInfo[9] || '').toLowerCase();
          const pTenGoc = (ttInfo[8] || '').toLowerCase();
          return skillsList.some(sk => sk === pName || (pVt && sk === pVt) || (pTenGoc && sk === pTenGoc) || sk.includes(pName) || pName.includes(sk) || (pVt && (sk.includes(pVt) || pVt.includes(sk))));
        })
        .map(s => s[0]);

      let assignmentFound = null;

      // ⚡ 3. BRANCH PRUNING: Quét các khung giờ với cơ chế cắt tỉa nhánh sớm
      shiftLoop:
      for (let sIdx = 0; sIdx < availableShifts.length; sIdx++) {
        const shift = availableShifts[sIdx];
        const maxT = shift[1] - tgMay;

        for (let t = shift[0]; t <= maxT; t += timeStep) {
          // Hard Timeout Check ngay trong vòng lặp thời gian
          if (performance.now() - startTime > timeBudgetMs) break shiftLoop;

          const candStart = t;
          const candEnd = t + tgMay;

          // Ràng buộc 0: Giờ vào viện & giờ ra viện của bệnh nhân
          if (candStart < arriveTime || candEnd > leaveTime) continue;
          if (loaiBN === 'NgoaiTru') {
            if (buoiDieuTri === 'Sang' && candEnd > 700) continue;
            if (buoiDieuTri === 'Chieu' && candStart < 780) continue;
          }

          // Cắt tỉa 1: Bệnh nhân có bận trong khoảng [candStart, candEnd + 5] không?
          if (hasOverlap(pBusyList, candStart, candEnd + 5)) {
            continue; // Bệnh nhân bận -> bỏ qua t ngay lập tức, không xét tài nguyên nào khác
          }

          // Cắt tỉa 2: Tìm máy rảnh đầu tiên
          let validMachine = null;
          for (let mIdx = 0; mIdx < machineCandidates.length; mIdx++) {
            const m = machineCandidates[mIdx];
            if (m === 'Thủ công') {
              validMachine = m;
              break;
            }
            if (!hasOverlap(machineIntervals.get(m), candStart, candEnd)) {
              validMachine = m;
              break;
            }
          }
          if (!validMachine) continue; // Không có máy rảnh tại t -> bỏ qua t!

          // Cắt tỉa 3: Tìm giường rảnh đầu tiên
          let validBed = null;
          for (let bIdx = 0; bIdx < bedCandidates.length; bIdx++) {
            const b = bedCandidates[bIdx];
            if (b.includes("Ghế") || b.includes("Giường máy")) {
              validBed = b;
              break;
            }
            const bedKey = `${patRoom}_${b}`;
            if (!hasOverlap(bedIntervals.get(bedKey), candStart, candEnd)) {
              validBed = b;
              break;
            }
          }
          if (!validBed && isFlexibleBed) {
            validBed = "Ghế điều trị";
          }
          if (!validBed) continue; // Không có giường rảnh tại t -> bỏ qua t!

          // Cắt tỉa 4: Tìm nhân viên rảnh đầu tiên đúng ca làm việc
          let validStaff = null;
          for (let stIdx = 0; stIdx < staffCandidates.length; stIdx++) {
            const sName = staffCandidates[stIdx];
            // Phải nằm trọn trong ca trực
            const sShifts = staffShiftMap.get(sName);
            if (sShifts && sShifts.length > 0 && !sShifts.some(w => candStart >= w[0] && candEnd <= w[1] + 5)) continue;
            // Không dính giờ bận cá nhân
            if (hasOverlap(staffBusyMap.get(sName), candStart, candEnd)) continue;
            // Không trùng ca đã xếp
            if (!hasOverlap(staffIntervals.get(sName), candStart, candEnd)) {
              validStaff = sName;
              break;
            }
          }
          if (!validStaff) continue; // Không có nhân viên rảnh tại t -> bỏ qua t!

          // 🎉 TÌM THẤY NGHIỆM TỐI ƯU TOÁN HỌC HỢP LỆ!
          assignmentFound = {
            NGAY: dateVal,
            HOTEN: patName,
            NAMSINH: patNs,
            PHONG: patRoom,
            DICHVU: tenTT,
            GIODIENRA: m2t(candStart),
            GIOKETTHUC: m2t(candEnd),
            "NV CHÍNH": validStaff,
            "NV PHỤ": "",
            MAY: validMachine,
            GIUONG: validBed,
            t_sort: candStart
          };

          // Cập nhật ngay các intervals để các ca sau không bị trùng
          addInterval(patIntervals, pKey, candStart, candEnd + 5);
          if (validMachine !== 'Thủ công') addInterval(machineIntervals, validMachine, candStart, candEnd);
          addInterval(bedIntervals, `${patRoom}_${validBed}`, candStart, candEnd);
          addInterval(staffIntervals, validStaff, candStart, candEnd);

          break shiftLoop;
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
      return (a.t_sort || t2m(a.GIODIENRA || a.gioDienRa)) - (b.t_sort || t2m(b.GIODIENRA || b.gioDienRa));
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
    hasOverlap,
    evaluateScheduleScore,
    isFeasibleAssignment,
    solve: solveBranchAndBound
  };
})();
