/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🕰️ HISTORY MANAGER MODULE - v4.1.4-rev3
 * Xử lý quản lý dữ liệu lịch sử xếp lịch, chốt sổ, phát hiện trùng lặp và dọn dẹp
 * Tương thích Browser (window.HistoryManager) và Node.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  const HistoryManager = {
    /**
     * Lọc trùng lặp bản ghi lịch sử theo khóa tổ hợp (ngày + bệnh nhân + thủ thuật + giờ)
     * @param {Array<Object>} historyRecords 
     * @returns {Array<Object>}
     */
    deduplicate(historyRecords) {
      if (!Array.isArray(historyRecords)) return [];
      const seen = new Set();
      const clean = [];

      for (const row of historyRecords) {
        if (!row) continue;
        const d = String(row.date || row.ngay || '').trim();
        const p = String(row.patient_name || row.tenBN || '').trim().toLowerCase();
        const proc = String(row.procedure_name || row.thuThuat || '').trim().toLowerCase();
        const st = String(row.start_time || row.gioBatDau || '').trim();

        const key = `${d}|${p}|${proc}|${st}`;
        if (!seen.has(key)) {
          seen.add(key);
          clean.push(row);
        }
      }
      return clean;
    },

    /**
     * Kiểm tra trạng thái chốt sổ trong ngày
     * @param {string} targetTimeHHMM 
     * @param {boolean} alreadyDoneFlag 
     * @returns {boolean}
     */
    shouldTriggerAutoChotSo(targetTimeHHMM = '16:20', alreadyDoneFlag = false) {
      if (alreadyDoneFlag) return false;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const parts = targetTimeHHMM.split(':');
      const targetMinutes = (parseInt(parts[0], 10) || 16) * 60 + (parseInt(parts[1], 10) || 20);
      return nowMinutes >= targetMinutes;
    },

    /**
     * Định dạng bản ghi lịch sử phục vụ hiển thị
     */
    formatRecordForDisplay(record) {
      if (!record) return {};
      return {
        date: record.date || record.ngay || '',
        patient: record.patient_name || record.tenBN || 'Chưa rõ',
        proc: record.procedure_name || record.thuThuat || '',
        room: record.room || record.phong || '',
        staff: record.staff_name || record.nvChinh || '',
        subStaff: record.sub_staff_name || record.nvPhu || '',
        timeRange: `${record.start_time || ''} - ${record.end_time || ''}`.trim()
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
  } else {
    global.HistoryManager = HistoryManager;
  }

})(typeof window !== 'undefined' ? window : globalThis);
