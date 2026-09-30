/**
 * 🛠️ SCHEDULE UTILS (T.I.M.E.S System v4 - Shared Core Utilities)
 * Module tiện ích dùng chung chuẩn hóa:
 * 1. Chuyển đổi & tính toán thời gian (t2m, m2t, isEmptyTime, is_overlap).
 * 2. Bảng mã tiếng Việt & giải mã TCVN3 / VNI / mojibake.
 * 3. Chuẩn hóa & chữa lành Họ tên Bệnh nhân, Thủ thuật, Nhân sự.
 */

var ScheduleUtils = (function () {
  'use strict';
  const gScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : this));

  // ============================================================
  // 0. SHARED APPLICATION HELPERS (DÙNG CHUNG TOÀN HỆ THỐNG)
  // ============================================================
  gScope.getSession = function() {
    try {
      return JSON.parse(localStorage.getItem('meds_session') || '{}');
    } catch (e) {
      return {};
    }
  };

  gScope.getAuthToken = function() {
    try {
      return localStorage.getItem('pm_jwt_token') || '';
    } catch (e) {
      return '';
    }
  };

  gScope.notify = function(msg, type = 'info') {
    if (typeof gScope.showToast === 'function') return gScope.showToast(msg, type);
    if (typeof showToast === 'function') return showToast(msg, type);
    alert(msg);
  };

  gScope.safeCall = function(fnName, ...args) {
    const fn = (typeof fnName === 'function') ? fnName : gScope[fnName];
    if (typeof fn === 'function') {
      try {
        return fn(...args);
      } catch (err) {
        console.warn('[safeCall] Lỗi thực thi ' + fnName + ':', err);
      }
    }
  };

  gScope.safeCallApi = function(name, args, onSuccess, onError) {
    const caller = (typeof gScope.callApi === 'function') ? gScope.callApi : 
                   ((typeof callApi === 'function') ? callApi : null);
    if (caller) return caller(name, args, onSuccess, onError);
    console.warn('[safeCallApi] callApi chưa sẵn sàng cho:', name);
    if (typeof onError === 'function') onError(new Error('API not available'));
  };

  // ============================================================
  // 1. TIỆN ÍCH THỜI GIAN (TIME CONVERSION & OVERLAP)
  // ⚠️ CHÚ Ý: t2m() và m2t() là chuẩn mực tính toán thời gian dùng chung toàn hệ thống.
  // Đồng bộ hoàn toàn với logic tính phút/giờ kế thừa từ code.gs (Google Apps Script cũ)
  // và các bộ giải thuật OR-Tools (solver.py, cp-solver.js, scheduler-engine.js).
  // Đảm bảo tương thích: Date object, số thập phân ngày của Excel (0..1) và chuỗi 'HH:mm'.
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

  function is_overlap(start1, end1, start2, end2) {
    return Math.max(start1, start2) < Math.min(end1, end2);
  }

  // ============================================================
  // 2. BẢNG MÃ TIẾNG VIỆT & GIẢI MÃ TCVN3 / VNI / NFD
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
    ['YÙ', 'Ý'], ['YØ', 'Ỳ'], ['YÛ', 'Ỷ'], ['YÕ', 'Ỹ']
  ];

  function decodeVietnameseEncoding(raw) {
    if (!raw && raw !== 0) return '';
    // Chuẩn bản v3: Tuyệt đối không can thiệp bất kỳ bảng mã hay hoán đổi ký tự nào, giữ nguyên 100% dữ liệu gốc
    return String(raw).normalize('NFC').replace(/[\ufeff\u200b\u200c\u200d\u200e\u200f]/g, '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function toVietnameseProperCase(raw) {
    if (!raw && raw !== 0) return '';
    return String(raw).normalize('NFC').trim();
  }

  function stripTones(s) {
    if (!s) return '';
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').trim().toLowerCase();
  }

  function cleanStaffStr(s) {
    return String(s || '').normalize('NFC').replace(/^(bs|bac si|bác sĩ|ktv|dd|đd)\s*\.?\s*/i, '').trim().toLowerCase();
  }

  // ============================================================
  // 3. BỘ CHỮA LÀNH DỮ LIỆU (HEALERS) - CHUẨN BẢN V3: GIỮ NGUYÊN BẢN 100%
  // ============================================================
  function cleanAndHealPatientName(rawName, candidates = [], forceUpperCase = false) {
    if (!rawName && rawName !== 0) return '';
    // Chuẩn bản v3: Giữ nguyên vẹn họ tên từ file HIS / CSDL, không đoán mò hay hoán đổi
    const name = String(rawName).normalize('NFC').trim();
    if (!name) return '';
    return forceUpperCase ? name.toUpperCase() : name;
  }

  function cleanAndHealProcedureName(rawProc, candidates = []) {
    if (!rawProc && rawProc !== 0) return '';
    // Chuẩn bản v3: Giữ nguyên vẹn tên thủ thuật gốc
    return String(rawProc).normalize('NFC').trim();
  }

  function cleanAndHealStaffName(rawStaff, candidates = []) {
    if (!rawStaff && rawStaff !== 0) return '';
    // Chuẩn bản v3: Giữ nguyên vẹn tên nhân sự gốc
    return String(rawStaff).normalize('NFC').trim();
  }

  function cleanAndHealRoomName(rawRoom, candidates = []) {
    if (!rawRoom && rawRoom !== 0) return '';
    // Chuẩn bản v3: Giữ nguyên vẹn tên phòng gốc
    return String(rawRoom).normalize('NFC').trim();
  }

  function cleanAndHealMachineName(rawMachine, candidates = []) {
    if (!rawMachine && rawMachine !== 0) return '';
    // Chuẩn bản v3: Giữ nguyên vẹn tên máy gốc
    return String(rawMachine).normalize('NFC').trim();
  }

  // ============================================================
  // 4. ĐÓNG GÓI & XUẤT BẢN RA PHẠM VI TOÀN CỤC
  // ============================================================
  const utils = {
    t2m,
    m2t,
    isEmptyTime,
    is_overlap,
    isOverlap: is_overlap,
    decodeVietnameseEncoding,
    toVietnameseProperCase,
    stripTones,
    cleanStaffStr,
    cleanAndHealPatientName,
    healPatientName: cleanAndHealPatientName,
    cleanAndHealProcedureName,
    healProcedureName: cleanAndHealProcedureName,
    cleanAndHealStaffName,
    healStaffName: cleanAndHealStaffName,
    cleanAndHealRoomName,
    healRoomName: cleanAndHealRoomName,
    cleanAndHealMachineName,
    healMachineName: cleanAndHealMachineName,
    getSession: gScope.getSession,
    getAuthToken: gScope.getAuthToken,
    notify: gScope.notify,
    safeCall: gScope.safeCall,
    safeCallApi: gScope.safeCallApi,
    TCVN3_MAP,
    VNI_PAIRS
  };

  if (gScope) {
    gScope.ScheduleUtils = utils;
    // Đăng ký trực tiếp ra window để toàn bộ hệ thống luôn có tiện ích chuẩn
    for (const k in utils) {
      gScope[k] = utils[k];
    }
  }

  return utils;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScheduleUtils;
}
