/**
 * ====================================================================
 * PM-XepLich v4 - Module Xuất Báo Cáo & Timeline Y Tế
 * File: js/modules/app-export-reports.js
 * Bao gồm:
 *  - 📤 Xuất Lịch Y Lệnh Excel (1 Sheet kèm drop-list lọc phòng, A-Z & RV đầu bảng)
 *  - 📄 Xuất PDF Lịch Trình theo từng phòng bệnh (pdfMake Engine)
 *  - ⚡ Xuất dữ liệu cho phần mềm Auto-HIS (JSON + Clipboard)
 *  - ⏱️ Medical Resource Timeline & Gantt View
 * ====================================================================
 */

(function (window) {
    'use strict';

    const normalizeScheduleRow = (row) => (typeof window.normalizeScheduleRow === 'function' ? window.normalizeScheduleRow(row) : (row || {}));
    const isDroppedScheduleRow = (row) => (typeof window.isDroppedScheduleRow === 'function' ? window.isDroppedScheduleRow(row) : false);
    const escapeHtml = (str) => (typeof window.escapeHtml === 'function' ? window.escapeHtml(str) : String(str || ''));

        // ============================================================
        // 📤 XUẤT LỊCH Y LỆNH EXCEL (KHOA YHCT & PHCN - BVTKSCS2, BẢNG LỊCH TRÌNH NGÀY..., CÓ NÚT CHỌN PHÒNG, ẨN CỘT PHÒNG)
        // ============================================================
        function saveExcelBuffer(buffer, fileName) {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 300);
        }

        async function exportSchedule() {
            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const activeDateVal = (document.getElementById('schedule-date')?.value) || (safeSched[0]?.ngay) || '';
            let displayDate = activeDateVal ? activeDateVal.split('-').reverse().join('/') : new Date().toLocaleDateString('vi-VN');

            if (!safeSched.length) {
                return alert("Chưa có dữ liệu lịch trình để xuất file Excel!");
            }

            // Sắp xếp dữ liệu: Đưa bệnh nhân Ra viện (RV) lên trên cùng, sau đó xếp A-Z theo Tên Bệnh Nhân
            safeSched.sort((a, b) => {
                const dA = !!a.__isDischarged;
                const dB = !!b.__isDischarged;
                if (dA !== dB) return dA ? -1 : 1; // 🏃 Ra viện lên đầu bảng

                const nameA = String(a.tenBN || '').trim();
                const nameB = String(b.tenBN || '').trim();
                const nameCmp = nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
                if (nameCmp !== 0) return nameCmp;

                const roomA = String(a.phong || '');
                const roomB = String(b.phong || '');
                const roomCmp = roomA.localeCompare(roomB, 'vi', { numeric: true });
                if (roomCmp !== 0) return roomCmp;

                return String(a.gioDienRa || '').localeCompare(String(b.gioDienRa || ''));
            });

            // Lấy danh sách các phòng hiện có trong ngày xếp lịch
            const roomMap = {};
            safeSched.forEach(row => {
                const rName = String(row.phong || 'Chưa phân phòng').trim();
                if (!roomMap[rName]) roomMap[rName] = [];
                roomMap[rName].push(row);
            });
            const existingRooms = Object.keys(roomMap).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

            // Dòng 1: KHOA YHCT & PHCN - BVTKSCS2 (chuẩn theo mã đơn vị)
            const unitCode = String(typeof getCurrentUnitCode === 'function' ? getCurrentUnitCode() : (localStorage.getItem('pm_current_unit') || 'bvtks_cs2')).toUpperCase();
            const unitShort = (unitCode === 'BVTKS_CS2' ? 'BVTKSCS2' : unitCode);
            const row1Text = `KHOA YHCT & PHCN - ${unitShort}`;

            // Dòng 2: BẢNG LỊCH TRÌNH NGÀY .....(tương ứng với ngày xếp lịch)
            const row2Text = `BẢNG LỊCH TRÌNH NGÀY ${displayDate}`;

            const fileName = `Lich_ThuThuat_${displayDate.replace(/\//g, '-')}.xlsx`;

            // === CƠ CHẾ 1: EXCELJS ENGINE (Hỗ trợ Dropdown List Data Validation và Ẩn cột chuẩn OpenXML) ===
            if (typeof ExcelJS !== 'undefined') {
                try {
                    const workbook = new ExcelJS.Workbook();
                    workbook.creator = 'T.I.M.E.S System - ' + row1Text;
                    workbook.created = new Date();

                    function buildExcelJSSheet(wsTitle, currentRoomText, rowsData) {
                        const ws = workbook.addWorksheet(wsTitle, {
                            views: [{ showGridLines: true }]
                        });

                        // 10 Cột: STT, Tên BN, Năm Sinh, Phòng Điều Trị (ẨN), Thủ Thuật, Bắt Đầu, Kết Thúc, KTV, NV Phụ, Máy
                        ws.columns = [
                            { key: 'stt', width: 6 },
                            { key: 'tenBN', width: 28 },
                            { key: 'namSinh', width: 11 },
                            { key: 'phong', width: 20, hidden: true }, // 🎯 ẨN CỘT PHÒNG HIỆN TẠI ĐI!
                            { key: 'thuThuat', width: 28 },
                            { key: 'gioDienRa', width: 11 },
                            { key: 'gioKetThuc', width: 11 },
                            { key: 'nvChinh', width: 20 },
                            { key: 'nvPhu', width: 18 },
                            { key: 'may', width: 18 }
                        ];

                        // Dòng 1: KHOA YHCT & PHCN - BVTKSCS2
                        ws.mergeCells(1, 1, 1, 10);
                        const c1 = ws.getCell(1, 1);
                        c1.value = row1Text;
                        c1.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E3D2B' } };
                        c1.alignment = { horizontal: 'center', vertical: 'middle' };
                        ws.getRow(1).height = 20;

                        // Dòng 2: BẢNG LỊCH TRÌNH NGÀY .....(tương ứng với ngày xếp lịch)
                        ws.mergeCells(2, 1, 2, 10);
                        const c2 = ws.getCell(2, 1);
                        c2.value = row2Text;
                        c2.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF059669' } };
                        c2.alignment = { horizontal: 'center', vertical: 'middle' };
                        ws.getRow(2).height = 26;

                        // Dòng 3: Phòng .... (tương ứng với các phòng hiện có) và có nút để chọn phòng
                        ws.mergeCells(3, 1, 3, 3);
                        const c3Label = ws.getCell(3, 1);
                        c3Label.value = 'Phòng:';
                        c3Label.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
                        c3Label.alignment = { horizontal: 'right', vertical: 'middle' };

                        ws.mergeCells(3, 5, 3, 7); // Merge từ cột E đến G (tránh cột D đang bị ẩn)
                        const c3Val = ws.getCell(3, 5);
                        c3Val.value = currentRoomText;
                        c3Val.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1D4ED8' } };
                        c3Val.alignment = { horizontal: 'center', vertical: 'middle' };
                        c3Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF5FF' } };
                        c3Val.border = {
                            top: { style: 'thin', color: { argb: 'FF93C5FD' } },
                            bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
                            left: { style: 'thin', color: { argb: 'FF93C5FD' } },
                            right: { style: 'thin', color: { argb: 'FF93C5FD' } }
                        };

                        // Gán nút chọn phòng: Data Validation Dropdown List
                        const allRoomOptions = ['Tất cả các phòng', ...existingRooms];
                        c3Val.dataValidation = {
                            type: 'list',
                            allowBlank: false,
                            formulae: [`"${allRoomOptions.join(',')}"`],
                            showErrorMessage: true,
                            errorTitle: 'Chọn phòng',
                            error: 'Vui lòng chọn phòng trong danh sách các phòng hiện có'
                        };
                        ws.getRow(3).height = 22;

                        // Dòng 4: Dòng trống
                        ws.getRow(4).height = 10;

                        // Dòng 5: Tiêu đề cột bảng
                        const headerNames = ["STT", "Tên Bệnh Nhân", "Năm Sinh", "Phòng Điều Trị", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "KTV / Bác Sĩ", "NV Phụ", "Máy Móc"];
                        ws.getRow(5).height = 26;
                        headerNames.forEach((hName, idx) => {
                            const c = ws.getCell(5, idx + 1);
                            c.value = hName;
                            c.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF1E3D2B' } };
                            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F8F5' } };
                            c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            c.border = {
                                top: { style: 'medium', color: { argb: 'FF000000' } },
                                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                                left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                            };
                        });

                        // Dòng dữ liệu từ Dòng 6
                        rowsData.forEach((row, rIdx) => {
                            const rowNum = 6 + rIdx;
                            ws.getRow(rowNum).height = 22;

                            let tenBNText = String(row.tenBN || '').trim();
                            if (row.__isDischarged) tenBNText += ' (RV)';
                            if (row.__dropped) tenBNText += ' (❌ Rớt)';

                            const nvChinhVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')).trim();
                            const nvPhuVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')).trim();

                            const isRV = !!row.__isDischarged;
                            const rowCells = [
                                rIdx + 1,
                                tenBNText,
                                String(row.namSinh || '').trim(),
                                String(row.phong || 'Chưa phân phòng').trim(),
                                String(row.thuThuat || '').trim(),
                                String(row.gioDienRa || '').trim(),
                                String(row.gioKetThuc || '').trim(),
                                nvChinhVal,
                                nvPhuVal,
                                String(row.may || '--').trim()
                            ];

                            rowCells.forEach((val, cIdx) => {
                                const c = ws.getCell(rowNum, cIdx + 1);
                                c.value = val;

                                const alignH = (cIdx === 0 || cIdx === 2 || cIdx === 3 || cIdx === 5 || cIdx === 6) ? 'center' : 'left';
                                const fontColor = isRV ? (cIdx === 1 ? 'FF7C3AED' : 'FF1E293B') : (cIdx === 5 ? 'FF059669' : 'FF1E293B');

                                c.font = {
                                    name: 'Arial',
                                    size: 10,
                                    bold: isRV || cIdx === 0 || cIdx === 5 || cIdx === 7 || cIdx === 8,
                                    color: { argb: fontColor }
                                };
                                c.alignment = { horizontal: alignH, vertical: 'middle' };

                                if (isRV) {
                                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5EEF8' } };
                                } else if (rIdx % 2 === 1) {
                                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                                }

                                c.border = {
                                    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                                };
                            });
                        });

                        const lastDataRow = 5 + rowsData.length;

                        // Dòng tổng kết cuối bảng
                        const totRow = lastDataRow + 2;
                        ws.getRow(totRow).height = 24;
                        ws.mergeCells(totRow, 1, totRow, 3);
                        const totLabel = ws.getCell(totRow, 1);
                        totLabel.value = 'TỔNG SỐ THỦ THUẬT:';
                        totLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF92400E' } };
                        totLabel.alignment = { horizontal: 'right', vertical: 'middle' };

                        ws.mergeCells(totRow, 5, totRow, 10);
                        const totCount = ws.getCell(totRow, 5);
                        totCount.value = `${rowsData.length} ca thủ thuật (tự động cập nhật theo phòng)`;
                        totCount.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF92400E' } };
                        totCount.alignment = { horizontal: 'left', vertical: 'middle' };

                        for (let c = 1; c <= 10; c++) {
                            const cell = ws.getCell(totRow, c);
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                            cell.border = {
                                top: { style: 'medium', color: { argb: 'FF000000' } },
                                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                                left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                            };
                        }

                        // AutoFilter
                        if (rowsData.length > 0) {
                            ws.autoFilter = {
                                from: { row: 5, column: 1 },
                                to: { row: lastDataRow, column: 10 }
                            };
                        }

                        // Cài đặt trang in A4 ngang chuẩn
                        ws.pageSetup = {
                            paperSize: 9,
                            orientation: 'landscape',
                            fitToPage: true,
                            fitToWidth: 1,
                            fitToHeight: 0,
                            margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
                        };
                    }

                    // 1. Tạo Sheet ẩn chứa dữ liệu gốc _DuLieuGoc
                    const dataWs = workbook.addWorksheet('_DuLieuGoc', { state: 'hidden' });
                    dataWs.columns = [
                        { key: 'stt', width: 6 },
                        { key: 'tenBN', width: 28 },
                        { key: 'namSinh', width: 11 },
                        { key: 'phong', width: 20 },
                        { key: 'thuThuat', width: 28 },
                        { key: 'gioDienRa', width: 11 },
                        { key: 'gioKetThuc', width: 11 },
                        { key: 'nvChinh', width: 20 },
                        { key: 'nvPhu', width: 18 },
                        { key: 'may', width: 18 },
                        { key: 'filterIdx', width: 10 }
                    ];

                    // Header dòng 1 của _DuLieuGoc (ô K1 đặt số 0 để hàm MAX luôn tính chính xác)
                    dataWs.addRow(["STT", "Tên Bệnh Nhân", "Năm Sinh", "Phòng Điều Trị", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "KTV / Bác Sĩ", "NV Phụ", "Máy Móc", 0]);

                    safeSched.forEach((row, idx) => {
                        const rNum = idx + 2;
                        let tenBNText = String(row.tenBN || '').trim();
                        if (row.__isDischarged) tenBNText += ' (RV)';
                        if (row.__dropped) tenBNText += ' (❌ Rớt)';

                        const nvChinhVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')).trim();
                        const nvPhuVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')).trim();

                        const dRow = dataWs.addRow([
                            idx + 1,
                            tenBNText,
                            String(row.namSinh || '').trim(),
                            String(row.phong || 'Chưa phân phòng').trim(),
                            String(row.thuThuat || '').trim(),
                            String(row.gioDienRa || '').trim(),
                            String(row.gioKetThuc || '').trim(),
                            nvChinhVal,
                            nvPhuVal,
                            String(row.may || '--').trim()
                        ]);

                        // Cột 11 (K): FilterIndex tính toán động theo ô E3 của sheet 'Lịch Trình'
                        dRow.getCell(11).value = {
                            formula: `IF(OR('Lịch Trình'!$E$3="Tất cả các phòng",'Lịch Trình'!$E$3="Tất cả",TRIM(D${rNum})=TRIM('Lịch Trình'!$E$3)),MAX($K$1:K${rNum - 1})+1,"")`,
                            result: idx + 1
                        };
                    });

                    const totalDataRows = safeSched.length;

                    // 2. Tạo Sheet hiển thị chính: 'Lịch Trình' (tương tác động với dropdown chọn phòng)
                    const ws = workbook.addWorksheet('Lịch Trình', {
                        views: [{ showGridLines: true }]
                    });

                    // 10 Cột: STT, Tên BN, Năm Sinh, Phòng Điều Trị (ẨN), Thủ Thuật, Bắt Đầu, Kết Thúc, KTV, NV Phụ, Máy
                    ws.columns = [
                        { key: 'stt', width: 6 },
                        { key: 'tenBN', width: 28 },
                        { key: 'namSinh', width: 11 },
                        { key: 'phong', width: 20, hidden: true }, // 🎯 ẨN CỘT PHÒNG HIỆN TẠI ĐI!
                        { key: 'thuThuat', width: 28 },
                        { key: 'gioDienRa', width: 11 },
                        { key: 'gioKetThuc', width: 11 },
                        { key: 'nvChinh', width: 20 },
                        { key: 'nvPhu', width: 18 },
                        { key: 'may', width: 18 }
                    ];

                    // Dòng 1: KHOA YHCT & PHCN - BVTKSCS2
                    ws.mergeCells(1, 1, 1, 10);
                    const c1 = ws.getCell(1, 1);
                    c1.value = row1Text;
                    c1.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E3D2B' } };
                    c1.alignment = { horizontal: 'center', vertical: 'middle' };
                    ws.getRow(1).height = 20;

                    // Dòng 2: BẢNG LỊCH TRÌNH NGÀY .....(tương ứng với ngày xếp lịch)
                    ws.mergeCells(2, 1, 2, 10);
                    const c2 = ws.getCell(2, 1);
                    c2.value = row2Text;
                    c2.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF059669' } };
                    c2.alignment = { horizontal: 'center', vertical: 'middle' };
                    ws.getRow(2).height = 26;

                    // Dòng 3: Phòng .... (tương ứng với các phòng hiện có) và có nút để chọn phòng
                    ws.mergeCells(3, 1, 3, 3);
                    const c3Label = ws.getCell(3, 1);
                    c3Label.value = 'Phòng:';
                    c3Label.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
                    c3Label.alignment = { horizontal: 'right', vertical: 'middle' };

                    ws.mergeCells(3, 5, 3, 7); // Merge từ cột E đến G (tránh cột D đang bị ẩn)
                    const c3Val = ws.getCell(3, 5);
                    c3Val.value = 'Tất cả các phòng';
                    c3Val.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1D4ED8' } };
                    c3Val.alignment = { horizontal: 'center', vertical: 'middle' };
                    c3Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF5FF' } };
                    c3Val.border = {
                        top: { style: 'thin', color: { argb: 'FF93C5FD' } },
                        bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
                        left: { style: 'thin', color: { argb: 'FF93C5FD' } },
                        right: { style: 'thin', color: { argb: 'FF93C5FD' } }
                    };

                    // Gán nút chọn phòng: Data Validation Dropdown List
                    const allRoomOptions = ['Tất cả các phòng', ...existingRooms];
                    c3Val.dataValidation = {
                        type: 'list',
                        allowBlank: false,
                        formulae: [`"${allRoomOptions.join(',')}"`],
                        showErrorMessage: true,
                        errorTitle: 'Chọn phòng',
                        error: 'Vui lòng chọn phòng trong danh sách các phòng hiện có'
                    };
                    ws.getRow(3).height = 22;

                    // Dòng 4: Dòng trống
                    ws.getRow(4).height = 10;

                    // Dòng 5: Tiêu đề cột bảng
                    const headerNames = ["STT", "Tên Bệnh Nhân", "Năm Sinh", "Phòng Điều Trị", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "KTV / Bác Sĩ", "NV Phụ", "Máy Móc"];
                    ws.getRow(5).height = 26;
                    headerNames.forEach((hName, idx) => {
                        const c = ws.getCell(5, idx + 1);
                        c.value = hName;
                        c.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF1E3D2B' } };
                        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F8F5' } };
                        c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        c.border = {
                            top: { style: 'medium', color: { argb: 'FF000000' } },
                            bottom: { style: 'medium', color: { argb: 'FF000000' } },
                            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                        };
                    });

                    // Dòng dữ liệu từ Dòng 6: Sử dụng CÔNG THỨC ĐỘNG liên kết với _DuLieuGoc và ô chọn phòng E3
                    safeSched.forEach((row, rIdx) => {
                        const rowNum = 6 + rIdx;
                        const k = rIdx + 1; // Số thứ tự dòng cần lấy
                        ws.getRow(rowNum).height = 22;

                        let tenBNText = String(row.tenBN || '').trim();
                        if (row.__isDischarged) tenBNText += ' (RV)';
                        if (row.__dropped) tenBNText += ' (❌ Rớt)';

                        const nvChinhVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')).trim();
                        const nvPhuVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')).trim();

                        const isRV = !!row.__isDischarged;

                        // Định nghĩa công thức + kết quả mặc định ban đầu cho từng cột
                        const cellConfigs = [
                            // 1. STT
                            { formula: `IFERROR(IF(MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0),${k},""),"")`, result: k },
                            // 2. Tên BN
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$B$2:$B$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: tenBNText },
                            // 3. Năm Sinh
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$C$2:$C$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: String(row.namSinh || '').trim() },
                            // 4. Phòng (Cột ẩn)
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$D$2:$D$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: String(row.phong || 'Chưa phân phòng').trim() },
                            // 5. Thủ Thuật
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$E$2:$E$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: String(row.thuThuat || '').trim() },
                            // 6. Bắt Đầu
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$F$2:$F$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: String(row.gioDienRa || '').trim() },
                            // 7. Kết Thúc
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$G$2:$G$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: String(row.gioKetThuc || '').trim() },
                            // 8. KTV / Bác Sĩ
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$H$2:$H$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: nvChinhVal },
                            // 9. NV Phụ
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$I$2:$I$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: nvPhuVal },
                            // 10. Máy Móc
                            { formula: `IFERROR(INDEX(_DuLieuGoc!$J$2:$J$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, result: String(row.may || '--').trim() }
                        ];

                        cellConfigs.forEach((cfg, cIdx) => {
                            const c = ws.getCell(rowNum, cIdx + 1);
                            c.value = cfg;

                            const alignH = (cIdx === 0 || cIdx === 2 || cIdx === 3 || cIdx === 5 || cIdx === 6) ? 'center' : 'left';
                            const fontColor = isRV ? (cIdx === 1 ? 'FF7C3AED' : 'FF1E293B') : (cIdx === 5 ? 'FF059669' : 'FF1E293B');

                            c.font = {
                                name: 'Arial',
                                size: 10,
                                bold: isRV || cIdx === 0 || cIdx === 5 || cIdx === 7 || cIdx === 8,
                                color: { argb: fontColor }
                            };
                            c.alignment = { horizontal: alignH, vertical: 'middle' };

                            if (isRV) {
                                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5EEF8' } };
                            } else if (rIdx % 2 === 1) {
                                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                            }

                            c.border = {
                                top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                                left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                            };
                        });
                    });

                    const lastDataRow = 5 + totalDataRows;

                    // Dòng tổng kết cuối bảng: Sử dụng công thức COUNT tự động co giãn theo số ca lọc được
                    const totRow = lastDataRow + 2;
                    ws.getRow(totRow).height = 24;
                    ws.mergeCells(totRow, 1, totRow, 3);
                    const totLabel = ws.getCell(totRow, 1);
                    totLabel.value = 'TỔNG SỐ THỦ THUẬT:';
                    totLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF92400E' } };
                    totLabel.alignment = { horizontal: 'right', vertical: 'middle' };

                    ws.mergeCells(totRow, 5, totRow, 10);
                    const totCount = ws.getCell(totRow, 5);
                    totCount.value = {
                        formula: `COUNT(A6:A${lastDataRow}) & " ca thủ thuật (tự động cập nhật theo phòng)"`,
                        result: `${totalDataRows} ca thủ thuật (tự động cập nhật theo phòng)`
                    };
                    totCount.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF92400E' } };
                    totCount.alignment = { horizontal: 'left', vertical: 'middle' };

                    for (let c = 1; c <= 10; c++) {
                        const cell = ws.getCell(totRow, c);
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                        cell.border = {
                            top: { style: 'medium', color: { argb: 'FF000000' } },
                            bottom: { style: 'medium', color: { argb: 'FF000000' } },
                            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                        };
                    }

                    // Cài đặt trang in A4 ngang chuẩn
                    ws.pageSetup = {
                        paperSize: 9,
                        orientation: 'landscape',
                        fitToPage: true,
                        fitToWidth: 1,
                        fitToHeight: 0,
                        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
                    };

                    // 3. Tạo thêm các Sheet riêng biệt tĩnh cho từng phòng hiện có (rất thuận tiện khi in ấn phân phòng)
                    if (existingRooms.length > 1) {
                        function buildStaticRoomSheet(wsTitle, currentRoomText, rowsData) {
                            const rWs = workbook.addWorksheet(wsTitle, {
                                views: [{ showGridLines: true }]
                            });

                            rWs.columns = [
                                { key: 'stt', width: 6 },
                                { key: 'tenBN', width: 28 },
                                { key: 'namSinh', width: 11 },
                                { key: 'phong', width: 20, hidden: true },
                                { key: 'thuThuat', width: 28 },
                                { key: 'gioDienRa', width: 11 },
                                { key: 'gioKetThuc', width: 11 },
                                { key: 'nvChinh', width: 20 },
                                { key: 'nvPhu', width: 18 },
                                { key: 'may', width: 18 }
                            ];

                            // Dòng 1: KHOA YHCT & PHCN - BVTKSCS2
                            rWs.mergeCells(1, 1, 1, 10);
                            const rc1 = rWs.getCell(1, 1);
                            rc1.value = row1Text;
                            rc1.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E3D2B' } };
                            rc1.alignment = { horizontal: 'center', vertical: 'middle' };
                            rWs.getRow(1).height = 20;

                            // Dòng 2: BẢNG LỊCH TRÌNH NGÀY .....(tương ứng ngày xếp lịch)
                            rWs.mergeCells(2, 1, 2, 10);
                            const rc2 = rWs.getCell(2, 1);
                            rc2.value = row2Text;
                            rc2.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF059669' } };
                            rc2.alignment = { horizontal: 'center', vertical: 'middle' };
                            rWs.getRow(2).height = 26;

                            // Dòng 3: Phòng ....
                            rWs.mergeCells(3, 1, 3, 3);
                            const rc3Label = rWs.getCell(3, 1);
                            rc3Label.value = 'Phòng:';
                            rc3Label.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
                            rc3Label.alignment = { horizontal: 'right', vertical: 'middle' };

                            rWs.mergeCells(3, 5, 3, 7);
                            const rc3Val = rWs.getCell(3, 5);
                            rc3Val.value = currentRoomText;
                            rc3Val.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1D4ED8' } };
                            rc3Val.alignment = { horizontal: 'center', vertical: 'middle' };
                            rc3Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF5FF' } };
                            rc3Val.border = {
                                top: { style: 'thin', color: { argb: 'FF93C5FD' } },
                                bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
                                left: { style: 'thin', color: { argb: 'FF93C5FD' } },
                                right: { style: 'thin', color: { argb: 'FF93C5FD' } }
                            };
                            rWs.getRow(3).height = 22;

                            // Dòng 4: Dòng trống
                            rWs.getRow(4).height = 10;

                            // Dòng 5: Tiêu đề cột
                            rWs.getRow(5).height = 26;
                            headerNames.forEach((hName, idx) => {
                                const c = rWs.getCell(5, idx + 1);
                                c.value = hName;
                                c.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF1E3D2B' } };
                                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F8F5' } };
                                c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                                c.border = {
                                    top: { style: 'medium', color: { argb: 'FF000000' } },
                                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                                };
                            });

                            // Dòng dữ liệu từ Dòng 6
                            rowsData.forEach((row, rIdx) => {
                                const rowNum = 6 + rIdx;
                                rWs.getRow(rowNum).height = 22;

                                let tenBNText = String(row.tenBN || '').trim();
                                if (row.__isDischarged) tenBNText += ' (RV)';
                                if (row.__dropped) tenBNText += ' (❌ Rớt)';

                                const nvChinhVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')).trim();
                                const nvPhuVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')).trim();

                                const isRV = !!row.__isDischarged;
                                const rowCells = [
                                    rIdx + 1,
                                    tenBNText,
                                    String(row.namSinh || '').trim(),
                                    String(row.phong || 'Chưa phân phòng').trim(),
                                    String(row.thuThuat || '').trim(),
                                    String(row.gioDienRa || '').trim(),
                                    String(row.gioKetThuc || '').trim(),
                                    nvChinhVal,
                                    nvPhuVal,
                                    String(row.may || '--').trim()
                                ];

                                rowCells.forEach((val, cIdx) => {
                                    const c = rWs.getCell(rowNum, cIdx + 1);
                                    c.value = val;

                                    const alignH = (cIdx === 0 || cIdx === 2 || cIdx === 3 || cIdx === 5 || cIdx === 6) ? 'center' : 'left';
                                    const fontColor = isRV ? (cIdx === 1 ? 'FF7C3AED' : 'FF1E293B') : (cIdx === 5 ? 'FF059669' : 'FF1E293B');

                                    c.font = {
                                        name: 'Arial',
                                        size: 10,
                                        bold: isRV || cIdx === 0 || cIdx === 5 || cIdx === 7 || cIdx === 8,
                                        color: { argb: fontColor }
                                    };
                                    c.alignment = { horizontal: alignH, vertical: 'middle' };

                                    if (isRV) {
                                        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5EEF8' } };
                                    } else if (rIdx % 2 === 1) {
                                        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                                    }

                                    c.border = {
                                        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                        bottom: { style: 'medium', color: { argb: 'FF000000' } },
                                        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                                    };
                                });
                            });

                            const roomLastRow = 5 + rowsData.length;
                            const roomTotRow = roomLastRow + 2;
                            rWs.getRow(roomTotRow).height = 24;
                            rWs.mergeCells(roomTotRow, 1, roomTotRow, 3);
                            const rTotLabel = rWs.getCell(roomTotRow, 1);
                            rTotLabel.value = 'TỔNG SỐ THỦ THUẬT:';
                            rTotLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF92400E' } };
                            rTotLabel.alignment = { horizontal: 'right', vertical: 'middle' };

                            rWs.mergeCells(roomTotRow, 5, roomTotRow, 10);
                            const rTotCount = rWs.getCell(roomTotRow, 5);
                            rTotCount.value = `${rowsData.length} ca thủ thuật`;
                            rTotCount.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF92400E' } };
                            rTotCount.alignment = { horizontal: 'left', vertical: 'middle' };

                            for (let c = 1; c <= 10; c++) {
                                const cell = rWs.getCell(roomTotRow, c);
                                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                                cell.border = {
                                    top: { style: 'medium', color: { argb: 'FF000000' } },
                                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                                };
                            }

                            rWs.pageSetup = {
                                paperSize: 9,
                                orientation: 'landscape',
                                fitToPage: true,
                                fitToWidth: 1,
                                fitToHeight: 0,
                                margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
                            };
                        }

                        const usedNames = new Set(['lịch trình', '_dulieugoc']);
                        existingRooms.forEach(rName => {
                            let cleanName = String(rName || '').trim().replace(/[\\/?*:[\]]/g, '-').substring(0, 31);
                            if (!cleanName) cleanName = 'Phòng';
                            let finalSheetName = cleanName;
                            let cnt = 1;
                            while (usedNames.has(finalSheetName.toLowerCase())) {
                                finalSheetName = `${cleanName.substring(0, 27)}_${cnt++}`;
                            }
                            usedNames.add(finalSheetName.toLowerCase());

                            buildStaticRoomSheet(finalSheetName, rName, roomMap[rName] || []);
                        });
                    }

                    const buffer = await workbook.xlsx.writeBuffer();
                    saveExcelBuffer(buffer, fileName);
                    if (typeof showToast === 'function') showToast("📂 Đã xuất file Excel lịch trình có nút chọn phòng tương tác!");
                    return;
                } catch (errExcelJS) {
                    console.warn('[exportSchedule] Lỗi ExcelJS, chuyển sang fallback XLSX:', errExcelJS);
                }
            }

            // === CƠ CHẾ 2: FALLBACK BẰNG XLSX (xlsx-js-style) ===
            if (typeof XLSX === 'undefined') {
                return alert("Thư viện xuất Excel đang được nạp, vui lòng thử lại sau 1-2 giây!");
            }

            const wb = XLSX.utils.book_new();

            // 1. Tạo Sheet ẩn dữ liệu gốc _DuLieuGoc
            const dataRows = [
                ["STT", "Tên Bệnh Nhân", "Năm Sinh", "Phòng Điều Trị", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "KTV / Bác Sĩ", "NV Phụ", "Máy Móc", 0]
            ];
            safeSched.forEach((row, idx) => {
                const rNum = idx + 2;
                let tenBNText = String(row.tenBN || '').trim();
                if (row.__isDischarged) tenBNText += ' (RV)';
                if (row.__dropped) tenBNText += ' (❌ Rớt)';

                const nvChinhVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')).trim();
                const nvPhuVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')).trim();

                dataRows.push([
                    idx + 1,
                    tenBNText,
                    String(row.namSinh || '').trim(),
                    String(row.phong || 'Chưa phân phòng').trim(),
                    String(row.thuThuat || '').trim(),
                    String(row.gioDienRa || '').trim(),
                    String(row.gioKetThuc || '').trim(),
                    nvChinhVal,
                    nvPhuVal,
                    String(row.may || '--').trim(),
                    { t: 'n', f: `IF(OR('Lịch Trình'!$E$3="Tất cả các phòng",'Lịch Trình'!$E$3="Tất cả",TRIM(D${rNum})=TRIM('Lịch Trình'!$E$3)),MAX($K$1:K${rNum - 1})+1,"")`, v: idx + 1 }
                ]);
            });
            const wsData = XLSX.utils.aoa_to_sheet(dataRows);
            XLSX.utils.book_append_sheet(wb, wsData, "_DuLieuGoc");
            if (typeof XLSX.utils.book_set_sheet_visibility === 'function') {
                XLSX.utils.book_set_sheet_visibility(wb, 0, 1); // 1 = Hidden
            }

            // 2. Tạo Sheet Lịch Trình động
            const totalDataRows = safeSched.length;
            const ws_data = [
                [row1Text],
                [row2Text],
                ["", "", "", "", "Tất cả các phòng"],
                [""],
                ["STT", "Tên Bệnh Nhân", "Năm Sinh", "Phòng Điều Trị", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "KTV / Bác Sĩ", "NV Phụ", "Máy Móc"]
            ];
            ws_data[2][0] = "Phòng:";

            safeSched.forEach((row, idx) => {
                const k = idx + 1;
                let tenBNText = String(row.tenBN || '').trim();
                if (row.__isDischarged) tenBNText += ' (RV)';
                if (row.__dropped) tenBNText += ' (❌ Rớt)';

                const nvChinhVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')).trim();
                const nvPhuVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')).trim();

                ws_data.push([
                    { t: 'n', f: `IFERROR(IF(MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0),${k},""),"")`, v: k },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$B$2:$B$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: tenBNText },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$C$2:$C$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: String(row.namSinh || '').trim() },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$D$2:$D$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: String(row.phong || 'Chưa phân phòng').trim() },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$E$2:$E$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: String(row.thuThuat || '').trim() },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$F$2:$F$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: String(row.gioDienRa || '').trim() },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$G$2:$G$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: String(row.gioKetThuc || '').trim() },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$H$2:$H$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: nvChinhVal },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$I$2:$I$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: nvPhuVal },
                    { t: 's', f: `IFERROR(INDEX(_DuLieuGoc!$J$2:$J$${totalDataRows + 1},MATCH(${k},_DuLieuGoc!$K$2:$K$${totalDataRows + 1},0)),"")`, v: String(row.may || '--').trim() }
                ]);
            });

            const firstDataRow = 6;
            const lastDataRow = totalDataRows + 5;

            ws_data.push([""]);
            ws_data.push([
                "TỔNG SỐ THỦ THUẬT:",
                "",
                "",
                "",
                { t: 's', f: `COUNT(A6:A${lastDataRow}) & " ca thủ thuật (tự động cập nhật theo phòng)"`, v: `${totalDataRows} ca thủ thuật (tự động cập nhật theo phòng)` },
                "", "", "", "", ""
            ]);

            const wsMain = XLSX.utils.aoa_to_sheet(ws_data);
            wsMain['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // A3:C3 "Phòng:"
                { s: { r: 2, c: 4 }, e: { r: 2, c: 6 } }, // E3:G3 "Tất cả các phòng"
                { s: { r: ws_data.length - 1, c: 0 }, e: { r: ws_data.length - 1, c: 2 } },
                { s: { r: ws_data.length - 1, c: 4 }, e: { r: ws_data.length - 1, c: 9 } }
            ];

            wsMain['!cols'] = [
                { wch: 6 },
                { wch: 28 },
                { wch: 11 },
                { wch: 20, hidden: true }, // 🎯 ẨN CỘT PHÒNG HIỆN TẠI ĐI!
                { wch: 28 },
                { wch: 11 },
                { wch: 11 },
                { wch: 20 },
                { wch: 18 },
                { wch: 18 }
            ];

            wsMain['!rows'] = [];
            wsMain['!rows'][0] = { hpt: 20 };
            wsMain['!rows'][1] = { hpt: 26 };
            wsMain['!rows'][2] = { hpt: 22 };
            wsMain['!rows'][4] = { hpt: 26 };
            for (let r = 5; r < ws_data.length - 2; r++) {
                wsMain['!rows'][r] = { hpt: 22 };
            }
            wsMain['!rows'][ws_data.length - 1] = { hpt: 24 };

            XLSX.utils.book_append_sheet(wb, wsMain, "Lịch Trình");

            // 3. Tạo các Sheet riêng biệt cho từng phòng
            if (existingRooms.length > 1) {
                const usedNames = new Set(['lịch trình', '_dulieugoc']);
                existingRooms.forEach(rName => {
                    let cleanName = String(rName || '').trim().replace(/[\\/?*:[\]]/g, '-').substring(0, 31);
                    if (!cleanName) cleanName = 'Phòng';
                    let finalSheetName = cleanName;
                    let cnt = 1;
                    while (usedNames.has(finalSheetName.toLowerCase())) {
                        finalSheetName = `${cleanName.substring(0, 27)}_${cnt++}`;
                    }
                    usedNames.add(finalSheetName.toLowerCase());

                    const roomRows = roomMap[rName] || [];
                    const r_ws_data = [
                        [row1Text],
                        [row2Text],
                        ["Phòng: " + rName],
                        [""],
                        ["STT", "Tên Bệnh Nhân", "Năm Sinh", "Phòng Điều Trị", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "KTV / Bác Sĩ", "NV Phụ", "Máy Móc"]
                    ];
                    roomRows.forEach((row, idx) => {
                        let tenBNText = String(row.tenBN || '').trim();
                        if (row.__isDischarged) tenBNText += ' (RV)';
                        if (row.__dropped) tenBNText += ' (❌ Rớt)';

                        const nvChinhVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')).trim();
                        const nvPhuVal = String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')).trim();

                        r_ws_data.push([
                            idx + 1,
                            tenBNText,
                            String(row.namSinh || '').trim(),
                            String(row.phong || 'Chưa phân phòng').trim(),
                            String(row.thuThuat || '').trim(),
                            String(row.gioDienRa || '').trim(),
                            String(row.gioKetThuc || '').trim(),
                            nvChinhVal,
                            nvPhuVal,
                            String(row.may || '--').trim()
                        ]);
                    });
                    r_ws_data.push([""]);
                    r_ws_data.push([
                        "TỔNG SỐ THỦ THUẬT:", "", "", "", `${roomRows.length} ca thủ thuật`, "", "", "", "", ""
                    ]);

                    const rWs = XLSX.utils.aoa_to_sheet(r_ws_data);
                    rWs['!merges'] = [
                        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
                        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
                        { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
                        { s: { r: r_ws_data.length - 1, c: 0 }, e: { r: r_ws_data.length - 1, c: 2 } },
                        { s: { r: r_ws_data.length - 1, c: 4 }, e: { r: r_ws_data.length - 1, c: 9 } }
                    ];
                    rWs['!cols'] = [
                        { wch: 6 }, { wch: 28 }, { wch: 11 }, { wch: 20, hidden: true }, { wch: 28 }, { wch: 11 }, { wch: 11 }, { wch: 20 }, { wch: 18 }, { wch: 18 }
                    ];
                    XLSX.utils.book_append_sheet(wb, rWs, finalSheetName);
                });
            }

            XLSX.writeFile(wb, fileName);
            if (typeof showToast === 'function') showToast("📂 Đã xuất file Excel lịch trình có nút chọn phòng tương tác!");
        }

        function printSchedule() {
            if (!filteredSchedData || filteredSchedData.length === 0) {
                return alert("Không có dữ liệu để in! Bác sĩ hãy kiểm tra lại ô tìm kiếm.");
}

            const dateInput = document.getElementById('schedule-date')?.value;

            let displayDate = "......";

            if (dateInput) {
                displayDate = dateInput.split('-').reverse().join('/');
} else if (filteredSchedData[0] && filteredSchedData[0].ngay) {
                displayDate = String(filteredSchedData[0].ngay).split('-').reverse().join('/');
}
            let printData = filteredSchedData.map((r, idx) => ({ ...r, __originalIndex: idx }));

            printData.sort((a, b) => {
                const dA = !!a.__isDischarged;
                const dB = !!b.__isDischarged;
                if (dA !== dB) return dA ? -1 : 1;
                return a.__originalIndex - b.__originalIndex;
            });

            const rows = printData.map((row, i) => {
                const dischargeMark = row.__isDischarged ? ' <span style="font-size:10.5px; font-style:italic; font-weight:700; white-space:nowrap; margin-left:4px; color:#27ae60;">(✔ RV)</span>' : '';
                return `<tr class="${row.__dropped ? 'print-dropped' : ''}">

                <td>${i + 1}</td>

                <td class="text-left nowrap"><strong>${row.tenBN}</strong>${dischargeMark}</td>

                <td>${row.namSinh}</td>

                <td class="text-left">${row.thuThuat}</td>

                <td class="nowrap"><strong>${row.gioDienRa}</strong></td>

                <td class="nowrap"><strong>${row.gioKetThuc}</strong></td>

                <td class="nowrap">${typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')}</td>

                <td class="nowrap">${typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')}</td>

                <td class="nowrap">${row.may}</td>

            </tr>`;
            }).join('');

            const printFrame = document.createElement('iframe');

            printFrame.style.position = 'absolute';

            printFrame.style.top = '-9999px';

            document.body.appendChild(printFrame);

            const doc = printFrame.contentWindow.document;

            doc.open();

            doc.write(`<html><head><title>In Lịch Y Lệnh</title>

                <style>

                    @page { size: landscape; margin: 10mm; }

                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 0; margin: 0; }

                    h2 { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }

                    table { width: 100%; border-collapse: collapse; font-size: 13.5px; }

                    th, td { border: 1px solid #000; padding: 10px 6px; text-align: center; vertical-align: middle; }

                    th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; padding: 12px 6px; }

                    .text-left { text-align: left; padding-left: 10px; }

                    .nowrap { white-space: nowrap; }

                    .print-dropped td { background: #ffd7ba !important; color: #9a3412 !important; font-weight: bold; -webkit-print-color-adjust: exact; }

                </style>

<style>.admin-nav-btn:hover { background: #e0e6ed !important; }</style></head><body>

                <h2>LỊCH Y LỆNH NGÀY ${displayDate}</h2>

                <table>

                    <thead><tr>

                        ${["STT", "Tên Bệnh Nhân", "Năm Sinh", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "NV Chính", "NV Phụ", "Máy"].map(h => `<th>${h}</th>`).join('')}

                    </tr></thead>

                    <tbody>${rows}</tbody>

                </table>

            </body></html>`);

            doc.close();

            setTimeout(() => {
                printFrame.contentWindow.print();

                document.body.removeChild(printFrame);
}, 500);
}

        // ============================================================
        // 📄 XUẤT PDF THEO TỪNG PHÒNG BỆNH (PDFMAKE ENGINE - MULTI-PAGE)
        // ============================================================
        function exportSchedulePDF() {
            if (typeof pdfMake === 'undefined') {
                return alert("Thư viện pdfmake đang được nạp, vui lòng thử lại sau 1-2 giây!");
            }

            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const activeDateVal = (document.getElementById('schedule-date')?.value) || (safeSched[0]?.ngay) || '';
            let displayDate = activeDateVal ? activeDateVal.split('-').reverse().join('/') : new Date().toLocaleDateString('vi-VN');

            if (!safeSched.length) {
                return alert("Chưa có dữ liệu lịch trình để xuất PDF!");
            }

            // 1. Phân nhóm ca thủ thuật theo từng Phòng bệnh
            const roomMap = {};
            safeSched.forEach(row => {
                const roomName = String(row.phong || 'Chưa phân phòng').trim();
                if (!roomMap[roomName]) roomMap[roomName] = [];
                roomMap[roomName].push(row);
            });

            // 2. Sắp xếp danh sách trong từng phòng: BỆNH NHÂN RA VIỆN LÊN ĐẦU TIÊN
            const roomNames = Object.keys(roomMap).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

            roomNames.forEach(rName => {
                roomMap[rName].sort((a, b) => {
                    const dA = !!a.__isDischarged;
                    const dB = !!b.__isDischarged;
                    if (dA !== dB) return dA ? -1 : 1; // 🏃 Ra viện luôn luôn lên đầu tiên
                    const tA = String(a.gioDienRa || '');
                    const tB = String(b.gioDienRa || '');
                    if (tA !== tB) return tA.localeCompare(tB);
                    return String(a.tenBN || '').localeCompare(String(b.tenBN || ''), 'vi');
                });
            });

            // 3. Xây dựng nội dung tài liệu PDF với mỗi phòng bắt đầu trên trang mới
            const content = [];

            roomNames.forEach((rName, rIdx) => {
                const roomRows = roomMap[rName];
                const dischargedCount = roomRows.filter(r => r.__isDischarged).length;

                // Bảng dữ liệu của riêng phòng này (có cột NV Phụ)
                const bodyTable = [
                    [
                        { text: 'STT', style: 'tableHeader', alignment: 'center' },
                        { text: 'Tên Bệnh Nhân', style: 'tableHeader' },
                        { text: 'Năm Sinh', style: 'tableHeader', alignment: 'center' },
                        { text: 'Thủ Thuật', style: 'tableHeader' },
                        { text: 'Bắt Đầu', style: 'tableHeader', alignment: 'center' },
                        { text: 'Kết Thúc', style: 'tableHeader', alignment: 'center' },
                        { text: 'KTV / Bác Sĩ', style: 'tableHeader' },
                        { text: 'NV Phụ', style: 'tableHeader' },
                        { text: 'Máy Móc', style: 'tableHeader' }
                    ]
                ];

                roomRows.forEach((row, idx) => {
                    let tenBN = String(row.tenBN || '').trim();
                    const isRV = !!row.__isDischarged;
                    if (isRV) {
                        tenBN += ' (RV)';
                    }

                    bodyTable.push([
                        { text: String(idx + 1), alignment: 'center', fontSize: 9 },
                        { text: tenBN, bold: isRV, color: isRV ? '#7c3aed' : '#1e293b', fontSize: 9.5 },
                        { text: String(row.namSinh || ''), alignment: 'center', fontSize: 9 },
                        { text: String(row.thuThuat || ''), fontSize: 9 },
                        { text: String(row.gioDienRa || ''), alignment: 'center', bold: true, color: '#059669', fontSize: 9 },
                        { text: String(row.gioKetThuc || ''), alignment: 'center', fontSize: 9 },
                        { text: String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvChinh) : (row.nvChinh || '')), bold: true, fontSize: 9 },
                        { text: String(typeof window.cleanAndHealStaffName === 'function' ? window.cleanAndHealStaffName(row.nvPhu) : (row.nvPhu || '')), fontSize: 8.5 },
                        { text: String(row.may || '--'), fontSize: 8.5 }
                    ]);
                });

                // Mỗi phòng từ phòng thứ 2 trở đi sẽ tự động sang trang mới
                const roomSection = [
                    {
                        columns: [
                            {
                                width: '*',
                                text: [
                                    { text: (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase() + '\n', bold: true, fontSize: 9.5 },
                                    { text: 'KHOA YHCT - PHỤC HỒI CHỨC NĂNG', bold: true, fontSize: 10.5, color: '#1e3d2b' }
                                ]
                            },
                            {
                                width: 'auto',
                                text: `Ngày thực hiện: ${displayDate}`,
                                alignment: 'right',
                                italics: true,
                                fontSize: 9.5,
                                color: '#475569'
                            }
                        ]
                    },
                    {
                        text: `BẢNG LỊCH TRÌNH ĐIỀU TRỊ THỦ THUẬT - ${rName.toUpperCase()}`,
                        style: 'mainHeader',
                        alignment: 'center',
                        margin: [0, 4, 0, 8]
                    },
                    {
                        table: {
                            headerRows: 1,
                            widths: [20, 130, 42, 135, 42, 42, 95, 95, '*'],
                            body: bodyTable
                        },
                        layout: {
                            fillColor: function (rowIndex) {
                                if (rowIndex === 0) return '#e8f8f5';
                                const isDischargedRow = roomRows[rowIndex - 1] && roomRows[rowIndex - 1].__isDischarged;
                                if (isDischargedRow) return '#f5eef8'; // Highlight tím nhạt cho BN ra viện
                                return rowIndex % 2 === 0 ? '#fcfcfc' : null;
                            },
                            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 1.5 : 1,
                            vLineWidth: () => 0.5,
                            hLineColor: () => '#000000',
                            vLineColor: () => '#cbd5e1'
                        }
                    },
                    {
                        margin: [0, 6, 0, 0],
                        text: `Tổng số: ${roomRows.length} ca thủ thuật ${dischargedCount > 0 ? '(' + dischargedCount + ' ca RV)' : ''}`,
                        italic: true,
                        fontSize: 9,
                        color: '#64748b'
                    }
                ];

                if (rIdx > 0) {
                    roomSection[0].pageBreak = 'before';
                }

                content.push(...roomSection);
            });

            const docDefinition = {
                pageSize: 'A4',
                pageOrientation: 'landscape',
                pageMargins: [20, 15, 20, 15],
                content: content,
                styles: {
                    mainHeader: { fontSize: 13, bold: true, color: '#1e3d2b' },
                    tableHeader: { bold: true, fontSize: 9.5, color: '#1e3d2b' }
                },
                defaultStyle: {
                    font: 'Roboto'
                }
            };

            try {
                pdfMake.createPdf(docDefinition).download(`Lich_ThuThuat_TheoPhong_${displayDate.replace(/\//g, '-')}.pdf`);
                if (typeof showToast === 'function') showToast("📄 Đang tải file PDF lịch trình theo từng phòng...");
            } catch (e) {
                console.error("Lỗi xuất PDF:", e);
                alert("Lỗi xuất PDF: " + e.message);
            }
        }
        window.exportSchedulePDF = exportSchedulePDF;

        // ============================================================
        // ⏱️ CHẾ ĐỘ XEM TIMELINE Y TẾ (MEDICAL RESOURCE TIMELINE)
        // ============================================================
        let timelineGroupBy = 'room'; // 'room' | 'staff'
        let timelineShift = 'all';    // 'all' | 'morning' | 'afternoon'

        function setTimelineGroupBy(groupBy) {
            timelineGroupBy = groupBy;
            const btnRoom = document.getElementById('btn-tl-room');
            const btnStaff = document.getElementById('btn-tl-staff');
            if (btnRoom) btnRoom.className = `timeline-btn-pill ${groupBy === 'room' ? 'active' : ''}`;
            if (btnStaff) btnStaff.className = `timeline-btn-pill ${groupBy === 'staff' ? 'active' : ''}`;
            renderScheduleGanttTimeline();
        }
        window.setTimelineGroupBy = setTimelineGroupBy;

        function setTimelineShift(shift) {
            timelineShift = shift;
            const btnAll = document.getElementById('btn-tl-all');
            const btnMorn = document.getElementById('btn-tl-morning');
            const btnAft = document.getElementById('btn-tl-afternoon');
            if (btnAll) btnAll.className = `timeline-btn-pill ${shift === 'all' ? 'active' : ''}`;
            if (btnMorn) btnMorn.className = `timeline-btn-pill ${shift === 'morning' ? 'active' : ''}`;
            if (btnAft) btnAft.className = `timeline-btn-pill ${shift === 'afternoon' ? 'active' : ''}`;
            renderScheduleGanttTimeline();
        }
        window.setTimelineShift = setTimelineShift;

        function toggleScheduleViewMode(mode) {
            const tableWrap = document.querySelector('.schedule-table-wrap');
            const ganttWrap = document.getElementById('schedule-gantt-wrap');
            const btnTable = document.getElementById('btn-view-table');
            const btnGantt = document.getElementById('btn-view-gantt');

            if (mode === 'gantt') {
                if (tableWrap) tableWrap.style.display = 'none';
                if (ganttWrap) ganttWrap.style.display = 'flex';
                if (btnTable) { btnTable.className = 'btn-secondary'; }
                if (btnGantt) { btnGantt.className = 'btn-success'; }
                renderScheduleGanttTimeline();
            } else {
                if (tableWrap) tableWrap.style.display = 'block';
                if (ganttWrap) ganttWrap.style.display = 'none';
                if (btnTable) { btnTable.className = 'btn-success'; }
                if (btnGantt) { btnGantt.className = 'btn-secondary'; }
            }
        }
        window.toggleScheduleViewMode = toggleScheduleViewMode;

        // ============================================================
        // ⚡ XUẤT DỮ LIỆU ĐỂ TỰ ĐỘNG NHẬP emrHIS (AUTO-emrHIS BOT)
        // ============================================================
        function exportDataForHisAuto() {
            const rawSched = (window.currentScheduleData && window.currentScheduleData.length) ? window.currentScheduleData : 
                             ((typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : []);
            const safeSched = rawSched.map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            
            if (!safeSched.length) {
                if (typeof window.showToast === 'function') {
                    window.showToast('⚠️ Chưa có dữ liệu lịch trình để xuất sang emrHIS!', 'warning');
                } else {
                    alert('Chưa có dữ liệu lịch trình để xuất sang emrHIS!');
                }
                return;
            }

            const activeDateVal = (document.getElementById('history-date')?.value) || 
                                  (document.getElementById('schedule-date')?.value) || 
                                  (safeSched[0]?.ngay) || '';

            // Định dạng ngày theo chuẩn emrHIS: dd/MM/yyyy
            let ddmmyyyy = '';
            if (activeDateVal) {
                const parts = activeDateVal.split('-');
                if (parts.length === 3) {
                    ddmmyyyy = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
                }
            }
            if (!ddmmyyyy) {
                const now = new Date();
                ddmmyyyy = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
            }

            // Chuẩn hóa danh sách nhân sự để lấy mã emrHIS (tenHis ví dụ: hdd, dpt)
            const staffList = (typeof dataCache !== 'undefined' && dataCache.staff) ? dataCache.staff : [];
            const staffMap = {};
            staffList.forEach(s => {
                if (s.ten) {
                    staffMap[s.ten.trim().toLowerCase()] = s;
                }
            });

            const emrTasks = safeSched.map((r, idx) => {
                const tenBnClean = String(r.tenBN || '').replace(/\s*\((RV|❌\s*Rớt)\)\s*$/i, '').trim();
                const nvChinh = String(r.nguoiThucHien || r.nvChinh || '').trim();
                const staffObj = staffMap[nvChinh.toLowerCase()] || {};
                const padTime = (t) => {
                    if (!t) return '08:00';
                    const parts = String(t).trim().split(':');
                    if (parts.length >= 2) {
                        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                    }
                    return String(t).trim();
                };

                const getStaffInitials = (name) => {
                    if (!name) return 'hdd';
                    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                        .split(/\s+/).filter(Boolean)
                        .map(w => w[0].toLowerCase()).join('');
                };

                let ktvMa = String(staffObj.tenHis || staffObj.his_name || '').trim();
                if (!ktvMa) {
                    ktvMa = getStaffInitials(nvChinh);
                }

                const gioBd = padTime(r.gioDienRa || r.GIODIENRA || r.gioVao || '08:00');
                const gioKt = padTime(r.gioKetThuc || r.GIOKETTHUC || r.gioRa || '08:30');

                return {
                    stt: idx + 1,
                    ten_bn: tenBnClean,
                    nam_sinh: r.namSinh || '',
                    thu_thuat: String(r.thuThuat || '').trim(),
                    gio_bat_dau: gioBd,
                    gio_ket_thuc: gioKt,
                    ngay: ddmmyyyy,
                    ngay_gio_bd: `${gioBd} ${ddmmyyyy}`,
                    ngay_gio_kt: `${gioKt} ${ddmmyyyy}`,
                    tinh_hinh: "Chủ động",
                    vo_cam: "Khác",
                    may_y_te: String(r.mayMoc || r.may || '').trim(),
                    mo_ta: ".",
                    ktv_ma: ktvMa,
                    ktv_ten: nvChinh,
                    phong: String(r.phong || '').trim()
                };
            });

            const exportObj = {
                version: "2.0",
                software: "emrHIS",
                exportedAt: new Date().toISOString(),
                date: activeDateVal,
                dateDisplay: ddmmyyyy,
                totalProcedures: emrTasks.length,
                tasks: emrTasks,
                schedule: safeSched
            };

            const jsonStr = JSON.stringify(exportObj, null, 2);

            // 1. Tự động Copy vào Clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(jsonStr).then(() => {
                    console.log("Đã copy lệnh emrHIS vào Clipboard");
                }).catch(e => console.warn("Lỗi copy clipboard:", e));
            }

            // 2. Tải file emrhis_tasks.json
            try {
                const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `emrhis_tasks_${activeDateVal || 'today'}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Lỗi tải file JSON emrHIS:", err);
            }

            const msg = `🤖 ĐÃ XUẤT ${emrTasks.length} LỆNH THỦ THUẬT CHO emrHIS!\n\n1. Đã TỰ ĐỘNG SAO CHÉP VÀO BỘ NHỚ TẠM (CLIPBOARD).\n   👉 Bạn chỉ cần mở tool 'emrHIS Bot' và bấm nút '📋 Dán từ Clipboard' là nạp được ngay!\n\n2. Đồng thời đã tải file: 'emrhis_tasks_${activeDateVal || 'today'}.json'.`;
            if (typeof window.showToast === 'function') {
                window.showToast(`🤖 Đã xuất ${emrTasks.length} ca sang emrHIS Bot!`, 'success', 5000);
            }
            alert(msg);
        }
        window.exportDataForHisAuto = exportDataForHisAuto;
        window.exportEmrHisTasks = exportDataForHisAuto;

        function renderScheduleGanttTimeline() {
            const target = document.getElementById('schedule-gantt-target');
            if (!target) return;

            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const totalBadge = document.getElementById('timeline-total-badge');
            if (totalBadge) totalBadge.innerText = `${safeSched.length} ca`;

            if (!safeSched.length) {
                target.innerHTML = `
                    <div style="padding: 50px 20px; text-align: center; color: #94a3b8;">
                        <div style="font-size: 40px; margin-bottom: 10px;">📅</div>
                        <h4 style="margin: 0; color: #475569; font-size: 16px;">Chưa có dữ liệu lịch trình hôm nay</h4>
                        <p style="margin: 6px 0 0 0; font-size: 13px;">Vui lòng bấm nút <b>"CHẠY XẾP LỊCH TỔNG"</b> để khởi tạo dòng thời gian.</p>
                    </div>
                `;
                return;
            }

            // Bộ lọc tìm kiếm mờ thông minh tiếng Việt (Fuse.js)
            const searchQuery = String(document.getElementById('schedule-search-input')?.value || '').trim();
            let schedData = safeSched;
            if (searchQuery) {
                schedData = fuzzySearchList(safeSched, searchQuery, ['tenBN', 'phong', 'nvChinh', 'nvPhu', 'thuThuat', 'may', 'giuong']);
            }

            // Cấu hình khung giờ và độ rộng mỗi slot (30 phút)
            const isWinter = (typeof window !== 'undefined' && typeof window.getCurrentStaffSeason === 'function' && window.getCurrentStaffSeason() === 'winter') ||
                (Array.isArray(safeSched) && safeSched.some(r => {
                    const e = timeToMinutes(r.gioKetThuc);
                    return e > 690 && e <= 750;
                })) ||
                (Array.isArray(window.dataCache?.staff) && window.dataCache.staff.some(s => (s.thoiGianLam || '').includes('12:00')));

            const morningLimitMin = isWinter ? 720 : 690;
            const morningTicks = isWinter 
                ? ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
                : ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
            const afternoonTicks = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

            let slotTicks = [];
            let slotWidth = 95; // px mỗi 30 phút
            let morningSlotCount = morningTicks.length;
            let afternoonSlotCount = afternoonTicks.length;
            let totalCanvasWidth = 0;

            if (timelineShift === 'morning') {
                slotTicks = morningTicks;
                slotWidth = isWinter ? 115 : 130;
                totalCanvasWidth = slotTicks.length * slotWidth;
            } else if (timelineShift === 'afternoon') {
                slotTicks = afternoonTicks;
                slotWidth = 140;
                totalCanvasWidth = slotTicks.length * slotWidth;
            } else {
                slotTicks = [...morningTicks, ...afternoonTicks];
                slotWidth = isWinter ? 88 : 95;
                totalCanvasWidth = slotTicks.length * slotWidth;
            }

            // Hàm chuyển đổi giờ HH:MM sang phút
            function timeToMinutes(tStr) {
                if (!tStr || !tStr.includes(':')) return 0;
                const p = tStr.split(':');
                return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
            }

            // Hàm tính toán pixel Left và Width chính xác
            function calcCardPixel(startMin, endMin) {
                if (timelineShift === 'morning') {
                    if (startMin >= morningLimitMin || endMin <= 450) return null;
                    const s = Math.max(450, startMin);
                    const e = Math.min(morningLimitMin, endMin);
                    const left = ((s - 450) / 30) * slotWidth;
                    const width = Math.max(65, ((e - s) / 30) * slotWidth - 3);
                    return { left, width };
                } else if (timelineShift === 'afternoon') {
                    if (startMin >= 990 || endMin <= 780) return null;
                    const s = Math.max(780, startMin);
                    const e = Math.min(990, endMin);
                    const left = ((s - 780) / 30) * slotWidth;
                    const width = Math.max(65, ((e - s) / 30) * slotWidth - 3);
                    return { left, width };
                } else {
                    // Cả ngày
                    if (startMin < morningLimitMin) {
                        const s = Math.max(450, startMin);
                        const e = Math.min(morningLimitMin, endMin);
                        const left = ((s - 450) / 30) * slotWidth;
                        const width = Math.max(55, ((e - s) / 30) * slotWidth - 3);
                        return { left, width };
                    } else if (startMin >= 750) {
                        const s = Math.max(780, startMin);
                        const e = Math.min(990, endMin);
                        const morningWidth = morningSlotCount * slotWidth;
                        const left = morningWidth + ((s - 780) / 30) * slotWidth;
                        const width = Math.max(55, ((e - s) / 30) * slotWidth - 3);
                        return { left, width };
                    }
                    return null;
                }
            }

            // Gom nhóm theo Phòng hoặc Nhân Viên
            const groups = {};
            schedData.forEach(row => {
                let key = '';
                if (timelineGroupBy === 'staff') {
                    key = String(row.nvChinh || 'Chưa gán KTV').trim();
                } else {
                    key = String(row.phong || 'Chưa phân phòng').trim();
                }
                if (!groups[key]) groups[key] = [];
                groups[key].push(row);
            });

            const groupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

            // Xây dựng Header Bảng
            let html = `
                <div class="timeline-board">
                    <div class="timeline-board-header">
                        <div class="timeline-res-col-hdr">
                            ${timelineGroupBy === 'room' ? '🏥 PHÒNG / GIƯỜNG' : '👨‍⚕️ NHÂN SỰ / KTV'}
                        </div>
                        <div class="timeline-slots-hdr" style="width: ${totalCanvasWidth}px;">
            `;

            slotTicks.forEach(tick => {
                html += `<div class="timeline-slot-tick" style="width: ${slotWidth}px; min-width: ${slotWidth}px;">${tick}</div>`;
            });

            html += `</div></div>`; // Đóng timeline-slots-hdr và timeline-board-header

            // Xây dựng từng hàng dữ liệu với thuật toán xếp Lane
            groupKeys.forEach(gKey => {
                const rows = groups[gKey];
                const rvCount = rows.filter(r => r.__isDischarged).length;

                // Sắp xếp các ca theo giờ bắt đầu tăng dần
                rows.sort((a, b) => timeToMinutes(a.gioDienRa) - timeToMinutes(b.gioDienRa));

                // Thuật toán Lane Packing chống đè thẻ
                const lanes = [];
                const packedCards = [];

                rows.forEach(row => {
                    const sMin = timeToMinutes(row.gioDienRa);
                    const eMin = timeToMinutes(row.gioKetThuc);
                    if (!sMin || !eMin) return;

                    const pos = calcCardPixel(sMin, eMin);
                    if (!pos) return;

                    let assignedLane = -1;
                    for (let l = 0; l < lanes.length; l++) {
                        if (lanes[l] <= sMin) {
                            assignedLane = l;
                            lanes[l] = eMin;
                            break;
                        }
                    }
                    if (assignedLane === -1) {
                        assignedLane = lanes.length;
                        lanes.push(eMin);
                    }

                    packedCards.push({
                        row,
                        left: pos.left,
                        width: pos.width,
                        lane: assignedLane
                    });
                });

                const totalLanes = Math.max(1, lanes.length);
                const trackHeight = totalLanes * 40 + 8;
                const safeGKey = sanitizeInput(gKey);

                html += `
                    <div class="timeline-board-row">
                        <div class="timeline-res-side">
                            <div class="timeline-resource-name" title="${safeGKey}">${timelineGroupBy === 'room' ? '🏥 ' : '👨‍⚕️ '}${safeGKey}</div>
                            <div style="display:flex; gap:4px; flex-wrap:wrap;">
                                <span class="timeline-resource-badge">${packedCards.length} ca</span>
                                ${rvCount > 0 ? `<span class="timeline-resource-badge" style="background:#f5eef8; color:#7c3aed; font-weight:700;">${rvCount} RV</span>` : ''}
                            </div>
                        </div>
                        <div class="timeline-track-canvas" style="width: ${totalCanvasWidth}px; min-width: ${totalCanvasWidth}px; height: ${trackHeight}px;">
                            <div class="timeline-grid-lines">
                `;

                // Vạch kẻ dọc mỗi 30 phút
                slotTicks.forEach(() => {
                    html += `<div class="timeline-grid-tick-line" style="width: ${slotWidth}px; min-width: ${slotWidth}px;"></div>`;
                });

                html += `</div>`; // Đóng timeline-grid-lines

                // Đường phân cách giờ nghỉ trưa (nếu xem cả ngày)
                if (timelineShift === 'all') {
                    const morningBoundary = morningSlotCount * slotWidth;
                    const lunchStartText = isWinter ? '12:00' : '11:30';
                    html += `<div class="timeline-lunch-divider" style="left: ${morningBoundary}px;" title="Nghỉ trưa (${lunchStartText} - 13:00)"></div>`;
                }

                // Render từng Card với tọa độ Left, Width và Top (theo Lane)
                packedCards.forEach(item => {
                    const r = item.row;
                    const topPx = 4 + item.lane * 40;
                    const isRV = !!r.__isDischarged;
                    const isYHCT = String(r.thuThuat || '').toLowerCase().includes('châm') || String(r.thuThuat || '').toLowerCase().includes('xoa bóp') || String(r.thuThuat || '').toLowerCase().includes('cấy chỉ') || String(r.thuThuat || '').toLowerCase().includes('giác');
                    
                    let cardClass = isRV ? 'timeline-card-rv' : (isYHCT ? 'timeline-card-yhct' : 'timeline-card-phcn');

                    const safeTenBN = sanitizeInput(r.tenBN);
                    const safeThuThuat = sanitizeInput(r.thuThuat);
                    const safePhong = sanitizeInput(r.phong || '');
                    const safeGiuong = sanitizeInput(r.giuong || '');
                    const safeNV = sanitizeInput(r.nvChinh || '');
                    const safeNVPhu = sanitizeInput(r.nvPhu || '');
                    const safeMay = sanitizeInput(r.may || '');

                    const tooltipText = `Bệnh nhân: ${safeTenBN} (${r.namSinh || ''})&#10;Thủ thuật: ${safeThuThuat}&#10;Thời gian: ${r.gioDienRa} - ${r.gioKetThuc}&#10;Phòng: ${safePhong} | Giường: ${safeGiuong}&#10;KTV: ${safeNV} ${safeNVPhu ? '(Phụ: ' + safeNVPhu + ')' : ''}&#10;Máy: ${safeMay}`;

                    html += `
                        <div class="timeline-card ${cardClass}" 
                             style="left: ${item.left}px; width: ${item.width}px; top: ${topPx}px;"
                             title="${tooltipText}">
                            <div class="timeline-card-title">
                                <span style="overflow:hidden; text-overflow:ellipsis;">${safeTenBN}</span>
                                ${isRV ? '<span class="rv-badge">RV</span>' : ''}
                            </div>
                            <div class="timeline-card-sub">
                                <span>${safeThuThuat} • ${r.gioDienRa}-${r.gioKetThuc}${safeGiuong ? ' • G.' + safeGiuong : ''}</span>
                            </div>
                        </div>
                    `;
                });

                html += `</div></div>`; // Đóng timeline-track-canvas và timeline-board-row
            });

            html += `</div>`; // Đóng timeline-board
            target.innerHTML = html;
        }
        window.renderScheduleGanttTimeline = renderScheduleGanttTimeline;
    // Expose all report & timeline functions to window
    window.exportSchedule = exportSchedule;
    window.printSchedule = printSchedule;
    window.exportSchedulePDF = exportSchedulePDF;
    window.toggleScheduleViewMode = toggleScheduleViewMode;
    window.setTimelineGroupBy = setTimelineGroupBy;
    window.setTimelineShift = setTimelineShift;
    window.exportDataForHisAuto = exportDataForHisAuto;
    window.renderScheduleGanttTimeline = renderScheduleGanttTimeline;
    window.timelineGroupBy = timelineGroupBy;
    window.timelineShift = timelineShift;

})(typeof window !== 'undefined' ? window : this);
