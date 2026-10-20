/**
 * 🌐 T.I.M.E.S System v4 - Universal Excel & HIS Parser Module
 * 
 * Kiến trúc 3 lớp đọc file thông minh:
 *  - Lớp 1: Smart Auto-Detector (Đa tầng, Từ điển Y tế, Nhận diện bản chất dữ liệu)
 *  - Lớp 2: Visual Column Mapping Modal (Ánh xạ cột trực quan & Ghi nhớ theo Tenant)
 *  - Lớp 3: Universal Row Normalizer (Chuẩn hóa Object + Tương thích ngược 100%)
 */

(function (window) {
    'use strict';

    // Helper loại bỏ dấu tiếng Việt để so khớp không dấu
    function stripVN(str) {
        if (!str) return '';
        return String(str)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase()
            .replace(/[\s_]+/g, " ")
            .trim();
    }

    // Helper chuyển đổi đa dạng định dạng ngày giờ sang Date
    function parseToJSDate(val, baseDate) {
        if (!val) return null;
        if (val instanceof Date) {
            return isNaN(val.getTime()) ? null : val;
        }

        // Nếu là số serial Excel
        if (typeof val === 'number' || (!isNaN(Number(val)) && String(val).trim() !== '')) {
            const num = Number(val);
            if (num > 30000 && num < 70000) {
                const utc_days = Math.floor(num - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);
                const fractional_day = num - Math.floor(num) + 0.0000001;
                let total_seconds = Math.floor(86400 * fractional_day);
                const seconds = total_seconds % 60;
                total_seconds -= seconds;
                const hours = Math.floor(total_seconds / (60 * 60));
                const minutes = Math.floor(total_seconds / 60) % 60;
                date_info.setHours(hours, minutes, seconds, 0);
                return date_info;
            }
        }

        const s = String(val).trim();
        if (!s || s === '--' || s.includes('Rớt')) return null;

        // Định dạng: 16/10/2026 14:42:00 hoặc 16/10/2026 14:42
        const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (m1) {
            const day = parseInt(m1[1], 10);
            const month = parseInt(m1[2], 10) - 1;
            const year = parseInt(m1[3], 10);
            const hour = m1[4] !== undefined ? parseInt(m1[4], 10) : 0;
            const min = m1[5] !== undefined ? parseInt(m1[5], 10) : 0;
            const sec = m1[6] !== undefined ? parseInt(m1[6], 10) : 0;
            return new Date(year, month, day, hour, min, sec);
        }

        // Định dạng: 14:42:00 16/10/2026 hoặc 14:42 16/10/2026
        const m2 = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (m2) {
            const hour = parseInt(m2[1], 10);
            const min = parseInt(m2[2], 10);
            const sec = m2[3] !== undefined ? parseInt(m2[3], 10) : 0;
            const day = parseInt(m2[4], 10);
            const month = parseInt(m2[5], 10) - 1;
            const year = parseInt(m2[6], 10);
            return new Date(year, month, day, hour, min, sec);
        }

        // Định dạng ISO: 2026-10-16 14:42:00 hoặc 2026-10-16T14:42:00
        const m3 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (m3) {
            const year = parseInt(m3[1], 10);
            const month = parseInt(m3[2], 10) - 1;
            const day = parseInt(m3[3], 10);
            const hour = m3[4] !== undefined ? parseInt(m3[4], 10) : 0;
            const min = m3[5] !== undefined ? parseInt(m3[5], 10) : 0;
            const sec = m3[6] !== undefined ? parseInt(m3[6], 10) : 0;
            return new Date(year, month, day, hour, min, sec);
        }

        // Định dạng chỉ có giờ: 14:42 hoặc 14:42:00 (kèm baseDate nếu có)
        const m4 = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
        if (m4) {
            const d = baseDate instanceof Date ? new Date(baseDate.getTime()) : new Date(1900, 0, 1);
            d.setHours(parseInt(m4[1], 10), parseInt(m4[2], 10), m4[3] ? parseInt(m4[3], 10) : 0, 0);
            return d;
        }

        const dateObj = new Date(s);
        if (!isNaN(dateObj.getTime())) return dateObj;

        return null;
    }

    function formatDateToStr(date) {
        if (!date || isNaN(date.getTime())) return '';
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const mo = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        if (y === 1900) return `${h}:${m}`;
        return `${d}/${mo}/${y} ${h}:${m}:${s}`;
    }

    const UniversalExcelParser = {
        // ============================================================
        // 🔹 LỚP 1: BỘ TỰ ĐỘNG NHẬN DIỆN ĐA TẦNG (SMART AUTO-DETECTOR)
        // ============================================================

        detectColumns: function (rawRows, options = {}) {
            if (!Array.isArray(rawRows) || rawRows.length === 0) {
                return null;
            }

            // 1. Kiểm tra xem file có phải là Lịch Trình Nội Bộ phần mềm xuất ra không
            let isInternalSchedule = false;
            let internalHeaderIdx = -1;
            for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
                const rStr = (rawRows[i] || []).map(stripVN);
                if (rStr.some(c => c.includes("ten benh nhan") || c.includes("ten bn") || c.includes("hoten"))) {
                    if (rStr.some(c => c.includes("gio dien ra") || c.includes("bat dau") || c.includes("gio vao") || c.includes("thu thuat"))) {
                        isInternalSchedule = true;
                        internalHeaderIdx = i;
                        break;
                    }
                }
            }

            // 2. Multi-level Header Merger & Smart Data Start Detection
            let header1Idx = -1;
            let headerRows = [];
            let dataStartIdx = -1;

            if (isInternalSchedule) {
                header1Idx = internalHeaderIdx;
                headerRows = [header1Idx];
                dataStartIdx = header1Idx + 1;
            } else {
                for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
                    const row = rawRows[i] || [];
                    const nonEmptyCount = row.filter(c => String(c).trim() !== '').length;
                    // Bỏ qua các dòng chỉ có 1-2 ô (như tiêu đề banner "DANH SÁCH BỆNH NHÂN...")
                    if (nonEmptyCount < 3) continue;

                    const rowNorm = row.map(stripVN);
                    const hasName = rowNorm.some(c => c.includes("ho va ten") || c.includes("ho ten") || c.includes("ten benh nhan") || c.includes("ten bn") || c === "name");
                    const hasDate = rowNorm.some(c => c.includes("ngay bat dau") || c.includes("gio bat dau") || c.includes("bat dau") || c.includes("ngay gio pt"));
                    const hasProc = rowNorm.some(c => c.includes("phuong phap") || c.includes("thu thuat") || c.includes("dich vu") || c.includes("ten dich vu"));
                    const hasStaff = rowNorm.some(c => c.includes("ptv") || c.includes("ktv") || c.includes("bac si") || c.includes("nguoi thuc hien"));
                    const hasStt = rowNorm.some(c => c === "stt" || c === "tt" || c === "no");

                    if ((hasName && hasDate) || (hasName && hasProc) || (hasStt && hasName) || (hasProc && hasDate)) {
                        header1Idx = i;
                        break;
                    }
                }

                if (header1Idx === -1) {
                    for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
                        const count = (rawRows[i] || []).filter(c => String(c).trim() !== '').length;
                        if (count >= 3) { header1Idx = i; break; }
                    }
                    if (header1Idx === -1) header1Idx = 0;
                }

                headerRows = [header1Idx];
                dataStartIdx = header1Idx + 1;

                const headerKeywords = [
                    'stt', 'tt', 'name', 'mabn', 'tuoi', 'tuoi nam', 'tuoi nu', 'sovaovien', 'dien thoai', 
                    'khoa', 'phong', 'ptv', 'nam', 'nu', 'truoc pt', 'sau pt', 'loai', 'vo cam', 'don gia', 
                    'tien', 'ngay don tiep', 'ngay khoime', 'ngay ketthuc', 'chan doan', 'ten dich vu', 
                    'ngay gio pt', 'phau thuat vien', 'phu mo', 'phu me', 'dieu duong', 'ky thuat vien'
                ];

                for (let rIdx = header1Idx + 1; rIdx < Math.min(rawRows.length, header1Idx + 15); rIdx++) {
                    const row = rawRows[rIdx] || [];
                    const nonEmpty = row.map(c => String(c).trim()).filter(c => c !== '');
                    if (nonEmpty.length === 0) continue; // Dòng trống

                    // Dòng đánh số thứ tự cột: 1, 2, 3, 4...
                    const digitCount = nonEmpty.filter(c => /^\d+$/.test(c)).length;
                    if (digitCount >= nonEmpty.length * 0.7) continue;

                    // Dòng chứa mã cột CSDL hoặc sub-headers
                    const normCells = nonEmpty.map(stripVN);
                    const matchHdr = normCells.filter(c => headerKeywords.some(kw => c === kw || (kw.length >= 4 && c.includes(kw)))).length;
                    if (matchHdr >= nonEmpty.length * 0.35) {
                        headerRows.push(rIdx);
                        continue;
                    }

                    // Dòng dữ liệu thực tế: có ngày tháng hoặc có tên bệnh nhân thực tế
                    const hasDate = nonEmpty.some(c => /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(c) || /\d{1,2}:\d{1,2}/.test(c));
                    if (hasDate || nonEmpty.length >= 10) {
                        dataStartIdx = rIdx;
                        break;
                    }
                }
            }

            // Gộp chuỗi tiêu đề các cột từ tất cả các dòng header đã nhận diện
            let maxCols = 0;
            headerRows.forEach(h => { maxCols = Math.max(maxCols, (rawRows[h] || []).length); });
            maxCols = Math.max(maxCols, 25);

            const mergedHeaders = [];
            for (let c = 0; c < maxCols; c++) {
                const parts = [];
                headerRows.forEach(h => {
                    const val = String((rawRows[h] || [])[c] || '').trim();
                    if (val && !parts.includes(val)) parts.push(val);
                });
                const combined = parts.join(' ');
                const colLetter = (typeof XLSX !== 'undefined' && XLSX.utils && XLSX.utils.encode_col)
                    ? XLSX.utils.encode_col(c)
                    : String.fromCharCode(65 + c);

                mergedHeaders.push({
                    colIdx: c,
                    colLetter: colLetter,
                    title: combined || `Cột ${colLetter}`,
                    normalized: stripVN(combined)
                });
            }

            // 3. Từ Điển Đồng Nghĩa Y Tế (Synonym Dictionary)
            const mapping = {
                patientName: -1,
                patientCode: -1,
                patientDob: -1,
                procName: -1,
                start: -1,
                end: -1,
                techMain: -1,
                techPhu: -1,
                loaiTT: -1,
                phong: -1,
                giuong: -1,
                may: -1
            };

            const synonyms = {
                patientName: ['ho va ten', 'ho ten', 'ten benh nhan', 'ten bn', 'nguoi benh', 'name', 'fullname', 'benh nhan'],
                patientCode: ['mabn', 'so ho so', 'ma bn', 'ma benh nhan', 'so vao vien', 'pid', 'id', 'so ba', 'ma nb'],
                patientDob: ['tuoi nam', 'nam sinh', 'namsinh', 'tuoi', 'dob', 'ns'],
                procName: ['ten dich vu pttt', 'ten dich vu', 'phuong phap tien hanh', 'phuong phap', 'ten thu thuat', 'thu thuat', 'dich vu', 'ten phau thuat', 'pttt'],
                start: ['ngay gio pt', 'ngay gio lam pttt', 'gio lam pttt', 'thoi gian bat dau', 'gio bat dau', 'bat dau', 'ngay bat dau', 'start time', 'time start', 'gio thuc hien', 'tu gio', 'gio vao'],
                end: ['thoi gian ket thuc', 'ngay ketthuc', 'gio ket thuc', 'ket thuc', 'ngay ket thuc', 'end time', 'time end', 'den gio', 'gio ra'],
                techMain: ['phau thuat vien 1', 'phau thuat vien chinh', 'ptv 1', 'ptv chinh', 'ktv chinh', 'bac si thuc hien', 'nguoi thuc hien', 'ky thuat vien 1', 'ktv 1', 'ptv', 'ktv', 'bac si'],
                techPhu: ['phu mo 1', 'phu 1', 'nguoi phu', 'ktv phu', 'phu me 1', 'dieu duong phu', 'tro ly', 'phu ta', 'nv phu', 'phu 2'],
                loaiTT: ['loai pttt', 'loai thu thuat', 'phan loai', 'phan loai pttt', 'phan loai tt', 'loai'],
                phong: ['phong thuc hien', 'noi thuc hien', 'phong lam', 'phong dieu tri', 'phong'],
                giuong: ['giuong benh', 'giuong'],
                may: ['may moc', 'ten may', 'thiet bi', 'may']
            };

            for (const [field, synList] of Object.entries(synonyms)) {
                for (const syn of synList) {
                    const found = mergedHeaders.find(h => {
                        if (!h.normalized) return false;
                        if (syn.length <= 4) {
                            return h.normalized === syn || h.normalized.split(' ').includes(syn);
                        }
                        return h.normalized.includes(syn);
                    });
                    if (found && mapping[field] === -1) {
                        const alreadyUsed = Object.values(mapping).includes(found.colIdx);
                        if (!alreadyUsed) {
                            mapping[field] = found.colIdx;
                            break;
                        }
                    }
                }
            }

            // 4. Data Pattern Recognition (Soi 10 dòng dữ liệu đầu tiên)
            const sampleRows = rawRows.slice(dataStartIdx, dataStartIdx + 15).filter(r => r && r.some(c => String(c).trim()));

            // A. Soi tìm cột thời gian bắt đầu / kết thúc nếu chưa phát hiện đủ
            if (mapping.start === -1 || mapping.end === -1) {
                const dateCols = [];
                const currencyOrIdWords = ['don gia', 'gia', 'tien', 'phi', 'luong', 'so luong', 'ma', 'cchn', 'dien thoai', 'phone', 'id'];

                for (let c = 0; c < maxCols; c++) {
                    // Loại trừ cột có tiêu đề liên quan đến tiền bạc, viện phí, mã số
                    const colHdrNorm = mergedHeaders[c]?.normalized || '';
                    if (currencyOrIdWords.some(w => colHdrNorm.includes(w))) continue;

                    let matchCount = 0;
                    for (const row of sampleRows) {
                        const val = String(row[c] || '').trim();
                        const isDateString = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\s+\d{1,2}:\d{1,2}/.test(val) || /^\d{1,2}:\d{1,2}(?::\d{1,2})?$/.test(val);
                        // Chỉ nhận serial Excel nếu có phần lẻ thời gian (val % 1 !== 0), tránh số tiền tệ nguyên như 44900
                        const isExcelSerialTime = (typeof row[c] === 'number' && row[c] > 35000 && row[c] < 65000 && (row[c] % 1 !== 0));
                        if (isDateString || isExcelSerialTime) {
                            matchCount++;
                        }
                    }
                    if (matchCount >= Math.min(3, sampleRows.length)) {
                        dateCols.push(c);
                    }
                }
                if (dateCols.length >= 2) {
                    if (mapping.start === -1) mapping.start = dateCols[0];
                    if (mapping.end === -1) mapping.end = dateCols[1];
                } else if (dateCols.length === 1 && mapping.start === -1) {
                    mapping.start = dateCols[0];
                }
            }

            // B. Soi tìm cột tên thủ thuật nếu chưa có (kể cả ô tiêu đề rỗng như cột M)
            if (mapping.procName === -1) {
                const procKeywords = [
                    'xoa bop', 'dien xung', 'hong ngoai', 'dien cham', 'sieu am', 'song ngan',
                    'keo gian', 'tap van dong', 'thuy cham', 'cuu ngai', 'cham cuu', 'laser',
                    'van dong', 'parafin', 'tu truong', 'nan chinh', 'xong hoi'
                ];
                for (let c = 0; c < maxCols; c++) {
                    let matchCount = 0;
                    for (const row of sampleRows) {
                        const val = stripVN(String(row[c] || ''));
                        if (procKeywords.some(kw => val.includes(kw))) {
                            matchCount++;
                        }
                    }
                    if (matchCount >= Math.min(2, sampleRows.length)) {
                        mapping.procName = c;
                        break;
                    }
                }
            }

            // C. Soi cột phân loại thủ thuật (loaiTT): ưu tiên cột có chữ "Thủ thuật loại..."
            if (mapping.loaiTT === -1 || mergedHeaders.find(h => h.colIdx === mapping.loaiTT)?.normalized.includes('i')) {
                for (let c = 0; c < maxCols; c++) {
                    let typeCount = 0;
                    for (const row of sampleRows) {
                        const val = stripVN(String(row[c] || ''));
                        if (val.includes('thu thuat loai') || val.includes('loai 1') || val.includes('loai 2') || val.includes('loai 3')) {
                            typeCount++;
                        }
                    }
                    if (typeCount >= 2) {
                        mapping.loaiTT = c;
                        break;
                    }
                }
            }

            // D. Soi cột KTV chính nếu chưa tìm thấy
            if (mapping.techMain === -1) {
                const staffList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.staff))
                    ? dataCache.staff
                    : (Array.isArray(window.dataCache?.staff) ? window.dataCache.staff : []);
                
                if (staffList.length > 0) {
                    for (let c = 0; c < maxCols; c++) {
                        let matchStaff = 0;
                        for (const row of sampleRows) {
                            const val = stripVN(String(row[c] || ''));
                            if (staffList.some(s => s.ten && stripVN(s.ten) === val)) {
                                matchStaff++;
                            }
                        }
                        if (matchStaff >= 2) {
                            mapping.techMain = c;
                            break;
                        }
                    }
                }
            }

            // 5. Tính Điểm Tin Cậy (Confidence Score)
            let confidence = 0;
            if (mapping.patientName !== -1) confidence += 25;
            if (mapping.procName !== -1) confidence += 25;
            if (mapping.start !== -1) confidence += 20;
            if (mapping.end !== -1) confidence += 15;
            if (mapping.techMain !== -1) confidence += 15;

            // Điểm cộng thêm
            if (mapping.patientCode !== -1) confidence += 5;
            if (mapping.loaiTT !== -1) confidence += 5;
            if (mapping.phong !== -1 || mapping.may !== -1) confidence += 5;

            // Chuẩn hóa tối đa 100%
            confidence = Math.min(100, confidence);

            return {
                isInternalSchedule,
                header1Idx,
                header2Idx: headerRows.length > 1 ? headerRows[1] : -1,
                headerRows,
                dataStartIdx,
                mapping,
                mergedHeaders,
                confidence
            };
        },

        // ============================================================
        // 🔹 LỚP 3: CHUẨN HÓA MÔ HÌNH DỮ LIỆU (UNIVERSAL ROW NORMALIZER)
        // ============================================================

        normalizeRows: function (rawRows, detectionResult, options = {}) {
            if (!Array.isArray(rawRows) || !detectionResult) return [];

            const { dataStartIdx, mapping, isInternalSchedule, header1Idx } = detectionResult;
            const dataRows = [];

            // Nếu là lịch nội bộ, trích xuất ngày ở banner trên đầu nếu có
            let extractedFileDate = '';
            if (isInternalSchedule && header1Idx > 0) {
                for (let i = 0; i < header1Idx; i++) {
                    const rowCells = rawRows[i] || [];
                    for (const cell of rowCells) {
                        const cellStr = String(cell || '').trim();
                        const dMatch = cellStr.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
                        if (dMatch) {
                            extractedFileDate = dMatch[1].replace(/-/g, '/');
                            break;
                        }
                    }
                    if (extractedFileDate) break;
                }
            }

            const total = rawRows.length;
            for (let i = dataStartIdx; i < total; i++) {
                const r = rawRows[i];
                if (!r || !r.some(c => String(c).trim() !== '')) continue;

                let patientName = mapping.patientName >= 0 ? String(r[mapping.patientName] || '').trim() : '';
                patientName = patientName.replace(/\s*\((?:✔ RV|❌ Rớt|RV|Rớt)\)/gi, '').trim();

                let procName = mapping.procName >= 0 ? String(r[mapping.procName] || '').trim() : '';
                if (!patientName && !procName) continue; // Dòng trống hoặc không hợp lệ

                let patientCode = mapping.patientCode >= 0 ? String(r[mapping.patientCode] || '').trim() : '';
                let patientDob = mapping.patientDob >= 0 ? String(r[mapping.patientDob] || '').trim() : '';
                
                // Trích xuất năm sinh nếu chuỗi tuổi có năm sinh 4 chữ số
                const yMatch = patientDob.match(/\b(19\d{2}|20\d{2})\b/);
                if (yMatch) patientDob = yMatch[1];

                const rawStart = mapping.start >= 0 ? r[mapping.start] : '';
                const rawEnd = mapping.end >= 0 ? r[mapping.end] : '';

                let startDate = parseToJSDate(rawStart);
                let endDate = parseToJSDate(rawEnd);

                // Nếu file nội bộ chỉ có giờ (14:42) mà có extractedFileDate
                if (extractedFileDate) {
                    if (startDate && startDate.getFullYear() === 1900) {
                        const [d, m, y] = extractedFileDate.split('/');
                        startDate.setFullYear(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
                    }
                    if (endDate && endDate.getFullYear() === 1900) {
                        const [d, m, y] = extractedFileDate.split('/');
                        endDate.setFullYear(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
                    }
                }

                let techMain = mapping.techMain >= 0 ? String(r[mapping.techMain] || '').trim() : '';
                let techPhu = mapping.techPhu >= 0 ? String(r[mapping.techPhu] || '').trim() : '';
                let loaiTT = mapping.loaiTT >= 0 ? String(r[mapping.loaiTT] || '').trim() : '';
                let phong = mapping.phong >= 0 ? String(r[mapping.phong] || '').trim() : '';
                let giuong = mapping.giuong >= 0 ? String(r[mapping.giuong] || '').trim() : '';
                let may = mapping.may >= 0 ? String(r[mapping.may] || '').trim() : '';

                // Nếu loại thủ thuật rỗng nhưng có tên thủ thuật, tra cứu tự động từ danh mục
                if (!loaiTT && typeof mapProcedureJS === 'function') {
                    const pInfo = mapProcedureJS(procName, startDate);
                    if (pInfo) {
                        loaiTT = pInfo.phanLoai || pInfo.loai || pInfo.he || '';
                    }
                }

                const startStr = formatDateToStr(startDate);
                const endStr = formatDateToStr(endDate);

                // Tạo đối tượng chuẩn hóa
                const normalizedRecord = {
                    patientName: patientName,
                    patientCode: patientCode,
                    patientDob: patientDob,
                    procName: procName,
                    start: startDate,
                    end: endDate,
                    techMain: techMain,
                    techPhu: techPhu,
                    loaiTT: loaiTT,
                    phong: phong,
                    giuong: giuong,
                    may: may,

                    // 🛡️ TƯƠNG THÍCH NGƯỢC 100% VỚI MÃ NGUỒN CŨ
                    'C': patientName,
                    'D': patientDob,
                    'namSinh': patientDob,
                    'dob': patientDob,
                    'pId': patientCode,
                    'maBN': patientCode,
                    'ma_bn': patientCode,
                    'AE': procName,
                    'AG': procName,
                    'AF': 'Chủ động',
                    'AS': 'Khác',
                    'AN': loaiTT,
                    'AH': startStr,
                    'L': endStr,
                    'AT': techMain,
                    'AU': techPhu,
                    'phong': phong,
                    'giuong': giuong,
                    'may': may
                };

                dataRows.push(normalizedRecord);
            }

            return dataRows;
        },

        // ============================================================
        // 🔹 LƯU VÀ KHÔI PHỤC CẤU HÌNH THEO ĐƠN VỊ (TENANT STORAGE)
        // ============================================================

        getSavedMappingKey: function (unitCode) {
            const code = (unitCode || (typeof getCurrentUnitCode === 'function' ? getCurrentUnitCode() : localStorage.getItem('pm_unit_code')) || 'bvtks-cs2').trim().toLowerCase();
            return `times_excel_mapping_${code}`;
        },

        getSavedMapping: function (unitCode) {
            try {
                const key = this.getSavedMappingKey(unitCode);
                const raw = localStorage.getItem(key);
                if (raw) return JSON.parse(raw);
            } catch (e) {
                console.warn('[UniversalExcelParser] Lỗi đọc mapping từ localStorage:', e);
            }
            return null;
        },

        saveMapping: function (unitCode, mapping) {
            try {
                const key = this.getSavedMappingKey(unitCode);
                localStorage.setItem(key, JSON.stringify(mapping));
                return true;
            } catch (e) {
                console.error('[UniversalExcelParser] Lỗi lưu mapping:', e);
                return false;
            }
        },

        clearSavedMapping: function (unitCode) {
            try {
                const key = this.getSavedMappingKey(unitCode);
                localStorage.removeItem(key);
            } catch (e) {}
        },

        // ============================================================
        // 🔹 LỚP 2: GIAO DIỆN CẤU HÌNH ÁNH XẠ CỘT (VISUAL COLUMN MAPPING MODAL)
        // ============================================================

        showMappingModal: function ({ sheetName, rawRows, detectionResult, unitCode, onConfirm, onCancel }) {
            // 🛡️ Đảm bảo tắt mọi overlay loading toàn cục đang chạy để không che modal
            if (typeof window.hideGlobalLoading === 'function') {
                try { window.hideGlobalLoading(); } catch (e) {}
            }

            const modalId = 'modal-universal-excel-mapping';
            let modalEl = document.getElementById(modalId);
            if (!modalEl) {
                modalEl = document.createElement('div');
                modalEl.id = modalId;
                modalEl.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10500; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                `;
                document.body.appendChild(modalEl);
            }

            const curUnit = unitCode || (typeof getCurrentUnitCode === 'function' ? getCurrentUnitCode() : localStorage.getItem('pm_unit_code')) || 'bvtks-cs2';
            const { mergedHeaders, dataStartIdx, mapping, confidence } = detectionResult;

            // Bảng xem trước 3-4 dòng đầu tiên
            const previewRows = rawRows.slice(dataStartIdx, dataStartIdx + 4).filter(r => r && r.some(c => String(c).trim()));
            let previewHeadHtml = mergedHeaders.map(h => `<th style="padding:6px 10px; border:1px solid #cbd5e1; background:#f1f5f9; font-size:11px; white-space:nowrap;"><b>${h.colLetter}</b><br/><span style="color:#64748b; font-weight:normal;">${h.title || ''}</span></th>`).join('');
            let previewBodyHtml = previewRows.map((r, rIdx) => {
                const cells = mergedHeaders.map(h => `<td style="padding:4px 8px; border:1px solid #e2e8f0; font-size:11px; white-space:nowrap; max-width:180px; overflow:hidden; text-overflow:ellipsis;">${String(r[h.colIdx] || '')}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');

            // Helper tạo option dropdown
            const makeOptions = (selectedIdx) => {
                let html = '<option value="-1">-- (Không chọn) --</option>';
                mergedHeaders.forEach(h => {
                    const isSel = (h.colIdx === selectedIdx) ? 'selected' : '';
                    html += `<option value="${h.colIdx}" ${isSel}>Cột ${h.colLetter} - ${h.title}</option>`;
                });
                return html;
            };

            const confColor = confidence >= 85 ? '#15803d' : (confidence >= 60 ? '#b45309' : '#b91c1c');
            const confBg = confidence >= 85 ? '#dcfce7' : (confidence >= 60 ? '#fef3c7' : '#fee2e2');

            modalEl.innerHTML = `
                <div style="background:#ffffff; border-radius:12px; width:92%; max-width:1050px; max-height:92vh; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.35); overflow:hidden; border:1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <div style="background:#1e3d2b; color:#ffffff; padding:16px 20px; display:flex; align-items:center; justify-content:space-between;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:22px;">🛠️</span>
                            <div>
                                <h3 style="margin:0; font-size:17px; font-weight:700;">Cấu Hình Ánh Xạ Cột File Excel / HIS</h3>
                                <div style="font-size:12px; color:#bbf7d0; margin-top:2px;">
                                    Sheet: <b>${sheetName || 'Mặc định'}</b> &bull; Đơn vị: <b style="text-transform:uppercase;">${curUnit}</b>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="background:${confBg}; color:${confColor}; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700;">
                                Độ tin cậy: ${confidence}%
                            </span>
                            <button type="button" id="btn-close-map-modal" style="background:transparent; border:none; color:#ffffff; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
                        </div>
                    </div>

                    <!-- Body Cuộn -->
                    <div style="padding:18px 22px; overflow-y:auto; flex:1;">
                        
                        <!-- Box Xem Trước File -->
                        <div style="margin-bottom:18px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                                <label style="font-size:13px; font-weight:700; color:#334155;">👁️ Xem trước 3-4 dòng đầu từ file thực tế:</label>
                                <span style="font-size:11px; color:#64748b;">(Dữ liệu bắt đầu tính từ dòng ${dataStartIdx + 1})</span>
                            </div>
                            <div style="max-height:130px; overflow:auto; border:1px solid #cbd5e1; border-radius:6px; background:#fafafa;">
                                <table style="border-collapse:collapse; width:100%; text-align:left;">
                                    <thead>${previewHeadHtml}</thead>
                                    <tbody>${previewBodyHtml}</tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Lưới Ánh Xạ Cột -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
                            <h4 style="margin:0 0 14px 0; font-size:14px; font-weight:700; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
                                📍 Chỉ định cột tương ứng cho từng thông tin:
                            </h4>

                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
                                
                                <!-- Nhóm 1: Bệnh nhân -->
                                <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:12px;">
                                    <div style="font-size:13px; font-weight:700; color:#1d4ed8; margin-bottom:10px;">👤 Thông Tin Bệnh Nhân</div>
                                    <div style="margin-bottom:8px;">
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Họ và tên Bệnh nhân <span style="color:#ef4444;">*</span>:</label>
                                        <select id="map-col-patientName" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.patientName)}
                                        </select>
                                    </div>
                                    <div style="margin-bottom:8px;">
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Mã BN / Số hồ sơ:</label>
                                        <select id="map-col-patientCode" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.patientCode)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Năm sinh / Tuổi:</label>
                                        <select id="map-col-patientDob" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.patientDob)}
                                        </select>
                                    </div>
                                </div>

                                <!-- Nhóm 2: Thủ thuật & Thời gian -->
                                <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:12px;">
                                    <div style="font-size:13px; font-weight:700; color:#047857; margin-bottom:10px;">🩺 Thủ Thuật & Thời Gian</div>
                                    <div style="margin-bottom:8px;">
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Tên Thủ thuật / Dịch vụ <span style="color:#ef4444;">*</span>:</label>
                                        <select id="map-col-procName" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.procName)}
                                        </select>
                                    </div>
                                    <div style="margin-bottom:8px;">
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Thời gian Bắt đầu <span style="color:#ef4444;">*</span>:</label>
                                        <select id="map-col-start" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.start)}
                                        </select>
                                    </div>
                                    <div style="margin-bottom:8px;">
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Thời gian Kết thúc <span style="color:#ef4444;">*</span>:</label>
                                        <select id="map-col-end" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.end)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Phân loại thủ thuật (Loại 1, 2, 3...):</label>
                                        <select id="map-col-loaiTT" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.loaiTT)}
                                        </select>
                                    </div>
                                </div>

                                <!-- Nhóm 3: Nhân sự & Cơ sở -->
                                <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:12px;">
                                    <div style="font-size:13px; font-weight:700; color:#b45309; margin-bottom:10px;">👨‍⚕️ Nhân Sự & Vị Trí</div>
                                    <div style="margin-bottom:8px;">
                                        <label style="font-size:12px; font-weight:600; color:#334155;">KTV / PTV / Bác sĩ chính <span style="color:#ef4444;">*</span>:</label>
                                        <select id="map-col-techMain" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.techMain)}
                                        </select>
                                    </div>
                                    <div style="margin-bottom:8px;">
                                        <label style="font-size:12px; font-weight:600; color:#334155;">KTV phụ / Người phụ:</label>
                                        <select id="map-col-techPhu" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.techPhu)}
                                        </select>
                                    </div>
                                    <div style="margin-bottom:8px;">
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Phòng thực hiện:</label>
                                        <select id="map-col-phong" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.phong)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size:12px; font-weight:600; color:#334155;">Máy móc thực hiện:</label>
                                        <select id="map-col-may" style="width:100%; padding:6px; font-size:12px; border:1px solid #cbd5e1; border-radius:4px; margin-top:3px;">
                                            ${makeOptions(mapping.may)}
                                        </select>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                    <!-- Footer -->
                    <div style="background:#f1f5f9; padding:14px 22px; border-top:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                        <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:#1e293b; cursor:pointer;">
                            <input type="checkbox" id="chk-save-mapping-tenant" checked style="width:16px; height:16px; accent-color:#1e3d2b;">
                            <span>Lưu ghi nhớ cấu hình này cho đơn vị <b>${curUnit.toUpperCase()}</b> (Lần sau tự động nạp)</span>
                        </label>

                        <div style="display:flex; align-items:center; gap:10px;">
                            <button type="button" id="btn-cancel-mapping" style="padding:8px 16px; background:#e2e8f0; color:#334155; border:none; border-radius:6px; font-weight:600; font-size:13px; cursor:pointer;">
                                Hủy Bỏ
                            </button>
                            <button type="button" id="btn-confirm-mapping" style="padding:8px 20px; background:#16a34a; color:#ffffff; border:none; border-radius:6px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <span>🚀 Xác Nhận & Tiến Hành</span>
                            </button>
                        </div>
                    </div>

                </div>
            `;

            // Xử lý sự kiện Modal
            const closeModal = () => {
                modalEl.style.display = 'none';
            };

            document.getElementById('btn-close-map-modal').onclick = () => {
                closeModal();
                if (typeof onCancel === 'function') onCancel();
            };

            document.getElementById('btn-cancel-mapping').onclick = () => {
                closeModal();
                if (typeof onCancel === 'function') onCancel();
            };

            document.getElementById('btn-confirm-mapping').onclick = () => {
                const updatedMapping = {
                    patientName: parseInt(document.getElementById('map-col-patientName').value, 10),
                    patientCode: parseInt(document.getElementById('map-col-patientCode').value, 10),
                    patientDob: parseInt(document.getElementById('map-col-patientDob').value, 10),
                    procName: parseInt(document.getElementById('map-col-procName').value, 10),
                    start: parseInt(document.getElementById('map-col-start').value, 10),
                    end: parseInt(document.getElementById('map-col-end').value, 10),
                    techMain: parseInt(document.getElementById('map-col-techMain').value, 10),
                    techPhu: parseInt(document.getElementById('map-col-techPhu').value, 10),
                    loaiTT: parseInt(document.getElementById('map-col-loaiTT').value, 10),
                    phong: parseInt(document.getElementById('map-col-phong').value, 10),
                    giuong: mapping.giuong,
                    may: parseInt(document.getElementById('map-col-may').value, 10)
                };

                // Kiểm tra các cột bắt buộc
                if (updatedMapping.patientName < 0 || updatedMapping.procName < 0 || updatedMapping.start < 0 || updatedMapping.end < 0 || updatedMapping.techMain < 0) {
                    alert('Vui lòng chọn tối thiểu các cột bắt buộc (*):\n- Họ và tên bệnh nhân\n- Tên thủ thuật\n- Thời gian bắt đầu\n- Thời gian kết thúc\n- KTV / Bác sĩ chính');
                    return;
                }

                const shouldSave = document.getElementById('chk-save-mapping-tenant').checked;
                if (shouldSave) {
                    UniversalExcelParser.saveMapping(curUnit, updatedMapping);
                }

                closeModal();
                const newDetection = {
                    ...detectionResult,
                    mapping: updatedMapping
                };
                if (typeof onConfirm === 'function') {
                    onConfirm(newDetection);
                }
            };

            modalEl.style.display = 'flex';
        },

        // ============================================================
        // 🔹 LỌC TRÙNG LẶP HIS (HIS DEDUPLICATION)
        // ============================================================

        /**
         * 🔹 LỌC TRÙNG LẶP HIS (HIS DEDUPLICATION)
         * Khắc phục triệt để hiện tượng file HIS nhân đôi thủ thuật cho 1 bệnh nhân
         * (do hệ thống HIS trích xuất bị join 2 dòng chi phí bảo hiểm y tế / viện phí).
         * 
         * Khóa xác định: Bệnh nhân + Tên thủ thuật + Giờ bắt đầu + Giờ kết thúc + KTV chính
         * @param {Array} rows - Danh sách các dòng đã qua normalizeRows
         * @returns {Object} { cleanRows, dupRows, dupCount }
         */
        deduplicateRows: function (rows) {
            if (!Array.isArray(rows) || rows.length === 0) {
                return { cleanRows: [], dupRows: [], dupCount: 0 };
            }

            const seen = new Set();
            const cleanRows = [];
            const dupRows = [];

            for (const r of rows) {
                if (!r) continue;
                // pKey: mã bệnh nhân hoặc họ tên bệnh nhân
                const pKey = stripVN(r.patientCode || r.pId || r.maBN || r.patientName || r.C || '');
                // procKey: tên thủ thuật
                const procKey = stripVN(r.procName || r.AE || r.AG || '');
                // tStart, tEnd: thời gian miliseconds hoặc chuỗi giờ
                const tStart = (r.start instanceof Date && !isNaN(r.start.getTime())) 
                    ? r.start.getTime() 
                    : String(r.AH || r.start || '').trim();
                const tEnd = (r.end instanceof Date && !isNaN(r.end.getTime())) 
                    ? r.end.getTime() 
                    : String(r.L || r.end || '').trim();
                // techKey: KTV / Bác sĩ chính
                const techKey = stripVN(r.techMain || r.AT || '');

                const key = `${pKey}___${procKey}___${tStart}___${tEnd}___${techKey}`;

                // Chỉ tính trùng khi có đủ thông tin tối thiểu (bệnh nhân và thủ thuật)
                if (pKey && procKey && seen.has(key)) {
                    dupRows.push(r);
                } else {
                    if (pKey && procKey) {
                        seen.add(key);
                    }
                    cleanRows.push(r);
                }
            }

            return {
                cleanRows: cleanRows,
                dupRows: dupRows,
                dupCount: dupRows.length
            };
        },

        // ============================================================
        // 🔹 HÀM CẤP CAO ĐỌC & CHUẨN HÓA FILE EXCEL
        // ============================================================

        parseExcelFile: function (file, options = {}) {
            return new Promise((resolve, reject) => {
                if (!file) {
                    return reject(new Error('Chưa chọn file Excel.'));
                }

                if (typeof XLSX === 'undefined') {
                    return reject(new Error('Thư viện đọc file Excel (XLSX) chưa sẵn sàng. Vui lòng kiểm tra lại kết nối mạng.'));
                }

                const curUnit = options.unitCode || (typeof getCurrentUnitCode === 'function' ? getCurrentUnitCode() : localStorage.getItem('pm_unit_code')) || 'bvtks-cs2';
                const forceModal = !!options.forceModal;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                        if (!rawRows || rawRows.length === 0) {
                            return reject(new Error('File Excel rỗng hoặc không có dữ liệu.'));
                        }

                        // Helper gom gói kết quả chuẩn hóa & lọc trùng lặp HIS
                        const buildResult = (currentDetection, meta = {}) => {
                            const normalized = UniversalExcelParser.normalizeRows(rawRows, currentDetection, options);
                            const dedup = UniversalExcelParser.deduplicateRows(normalized);
                            const applyDedup = (options.deduplicate !== false);
                            return {
                                dataRows: applyDedup ? dedup.cleanRows : normalized,
                                cleanRows: dedup.cleanRows,
                                rawRows: normalized,
                                sheetRawJson: rawRows,
                                dupRows: dedup.dupRows,
                                dupCount: dedup.dupCount,
                                detection: currentDetection,
                                sheetName: sheetName,
                                workbook: workbook,
                                ...meta
                            };
                        };

                        // Bước 1: Auto-Detect
                        const detection = UniversalExcelParser.detectColumns(rawRows, options);
                        if (!detection) {
                            return reject(new Error('Không thể phân tích cấu trúc bảng trong file Excel.'));
                        }

                        // Nếu là file lịch nội bộ, parse tự động 100% không cần modal
                        if (detection.isInternalSchedule && !forceModal) {
                            return resolve(buildResult(detection, { isInternal: true }));
                        }

                        // Kiểm tra cấu hình đã lưu cho đơn vị
                        const savedMap = UniversalExcelParser.getSavedMapping(curUnit);
                        let finalDetection = detection;

                        if (savedMap && !forceModal) {
                            // Áp dụng cấu hình đã lưu nếu hợp lệ
                            finalDetection = {
                                ...detection,
                                mapping: { ...detection.mapping, ...savedMap }
                            };
                            return resolve(buildResult(finalDetection, { usedSavedMapping: true }));
                        }

                        // Nếu độ tin cậy cao >= 85% và không bị forceModal -> tự động tiến hành
                        if (detection.confidence >= 85 && !forceModal) {
                            return resolve(buildResult(detection, { autoDetected: true }));
                        }

                        // Trường hợp độ tin cậy < 85% hoặc forceModal -> Hiển thị Modal ánh xạ trực quan
                        UniversalExcelParser.showMappingModal({
                            sheetName: sheetName,
                            rawRows: rawRows,
                            detectionResult: detection,
                            unitCode: curUnit,
                            onConfirm: (userDetection) => {
                                resolve(buildResult(userDetection, { userConfigured: true }));
                            },
                            onCancel: () => {
                                reject(new Error('Người dùng đã hủy thao tác chọn cột.'));
                            }
                        });

                    } catch (err) {
                        console.error('[UniversalExcelParser Error]:', err);
                        reject(err);
                    }
                };

                reader.onerror = (err) => reject(err);
                reader.readAsArrayBuffer(file);
            });
        }
    };

    window.UniversalExcelParser = UniversalExcelParser;

})(window);
