/**
 * TURBO SCHEDULER ENGINE CHO V3-CLOUDFLARE
 * Tích hợp 100% Thuật toán Simulated Annealing & Multi-pass Backfill từ V2
 * Tự động chạy trên Client Browser trong 0.1s - 0.2s hoặc làm Fallback hoàn hảo
 */

var SchedulerEngine = (typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this)).SchedulerEngine = (function () {
  'use strict';

  // ============================================================
  // 🇻🇳 BỘ GIẢI MÃ BẢNG MÃ TIẾNG VIỆT (TCVN3 / VNI / UNICODE NFD)
  // Tự động nhận diện và khôi phục 100% tiếng Việt từ file HIS Bệnh viện
  // ============================================================
  const TCVN3_MAP = {
    '\u00B5': 'à', '\u00B8': 'á', '\u00B6': 'ả', '\u00B7': 'ã', '\u00B9': 'ạ',
    '\u00A8': 'ă', '\u00BB': 'ằ', '\u00BE': 'ắ', '\u00BC': 'ẳ', '\u00BD': 'ẵ', '\u00C6': 'ặ',
    '\u00A9': 'â', '\u00C7': 'ầ', '\u00CA': 'ấ', '\u00C8': 'ẩ', '\u00C9': 'ẫ', '\u00CB': 'ậ',
    '\u00E8': 'è', '\u00E9': 'é', '\u00CC': 'ẻ', '\u00CE': 'ẽ', '\u00CF': 'ẹ',
    '\u00AA': 'ê', '\u00CD': 'ề', '\u00D0': 'ế', '\u00D1': 'ể', '\u00D2': 'ễ', '\u00D3': 'ệ',
    '\u00EC': 'ì', '\u00ED': 'í', '\u00D4': 'ỉ', '\u00D5': 'ĩ', '\u00D6': 'ị',
    '\u00F2': 'ò', '\u00F3': 'ó', '\u00D7': 'ỏ', '\u00D8': 'õ', '\u00E4': 'ọ',
    '\u00AB': 'ô', '\u00D9': 'ồ', '\u00DA': 'ố', '\u00DB': 'ổ', '\u00DC': 'ỗ', '\u00DD': 'ộ',
    '\u00E5': 'ồ', '\u00E6': 'ộ',
    '\u00AC': 'ơ', '\u00DE': 'ờ', '\u00DF': 'ớ', '\u00E3': 'ở', '\u00E1': 'ữ', '\u00E2': 'ự',
    '\u00F9': 'ù', '\u00FA': 'ú', '\u00E7': 'ủ', '\u00EA': 'ũ', '\u00EB': 'ụ',
    '\u00AD': 'ư', '\u00EE': 'ừ', '\u00F8': 'ứ', '\u00EF': 'ử', '\u00F1': 'ữ', '\u00F4': 'ự',
    '\u00FF': 'ỳ', '\u00FD': 'ý', '\u00F5': 'ỷ', '\u00F6': 'ỹ', '\u00F7': 'ỵ',
    '\u00AE': 'đ', '\u00A7': 'Đ'
  };

  const VNI_PAIRS = [
    ['aù', 'á'], ['aø', 'à'], ['aû', 'ả'], ['aõ', 'ã'], ['aï', 'ạ'],
    ['aé', 'ắ'], ['aè', 'ằ'], ['aú', 'ẳ'], ['aü', 'ẵ'], ['aë', 'ặ'], ['aê', 'ă'],
    ['aá', 'ấ'], ['aà', 'ầ'], ['aå', 'ẩ'], ['aã', 'ẫ'], ['aä', 'ậ'], ['aâ', 'â'],
    ['eù', 'é'], ['eø', 'è'], ['eû', 'ẻ'], ['eõ', 'ẽ'], ['eï', 'ẹ'],
    ['eá', 'ế'], ['eà', 'ề'], ['eå', 'ể'], ['eã', 'ễ'], ['eä', 'ệ'], ['eâ', 'ê'],
    ['où', 'ó'], ['oø', 'ò'], ['oû', 'ỏ'], ['oõ', 'õ'], ['oï', 'ọ'],
    ['oá', 'ố'], ['oà', 'ồ'], ['oå', 'ổ'], ['oã', 'ỗ'], ['oä', 'ộ'], ['oâ', 'ô'],
    ['ôù', 'ớ'], ['ôø', 'ờ'], ['ôû', 'ở'], ['ôõ', 'ỡ'], ['ôï', 'ợ'],
    ['uù', 'ú'], ['uø', 'ù'], ['uû', 'ủ'], ['uõ', 'ũ'], ['uï', 'ụ'],
    ['öù', 'ứ'], ['öø', 'ừ'], ['öû', 'ử'], ['öõ', 'ữ'], ['öï', 'ự'],
    ['yù', 'ý'], ['yø', 'ỳ'], ['yû', 'ỷ'], ['yõ', 'ỹ'],
    ['ô', 'ơ'], ['ö', 'ư'], ['ñ', 'đ'], ['Ñ', 'Đ'], ['î', 'ỵ'],
    ['AÙ', 'Á'], ['AØ', 'À'], ['AÛ', 'Ả'], ['AÕ', 'Ã'], ['AÏ', 'Ạ'],
    ['AÉ', 'Ắ'], ['AÈ', 'Ằ'], ['AÚ', 'Ẳ'], ['AÜ', 'Ẵ'], ['AË', 'Ặ'], ['AÊ', 'Ă'],
    ['AÁ', 'Ấ'], ['AÀ', 'Ầ'], ['AÅ', 'Ẩ'], ['AÃ', 'Ẫ'], ['AÄ', 'Ậ'], ['AÂ', 'Â'],
    ['EÙ', 'É'], ['EØ', 'È'], ['EÛ', 'Ẻ'], ['EÕ', 'Ẽ'], ['EÏ', 'Ẹ'],
    ['EÁ', 'Ế'], ['EÀ', 'Ề'], ['EÅ', 'Ể'], ['EÃ', 'Ễ'], ['EÄ', 'Ệ'], ['EÂ', 'Ê'],
    ['OÙ', 'Ó'], ['OØ', 'Ò'], ['OÛ', 'Ỏ'], ['OÕ', 'Õ'], ['OÏ', 'Ọ'],
    ['OÁ', 'Ố'], ['OÀ', 'Ồ'], ['OÅ', 'Ổ'], ['OÃ', 'Ỗ'], ['OÄ', 'Ộ'], ['OÂ', 'Ô'],
    ['ÔÙ', 'Ớ'], ['ÔØ', 'Ờ'], ['ÔÛ', 'Ở'], ['ÔÕ', 'Ỡ'], ['ÔÏ', 'Ợ'],
    ['UÙ', 'Ú'], ['UØ', 'Ù'], ['UÛ', 'Ủ'], ['UÕ', 'Ũ'], ['UÏ', 'Ụ'],
    ['ÖÙ', 'Ứ'], ['ÖØ', 'Ừ'], ['ÖÛ', 'Ử'], ['ÖÕ', 'Ữ'], ['ÖÏ', 'Ự'],
    ['Ô', 'Ơ'], ['Ö', 'Ư']
  ];

  function decodeVietnameseEncoding(raw) {
    if (!raw && raw !== 0) return '';
    let str = String(raw);

    // 1. Dọn sạch ký tự vô hình, BOM, zero-width space, non-breaking space
    str = str.replace(/[\ufeff\u200b\u200c\u200d\u200e\u200f]/g, '').replace(/\u00a0/g, ' ');

    // 2. Chuyển Unicode NFD sang NFC
    try { str = str.normalize('NFC'); } catch (e) {}

    // 🛡️ BẢO VỆ TUYỆT ĐỐI CHUỖI UNICODE TIẾNG VIỆT CHUẨN:
    // Nếu chuỗi chứa bất kỳ ký tự tiếng Việt Unicode đặc trưng (Ă, ă, Đ, đ, Ĩ, ĩ, Ũ, ũ, Ơ, ơ, Ư, ư hoặc \u1EA0-\u1EF9)
    // và KHÔNG chứa các ký tự chữ ký TCVN3 đặc trưng (\u00A7 - \u00AE), thì chuỗi này 100% đã là Unicode chuẩn!
    const hasStrongTcvn3Char = /[\u00A7\u00A8\u00A9\u00AA\u00AB\u00AC\u00AD\u00AE]/.test(str);
    const hasPureUnicodeVN = /[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]/.test(str);

    if (hasPureUnicodeVN && !hasStrongTcvn3Char) {
      return str.replace(/\s+/g, ' ').trim();
    }

    // 3. Ưu tiên kiểm tra và giải mã VNI nếu có các cặp ký tự VNI đặc trưng (và không có ký tự TCVN3 đặc thù)
    const vniPairRegex = /(?:[aAeEoOuUöÖôÔ][ùøûõïéèúüëáàåãäóò])|(?:[aAeEoO][âêô])|(?:uù|uø|öù|öø)/;
    if (!hasStrongTcvn3Char && (vniPairRegex.test(str) || (/[ñÑ]/.test(str) && !hasPureUnicodeVN))) {
      let vniDecoded = str;
      for (let k = 0; k < VNI_PAIRS.length; k++) {
        const vni = VNI_PAIRS[k][0];
        const uni = VNI_PAIRS[k][1];
        if (vniDecoded.includes(vni)) {
          vniDecoded = vniDecoded.split(vni).join(uni);
        }
      }
      str = vniDecoded;
    }

    // 4. Kiểm tra và giải mã TCVN3 (.VnTime, .VnArial)
    // Chỉ kích hoạt nếu có chữ ký TCVN3 mạnh HOẶC các mẫu từ lỗi đặc thù của TCVN3
    const hasTcvn3Word = /\b(NguyÔn|Thñy|bãp|huyÖt)\b/i.test(str);
    if ((hasStrongTcvn3Char || hasTcvn3Word) && !hasPureUnicodeVN) {
      str = str.replace(/\bNguyÔn\b/g, 'Nguyễn').replace(/\bnguyÔn\b/g, 'nguyễn')
               .replace(/Thñy/gi, 'Thủy').replace(/thñy/gi, 'thủy')
               .replace(/bãp\s*b[Êê]m/gi, 'bóp bấm')
               .replace(/huyÖt/gi, 'huyệt');
      let tcvnDecoded = '';
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        tcvnDecoded += (TCVN3_MAP[ch] !== undefined) ? TCVN3_MAP[ch] : ch;
      }
      str = tcvnDecoded;
    }

    // 5. Chuẩn hóa NFC lần cuối và làm sạch khoảng trắng thừa
    try { str = str.normalize('NFC'); } catch (e) {}
    return str.replace(/\s+/g, ' ').trim();
  }

  function toVietnameseProperCase(raw) {
    if (!raw && raw !== 0) return '';
    const decoded = decodeVietnameseEncoding(raw);
    if (!decoded) return '';
    return decoded.toLowerCase().replace(/(?:^|[\s\-\_\/])\S/g, a => a.toUpperCase());
  }

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

function normalizeScheduleItem(row) {
  if (!row) return null;
  if (Array.isArray(row)) {
    const gioDienRa = String(row[5] || '').trim();
    const isDrop = gioDienRa === '❌ Rớt' || gioDienRa === '--' || gioDienRa.includes('Rớt');
    return {
      ngay: String(row[0] || '').trim(),
      tenBN: String(row[1] || '').trim(),
      namSinh: String(row[2] || '').trim(),
      phong: String(row[3] || '').trim(),
      thuThuat: String(row[4] || '').trim(),
      gioDienRa: gioDienRa,
      gioKetThuc: String(row[6] || '').trim(),
      nvChinh: String(row[7] || '').trim(),
      nvPhu: String(row[8] || '').trim(),
      may: String(row[9] || '').trim(),
      giuong: String(row[10] || '').trim(),
      __isDischarged: false,
      __dropped: isDrop
    };
  }
  const rawGio = String(row.gioDienRa || row.GIODIENRA || row.start_time || row.start || '').trim();
  const isDrop = !!row.__dropped || rawGio === '❌ Rớt' || rawGio === '--' || rawGio.includes('Rớt');
  return {
    ngay: String(row.ngay || row.NGAY || row.date || '').trim(),
    tenBN: String(row.tenBN || row.HOTEN || row.patient_name || row.ten || row.name || '').trim(),
    namSinh: String(row.namSinh || row.NAMSINH || row.dob || row.ns || row.age || '').trim(),
    phong: String(row.phong || row.PHONG || row.room || '').trim(),
    thuThuat: String(row.thuThuat || row.DICHVU || row.procedure_name || row.tt || '').trim(),
    gioDienRa: rawGio,
    gioKetThuc: String(row.gioKetThuc || row.GIOKETTHUC || row.end_time || row.end || '').trim(),
    nvChinh: String(row.nvChinh || row['NV CHÍNH'] || row.staff_name || row.staff || row.nv1 || '').trim(),
    nvPhu: String(row.nvPhu || row['NV PHỤ'] || row.sub_staff_name || row.sub_staff || row.nv2 || '').trim(),
    may: String(row.may || row.MAY || row.machine_name || row.machine || '').trim(),
    giuong: String(row.giuong || row.GIUONG || row.bed || '').trim(),
    __isDischarged: !!row.__isDischarged,
    __dropped: isDrop
  };
}

function isContinuousProcedure(info, duration) {
  if (!info) return false;
  const loaiMay = String(info[0] || 'Thủ công').trim();
  const baseTgMay = parseInt(info[1]) || 15;
  const tgNvMin = parseInt(info[2]) || 5;
  const isExplicit = info[13] === 1 || info[13] === '1' || info[13] === 'Có' || info[13] === true;
  if (isExplicit) return true;
  if (loaiMay === 'Thủ công') return true;
  if (duration !== undefined && !isNaN(duration) && tgNvMin >= duration) return true;
  if (baseTgMay === tgNvMin && tgNvMin >= 10) return true;
  return false;
}

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
  return next <= tNow ? (Math.floor(tNow / 5) + 1) * 5 : next;
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

  if (!db._precomputed) {
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

    const roomStaff = db.roomStaff || {};
    const staffBySkill = {}, baseTimeline = {}, staffShifts = {}, baseLoad = {};
    const staffRole = {}, staffMyRooms = {};

    db.rawStaff.forEach(r => {
      const tenNhanVien = r[0];
      const roleRaw = r[1] || '';
      const isDoc = /bác sĩ|bac si|^bs\b/i.test(roleRaw) || /^bs\b/i.test(tenNhanVien);
      const isNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(roleRaw);
      const normalizedRole = isDoc ? 'Bác sĩ' : (isNurse ? 'Điều dưỡng' : 'Kỹ thuật viên');

      baseTimeline[tenNhanVien] = [];
      staffRole[tenNhanVien] = normalizedRole;

      const kyNangList = r[2] ? String(r[2]).split(",").map(x => x.trim()).filter(Boolean) : [];
      const rawSkillsStr = String(r[2] || '').toLowerCase();
      const hasAll = /cả hai|ca hai|toàn bộ|tat ca|all/i.test(rawSkillsStr);
      const hasYhct = /yhct/i.test(rawSkillsStr);
      const hasPhcn = /phcn/i.test(rawSkillsStr);

      Object.keys(thuThuatInfo).forEach(procKey => {
        const pInfo = thuThuatInfo[procKey];
        if (!pInfo) return;
        const isProcYhct = pInfo[3] === 'YHCT';
        const isProcPhcn = pInfo[3] === 'PHCN';
        const pName = procKey.toLowerCase();
        const pVt = (pInfo[9] || '').trim().toLowerCase();
        const pTenGoc = (pInfo[8] || '').trim().toLowerCase();

        let qualified = false;
        if (hasAll) qualified = true;
        else if (hasYhct && isProcYhct && kyNangList.length === 0) qualified = true;
        else if (hasPhcn && isProcPhcn && kyNangList.length === 0) qualified = true;
        else if (isDoc && isProcYhct && kyNangList.length === 0) qualified = true;
        else if (kyNangList.length > 0) {
          qualified = kyNangList.some(skRaw => {
            const sk = skRaw.toLowerCase();
            if (sk === pName || (pVt && sk === pVt) || (pTenGoc && sk === pTenGoc)) return true;
            if (sk.includes(pName) || pName.includes(sk)) return true;
            if (pVt && (sk.includes(pVt) || pVt.includes(sk))) return true;
            return false;
          });
        }

        if (qualified) {
          const keys = [procKey, pName];
          if (pVt) keys.push(pVt);
          if (pTenGoc) keys.push(pTenGoc);
          keys.forEach(k => {
            if (!staffBySkill[k]) staffBySkill[k] = [];
            if (!staffBySkill[k].includes(tenNhanVien)) staffBySkill[k].push(tenNhanVien);
          });
        }
      });

      kyNangList.forEach(kyNang => {
        const kyNangLower = kyNang.toLowerCase();
        if (!staffBySkill[kyNangLower]) staffBySkill[kyNangLower] = [];
        if (!staffBySkill[kyNangLower].includes(tenNhanVien)) staffBySkill[kyNangLower].push(tenNhanVien);
      });

      const rawShifts = r[3] ? String(r[3]).split(",").filter(s => s.includes("-")).map(s => {
        const pts = s.split("-"); return [t2m(pts[0].trim()), t2m(pts[1].trim())];
      }) : [];
      staffShifts[tenNhanVien] = rawShifts.length > 0 ? rawShifts : defaultShift;

      if (r[4]) {
        String(r[4]).split(",").forEach(slot => {
          if (slot.includes("-")) {
            const tp = slot.includes(")") ? slot.split(")").pop().trim() : slot;
            baseTimeline[tenNhanVien].push([t2m(tp.split("-")[0]), t2m(tp.split("-")[1])]);
          }
        });
      }

      if (staffShifts[tenNhanVien].length > 0) {
        const [caS1, caE1] = staffShifts[tenNhanVien][0];
        if (staffShifts[tenNhanVien].length > 1) {
          const [caS2, caE2] = staffShifts[tenNhanVien][1];
          baseTimeline[tenNhanVien].push([0, caS1], [caE1, caS2], [caE2, 1440]);
        } else {
          baseTimeline[tenNhanVien].push([0, caS1], [caE1, 1440]);
        }
      } else {
        baseTimeline[tenNhanVien].push([0, startOfDay], [endOfDay, 1440]);
      }

      const tongPhutLamViec = staffShifts[tenNhanVien].reduce((acc, ca) => acc + ca[1] - ca[0], 0);
      const tongPhutBan = baseTimeline[tenNhanVien].reduce((acc, slot) => acc + slot[1] - slot[0], 0);
      baseLoad[tenNhanVien] = { shift_mins: tongPhutLamViec, busy_mins: tongPhutBan, skills: kyNangList };
      staffMyRooms[tenNhanVien] = Object.keys(roomStaff).filter(room => (roomStaff[room] || []).includes(tenNhanVien));
      baseTimeline[tenNhanVien] = mergeTimeline(baseTimeline[tenNhanVien]);
    });

    let minShiftStart = 1440, maxShiftEnd = 0;
    Object.values(staffShifts).forEach(caList => {
      if (caList.length > 0) {
        minShiftStart = Math.min(minShiftStart, caList[0][0]);
        maxShiftEnd = Math.max(maxShiftEnd, caList[caList.length - 1][1]);
      }
    });

    db._precomputed = {
      machineRarity,
      staffBySkill,
      baseTimeline,
      staffShifts,
      baseLoad,
      staffRole,
      staffMyRooms,
      minShiftStart,
      maxShiftEnd
    };
  }

  const { machineRarity, staffBySkill, baseTimeline, staffShifts, baseLoad, staffRole, staffMyRooms } = db._precomputed;
  const { machineTypes, roomStaff } = db;
  const staffTimeline = {}, staffLoad = {}, staffLastProc = {}, staffSetupReady = {}, staffCurrentRoom = {};

  db.rawStaff.forEach(r => {
    const tenNhanVien = r[0];
    staffTimeline[tenNhanVien] = (baseTimeline[tenNhanVien] || []).map(slot => [slot[0], slot[1]]);
    const bl = baseLoad[tenNhanVien] || { shift_mins: 480, busy_mins: 0, skills: [] };
    staffLoad[tenNhanVien] = { used_mins: 0, shift_mins: bl.shift_mins, procs_done: {}, busy_mins: bl.busy_mins, skills: bl.skills };
    staffSetupReady[tenNhanVien] = 0;
    staffCurrentRoom[tenNhanVien] = null;
  });

  let minShiftStart = db._precomputed.minShiftStart;
  let maxShiftEnd = db._precomputed.maxShiftEnd;
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

  const cleanStaffStr = s => String(s || '').normalize('NFC').replace(/^(bs|bac si|ktv|dd|đd)\s*\.?\s*/i, '').trim().toLowerCase();

  const resolveStaffKey = rawName => {
    if (!rawName) return null;
    const s = String(rawName).trim();
    if (staffTimeline[s]) return s;
    const clean = cleanStaffStr(s);
    for (const k in staffTimeline) {
      const cleanK = cleanStaffStr(k);
      if (clean && cleanK && (clean === cleanK || clean.endsWith(cleanK) || cleanK.endsWith(clean))) return k;
    }
    return null;
  };

  const resolveMachineKey = rawMay => {
    if (!rawMay || rawMay === 'Thủ công') return null;
    const s = String(rawMay).trim();
    if (machineTimeline[s]) return s;
    const clean = s.toLowerCase().replace(/\s+/g, '');
    for (const k in machineTimeline) {
      if (k.toLowerCase().replace(/\s+/g, '') === clean) return k;
    }
    return null;
  };

  const resolveBedKey = (rawPhong, rawGiuong) => {
    if (!rawPhong || !rawGiuong) return null;
    const pStr = String(rawPhong).trim();
    const gStr = String(rawGiuong).trim();
    if (bedTracker[pStr]?.[gStr]) return { phong: pStr, giuong: gStr };
    const pClean = pStr.toLowerCase().replace(/\s+/g, '');
    let matchedRoom = null;
    for (const r in bedTracker) {
      if (r.toLowerCase().replace(/\s+/g, '') === pClean) {
        matchedRoom = r;
        break;
      }
    }
    if (!matchedRoom) matchedRoom = pStr;
    if (bedTracker[matchedRoom]) {
      if (bedTracker[matchedRoom][gStr]) return { phong: matchedRoom, giuong: gStr };
      const gClean = gStr.toLowerCase().replace(/\s+/g, '');
      for (const b in bedTracker[matchedRoom]) {
        const bClean = b.toLowerCase().replace(/\s+/g, '');
        if (bClean === gClean || bClean.replace(/^giuong|^g/i, '') === gClean.replace(/^giuong|^g/i, '')) {
          return { phong: matchedRoom, giuong: b };
        }
      }
    }
    return null;
  };

  const cleanExisting = (Array.isArray(existingSched) ? existingSched : [])
    .map(normalizeScheduleItem)
    .filter(r => r && r.gioDienRa && r.gioDienRa !== '--' && r.gioDienRa !== '❌ Rớt' && !r.__dropped);

  cleanExisting.forEach(row => {
    const gioStart = t2m(row.gioDienRa), gioEnd = t2m(row.gioKetThuc);
    if (isNaN(gioStart) || isNaN(gioEnd) || gioEnd <= gioStart) return;

    const nvChinh = row.nvChinh, nvPhu = row.nvPhu;
    const may = row.may, phong = row.phong, giuong = row.giuong;
    const patName = String(row.tenBN || '').toUpperCase().trim();
    const patNs = String(row.namSinh || '').trim();
    
    const tenThuThuat = String(row.thuThuat || "").trim().toLowerCase();
    const info = thuThuatInfo[tenThuThuat] || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
    const isManualProc = isContinuousProcedure(info, gioEnd - gioStart);
    const tgNhanVien = isManualProc ? (gioEnd - gioStart) : (parseInt(info[2]) || 5);
    const staffEnd = isManualProc ? gioEnd : Math.min(gioStart + tgNhanVien, gioEnd);
    const hasTeardown = !isManualProc && ((gioEnd - gioStart) > tgNhanVien);
    const tearStart = hasTeardown ? gioEnd : null;
    const tearEnd = hasTeardown ? gioEnd + 1 : null;

    const pushAndMerge = (timeline, key, slot) => { if (!timeline[key]) return; timeline[key].push(slot); timeline[key] = mergeTimeline(timeline[key]); };
    
    const resolvedNvChinh = resolveStaffKey(nvChinh);
    const resolvedNvPhu = resolveStaffKey(nvPhu);

    if (resolvedNvChinh && staffTimeline[resolvedNvChinh]) { 
      pushAndMerge(staffTimeline, resolvedNvChinh, [gioStart, staffEnd]); 
      if (hasTeardown && tearStart !== null) pushAndMerge(staffTimeline, resolvedNvChinh, [tearStart, tearEnd]);
      staffCurrentRoom[resolvedNvChinh] = phong; 
    }
    if (resolvedNvPhu && staffTimeline[resolvedNvPhu]) {
      pushAndMerge(staffTimeline, resolvedNvPhu, [gioStart, staffEnd]);
      if (hasTeardown && tearStart !== null) pushAndMerge(staffTimeline, resolvedNvPhu, [tearStart, tearEnd]);
    }
    
    const resolvedMay = resolveMachineKey(may);
    if (resolvedMay && machineTimeline[resolvedMay]) pushAndMerge(machineTimeline, resolvedMay, [gioStart, gioEnd]);

    const resolvedBed = resolveBedKey(phong, giuong);
    if (resolvedBed && bedTracker[resolvedBed.phong]?.[resolvedBed.giuong]) {
      pushAndMerge(bedTracker[resolvedBed.phong], resolvedBed.giuong, [gioStart, gioEnd]);
    }

    // 🔒 PATIENT LOCK: Update patient busy timeline and last_room for existing schedule
    if (patName) {
      const patObj = patients.find(p => {
        const pName = String(p.name || '').toUpperCase().trim();
        const pNs = String(p.ns || p.namSinh || '').trim();
        const isNameMatch = (pName === patName) || (cleanAndHealPatientName(patName, [pName], true) === pName);
        const isNsMatch = !patNs || !pNs || patNs === pNs || (patNs.length >= 2 && pNs.length >= 2 && patNs.slice(-2) === pNs.slice(-2));
        return isNameMatch && isNsMatch;
      });
      if (patObj) {
        patObj.busy.push([gioStart, gioEnd + 1]);
        patObj.busy = mergeTimeline(patObj.busy);
        if (phong) patObj.last_room = phong;
      }
    }

    // 🔒 STAFF WORKLOAD LOCK: Update staff load minutes and procedure count
    if (resolvedNvChinh && staffLoad[resolvedNvChinh]) {
      staffLoad[resolvedNvChinh].used_mins += (staffEnd - gioStart) + (hasTeardown ? 1 : 0);
      staffLoad[resolvedNvChinh].procs_done[tenThuThuat] = (staffLoad[resolvedNvChinh].procs_done[tenThuThuat] || 0) + 1;
    }
    if (resolvedNvPhu && staffLoad[resolvedNvPhu]) {
      staffLoad[resolvedNvPhu].used_mins += (staffEnd - gioStart) + (hasTeardown ? 1 : 0);
      staffLoad[resolvedNvPhu].procs_done[tenThuThuat] = (staffLoad[resolvedNvPhu].procs_done[tenThuThuat] || 0) + 1;
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
    const baseTgMay = Math.max(info[1], info[2]), canPhu = info[5];
    const tgMayMax = info[10] ? Math.max(info[10], baseTgMay) : baseTgMay;
    const tgNvMin = Math.max(1, info[2] || 5);
    const tgNvMax = info[11] ? Math.max(tgNvMin, info[11]) : tgNvMin;
    const gapMinutes = (info[12] !== undefined && info[12] > 0) ? info[12] : 1;
    const isSupplemental = existingSched && existingSched.length > 0;
    
    const isDienCham = tenThuThuat.toLowerCase().includes('điện châm') || tenThuThuat.toLowerCase() === 'đc' || (info[8] && String(info[8]).toLowerCase().includes('điện châm'));
    
    // Kiểm tra tính chất làm việc liên tục 1:1 (KTV/Bác sĩ làm trực tiếp toàn bộ thời gian thủ thuật, ví dụ: TTG, TTK, XBBH, XBV, HH, SA, CC...)
    const isContinuous = isContinuousProcedure(info);
    
    // Phương án 2: Ưu tiên các mốc chẵn chia hết cho 5 phút trước (chuẩn nghiệp vụ YHCT-PHCN),
    // sau đó mới đến các mốc phút lẻ làm dự phòng để cứu ca không bị rớt.
    function getCandidateDurations(minD, maxD) {
      if (minD >= maxD) return [minD];
      const roundSteps = [minD];
      const oddSteps = [];
      for (let d = minD + 1; d <= maxD; d++) {
        if (d % 5 === 0) {
          roundSteps.push(d);
        } else {
          oddSteps.push(d);
        }
      }
      return isBackfill ? [...roundSteps, ...oddSteps] : roundSteps;
    }

    let candidatePairs = [];
    if (isContinuous) {
      // Đối với thủ thuật liên tục: Thời gian thực hiện (NV bận) BẮT BUỘC BẰNG Thời gian thủ thuật (BN điều trị)
      const minDur = Math.max(baseTgMay, tgNvMin);
      const maxDur = Math.max(tgMayMax, tgNvMax);
      const durCandidates = getCandidateDurations(minDur, maxDur);
      for (const d of durCandidates) {
        candidatePairs.push({ tgMay: d, tgNv: d });
      }
    } else if (tgMayMax > baseTgMay || tgNvMax > tgNvMin) {
      const mCandidates = getCandidateDurations(baseTgMay, tgMayMax);
      const nvCandidates = getCandidateDurations(tgNvMin, tgNvMax);
      for (const m of mCandidates) {
        for (const nv of nvCandidates) {
          if (nv <= m) {
            candidatePairs.push({ tgMay: m, tgNv: nv });
          }
        }
      }
    } else if (isDienCham && (isSupplemental || isBackfill)) {
      [25, 30, 26, 27, 28, 29].forEach(m => candidatePairs.push({ tgMay: m, tgNv: tgNvMin }));
    } else {
      candidatePairs.push({ tgMay: baseTgMay, tgNv: tgNvMin });
    }

    const isYHCT = String(info[3] || "").trim().toUpperCase() === "YHCT";
    const yhctEndLimit = weights.yhctEnd !== undefined ? weights.yhctEnd : 10;
    const allowedOvertimeAtEnd = isYHCT ? yhctEndLimit : OVERTIME_ALLOWANCE;
    const roomsWithWaiting = (typeof _currentRoomsWithWaiting !== 'undefined') ? _currentRoomsWithWaiting : new Set();

    for (const pair of candidatePairs) {
      const tgMay = pair.tgMay;
      const tgNhanVien = pair.tgNv;
      const khoangCach = tgNhanVien + gapMinutes;
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

        const role = (staffRole[tenNV] || '').toLowerCase();
        const isDoc = /bác sĩ|bac si|^bs\b/i.test(role) || /^bs\b/i.test(tenNV);
        const isNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(role);
        const isKtv = !isDoc && !isNurse && (/kỹ thuật viên|ky thuat vien|^ktv\b/i.test(role) || staffRole[tenNV] === 'Kỹ thuật viên');

        // Chỉ BS hoặc KTV mới được làm NV Chính; Điều dưỡng chỉ được làm NV Phụ
        if ((isDoc || isKtv) && !isNurse) {
          candidatesMain.push(tenNV);
          candidatesSub.push(tenNV);
        } else {
          candidatesSub.push(tenNV);
        }
      });
      if (candidatesMain.length === 0) continue;

      candidatesMain.sort((a, b) => {
        const rmA = (staffMyRooms[a] || []).includes(targetRoom) ? 0 : 1, rmB = (staffMyRooms[b] || []).includes(targetRoom) ? 0 : 1;
        if (rmA !== rmB) return rmA - rmB;
        const crA = staffCurrentRoom[a] === targetRoom ? 0 : 1, crB = staffCurrentRoom[b] === targetRoom ? 0 : 1;
        if (crA !== crB) return crA - crB;
        const lpA = staffLastProc[a] === tenThuThuat ? 0 : 1, lpB = staffLastProc[b] === tenThuThuat ? 0 : 1;
        if (lpA !== lpB) return lpA - lpB;
        const isDocA = /bác sĩ|bac si|^bs\b/i.test(staffRole[a] || '');
        const isDocB = /bác sĩ|bac si|^bs\b/i.test(staffRole[b] || '');
        const isKtvA = /kỹ thuật viên|ky thuat vien|^ktv\b/i.test(staffRole[a] || '');
        const isKtvB = /kỹ thuật viên|ky thuat vien|^ktv\b/i.test(staffRole[b] || '');

        const roleA = (info[3] === "PHCN" && isKtvA) || (info[3] === "YHCT" && isDocA) ? 0 : 1;
        const roleB = (info[3] === "PHCN" && isKtvB) || (info[3] === "YHCT" && isDocB) ? 0 : 1;
        if (roleA !== roleB) return roleA - roleB;

        // ✨ TỐI ƯU HÓA LIỀN MẠCH NHÂN SỰ (Workload Continuity):
        // Ưu tiên nhân viên vừa xong ca trước (rảnh 0 - 15 phút) để gom cụm ca liên tục, tránh xé lẻ mốc rảnh
        const getIdleGap = (name) => {
          const tl = staffTimeline[name];
          if (!tl || tl.length === 0) return 999;
          let maxEndBefore = -1;
          for (let i = 0; i < tl.length; i++) {
            if (tl[i][1] <= tNow && tl[i][1] > maxEndBefore) maxEndBefore = tl[i][1];
          }
          return maxEndBefore >= 0 ? (tNow - maxEndBefore) : 999;
        };
        const gapA = getIdleGap(a);
        const gapB = getIdleGap(b);
        const isFreshA = (gapA >= 0 && gapA <= 15) ? 0 : 1;
        const isFreshB = (gapB >= 0 && gapB <= 15) ? 0 : 1;
        if (isFreshA !== isFreshB) return isFreshA - isFreshB;

        // Khi cả 2 cùng trạng thái, chỉ cân bằng tải khi chênh lệch >= 40 phút; ngược lại ưu tiên người có khoảng chờ ngắn hơn để khép kín lịch
        const loadA = staffLoad[a]?.used_mins || 0;
        const loadB = staffLoad[b]?.used_mins || 0;
        if (Math.abs(loadA - loadB) >= 40) return loadA - loadB;
        if (gapA !== gapB) return gapA - gapB;
        return loadA - loadB;
      });

      let possibleMachines = [];
      const loaiMayKey = loaiMay.toLowerCase();
      const roomSpecific = (db.roomMachines?.[targetRoom]?.[loaiMayKey]) || (db.roomMachines?.[targetRoom]?.[loaiMay]) || [];
      if (loaiMay === 'Thủ công') {
        possibleMachines = [loaiMay];
      } else if (roomSpecific.length > 0) {
        possibleMachines = roomSpecific;
      } else {
        possibleMachines = machineTypes[loaiMay] || [];
      }
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
      if (!selectedBed && bedTracker[targetRoom] && Object.keys(bedTracker[targetRoom]).length > 0) {
        const isKeoGian = loaiMay.toLowerCase().includes("kéo giãn");
        const tuKhoaKhongGiuong = ["tập vận", "siêu âm", "cứu", "thủy châm", "điện châm", "hồng ngoại", "xbbh", "xoa bóp", "khí dung"];
        const isFlexibleBed = isKeoGian || tuKhoaKhongGiuong.some(k => tenThuThuat.toLowerCase().includes(k));
        if (isFlexibleBed || isSupplemental || isBackfill) {
          selectedBed = isKeoGian ? "Giường máy Kéo giãn" : "Ghế điều trị / Giường phụ";
        } else {
          continue;
        }
      }

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
            const isNurseA = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(staffRole[a] || '') ? 0 : 1;
            const isNurseB = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(staffRole[b] || '') ? 0 : 1;
            if (isNurseA !== isNurseB) return isNurseA - isNurseB; // Ưu tiên 100% Điều dưỡng làm NV Phụ
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
        const loaiMayKey = loaiMay.toLowerCase();
        const roomSpecific = (db.roomMachines?.[patient.room]?.[loaiMayKey]) || (db.roomMachines?.[patient.room]?.[loaiMay]) || [];
        const macList = roomSpecific.length > 0 ? roomSpecific : (machineTypes[loaiMay] || []);
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
      while (keepTrying) {
        keepTrying = false;
        const eligible = patients.filter(p => p.pending.length > 0 && p.free_at <= tNow && !p.busy.some(b => b[0] <= tNow && tNow < b[1]));
        if (eligible.length === 0) break;

        // ⚡ FAST PRUNING: Tính roomsWithWaiting 1 lần duy nhất cho toàn bộ mốc tNow
        const _currentRoomsWithWaiting = new Set();
        for (let _pi = 0; _pi < eligible.length; _pi++) _currentRoomsWithWaiting.add(eligible[_pi].room);

        // ⚡ Gán độ ưu tiên O(1) theo số lượng thủ thuật còn lại, loại bỏ hàm countFeasibleSlots ngốn 66 triệu phép tính
        eligible.forEach(p => { p._feasible = p.pending.length; });

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
      const dsBacSi = (staffBySkill[tenTT.toLowerCase()] || []).filter(s => /bác sĩ|bac si|^bs\b/i.test(staffRole[s] || ''));
      for (const bacSi of dsBacSi) {
        if (saved) break;
        const caDePHCN = (resultsByStaff.get(bacSi) || []).filter(r => (thuThuatInfo[(r.DICHVU || "").toLowerCase()] || ["", "", "", "PHCN"])[3] === "PHCN");
        for (const caDe of caDePHCN) {
          const timeStart = t2m(caDe.GIODIENRA), timeEnd = t2m(caDe.GIOKETTHUC);
          if (timeStart < minStart || (timeEnd - timeStart) < tgCanThiet) continue;
          if (pat.leave !== 9999 && timeStart + tgCanThiet > pat.leave) continue;
          if (pat.busy.some(b => is_overlap(timeStart, timeStart + tgCanThiet, b[0], b[1]))) continue;
          let ktvThayThe = null;
          // Chỉ KTV có kỹ năng phù hợp mới được làm NV Chính thay thế (loại bỏ Bác sĩ và Điều dưỡng)
          const dsKTV = (staffBySkill[(caDe.DICHVU || "").toLowerCase()] || []).filter(k => {
            const role = (staffRole[k] || '').toLowerCase();
            const isDoc = /bác sĩ|bac si|^bs\b/i.test(role) || /^bs\b/i.test(k);
            const isNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(role);
            return !isDoc && !isNurse;
          });
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

  // Phạt các mốc rảnh lắt nhắt phân mảnh (5 - 30 phút) giữa các ca làm việc của nhân sự
  let fragmentedGapsCount = 0;
  Object.keys(staffTimeline).forEach(nv => {
    const slots = (staffTimeline[nv] || []).filter(s => s[0] >= startOfDay && s[1] <= endOfDay).sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < slots.length - 1; i++) {
      const gap = slots[i + 1][0] - slots[i][1];
      if (gap >= 5 && gap <= 30) fragmentedGapsCount++;
    }
  });
  const gapWeight = weights.gapPenalty !== undefined ? Number(weights.gapPenalty) : 5;
  const scoreVal = finalDropList.length * weights.drop + overtimeMins * weights.overtime + imbalance * weights.imbalance + fragmentedGapsCount * gapWeight;

  results.sort((a, b) => a["NV CHÍNH"] !== b["NV CHÍNH"] ? a["NV CHÍNH"].localeCompare(b["NV CHÍNH"]) : a.t_sort - b.t_sort);
  return { sched: results, rot: finalDropList, score: scoreVal, staff: staffLoad, proc: localProcCount, tl: staffTimeline, ca: staffShifts };
}

function getPatientSignature(pat) {
    if (!pat) return '';
    return (pat.name || pat.pId || '') + '_' + (pat.pending ? pat.pending.join('|') : '');
  }

  function runBestIteration(db, dateVal, existingSched = [], scenario = 1, crowdedOverride = -1, weights = { drop: 10000, overtime: 2, imbalance: 0.1 }, baseSeed = 42, maxSteps = null) {
    let bestSched = null;
    let bestRot = null;
    let bestScore = Infinity;

    const patCount = (db && db.rawPatients) ? db.rawPatients.length : 0;
    const actualMaxSteps = (typeof maxSteps === 'number' && maxSteps > 0)
      ? maxSteps
      : (patCount > 60 ? 2 : 2);

    // 🤖 AI Smart Patient Ranking: Xếp thứ tự ban đầu theo định lượng AI
    let initialPatients = db.rawPatients;
    if (typeof window !== 'undefined' && window.AIScheduler && typeof window.AIScheduler.rankPatients === 'function') {
      initialPatients = window.AIScheduler.rankPatients(db.rawPatients, {}, db.thuThuatInfo || {});
    }

    let currentOrder = clonePatients(initialPatients);
    let currentRes = _turbo_core_logic(db, dateVal, baseSeed, existingSched, scenario, crowdedOverride, weights);
    if (currentRes) {
      bestSched = currentRes.sched;
      bestRot = currentRes.rot;
      bestScore = currentRes.score;
    }

    // ⚡ ULTRA FAST EARLY EXIT:
    // Bước 0 đã dùng AI Smart Patient Ranking tối ưu nhất, nếu chỉ còn rớt <= 3 ca thì dừng ngay lập tức!
    // Pha 2 (Toán học CP-SAT Math Optimizer) sẽ giải cứu các ca này trong 20ms!
    if (bestRot && bestRot.length <= 3) {
      return {
        sched: bestSched,
        rot: bestRot,
        score: bestScore
      };
    }

    // Tabu Search State List (FIFO size 30)
    const tabuList = [];
    const maxTabuSize = 30;

    // Late Acceptance Hill Climbing (LAHC buffer L=5)
    const lahcLength = 5;
    const lahcBuffer = new Array(lahcLength).fill(bestScore);
    let lahcIdx = 0;

    for (let step = 0; step < actualMaxSteps; step++) {
      const stepSeed = (baseSeed * 1000 + step * 37) % 2147483647;
      const randFn = createSeededRandom(stepSeed);
      const droppedNames = bestRot ? bestRot.map(r => String(r.bn || r.tenBN || r.name || '').toUpperCase()) : [];
      const candidateOrder = mutate(currentOrder, randFn, droppedNames);
      
      const sig = candidateOrder.map(p => getPatientSignature(p)).slice(0, 15).join(';');
      const isTabu = tabuList.includes(sig);

      db.rawPatients = candidateOrder;
      const res = _turbo_core_logic(db, dateVal, baseSeed + step * 7 + 1, existingSched, scenario, crowdedOverride, weights);

      if (res) {
        // Aspiration Criterion: vượt tabu nếu điểm tốt hơn kỷ lục toàn cục
        if (!isTabu || res.score < bestScore) {
          const lahcThreshold = lahcBuffer[lahcIdx];
          if (res.score <= lahcThreshold || res.score <= bestScore) {
            currentOrder = candidateOrder;
            lahcBuffer[lahcIdx] = res.score;
            lahcIdx = (lahcIdx + 1) % lahcLength;

            tabuList.push(sig);
            if (tabuList.length > maxTabuSize) tabuList.shift();
          }

          if (res.score < bestScore) {
            bestScore = res.score;
            bestSched = res.sched;
            bestRot = res.rot;
          }
        }
      }

      // ⚡ Early Exit: Nếu đã xếp thành công 100% không rớt ca nào hoặc chỉ còn <= 3 ca rớt
      if (bestRot && bestRot.length <= 3) {
        break;
      }
    }

    return {
      sched: bestSched,
      rot: bestRot,
      score: bestScore
    };
  }

  /**
   * ⚡ THUẬT TOÁN DỒN LỊCH KHÉP KÍN KHOẢNG TRỐNG (LEFT-SHIFT COMPACTION)
   * Tự động phát hiện và co cụm các ca làm việc rải rác, lùi sớm thời gian để xóa bỏ các mốc rảnh lắt nhắt
   * Tuân thủ 100% không vi phạm ràng buộc: Bệnh nhân, NV Chính, NV Phụ, Máy, Giường, Giờ vào, Giờ trưa
   */
  function compactTimelineGaps(scheduleList, db) {
    if (!scheduleList || scheduleList.length <= 1) return scheduleList || [];

    const sched = scheduleList.map(item => ({
      ...item,
      _s: t2m(item.gioDienRa),
      _e: t2m(item.gioKetThuc),
      _dur: t2m(item.gioKetThuc) - t2m(item.gioDienRa)
    }));

    sched.sort((a, b) => a._s - b._s);

    const patInfoMap = new Map();
    if (db && Array.isArray(db.rawPatients)) {
      db.rawPatients.forEach(p => {
        const key = (p.name || '').trim().toUpperCase() + '_' + String(p.ns || '').trim();
        patInfoMap.set(key, p);
      });
    }

    const LUNCH_START = 690; // 11:30
    const LUNCH_END = 780;   // 13:00

    for (let i = 0; i < sched.length; i++) {
      const cur = sched[i];
      if (cur._dur <= 0) continue;

      const patKey = (cur.tenBN || cur.HOTEN || '').trim().toUpperCase() + '_' + String(cur.namSinh || cur.NAMSINH || '').trim();
      const patDb = patInfoMap.get(patKey);
      const patArrive = patDb ? (patDb.arrive || 420) : 420;

      let minAllowedStart = Math.max(420, patArrive);
      if (cur._s >= LUNCH_END) {
        minAllowedStart = Math.max(minAllowedStart, LUNCH_END);
      }

      let bestStart = cur._s;

      for (let testStart = cur._s - 5; testStart >= minAllowedStart; testStart -= 5) {
        const testEnd = testStart + cur._dur;

        if (cur._s < LUNCH_START && testEnd > LUNCH_START) continue;
        if (testStart < LUNCH_END && testEnd > LUNCH_START && cur._s >= LUNCH_END) continue;

        let conflict = false;
        for (let j = 0; j < sched.length; j++) {
          if (i === j) continue;
          const other = sched[j];

          // 1. Kiểm tra Bệnh nhân
          const otherPatKey = (other.tenBN || other.HOTEN || '').trim().toUpperCase() + '_' + String(other.namSinh || other.NAMSINH || '').trim();
          if (patKey === otherPatKey && is_overlap(testStart, testEnd, other._s, other._e)) {
            conflict = true; break;
          }

          // 2. Kiểm tra NV Chính & NV Phụ
          if (cur.nvChinh && (cur.nvChinh === other.nvChinh || cur.nvChinh === other.nvPhu)) {
            if (is_overlap(testStart, testEnd, other._s, other._e)) { conflict = true; break; }
          }
          if (cur.nvPhu && (cur.nvPhu === other.nvChinh || cur.nvPhu === other.nvPhu)) {
            if (is_overlap(testStart, testEnd, other._s, other._e)) { conflict = true; break; }
          }

          // 3. Kiểm tra Máy móc
          if (cur.may && other.may && cur.may !== 'Thủ công' && other.may !== 'Thủ công' && cur.may === other.may) {
            if (is_overlap(testStart, testEnd, other._s, other._e)) { conflict = true; break; }
          }

          // 4. Kiểm tra Giường
          if (cur.phong && other.phong && cur.phong === other.phong && cur.giuong && other.giuong && cur.giuong === other.giuong) {
            if (is_overlap(testStart, testEnd, other._s, other._e)) { conflict = true; break; }
          }
        }

        // 5. Kiểm tra mốc bận của bệnh nhân
        if (!conflict && patDb && patDb.busy && Array.isArray(patDb.busy)) {
          for (let bIdx = 0; bIdx < patDb.busy.length; bIdx++) {
            const b = patDb.busy[bIdx];
            if (is_overlap(testStart, testEnd, b[0], b[1])) { conflict = true; break; }
          }
        }

        if (conflict) {
          break;
        } else {
          bestStart = testStart;
        }
      }

      if (bestStart < cur._s) {
        cur._s = bestStart;
        cur._e = bestStart + cur._dur;
        cur.gioDienRa = m2t(cur._s);
        cur.gioKetThuc = m2t(cur._e);
      }
    }

    return sched.map(item => {
      const res = { ...item };
      delete res._s;
      delete res._e;
      delete res._dur;
      return res;
    });
  }

  /**
   * 🛡️ BỘ LỌC HẬU KIỂM TRA VA CHẠM (COLLISION POST-VALIDATOR)
   * Đảm bảo 100% không bao giờ có ca bổ sung nào bị trùng giờ Bệnh nhân / Nhân viên / Máy móc / Giường với lịch cũ.
   */
  function validateNoOverlapWithExisting(schedCandidate, existingSched, dbRef = null) {
    if (!existingSched || existingSched.length === 0 || !schedCandidate || schedCandidate.length === 0) {
      return { cleanSched: schedCandidate || [], collisionDrops: [] };
    }

    const cleanStaffStr = s => String(s || '').normalize('NFC').replace(/^(bs|bac si|ktv|dd|đd)\s*\.?\s*/i, '').trim().toLowerCase();
    const cleanSched = [];
    const collisionDrops = [];

    const cleanExisting = (Array.isArray(existingSched) ? existingSched : [])
      .map(normalizeScheduleItem)
      .filter(r => r && r.gioDienRa && r.gioDienRa !== '--' && r.gioDienRa !== '❌ Rớt' && !r.__dropped);

    const existingList = cleanExisting.map(row => {
      const s = t2m(row.gioDienRa);
      const e = t2m(row.gioKetThuc);
      const tt = String(row.thuThuat || '').trim().toLowerCase();
      const ttInfo = dbRef?.thuThuatInfo ? dbRef.thuThuatInfo[tt] : null;
      const isContinuous = isContinuousProcedure(ttInfo, e - s);
      const tgNv = isContinuous ? (e - s) : (ttInfo ? (parseInt(ttInfo[2]) || 5) : 5);
      const staffEnd = isContinuous ? e : Math.min(s + tgNv, e);
      const hasTeardown = !isContinuous && ((e - s) > tgNv);

      return {
        name: String(row.tenBN || '').toUpperCase().trim(),
        ns: String(row.namSinh || '').trim(),
        s, e,
        staffEnd,
        hasTeardown,
        nv1: cleanStaffStr(row.nvChinh),
        nv2: cleanStaffStr(row.nvPhu),
        may: String(row.may || '').toLowerCase().replace(/\s+/g, ''),
        phong: String(row.phong || '').toLowerCase().replace(/\s+/g, ''),
        giuong: String(row.giuong || '').toLowerCase().replace(/\s+/g, '').replace(/^giuong|^g/i, '')
      };
    }).filter(r => !isNaN(r.s) && !isNaN(r.e) && r.e > r.s);

    const isOverlap = (s1, e1, s2, e2) => Math.max(s1, s2) < Math.min(e1, e2);

    for (const rawCand of schedCandidate) {
      const cand = normalizeScheduleItem(rawCand);
      if (!cand) continue;
      const cS = t2m(cand.gioDienRa);
      const cE = t2m(cand.gioKetThuc);
      const cName = String(cand.tenBN || '').toUpperCase().trim();
      const cNs = String(cand.namSinh || '').trim();
      const cNv1 = cleanStaffStr(cand.nvChinh);
      const cNv2 = cleanStaffStr(cand.nvPhu);
      const cMay = String(cand.may || '').toLowerCase().replace(/\s+/g, '');
      const cPhong = String(cand.phong || '').toLowerCase().replace(/\s+/g, '');
      const cGiuong = String(cand.giuong || '').toLowerCase().replace(/\s+/g, '').replace(/^giuong|^g/i, '');

      const cTenTT = String(cand.thuThuat || '').trim().toLowerCase();
      const cInfo = dbRef?.thuThuatInfo ? dbRef.thuThuatInfo[cTenTT] : null;
      const cIsContinuous = isContinuousProcedure(cInfo, cE - cS);
      const cTgNv = cIsContinuous ? (cE - cS) : (cInfo ? (parseInt(cInfo[2]) || 5) : 5);
      const cStaffEnd = cIsContinuous ? cE : Math.min(cS + cTgNv, cE);
      const cHasTeardown = !cIsContinuous && ((cE - cS) > cTgNv);

      let collisionReason = null;
      for (const ex of existingList) {
        // 1. Kiểm tra va chạm Bệnh nhân (không thể làm 2 thủ thuật cùng lúc)
        if (isOverlap(cS, cE, ex.s, ex.e)) {
          const isNameMatch = (cName && ex.name && (cName === ex.name || cleanAndHealPatientName(ex.name, [cName], true) === cName));
          const isNsMatch = (!cNs || !ex.ns || cNs === ex.ns || (cNs.length >= 2 && ex.ns.length >= 2 && cNs.slice(-2) === ex.ns.slice(-2)));
          if (isNameMatch && isNsMatch) {
            collisionReason = `Trùng giờ với thủ thuật đã xếp trước đó của bệnh nhân (${m2t(ex.s)}-${m2t(ex.e)})`;
            break;
          }
        }

        // 2. Kiểm tra va chạm Nhân sự (chỉ tính khoảng thời gian KTV trực tiếp làm việc: setup + teardown)
        const checkStaffOverlap = (candStaff) => {
          if (!candStaff) return false;
          if (candStaff !== ex.nv1 && candStaff !== ex.nv2) return false;
          if (isOverlap(cS, cStaffEnd, ex.s, ex.staffEnd)) return true;
          if (cHasTeardown && isOverlap(cE, cE + 1, ex.s, ex.staffEnd)) return true;
          if (ex.hasTeardown && isOverlap(cS, cStaffEnd, ex.e, ex.e + 1)) return true;
          if (cHasTeardown && ex.hasTeardown && isOverlap(cE, cE + 1, ex.e, ex.e + 1)) return true;
          return false;
        };

        if (checkStaffOverlap(cNv1) || checkStaffOverlap(cNv2)) {
          collisionReason = `Nhân sự đã có lịch với ca khác (${m2t(ex.s)}-${m2t(ex.e)})`;
          break;
        }

        // 3. Kiểm tra va chạm Máy móc (máy bận toàn bộ từ đầu đến cuối)
        if (isOverlap(cS, cE, ex.s, ex.e)) {
          if (cMay && cMay !== 'thucong' && ex.may && ex.may !== 'thucong' && cMay === ex.may) {
            collisionReason = `Máy móc ${cand.may} đã bận (${m2t(ex.s)}-${m2t(ex.e)})`;
            break;
          }
          if (cPhong && ex.phong && cPhong === ex.phong && cGiuong && ex.giuong && cGiuong === ex.giuong) {
            collisionReason = `Giường ${cand.giuong} (${cand.phong}) đã có người (${m2t(ex.s)}-${m2t(ex.e)})`;
            break;
          }
        }
      }

      if (collisionReason) {
        collisionDrops.push({
          ngay: cand.ngay,
          pId: cand.pId || '',
          bn: cand.tenBN,
          ns: cand.namSinh,
          room: cand.phong,
          tt: cand.thuThuat,
          reason: collisionReason,
          causeTitle: "Xung đột lịch đã xếp",
          causeDetail: collisionReason,
          advices: ["Chọn khung giờ khác hoặc điều phối nhân sự/máy móc thay thế"]
        });
      } else {
        cleanSched.push(rawCand);
      }
    }

    return { cleanSched, collisionDrops };
  }
function getSafeCache() {
    let cache = (typeof dataCache !== 'undefined' && dataCache) ? dataCache : (window.dataCache || null);
    if (!cache || !cache.staff || !cache.staff.length) {
      try {
        const cacheKey = typeof window !== 'undefined' && typeof window.getBootstrapCacheKey === 'function'
          ? window.getBootstrapCacheKey()
          : ('times_bootstrap_cache_' + (localStorage.getItem('pm_unit_code') || 'bvtks-cs2'));
        const str = localStorage.getItem(cacheKey) || localStorage.getItem('times_bootstrap_cache');
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

  /**
   * 🛡️ TỰ PHỤC HỒI HỌ TÊN BỆNH NHÂN TOÀN DIỆN (SELF-HEALING PATIENT NAMES ENGINE)
   * Tự động phát hiện và chữa lành các lỗi ký tự lạ (\uFFFD, \u0000, dấu hỏi lạ) và lỗi nuốt chữ
   * (như Trn -> Trần, Cưng -> Cường, Lnh -> Lãnh, Nguyn -> Nguyễn, Phm -> Phạm, v.v.)
   * Hỗ trợ đối chiếu candidate lịch cũ/CSDL và bộ từ điển âm tiết tiếng Việt chính xác.
   */
  function cleanAndHealPatientName(rawName, candidates = [], forceUpperCase = false) {
    if (!rawName) return '';
    let name = decodeVietnameseEncoding(rawName);
    if (!name) return '';

    const isAllUpper = (name === name.toUpperCase() && /[A-ZÀ-Ỹ]/.test(name));
    const shouldUpper = forceUpperCase || isAllUpper;

    const hasCorruptChar = /[\ufffd\u0000]/.test(name) || /\b[A-Za-zÀ-ỹ]+\?[A-Za-zÀ-ỹ]+\b/.test(name);
    const hasSwallowedVowel = /\b(Trn|Cưng|Lnh|Nguyn|Phm)\b/i.test(name) ||
      /\bTr[\ufffd\s\?]*n\b/i.test(name) ||
      /\bL[\ufffd\s\?]*nh\b/i.test(name) ||
      /\bC[\ufffd\s\?]*ng\b/i.test(name) ||
      /\bNguy[\ufffd\s\?]*n\b/i.test(name) ||
      /\bPh[\ufffd\s\?]*m\b/i.test(name);

    // Nếu tên hoàn toàn bình thường, trả về theo định dạng yêu cầu
    if (!hasCorruptChar && !hasSwallowedVowel) {
      return shouldUpper ? name.toUpperCase() : toVietnameseProperCase(name);
    }

    // Helper: Bỏ dấu tiếng Việt phục vụ so sánh mờ
    const stripTones = (str) => {
      if (!str) return '';
      return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').trim().toLowerCase();
    };

    // 1. Đối chiếu danh sách ứng viên (candidates) nếu có
    const candList = Array.isArray(candidates) ? candidates : [];
    for (const cand of candList) {
      if (!cand) continue;
      const cleanCand = String(cand).normalize('NFC').trim();
      if (/[\ufffd\u0000]/.test(cleanCand) || /\b(Trn|Cưng|Lnh)\b/i.test(cleanCand)) continue;

      // So khớp wildcard trên chuỗi không dấu
      const noToneName = stripTones(name.replace(/[\ufffd\u0000\?]+/g, ' '));
      const noToneCand = stripTones(cleanCand);
      const wildcardPattern = '^' + noToneName
        .replace(/\btrn\b/gi, 'tr.*n')
        .replace(/\bcung\b/gi, 'c.*ng')
        .replace(/\blnh\b/gi, 'l.*nh')
        .replace(/\bnguyn\b/gi, 'nguy.*n')
        .replace(/\bphm\b/gi, 'ph.*m')
        .replace(/\bth\b/gi, 'th.*')
        .replace(/\bvan\b/gi, 'v.*n')
        .replace(/\s+/g, '\\s+') + '$';
      try {
        if (new RegExp(wildcardPattern, 'i').test(noToneCand)) {
          return shouldUpper ? cleanCand.toUpperCase() : toVietnameseProperCase(cleanCand);
        }
      } catch (e) {}

      // So khớp theo âm tiết không dấu
      if (noToneName && noToneCand) {
        if (noToneName === noToneCand) {
          return shouldUpper ? cleanCand.toUpperCase() : toVietnameseProperCase(cleanCand);
        }
        const nameTokens = noToneName.split(/\s+/).filter(t => t.length >= 2);
        const candTokens = noToneCand.split(/\s+/).filter(t => t.length >= 2);
        const matchedTokens = nameTokens.filter(t => candTokens.includes(t));
        if (nameTokens.length >= 2 && matchedTokens.length >= nameTokens.length - 1) {
          return shouldUpper ? cleanCand.toUpperCase() : toVietnameseProperCase(cleanCand);
        }
      }
    }

    // 2. Bộ từ điển âm tiết tiếng Việt chính xác (chữa lành chuẩn ngữ âm, không nuốt chữ)
    let healed = name;

    // Họ Trần: Trn / Trn / Tr?n -> Trần
    healed = healed.replace(/\bTr[\ufffd\s\?]*n\b/gi, 'Trần');
    healed = healed.replace(/\bTrn\b/gi, 'Trần');

    // Họ Lãnh: Lnh / Lnh / L?nh -> Lãnh
    healed = healed.replace(/\bL[\ufffd\s\?]*nh\b/gi, 'Lãnh');
    healed = healed.replace(/\bLnh\b/gi, 'Lãnh');

    // Tên Cường: Cng / Cưng / C?ng -> Cường
    healed = healed.replace(/\bC[\ufffd\s\?]*ng\b/gi, 'Cường');
    healed = healed.replace(/\bCưng\b/gi, 'Cường');

    // Họ Nguyễn: Nguyn / Nguyn / Nguy?n -> Nguyễn
    healed = healed.replace(/\bNguy[\ufffd\s\?]*n\b/gi, 'Nguyễn');
    healed = healed.replace(/\bNguyn\b/gi, 'Nguyễn');

    // Họ Phạm: Phm / Phm / Ph?m -> Phạm
    healed = healed.replace(/\bPh[\ufffd\s\?]*m\b/gi, 'Phạm');
    healed = healed.replace(/\bPhm\b/gi, 'Phạm');

    // Đệm Thị: Th? / Th -> Thị
    healed = healed.replace(/\bTh[\ufffd\?]+(?=\s+|$)/gi, 'Thị');

    // Đệm Văn: V?n / Vn / Vn -> Văn
    healed = healed.replace(/\bV[\ufffd\?]+n\b/gi, 'Văn');
    healed = healed.replace(/\bVn\b/gi, 'Văn');

    // Đệm Đình: D?nh / Dnh -> Đình
    healed = healed.replace(/\bD[\ufffd\?]*nh\b/gi, 'Đình');

    // Đệm Đức: D?c / Dc -> Đức
    healed = healed.replace(/\bD[\ufffd\?]*c\b/gi, 'Đức');

    // Họ/Tên Hoàng: Hong -> Hoàng
    healed = healed.replace(/\bHo[\ufffd\s\?]*ng\b/gi, 'Hoàng');

    // Tên Hồng (sau Văn / Thị): Văn Hng -> Văn Hồng
    healed = healed.replace(/(Văn|Thị)\s+H[\ufffd\s\?]*ng\b/gi, '$1 Hồng');

    // Dọn sạch các ký tự \ufffd, \u0000 còn sót nếu có
    healed = healed.replace(/[\ufffd\u0000]/g, '').replace(/\s+/g, ' ').trim();

    // Chuẩn hóa Title Case hoặc UPPERCASE
    if (shouldUpper) {
      return healed.toUpperCase();
    }
    return toVietnameseProperCase(healed);
  }

  function buildDbFromCache(cacheInput, skipProcsStr, existingSched = []) {
    const cache = cacheInput || getSafeCache();

    const database = {
      machineTypes: {},
      roomMachines: {},
      machineToRoom: {},
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
      const rawVaiTro = s.vaiTro || s.role || s[2] || "";
      let vaiTro = "Kỹ thuật viên";
      if (/bác sĩ|bac si|^bs\b/i.test(rawVaiTro) || /^bs\b/i.test(ten)) {
        vaiTro = "Bác sĩ";
      } else if (/điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(rawVaiTro)) {
        vaiTro = "Điều dưỡng";
      } else if (/kỹ thuật viên|ky thuat vien|^ktv\b/i.test(rawVaiTro)) {
        vaiTro = "Kỹ thuật viên";
      } else {
        vaiTro = rawVaiTro || "Kỹ thuật viên";
      }
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
      const tgNvMin = parseInt(p.thoiGianThucHienMin || p.thoiGianThucHien || p[6]) || 5;
      let tgNvMax = parseInt(p.thoiGianThucHienMax || p[13] || 0) || tgNvMin;
      if (!tgNvMax || tgNvMax <= tgNvMin) tgNvMax = tgNvMin;

      const tgMayMin = parseInt(p.thoiGianThuThuatMin || p.thoiGianThuThuat || p[7]) || 15;
      let tgMayMax = parseInt(p.thoiGianThuThuatMax || p[12] || 0) || 0;
      if (!tgMayMax || tgMayMax <= tgMayMin) {
        if (ten.includes('điện châm') || ten === 'đc' || ten === 'dctb') {
          if (tgMayMin === 25) tgMayMax = 30;
          else if (tgMayMin === 30) tgMayMax = 35;
        } else if (ten.includes('parafin') || ten === 'pa') {
          if (tgMayMin === 20) tgMayMax = 25;
        } else {
          tgMayMax = tgMayMin;
        }
      }
      const rawKc = parseInt(p.khoangCach || p[8]);
      const gapMinutes = (!isNaN(rawKc) && rawKc > 0) ? (rawKc > tgNvMin ? rawKc - tgNvMin : rawKc) : 1;
      const khoangCachBase = tgNvMin + gapMinutes;
      const dsPhuStr = p.dsNguoiPhu || p[11] || "";
      const dsPhu = Array.isArray(dsPhuStr) ? dsPhuStr : String(dsPhuStr).split(",").map(x => x.trim()).filter(Boolean);

      const isLienTuc = (p.lienTuc === 'Có' || p.lienTuc === 1 || p.lienTuc === '1' || p.lienTuc === true || p[14] === 'Có' || p[14] === 1 || p[14] === '1') ? 1 : 0;

      database.thuThuatInfo[ten] = [
        p.may || p[5] || "Thủ công",
        Math.max(1, tgMayMin),
        Math.max(1, tgNvMin),
        p.he || p[3] || "PHCN",
        (p.canRutMay === "Có" || p[9] === "Có" || p.canRutMay === 1 || p.canRutMay === "1" || p.canRutMay === true) ? 1 : 0,
        (p.canNguoiPhu === "Có" || p[10] === "Có" || p.canNguoiPhu === 1 || p.canNguoiPhu === "1" || p.canNguoiPhu === true) ? 1 : 0,
        dsPhu,
        khoangCachBase,
        p.ten || p.name || p[1] || "",
        p.vietTat || p[2] || "",
        Math.max(1, Math.max(tgMayMin, tgMayMax)),
        Math.max(1, Math.max(tgNvMin, tgNvMax)),
        gapMinutes,
        isLienTuc
      ];
      const vietTat = String(p.vietTat || p[2] || "").trim().toLowerCase();
      if (vietTat && !database.thuThuatInfo[vietTat]) {
        database.thuThuatInfo[vietTat] = database.thuThuatInfo[ten];
      }
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

      const dsMayStr = String(r.danhSachMay || r[4] || "").trim();
      database.roomMachines[roomName] = {};
      if (dsMayStr) {
        dsMayStr.split(',').map(x => x.trim()).filter(Boolean).forEach(code => {
          database.machineToRoom[code] = roomName;
          const mObj = (cache.machine || cache.machines || []).find(m => String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || m.ma || m.code || '').trim().toLowerCase() === code.toLowerCase());
          const mType = (mObj ? String(mObj.tenLoai || mObj.ten_loai || (Array.isArray(mObj) ? mObj[1] : '') || mObj.ten || mObj.name || '') : '').trim().toLowerCase();
          if (mType) {
            if (!database.roomMachines[roomName][mType]) database.roomMachines[roomName][mType] = [];
            database.roomMachines[roomName][mType].push(code);
          }
        });
      }

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

    // Thu thập danh sách họ tên bệnh nhân sạch từ existingSched và cache.pat để đối chiếu phục hồi
    const validPatientCandidates = [];
    const cleanExisting = (Array.isArray(existingSched) ? existingSched : [])
      .map(normalizeScheduleItem)
      .filter(r => r && r.gioDienRa && r.gioDienRa !== '--' && r.gioDienRa !== '❌ Rớt' && !r.__dropped);

    cleanExisting.forEach(r => {
      const n = String(r.tenBN || '').normalize('NFC').trim();
      if (n && !n.includes('\ufffd') && !validPatientCandidates.includes(n)) validPatientCandidates.push(n);
    });
    patList.forEach(p => {
      const n = String(p?.ten || p?.name || (Array.isArray(p) ? p[1] : '') || '').normalize('NFC').trim();
      if (n && !n.includes('\ufffd') && !validPatientCandidates.includes(n)) validPatientCandidates.push(n);
    });

    patList.forEach((p, idx) => {
      let rawPName = String(p.ten || p.name || p[1] || "").normalize('NFC').trim().toUpperCase();
      if (!rawPName) return;
      const pNs = String(p.namSinh || p.age || p[2] || "").trim();
      let pRoom = String(p.phong || p[7] || "").trim();
      if (!pRoom || !database.roomBeds[pRoom]) {
        const availRooms = Object.keys(database.roomBeds);
        if (availRooms.length > 0) {
          pRoom = availRooms[0];
          if (p && typeof p === 'object' && !Array.isArray(p)) p.phong = pRoom;
        }
      }

      // Phục hồi họ tên nếu phát hiện ký tự lạ
      const matchedCandidates = validPatientCandidates.filter(c => {
        const cUp = c.toUpperCase();
        return (cUp === rawPName) || cleanExisting.some(r => {
          const rName = String(r.tenBN || '').toUpperCase().trim();
          const rNs = String(r.namSinh || '').trim();
          const rRoom = String(r.phong || '').trim();
          return rName === cUp && (!pNs || !rNs || pNs === rNs) && (!pRoom || !rRoom || pRoom === rRoom);
        });
      });

      const pName = cleanAndHealPatientName(rawPName, matchedCandidates.length > 0 ? matchedCandidates : validPatientCandidates, true);
      const titleCaseName = cleanAndHealPatientName(p.ten || p.name || rawPName, matchedCandidates.length > 0 ? matchedCandidates : validPatientCandidates, false);
      if (p.ten && p.ten !== titleCaseName) p.ten = titleCaseName;
      if (p.name && p.name !== titleCaseName) p.name = titleCaseName;
      if (Array.isArray(p) && p[1] && p[1] !== titleCaseName) p[1] = titleCaseName;

      const pId = p.id || (pName + "_" + pNs + "_" + pRoom + "_" + idx);
      const key = pId;
      if (seen.has(key)) return;
      seen.add(key);

      const ttStr = p.thuThuat || p.procedures || p.dsThuThuat || p.dsDichVu || p[8] || "";
      let procs = Array.isArray(ttStr) ? ttStr : String(ttStr).split(",").map(x => x.trim()).filter(Boolean);
      if (!procs.length) return;

      // Nếu đang xếp bổ sung (có existingSched), loại bỏ các thủ thuật CỦA BỆNH NHÂN NÀY đã được xếp lịch trước đó (khớp theo số lượng)
      const existingPatRows = [];
      if (cleanExisting && cleanExisting.length > 0) {
        const scheduledProcsForPat = cleanExisting
          .filter(r => {
            if (!r) return false;
            let rawRName = String(r.tenBN || '').normalize('NFC').trim();
            let rNameUpper = cleanAndHealPatientName(rawRName, [pName, ...validPatientCandidates], true);
            const rNs = String(r.namSinh || '').trim();
            const rGio = String(r.gioDienRa || '');

            const isNameMatch = (rNameUpper === pName) || (rawRName.toUpperCase() === pName);
            const isNsMatch = !pNs || !rNs || pNs === rNs || (pNs.length >= 2 && rNs.length >= 2 && pNs.slice(-2) === rNs.slice(-2));

            const isMatched = isNameMatch && isNsMatch && rGio !== '❌ Rớt' && rGio !== '--';
            if (isMatched) existingPatRows.push(r);
            return isMatched;
          })
          .map(r => String(r.thuThuat || '').trim().toLowerCase());

        const remainingProcs = [];
        const copyScheduled = [...scheduledProcsForPat];
        const matchProcName = (pr1, pr2) => {
          if (!pr1 || !pr2) return false;
          const s1 = String(pr1).trim().toLowerCase();
          const s2 = String(pr2).trim().toLowerCase();
          if (s1 === s2) return true;
          const info1 = database.thuThuatInfo[s1];
          const info2 = database.thuThuatInfo[s2];
          const n1 = info1 ? String(info1[8] || '').trim().toLowerCase() : s1;
          const n2 = info2 ? String(info2[8] || '').trim().toLowerCase() : s2;
          if (n1 && n2 && n1 === n2) return true;
          const vt1 = info1 ? String(info1[9] || '').trim().toLowerCase() : '';
          const vt2 = info2 ? String(info2[9] || '').trim().toLowerCase() : '';
          if (vt1 && (vt1 === s2 || vt1 === vt2)) return true;
          if (vt2 && (vt2 === s1 || vt2 === vt1)) return true;
          return false;
        };

        for (const pr of procs) {
          const matchIdx = copyScheduled.findIndex(sc => matchProcName(pr, sc));
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

      // 🔒 KHÓA CỨNG MỐC GIỜ ĐÃ XẾP CỦA BỆNH NHÂN NÀY TRONG LỊCH CŨ (tránh xếp ca mới trùng giờ với ca cũ)
      if (existingPatRows.length > 0) {
        existingPatRows.forEach(er => {
          const s = t2m(er.gioDienRa);
          const e = t2m(er.gioKetThuc);
          if (!isNaN(s) && !isNaN(e) && e > s) {
            busySlots.push([s, e + 1]);
          }
        });
      }
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
    const cleanExistingSched = (Array.isArray(existingSched) ? existingSched : [])
      .map(normalizeScheduleItem)
      .filter(r => r && r.gioDienRa && r.gioDienRa !== '--' && r.gioDienRa !== '❌ Rớt' && !r.__dropped);

    const { database: db, forcedDrops } = buildDbFromCache(null, skipProcsStr, cleanExistingSched);

    if (!db.rawPatients.length) {
      return {
        schedule: [],
        unscheduled: [],
        scheduleCount: 0,
        unscheduledCount: 0,
        elapsedMs: 0
      };
    }

    const scenarioMap = { opt_rare: 1, opt_math: 1 };
    const scenario = scenarioMap[strategyKey] || 1;

    let best = runBestIteration(db, dateVal, cleanExistingSched, scenario, crowdedOverride, { drop: 10000, overtime: 2, imbalance: 0.1 }, 42, 1);
    let engineName = (strategyKey === 'opt_math') ? '🧠 AI + CP-SAT Optimizer' : '🚀 Tối Ưu Nhanh (Metaheuristics)';

    // 🧠 Universal Rescuer: Kích hoạt CP-SAT cho cả Kịch bản 1 và Kịch bản 2 nếu có ca rớt (đồng bộ existingSched chống trùng giờ)
    if (typeof window !== 'undefined' && window.MedicalCPSolver && best && best.rot && best.rot.length > 0) {
      const cpRes = window.MedicalCPSolver.solve(db, dateVal, best.sched, best.rot, 800, cleanExistingSched);
      if (cpRes && cpRes.sched) {
        best = { ...best, sched: cpRes.sched, rot: cpRes.rot, score: cpRes.score };
        if (cpRes.rescuedCount > 0) {
          engineName += ` (Cứu +${cpRes.rescuedCount} ca)`;
        }
      }
    }

    const finalDropList = (best ? best.rot : []).concat(forcedDrops).map(r => ({ ...r, ngay: r.ngay || dateVal }));
    const formattedSched = (best ? best.sched : []).map(x => ({
      ngay: x.NGAY,
      tenBN: cleanAndHealPatientName(x.HOTEN, (db.rawPatients || []).map(p => p.name)),
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

    const rawCompactedSched = compactTimelineGaps(formattedSched, db);
    const { cleanSched: compactedSched, collisionDrops } = validateNoOverlapWithExisting(rawCompactedSched, cleanExistingSched, db);
    const allDrops = finalDropList.concat(collisionDrops);
    const elapsed = Math.round(performance.now() - startTime);

    const diagnosedRot = allDrops.map(item => {
      if (typeof UnscheduledDiagnosticEngine !== 'undefined') {
        const diag = UnscheduledDiagnosticEngine.diagnose(item, db, compactedSched);
        if (diag) {
          return {
            ...item,
            causeCode: diag.causeCode,
            causeTitle: diag.causeTitle,
            causeDetail: diag.causeDetail,
            reason: diag.causeDetail,
            advices: diag.advices
          };
        }
      }
      return item;
    });

    return {
      scheduleCount: compactedSched.length,
      unscheduledCount: diagnosedRot.length,
      schedule: compactedSched,
      sched: compactedSched,
      unscheduled: diagnosedRot,
      rot: diagnosedRot,
      elapsedMs: elapsed,
      threadCount: 1,
      engine: engineName
    };
  }

  async function runSchedulingAsync(dateVal, strategyKey = 'opt_rare', skipProcsStr = '', crowdedOverride = -1, existingSched = [], options = {}) {
    const startTime = performance.now();
    const cleanExistingSched = (Array.isArray(existingSched) ? existingSched : [])
      .map(normalizeScheduleItem)
      .filter(r => r && r.gioDienRa && r.gioDienRa !== '--' && r.gioDienRa !== '❌ Rớt' && !r.__dropped);

    const { database: db, forcedDrops } = buildDbFromCache(null, skipProcsStr, cleanExistingSched);

    if (!db.rawPatients.length) {
      return {
        schedule: [],
        unscheduled: [],
        scheduleCount: 0,
        unscheduledCount: 0,
        elapsedMs: 0,
        threadCount: 1,
        engine: 'Worker-Turbo'
      };
    }

    try {
      const scenarioMap = { opt_rare: 1, opt_math: 1 };
      const scenario = scenarioMap[strategyKey] || 1;
      const weights = options.weights || { drop: 10000, overtime: 2, imbalance: 0.1 };

    // ⚡ 1. AI Smart Patient Ranking trực tiếp (1ms)
    if (typeof window !== 'undefined' && window.AIScheduler && typeof window.AIScheduler.rankPatients === 'function') {
      db.rawPatients = window.AIScheduler.rankPatients(db.rawPatients, {}, db.thuThuatInfo || {});
    }

    // ⚡ 2. INSTANT AI PASS (Chạy lượt 1 siêu tốc trực tiếp trên luồng đã tối ưu)
    let best = runBestIteration(db, dateVal, cleanExistingSched, scenario, crowdedOverride, weights, 42, 1);
    let engineName = (strategyKey === 'opt_math') ? '🧠 AI + CP-SAT Optimizer' : '🚀 Tối Ưu Nhanh (Metaheuristics)';

    // ⚡ 3. UNIVERSAL CP-SAT RESCUER: Tự động giải cứu ca rớt cho CẢ 2 kịch bản (~20ms, đồng bộ existingSched)
    if (typeof window !== 'undefined' && window.MedicalCPSolver && best && best.rot && best.rot.length > 0) {
      const cpRes = window.MedicalCPSolver.solve(db, dateVal, best.sched, best.rot, 800, cleanExistingSched);
      if (cpRes && cpRes.sched) {
        best = { ...best, sched: cpRes.sched, rot: cpRes.rot, score: cpRes.score };
        if (cpRes.rescuedCount > 0) {
          engineName += ` (Cứu +${cpRes.rescuedCount} ca)`;
        }
      }
    }

    // ⚡ 4. NẾU VẪN CÒN NHIỀU CA RỚT (> 3 ca) VÀ THỜI GIAN CÒN DƯ (< 250ms): Mới thử thêm seed đối xứng để vét kiệt
    const elapsedSoFar = performance.now() - startTime;
    if (best && best.rot && best.rot.length > 3 && elapsedSoFar < 250) {
      const altSeed = 101;
      const altRes = runBestIteration(db, dateVal, cleanExistingSched, scenario, crowdedOverride, weights, altSeed, 1);
      if (altRes && altRes.sched) {
        let altWithCp = altRes;
        if (typeof window !== 'undefined' && window.MedicalCPSolver && altRes.rot && altRes.rot.length > 0) {
          const cpRes2 = window.MedicalCPSolver.solve(db, dateVal, altRes.sched, altRes.rot, 300, cleanExistingSched);
          if (cpRes2 && cpRes2.sched) {
            altWithCp = { ...altRes, sched: cpRes2.sched, rot: cpRes2.rot, score: cpRes2.score };
          }
        }
        if (altWithCp.rot.length < best.rot.length) {
          best = altWithCp;
          engineName += ' [Tối ưu sâu]';
        }
      }
    }

      const finalDropList = (best ? best.rot : []).concat(forcedDrops).map(r => ({ ...r, ngay: r.ngay || dateVal }));
      const formattedSched = (best ? best.sched : []).map(x => ({
        ngay: x.NGAY,
        tenBN: cleanAndHealPatientName(x.HOTEN, (db.rawPatients || []).map(p => p.name)),
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

      const rawCompactedSched = compactTimelineGaps(formattedSched, db);
      const { cleanSched: compactedSched, collisionDrops } = validateNoOverlapWithExisting(rawCompactedSched, cleanExistingSched, db);
      const allDrops = finalDropList.concat(collisionDrops);
      const elapsed = Math.round(performance.now() - startTime);

      const diagnosedRot = allDrops.map(item => {
        if (typeof UnscheduledDiagnosticEngine !== 'undefined') {
          const diag = UnscheduledDiagnosticEngine.diagnose(item, db, compactedSched);
          if (diag) {
            return {
              ...item,
              causeCode: diag.causeCode,
              causeTitle: diag.causeTitle,
              causeDetail: diag.causeDetail,
              reason: diag.causeDetail,
              advices: diag.advices
            };
          }
        }
        return item;
      });

      return {
        scheduleCount: compactedSched.length,
        unscheduledCount: diagnosedRot.length,
        schedule: compactedSched,
        sched: compactedSched,
        unscheduled: diagnosedRot,
        rot: diagnosedRot,
        elapsedMs: elapsed,
        threadCount: 1,
        engine: engineName
      };
    } catch(err) {
      console.warn('[SchedulerEngine]: Lỗi xếp lịch tự động, fallback về client:', err);
      return runClientScheduling(dateVal, strategyKey, skipProcsStr, crowdedOverride, existingSched);
    }
  }

  function runExtraScheduling(dateVal, existingSched = []) {
    return runClientScheduling(dateVal, 'opt_rare', '', -1, existingSched);
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
    baseDb.roomStaff["PHONG_CHUNG_T7"] = [...(payload.allowed_staff || [])];
    if (!baseDb.roomMachines) baseDb.roomMachines = {};
    baseDb.roomMachines["PHONG_CHUNG_T7"] = baseDb.machineTypes || {};

    const allStaff = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.staff)) ? dataCache.staff : [];
    const procList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.proc)) ? dataCache.proc : [];
    baseDb.rawStaff = [];

    const normStr = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

    (payload.allowed_staff || []).forEach(tenNhanVien => {
      const normTen = normStr(tenNhanVien);
      const staffRow = allStaff.find(r => {
        const rName = (r.ten || r.name || (Array.isArray(r) ? r[1] : '') || '').trim();
        if (!rName) return false;
        if (rName === tenNhanVien) return true;
        const normR = normStr(rName);
        if (normR === normTen) return true;
        const cleanR = normR.replace(/^(bs|bac si|ktv|dd|đd)\s*\.?\s*/i, '').trim();
        const cleanT = normTen.replace(/^(bs|bac si|ktv|dd|đd)\s*\.?\s*/i, '').trim();
        return cleanR && cleanT && (cleanR === cleanT || cleanR.endsWith(cleanT) || cleanT.endsWith(cleanR));
      });

      let role = "Kỹ thuật viên";
      if (staffRow) {
        const rawRole = Array.isArray(staffRow) ? (staffRow[2] || "") : (staffRow.vaiTro || staffRow.role || "");
        if (/bác sĩ|bac si|^bs\b/i.test(rawRole) || /^bs\b/i.test(tenNhanVien)) role = "Bác sĩ";
        else if (/điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(rawRole)) role = "Điều dưỡng";
        else if (/kỹ thuật viên|ky thuat vien|^ktv\b/i.test(rawRole)) role = "Kỹ thuật viên";
      } else if (/^bs\b/i.test(tenNhanVien)) {
        role = "Bác sĩ";
      }

      // Build shifts
      let shifts = (payload.staff_shifts_dict?.[tenNhanVien] || []).map(sh => `${sh[0]}-${sh[1]}`).filter(Boolean);
      if (shifts.length === 0 && staffRow) {
        const defaultShift = Array.isArray(staffRow) ? (staffRow[4] || "") : (staffRow.thoiGianLam || "");
        if (defaultShift) shifts = [defaultShift];
      }
      if (shifts.length === 0) {
        shifts = ["07:30-12:00", "13:00-16:30"];
      }
      const shiftStr = shifts.join(', ');

      // Build skills
      let rawSkills = "";
      let quyen = "Cả hai";
      if (Array.isArray(staffRow)) {
        rawSkills = String(staffRow[5] || staffRow[2] || "").trim();
        quyen = String(staffRow[3] || "Cả hai").trim();
      } else if (staffRow && typeof staffRow === 'object') {
        rawSkills = Array.isArray(staffRow.kyNang) ? staffRow.kyNang.join(", ") : String(staffRow.kyNang || staffRow.skills || "").trim();
        quyen = String(staffRow.quyen || staffRow.system || staffRow.he || "Cả hai").trim();
      }

      const allYhctProcs = procList.filter(p => (p.he || p[3]) === "YHCT").map(p => p.ten || p.name || (Array.isArray(p) ? p[1] : "")).filter(Boolean);
      const allPhcnProcs = procList.filter(p => (p.he || p[3]) === "PHCN").map(p => p.ten || p.name || (Array.isArray(p) ? p[1] : "")).filter(Boolean);
      const allProcs = procList.map(p => p.ten || p.name || (Array.isArray(p) ? p[1] : "")).filter(Boolean);

      const skillSet = new Set(rawSkills ? rawSkills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : []);

      if (role === "Bác sĩ") {
        allYhctProcs.forEach(p => skillSet.add(p.toLowerCase()));
        if (/cả hai|ca hai|toàn bộ|tat ca|all/i.test(quyen) || /cả hai|ca hai|toàn bộ|tat ca|all/i.test(rawSkills) || !quyen || quyen === "Cả hai") {
          allPhcnProcs.forEach(p => skillSet.add(p.toLowerCase()));
        }
      } else {
        if (/cả hai|ca hai|toàn bộ|tat ca|all/i.test(rawSkills)) {
          allProcs.forEach(p => skillSet.add(p.toLowerCase()));
        } else if (/yhct/i.test(rawSkills) && !allYhctProcs.some(p => skillSet.has(p.toLowerCase()))) {
          allYhctProcs.forEach(p => skillSet.add(p.toLowerCase()));
        } else if (/phcn/i.test(rawSkills) && !allPhcnProcs.some(p => skillSet.has(p.toLowerCase()))) {
          allPhcnProcs.forEach(p => skillSet.add(p.toLowerCase()));
        }
      }

      if (skillSet.size === 0) {
        if (role === "Bác sĩ") {
          allYhctProcs.forEach(p => skillSet.add(p.toLowerCase()));
          if (/cả hai|ca hai|toàn bộ|tat ca|all/i.test(quyen)) {
            allPhcnProcs.forEach(p => skillSet.add(p.toLowerCase()));
          }
        } else if (role === "Kỹ thuật viên") {
          allProcs.forEach(p => skillSet.add(p.toLowerCase()));
        }
      }

      const skillsStr = Array.from(skillSet).join(', ');
      baseDb.rawStaff.push([tenNhanVien, role, skillsStr, shiftStr, "", "Đi làm"]);
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

    const rawRot = (best.rot || []).map(u => {
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

    const compactedSched = (typeof compactTimelineGaps === 'function') ? compactTimelineGaps(formattedSched, baseDb) : formattedSched;

    const diagnosedRot = (rawRot || []).map(item => {
      if (typeof UnscheduledDiagnosticEngine !== 'undefined' && typeof UnscheduledDiagnosticEngine.diagnose === 'function') {
        const diag = UnscheduledDiagnosticEngine.diagnose(item, baseDb, compactedSched);
        if (diag) {
          return {
            ...item,
            causeCode: diag.causeCode,
            causeTitle: diag.causeTitle,
            causeDetail: diag.causeDetail,
            reason: diag.causeDetail || diag.causeTitle || item.reason || 'Thiếu nhân sự/Máy hoặc hết giờ',
            advices: diag.advices
          };
        }
      }
      return item;
    });

    const elapsed = Math.round(performance.now() - startTime);

    return {
      scheduleCount: compactedSched.length,
      unscheduledCount: diagnosedRot.length,
      sched: compactedSched,
      schedule: compactedSched,
      rot: diagnosedRot,
      unscheduled: diagnosedRot,
      elapsedMs: elapsed
    };
  }

  return {
    t2m,
    m2t,
    normalizeScheduleItem,
    isContinuousProcedure,
    decodeVietnameseEncoding,
    toVietnameseProperCase,
    compactTimelineGaps,
    cleanAndHealPatientName,
    buildDbFromCache,
    validateNoOverlapWithExisting,
    runScheduling: runClientScheduling,
    runSchedulingAsync: runSchedulingAsync,
    runExtraScheduling: runExtraScheduling,
    runSaturdayScheduling: runSaturdayScheduling
  };
})();

const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
if (globalScope) {
  globalScope.decodeVietnameseEncoding = SchedulerEngine.decodeVietnameseEncoding;
  globalScope.toVietnameseProperCase = SchedulerEngine.toVietnameseProperCase;
  globalScope.compactTimelineGaps = SchedulerEngine.compactTimelineGaps;
  globalScope.cleanAndHealPatientName = SchedulerEngine.cleanAndHealPatientName;
  globalScope.healPatientName = SchedulerEngine.cleanAndHealPatientName;
  globalScope.normalizeScheduleItem = SchedulerEngine.normalizeScheduleItem;
  globalScope.isContinuousProcedure = SchedulerEngine.isContinuousProcedure;
}

// ============================================================
// 💡 UNSCHEDULED DIAGNOSTIC & SMART RESCUE ADVISOR ENGINE
// ============================================================
const UnscheduledDiagnosticEngine = (function () {
  'use strict';

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

  function m2t(totalMinutes) {
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  }

  function is_overlap(start1, end1, start2, end2) {
    return Math.max(start1, start2) < Math.min(end1, end2);
  }

  function diagnose(rotItem, db, currentSched = []) {
    if (!rotItem) return null;
    if (Array.isArray(rotItem)) {
      return rotItem.map(item => diagnose(item, db, currentSched));
    }

    const bnName = String(rotItem.bn || rotItem.tenBN || rotItem.HOTEN || '').toUpperCase().trim();
    const bnNs = String(rotItem.ns || rotItem.namSinh || rotItem.NAMSINH || '').trim();
    const room = String(rotItem.room || rotItem.phong || rotItem.PHONG || '').trim();
    const tt = String(rotItem.tt || rotItem.thuThuat || rotItem.DICHVU || '').trim();
    const ttLower = tt.toLowerCase();
    const targetDate = rotItem.ngay || new Date().toISOString().slice(0, 10);

    const info = (db && db.thuThuatInfo && (db.thuThuatInfo[ttLower] || db.thuThuatInfo[tt])) || ["Thủ công", 15, 5, "PHCN", 1, 0, [], 5];
    const loaiMay = info[0] || "Thủ công";
    const tgMay = Math.max(info[1] || 15, info[2] || 5);
    const canPhu = (info && (info[5] === 1 || info[5] === '1' || info[5] === 'Có' || info[5] === true)) ? 1 : 0;
    const dsPhu = (info && Array.isArray(info[6])) ? info[6] : (info && info[6] ? String(info[6]).split(',').map(s => s.trim()).filter(Boolean) : []);

    let patientObj = null;
    if (db && db.rawPatients) {
      patientObj = db.rawPatients.find(p => {
        const pName = String(p.name || p.ten || '').toUpperCase().trim();
        const pNs = String(p.ns || p.namSinh || '').trim();
        return pName === bnName && (!bnNs || !pNs || bnNs === pNs);
      });
    }

    const arriveMins = patientObj ? (patientObj.arrive || 421) : 421;
    const leaveMins = patientObj ? (patientObj.leave || 1014) : 1014;
    const loaiBN = (patientObj && patientObj.loaiBN) || 'NoiTru';
    const buoiDieuTri = (patientObj && patientObj.buoiDieuTri) || 'Sang';

    const loaiMayKey = loaiMay.toLowerCase();
    const roomSpecific = (db && db.roomMachines && (db.roomMachines[room]?.[loaiMayKey] || db.roomMachines[room]?.[loaiMay])) || [];
    const machinesOfCategory = roomSpecific.length > 0 ? roomSpecific : ((db && db.machineTypes && db.machineTypes[loaiMay]) || []);
    const qualifiedStaff = [];
    if (db && db.rawStaff) {
      db.rawStaff.forEach(r => {
        const name = r[0];
        const roleRaw = r[1] || '';
        const isDoc = /bác sĩ|bac si|^bs\b/i.test(roleRaw) || /^bs\b/i.test(name);
        const isNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(roleRaw);
        if (isNurse) return;
        if (!isDoc && !/kỹ thuật viên|ky thuat vien|^ktv\b/i.test(roleRaw) && roleRaw !== '') return;

        const skillsStr = (r[2] || '').toLowerCase();
        const hasAll = /cả hai|ca hai|toàn bộ|tat ca|all/i.test(skillsStr);
        const hasYhct = /yhct/i.test(skillsStr);
        const hasPhcn = /phcn/i.test(skillsStr);
        const isProcYhct = info[3] === 'YHCT';
        const isProcPhcn = info[3] === 'PHCN';

        let ok = false;
        const skillsList = r[2] ? String(r[2]).toLowerCase().split(",").map(x => x.trim()).filter(Boolean) : [];
        if (hasAll) ok = true;
        else if (hasYhct && isProcYhct && skillsList.length === 0) ok = true;
        else if (hasPhcn && isProcPhcn && skillsList.length === 0) ok = true;
        else if (isDoc && isProcYhct && skillsList.length === 0) ok = true;
        else if (skillsList.length > 0) {
          const pName = ttLower;
          const pVt = (info[9] || "").toLowerCase();
          const pTenGoc = (info[8] || "").toLowerCase();
          ok = skillsList.some(sk => sk === pName || (pVt && sk === pVt) || (pTenGoc && sk === pTenGoc) || sk.includes(pName) || pName.includes(sk) || (pVt && (sk.includes(pVt) || pVt.includes(sk))));
        }
        if (ok) qualifiedStaff.push(name);
      });
    }

    const staffOccupancy = {};
    const machineOccupancy = {};
    const bedOccupancy = {};
    const patientOccupancy = [];
    let patientExistingBed = "";
    let patientExistingSub = "";

    (currentSched || []).forEach(slot => {
      const gStart = t2m(slot.gioDienRa || slot.GIODIENRA);
      const gEnd = t2m(slot.gioKetThuc || slot.GIOKETTHUC);
      if (!gStart || !gEnd || gEnd <= gStart) return;

      const pName = String(slot.tenBN || slot.HOTEN || '').toUpperCase().trim();
      const sRoom = String(slot.phong || slot.PHONG || '').trim();
      const sBed = String(slot.giuong || slot.GIUONG || '').trim();
      const nv1 = slot.nvChinh || slot["NV CHÍNH"];
      const nv2 = slot.nvPhu || slot["NV PHỤ"];
      const maySlot = slot.may || slot.MAY;

      if (pName === bnName) {
        patientOccupancy.push([gStart, gEnd]);
        if (sRoom.toLowerCase() === room.toLowerCase() && sBed && sBed !== "Giường 1") {
          patientExistingBed = sBed;
        }
        if (nv2 && !patientExistingSub) {
          patientExistingSub = nv2;
        }
      }
      if (sBed) {
        if (!bedOccupancy[sBed]) bedOccupancy[sBed] = [];
        bedOccupancy[sBed].push([gStart, gEnd]);
      }
      if (nv1) {
        if (!staffOccupancy[nv1]) staffOccupancy[nv1] = [];
        staffOccupancy[nv1].push([gStart, gEnd]);
      }
      if (nv2) {
        if (!staffOccupancy[nv2]) staffOccupancy[nv2] = [];
        staffOccupancy[nv2].push([gStart, gEnd]);
      }
      if (maySlot && maySlot !== "Thủ công") {
        if (!machineOccupancy[maySlot]) machineOccupancy[maySlot] = [];
        machineOccupancy[maySlot].push([gStart, gEnd]);
      }
    });

    if (!patientExistingBed && patientObj && (patientObj.giuong || patientObj.bed)) {
      patientExistingBed = String(patientObj.giuong || patientObj.bed).trim();
    }

    // 🛏️ Hàm chọn giường chuẩn xác: ưu tiên giường BN đang nằm, hoặc giường trống trong phòng
    function chooseBedForSlot(slotStart, slotEnd) {
      if (patientExistingBed) return patientExistingBed;
      let roomBeds = (db && db.roomBeds && db.roomBeds[room]) || [];
      if (!roomBeds || roomBeds.length === 0) {
        if (db && db.cache && db.cache.room) {
          const rObj = db.cache.room.find(r => (r.tenPhong || r.name || r[1] || '').trim().toLowerCase() === room.toLowerCase());
          if (rObj) {
            const bedStr = String(rObj.danhSachGiuong || rObj[6] || '').trim();
            if (bedStr && bedStr !== 'None') {
              roomBeds = bedStr.split(',').map(x => x.trim()).filter(Boolean);
            }
          }
        }
      }
      if (roomBeds && roomBeds.length > 0) {
        const freeBed = roomBeds.find(bName => {
          const occ = bedOccupancy[bName] || [];
          return !occ.some(b => is_overlap(slotStart, slotEnd, b[0], b[1]));
        });
        if (freeBed) return freeBed;
        return roomBeds[0];
      }
      return "G1";
    }

    // 👥 Xây dựng danh sách ứng viên làm người phụ (candidateSubs)
    const candidateSubs = [];
    const addedSubs = new Set();
    function addCandidateSub(name) {
      const s = String(name || '').trim();
      if (!s || addedSubs.has(s)) return;
      addedSubs.add(s);
      candidateSubs.push(s);
    }

    if (patientExistingSub) {
      addCandidateSub(patientExistingSub);
    }
    if (dsPhu && dsPhu.length > 0) {
      dsPhu.forEach(n => addCandidateSub(n));
    }
    const roomStaffList = (db && db.roomStaff && db.roomStaff[room]) || [];
    if (db && db.rawStaff) {
      // 1. Điều dưỡng trong phòng
      db.rawStaff.forEach(r => {
        const name = r[0];
        const roleRaw = r[1] || '';
        const isNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(roleRaw) || /phụ/i.test(name);
        if (isNurse && roomStaffList.includes(name)) addCandidateSub(name);
      });
      // 2. Tất cả Điều dưỡng / Trợ lý
      db.rawStaff.forEach(r => {
        const name = r[0];
        const roleRaw = r[1] || '';
        const isNurse = /điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(roleRaw) || /phụ/i.test(name);
        if (isNurse) addCandidateSub(name);
      });
      // 3. Nhân sự khác trong phòng
      roomStaffList.forEach(name => addCandidateSub(name));
      // 4. Các KTV khác
      db.rawStaff.forEach(r => {
        const name = r[0];
        const roleRaw = r[1] || '';
        const isDoc = /bác sĩ|bac si|^bs\b/i.test(roleRaw) || /^bs\b/i.test(name);
        if (!isDoc) addCandidateSub(name);
      });
    }

    let causeCode = 'STAFF_UNAVAILABLE';
    let causeTitle = '🟡 Nhân sự quá tải / Thiếu KTV chuyên môn';
    let causeDetail = `Chưa xếp được ca [${tt}] cho BN ${bnName} do các KTV có kỹ năng (${qualifiedStaff.join(', ') || 'Chưa phân công'}) kín lịch vào khung giờ rảnh của bệnh nhân.`;

    if (loaiMay !== "Thủ công" && machinesOfCategory.length > 0) {
      let allMachinesBusyInFreeWindow = true;
      for (let t = arriveMins; t <= leaveMins - tgMay; t += 15) {
        const slotEnd = t + tgMay;
        const availableMachine = machinesOfCategory.find(mName => {
          const occ = machineOccupancy[mName] || [];
          return !occ.some(b => is_overlap(t, slotEnd, b[0], b[1]));
        });
        if (availableMachine) {
          allMachinesBusyInFreeWindow = false;
          break;
        }
      }
      if (allMachinesBusyInFreeWindow) {
        causeCode = 'BOTTLENECK_MACHINE';
        causeTitle = '🔴 Nghẽn máy móc thiết bị';
        causeDetail = `Toàn bộ máy [${loaiMay}] (${machinesOfCategory.join(', ')}) bị kín chỗ trong tất cả khung giờ rảnh của bệnh nhân.`;
      }
    }

    if (loaiBN === 'NgoaiTru' && causeCode !== 'BOTTLENECK_MACHINE') {
      if (buoiDieuTri === 'Sang') {
        causeCode = 'OUTPATIENT_SESSION_LIMIT';
        causeTitle = '🟠 Xung đột ca Sáng Ngoại trú';
        causeDetail = `Bệnh nhân Ngoại trú được đăng ký đi ca Sáng (07:00 - 11:30) nhưng các tài nguyên Sáng đã kín chỗ. Buổi Chiều (13:00 - 16:30) còn khoảng trống khả thi.`;
      } else if (buoiDieuTri === 'Chieu') {
        causeCode = 'OUTPATIENT_SESSION_LIMIT';
        causeTitle = '🟠 Xung đột ca Chiều Ngoại trú';
        causeDetail = `Bệnh nhân Ngoại trú được đăng ký đi ca Chiều (13:00 - 16:30) nhưng các tài nguyên Chiều đã kín chỗ. Buổi Sáng (07:00 - 11:30) còn khoảng trống khả thi.`;
      }
    }

    if (arriveMins > 630 || leaveMins < 960) {
      causeCode = 'PATIENT_TIME_WINDOW';
      causeTitle = '🔵 Giờ Y lệnh / Giờ vào muộn';
      causeDetail = `Khung giờ khả dụng của bệnh nhân (${m2t(arriveMins)} - ${m2t(leaveMins)}) quá hẹp, không đủ thời gian trống để xếp thủ thuật kéo dài ${tgMay} phút.`;
    }

    if (patientOccupancy.length >= 2 && causeCode !== 'BOTTLENECK_MACHINE') {
      causeCode = 'INTERNAL_PATIENT_CLASH';
      causeTitle = '🟣 Trùng lịch thủ thuật BN';
      causeDetail = `Bệnh nhân ${bnName} có nhiều thủ thuật dài kẹp sát nhau trong ngày, chiếm hết khung giờ rảnh để làm thêm [${tt}].`;
    }

    const targetStaff = qualifiedStaff[0] || (db.roomStaff && db.roomStaff[room] && db.roomStaff[room].find(s => {
      const r = (db.rawStaff || []).find(st => st[0] === s);
      const role = r ? r[1] : '';
      return !/điều dưỡng|dieu duong|^đd\b|^dd\b|y tá|y ta|hộ lý|ho ly|trợ lý|tro ly/i.test(role);
    })) || "KTV Phụ Trách";
    const advices = [];

    // 🔍 Tìm slot RẢNH THỰC SỰ theo tài nguyên nhân sự, máy móc và lịch bệnh nhân
    function getStaffShifts(sName) {
      const r = (db.rawStaff || []).find(st => st[0] === sName);
      const rawShifts = r && r[3] ? String(r[3]).split(",").filter(s => s.includes("-")).map(s => {
        const pts = s.split("-"); return [t2m(pts[0].trim()), t2m(pts[1].trim())];
      }) : [];
      return rawShifts.length > 0 ? rawShifts : [[420, 690], [780, 990]];
    }

    function getStaffBusy(sName) {
      const r = (db.rawStaff || []).find(st => st[0] === sName);
      if (!r || !r[4]) return [];
      return String(r[4]).split(",").filter(s => s.includes("-")).map(s => {
        const tp = s.includes(")") ? s.split(")").pop().trim() : s;
        const pts = tp.split("-");
        return [t2m(pts[0].trim()), t2m(pts[1].trim())];
      });
    }

    function isStaffFree(sName, slotStart, slotEnd, allowOvertime = false) {
      const shifts = getStaffShifts(sName);
      if (!allowOvertime) {
        const inShift = shifts.some(sh => slotStart >= sh[0] && slotEnd <= sh[1]);
        if (!inShift) return false;
      } else {
        const inShiftOrOvertime = shifts.some(sh => slotStart >= sh[0] && slotEnd <= (sh[1] + 15));
        if (!inShiftOrOvertime) return false;
      }
      const busyList = getStaffBusy(sName);
      if (busyList.some(b => is_overlap(slotStart, slotEnd, b[0], b[1]))) return false;
      const occ = staffOccupancy[sName] || [];
      if (occ.some(b => is_overlap(slotStart, slotEnd, b[0], b[1]))) return false;
      return true;
    }

    function isMachineFree(mName, slotStart, slotEnd) {
      if (!mName || mName === 'Thủ công') return true;
      const occ = machineOccupancy[mName] || [];
      return !occ.some(b => is_overlap(slotStart, slotEnd, b[0], b[1]));
    }

    function isPatientFree(slotStart, slotEnd) {
      if (slotStart < arriveMins || slotEnd > leaveMins) return false;
      if (patientObj && patientObj.busy && patientObj.busy.some(b => is_overlap(slotStart, slotEnd, b[0], b[1]))) {
        return false;
      }
      if (patientOccupancy.some(b => is_overlap(slotStart, slotEnd, b[0], b[1]))) {
        return false;
      }
      return true;
    }

    const candidateStaff = qualifiedStaff.length > 0
      ? qualifiedStaff
      : (targetStaff !== "KTV Phụ Trách" ? [targetStaff] : []);

    const candidateMachines = machinesOfCategory.length > 0 ? machinesOfCategory : ['Thủ công'];

    // Các khung giờ khảo sát linh hoạt:
    const scanWindows = [
      { label: 'Sáng sớm (07:15 - 08:30)', from: 435, to: 510, overtime: false },
      { label: 'Giữa ca sáng (08:30 - 10:30)', from: 510, to: 630, overtime: false },
      { label: 'Cuối ca sáng (10:30 - 11:30)', from: 630, to: 690, overtime: false },
      { label: 'Đầu ca chiều (13:00 - 14:30)', from: 780, to: 870, overtime: false },
      { label: 'Giữa ca chiều (14:30 - 16:30)', from: 870, to: 990, overtime: false },
      { label: 'Làm lố cuối ca sáng (11:15 - 11:45)', from: 675, to: 705, overtime: true }
    ];

    // Ưu tiên thứ tự quét theo buổi điều trị của bệnh nhân
    let orderedWindows = scanWindows;
    if (buoiDieuTri === 'Chieu') {
      orderedWindows = [
        scanWindows[3], scanWindows[4], scanWindows[0], scanWindows[1], scanWindows[2], scanWindows[5]
      ];
    }

    const foundSlots = [];
    for (const win of orderedWindows) {
      let foundInWindow = false;
      for (let t = win.from; t <= win.to - tgMay; t += 5) {
        const slotEnd = t + tgMay;
        if (!isPatientFree(t, slotEnd)) continue;

        let availStaff = candidateStaff.find(s => isStaffFree(s, t, slotEnd, win.overtime));
        if (!availStaff && candidateStaff.length === 0) {
          availStaff = targetStaff;
        }
        if (!availStaff) continue;

        let availSub = "";
        if (canPhu === 1) {
          availSub = candidateSubs.find(s => s !== availStaff && isStaffFree(s, t, slotEnd, win.overtime));
          // Nếu thủ thuật yêu cầu người phụ mà có ứng viên nhưng không ai rảnh lúc này thì slot không hợp lệ
          if (!availSub && candidateSubs.length > 0) {
            continue;
          }
        }

        const availMachine = candidateMachines.find(m => isMachineFree(m, t, slotEnd));
        if (!availMachine) continue;

        const chosenBed = chooseBedForSlot(t, slotEnd);

        foundSlots.push({
          time: t,
          end: slotEnd,
          staff: availStaff,
          subStaff: availSub || "",
          machine: availMachine,
          bed: chosenBed,
          windowLabel: win.label,
          isOvertime: win.overtime
        });
        foundInWindow = true;
        break;
      }
      if (foundSlots.length >= 3) break;
    }

    if (foundSlots.length > 0) {
      foundSlots.forEach((slot, idx) => {
        const actionType = slot.isOvertime ? 'OVERTIME' : (slot.time >= 780 && buoiDieuTri === 'Sang' ? 'SWITCH_SESSION' : 'EXACT_SLOT');
        const subInfo = slot.subStaff ? `, Phụ: ${slot.subStaff}` : '';
        const bedInfo = slot.bed ? `, Giường: ${slot.bed}` : '';
        advices.push({
          id: idx + 1,
          title: `⚡ [Đã xác minh] ${m2t(slot.time)} – ${m2t(slot.end)} (${slot.staff}${subInfo}${slot.machine !== 'Thủ công' ? ', ' + slot.machine : ''}${bedInfo})`,
          description: `Khung giờ ${slot.windowLabel} khả dụng: ${slot.staff} rảnh${slot.subStaff ? ', người phụ ' + slot.subStaff + ' rảnh' : ''}, ${slot.machine !== 'Thủ công' ? 'máy ' + slot.machine + ' rảnh, ' : ''}BN rảnh (Giường: ${slot.bed}).`,
          actionType: actionType,
          patch: {
            gioDienRa: m2t(slot.time),
            gioKetThuc: m2t(slot.end),
            nvChinh: slot.staff,
            nvPhu: slot.subStaff || "",
            may: slot.machine,
            giuong: slot.bed,
            phong: room
          }
        });
      });
    }

    // Fallback: Nếu không tìm thấy slot rảnh hoàn toàn, đề xuất gợi ý có cảnh báo rõ ràng
    if (advices.length === 0) {
      const overTimeStart = 675; // 11:15
      const overTimeEnd = overTimeStart + tgMay;
      const fallbackSub = (canPhu === 1 && candidateSubs.length > 0) ? (candidateSubs.find(s => s !== targetStaff) || candidateSubs[0] || "") : "";
      const fallbackBed = chooseBedForSlot(overTimeStart, overTimeEnd);
      const subInfo = fallbackSub ? `, Phụ: ${fallbackSub}` : '';
      const bedInfo = fallbackBed ? `, Giường: ${fallbackBed}` : '';

      advices.push({
        id: 1,
        title: `⚡ [Cần xác nhận] Làm lố cuối ca sáng (${m2t(overTimeStart)} – ${m2t(overTimeEnd)}) với ${targetStaff}${subInfo}${bedInfo}`,
        description: `Không tìm được slot rảnh hoàn toàn. Phương án này nới lỏng thêm giờ cuối ca sáng cho ${targetStaff}. Cần đối soát trước khi ấn cứu.`,
        actionType: 'OVERTIME',
        patch: {
          gioDienRa: m2t(overTimeStart),
          gioKetThuc: m2t(overTimeEnd),
          nvChinh: targetStaff,
          nvPhu: fallbackSub,
          may: (machinesOfCategory[0] || "Thủ công"),
          giuong: fallbackBed,
          phong: room
        }
      });

      const aftStart = 810; // 13:30
      const aftEnd = aftStart + tgMay;
      const aftSub = (canPhu === 1 && candidateSubs.length > 0) ? (candidateSubs.find(s => s !== targetStaff) || candidateSubs[0] || "") : "";
      const aftBed = chooseBedForSlot(aftStart, aftEnd);
      const aftSubInfo = aftSub ? `, Phụ: ${aftSub}` : '';
      const aftBedInfo = aftBed ? `, Giường: ${aftBed}` : '';

      advices.push({
        id: 2,
        title: `⚡ [Cần xác nhận] Chuyển ca sang buổi Chiều (${m2t(aftStart)} – ${m2t(aftEnd)})${aftSubInfo}${aftBedInfo}`,
        description: `Đề xuất xếp [${tt}] vào đầu ca chiều. Vui lòng kiểm tra lịch rảnh của BN và nhân sự trước khi áp dụng.`,
        actionType: 'SWITCH_SESSION',
        patch: {
          gioDienRa: m2t(aftStart),
          gioKetThuc: m2t(aftEnd),
          nvChinh: targetStaff,
          nvPhu: aftSub,
          may: (machinesOfCategory[0] || "Thủ công"),
          giuong: aftBed,
          phong: room
        }
      });
    }

    return {
      rotItem,
      causeCode,
      causeTitle,
      causeDetail,
      advices
    };
  }

  return {
    diagnose: diagnose
  };
})();

if (typeof window !== 'undefined') {
  window.UnscheduledDiagnosticEngine = UnscheduledDiagnosticEngine;
}
