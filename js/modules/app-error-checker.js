/**
 * 🛡️ T.I.M.E.S System v4 - Schedule Collision & Error Checker Module
 */

        function convertExcelDateToJSDate(serial) {
            if (!serial) return null;
            if (typeof serial === 'string') {
                const s = serial.trim();
                const match1 = s.match(/^(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (match1) return new Date(parseInt(match1[5]), parseInt(match1[4]) - 1, parseInt(match1[3]), parseInt(match1[1]), parseInt(match1[2]), 0, 0);
                const match2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})/);
                if (match2) return new Date(parseInt(match2[3]), parseInt(match2[2]) - 1, parseInt(match2[1]), parseInt(match2[4]), parseInt(match2[5]), 0, 0);
                const dateObj = new Date(s);
                if (!isNaN(dateObj.getTime())) return dateObj;
                const parts = s.match(/(\d+):(\d+)/);
                if (parts) {
                     const d = new Date(1900, 0, 1);
                     d.setHours(parseInt(parts[1]), parseInt(parts[2]), 0, 0);
                     return d;
                }
                return null;
            }
            if (serial instanceof Date) return serial;
            const utc_days = Math.floor(serial - 25569);
            const utc_value = utc_days * 86400; 
            const date_info = new Date(utc_value * 1000);
            const fractional_day = serial - Math.floor(serial) + 0.0000001;
            let total_seconds = Math.floor(86400 * fractional_day);
            const seconds = total_seconds % 60;
            total_seconds -= seconds;
            const hours = Math.floor(total_seconds / (60 * 60));
            const minutes = Math.floor(total_seconds / 60) % 60;
            date_info.setHours(hours, minutes, seconds, 0);
            return date_info;
        }

        function formatDate(date) {
            if (!date || isNaN(date.getTime())) return '';
            const h = String(date.getHours()).padStart(2, '0');
            const m = String(date.getMinutes()).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const mo = String(date.getMonth() + 1).padStart(2, '0');
            if (date.getFullYear() === 1900) {
                return `${h}:${m}`;
            }
            return `${h}:${m} (${d}/${mo})`;
        }

        function addOtherRow(tbody, stt, tech, patientAndProc, time, reason) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${stt}</td><td><strong>${tech}</strong></td><td>${patientAndProc}</td><td>${time}</td><td><span style="color:#d35400; font-weight:bold;">${reason}</span></td>`;
            tbody.appendChild(tr);
        }

        function addTimeRow(tbody, stt, tech, ca1Str, ca2Str, reason) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${stt}</td><td><strong>${tech}</strong></td><td>${ca1Str}</td><td>${ca2Str}</td><td><span style="color:#c0392b; font-weight:bold;">${reason}</span></td>`;
            tbody.appendChild(tr);
        }

        function isDate18Sep2026(dateObj, row) {
            if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                const y = dateObj.getFullYear();
                const m = dateObj.getMonth();
                const d = dateObj.getDate();
                if (y === 2026 && m === 8 && d === 18) return true;
                const uy = dateObj.getUTCFullYear();
                const um = dateObj.getUTCMonth();
                const ud = dateObj.getUTCDate();
                if (uy === 2026 && um === 8 && ud === 18) return true;
            }
            if (row && typeof row === 'object') {
                for (const k of Object.keys(row)) {
                    const v = String(row[k] || '');
                    if (v.includes('18/09/2026') || v.includes('18/9/2026') || v.includes('2026-09-18') || v.includes('18-09-2026') || v.includes('(18/09)') || v.includes('18/09')) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Kiểm tra xem ca thủ thuật có diễn ra từ ngày 25/09/2026 trở đi hay không
        function isDateFrom25Sep2026(dateObj, row) {
            if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                const y = dateObj.getFullYear();
                const m = dateObj.getMonth();
                const d = dateObj.getDate();
                if (y > 2026) return true;
                if (y === 2026) {
                    if (m > 8) return true; // Sau tháng 9
                    if (m === 8 && d >= 25) return true; // Từ 25/09/2026
                }
            }
            if (row && typeof row === 'object') {
                for (const k of Object.keys(row)) {
                    const v = String(row[k] || '');
                    const mDate = v.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
                    if (mDate) {
                        const d = parseInt(mDate[1], 10);
                        const m = parseInt(mDate[2], 10);
                        const y = parseInt(mDate[3], 10);
                        if (y > 2026 || (y === 2026 && (m > 9 || (m === 9 && d >= 25)))) return true;
                        if (y < 2026 || (y === 2026 && (m < 9 || (m === 9 && d < 25)))) return false;
                    }
                    const mIso = v.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
                    if (mIso) {
                        const y = parseInt(mIso[1], 10);
                        const m = parseInt(mIso[2], 10);
                        const d = parseInt(mIso[3], 10);
                        if (y > 2026 || (y === 2026 && (m > 9 || (m === 9 && d >= 25)))) return true;
                        if (y < 2026 || (y === 2026 && (m < 9 || (m === 9 && d < 25)))) return false;
                    }
                }
            }
            return false;
        }

        function isDieuDuong(staffName) {
            if (!staffName) return false;
            const sNorm = String(staffName).trim().toLowerCase();
            if (sNorm.startsWith('phụ') || sNorm.startsWith('phu') || sNorm.startsWith('đd') || sNorm.startsWith('dd') || sNorm.startsWith('điều dưỡng') || sNorm.startsWith('dieu duong')) {
                return true;
            }
            const staffList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.staff)) ? dataCache.staff : [];
            const found = staffList.find(s => (s.ten && s.ten.toLowerCase() === sNorm) || (s.name && s.name.toLowerCase() === sNorm));
            if (found) {
                const r = String(found.chucVu || found.role || '').toLowerCase();
                if (r.includes('điều dưỡng') || r.includes('dieu duong') || r.includes('phụ')) {
                    return true;
                }
            }
            return false;
        }

        function processErrorChecking(dataRows) {
            const countBody = document.getElementById('count-body');
            const timeTbody = document.getElementById('error-time-body');
            const otherTbody = document.getElementById('error-other-body');
            if (countBody) countBody.innerHTML = '';
            timeTbody.innerHTML = '';
            otherTbody.innerHTML = '';

            const counts = {};
            const staffList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.staff)) ? dataCache.staff : [];
            staffList.forEach(s => {
                counts[s.ten] = { l1: 0, l2: 0, l3: 0, other: 0 };
            });

            let sttTime = 1;
            let sttOther = 1;

            const validStaffNames = staffList.map(s => s.ten);
            const GAP_MS = 60 * 1000; // Khoảng đệm tối thiểu 1 phút chuyển ca giữa các giường

            // Cấu trúc gom nhóm theo Nhân viên (Chính), Bệnh nhân, Giường bệnh và Máy móc
            const groupedStaff = {};
            const groupedPatients = {};
            const groupedBeds = {};
            const groupedMachines = {};

            for (let row of dataRows) {
                let techMainRaw = String(row['AT'] || '').trim();
                let techMainNorm = getShortNameJS(techMainRaw);

                let techPhuRaw = String(row['AU'] || row['nvPhu'] || row['NV PHỤ'] || '').trim();
                let techPhuNorm = getShortNameJS(techPhuRaw);

                const patientName = String(row['C'] || 'Không rõ').replace(/\s*\((?:✔ RV|❌ Rớt|RV|Rớt)\)/gi, '').trim();
                const procName = String(row['AE'] || '').trim();

                let start = row['AH'] ? convertExcelDateToJSDate(row['AH']) : null;
                let end = row['L'] ? convertExcelDateToJSDate(row['L']) : null;
                const procInfo = mapProcedureJS(procName, start);
                const phongRaw = String(row.phong || row['PHÒNG'] || row['phong'] || '').trim();
                const giuongRaw = String(row.giuong || row['GIƯỜNG'] || row['giuong'] || '').trim();
                const mayRaw = String(row.may || row['MÁY'] || row['may'] || '').trim();

                // 1. Thống kê thủ thuật cho KTV chính (vẫn đếm để ghi nhận số liệu ngày 18/09/2026)
                if (techMainNorm && counts[techMainNorm]) {
                    const loaiVal = String(row['AN'] || (procInfo ? (procInfo.phanLoai || procInfo.loai || procInfo.phan_loai || '') : '')).normalize('NFC').toLowerCase().trim();

                    if (/\bloại\s*3\b|\bloai\s*3\b|\b3\b|\bloại\s*iii\b|\bloai\s*iii\b/.test(loaiVal)) {
                        counts[techMainNorm].l3++;
                    } else if (/\bloại\s*2\b|\bloai\s*2\b|\b2\b|\bloại\s*ii\b|\bloai\s*ii\b/.test(loaiVal)) {
                        counts[techMainNorm].l2++;
                    } else if (/\bloại\s*1\b|\bloai\s*1\b|\b1\b|\bloại\s*i\b|\bloai\s*i\b/.test(loaiVal)) {
                        counts[techMainNorm].l1++;
                    } else {
                        counts[techMainNorm].other++;
                    }
                }

                if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) continue;

                // Tính toán các mốc thời gian của thủ thuật
                const tgThMin = procInfo ? (parseInt(procInfo.thoiGianThucHienMin || procInfo.thoiGianThucHien || procInfo[6]) || 5) : 5;
                let tgThMax = procInfo ? (parseInt(procInfo.thoiGianThucHienMax || procInfo[13]) || tgThMin) : tgThMin;
                if (tgThMax < tgThMin) tgThMax = tgThMin;

                const tgTtMin = procInfo ? (parseInt(procInfo.thoiGianThuThuatMin || procInfo.thoiGianThuThuat || procInfo[7]) || 15) : 15;
                let tgTtMax = procInfo ? (parseInt(procInfo.thoiGianThuThuatMax || procInfo[12]) || tgTtMin) : tgTtMin;
                if (tgTtMax < tgTtMin) tgTtMax = tgTtMin;

                const isCont = procInfo ? (procInfo.lienTuc === 'Có' || procInfo.lienTuc === 1 || procInfo.lienTuc === '1' || procInfo.lienTuc === true || procInfo[14] === 'Có' || procInfo[14] === 1 || (tgThMin === tgTtMin && tgThMax === tgTtMax && tgThMin >= 10)) : false;
                const canRutMay = procInfo ? (procInfo.canRutMay === 'Có' || procInfo.canRutMay === 1 || procInfo.canRutMay === '1' || procInfo.canRutMay === true || procInfo[9] === 'Có' || procInfo[9] === 1) : false;
                const canNguoiPhu = procInfo ? (procInfo.canNguoiPhu === 'Có' || procInfo.nguoiPhu === 'Có' || procInfo[10] === 'Có' || procInfo.canNguoiPhu === 1 || procInfo.canNguoiPhu === '1' || procInfo.canNguoiPhu === true) : false;

                const procTenLower = procInfo ? String(procInfo.ten || '').toLowerCase() : procName.toLowerCase();
                const isDienCham = procTenLower.includes('điện châm') || procTenLower === 'đc' || procTenLower === 'dctb';
                const isHaoCham = procTenLower.includes('hào châm') || procTenLower === 'hc';
                const isThuyCham = procTenLower.includes('thủy châm') || procTenLower === 'tc';
                // Khóa giờ kết thúc đối với TTV chính:
                // Điện châm, Hào châm (kể cả có Điều dưỡng phụ) và thủ thuật PHCN có rút máy -> TTV chính bị khóa giờ kết thúc ca.
                // Riêng Thủy châm: Áp dụng khóa giờ kết thúc của TTV chính từ ngày 25/09/2026 trở đi (trước 25/09/2026 không khóa để không báo lỗi quá khứ).
                const isFrom25Sep = isDateFrom25Sep2026(start, row);
                const applyThuyChamTeardown = isThuyCham && isFrom25Sep;
                const mainHasTeardown = !isCont && (isDienCham || isHaoCham || applyThuyChamTeardown || canRutMay);

                const durMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

                // Xây dựng các khoảng thời gian bận thực tế (Busy Intervals) của nhân viên chính cho ca này:
                const busyIntervals = [];
                if (isCont) {
                    busyIntervals.push({
                        name: `Thao tác liên tục (${durMinutes}p)`,
                        start: start.getTime(),
                        end: end.getTime(),
                        isTear: false
                    });
                } else {
                    const setupEndMs = Math.min(end.getTime(), start.getTime() + tgThMin * 60000);
                    busyIntervals.push({
                        name: `Thao tác đầu ca (${tgThMin}p)`,
                        start: start.getTime(),
                        end: setupEndMs,
                        isTear: false
                    });
                    if (mainHasTeardown) {
                        let tearName = `Tháo máy/tắt máy kết thúc ca`;
                        if (isDienCham || isHaoCham) tearName = `Rút kim kết thúc ca`;
                        else if (isThuyCham) tearName = `Theo dõi/kết thúc Thủy châm`;
                        busyIntervals.push({
                            name: tearName,
                            start: end.getTime(),
                            end: end.getTime(),
                            isTear: true
                        });
                    }
                }

                const itemBase = {
                    raw: row,
                    patientName: patientName,
                    procName: procName,
                    procInfo: procInfo,
                    procMethod: String(row['AG'] || ''),
                    ptttStatus: String(row['AF'] || ''),
                    anesName: String(row['AS'] || ''),
                    start: start,
                    end: end,
                    isCont: isCont,
                    hasTeardown: mainHasTeardown,
                    tth_mins: tgThMin,
                    ttg_mins: tgTtMin,
                    durMinutes: durMinutes,
                    busyIntervals: busyIntervals,
                    phong: phongRaw,
                    giuong: giuongRaw,
                    may: mayRaw
                };

                // Kiểm tra lỗi hành chính / phân quyền / thời gian cho ca này (Bỏ qua riêng ngày 18/09/2026 đã xếp đúng thực tế)
                const isDate18 = isDate18Sep2026(start, row);
                if (!isDate18) {
                    const timeAStr = `${formatDate(start)} -> ${formatDate(end)}`;
                    if (techMainRaw && !validStaffNames.includes(techMainNorm)) {
                        addOtherRow(otherTbody, sttOther++, techMainRaw, `${patientName}<br/>${procName}`, timeAStr, "Sai tên NV Chính (Không có trong CSDL)");
                    }
                    if (techPhuRaw && !validStaffNames.includes(techPhuNorm)) {
                        addOtherRow(otherTbody, sttOther++, techPhuRaw, `${patientName}<br/>${procName}`, timeAStr, "Sai tên NV Phụ (Không có trong CSDL)");
                    }

                    const status = String(row['AF'] || '').trim().toLowerCase();
                    if (status && status !== "chủ động" && status !== "nan") {
                        addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Sai Tình hình PTTT: '${row['AF']}' (Phải là Chủ động)`);
                    }

                    const anes = String(row['AS'] || '').trim().toLowerCase();
                    if (anes && anes !== "khác" && anes !== "nan") {
                        addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Sai Vô cảm: '${row['AS']}' (Bắt buộc Khác)`);
                    }

                    if (row['AG'] && normalizeTextJS(row['AE']) !== normalizeTextJS(row['AG'])) {
                        addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Sai PP tiến hành: '${row['AG']}' (Phải giống tên thủ thuật)`);
                    }

                    if (procInfo && techMainNorm && !checkPermissionJS(techMainNorm, procInfo)) {
                        addOtherRow(otherTbody, sttOther++, techMainNorm, `${patientName}<br/>${procInfo.ten}`, timeAStr, "Làm thủ thuật ngoài phạm vi phân quyền YHCT/PHCN");
                    }

                    // 1. Kiểm tra thời gian thủ thuật của ca so với định mức TG TT (MIN) và TG TT (MAX)
                    if (procInfo) {
                        if (durMinutes < tgTtMin) {
                            addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thời gian thủ thuật ngắn hơn quy định (${durMinutes} phút < ${tgTtMin} phút)`);
                        } else if (durMinutes > tgTtMax) {
                            addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thời gian thủ thuật vượt quá quy định (${durMinutes} phút > ${tgTtMax} phút)`);
                        }

                        // 2. Nếu là thủ thuật làm liên tục: thời gian thao tác liên tục của KTV phải tuân thủ TG TH
                        if (isCont) {
                            if (durMinutes < tgThMin) {
                                addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thời gian thao tác liên tục ngắn hơn định mức (${durMinutes} phút < ${tgThMin} phút)`);
                            } else if (durMinutes > tgThMax) {
                                addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thời gian thao tác liên tục vượt quá định mức (${durMinutes} phút > ${tgThMax} phút)`);
                            }
                        }

                        // 3. Kiểm tra Người phụ
                        // ⚠️ TẠM THỜI VÔ HIỆU HÓA: File HIS hiện chưa nhập dữ liệu người phụ.
                        // Chỉ file lịch trình do phần mềm xếp mới có trường người phụ.
                        // Bật lại kiểm tra này khi cần bằng cách bỏ comment dưới đây.
                        // if (canNguoiPhu && (!techPhuRaw || techPhuRaw === '--' || techPhuRaw === 'Không' || techPhuRaw === 'nan')) {
                        //     addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thủ thuật yêu cầu có Người phụ nhưng chưa phân công`);
                        // }
                    }
                }

                // Gom nhóm KTV Chính
                if (techMainNorm) {
                    if (!groupedStaff[techMainNorm]) groupedStaff[techMainNorm] = [];
                    groupedStaff[techMainNorm].push({
                        ...itemBase,
                        role: 'Chính',
                        techRaw: techMainRaw
                    });
                }

                // Gom nhóm Điều Dưỡng Phụ: TẠM THỜI CHƯA KIỂM TRA LỖI TRÙNG ĐIỀU DƯỠNG (sau này bổ sung sau)
                /*
                if (techPhuNorm) {
                    if (!groupedStaff[techPhuNorm]) groupedStaff[techPhuNorm] = [];
                    groupedStaff[techPhuNorm].push({
                        ...itemBase,
                        role: 'Phụ',
                        techRaw: techPhuRaw,
                        mainTech: techMainNorm
                    });
                }
                */

                // Gom nhóm Bệnh Nhân (MỤC 2)
                if (patientName && patientName !== 'Không rõ') {
                    if (!groupedPatients[patientName]) groupedPatients[patientName] = [];
                    groupedPatients[patientName].push({
                        ...itemBase,
                        techMainNorm: techMainNorm,
                        techPhuNorm: techPhuNorm
                    });
                }

                // Gom nhóm Giường bệnh (Nếu có dữ liệu giường bệnh)
                if (giuongRaw) {
                    const gLower = giuongRaw.toLowerCase();
                    const isExcludedBed = gLower.includes('thủ công') || gLower.includes('thu cong') || 
                                          gLower.includes('ghế') || gLower.includes('ghe') || 
                                          gLower.includes('phụ') || gLower.includes('phu') || 
                                          gLower.includes('kéo giãn') || gLower.includes('keo gian') || 
                                          giuongRaw === '--' || giuongRaw === '';
                    if (!isExcludedBed) {
                        const bedKey = (phongRaw ? `${phongRaw} - ` : '') + (giuongRaw.toLowerCase().startsWith('giường') ? giuongRaw : `Giường ${giuongRaw}`);
                        if (!groupedBeds[bedKey]) groupedBeds[bedKey] = [];
                        groupedBeds[bedKey].push({
                            ...itemBase,
                            techMainNorm: techMainNorm
                        });
                    }
                }

                // Gom nhóm Máy móc (Nếu có dữ liệu máy móc)
                if (mayRaw) {
                    const mLower = mayRaw.toLowerCase();
                    const isExcludedMachine = mLower.includes('thủ công') || mLower.includes('thu cong') || mayRaw === '--' || mayRaw === '';
                    if (!isExcludedMachine) {
                        if (!groupedMachines[mayRaw]) groupedMachines[mayRaw] = [];
                        groupedMachines[mayRaw].push({
                            ...itemBase,
                            techMainNorm: techMainNorm
                        });
                    }
                }
            }

            // ============================================================
            // 🚨 1. QUÉT LỖI TRÙNG GIỜ NHÂN SỰ
            // ============================================================
            for (const [tech, groupRows] of Object.entries(groupedStaff)) {
                // Tạm thời chưa kiểm tra lỗi trùng của điều dưỡng
                if (isDieuDuong(tech)) continue;

                groupRows.sort((a, b) => a.start.getTime() - b.start.getTime());
                const n = groupRows.length;

                for (let i = 0; i < n; i++) {
                    const A = groupRows[i];
                    for (let j = i + 1; j < n; j++) {
                        const B = groupRows[j];
                        // Bỏ qua lỗi của riêng ngày 18/09/2026 đã xếp đúng thực tế
                        if (isDate18Sep2026(A.start, A.raw) || isDate18Sep2026(B.start, B.raw)) continue;

                        // Nếu ca B bắt đầu sau khi ca A kết thúc hoàn toàn (kèm đệm 1p), không thể va chạm tiếp
                        if (B.start.getTime() >= A.end.getTime() + GAP_MS) break;

                        let conflictFound = null;
                        for (const intA of A.busyIntervals) {
                            for (const intB of B.busyIntervals) {
                                const first = intA.start <= intB.start ? intA : intB;
                                const second = intA.start <= intB.start ? intB : intA;

                                // 1. Cùng kết thúc ca lúc cùng một phút
                                if (first.start === second.start && intA.isTear && intB.isTear) {
                                    conflictFound = {
                                        type: 'OVERLAP',
                                        reason: `Trùng giờ kết thúc ca (cả 2 ca cùng kết thúc lúc ${formatDate(new Date(first.start))})`
                                    };
                                    break;
                                }
                                // 2. Trùng / đè giờ trực tiếp
                                else if (second.start < first.end) {
                                    const ovStart = Math.max(intA.start, intB.start);
                                    const ovEnd = Math.min(intA.end, intB.end);
                                    conflictFound = {
                                        type: 'OVERLAP',
                                        reason: `${intA.name} (Ca 1) và ${intB.name} (Ca 2) đè giờ nhau (${formatDate(new Date(ovStart))} -> ${formatDate(new Date(ovEnd))})`
                                    };
                                    break;
                                }
                                // 3. Thiếu khoảng đệm 1 phút chuyển giường giữa 2 bệnh nhân khác nhau (MỤC 1)
                                else if (A.patientName !== B.patientName && second.start < first.end + GAP_MS) {
                                    conflictFound = {
                                        type: 'GAP',
                                        reason: `Thiếu khoảng đệm 1p chuyển giường giữa ${first.name} (kết thúc ${formatDate(new Date(first.end))}) và ${second.name} (bắt đầu ${formatDate(new Date(second.start))})`
                                    };
                                    break;
                                }
                            }
                            if (conflictFound) break;
                        }

                        if (conflictFound) {
                            let roleTag = "";
                            if (A.role === 'Phụ' && B.role === 'Phụ') {
                                roleTag = " [ĐD Phụ]";
                            } else if (A.role !== B.role) {
                                roleTag = " [Vừa làm Chính vừa làm Phụ]";
                            }

                            const timeAStr = `${formatDate(A.start)} -> ${formatDate(A.end)}`;
                            const timeBStr = `${formatDate(B.start)} -> ${formatDate(B.end)}`;
                            const ca1Info = `<b>${A.patientName}</b><br/>${A.procName}<br/><span style="color:#2c3e50;">⏱ ${timeAStr}</span>`;
                            const ca2Info = `<b>${B.patientName}</b><br/>${B.procName}<br/><span style="color:#2c3e50;">⏱ ${timeBStr}</span>`;
                            const techDisplay = (A.role === 'Phụ' || B.role === 'Phụ') ? `${tech} <small style="color:#e67e22;">(${A.role === B.role ? 'Hỗ trợ phụ' : 'Chính & Phụ'})</small>` : tech;
                            
                            addTimeRow(timeTbody, sttTime++, techDisplay, ca1Info, ca2Info, conflictFound.reason + roleTag);
                        }
                    }
                }
            }

            // ============================================================
            // 🚨 2. QUÉT LỖI TRÙNG BỆNH NHÂN (1 BN LÀM 2 THỦ THUẬT CÙNG LÚC)
            // ============================================================
            for (const [pName, pRows] of Object.entries(groupedPatients)) {
                pRows.sort((a, b) => a.start.getTime() - b.start.getTime());
                const m = pRows.length;

                for (let i = 0; i < m; i++) {
                    const P1 = pRows[i];
                    for (let j = i + 1; j < m; j++) {
                        const P2 = pRows[j];
                        // Bỏ qua lỗi của riêng ngày 18/09/2026 đã xếp đúng thực tế
                        if (isDate18Sep2026(P1.start, P1.raw) || isDate18Sep2026(P2.start, P2.raw)) continue;

                        // Nếu P2 bắt đầu khi hoặc sau khi P1 kết thúc hoàn toàn, không va chạm tiếp
                        if (P2.start.getTime() >= P1.end.getTime()) break;

                        // Trùng giờ: P2 bắt đầu trước khi P1 kết thúc!
                        const timeP1Str = `${formatDate(P1.start)} -> ${formatDate(P1.end)}`;
                        const timeP2Str = `${formatDate(P2.start)} -> ${formatDate(P2.end)}`;
                        const p1Info = `<b>${P1.procName}</b><br/><span style="color:#2c3e50;">⏱ ${timeP1Str}</span><br/><small>KTV: ${P1.techMainNorm || 'Chưa rõ'}${P1.techPhuNorm ? ` | Phụ: ${P1.techPhuNorm}` : ''}</small>`;
                        const p2Info = `<b>${P2.procName}</b><br/><span style="color:#2c3e50;">⏱ ${timeP2Str}</span><br/><small>KTV: ${P2.techMainNorm || 'Chưa rõ'}${P2.techPhuNorm ? ` | Phụ: ${P2.techPhuNorm}` : ''}</small>`;
                        const bnTag = `<span style="color:#2980b9; font-weight:bold;">👤 ${pName}</span><br/><small style="color:#7f8c8d;">(Trùng BN)</small>`;
                        
                        addTimeRow(timeTbody, sttTime++, bnTag, p1Info, p2Info, `Bệnh nhân bị xếp 2 thủ thuật cùng lúc (${formatDate(P2.start)} đè lên ca trước kết thúc lúc ${formatDate(P1.end)})`);
                    }
                }
            }

            // ============================================================
            // 🚨 3. QUÉT LỖI TRÙNG GIƯỜNG BỆNH (2 BN NẰM CÙNG 1 GIƯỜNG CÙNG LÚC)
            // ============================================================
            for (const [bedKey, bRows] of Object.entries(groupedBeds)) {
                bRows.sort((a, b) => a.start.getTime() - b.start.getTime());
                const len = bRows.length;

                for (let i = 0; i < len; i++) {
                    const G1 = bRows[i];
                    for (let j = i + 1; j < len; j++) {
                        const G2 = bRows[j];
                        // Bỏ qua lỗi của riêng ngày 18/09/2026 đã xếp đúng thực tế
                        if (isDate18Sep2026(G1.start, G1.raw) || isDate18Sep2026(G2.start, G2.raw)) continue;

                        // Nếu G2 bắt đầu tại hoặc sau khi G1 kết thúc hoàn toàn, không va chạm tiếp
                        if (G2.start.getTime() >= G1.end.getTime()) break;

                        // Trùng giường: G2 bắt đầu trước khi G1 kết thúc!
                        const timeG1Str = `${formatDate(G1.start)} -> ${formatDate(G1.end)}`;
                        const timeG2Str = `${formatDate(G2.start)} -> ${formatDate(G2.end)}`;
                        const g1Info = `<b>${G1.patientName}</b><br/>${G1.procName}<br/><span style="color:#2c3e50;">⏱ ${timeG1Str}</span><br/><small>KTV: ${G1.techMainNorm || 'Chưa rõ'}</small>`;
                        const g2Info = `<b>${G2.patientName}</b><br/>${G2.procName}<br/><span style="color:#2c3e50;">⏱ ${timeG2Str}</span><br/><small>KTV: ${G2.techMainNorm || 'Chưa rõ'}</small>`;
                        const bedTag = `<span style="color:#8e44ad; font-weight:bold;">🛏️ ${bedKey}</span><br/><small style="color:#7f8c8d;">(Trùng Giường)</small>`;

                        addTimeRow(timeTbody, sttTime++, bedTag, g1Info, g2Info, `2 ca nằm trùng giường bệnh (${formatDate(G2.start)} đè lên ca trước kết thúc lúc ${formatDate(G1.end)})`);
                    }
                }
            }

            // ============================================================
            // 🚨 4. QUÉT LỖI TRÙNG MÁY MÓC (2 CA DÙNG CHUNG 1 MÁY CÙNG LÚC)
            // ============================================================
            for (const [mName, mRows] of Object.entries(groupedMachines)) {
                mRows.sort((a, b) => a.start.getTime() - b.start.getTime());
                const mLen = mRows.length;

                for (let i = 0; i < mLen; i++) {
                    const M1 = mRows[i];
                    for (let j = i + 1; j < mLen; j++) {
                        const M2 = mRows[j];
                        // Bỏ qua lỗi của riêng ngày 18/09/2026 đã xếp đúng thực tế
                        if (isDate18Sep2026(M1.start, M1.raw) || isDate18Sep2026(M2.start, M2.raw)) continue;

                        // Nếu M2 bắt đầu tại hoặc sau khi M1 kết thúc hoàn toàn, không va chạm tiếp
                        if (M2.start.getTime() >= M1.end.getTime()) break;

                        // Trùng máy: M2 bắt đầu trước khi M1 kết thúc!
                        const timeM1Str = `${formatDate(M1.start)} -> ${formatDate(M1.end)}`;
                        const timeM2Str = `${formatDate(M2.start)} -> ${formatDate(M2.end)}`;
                        const m1Info = `<b>${M1.patientName}</b><br/>${M1.procName}<br/><span style="color:#2c3e50;">⏱ ${timeM1Str}</span><br/><small>KTV: ${M1.techMainNorm || 'Chưa rõ'}</small>`;
                        const m2Info = `<b>${M2.patientName}</b><br/>${M2.procName}<br/><span style="color:#2c3e50;">⏱ ${timeM2Str}</span><br/><small>KTV: ${M2.techMainNorm || 'Chưa rõ'}</small>`;
                        const machineTag = `<span style="color:#d35400; font-weight:bold;">⚡ ${mName}</span><br/><small style="color:#7f8c8d;">(Trùng Máy)</small>`;

                        addTimeRow(timeTbody, sttTime++, machineTag, m1Info, m2Info, `2 ca sử dụng cùng 1 máy móc (${formatDate(M2.start)} đè lên ca trước kết thúc lúc ${formatDate(M1.end)})`);
                    }
                }
            }

            if (timeTbody.children.length === 0) timeTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có lỗi trùng giờ! 🎉</td></tr>';
            if (otherTbody.children.length === 0) otherTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có lỗi phân quyền/quy trình! 🎉</td></tr>';

            if (countBody) {
                let countHtml = '';
                let t1 = 0, t2 = 0, t3 = 0, to = 0;
                staffList.forEach(s => {
                    const c = counts[s.ten];
                    if (!c) return;
                    if (c.l1 === 0 && c.l2 === 0 && c.l3 === 0 && c.other === 0) return;
                    t1 += c.l1; t2 += c.l2; t3 += c.l3; to += c.other;
                    countHtml += `<tr>
                        <td><strong>${s.ten}</strong></td>
                        <td style="text-align:center">${c.l1}</td>
                        <td style="text-align:center">${c.l2}</td>
                        <td style="text-align:center">${c.l3}</td>
                        <td style="text-align:center">${c.other}</td>
                    </tr>`;
                });
                countHtml += `<tr style="font-weight:bold; background:#eafaf1;">
                    <td>TỔNG CỘNG</td>
                    <td style="text-align:center">${t1}</td>
                    <td style="text-align:center">${t2}</td>
                    <td style="text-align:center">${t3}</td>
                    <td style="text-align:center">${to}</td>
                </tr>`;
                countBody.innerHTML = countHtml || '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu thủ thuật</td></tr>';
            }
        }


        // ✅ KIỂM TRA LỖI HIS
        // ============================================================

        function initErrorChecker() {
            const fileInput = document.getElementById('error-file-input');
            const btnCheckCurrent = document.getElementById('btn-check-current-schedule');

            if (btnCheckCurrent) {
                btnCheckCurrent.addEventListener('click', () => {
                    const currentSched = (window.currentScheduleData && window.currentScheduleData.length) ? window.currentScheduleData : ((typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : []);
                    if (!currentSched || currentSched.length === 0) {
                        alert('Hiện chưa có dữ liệu trên bảng xếp lịch. Vui lòng bấm "Xếp lịch" hoặc chọn file Excel/HIS để kiểm tra.');
                        return;
                    }
                    const rows = currentSched.filter(r => r && r.gioDienRa && r.gioDienRa !== '--' && !String(r.gioDienRa).includes('Rớt') && !r.__dropped).map(r => {
                        const bd = r.gioDienRa || r['GIỜ DIỄN RA'] || r.batDau || '';
                        const kt = r.gioKetThuc || r['GIỜ KẾT THÚC'] || r.ketThuc || '';
                        const ngay = r.ngay || r.NGAY || r['NGÀY'] || '';
                        const datePart = ngay.includes('-') ? ngay.split('-').reverse().join('/') : ngay;
                        const startFull = datePart ? `${bd} ${datePart}` : bd;
                        const endFull = datePart ? `${kt} ${datePart}` : kt;
                        const pName = (r.tenBN || r.hoTen || r['HỌ TÊN'] || '').replace(/\s*\((?:✔ RV|❌ Rớt|RV|Rớt)\)/gi, '').trim();
                        const proc = r.thuThuat || r.dichVu || r['DỊCH VỤ'] || '';
                        const procInfo = mapProcedureJS(proc);
                        return {
                            'AT': r.nvChinh || r['NV CHÍNH'] || '',
                            'AU': r.nvPhu || r['NV PHỤ'] || '',
                            'C': pName,
                            'AE': proc,
                            'AG': proc,
                            'AF': 'Chủ động',
                            'AS': 'Khác',
                            'AN': procInfo ? (procInfo.phanLoai || procInfo.loai || '') : '',
                            'AH': startFull,
                            'L': endFull,
                            'phong': r.phong || r['PHÒNG'] || r['phong'] || '',
                            'giuong': r.giuong || r['GIƯỜNG'] || r['giuong'] || '',
                            'may': r.may || r['MÁY'] || r['may'] || ''
                        };
                    });
                    processErrorChecking(rows);
                });
            }

            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) {
                        return;
                    }

                    if (window.showGlobalLoading) window.showGlobalLoading('Đang phân tích file HIS...');

                    const reader = new FileReader();
                    reader.onload = function (ev) {
                        try {
                            const data = new Uint8Array(ev.target.result);
                            const workbook = XLSX.read(data, { type: 'array', cellDates: false });
                            const firstSheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[firstSheetName];
                            
                            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                            let headerRowIndex = -1;
                            let isInternalSchedule = false;

                            function stripVietnamese(str) {
                                if (!str) return '';
                                return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
                            }

                            for (let i = 0; i < Math.min(rawData.length, 50); i++) {
                                const rowStr = (rawData[i] || []).map(stripVietnamese);
                                if (rowStr.some(c => c.includes("ten benh nhan") || c.includes("ten bn") || c.includes("hoten"))) {
                                    headerRowIndex = i;
                                    isInternalSchedule = true;
                                    break;
                                } else if (rowStr.some(c => c.includes("stt") || c.includes("name") || c.includes("mabn"))) {
                                    headerRowIndex = i;
                                    break;
                                }
                            }

                            if (headerRowIndex < 0) headerRowIndex = 0;

                            let dataRows = [];
                            if (isInternalSchedule) {
                                // Trích xuất ngày từ dòng tiêu đề trên cùng (ví dụ: 'Ngày thực hiện: 19/09/2026') nếu không có cột Ngày
                                let extractedFileDate = '';
                                for (let i = 0; i < headerRowIndex; i++) {
                                    const rowCells = rawData[i] || [];
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

                                const headerRow = (rawData[headerRowIndex] || []).map(stripVietnamese);
                                const colIdx = {
                                    ngay: headerRow.findIndex(h => h.includes('ngay')),
                                    ten: headerRow.findIndex(h => h.includes('ten benh nhan') || h.includes('ten bn') || h.includes('hoten')),
                                    tt: headerRow.findIndex(h => h.includes('thu thuat') || h.includes('dich vu') || h.includes('dichvu')),
                                    bd: headerRow.findIndex(h => h.includes('bat dau') || h.includes('gio dien ra') || h.includes('giodienra')),
                                    kt: headerRow.findIndex(h => h.includes('ket thuc') || h.includes('gioketthuc')),
                                    nv: headerRow.findIndex(h => h.includes('nv chinh') || h.includes('nhan vien chinh') || h.includes('ktv') || h.includes('bac si') || h.includes('bác sĩ')),
                                    nvPhu: headerRow.findIndex(h => h.includes('nv phu') || h.includes('nhan vien phu') || h.includes('phu ta') || h.includes('dieu duong phu')),
                                    phong: headerRow.findIndex(h => h.includes('phong dieu tri') || h.includes('phong')),
                                    giuong: headerRow.findIndex(h => h.includes('giuong benh') || h.includes('giuong')),
                                    may: headerRow.findIndex(h => h.includes('may moc') || h.includes('thiet bi') || h.includes('may'))
                                };

                                dataRows = rawData.slice(headerRowIndex + 1).filter(r => r && r.some(c => String(c).trim())).map(r => {
                                    const ngayStr = colIdx.ngay >= 0 ? String(r[colIdx.ngay] || '').trim() : extractedFileDate;
                                    const bdStr = colIdx.bd >= 0 ? String(r[colIdx.bd] || '').trim() : '';
                                    const ktStr = colIdx.kt >= 0 ? String(r[colIdx.kt] || '').trim() : '';

                                    if (bdStr.includes('Rớt') || bdStr === '--' || !bdStr) return null;

                                    const datePart = ngayStr.includes('-') ? ngayStr.split('-').reverse().join('/') : ngayStr;
                                    const startFull = datePart ? `${bdStr} ${datePart}` : bdStr;
                                    const endFull = datePart ? `${ktStr} ${datePart}` : ktStr;

                                    const cleanBN = (colIdx.ten >= 0 ? String(r[colIdx.ten] || '') : '').replace(/\s*\((?:✔ RV|❌ Rớt|RV|Rớt)\)/gi, '').trim();
                                    const procName = colIdx.tt >= 0 ? String(r[colIdx.tt] || '').trim() : '';
                                    const procInfo = mapProcedureJS(procName);
                                    const procLoai = procInfo ? (procInfo.phanLoai || procInfo.loai || procInfo.he || '') : '';

                                    return {
                                        'AT': colIdx.nv >= 0 ? r[colIdx.nv] : '',
                                        'AU': colIdx.nvPhu >= 0 ? r[colIdx.nvPhu] : '',
                                        'C': cleanBN,
                                        'AE': procName,
                                        'AG': procName,
                                        'AF': 'Chủ động',
                                        'AS': 'Khác',
                                        'AN': procLoai,
                                        'AH': startFull,
                                        'L': endFull,
                                        'phong': colIdx.phong >= 0 ? String(r[colIdx.phong] || '').trim() : '',
                                        'giuong': colIdx.giuong >= 0 ? String(r[colIdx.giuong] || '').trim() : '',
                                        'may': colIdx.may >= 0 ? String(r[colIdx.may] || '').trim() : ''
                                    };
                                }).filter(Boolean);
                            } else {
                                dataRows = XLSX.utils.sheet_to_json(worksheet, { header: "A", range: headerRowIndex, defval: "" });
                            }

                            processErrorChecking(dataRows);
                            if (window.hideGlobalLoading) window.hideGlobalLoading();
                        } catch (err) {
                            if (window.hideGlobalLoading) window.hideGlobalLoading();
                            console.error(err);
                            alert("Lỗi khi đọc file. Vui lòng kiểm tra lại cấu trúc form.");
                            timeTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa tải dữ liệu</td></tr>';
                            otherTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa tải dữ liệu</td></tr>';
                        }
                    };
                    reader.readAsArrayBuffer(file);
                });
            }
        }

        function normalizeTextJS(text) {
            if (!text || typeof text !== 'string') return '';
            return text.normalize('NFC').trim().toLowerCase();
        }

        function getShortNameJS(fullName) {
            const lowerName = normalizeTextJS(fullName);
            if (!lowerName) return '';
            
            for (const s of dataCache.staff) {
                const tenHIS = String(s.tenHis || '').toLowerCase();
                if (!tenHIS) continue;
                const keys = tenHIS.split(',').map(k => k.trim()).filter(k => k);
                for (const k of keys) {
                    if (lowerName.includes(k)) return s.ten;
                }
            }
            return String(fullName).trim();
        }

        function mapProcedureJS(procStr, targetDate) {
            if (!procStr) return null;
            const procStrLower = normalizeTextJS(procStr);
            const procList = (typeof dataCache !== 'undefined' && dataCache && dataCache.proc) ? dataCache.proc : [];
            let matched = null;
            for (const p of procList) {
                const ten = String(p.ten || p.name || '').toLowerCase();
                const vietTat = String(p.vietTat || '').toLowerCase();
                if ((ten && procStrLower.includes(ten)) || (vietTat && procStrLower === vietTat)) {
                    matched = p;
                    break;
                }
            }
            if (!matched) return null;

            if (!targetDate) return matched;

            let dObj = null;
            if (targetDate instanceof Date) {
                dObj = targetDate;
            } else if (typeof targetDate === 'number') {
                dObj = convertExcelDateToJSDate(targetDate);
            } else if (typeof targetDate === 'string') {
                const s = targetDate.trim();
                if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
                    const [d, m, y] = s.split('/');
                    dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                } else {
                    dObj = new Date(s);
                }
            }
            if (!dObj || isNaN(dObj.getTime())) return matched;

            const yyyy = dObj.getFullYear();
            const mm = String(dObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dObj.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const historyList = (matched.history && Array.isArray(matched.history))
                ? matched.history
                : ((matched.lichSuDinhMuc && Array.isArray(matched.lichSuDinhMuc))
                    ? matched.lichSuDinhMuc
                    : (typeof matched.lichSuDinhMuc === 'string' ? JSON.parse(matched.lichSuDinhMuc || '[]') : []));

            if (historyList && historyList.length) {
                for (const h of historyList) {
                    const from = h.from || h.tuNgay || h.tu_ngay || '0000-00-00';
                    const to = h.to || h.denNgay || h.den_ngay || '9999-99-99';
                    if (dateStr >= from && dateStr <= to) {
                        return {
                            ...matched,
                            thoiGianThucHien: h.thoiGianThucHien || h.thoiGianThucHienMin || h.tg_thuc_hien || matched.thoiGianThucHien,
                            thoiGianThucHienMin: h.thoiGianThucHienMin || h.thoiGianThucHien || h.tg_thuc_hien || matched.thoiGianThucHienMin,
                            thoiGianThucHienMax: h.thoiGianThucHienMax || h.tg_thuc_hien_max || matched.thoiGianThucHienMax,
                            thoiGianThuThuat: h.thoiGianThuThuat || h.thoiGianThuThuatMin || h.tg_thu_thuat || matched.thoiGianThuThuat,
                            thoiGianThuThuatMin: h.thoiGianThuThuatMin || h.thoiGianThuThuat || h.tg_thu_thuat || matched.thoiGianThuThuatMin,
                            thoiGianThuThuatMax: h.thoiGianThuThuatMax || h.tg_thu_thuat_max || matched.thoiGianThuThuatMax,
                            khoangCach: h.khoangCach !== undefined ? h.khoangCach : matched.khoangCach,
                            canRutMay: h.canRutMay || matched.canRutMay,
                            canNguoiPhu: h.canNguoiPhu || matched.canNguoiPhu,
                            dsNguoiPhu: h.dsNguoiPhu || matched.dsNguoiPhu,
                            vietTat: h.vietTat || matched.vietTat,
                            he: h.he || matched.he,
                            phanLoai: h.phanLoai || matched.phanLoai,
                            may: h.may || matched.may,
                            lienTuc: h.lienTuc !== undefined ? h.lienTuc : matched.lienTuc
                        };
                    }
                }
            }

            return matched;
        }

        function checkPermissionJS(techName, procInfo) {
            const staff = dataCache.staff.find(s => s.ten === techName);
            if (!staff) return true;
            if (!procInfo) return true;
            
            const staffQuyen = staff.quyen || 'Cả hai';
            if (staffQuyen === 'Cả hai') return true;
            
            const procSystem = procInfo.he || 'PHCN';
            return staffQuyen === procSystem;
        }


window.processErrorChecking = processErrorChecking;
window.initErrorChecker = initErrorChecker;
