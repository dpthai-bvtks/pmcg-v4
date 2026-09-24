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
        // 📤 XUẤT LỊCH Y LỆNH EXCEL (1 SHEET KÈM DROP-LIST LỌC PHÒNG, A-Z & RV ĐẦU BẢNG)
        // ============================================================
        function exportSchedule() {
            if (typeof XLSX === 'undefined') {
                return alert("Thư viện xuất Excel đang được nạp, vui lòng thử lại sau 1-2 giây!");
            }

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

            const wb = XLSX.utils.book_new();

            // Xây dựng ma trận dữ liệu Excel (9 Cột có Cột Phòng Điều Trị)
            const ws_data = [
                [(localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase() + " - KHOA YHCT & PHCN"],
                ["BẢNG LỊCH TRÌNH ĐIỀU TRỊ THỦ THUẬT"],
                [`Ngày thực hiện: ${displayDate}`],
                [""], // Dòng trống cách quãng
                ["STT", "Tên Bệnh Nhân", "Năm Sinh", "Phòng Điều Trị", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "KTV / Bác Sĩ", "Máy Móc"]
            ];

            const dischargedCount = safeSched.filter(r => r.__isDischarged).length;

            safeSched.forEach((row, idx) => {
                let tenBNText = String(row.tenBN || '').trim();
                if (row.__isDischarged) tenBNText += ' (RV)';
                if (row.__dropped) tenBNText += ' (❌ Rớt)';

                ws_data.push([
                    idx + 1,
                    tenBNText,
                    String(row.namSinh || '').trim(),
                    String(row.phong || 'Chưa phân phòng').trim(),
                    String(row.thuThuat || '').trim(),
                    String(row.gioDienRa || '').trim(),
                    String(row.gioKetThuc || '').trim(),
                    String(row.nvChinh || '').trim(),
                    String(row.may || '--').trim()
                ]);
            });

            const firstDataRow = 6; // Dòng 6 trong Excel (index 1-based)
            const lastDataRow = safeSched.length + 5; // Dòng dữ liệu cuối cùng

            // Dòng tổng kết tự động co giãn theo bộ lọc phòng bằng hàm SUBTOTAL(103)
            ws_data.push([""]);
            ws_data.push([
                "TỔNG SỐ THỦ THUẬT:",
                "",
                "",
                { t: 'n', f: `SUBTOTAL(103, B${firstDataRow}:B${lastDataRow})`, v: safeSched.length },
                "ca thủ thuật (tự động cập nhật khi chọn phòng)",
                "",
                "",
                "",
                ""
            ]);

            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // 🎯 Kích hoạt Drop-list Filter (AutoFilter) tại dòng Header (A5:I${lastDataRow})
            ws['!autofilter'] = { ref: `A5:I${lastDataRow}` };

            // Merge các dòng tiêu đề (Cột A đến I: c=0 đến c=8)
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Dòng 1: Tên bệnh viện
                { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Dòng 2: Tên bảng
                { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // Dòng 3: Ngày thực hiện
                { s: { r: ws_data.length - 1, c: 0 }, e: { r: ws_data.length - 1, c: 2 } }, // Dòng tổng: Cột A-C
                { s: { r: ws_data.length - 1, c: 4 }, e: { r: ws_data.length - 1, c: 8 } }  // Dòng tổng: Cột E-I
            ];

            // Độ rộng tối ưu 9 cột
            ws['!cols'] = [
                { wch: 6 },   // STT
                { wch: 28 },  // Tên Bệnh Nhân
                { wch: 11 },  // Năm Sinh
                { wch: 20 },  // Phòng Điều Trị (Có Drop-list)
                { wch: 28 },  // Thủ Thuật
                { wch: 11 },  // Bắt Đầu
                { wch: 11 },  // Kết Thúc
                { wch: 20 },  // KTV / Bác Sĩ
                { wch: 18 }   // Máy Móc
            ];

            // Chiều cao dòng
            ws['!rows'] = [];
            ws['!rows'][0] = { hpt: 20 };
            ws['!rows'][1] = { hpt: 26 };
            ws['!rows'][2] = { hpt: 18 };
            ws['!rows'][4] = { hpt: 26 }; // Header bảng
            for (let r = 5; r < ws_data.length - 2; r++) {
                ws['!rows'][r] = { hpt: 22 }; // Các dòng dữ liệu
            }
            ws['!rows'][ws_data.length - 1] = { hpt: 24 }; // Dòng tổng kết

            // Định dạng Style chuyên nghiệp bằng xlsx-js-style
            try {
                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r; R <= range.e.r; R++) {
                    // Tiêu đề dòng 1 (Tên bệnh viện)
                    if (R === 0) {
                        const addr = XLSX.utils.encode_cell({ r: 0, c: 0 });
                        if (ws[addr]) {
                            ws[addr].s = {
                                font: { name: "Arial", sz: 11, bold: true, color: { rgb: "1E3D2B" } },
                                alignment: { horizontal: "center", vertical: "center" }
                            };
                        }
                        continue;
                    }
                    // Tiêu đề dòng 2 (Tên bảng)
                    if (R === 1) {
                        const addr = XLSX.utils.encode_cell({ r: 1, c: 0 });
                        if (ws[addr]) {
                            ws[addr].s = {
                                font: { name: "Arial", sz: 14, bold: true, color: { rgb: "059669" } },
                                alignment: { horizontal: "center", vertical: "center" }
                            };
                        }
                        continue;
                    }
                    // Tiêu đề dòng 3 (Ngày thực hiện)
                    if (R === 2) {
                        const addr = XLSX.utils.encode_cell({ r: 2, c: 0 });
                        if (ws[addr]) {
                            ws[addr].s = {
                                font: { name: "Arial", sz: 10, italic: true, color: { rgb: "475569" } },
                                alignment: { horizontal: "center", vertical: "center" }
                            };
                        }
                        continue;
                    }
                    // Dòng trống
                    if (R === 3 || R === ws_data.length - 2) continue;

                    // Tiêu đề cột bảng (Dòng 4, index r=4)
                    if (R === 4) {
                        for (let C = 0; C <= 8; C++) {
                            const addr = XLSX.utils.encode_cell({ r: 4, c: C });
                            if (ws[addr]) {
                                ws[addr].s = {
                                    fill: { fgColor: { rgb: "E8F8F5" } },
                                    font: { name: "Arial", sz: 10.5, bold: true, color: { rgb: "1E3D2B" } },
                                    alignment: { horizontal: "center", vertical: "center", wrapText: true },
                                    border: {
                                        top: { style: "medium", color: { rgb: "000000" } },
                                        bottom: { style: "medium", color: { rgb: "000000" } },
                                        left: { style: "thin", color: { rgb: "CBD5E1" } },
                                        right: { style: "thin", color: { rgb: "CBD5E1" } }
                                    }
                                };
                            }
                        }
                        continue;
                    }

                    // Dòng tổng kết cuối bảng
                    if (R === ws_data.length - 1) {
                        for (let C = 0; C <= 8; C++) {
                            const addr = XLSX.utils.encode_cell({ r: R, c: C });
                            if (ws[addr]) {
                                ws[addr].s = {
                                    fill: { fgColor: { rgb: "FEF3C7" } },
                                    font: { name: "Arial", sz: 11, bold: true, color: { rgb: "92400E" } },
                                    alignment: { horizontal: C === 3 ? "center" : (C === 0 ? "right" : "left"), vertical: "center" },
                                    border: {
                                        top: { style: "medium", color: { rgb: "000000" } },
                                        bottom: { style: "medium", color: { rgb: "000000" } },
                                        left: { style: "thin", color: { rgb: "CBD5E1" } },
                                        right: { style: "thin", color: { rgb: "CBD5E1" } }
                                    }
                                };
                            }
                        }
                        continue;
                    }

                    // Các dòng dữ liệu bệnh nhân (R >= 5)
                    const dataIdx = R - 5;
                    const rowObj = safeSched[dataIdx];
                    const isRV = rowObj && !!rowObj.__isDischarged;
                    const centerCols = new Set([0, 2, 3, 5, 6]); // STT, NamSinh, Phong, BatDau, KetThuc

                    for (let C = 0; C <= 8; C++) {
                        const addr = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws[addr]) continue;

                        const alignH = centerCols.has(C) ? "center" : "left";
                        const fontColor = isRV ? (C === 1 ? "7C3AED" : "1E293B") : (C === 5 ? "059669" : "1E293B");

                        ws[addr].s = {
                            fill: isRV ? { fgColor: { rgb: "F5EEF8" } } : (dataIdx % 2 === 1 ? { fgColor: { rgb: "F8FAFC" } } : undefined),
                            font: {
                                name: "Arial",
                                sz: 10,
                                bold: isRV || C === 0 || C === 5 || C === 7,
                                color: { rgb: fontColor }
                            },
                            alignment: { horizontal: alignH, vertical: "center" },
                            border: {
                                top: { style: "thin", color: { rgb: "CBD5E1" } },
                                bottom: { style: "medium", color: { rgb: "000000" } }, // Dòng kẻ ngang đậm ngăn cách rõ ràng
                                left: { style: "thin", color: { rgb: "CBD5E1" } },
                                right: { style: "thin", color: { rgb: "CBD5E1" } }
                            }
                        };
                    }
                }
            } catch (e) {
                console.warn("Lỗi style Excel:", e);
            }

            // Thiết lập trang in A4 ngang chuẩn
            ws['!pageSetup'] = {
                paperSize: 9,          // A4
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0
            };
            ws['!margins'] = { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };

            XLSX.utils.book_append_sheet(wb, ws, "Lịch Trình");

            // Xuất và tải file Excel
            const fileName = `Lich_ThuThuat_${displayDate.replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            if (typeof showToast === 'function') showToast("📂 Đã xuất file Excel lịch trình có bộ lọc phòng!");
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

                // Bảng dữ liệu của riêng phòng này (không có cột Giường)
                const bodyTable = [
                    [
                        { text: 'STT', style: 'tableHeader', alignment: 'center' },
                        { text: 'Tên Bệnh Nhân', style: 'tableHeader' },
                        { text: 'Năm Sinh', style: 'tableHeader', alignment: 'center' },
                        { text: 'Thủ Thuật', style: 'tableHeader' },
                        { text: 'Bắt Đầu', style: 'tableHeader', alignment: 'center' },
                        { text: 'Kết Thúc', style: 'tableHeader', alignment: 'center' },
                        { text: 'KTV / Bác Sĩ', style: 'tableHeader' },
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
                            widths: [24, 155, 48, 165, 48, 48, 120, '*'],
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
        // ⚡ XUẤT DỮ LIỆU ĐỂ TỰ ĐỘNG NHẬP HIS (AUTO-HIS IMPORTER)
        // ============================================================
        function exportDataForHisAuto() {
            const rawSched = (window.currentScheduleData && window.currentScheduleData.length) ? window.currentScheduleData : 
                             ((typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : []);
            const safeSched = rawSched.map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            
            if (!safeSched.length) {
                if (typeof window.showToast === 'function') {
                    window.showToast('⚠️ Chưa có dữ liệu lịch trình để xuất sang phần mềm HIS!', 'warning');
                } else {
                    alert('Chưa có dữ liệu lịch trình để xuất sang phần mềm HIS!');
                }
                return;
            }

            const activeDateVal = (document.getElementById('history-date')?.value) || 
                                  (document.getElementById('schedule-date')?.value) || 
                                  (safeSched[0]?.ngay) || '';

            const exportObj = {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                date: activeDateVal,
                totalProcedures: safeSched.length,
                schedule: safeSched
            };

            const jsonStr = JSON.stringify(exportObj, null, 2);

            // 1. Tự động Copy vào Clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(jsonStr).then(() => {
                    console.log("Đã copy dữ liệu lịch vào Clipboard");
                }).catch(e => console.warn("Lỗi copy clipboard:", e));
            }

            // 2. Tải file his_schedule.json
            try {
                const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `his_schedule_${activeDateVal || 'today'}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Lỗi tải file JSON:", err);
            }

            const msg = `✅ ĐÃ XUẤT ${safeSched.length} CA THỦ THUẬT!\n\n1. Dữ liệu đã được tự động sao chép vào Clipboard (Bạn chỉ cần mở tool Auto-HIS và bấm '📋 Dán từ Clipboard').\n2. Đồng thời đã tải file 'his_schedule_${activeDateVal || 'today'}.json' về máy.`;
            if (typeof window.showToast === 'function') {
                window.showToast(`✅ Đã xuất ${safeSched.length} ca sang Auto-HIS (đã copy & tải file)!`, 'success');
            }
            alert(msg);
        }
        window.exportDataForHisAuto = exportDataForHisAuto;

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
            let slotTicks = [];
            let slotWidth = 95; // px mỗi 30 phút
            let morningSlotCount = 8; // 07:30, 08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00 (kết thúc 11:30)
            let afternoonSlotCount = 7; // 13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00 (kết thúc 16:30)
            let totalCanvasWidth = 0;

            if (timelineShift === 'morning') {
                slotTicks = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
                slotWidth = 130;
                totalCanvasWidth = slotTicks.length * slotWidth;
            } else if (timelineShift === 'afternoon') {
                slotTicks = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
                slotWidth = 140;
                totalCanvasWidth = slotTicks.length * slotWidth;
            } else {
                slotTicks = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
                slotWidth = 95;
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
                    if (startMin >= 690 || endMin <= 450) return null;
                    const s = Math.max(450, startMin);
                    const e = Math.min(690, endMin);
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
                    if (startMin < 690) {
                        const s = Math.max(450, startMin);
                        const e = Math.min(690, endMin);
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
                    html += `<div class="timeline-lunch-divider" style="left: ${morningBoundary}px;" title="Nghỉ trưa (11:30 - 13:00)"></div>`;
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
    window.exportSchedulePDF = exportSchedulePDF;
    window.toggleScheduleViewMode = toggleScheduleViewMode;
    window.setTimelineGroupBy = setTimelineGroupBy;
    window.setTimelineShift = setTimelineShift;
    window.exportDataForHisAuto = exportDataForHisAuto;
    window.renderScheduleGanttTimeline = renderScheduleGanttTimeline;
    window.timelineGroupBy = timelineGroupBy;
    window.timelineShift = timelineShift;

})(typeof window !== 'undefined' ? window : this);
