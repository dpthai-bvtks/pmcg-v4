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
    let str = String(raw);

    // 1. Dọn sạch ký tự vô hình, BOM, zero-width space, non-breaking space
    str = str.replace(/[\ufeff\u200b\u200c\u200d\u200e\u200f]/g, '').replace(/\u00a0/g, ' ');

    // 2. Chuyển Unicode NFD sang NFC
    try { str = str.normalize('NFC'); } catch (e) {}

    // 🛡️ Xử lý sớm các từ TCVN3 đặc thù trước khi kiểm tra return early
    const hasStrongTcvn3Char = /[\u00A7\u00A8\u00A9\u00AA\u00AB\u00AC\u00AD\u00AE]/.test(str);
    const hasTcvn3Word = /\b(NguyÔn|Thñy|bãp|huyÖt)\b/i.test(str);
    if (hasTcvn3Word) {
      str = str.replace(/\bNguyÔn\b/g, 'Nguyễn').replace(/\bnguyÔn\b/g, 'nguyễn')
               .replace(/Thñy/gi, 'Thủy').replace(/thñy/gi, 'thủy')
               .replace(/bãp\s*b[Êê]m/gi, 'bóp bấm')
               .replace(/huyÖt/gi, 'huyệt');
    }

    const hasPureUnicodeVN = /[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]/.test(str);

    if (hasPureUnicodeVN && !hasStrongTcvn3Char) {
      return str.replace(/\s+/g, ' ').trim();
    }

    // 3. Ưu tiên kiểm tra và giải mã VNI nếu có các cặp ký tự VNI đặc trưng
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
    if (hasStrongTcvn3Char) {
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

  function stripTones(s) {
    if (!s) return '';
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').trim().toLowerCase();
  }

  function cleanStaffStr(s) {
    return String(s || '').normalize('NFC').replace(/^(bs|bac si|bác sĩ|ktv|dd|đd)\s*\.?\s*/i, '').trim().toLowerCase();
  }

  // ============================================================
  // 3. BỘ CHỮA LÀNH DỮ LIỆU (HEALERS)
  // ============================================================
  function cleanAndHealPatientName(rawName, candidates = [], forceUpperCase = false) {
    if (!rawName) return '';
    let name = decodeVietnameseEncoding(rawName);
    if (!name) return '';

    const isAllUpper = (name === name.toUpperCase() && /[A-Z\u00C0-\u024F\u1EA0-\u1EF9]/.test(name));
    const shouldUpper = forceUpperCase || isAllUpper;

    const hasCorruptChar = /[\ufffd\u0000]/.test(name) || /\b[A-Za-z\u00C0-\u024F\u1EA0-\u1EF9]+\?[A-Za-z\u00C0-\u024F\u1EA0-\u1EF9]+\b/.test(name);
    const hasSwallowedVowel = /\b(Trn|Lnh|Nguyn|Phm)\b/i.test(name) ||
      /\bTr[\ufffd\?]+n\b/i.test(name) ||
      /\bL[\ufffd\?]+nh\b/i.test(name) ||
      /\bC[\ufffd\?]+ng\b/i.test(name) ||
      /\bNguy[\ufffd\?]+n\b/i.test(name) ||
      /\bPh[\ufffd\?]+m\b/i.test(name);

    if (!hasCorruptChar && !hasSwallowedVowel) {
      return shouldUpper ? name.toUpperCase() : toVietnameseProperCase(name);
    }

    // 1. Đối chiếu candidates: CHỈ chấp nhận khi toàn bộ âm tiết không dấu khớp 100%
    const candList = Array.isArray(candidates) ? candidates : [];
    for (const cand of candList) {
      if (!cand) continue;
      const cleanCand = String(cand).normalize('NFC').trim();
      if (/[\ufffd\u0000]/.test(cleanCand) || /\b(Trn|Lnh)\b/i.test(cleanCand)) continue;

      const noToneName = stripTones(name.replace(/[\ufffd\u0000\?]+/g, ' '));
      const noToneCand = stripTones(cleanCand);

      if (noToneName && noToneCand && noToneName === noToneCand) {
        return shouldUpper ? cleanCand.toUpperCase() : toVietnameseProperCase(cleanCand);
      }
    }

    // 2. Chữa lành ngữ âm khi không có candidate
    let healed = name;
    healed = healed.replace(/\bTr[\ufffd\?]+n\b/gi, 'Trần').replace(/\bTrn\b/gi, 'Trần');
    healed = healed.replace(/\bL[\ufffd\?]+nh\b/gi, 'Lãnh').replace(/\bLnh\b/gi, 'Lãnh');
    healed = healed.replace(/\bC[\ufffd\?]+ng\b/gi, 'Cường');
    healed = healed.replace(/\bNguy[\ufffd\?]+n\b/gi, 'Nguyễn').replace(/\bNguyn\b/gi, 'Nguyễn');
    healed = healed.replace(/\bPh[\ufffd\?]+m\b/gi, 'Phạm').replace(/\bPhm\b/gi, 'Phạm');
    healed = healed.replace(/\bTh[\ufffd\?]+(?=\s+|$)/gi, 'Thị');
    healed = healed.replace(/\bV[\ufffd\?]+n\b/gi, 'Văn').replace(/\bVn\b/gi, 'Văn');
    healed = healed.replace(/\bD[\ufffd\?]+nh\b/gi, 'Đình');

    return shouldUpper ? healed.toUpperCase() : toVietnameseProperCase(healed);
  }

  function cleanAndHealProcedureName(rawProc, candidates = []) {
    if (!rawProc && rawProc !== 0) return '';
    let str = decodeVietnameseEncoding(rawProc);
    if (!str) return '';

    const hasCorruptChar = /[\ufffd\u0000]/.test(str) || /\b[A-Za-z\u00C0-\u024F\u1EA0-\u1EF9]+\?[A-Za-z\u00C0-\u024F\u1EA0-\u1EF9]+\b/.test(str) || /\?[A-Za-z\u00C0-\u024F\u1EA0-\u1EF9]+/.test(str) || /[A-Za-z\u00C0-\u024F\u1EA0-\u1EF9]+\?+/.test(str);
    const hasSwallowedChar = /\b(chm|ngi|bop|bam|huyet)\b/i.test(str);

    let candList = Array.isArray(candidates) ? candidates : [];
    if (!candList.length && typeof window !== 'undefined' && window.dataCache) {
      candList = window.dataCache.proc || window.dataCache.procedures || [];
    }

    if (candList.length > 0) {
      const cleanNoTone = stripTones(str.replace(/[\ufffd\u0000\?]+/g, ' '));
      for (const c of candList) {
        if (!c) continue;
        const cName = String(c.ten || c.name || c[1] || c || '').normalize('NFC').trim();
        if (!cName || /[\ufffd\u0000\?]/.test(cName)) continue;
        if (cName.toLowerCase() === str.toLowerCase()) return cName;
        if (stripTones(cName) === cleanNoTone && cleanNoTone.length >= 3) return cName;
      }

      if (hasCorruptChar || hasSwallowedChar || /ch[\ufffd\s\?]*m/i.test(str)) {
        const regexStr = '^' + stripTones(str)
          .replace(/[\ufffd\u0000\?]+/g, '.*')
          .replace(/\bchm\b/gi, 'ch.*m')
          .replace(/\bngi\b/gi, 'ng.*i')
          .replace(/\s+/g, '\\s+') + '$';
        try {
          const reg = new RegExp(regexStr, 'i');
          for (const c of candList) {
            if (!c) continue;
            const cName = String(c.ten || c.name || c[1] || c || '').normalize('NFC').trim();
            if (!cName || /[\ufffd\u0000\?]/.test(cName)) continue;
            if (reg.test(stripTones(cName))) return cName;
          }
        } catch (e) {}

        const targetTokens = cleanNoTone.split(/\s+/).filter(t => t.length >= 2);
        for (const c of candList) {
          if (!c) continue;
          const cName = String(c.ten || c.name || c[1] || c || '').normalize('NFC').trim();
          if (!cName || /[\ufffd\u0000\?]/.test(cName)) continue;
          const cTokens = stripTones(cName).split(/\s+/).filter(t => t.length >= 2);
          if (targetTokens.length >= 2 && targetTokens.length === cTokens.length) {
            let diffCount = 0;
            for (let i = 0; i < targetTokens.length; i++) {
              if (targetTokens[i] !== cTokens[i]) {
                if (cTokens[i].startsWith(targetTokens[i][0]) && cTokens[i].endsWith(targetTokens[i].slice(-1))) {
                } else {
                  diffCount++;
                }
              }
            }
            if (diffCount === 0 || (targetTokens.length >= 4 && diffCount <= 1)) {
              return cName;
            }
          }
        }
      }
    }

    return toVietnameseProperCase(str);
  }

  function cleanAndHealStaffName(rawStaff, candidates = []) {
    if (!rawStaff && rawStaff !== 0) return '';
    let str = decodeVietnameseEncoding(rawStaff);
    if (!str) return '';

    // Lấy tiền tố chuẩn nếu có (BS., KTV., ĐD.)
    let prefix = '';
    const prefixMatch = str.match(/^(bs|bac si|bác sĩ|ktv|dd|đd)\s*\.?\s*/i);
    if (prefixMatch) {
      const p = prefixMatch[0].trim().toLowerCase();
      if (p.startsWith('bs') || p.startsWith('bac')) prefix = 'BS. ';
      else if (p.startsWith('ktv')) prefix = 'KTV. ';
      else if (p.startsWith('dd') || p.startsWith('đd')) prefix = 'ĐD. ';
    }

    let candList = Array.isArray(candidates) ? candidates : [];
    if (!candList.length && typeof window !== 'undefined' && window.dataCache) {
      candList = window.dataCache.staff || [];
    }

    const coreClean = cleanStaffStr(str);
    const coreCleanNoTone = stripTones(coreClean);

    if (candList.length > 0) {
      // 1. So khớp chính xác sau khi chuẩn hóa cleanStaffStr
      for (const c of candList) {
        if (!c) continue;
        const cRaw = String(c.ten || c.name || c[1] || c || '').normalize('NFC').trim();
        if (!cRaw || /[\ufffd\u0000\?]/.test(cRaw)) continue;
        if (cleanStaffStr(cRaw) === coreClean) {
          return cRaw;
        }
      }

      // 2. So khớp không dấu (phục hồi dấu hoặc chữ bị lỗi mã UTF-8)
      if (coreCleanNoTone.length >= 3) {
        for (const c of candList) {
          if (!c) continue;
          const cRaw = String(c.ten || c.name || c[1] || c || '').normalize('NFC').trim();
          if (!cRaw || /[\ufffd\u0000\?]/.test(cRaw)) continue;
          const candClean = cleanStaffStr(cRaw);
          if (stripTones(candClean) === coreCleanNoTone) {
            return cRaw;
          }
        }
      }
    }

    // 3. Fallback: Proper-case chuỗi đã decode
    const proper = toVietnameseProperCase(str.replace(/^(bs|bac si|bác sĩ|ktv|dd|đd)\s*\.?\s*/i, ''));
    return prefix ? (prefix + proper) : proper;
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
