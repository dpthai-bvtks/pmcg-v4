/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 EXPORT SERVICE MODULE - v4.1.4-rev3
 * Xử lý nghiệp vụ xuất báo cáo: Excel (XLSX), PDF, In ấn trực tiếp
 * Tương thích Browser (window.ExportService) và Node.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  const ExportService = {
    /**
     * Xuất mảng dữ liệu 2 chiều hoặc danh sách object ra tệp Excel (.xlsx)
     * @param {Array<Array>|Array<Object>} data 
     * @param {string} fileName 
     * @param {string} sheetName 
     */
    exportToExcel(data, fileName = 'Bao_Cao.xlsx', sheetName = 'DuLieu') {
      if (typeof XLSX === 'undefined') {
        alert('Thư viện XLSX chưa sẵn sàng. Vui lòng thử lại sau ít giây.');
        return false;
      }
      try {
        const wb = XLSX.utils.book_new();
        let ws;
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
          ws = XLSX.utils.aoa_to_sheet(data);
        } else {
          ws = XLSX.utils.json_to_sheet(data);
        }
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        if (!fileName.endsWith('.xlsx')) fileName += '.xlsx';
        XLSX.writeFile(wb, fileName);
        return true;
      } catch (err) {
        console.error('[ExportService.exportToExcel Error]:', err);
        alert('Lỗi xuất Excel: ' + (err.message || err));
        return false;
      }
    },

    /**
     * In nhanh nội dung một phần tử DOM
     * @param {string} elementId 
     * @param {string} printTitle 
     */
    printElement(elementId, printTitle = 'In Báo Cáo') {
      const el = document.getElementById(elementId);
      if (!el) {
        console.warn(`[ExportService.printElement] Element #${elementId} not found.`);
        return false;
      }
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        window.print();
        return true;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${printTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h2>${printTitle}</h2>
          <div>${el.innerHTML}</div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      return true;
    },

    /**
     * Định dạng dữ liệu bảng lịch thành dạng ma trận để xuất file
     */
    formatScheduleMatrix(scheduleRows) {
      if (!Array.isArray(scheduleRows)) return [];
      const header = ["STT", "Thời Gian", "Phòng", "Bệnh Nhân", "Năm Sinh", "Thủ Thuật", "Kỹ Thuật Viên 1", "Kỹ Thuật Viên 2", "Máy Móc", "Ghi Chú"];
      const rows = scheduleRows.map((r, i) => [
        i + 1,
        r.gioDienRa || r.time_range || '',
        r.phong || r.room || '',
        r.tenBN || r.patient_name || '',
        r.namSinh || r.dob || '',
        r.thuThuat || r.procedure_name || '',
        r.nvChinh || r.staff_name || '',
        r.nvPhu || r.sub_staff_name || '',
        r.mayMoc || r.machine_name || '',
        r.ghiChu || r.note || ''
      ]);
      return [header, ...rows];
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportService;
  } else {
    global.ExportService = ExportService;
  }

})(typeof window !== 'undefined' ? window : globalThis);
