/**
 * 🧠 MEDICAL CONSTRAINT PROGRAMMING & BRANCH-AND-BOUND SOLVER (GROUP 1)
 * Bộ giải Quy hoạch Ràng buộc Toán học (CP-SAT / MIP Optimizer) cho Lịch trình Y Tế
 * Tối ưu hóa toàn diện xung đột tài nguyên, máy móc, phòng bệnh và nhân sự.
 * Phiên bản v4.0.6-rev8: Tối ưu hoá Pre-indexed Intervals O(1) & Branch Pruning siêu tốc (< 50ms)
 */

(function () {
  'use strict';
  const globalScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

  globalScope.MedicalCPSolver = (function () {

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

  function isContinuousProcedureLocal(info, dur) {
    const globalSE = typeof window !== 'undefined' ? window.SchedulerEngine : (typeof globalThis !== 'undefined' ? globalThis.SchedulerEngine : null);
    if (globalSE && typeof globalSE.isContinuousProcedure === 'function') {
      return globalSE.isContinuousProcedure(info, dur);
    }
    if (!info) return false;
    if (info[13] === 1 || info[13] === '1' || info[13] === 'Có' || info[13] === true) return true;
    if (info[13] === 0 || info[13] === '0' || info[13] === 'Không' || info[13] === false) return false;
    const tgNv = parseInt(info[2]) || 5;
    const baseTgMay = parseInt(info[1]) || 15;
    if (dur && tgNv >= dur) return true;
    if (String(info[0]).trim() === 'Thủ công' && tgNv >= baseTgMay) return true;
    return false;
  }

  function getStaffIntervalsLocal(start, end, ttInfo) {
    const isCont = isContinuousProcedureLocal(ttInfo, end - start);
    const gapMinutes = (ttInfo && ttInfo[12] !== undefined && ttInfo[12] > 0) ? ttInfo[12] : 1;
    if (isCont) return [[start, end + gapMinutes]];
    const tgNv = ttInfo ? (parseInt(ttInfo[2]) || 5) : 5;
    const staffEnd = Math.min(start + tgNv, end);
    const intervals = [[start, staffEnd + gapMinutes]];
    if (end > staffEnd) {
      intervals.push([end - 1, end + gapMinutes]);
    }
    return intervals;
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

    // 2. Ràng buộc nhân viên chính & nhân viên phụ không trùng giờ (tính theo pha thao tác và rút kim)
    const candTT = (tenTT || '').toLowerCase();
    const candTtInfo = db?.thuThuatInfo ? (db.thuThuatInfo[candTT] || null) : null;
    const candIntervals = getStaffIntervalsLocal(start, end, candTtInfo);

    for (let i = 0; i < currentSched.length; i++) {
      const item = currentSched[i];
      const iNv1 = item.nvChinh || item["NV CHÍNH"];
      const iNv2 = item.nvPhu || item["NV PHỤ"];
      const hasSharedStaff = (nvChinh && (nvChinh === iNv1 || nvChinh === iNv2)) || (nvPhu && (nvPhu === iNv1 || nvPhu === iNv2));
      if (hasSharedStaff) {
        const iStart = t2m(item.gioDienRa || item.GIODIENRA);
        const iEnd = t2m(item.gioKetThuc || item.GIOKETTHUC);
        const iTT = (item.thuThuat || item.DICHVU || '').toLowerCase();
        const iTtInfo = db?.thuThuatInfo ? (db.thuThuatInfo[iTT] || null) : null;
        const iIntervals = getStaffIntervalsLocal(iStart, iEnd, iTtInfo);

        for (const [s1, e1] of candIntervals) {
          for (const [s2, e2] of iIntervals) {
            if (isOverlap(s1, e1, s2, e2)) return false;
          }
        }
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
  function solveBranchAndBound(db, dateVal, warmStartSched, warmStartUnsch, timeBudgetMs = 1200, existingSched = []) {
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

    const cleanStaffStr = (typeof window !== 'undefined' && window.SchedulerEngine && typeof window.SchedulerEngine.cleanStaffStr === 'function')
      ? window.SchedulerEngine.cleanStaffStr
      : (typeof window !== 'undefined' && typeof window.cleanStaffStr === 'function')
        ? window.cleanStaffStr
        : (s => String(s || '').normalize('NFC').replace(/^(bs|bac si|bác sĩ|ktv|dd|đd)\s*\.?\s*/i, '').trim().toLowerCase());

    // 🔒 KHÓA CỨNG TOÀN BỘ LỊCH TRÌNH ĐÃ XẾP TRƯỚC ĐÓ (existingSched) TRÁNH XẾP BỔ SUNG TRÙNG GIỜ
    const normalizeFn = (typeof window !== 'undefined' && window.SchedulerEngine && typeof window.SchedulerEngine.normalizeScheduleItem === 'function')
      ? window.SchedulerEngine.normalizeScheduleItem
      : (r) => {
        if (!r) return null;
        if (Array.isArray(r)) return { tenBN: r[1], namSinh: r[2], phong: r[3], thuThuat: r[4], gioDienRa: r[5], gioKetThuc: r[6], nvChinh: r[7], nvPhu: r[8], may: r[9], giuong: r[10] };
        return {
          tenBN: r.tenBN || r.HOTEN || r.patient_name || '',
          namSinh: r.namSinh || r.NAMSINH || r.dob || '',
          phong: r.phong || r.PHONG || r.room || '',
          thuThuat: r.thuThuat || r.DICHVU || r.procedure_name || '',
          gioDienRa: r.gioDienRa || r.GIODIENRA || r.start_time || '',
          gioKetThuc: r.gioKetThuc || r.GIOKETTHUC || r.end_time || '',
          nvChinh: r.nvChinh || r['NV CHÍNH'] || r.staff_name || '',
          nvPhu: r.nvPhu || r['NV PHỤ'] || r.sub_staff_name || '',
          may: r.may || r.MAY || r.machine_name || '',
          giuong: r.giuong || r.GIUONG || r.bed || ''
        };
      };

    const isContFn = isContinuousProcedureLocal;

    const preSchedList = (Array.isArray(existingSched) ? existingSched : [])
      .map(normalizeFn)
      .filter(r => r && r.gioDienRa && r.gioDienRa !== '--' && r.gioDienRa !== '❌ Rớt' && !r.__dropped);

    for (let i = 0; i < preSchedList.length; i++) {
      const item = preSchedList[i];
      if (!item) continue;
      const s = t2m(item.gioDienRa);
      const e = t2m(item.gioKetThuc);
      if (isNaN(s) || isNaN(e) || e <= s) continue;

      const pName = String(item.tenBN || '').toUpperCase().trim();
      const pNs = String(item.namSinh || '').trim();
      if (pName) {
        addInterval(patIntervals, pName + '_' + pNs, s, e + 5);
        if (pNs.length >= 2) {
          addInterval(patIntervals, pName + '_' + pNs.slice(-2), s, e + 5);
        }
        addInterval(patIntervals, pName, s, e + 5);
      }

      const tenTT = String(item.thuThuat || '').trim().toLowerCase();
      const ttInfo = db.thuThuatInfo ? db.thuThuatInfo[tenTT] : null;
      const isContinuous = isContFn(ttInfo, e - s);
      const tgNv = isContinuous ? (e - s) : (ttInfo ? (parseInt(ttInfo[2]) || 5) : 5);
      const gapMinutes = (ttInfo && ttInfo[12] !== undefined && ttInfo[12] > 0) ? ttInfo[12] : 1;
      const staffEnd = isContinuous ? (e + gapMinutes) : (Math.min(s + tgNv, e) + gapMinutes);
      const hasTeardown = !isContinuous && ((e - s) > tgNv);

      const addStaffIntervals = (nv) => {
        if (!nv) return;
        addInterval(staffIntervals, nv, s, staffEnd);
        if (hasTeardown) addInterval(staffIntervals, nv, e - 1, e + gapMinutes);
        const cleanNv = cleanStaffStr(nv);
        (db.rawStaff || []).forEach(st => {
          if (cleanStaffStr(st[0]) === cleanNv) {
            addInterval(staffIntervals, st[0], s, staffEnd);
            if (hasTeardown) addInterval(staffIntervals, st[0], e - 1, e + gapMinutes);
          }
        });
      };

      addStaffIntervals(item.nvChinh);
      addStaffIntervals(item.nvPhu);

      const may = item.may;
      if (may && may !== 'Thủ công') {
        addInterval(machineIntervals, may, s, e);
        const cleanMay = String(may).toLowerCase().replace(/\s+/g, '');
        for (const mType in (db.machineTypes || {})) {
          (db.machineTypes[mType] || []).forEach(mCode => {
            if (mCode.toLowerCase().replace(/\s+/g, '') === cleanMay) {
              addInterval(machineIntervals, mCode, s, e);
            }
          });
        }
      }

      const phong = item.phong;
      const giuong = item.giuong;
      if (phong && giuong) {
        addInterval(bedIntervals, `${phong}_${giuong}`, s, e);
        // Đồng bộ fuzzy room/bed
        const pClean = String(phong).toLowerCase().replace(/\s+/g, '');
        const gClean = String(giuong).toLowerCase().replace(/\s+/g, '');
        for (const r in (db.roomBeds || {})) {
          if (r.toLowerCase().replace(/\s+/g, '') === pClean) {
            (db.roomBeds[r] || []).forEach(b => {
              if (b.toLowerCase().replace(/\s+/g, '') === gClean || b.toLowerCase().replace(/\s+/g, '').replace(/^giuong|^g/i, '') === gClean.replace(/^giuong|^g/i, '')) {
                addInterval(bedIntervals, `${r}_${b}`, s, e);
              }
            });
          }
        }
      }
    }

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

      const tenTT = String(item.thuThuat || item.DICHVU || '').trim().toLowerCase();
      const ttInfo = db.thuThuatInfo ? db.thuThuatInfo[tenTT] : null;
      const sIntervals = getStaffIntervalsLocal(s, e, ttInfo);

      const nv1 = item.nvChinh || item["NV CHÍNH"];
      const nv2 = item.nvPhu || item["NV PHỤ"];
      if (nv1) {
        for (const [stS, stE] of sIntervals) addInterval(staffIntervals, nv1, stS, stE);
      }
      if (nv2) {
        for (const [stS, stE] of sIntervals) addInterval(staffIntervals, nv2, stS, stE);
      }

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

    // ⚡ Khung giờ ca trực chuẩn hóa theo ca làm việc của khoa (bắt đầu từ 07:30)
    const isProcYhctGlobal = (tt) => {
      const info = db.thuThuatInfo ? (db.thuThuatInfo[String(tt).toLowerCase()] || []) : [];
      return String(info[3] || '').trim().toUpperCase() === 'YHCT';
    };
    const yhctLunchMins = Math.max(0, parseInt(db.settings?.yhctLunch ?? 0) || 0);
    const yhctEndMins = Math.max(0, parseInt(db.settings?.yhctEnd ?? 0) || 0);
    const morningShiftEnd = 690 + yhctLunchMins;
    const afternoonShiftEnd = 990 + yhctEndMins;
    const availableShifts = [[450, morningShiftEnd], [780, afternoonShiftEnd]];
    const timeStep = 5; // Quét từng bước 5 phút chính xác

    // Lặp qua từng ca rớt để tìm vị trí cứu ca
    for (let dropIdx = 0; dropIdx < remainingDrops.length; dropIdx++) {
      if (performance.now() - startTime > timeBudgetMs) break;

      const dropItem = remainingDrops[dropIdx];
      const tenTT = dropItem.tt || dropItem.thuThuat || dropItem.DICHVU || '';
      const patName = (dropItem.bn || dropItem.tenBN || dropItem.HOTEN || '').toUpperCase();
      const patNs = dropItem.ns || dropItem.namSinh || '';
      let patRoom = dropItem.room || dropItem.phong || dropItem.PHONG || '';
      if (!patRoom || !(db.roomBeds && db.roomBeds[patRoom])) {
        const availRooms = Object.keys(db.roomBeds || {});
        if (availRooms.length > 0) patRoom = availRooms[0];
      }
      const pKey = patName + '_' + patNs;
      const pBusyList = patIntervals.get(pKey);

      // Tra cứu thông tin bệnh nhân (giờ vào, giờ ra, loại ngoại trú/nội trú)
      const patObj = (db.rawPatients || []).find(p => (dropItem.pId && p.pId === dropItem.pId) || (p.name === patName && (!patNs || p.ns === patNs)));
      const arriveTime = patObj ? Math.max(450, patObj.arrive || 450) : 450;
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
          const isYHCT = isProcYhctGlobal(tenTT);
          if (candStart < 690 && candEnd > (690 + (isYHCT ? yhctLunchMins : 0))) continue;
          if (candStart >= 690 && candStart < 780) continue;
          if (candEnd > (990 + (isYHCT ? yhctEndMins : 0))) continue;
          if (loaiBN === 'NgoaiTru') {
            if (buoiDieuTri === 'Sang' && candEnd > morningShiftEnd) continue;
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

          const candStaffIntervals = getStaffIntervalsLocal(candStart, candEnd, ttInfo);

          // Cắt tỉa 4: Tìm nhân viên rảnh đầu tiên đúng ca làm việc
          let validStaff = null;
          for (let stIdx = 0; stIdx < staffCandidates.length; stIdx++) {
            const sName = staffCandidates[stIdx];
            // Phải nằm trọn trong ca trực
            const sShifts = staffShiftMap.get(sName);
            if (sShifts && sShifts.length > 0) {
              const inShift = candStaffIntervals.every(([ivS, ivE]) => {
                return sShifts.some(w => {
                  const shiftEnd = w[1] + (isYHCT ? (w[0] < 780 ? yhctLunchMins : yhctEndMins) : 0);
                  return ivS >= w[0] && ivE <= shiftEnd;
                });
              });
              if (!inShift) continue;
            }
            // Không dính giờ bận cá nhân
            const sBusy = staffBusyMap.get(sName);
            if (candStaffIntervals.some(([ivS, ivE]) => hasOverlap(sBusy, ivS, ivE))) continue;

            // Không trùng ca đã xếp
            const sIntervals = staffIntervals.get(sName);
            if (candStaffIntervals.some(([ivS, ivE]) => hasOverlap(sIntervals, ivS, ivE))) continue;

            validStaff = sName;
            break;
          }
          if (!validStaff) continue; // Bắt buộc phải có nhân sự chính hợp lệ rảnh tại thời điểm t!

          // Phân công KTV/Điều dưỡng phụ nếu thủ thuật yêu cầu
          let validSubStaff = "";
          const canPhu = ttInfo[5];
          if (canPhu === 1) {
            // Lọc danh sách nhân sự phụ thực tế (ưu tiên Điều dưỡng / Hộ lý / Phụ)
            const subPool = (db.rawStaff || [])
              .map(s => ({ name: s[0], role: s[1] || '' }))
              .filter(s => s.name && s.name !== validStaff)
              .sort((a, b) => {
                const aIsNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly|phụ/i.test(a.role) || /^phụ\b/i.test(a.name);
                const bIsNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly|phụ/i.test(b.role) || /^phụ\b/i.test(b.name);
                if (aIsNurse !== bIsNurse) return bIsNurse - aIsNurse;
                return 0;
              })
              .map(s => s.name);

            for (let subIdx = 0; subIdx < subPool.length; subIdx++) {
              const subName = subPool[subIdx];
              const subShifts = staffShiftMap.get(subName);
              if (subShifts && subShifts.length > 0) {
                const inShift = candStaffIntervals.every(([ivS, ivE]) => {
                  return subShifts.some(w => {
                    const shiftEnd = w[1] + (isYHCT ? (w[0] < 780 ? yhctLunchMins : yhctEndMins) : 0);
                    return ivS >= w[0] && ivE <= shiftEnd;
                  });
                });
                if (!inShift) continue;
              }
              const subBusy = staffBusyMap.get(subName);
              if (candStaffIntervals.some(([ivS, ivE]) => hasOverlap(subBusy, ivS, ivE))) continue;

              const subIntervals = staffIntervals.get(subName);
              if (candStaffIntervals.some(([ivS, ivE]) => hasOverlap(subIntervals, ivS, ivE))) continue;

              validSubStaff = subName;
              break;
            }
            if (!validSubStaff) continue; // Bắt buộc phải có nhân sự phụ thực tế rảnh (Phương án 1)
          }

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
            "NV PHỤ": validSubStaff,
            MAY: validMachine,
            GIUONG: validBed,
            t_sort: candStart
          };

          // Cập nhật ngay các intervals để các ca sau không bị trùng
          addInterval(patIntervals, pKey, candStart, candEnd + 5);
          if (validMachine !== 'Thủ công') addInterval(machineIntervals, validMachine, candStart, candEnd);
          addInterval(bedIntervals, `${patRoom}_${validBed}`, candStart, candEnd);
          for (const [ivS, ivE] of candStaffIntervals) {
            addInterval(staffIntervals, validStaff, ivS, ivE);
            if (validSubStaff) {
              addInterval(staffIntervals, validSubStaff, ivS, ivE);
            }
          }

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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = globalScope.MedicalCPSolver;
  }
})();
