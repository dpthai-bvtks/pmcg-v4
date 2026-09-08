/**
 * TURBO SCHEDULER ENGINE CHO V3-CLOUDFLARE
 * Tích hợp 100% Thuật toán Simulated Annealing & Multi-pass Backfill từ V2
 * Tự động chạy trên Client Browser trong 0.1s - 0.2s hoặc làm Fallback hoàn hảo
 */

window.SchedulerEngine = (function () {
  'use strict';

// ============================================================
// 🧠 SCHEDULING CORE OPTIMIZATION ENGINE (SIMULATED ANNEALING)
// ============================================================
function t2m(thoiGian) {
  if (!thoiGian && thoiGian !== 0) return 0;
  if (thoiGian instanceof Date) {
    if (isNaN(thoiGian.getTime())) return 0;
    return thoiGian.getUTCHours() * 60 + thoiGian.getUTCMinutes();
  }
  const str = String(thoiGian).trim();
  if (!str || str === '0') return 0;
  if (!isNaN(str) && parseFloat(str) > 0 && parseFloat(str) <= 1) return Math.round(parseFloat(str) * 1440);
  if (!str.includes(":")) return 0;
  const parts = str.split(":");
  const gio = parseInt(parts[0].split(" ").pop(), 10);
  const phut = parseInt(parts[1], 10);
  return (isNaN(gio) ? 0 : gio) * 60 + (isNaN(phut) ? 0 : phut);
}

function isEmptyTime(val) {
  if (!val || val === '' || val === '0' || val === 0) return true;
  if (val instanceof Date && isNaN(val.getTime())) return true;
  return t2m(val) === 0;
}

function m2t(totalMinutes) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function is_overlap(start1, end1, start2, end2) { return Math.max(start1, start2) < Math.min(end1, end2); }

function createSeededRandom(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

function parseNgayVao(dateStr) {
  if (!dateStr || dateStr === '') return 99999999;
  const parts = String(dateStr).split('/');
  return parts.length === 3 ? parseInt(parts[2]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[0]) : 99999999;
}

function updatePatientCache(patient, thuThuatInfo) {
  patient.max_dur = 0; patient.has_yhct = 0; patient.has_toan_tg = 0;
  patient.leave_pri = patient.leave !== 9999 ? 0 : 1;
  const tuKhoa = ["siêu âm", "xoa bóp", "tập vận", "xbbh", "cấy chỉ"];
  for (const ten of patient.pending) {
    const info = thuThuatInfo[ten.toLowerCase()] || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
    if (info[1] > patient.max_dur) patient.max_dur = info[1];
    if (info[3] === "YHCT") patient.has_yhct = -1;
    if (tuKhoa.some(k => ten.toLowerCase().includes(k))) patient.has_toan_tg = -1;
  }
}

function mergeTimeline(timeline) {
  if (!timeline || timeline.length < 2) return timeline || [];
  const sorted = timeline.slice().sort((a, b) => a[0] - b[0]);
  const merged = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i][0] <= last[1]) {
      last[1] = Math.max(last[1], sorted[i][1]);
    } else {
      merged.push([sorted[i][0], sorted[i][1]]);
    }
  }
  return merged;
}

function getNextEvent(tNow, patients, staffTimeline, machineTimeline, endOfDay) {
  let next = endOfDay;
  patients.forEach(p => {
    if (p.pending.length > 0) {
      if (p.free_at > tNow) next = Math.min(next, p.free_at);
      p.busy.forEach(b => { if (b[1] > tNow) next = Math.min(next, b[1]); });
    }
  });
  Object.values(staffTimeline).forEach(tl => tl.forEach(slot => { if (slot[1] > tNow && slot[1] < endOfDay) next = Math.min(next, slot[1]); }));
  Object.values(machineTimeline).forEach(tl => tl.forEach(slot => { if (slot[1] > tNow && slot[1] < endOfDay) next = Math.min(next, slot[1]); }));
  return next <= tNow ? tNow + 1 : next;
}

function blockStaff(staffName, start, end, khoangCach, staffTimeline, staffSetupReady, staffLoad, tenThuThuat, staffLastProc) {
  if (!staffTimeline[staffName]) staffTimeline[staffName] = [];
  staffTimeline[staffName].push([start, end]);
  if (khoangCach > (end - start)) staffTimeline[staffName].push([end, start + khoangCach]);
  staffTimeline[staffName] = mergeTimeline(staffTimeline[staffName]);
  staffSetupReady[staffName] = Math.max(staffSetupReady[staffName] || 0, end);
  if (!staffLoad[staffName]) staffLoad[staffName] = { used_mins: 0, shift_mins: 480, procs_done: {}, busy_mins: 0, skills: [] };
  staffLoad[staffName].used_mins += (end - start);
  staffLoad[staffName].procs_done[tenThuThuat] = (staffLoad[staffName].procs_done[tenThuThuat] || 0) + 1;
  staffLastProc[staffName] = tenThuThuat;
}

function clonePatients(patients) {
  return patients.map(p => ({
    ...p,
    pId: p.pId,
    pending: p.pending ? [...p.pending] : [],
    busy: p.busy ? p.busy.map(b => [b[0], b[1]]) : []
  }));
}

function mutate(rawPatients, randFn, droppedNames) {
  let patients = clonePatients(rawPatients);
  if (droppedNames && droppedNames.size > 0 && randFn() < 0.6) {
    const idx = patients.findIndex(p => droppedNames.has(p.pId || (p.name + '_' + (p.ns || '') + '_' + (p.room || ''))));
    if (idx > 0) { const [p] = patients.splice(idx, 1); patients.unshift(p); return patients; }
  }
  const op = Math.floor(randFn() * 5);
  if (op === 0 && patients.length >= 2) {
    const i = Math.floor(randFn() * patients.length), j = Math.floor(randFn() * patients.length);
    [patients[i], patients[j]] = [patients[j], patients[i]];
  } else if (op === 1) {
    const p = patients[Math.floor(randFn() * patients.length)];
    if (p && p.pending.length >= 2) {
      const i = Math.floor(randFn() * p.pending.length), j = Math.floor(randFn() * p.pending.length);
      [p.pending[i], p.pending[j]] = [p.pending[j], p.pending[i]];
    }
  } else if (op === 2 && patients.length >= 2) {
    const i = Math.floor(randFn() * patients.length);
    const [p] = patients.splice(i, 1);
    patients.unshift(p);
  } else if (op === 3 && patients.length >= 2) {
    const i = Math.floor(randFn() * (patients.length - 1));
    [patients[i], patients[i+1]] = [patients[i+1], patients[i]];
  } else if (op === 4 && patients.length >= 3) {
    const i = Math.floor(randFn() * patients.length);
    const j = Math.floor(randFn() * patients.length);
    const start = Math.min(i, j), end = Math.max(i, j);
    if (end - start >= 2) {
      const segment = patients.slice(start, end + 1).reverse();
      patients.splice(start, segment.length, ...segment);
    }
  }
  return patients;
}

function _turbo_core_logic(db, ngayXep, seedVal, existingSched = [], scenario = 1, crowdedOverride = -1, weights = { drop: 10000, overtime: 2, imbalance: 0.1 }) {
  const rand = createSeededRandom(seedVal);
  const OVERTIME_ALLOWANCE = 5;
  const defaultShift = [[420, 690], [780, 1014]];
  let startOfDay = 420, endOfDay = 1014;
  let isBackfill = false;

  const reservedMachines = new Set();
  if (scenario === 3) {
    Object.values(db.machineTypes).forEach(machines => {
      const reserveCount = Math.max(1, Math.floor(machines.length * 0.2));
      for (let i = 0; i < reserveCount; i++) reservedMachines.add(machines[i]);
    });
  }

  const thuThuatInfo = db.thuThuatInfo;
  Object.keys(thuThuatInfo).forEach(key => {
    const info = thuThuatInfo[key];
    if (info && info.length > 9 && info[9]) thuThuatInfo[info[9].trim().toLowerCase()] = info;
  });

  const machineRarity = {};
  Object.keys(thuThuatInfo).forEach(key => {
    const loaiMay = thuThuatInfo[key][0];
    machineRarity[key] = (loaiMay && loaiMay !== "Thủ công")
      ? ((db.machineTypes[loaiMay] || []).length <= 2 ? 0 : (db.machineTypes[loaiMay] || []).length <= 5 ? 1 : 2)
      : 3;
  });

  const { machineTypes, roomStaff } = db;
  const staffBySkill = {}, staffTimeline = {}, staffShifts = {}, staffLoad = {};
  const staffRole = {}, staffLastProc = {}, staffMyRooms = {}, staffSetupReady = {}, staffCurrentRoom = {};

  db.rawStaff.forEach(r => {
    const tenNhanVien = r[0], kyNangList = r[2] ? String(r[2]).split(",").map(x => x.trim()) : [];
    staffTimeline[tenNhanVien] = []; staffRole[tenNhanVien] = r[1]; staffCurrentRoom[tenNhanVien] = null;

    kyNangList.forEach(kyNang => {
      const kyNangLower = kyNang.toLowerCase();
      if (!staffBySkill[kyNangLower]) staffBySkill[kyNangLower] = [];
      staffBySkill[kyNangLower].push(tenNhanVien);
      if (thuThuatInfo[kyNangLower]?.length > 9 && thuThuatInfo[kyNangLower][9]) {
        const vietTat = thuThuatInfo[kyNangLower][9].trim().toLowerCase();
        if (!staffBySkill[vietTat]) staffBySkill[vietTat] = [];
        if (!staffBySkill[vietTat].includes(tenNhanVien)) staffBySkill[vietTat].push(tenNhanVien);
      }
    });

    const rawShifts = r[3] ? String(r[3]).split(",").filter(s => s.includes("-")).map(s => {
      const pts = s.split("-"); return [t2m(pts[0].trim()), t2m(pts[1].trim())];
    }) : [];
    staffShifts[tenNhanVien] = rawShifts.length > 0 ? rawShifts : defaultShift;

    if (r[4]) {
      String(r[4]).split(",").forEach(slot => {
        if (slot.includes("-")) {
          const tp = slot.includes(")") ? slot.split(")").pop().trim() : slot;
          staffTimeline[tenNhanVien].push([t2m(tp.split("-")[0]), t2m(tp.split("-")[1])]);
        }
      });
    }

    if (staffShifts[tenNhanVien].length > 0) {
      const [caS1, caE1] = staffShifts[tenNhanVien][0];
      if (staffShifts[tenNhanVien].length > 1) {
        const [caS2, caE2] = staffShifts[tenNhanVien][1];
        staffTimeline[tenNhanVien].push([0, caS1], [caE1, caS2], [caE2, 1440]);
      } else {
        staffTimeline[tenNhanVien].push([0, caS1], [caE1, 1440]);
      }
    } else {
      staffTimeline[tenNhanVien].push([0, startOfDay], [endOfDay, 1440]);
    }

    const tongPhutLamViec = staffShifts[tenNhanVien].reduce((acc, ca) => acc + ca[1] - ca[0], 0);
    const tongPhutBan = staffTimeline[tenNhanVien].reduce((acc, slot) => acc + slot[1] - slot[0], 0);
    staffLoad[tenNhanVien] = { used_mins: 0, shift_mins: tongPhutLamViec, procs_done: {}, busy_mins: tongPhutBan, skills: kyNangList };
    staffSetupReady[tenNhanVien] = 0;
    staffMyRooms[tenNhanVien] = Object.keys(roomStaff).filter(room => (roomStaff[room] || []).includes(tenNhanVien));
    staffTimeline[tenNhanVien] = mergeTimeline(staffTimeline[tenNhanVien]);
  });

  let minShiftStart = 1440, maxShiftEnd = 0;
  Object.values(staffShifts).forEach(caList => {
    if (caList.length > 0) {
      minShiftStart = Math.min(minShiftStart, caList[0][0]);
      maxShiftEnd = Math.max(maxShiftEnd, caList[caList.length - 1][1]);
    }
  });
  if (minShiftStart < 1440) startOfDay = minShiftStart;
  if (maxShiftEnd > 0) endOfDay = maxShiftEnd;

  const machineTimeline = { "Thủ công": [] };
  for (const loaiMay in machineTypes) (machineTypes[loaiMay] || []).forEach(may => { machineTimeline[may] = []; });

  const bedTracker = {};
  for (const phong in db.roomBeds) {
    bedTracker[phong] = {};
    (db.roomBeds[phong] || []).forEach(giuong => { bedTracker[phong][giuong] = []; });
  }

  let patients = db.rawPatients.map(p => ({ ...p, pId: p.pId, pending: [...p.pending], failed: false, busy: p.busy ? p.busy.map(b => [...b]) : [], loaiBN: p.loaiBN, buoiDieuTri: p.buoiDieuTri }));

  existingSched.forEach(row => {
    const gioDienRaStr = String(row[5] || row.GIODIENRA || row.gioDienRa || '');
    if (gioDienRaStr === '❌ Rớt' || gioDienRaStr === '--') return;

    const gioStart = t2m(row[5] || row.GIODIENRA || row.gioDienRa), gioEnd = t2m(row[6] || row.GIOKETTHUC || row.gioKetThuc);
    if (isNaN(gioStart) || isNaN(gioEnd)) return;

    const nvChinh = row[7] || row["NV CHÍNH"] || row.nvChinh, nvPhu = row[8] || row["NV PHỤ"] || row.nvPhu;
    const may = row[9] || row.MAY || row.may, phong = row[3] || row.PHONG || row.phong, giuong = row[10] || row.GIUONG || row.giuong;
    const patName = String(row[1] || row.HOTEN || row.tenBN || '').toUpperCase().trim();
    const patNs = String(row[2] || row.NAMSINH || row.namSinh || '').trim();
    
    const tenThuThuat = String(row[4] || row.DICHVU || row.thuThuat || "").trim().toLowerCase();
    const info = thuThuatInfo[tenThuThuat] || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
    const tgNhanVien = info[2];
    const staffEnd = Math.min(gioStart + tgNhanVien, gioEnd);
    const hasTeardown = (gioEnd - gioStart) > tgNhanVien;
    const tearStart = hasTeardown ? gioEnd : null;
    const tearEnd = hasTeardown ? gioEnd + 1 : null;

    const pushAndMerge = (timeline, key, slot) => { if (!timeline[key]) return; timeline[key].push(slot); timeline[key] = mergeTimeline(timeline[key]); };
    
    if (nvChinh && staffTimeline[nvChinh]) { 
      pushAndMerge(staffTimeline, nvChinh, [gioStart, staffEnd]); 
      if (hasTeardown && tearStart !== null) pushAndMerge(staffTimeline, nvChinh, [tearStart, tearEnd]);
      staffCurrentRoom[nvChinh] = phong; 
    }
    if (nvPhu && staffTimeline[nvPhu]) {
      pushAndMerge(staffTimeline, nvPhu, [gioStart, staffEnd]);
      if (hasTeardown && tearStart !== null) pushAndMerge(staffTimeline, nvPhu, [tearStart, tearEnd]);
    }
    if (may && may !== "Thủ công" && machineTimeline[may]) pushAndMerge(machineTimeline, may, [gioStart, gioEnd]);
    if (phong && giuong && bedTracker[phong]?.[giuong]) pushAndMerge(bedTracker[phong], giuong, [gioStart, gioEnd]);

    // 🔒 PATIENT LOCK: Update patient busy timeline and last_room for existing schedule
    if (patName) {
      const patObj = patients.find(p => {
        const pName = String(p.name || '').toUpperCase().trim();
        const pNs = String(p.ns || p.namSinh || '').trim();
        const pRoom = String(p.room || p.phong || '').trim();
        return pName === patName && (!patNs || !pNs || patNs === pNs) && (!phong || !pRoom || phong === pRoom);
      });
      if (patObj) {
        patObj.busy.push([gioStart, gioEnd + 1]);
        patObj.busy = mergeTimeline(patObj.busy);
        if (phong) patObj.last_room = phong;
      }
    }

    // 🔒 STAFF WORKLOAD LOCK: Update staff load minutes and procedure count
    if (nvChinh && staffLoad[nvChinh]) {
      staffLoad[nvChinh].used_mins += (staffEnd - gioStart) + (hasTeardown ? 1 : 0);
      staffLoad[nvChinh].procs_done[tenThuThuat] = (staffLoad[nvChinh].procs_done[tenThuThuat] || 0) + 1;
    }
    if (nvPhu && staffLoad[nvPhu]) {
      staffLoad[nvPhu].used_mins += (staffEnd - gioStart) + (hasTeardown ? 1 : 0);
      staffLoad[nvPhu].procs_done[tenThuThuat] = (staffLoad[nvPhu].procs_done[tenThuThuat] || 0) + 1;
    }
  });
  const tempDropList = [], results = [], localProcCount = {};
  
  const totalPendingProcs = patients.reduce((sum, p) => sum + p.pending.length, 0);
  const activeStaffCount = db.rawStaff.length;
  const autoCrowded = activeStaffCount > 0 ? (totalPendingProcs / activeStaffCount >= 3.5) : true;
  const isCrowdedDay = crowdedOverride === 1 ? true : (crowdedOverride === 0 ? false : autoCrowded);

  patients.forEach(p => {
    const valid = [];
    p.pending.forEach(tenThuThuat => {
      if (!staffBySkill[tenThuThuat.toLowerCase()]) {
        const tenGoc = thuThuatInfo[tenThuThuat.toLowerCase()]?.[8] || tenThuThuat;
        tempDropList.push({ pId: p.pId, bn: p.name, ns: p.ns, tt: tenGoc, room: p.room, staff: "Trống", reason: "HỦY SỚM: Không có nhân sự có kỹ năng này" });
      } else valid.push(tenThuThuat);
    });

    const activeProcs = Object.values(staffLastProc);
    const sortedProcs = valid.map((ten, idx) => ({ ten, idx, rand: rand() }));
    sortedProcs.sort((a, b) => {
      const infoA = thuThuatInfo[a.ten.toLowerCase()] || ["", 999, 999, "PHCN", 0, 0, [], 5];
      const infoB = thuThuatInfo[b.ten.toLowerCase()] || ["", 999, 999, "PHCN", 0, 0, [], 5];
      const lienA = activeProcs.includes(a.ten) ? 0 : 1;
      const lienB = activeProcs.includes(b.ten) ? 0 : 1;
      if (lienA !== lienB) return lienA - lienB;
      const heA = infoA[3] === "YHCT" ? 0 : 1;
      const heB = infoB[3] === "YHCT" ? 0 : 1;
      if (heA !== heB) return heA - heB;
      if (scenario === 1) {
        const hiemA = machineRarity[a.ten.toLowerCase()] ?? 3;
        const hiemB = machineRarity[b.ten.toLowerCase()] ?? 3;
        if (hiemA !== hiemB) return hiemA - hiemB;
      }
      if (infoA[2] !== infoB[2]) return infoA[2] - infoB[2];
      if (infoA[1] !== infoB[1]) return infoA[1] - infoB[1];
      return Math.abs(a.rand - b.rand) > 0.0001 ? a.rand - b.rand : a.idx - b.idx;
    });

    p.pending = sortedProcs.map(o => o.ten);
    updatePatientCache(p, thuThuatInfo);
  });

  const todayNum = parseNgayVao(ngayXep);
  patients.forEach(p => {
    p._ngayVaoNum = parseNgayVao(p.ngayVao || "");
    p._isNew = (p._ngayVaoNum >= todayNum);
  });
  patients.sort((a, b) => {
    const aType = a.loaiBN || 'NoiTru';
    const bType = b.loaiBN || 'NoiTru';
    if (aType !== bType) {
      return aType === 'NgoaiTru' ? -1 : 1;
    }
    if (a._isNew !== b._isNew) return a._isNew ? 1 : -1;
    if (!a._isNew && a._ngayVaoNum !== b._ngayVaoNum) return a._ngayVaoNum - b._ngayVaoNum;
    return a.arrive - b.arrive;
  });
  patients.forEach(p => { p.randSeed = p._isNew ? (0.5 + rand() * 0.5) : (rand() * 0.5); });

  function tryScheduleOne(patient, tenThuThuat, tNow) {
    const loaiBN = patient.loaiBN || 'NoiTru';
    const buoiDieuTri = patient.buoiDieuTri || 'Sang';

    if (loaiBN === 'NgoaiTru') {
      const info = thuThuatInfo[tenThuThuat.toLowerCase()] || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
      const tgMay = Math.max(info[1], info[2]);
      const gioKetThuc = tNow + tgMay;

      // TuDong: hệ thống tự chọn buổi - không giới hạn, chỉ cần trong giờ làm
      if (buoiDieuTri === 'Sang') {
        if (tNow < 420 || gioKetThuc > 695) {
          return false;
        }
      } else if (buoiDieuTri === 'Chieu') {
        if (tNow < 780 || gioKetThuc > 1019) {
          return false;
        }
      }
      // TuDong: không ràng buộc buổi - scheduler tự quyết

      if (patient.lastScheduledEnd && patient.lastScheduledEnd > 0) {
        const gap = tNow - patient.lastScheduledEnd;
        if (gap < 0 || gap > 3) {
          return false;
        }
      }
    }

    const info = thuThuatInfo[tenThuThuat.toLowerCase()] || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
    const tenGoc = info[8] || tenThuThuat, targetRoom = patient.room, loaiMay = info[0];
    const baseTgMay = Math.max(info[1], info[2]), tgNhanVien = info[2], canPhu = info[5];
    const isSupplemental = existingSched && existingSched.length > 0;
    
    const isDienCham = tenThuThuat.toLowerCase().includes('điện châm') || tenThuThuat.toLowerCase() === 'đc' || (info[8] && String(info[8]).toLowerCase().includes('điện châm'));
    const candidateDurs = (isDienCham && (isSupplemental || isBackfill)) ? [25, 30, 26, 27, 28, 29] : [baseTgMay];

    const isYHCT = String(info[3] || "").trim().toUpperCase() === "YHCT";
    const yhctEndLimit = weights.yhctEnd !== undefined ? weights.yhctEnd : 10;
    const allowedOvertimeAtEnd = isYHCT ? yhctEndLimit : OVERTIME_ALLOWANCE;

    const roomsWithWaiting = new Set();
    if (!isSupplemental) {
      const threshold = scenario === 2 ? 1 : 0;
      for (const _p of patients) {
        if (_p.pending.length > threshold && _p.free_at <= tNow && !_p.busy.some(b => b[0] <= tNow && tNow < b[1])) {
          roomsWithWaiting.add(_p.room);
        }
      }
    }

    for (const tgMay of candidateDurs) {
      const rawKhoangCach = scenario === 1 ? info[2] : (info[7] || info[2]);
      const khoangCach = Math.max(rawKhoangCach, info[2] + 1);
      const gioKetThuc = tNow + tgMay;
      const hasTeardown = tgMay > tgNhanVien;
      const tearStart = hasTeardown ? (tNow + tgMay) : null;
      const tearEnd = hasTeardown ? (tNow + tgMay + 1) : null;

      if (gioKetThuc > (endOfDay + allowedOvertimeAtEnd)) continue;
      if (patient.leave !== 9999 && gioKetThuc > patient.leave) continue;
      if (patient.busy.some(b => is_overlap(tNow, gioKetThuc, b[0], b[1]))) continue;

      const candidatesMain = [], candidatesSub = [];
      (staffBySkill[tenThuThuat.toLowerCase()] || []).forEach(tenNV => {
        if (tNow < (staffSetupReady[tenNV] || 0)) return;
        
        const checkSlot = (slotStart, slotEnd) => {
          return (staffTimeline[tenNV] || []).some(slot => {
            if (slotStart >= slot[1]) return false;
            const isEndOfDay = slot[1] === 1440;
            const isLunch = slot[1] - slot[0] >= 60 && !isEndOfDay;
            if (isLunch || isEndOfDay) {
              const yhctLimit = isEndOfDay ? yhctEndLimit : (weights.yhctLunch !== undefined ? weights.yhctLunch : 10);
              const allowedOvertime = isYHCT ? yhctLimit : (isEndOfDay ? OVERTIME_ALLOWANCE : 0);
              const allowedEnd = slot[0] + allowedOvertime;
              if ((slotEnd - 1) <= allowedEnd && slotStart <= slot[0]) return false;
            }
            return is_overlap(slotStart, slotEnd, slot[0], slot[1]);
          });
        };

        if (checkSlot(tNow, tNow + tgNhanVien + 1)) return;
        if (hasTeardown && checkSlot(tearStart, tearEnd)) return;
        
        if (!isSupplemental && !isBackfill && staffRole[tenNV] === 'Kỹ thuật viên' && (staffMyRooms[tenNV] || []).length > 0 && !staffMyRooms[tenNV].includes(targetRoom)) return;

        if (staffRole[tenNV]?.toLowerCase() !== 'điều dưỡng') candidatesMain.push(tenNV);
        else candidatesSub.push(tenNV);
      });
      if (candidatesMain.length === 0) continue;

      candidatesMain.sort((a, b) => {
        const rmA = (staffMyRooms[a] || []).includes(targetRoom) ? 0 : 1, rmB = (staffMyRooms[b] || []).includes(targetRoom) ? 0 : 1;
        if (rmA !== rmB) return rmA - rmB;
        const crA = staffCurrentRoom[a] === targetRoom ? 0 : 1, crB = staffCurrentRoom[b] === targetRoom ? 0 : 1;
        if (crA !== crB) return crA - crB;
        const lpA = staffLastProc[a] === tenThuThuat ? 0 : 1, lpB = staffLastProc[b] === tenThuThuat ? 0 : 1;
        if (lpA !== lpB) return lpA - lpB;
        const roleA = (info[3] === "PHCN" && staffRole[a] === 'Kỹ thuật viên') || (info[3] === "YHCT" && staffRole[a] === 'Bác sĩ') ? 0 : 1;
        const roleB = (info[3] === "PHCN" && staffRole[b] === 'Kỹ thuật viên') || (info[3] === "YHCT" && staffRole[b] === 'Bác sĩ') ? 0 : 1;
        if (roleA !== roleB) return roleA - roleB;
        return (staffLoad[a]?.used_mins || 0) - (staffLoad[b]?.used_mins || 0);
      });

      const possibleMachines = loaiMay === "Thủ công" ? [loaiMay] : (machineTypes[loaiMay] || []);
      const availableMachines = scenario === 3 ? possibleMachines.filter(m => !reservedMachines.has(m)) : possibleMachines;
      const finalMachines = availableMachines.length === 0 ? possibleMachines : availableMachines;
      const selectedMachine = finalMachines.find(m => !(machineTimeline[m] || []).some(slot => is_overlap(tNow, gioKetThuc, slot[0], slot[1])));
      if (!selectedMachine) continue;

      let selectedBed = null;
      if (bedTracker[targetRoom]) {
        for (const [bedId, bedTimeline] of Object.entries(bedTracker[targetRoom])) {
          if (!bedTimeline.some(slot => is_overlap(tNow, gioKetThuc, slot[0], slot[1]))) { selectedBed = bedId; break; }
        }
      }
      if (!selectedBed && bedTracker[targetRoom] && Object.keys(bedTracker[targetRoom]).length > 0) continue;

      for (const nvChinh of candidatesMain) {
        const isInMyRoom = (staffMyRooms[nvChinh] || []).includes(targetRoom);
        const isFloating = (staffMyRooms[nvChinh] || []).length === 0;
        if (!(isInMyRoom || isFloating)) {
          if (!isSupplemental) {
            const hasSkilledStaffInRoom = (staffBySkill[tenThuThuat.toLowerCase()] || []).some(s =>
              (staffMyRooms[s] || []).includes(targetRoom)
            );
            if (!isCrowdedDay && hasSkilledStaffInRoom) continue;

            const myRooms = staffMyRooms[nvChinh];
            let isMyRoomBusy = false;
            if (myRooms) {
              for (let r = 0; r < myRooms.length; r++) {
                if (roomsWithWaiting.has(myRooms[r])) { isMyRoomBusy = true; break; }
              }
            }
            if (isMyRoomBusy) continue;
          }
        }

        let nvPhu = "";
        if (canPhu === 1) {
          const validSubs = candidatesSub.filter(x => x !== nvChinh);
          if (validSubs.length === 0) continue;

          const hasSubInRoom = validSubs.some(s => (staffMyRooms[s] || []).includes(targetRoom));
          const filteredSubs = (!isSupplemental && !isCrowdedDay && hasSubInRoom)
            ? validSubs.filter(x => (staffMyRooms[x] || []).includes(targetRoom) || (staffMyRooms[x] || []).length === 0)
            : validSubs;

          if (filteredSubs.length === 0) continue;

          filteredSubs.sort((a, b) => {
            const aR = (staffMyRooms[a] || []).includes(targetRoom) ? 0 : 1, bR = (staffMyRooms[b] || []).includes(targetRoom) ? 0 : 1;
            return aR !== bR ? aR - bR : (staffLoad[a]?.used_mins || 0) - (staffLoad[b]?.used_mins || 0);
          });
          nvPhu = filteredSubs[0];
        }

        blockStaff(nvChinh, tNow, tNow + tgNhanVien, khoangCach, staffTimeline, staffSetupReady, staffLoad, tenThuThuat, staffLastProc);
        staffCurrentRoom[nvChinh] = targetRoom;
        if (hasTeardown) { staffTimeline[nvChinh].push([tearStart, tearEnd]); staffTimeline[nvChinh] = mergeTimeline(staffTimeline[nvChinh]); staffLoad[nvChinh].used_mins += (tearEnd - tearStart); }

        if (nvPhu) {
          blockStaff(nvPhu, tNow, tNow + tgNhanVien, khoangCach, staffTimeline, staffSetupReady, staffLoad, tenThuThuat, staffLastProc);
          if (hasTeardown) { staffTimeline[nvPhu].push([tearStart, tearEnd]); staffTimeline[nvPhu] = mergeTimeline(staffTimeline[nvPhu]); staffLoad[nvPhu].used_mins += (tearEnd - tearStart); }
        }

        if (selectedMachine !== "Thủ công") { 
          if (!machineTimeline[selectedMachine]) machineTimeline[selectedMachine] = [];
          machineTimeline[selectedMachine].push([tNow, gioKetThuc]); 
          machineTimeline[selectedMachine] = mergeTimeline(machineTimeline[selectedMachine]); 
        }

        if (selectedBed && bedTracker[targetRoom]?.[selectedBed]) { 
          bedTracker[targetRoom][selectedBed].push([tNow, gioKetThuc]); 
          bedTracker[targetRoom][selectedBed] = mergeTimeline(bedTracker[targetRoom][selectedBed]); 
        }

        results.push({
          NGAY: ngayXep, HOTEN: patient.name, NAMSINH: patient.ns, PHONG: targetRoom, pId: patient.pId,
          DICHVU: tenGoc, GIODIENRA: m2t(tNow), GIOKETTHUC: m2t(gioKetThuc),
          "NV CHÍNH": nvChinh, "NV PHỤ": nvPhu, MAY: selectedMachine, GIUONG: selectedBed || "",
          t_sort: tNow, PRIO: patient.leave !== 9999
        });
        localProcCount[tenThuThuat.toLowerCase()] = (localProcCount[tenThuThuat.toLowerCase()] || 0) + 1;
        patient.busy.push([tNow, gioKetThuc + 1]);
        patient.free_at = Math.max(patient.free_at, gioKetThuc + 1);
        patient.scheduled_count = (patient.scheduled_count || 0) + 1;
        patient.lastScheduledEnd = Math.max(patient.lastScheduledEnd || 0, gioKetThuc);
        return true;
      }
    }
    return false;
  }

  function countFeasibleSlots(patient, tFrom) {
    let count = 0;
    const pendingList = patient.pending;
    for (let i = 0; i < pendingList.length; i++) {
      const tenTT = pendingList[i];
      const ttLower = tenTT.toLowerCase();
      const info = thuThuatInfo[ttLower] || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
      const tgMay = Math.max(info[1], info[2]), loaiMay = info[0];
      
      const stfList = staffBySkill[ttLower];
      if (!stfList || stfList.length === 0) continue;
      
      let hasStaff = false;
      for (let s = 0; s < stfList.length; s++) {
        const stf = stfList[s];
        const tl = staffTimeline[stf];
        let overlap = false;
        if (tl) {
          for (let k = 0; k < tl.length; k++) {
            if (Math.max(tFrom, tl[k][0]) < Math.min(tFrom + tgMay, tl[k][1])) {
              overlap = true; break;
            }
          }
        }
        if (!overlap) { hasStaff = true; break; }
      }
      if (!hasStaff) continue;

      let hasMachine = true;
      if (loaiMay !== "Thủ công") {
        const macList = machineTypes[loaiMay];
        if (macList && macList.length > 0) {
          hasMachine = false;
          for (let m = 0; m < macList.length; m++) {
            const mac = macList[m];
            const tl = machineTimeline[mac];
            let overlap = false;
            if (tl) {
              for (let k = 0; k < tl.length; k++) {
                if (Math.max(tFrom, tl[k][0]) < Math.min(tFrom + tgMay, tl[k][1])) {
                  overlap = true; break;
                }
              }
            }
            if (!overlap) { hasMachine = true; break; }
          }
        }
      }

      if (hasMachine) count++;
    }
    return count;
  }

  function sortPatientPriority(a, b, curTime) {
    const aType = a.loaiBN || 'NoiTru';
    const bType = b.loaiBN || 'NoiTru';
    if (aType !== bType) {
      return aType === 'NgoaiTru' ? -1 : 1;
    }
    if (a.leave_pri !== b.leave_pri) return a.leave_pri - b.leave_pri;
    if (a.leave !== b.leave) return a.leave - b.leave;

    // ✨ TỐI ƯU HÓA LIỀN MẠCH (Flow Continuity): Ưu tiên bệnh nhân đang dở dang và vừa xong ca trước (0 <= gap <= 15 phút)
    if (curTime !== undefined) {
      const isFreshA = (a.lastScheduledEnd && a.lastScheduledEnd > 0 && curTime >= a.lastScheduledEnd && (curTime - a.lastScheduledEnd) <= 15) ? 0 : 1;
      const isFreshB = (b.lastScheduledEnd && b.lastScheduledEnd > 0 && curTime >= b.lastScheduledEnd && (curTime - b.lastScheduledEnd) <= 15) ? 0 : 1;
      if (isFreshA !== isFreshB) return isFreshA - isFreshB;
    }

    const groupA = (!a._isNew || a.arrive <= 660) ? 0 : 1;
    const groupB = (!b._isNew || b.arrive <= 660) ? 0 : 1;
    if (groupA !== groupB) return groupA - groupB;
    const scheduledA = a.scheduled_count || 0, scheduledB = b.scheduled_count || 0;
    const tierA = Math.floor(scheduledA / 2), tierB = Math.floor(scheduledB / 2);
    if (tierA !== tierB) return tierA - tierB;
    if (scheduledA !== scheduledB) return scheduledB - scheduledA;
    if (a._isNew !== b._isNew) return a._isNew ? 1 : -1;
    if (!a._isNew && a._ngayVaoNum !== b._ngayVaoNum) return a._ngayVaoNum - b._ngayVaoNum;
    return 0;
  }

  for (let phase = 1; phase <= 2; phase++) {
    if (phase === 2 && !patients.some(p => p.pending.length > 0)) break;
    let tNow = startOfDay;
    while (tNow <= endOfDay) {
      if (!patients.some(p => p.pending.length > 0)) break;
      let keepTrying = true;
      let isFirstTryAtTNow = true;
      while (keepTrying) {
        keepTrying = false;
        const eligible = patients.filter(p => p.pending.length > 0 && p.free_at <= tNow && !p.busy.some(b => b[0] <= tNow && tNow < b[1]));
        if (eligible.length === 0) break;
        if (isFirstTryAtTNow) {
          eligible.forEach(p => { p._feasible = countFeasibleSlots(p, tNow); });
          isFirstTryAtTNow = false;
        }
        eligible.sort((a, b) => {
          const base = sortPatientPriority(a, b, tNow); if (base !== 0) return base;
          if (a.has_yhct !== b.has_yhct) return a.has_yhct - b.has_yhct;
          if (a.has_toan_tg !== b.has_toan_tg) return a.has_toan_tg - b.has_toan_tg;
          if (a._feasible !== b._feasible) return b._feasible - a._feasible;
          if (a.max_dur !== b.max_dur) return b.max_dur - a.max_dur;
          return a.randSeed - b.randSeed;
        });
        for (const patient of eligible) {
          for (let i = 0; i < patient.pending.length; i++) {
            if (tryScheduleOne(patient, patient.pending[i], tNow)) {
              patient.pending.splice(i, 1); updatePatientCache(patient, thuThuatInfo);
              keepTrying = true; break;
            }
          }
        }
      }
      tNow = getNextEvent(tNow, patients, staffTimeline, machineTimeline, endOfDay);
    }
  }

  let remaining = patients.filter(p => p.pending.length > 0);
  if (remaining.length > 0) {
    const timePoints = new Set();
    Object.keys(staffTimeline).forEach(tenNV => {
      (staffShifts[tenNV] || []).forEach(([caStart]) => timePoints.add(caStart));
      (staffTimeline[tenNV] || []).forEach(slot => { if (slot[1] < endOfDay) timePoints.add(slot[1]); });
    });
    remaining.forEach(p => { if (p.free_at <= endOfDay) timePoints.add(p.free_at); });
    Object.values(machineTimeline).forEach(tl => tl.forEach(slot => { if (slot[1] < endOfDay) timePoints.add(slot[1]); }));

    for (const t of [...timePoints].sort((a, b) => a - b)) {
      if (t > endOfDay) break;
      const stillRemaining = patients.filter(p => p.pending.length > 0);
      if (stillRemaining.length === 0) break;
      let changed = true;
      while (changed) {
        changed = false;
        const eligible = stillRemaining.filter(p => p.free_at <= t && !p.busy.some(b => b[0] <= t && t < b[1]));
        eligible.sort((a, b) => {
          const base = sortPatientPriority(a, b); if (base !== 0) return base;
          if (a.has_yhct !== b.has_yhct) return a.has_yhct - b.has_yhct;
          return a.randSeed - b.randSeed;
        });
        for (const patient of eligible) {
          for (let i = 0; i < patient.pending.length; i++) {
            if (tryScheduleOne(patient, patient.pending[i], t)) {
              patient.pending.splice(i, 1); updatePatientCache(patient, thuThuatInfo);
              changed = true; break;
            }
          }
        }
      }
    }

    remaining = patients.filter(p => p.pending.length > 0);
    if (remaining.length > 0) {
      isBackfill = true;
      for (const patient of remaining) {
        for (const tenThuThuat of [...patient.pending]) {
          if (!patient.pending.includes(tenThuThuat)) continue;
          const info = thuThuatInfo[tenThuThuat.toLowerCase()] || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
          const isYHCT = String(info[3] || "").trim().toUpperCase() === "YHCT";
          const yhctEndLimit = weights.yhctEnd !== undefined ? Number(weights.yhctEnd) : 10;
          const allowedMaxEnd = endOfDay + (isYHCT ? yhctEndLimit : OVERTIME_ALLOWANCE);
          const tgMay = Math.max(info[1], info[2]);
          const gapStarts = new Set();
          for (const tenNV of (staffBySkill[tenThuThuat.toLowerCase()] || [])) {
            const tl = mergeTimeline([...(staffTimeline[tenNV] || [])]);
            let prevEnd = startOfDay;
            for (const slot of tl) {
              if (slot[0] > prevEnd && prevEnd + tgMay <= allowedMaxEnd) gapStarts.add(prevEnd);
              prevEnd = Math.max(prevEnd, slot[1]);
            }
            if (prevEnd + tgMay <= allowedMaxEnd) gapStarts.add(prevEnd);
          }
          for (const t of [...gapStarts].sort((a, b) => a - b)) {
            if (t < (patient.free_at || 0) || patient.busy.some(b => b[0] <= t && t < b[1])) continue;
            if (tryScheduleOne(patient, tenThuThuat, t)) {
              const idx = patient.pending.indexOf(tenThuThuat);
              if (idx !== -1) { patient.pending.splice(idx, 1); updatePatientCache(patient, thuThuatInfo); }
              break;
            }
          }
        }
      }
    }
  }

  patients.forEach(p => p.pending.forEach(tenTT => {
    const tenGoc = thuThuatInfo[tenTT.toLowerCase()]?.[8] || tenTT;
    tempDropList.push({ pId: p.pId, bn: p.name, ns: p.ns, tt: tenGoc, room: p.room, staff: "Trống", reason: "Thiếu nhân sự/Máy hoặc hết giờ" });
  }));

  isBackfill = true;
  const resultsByStaff = new Map();
  const resultsByPatient = new Map();
  for (const r of results) {
    const nv = r["NV CHÍNH"];
    const patKey = r.pId ? r.pId : (r.HOTEN + "_" + (r.NAMSINH || '') + "_" + (r.PHONG || ''));
    if (!resultsByStaff.has(nv)) resultsByStaff.set(nv, []);
    resultsByStaff.get(nv).push(r);
    if (!resultsByPatient.has(patKey)) resultsByPatient.set(patKey, []);
    resultsByPatient.get(patKey).push(r);
  }

  const finalDropList = [];
  for (const rotItem of tempDropList) {
    let saved = false;
    const tenTT = rotItem.tt, tenBN = rotItem.bn, phong = rotItem.room || '';
    const pat = patients.find(p => (rotItem.pId && p.pId === rotItem.pId) || (p.name === tenBN && p.ns === rotItem.ns && p.room === phong));
    const infoRot = thuThuatInfo[tenTT.toLowerCase()] || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
    const isYHCT = String(infoRot[3] || "").trim().toUpperCase() === "YHCT";
    const yhctEndLimit = weights.yhctEnd !== undefined ? Number(weights.yhctEnd) : 10;
    const tgCanThiet = Math.max(infoRot[1], infoRot[2]);
    const allowedMaxEnd = endOfDay + (isYHCT ? yhctEndLimit : OVERTIME_ALLOWANCE);

    if (pat) {
      const minStart = Math.max(pat.arrive || startOfDay, startOfDay);
      const gapStarts = new Set();
      for (const tenNV of (staffBySkill[tenTT.toLowerCase()] || [])) {
        const tl = mergeTimeline([...(staffTimeline[tenNV] || [])]);
        let prevEnd = minStart;
        for (const slot of tl) {
          if (slot[0] > prevEnd && prevEnd >= minStart && prevEnd + tgCanThiet <= allowedMaxEnd) gapStarts.add(prevEnd);
          prevEnd = Math.max(prevEnd, slot[1]);
        }
        if (prevEnd >= minStart && prevEnd + tgCanThiet <= allowedMaxEnd) gapStarts.add(prevEnd);
      }
      for (const t of [...gapStarts].sort((a, b) => a - b)) {
        if (t < (pat.free_at || 0) || pat.busy.some(b => is_overlap(t, t + tgCanThiet, b[0], b[1]))) continue;
        if (tryScheduleOne(pat, tenTT, t)) {
          const idx = pat.pending.indexOf(tenTT);
          if (idx !== -1) { pat.pending.splice(idx, 1); updatePatientCache(pat, thuThuatInfo); }
          saved = true;
          break;
        }
      }
    }

    if (!saved && pat) {
      const minStart = Math.max(pat.arrive || startOfDay, startOfDay);
      const dsBacSi = (staffBySkill[tenTT.toLowerCase()] || []).filter(s => staffRole[s] === 'Bác sĩ');
      for (const bacSi of dsBacSi) {
        if (saved) break;
        const caDePHCN = (resultsByStaff.get(bacSi) || []).filter(r => (thuThuatInfo[(r.DICHVU || "").toLowerCase()] || ["", "", "", "PHCN"])[3] === "PHCN");
        for (const caDe of caDePHCN) {
          const timeStart = t2m(caDe.GIODIENRA), timeEnd = t2m(caDe.GIOKETTHUC);
          if (timeStart < minStart || (timeEnd - timeStart) < tgCanThiet) continue;
          if (pat.leave !== 9999 && timeStart + tgCanThiet > pat.leave) continue;
          if (pat.busy.some(b => is_overlap(timeStart, timeStart + tgCanThiet, b[0], b[1]))) continue;
          let ktvThayThe = null;
          const dsKTV = (staffBySkill[(caDe.DICHVU || "").toLowerCase()] || []).filter(k => staffRole[k] === 'Kỹ thuật viên');
          for (const ktv of dsKTV) { if (!(staffTimeline[ktv] || []).some(slot => is_overlap(timeStart, timeEnd, slot[0], slot[1]))) { ktvThayThe = ktv; break; } }
          if (ktvThayThe) {
            caDe["NV CHÍNH"] = ktvThayThe;
            if (!staffTimeline[ktvThayThe]) staffTimeline[ktvThayThe] = [];
            staffTimeline[ktvThayThe].push([timeStart, timeEnd]); staffTimeline[ktvThayThe] = mergeTimeline(staffTimeline[ktvThayThe]);
            
            const newRes = {
              NGAY: ngayXep, HOTEN: pat.name, NAMSINH: pat.ns || rotItem.ns || "", PHONG: pat.room || phong, pId: pat.pId,
              DICHVU: tenTT, GIODIENRA: m2t(timeStart), GIOKETTHUC: m2t(timeStart + tgCanThiet),
              "NV CHÍNH": bacSi, "NV PHỤ": "", MAY: infoRot[0] || "Thủ công", GIUONG: "", t_sort: timeStart, PRIO: false
            };
            results.push(newRes);
            const newPatKey = pat.pId ? pat.pId : (pat.name + "_" + (pat.ns || '') + "_" + (pat.room || ''));
            if (!resultsByPatient.has(newPatKey)) resultsByPatient.set(newPatKey, []);
            resultsByPatient.get(newPatKey).push(newRes);

            if (!staffTimeline[bacSi]) staffTimeline[bacSi] = [];
            staffTimeline[bacSi].push([timeStart, timeStart + tgCanThiet]); staffTimeline[bacSi] = mergeTimeline(staffTimeline[bacSi]);
            saved = true; localProcCount[tenTT.toLowerCase()] = (localProcCount[tenTT.toLowerCase()] || 0) + 1; break;
          }
        }
      }
    }
    if (!saved) finalDropList.push(rotItem);
  }
  isBackfill = false;

  const overtimeMins = Object.values(staffLoad).reduce((s, v) => s + Math.max(0, v.used_mins - v.shift_mins), 0);
  const loadValues = Object.values(staffLoad).map(v => v.used_mins);
  const avg = loadValues.reduce((a,b)=>a+b,0) / (loadValues.length || 1);
  const imbalance = loadValues.reduce((s,v) => s + Math.abs(v - avg), 0);
  const scoreVal = finalDropList.length * weights.drop + overtimeMins * weights.overtime + imbalance * weights.imbalance;

  results.sort((a, b) => a["NV CHÍNH"] !== b["NV CHÍNH"] ? a["NV CHÍNH"].localeCompare(b["NV CHÍNH"]) : a.t_sort - b.t_sort);
  return { sched: results, rot: finalDropList, score: scoreVal, staff: staffLoad, proc: localProcCount, tl: staffTimeline, ca: staffShifts };
}

function runBestIteration(db, dateVal, existingSched = [], scenario = 1, crowdedOverride = -1, weights = { drop: 10000, overtime: 2, imbalance: 0.1 }) {
  let rand = createSeededRandom(42);
  let currentPatients = clonePatients(db.rawPatients);
  let current = _turbo_core_logic({ ...db, rawPatients: currentPatients }, dateVal, 0, existingSched, scenario, crowdedOverride, weights);
  let best = current;

  if (best.rot.length === 0) return best;

  let droppedNames = new Set(best.rot.map(r => r.pId || (r.bn + '_' + (r.ns || '') + '_' + (r.room || ''))));
  const T_initial = 4.0, T_min = 1.0, alpha = 0.65;
  let T = T_initial, noImprove = 0;

  while (T > T_min && noImprove < 1) {
    const neighborPatients = mutate(currentPatients, rand, droppedNames);
    const neighbor = _turbo_core_logic({ ...db, rawPatients: neighborPatients }, dateVal, 0, existingSched, scenario, crowdedOverride, weights);
    const delta = neighbor.score - current.score;
    const accept = delta < 0 || (rand() < Math.exp(-delta / T));
    if (accept) {
      current = neighbor; currentPatients = neighborPatients;
      if (current.score < best.score) {
        best = current;
        if (best.rot.length === 0) return best;
        droppedNames = new Set(best.rot.map(r => r.pId || (r.bn + '_' + (r.ns || '') + '_' + (r.room || ''))));
        noImprove = 0;
      } else { noImprove++; }
    } else { noImprove++; }
    T *= alpha;
  }

  if (best.rot.length > 0) {
    const result = _turbo_core_logic({ ...db, rawPatients: clonePatients(db.rawPatients) }, dateVal, 101, existingSched, scenario, crowdedOverride, weights);
    if (result.score < best.score) best = result;
  }
  return best;
}

async function buildBaseDbFromD1(db) {
  const [machinesRes, staffRes, roomsRes, procsRes, patientsRes] = await db.batch([
    db.prepare("SELECT * FROM machines WHERE is_active = 1 AND trang_thai = 'Sẵn sàng' ORDER BY order_idx ASC"),
    db.prepare("SELECT * FROM staff WHERE is_active = 1 AND name NOT GLOB '[0-9]*' ORDER BY priority ASC, id ASC"),
    db.prepare("SELECT * FROM rooms WHERE is_active = 1 ORDER BY order_idx ASC"),
    db.prepare("SELECT * FROM procedures WHERE is_active = 1 ORDER BY order_idx ASC"),
    db.prepare("SELECT * FROM patients WHERE is_saturday = 0 ORDER BY order_idx ASC, id ASC")
  ]);

  const database = {
    machineTypes: {},
    thuThuatInfo: {},
    replacementMap: {},
    roomStaff: {},
    roomBeds: {},
    rawStaff: [],
    rawPatients: []
  };

  (machinesRes.results || []).forEach(r => {
    if (!database.machineTypes[r.ten_loai]) database.machineTypes[r.ten_loai] = [];
    database.machineTypes[r.ten_loai].push(r.ma_may);
  });

  (staffRes.results || []).forEach(r => {
    const thayThe = r.nguoi_thay_the || "Không";
    if (thayThe && thayThe !== "Không") database.replacementMap[r.name] = thayThe;
    const skills = parseStringOrJsonArray(r.skills).join(", ");
    const busy = parseStringOrJsonArray(r.temp_busy).join(", ");
    database.rawStaff.push([r.name, r.role || "KTV", skills, r.thoi_gian_lam || "07:30-11:30, 13:00-16:30", busy, r.trang_thai || "Đi làm"]);
  });

  (procsRes.results || []).forEach(r => {
    const tgNhanVien = parseInt(r.tg_thuc_hien) || 5;
    const tgMay = parseInt(r.tg_thu_thuat) || 15;
    const khoangCach = parseInt(r.khoang_cach) || tgNhanVien;
    const dsPhu = parseStringOrJsonArray(r.ds_nguoi_phu);
    database.thuThuatInfo[String(r.ten_thu_thuat).trim().toLowerCase()] = [
      r.may || "Thủ công",
      Math.max(1, tgMay),
      Math.max(1, tgNhanVien),
      r.he || "PHCN",
      (r.can_rut_may === 1 || r.can_rut_may === '1' || r.can_rut_may === 'Có' || r.can_rut_may === true) ? 1 : 0,
      (r.can_nguoi_phu === 1 || r.can_nguoi_phu === '1' || r.can_nguoi_phu === 'Có' || r.can_nguoi_phu === true) ? 1 : 0,
      dsPhu,
      khoangCach,
      String(r.ten_thu_thuat).trim(),
      r.viet_tat || ""
    ];
  });

  (roomsRes.results || []).forEach(r => {
    const soGiuong = parseInt(r.so_giuong) || 15;
    const bedStr = r.danh_sach_giuong ? String(r.danh_sach_giuong).trim() : "";
    database.roomBeds[r.ten_phong] = (bedStr && bedStr !== 'None')
      ? bedStr.split(",").map(x => x.trim()).filter(Boolean)
      : Array.from({ length: soGiuong }, (_, i) => `Giường ${i + 1}`);

    const dsBacSi = parseStringOrJsonArray(r.bac_si);
    const dsKTV = parseStringOrJsonArray(r.ktv);
    database.roomStaff[r.ten_phong] = [...new Set([...dsBacSi, ...dsKTV].map(x => database.replacementMap[x] || x))];
  });

  return { database, rawPatientsList: patientsRes.results || [] };
}

  function getSafeCache() {
    let cache = (typeof dataCache !== 'undefined' && dataCache) ? dataCache : (window.dataCache || null);
    if (!cache || !cache.staff || !cache.staff.length) {
      try {
        const str = localStorage.getItem('times_bootstrap_cache');
        if (str) {
          const parsed = JSON.parse(str);
          if (parsed) {
            cache = {
              staff: parsed.staff || [],
              pat: parsed.patients || parsed.pat || [],
              proc: parsed.procedures || parsed.proc || [],
              room: parsed.rooms || parsed.room || [],
              machine: parsed.machines || parsed.machine || []
            };
          }
        }
      } catch (e) {}
    }
    return cache || { staff: [], pat: [], proc: [], room: [], machine: [] };
  }

  function buildDbFromCache(cacheInput, skipProcsStr, existingSched = []) {
    const cache = cacheInput || getSafeCache();

    const database = {
      machineTypes: {},
      thuThuatInfo: {},
      replacementMap: {},
      roomStaff: {},
      roomBeds: {},
      rawStaff: [],
      rawPatients: []
    };

    const fixBusyString = str => !str ? "" : String(str).split(",").map(b => {
      const parts = b.split("-");
      return parts.length === 2 ? parts[0].trim() + "-" + m2t(t2m(parts[1].trim()) + 1) : b;
    }).join(",");

    // 1. Machines
    const machineList = cache.machine || cache.machines || [];
    machineList.forEach(m => {
      const tenLoai = m.tenLoai || m[1] || "";
      const maMay = m.maMay || m[2] || "";
      const trangThai = m.trangThai || m[3] || "Sẵn sàng";
      if (trangThai === "Sẵn sàng" && tenLoai && maMay) {
        if (!database.machineTypes[tenLoai]) database.machineTypes[tenLoai] = [];
        database.machineTypes[tenLoai].push(maMay);
      }
    });

    // 2. Staff
    const staffList = cache.staff || [];
    staffList.forEach(s => {
      const ten = s.ten || s.name || s[1] || "";
      const vaiTro = s.vaiTro || s.role || s[2] || "KTV";
      const trangThai = s.trangThai || s[3] || "Đi làm";
      const thayThe = s.nguoiThayThe || s[7] || "Không";
      if (thayThe && thayThe !== "Không" && ten) database.replacementMap[ten] = thayThe;

      if (trangThai !== "Nghỉ cả ngày" && ten) {
        const skills = Array.isArray(s.kyNang) ? s.kyNang.join(", ") : (s.kyNang || s[5] || "");
        const shifts = s.thoiGianLam || s[4] || "07:30-11:30, 13:00-16:30";
        const busy = fixBusyString(s.gioBan || s[6] || "");
        database.rawStaff.push([ten, vaiTro, skills, shifts, busy, trangThai]);
      }
    });

    // 3. Procedures
    const procList = cache.proc || cache.procedures || [];
    procList.forEach(p => {
      const ten = String(p.ten || p.name || p[1] || "").trim().toLowerCase();
      if (!ten) return;
      const tgNhanVien = parseInt(p.thoiGianThucHien || p[6]) || 5;
      const tgMay = parseInt(p.thoiGianThuThuat || p[7]) || 15;
      const khoangCach = parseInt(p.khoangCach || p[8]) || tgNhanVien;
      const dsPhuStr = p.dsNguoiPhu || p[11] || "";
      const dsPhu = Array.isArray(dsPhuStr) ? dsPhuStr : String(dsPhuStr).split(",").map(x => x.trim()).filter(Boolean);

      database.thuThuatInfo[ten] = [
        p.may || p[5] || "Thủ công",
        Math.max(1, tgMay),
        Math.max(1, tgNhanVien),
        p.he || p[3] || "PHCN",
        (p.canRutMay === "Có" || p[9] === "Có" || p.canRutMay === 1 || p.canRutMay === "1" || p.canRutMay === true) ? 1 : 0,
        (p.canNguoiPhu === "Có" || p[10] === "Có" || p.canNguoiPhu === 1 || p.canNguoiPhu === "1" || p.canNguoiPhu === true) ? 1 : 0,
        dsPhu,
        khoangCach,
        p.ten || p.name || p[1] || "",
        p.vietTat || p[2] || ""
      ];
    });

    // 4. Rooms
    const roomList = cache.room || cache.rooms || [];
    roomList.forEach(r => {
      const roomName = String(r.tenPhong || r.name || r[1] || "").trim();
      if (!roomName) return;
      const soGiuong = parseInt(r.soGiuong || r[5]) || 15;
      const bedStr = String(r.danhSachGiuong || r[6] || "").trim();
      database.roomBeds[roomName] = (bedStr && bedStr !== 'None')
        ? bedStr.split(",").map(x => x.trim()).filter(Boolean)
        : Array.from({ length: soGiuong }, (_, i) => "Giường " + (i + 1));

      const bsStr = String(r.bacSi || r[2] || "");
      const ktvStr = String(r.ktv || r[3] || "");
      const dsBacSi = bsStr.split(",").map(x => x.trim()).filter(Boolean);
      const dsKTV = ktvStr.split(",").map(x => x.trim()).filter(Boolean);
      database.roomStaff[roomName] = [...new Set([...dsBacSi, ...dsKTV].map(x => database.replacementMap[x] || x))];
    });

    // 5. Patients
    const patList = cache.pat || cache.patients || [];
    const skipList = skipProcsStr ? String(skipProcsStr).split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
    const seen = new Set();
    const forcedDrops = [];

    patList.forEach((p, idx) => {
      const pName = String(p.ten || p.name || p[1] || "").trim().toUpperCase();
      if (!pName) return;
      const pNs = String(p.namSinh || p.age || p[2] || "").trim();
      const pRoom = String(p.phong || p[7] || "").trim();
      const pId = p.id || (pName + "_" + pNs + "_" + pRoom + "_" + idx);
      const key = pId;
      if (seen.has(key)) return;
      seen.add(key);

      const ttStr = p.thuThuat || p.procedures || p[8] || "";
      let procs = Array.isArray(ttStr) ? ttStr : String(ttStr).split(",").map(x => x.trim()).filter(Boolean);
      if (!procs.length) return;

      // Nếu đang xếp bổ sung (có existingSched), loại bỏ các thủ thuật CỦA BỆNH NHÂN NÀY đã được xếp lịch trước đó (khớp theo số lượng)
      if (existingSched && existingSched.length > 0) {
        const scheduledProcsForPat = existingSched
          .filter(r => {
            if (!r) return false;
            const rName = String(r.tenBN || r.HOTEN || r[1] || '').toUpperCase().trim();
            const rNs = String(r.namSinh || r.NAMSINH || r[2] || '').trim();
            const rRoom = String(r.phong || r.PHONG || r[3] || '').trim();
            const rGio = String(r.gioDienRa || r.GIODIENRA || r[5] || '');
            return rName === pName && (!pNs || !rNs || pNs === rNs) && (!pRoom || !rRoom || pRoom === rRoom) && rGio !== '❌ Rớt' && rGio !== '--';
          })
          .map(r => String(r.thuThuat || r.DICHVU || r[4] || '').trim().toLowerCase());

        const remainingProcs = [];
        const copyScheduled = [...scheduledProcsForPat];
        for (const pr of procs) {
          const lowerPr = pr.toLowerCase();
          const matchIdx = copyScheduled.indexOf(lowerPr);
          if (matchIdx !== -1) {
            copyScheduled.splice(matchIdx, 1);
          } else {
            remainingProcs.push(pr);
          }
        }
        procs = remainingProcs;
      }
      if (!procs.length) return; // Bệnh nhân đã được xếp đủ hết thủ thuật rồi, không cần xếp nữa

      const rawGioVao = p.gioVao || p[4] || "";
      const gioVao = isEmptyTime(rawGioVao) ? 420 : t2m(rawGioVao);
      const busyRaw = p.gioBan || p[5] || "";
      const busySlots = busyRaw ? String(busyRaw).split(",").filter(b => b.includes("-")).map(b => [t2m(b.split("-")[0]), t2m(b.split("-")[1]) + 1]) : [];
      busySlots.push([0, gioVao + 1]);
      const leaveRaw = p.gioRa || p.leave_time || p[6] || "";
      const isRaVien = (leaveRaw && String(leaveRaw).trim() !== "");

      const pendingFiltered = procs.filter(tenThuThuat => {
        if (!skipList.length || isRaVien) return true;
        const tenLower = String(tenThuThuat || '').toLowerCase();
        const info = database.thuThuatInfo[tenLower];
        const tenGoc = info ? (info[8] || "").toLowerCase() : tenLower;
        const vietTat = info ? (info[9] || "").toLowerCase() : "";
        if (skipList.includes(tenLower) || skipList.includes(tenGoc) || skipList.includes(vietTat)) {
          forcedDrops.push({ pId: pId, bn: pName, ns: pNs, room: pRoom, tt: tenThuThuat, reason: "Tạm ngưng thủ thuật (Khoa báo nghỉ)" });
          return false;
        }
        return true;
      });

      const loaiBN = p.loai_bn || p.loaiBN || p[9] || "NoiTru";
      const buoiDieuTri = p.buoi_dieu_tri || p.buoiDieuTri || p[10] || "Sang";

      database.rawPatients.push({
        pId: pId,
        name: pName,
        ns: pNs,
        ngayVao: p.ngayVao || p[3] || "",
        room: pRoom,
        arrive: gioVao,
        leave: t2m(leaveRaw) || 9999,
        busy: busySlots,
        pending: pendingFiltered,
        free_at: gioVao + 1,
        loaiBN: loaiBN,
        buoiDieuTri: buoiDieuTri
      });
    });

    return { database, forcedDrops };
  }

  function runClientScheduling(dateVal, strategyKey = 'opt_rare', skipProcsStr = '', crowdedOverride = -1, existingSched = []) {
    const startTime = performance.now();
    const { database: db, forcedDrops } = buildDbFromCache(null, skipProcsStr, existingSched);

    if (!db.rawPatients.length) {
      return {
        schedule: [],
        unscheduled: [],
        scheduleCount: 0,
        unscheduledCount: 0,
        elapsedMs: 0
      };
    }

    const scenarioMap = { opt_rare: 1, balanced: 2, contingency: 3 };
    const scenario = scenarioMap[strategyKey] || 1;

    const best = runBestIteration(db, dateVal, existingSched, scenario, crowdedOverride);
    const finalDropList = (best ? best.rot : []).concat(forcedDrops).map(r => ({ ...r, ngay: r.ngay || dateVal }));

    const formattedSched = (best ? best.sched : []).map(x => ({
      ngay: x.NGAY,
      tenBN: x.HOTEN,
      namSinh: x.NAMSINH,
      phong: x.PHONG,
      thuThuat: x.DICHVU,
      gioDienRa: x.GIODIENRA,
      gioKetThuc: x.GIOKETTHUC,
      nvChinh: x["NV CHÍNH"],
      nvPhu: x["NV PHỤ"],
      may: x.MAY,
      giuong: x.GIUONG
    }));

    const elapsed = Math.round(performance.now() - startTime);

    return {
      scheduleCount: formattedSched.length,
      unscheduledCount: finalDropList.length,
      schedule: formattedSched,
      sched: formattedSched,
      unscheduled: finalDropList,
      rot: finalDropList,
      elapsedMs: elapsed
    };
  }

  function runSaturdayScheduling(payload = {}, dateVal = '') {
    const startTime = performance.now();
    const targetDate = dateVal || new Date().toISOString().slice(0, 10);
    const { database: baseDb } = buildDbFromCache();

    baseDb.roomBeds = {};
    baseDb.roomStaff = {};
    const allBeds = [];
    const rooms = (typeof dataCache !== 'undefined' && dataCache.room) ? dataCache.room : [];
    rooms.forEach(r => {
      const roomName = r.tenPhong || r.ten || r[1] || "";
      const soGiuong = parseInt(r.soGiuong || r[5]) || 15;
      const bedStr = r.danhSachGiuong || r[6] ? String(r.danhSachGiuong || r[6]).trim() : "";
      const beds = (bedStr && bedStr !== 'None') ? bedStr.split(",").map(x => x.trim()).filter(Boolean) : Array.from({ length: soGiuong }, (_, i) => `Giường ${i + 1}`);
      beds.forEach(b => allBeds.push(`${roomName}|${b}`));
    });
    baseDb.roomBeds["PHONG_CHUNG_T7"] = allBeds;
    baseDb.roomStaff["PHONG_CHUNG_T7"] = [];

    const allStaff = (typeof dataCache !== 'undefined' && dataCache.staff) ? dataCache.staff : [];
    baseDb.rawStaff = [];
    (payload.allowed_staff || []).forEach(tenNhanVien => {
      const staffRow = allStaff.find(r => (r.ten || r.name || r[1]) === tenNhanVien);
      if (staffRow) {
        const shiftStr = (payload.staff_shifts_dict?.[tenNhanVien] || []).map(sh => `${sh[0]}-${sh[1]}`).join(', ');
        const skills = staffRow.kyNang || staffRow.skills || staffRow[2] || "";
        const role = staffRow.vaiTro || staffRow.role || staffRow[3] || "KTV";
        baseDb.rawStaff.push([staffRow.ten || staffRow.name || staffRow[1], role, skills, shiftStr, "", "Đi làm"]);
      }
    });

    baseDb.rawPatients = [];
    (payload.final_pats || []).forEach((bn, idx) => {
      const readyTime = (bn.gioVao ? t2m(bn.gioVao) : 0) + 1;
      const pName = String(bn.ten).toUpperCase();
      const pNs = bn.ns || "";
      const pRoom = bn.phong || "";
      const pId = bn.id || (pName + "_" + pNs + "_" + pRoom + "_" + idx);
      baseDb.rawPatients.push({
        pId: pId,
        name: pName,
        ns: pNs,
        ngayVao: bn.ngayVao || "",
        room: "PHONG_CHUNG_T7",
        arrive: readyTime,
        leave: 9999,
        busy: [[0, readyTime]],
        pending: bn.tt ? String(bn.tt).split(",").map(x => x.trim()).filter(Boolean) : [],
        free_at: readyTime
      });
    });

    const best = runBestIteration(baseDb, targetDate, [], 2, -1);
    const decodeRoom = item => {
      if (item.PHONG === "PHONG_CHUNG_T7" && item.GIUONG?.includes("|")) {
        const parts = item.GIUONG.split("|");
        return { realRoom: parts[0], realBed: parts[1] };
      }
      return { realRoom: item.PHONG, realBed: item.GIUONG };
    };

    if (!best) {
      return { scheduleCount: 0, unscheduledCount: 0, sched: [], schedule: [], rot: [], unscheduled: [], elapsedMs: 0 };
    }

    const rot = (best.rot || []).map(u => {
      if (u.phong === "PHONG_CHUNG_T7" || u.room === "PHONG_CHUNG_T7") {
        const orig = (payload.final_pats || []).find(p => p.ten.toUpperCase() === u.bn.toUpperCase());
        if (orig) { u.phong = orig.phong; u.room = orig.phong; }
      }
      return { ...u, ngay: u.ngay || targetDate };
    });

    const formattedSched = (best.sched || []).map(item => {
      const { realRoom, realBed } = decodeRoom(item);
      return {
        ngay: item.NGAY || targetDate,
        tenBN: item.HOTEN,
        namSinh: item.NAMSINH,
        phong: realRoom,
        thuThuat: item.DICHVU,
        gioDienRa: item.GIODIENRA,
        gioKetThuc: item.GIOKETTHUC,
        nvChinh: item["NV CHÍNH"],
        nvPhu: item["NV PHỤ"],
        may: item.MAY,
        giuong: realBed
      };
    });

    const elapsed = Math.round(performance.now() - startTime);

    return {
      scheduleCount: formattedSched.length,
      unscheduledCount: rot.length,
      sched: formattedSched,
      schedule: formattedSched,
      rot: rot,
      unscheduled: rot,
      elapsedMs: elapsed
    };
  }

  function runExtraScheduling(dateVal, existingSched = []) {
    return runClientScheduling(dateVal, 'opt_rare', '', -1, existingSched);
  }

  return {
    t2m,
    m2t,
    buildDbFromCache,
    runScheduling: runClientScheduling,
    runExtraScheduling: runExtraScheduling,
    runSaturdayScheduling: runSaturdayScheduling
  };
})();
