// ═══════════════════════════════════════════════════════════════════════════════
// 📅 ROUTES: XẾP LỊCH, LỊCH SỬ, CHỐT SỔ & MÔ HÌNH HỌC MÁY AI
// Ràng buộc Rule 2: 100% câu lệnh SQL phải có WHERE unit_code = ?
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleSchedulesAction(action, ctx) {
  const { db, args, env, request, executionCtx, unitCode, tokenPayload, origin, helpers } = ctx;
  const {
    success, error, jsonResponse, parseStringOrJsonArray,
    bumpDataVersion, makeBumpDataVersionStmt, setCaiDat, normalizeMonthKeys,
    checkAutoChotSo, autoTrainAIModel, trainAIModelOnServer
  } = helpers;
  const sanitizeInputText = helpers?.sanitizeInputText || ((str) => (typeof str === "string" ? str.replace(/<[^>]*>/g, "") : str));
  const healBackendPatientName = helpers?.healBackendPatientName || ((str) => String(str || "").trim());

  switch (action) {
    case "getLichSu":

    case "getAllHistory":

    case "getHistoryForAI": {
      const res = await db.prepare("SELECT date, patient_name, dob, room, procedure_name, staff_name, sub_staff_name, machine_name, bed, start_time, end_time FROM lich_su WHERE unit_code = ? ORDER BY id DESC").bind(unitCode).all().catch(() => ({ results: [] }));
      let rawRows = res.results || [];
      if (rawRows.length === 0) {
        // Fallback: nếu chưa có dữ liệu lịch sử chốt sổ, nạp các ca từ bảng lịch trình để AI có dữ liệu học
        const ltRes = await db.prepare("SELECT date, patient_name, dob, room, procedure_name, staff_name, sub_staff_name, machine_name, bed, start_time, end_time FROM lich_trinh WHERE unit_code = ? ORDER BY id DESC").bind(unitCode).all().catch(() => ({ results: [] }));
        rawRows = ltRes.results || [];
      }
      const rows = rawRows.map(s => ({
        date: s.date,
        ngay: s.date,
        patient_name: s.patient_name,
        tenBN: s.patient_name,
        HOTEN: s.patient_name,
        dob: s.dob || "",
        namSinh: s.dob || "",
        NAMSINH: s.dob || "",
        room: s.room || "",
        phong: s.room || "",
        PHONG: s.room || "",
        procedure_name: s.procedure_name,
        thuThuat: s.procedure_name,
        DICHVU: s.procedure_name,
        start_time: s.start_time,
        gioDienRa: s.start_time,
        GIODIENRA: s.start_time,
        end_time: s.end_time,
        gioKetThuc: s.end_time,
        GIOKETTHUC: s.end_time,
        staff_name: s.staff_name || "",
        nvChinh: s.staff_name || "",
        "NV CHÍNH": s.staff_name || "",
        sub_staff_name: s.sub_staff_name || "",
        nvPhu: s.sub_staff_name || "",
        "NV PHỤ": s.sub_staff_name || "",
        machine_name: s.machine_name || "",
        may: s.machine_name || "",
        MAY: s.machine_name || "",
        bed: s.bed || "",
        giuong: s.bed || "",
        GIUONG: s.bed || ""
      }));
      return success({ count: rows.length, rows: rows, history: rows });
    }

    // ============================================================
    // 2. CRUD MÁY MÓC
    // ============================================================

    case "getSchedule":

    case "getLichTrinh": {
      const date = args[0] || new Date().toISOString().slice(0, 10);
      let ymd = date, dmy = date;
      if (date.includes("/")) {
        const [d, m, y] = date.split("/");
        ymd = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      } else if (date.includes("-")) {
        const [y, m, d] = date.split("-");
        ymd = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      const res = await db.prepare("SELECT * FROM lich_trinh WHERE unit_code = ? AND (date = ? OR date = ?) ORDER BY order_idx ASC, start_time ASC").bind(unitCode, ymd, dmy).all();
      const rows = (res.results || []).map(s => [
        s.date, s.patient_name, s.dob || "", s.room || "", s.procedure_name, s.start_time, s.end_time, s.staff_name || "", s.sub_staff_name || "", s.machine_name || "", s.bed || ""
      ]);
      return success(rows);
    }

    case "saveSchedule": {
      const date = args[0] || new Date().toISOString().slice(0, 10);
      const rows = args[1] || [];

      let ymd = date;
      let dmy = date;
      if (date.includes("-")) {
        const parts = date.split("-");
        if (parts.length === 3) dmy = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (date.includes("/")) {
        const parts = date.split("/");
        if (parts.length === 3) ymd = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      // 🛡️ Tự động đối chiếu và phục hồi tên bệnh nhân sạch từ bảng benh_nhan
      let candidateNames = [];
      try {
        const bnRes = await db.prepare("SELECT name FROM benh_nhan WHERE unit_code = ?").bind(unitCode).all();
        if (bnRes && bnRes.results) {
          candidateNames = bnRes.results.map(b => String(b.name || "").normalize("NFC").trim()).filter(Boolean);
        }
      } catch (eBn) {
        console.warn("[saveSchedule]: Lỗi lấy danh sách benh_nhan:", eBn);
      }

      const statements = [
        db.prepare("DELETE FROM lich_trinh WHERE unit_code = ? AND (date = ? OR date = ?)").bind(unitCode, ymd, dmy)
      ];

      rows.forEach((r, idx) => {
        let cleanPatientName = healBackendPatientName(r[1] || "", true);
        statements.push(
          db.prepare("INSERT INTO lich_trinh (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(
            unitCode,
            r[0] || ymd,
            cleanPatientName,
            r[2] || "",
            r[3] || "",
            r[4] || "",
            r[5] || "",
            r[6] || "",
            r[7] || "",
            r[8] || "",
            r[9] || "",
            r[10] || "",
            idx
          )
        );
      });

      if (statements.length > 0) {
        // Gửi batch lớn (250 câu lệnh/request) tối ưu hóa Turso Pipeline
        const chunkSize = 250;
        for (let i = 0; i < statements.length; i += chunkSize) {
          await db.batch(statements.slice(i, i + chunkSize));
        }
        await bumpDataVersion(db, unitCode);
      }
      return success(true);
    }

    case "chuyenNgayMoi":

    case "chotSo": {
      const date = args[0];
      let targetDateStr = (date && typeof date === "string" && date.trim()) ? date.trim() : "";
      if (!targetDateStr) {
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const yy = nowVN.getUTCFullYear();
        const mm = String(nowVN.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(nowVN.getUTCDate()).padStart(2, "0");
        targetDateStr = `${yy}-${mm}-${dd}`;
      }
      
      const statements = [];

      // 1. Sao lưu giờ bận thực tế của nhân viên trước khi reset (chỉ lưu vào gio_ban_chung_cu)
      statements.push(
        db.prepare("DELETE FROM gio_ban_chung_cu WHERE unit_code = ? AND date = ?").bind(unitCode, targetDateStr),
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, busy_ranges) SELECT unit_code, ?, 'nhan_su', name, temp_busy FROM nhan_su WHERE unit_code = ? AND temp_busy IS NOT NULL AND temp_busy != '' AND temp_busy != '[]' AND temp_busy != '[\"\"]'").bind(targetDateStr, unitCode),
        // 2. Sao lưu giờ bận thực tế của bệnh nhân trước khi reset
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) SELECT unit_code, ?, 'benh_nhan', name, age, gio_ban FROM benh_nhan WHERE unit_code = ? AND gio_ban IS NOT NULL AND TRIM(gio_ban) != ''").bind(targetDateStr, unitCode),
        // 3. Sao lưu giờ ra viện của bệnh nhân trước khi reset
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) SELECT unit_code, ?, 'ra_vien', name, age, leave_time FROM benh_nhan WHERE unit_code = ? AND leave_time IS NOT NULL AND TRIM(leave_time) != '' AND LOWER(leave_time) != 'none'").bind(targetDateStr, unitCode)
      );

      if (date && typeof date === "string" && date.trim()) {
        const targetDate = date.trim();
        statements.push(
          db.prepare("DELETE FROM lich_su WHERE unit_code = ? AND date = ?").bind(unitCode, targetDate),
          db.prepare("INSERT INTO lich_su (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed) SELECT unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ? AND date = ?").bind(unitCode, targetDate),
          db.prepare("DELETE FROM lich_trinh WHERE unit_code = ? AND date = ?").bind(unitCode, targetDate)
        );
      } else {
        statements.push(
          db.prepare("DELETE FROM lich_su WHERE unit_code = ? AND date IN (SELECT DISTINCT date FROM lich_trinh WHERE unit_code = ?)").bind(unitCode, unitCode),
          db.prepare("INSERT INTO lich_su (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed) SELECT unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ?").bind(unitCode),
          db.prepare("DELETE FROM lich_trinh WHERE unit_code = ?").bind(unitCode)
        );
      }

      // Xóa bệnh nhân đã có giờ ra viện
      statements.push(
        db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND leave_time IS NOT NULL AND TRIM(leave_time) != '' AND LOWER(leave_time) != 'none'").bind(unitCode),
        // Reset giờ vào về 07:30, xóa giờ bận, giờ ra, và reset status về 'Chưa xếp'
        db.prepare("UPDATE benh_nhan SET arrive_time = '07:30', gio_ban = '', leave_time = '', status = 'Chưa xếp', updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(unitCode),
        // Reset giờ bận tạm thời của nhân viên
        db.prepare("UPDATE nhan_su SET temp_busy = '[]', updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(unitCode)
      );

      await db.batch(statements);
      // Tự động huấn luyện mô hình AI ngay sau khi chuyển dữ liệu vào lịch sử (nếu không tắt)
      try {
        const aiSetting = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'ai_auto_train_enable'").bind(unitCode).first();
        if (!aiSetting || aiSetting.value !== '0') {
          await trainAIModelOnServer(db, unitCode).catch((err) => console.warn("Lỗi trainAIModelOnServer sau chotSo:", err));
        }
      } catch(e) {
        await trainAIModelOnServer(db, unitCode).catch(() => {});
      }
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã chốt sổ và chuyển ngày mới thành công!" });
    }

    // ============================================================
    // BATCH IMPORT LỊCH SỬ & SỔ THỦ THUẬT
    // ============================================================

    case "importHistoryRecords": {
      const records = args[0] || [];
      if (!Array.isArray(records) || records.length === 0) return success({ count: 0 });
      
      const stmts = [];
      for (const r of records) {
        stmts.push(
          db.prepare(`INSERT INTO lich_su (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(unitCode, r.date || "", r.patient_name || "", r.dob || "", r.room || "", r.procedure_name || "", r.start_time || "", r.end_time || "", r.staff_name || "", r.sub_staff_name || "", r.machine_name || "", r.bed || "")
        );
      }
      
      // Execute in chunks of 50
      for (let i = 0; i < stmts.length; i += 50) {
        await db.batch(stmts.slice(i, i + 50));
      }
      return success({ count: records.length });
    }

    case "deduplicateHistory": {
      const targetDate = args[0] ? String(args[0]).trim() : "";
      let sql = `
        DELETE FROM lich_su 
        WHERE id IN (
          SELECT b.id
          FROM lich_su b
          JOIN lich_su a ON a.unit_code = b.unit_code
            AND a.date = b.date
            AND a.patient_name = b.patient_name
            AND a.dob = b.dob
            AND a.procedure_name = b.procedure_name
            AND a.start_time = b.start_time
            AND a.end_time = b.end_time
            AND a.staff_name = b.staff_name
            AND a.machine_name = b.machine_name
            AND a.bed = b.bed
            AND a.id < b.id
          WHERE b.unit_code = ?
      `;
      const bindings = [unitCode];
      if (targetDate) {
        sql += " AND (b.date = ? OR b.date = ?) ";
        bindings.push(targetDate, targetDate.includes('-') ? targetDate.split('-').reverse().join('/') : targetDate.split('/').reverse().join('-'));
      }
      sql += " )";
      const delRes = await db.prepare(sql).bind(...bindings).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã khử trùng lặp lịch sử thành công!", changes: delRes?.meta?.changes ?? 0 });
    }

    case "getHistoryFullData": {
      const rawDate = String(args[0] || "").trim();
      let y = "", m = "", d = "";
      if (rawDate.includes('/')) {
        const p = rawDate.split('/');
        if (p.length === 3) {
          d = p[0].padStart(2, '0');
          m = p[1].padStart(2, '0');
          y = p[2];
        }
      } else if (rawDate.includes('-')) {
        const p = rawDate.split('-');
        if (p.length === 3) {
          y = p[0];
          m = p[1].padStart(2, '0');
          d = p[2].padStart(2, '0');
        }
      }

      const ymd = (y && m && d) ? `${y}-${m}-${d}` : rawDate;
      const dmy = (y && m && d) ? `${d}/${m}/${y}` : rawDate;
      const dmyNoPad = (y && m && d) ? `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}` : rawDate;
      const dmyPadD = (y && m && d) ? `${d}/${parseInt(m, 10)}/${y}` : rawDate;
      const dmyPadM = (y && m && d) ? `${parseInt(d, 10)}/${m}/${y}` : rawDate;
      const ymdNoPad = (y && m && d) ? `${y}-${parseInt(m, 10)}-${parseInt(d, 10)}` : rawDate;
      const dateVariants = [...new Set([rawDate, ymd, dmy, dmyNoPad, dmyPadD, dmyPadM, ymdNoPad])].filter(Boolean);
      const inPlaceholders = dateVariants.map(() => '?').join(', ');

      // Query lich_su first
      let histRes = { results: [] };
      try {
        histRes = await db.prepare(`SELECT date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_su WHERE unit_code = ? AND date IN (${inPlaceholders}) ORDER BY start_time ASC`).bind(unitCode, ...dateVariants).all();
      } catch (e) {
        console.warn("Error querying lich_su:", e);
      }

      let rows = histRes.results || [];
      // Fallback: If no records in lich_su, check lich_trinh (e.g. today's active schedule)
      if (rows.length === 0) {
        try {
          const fallbackRes = await db.prepare(`SELECT date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ? AND date IN (${inPlaceholders}) ORDER BY start_time ASC`).bind(unitCode, ...dateVariants).all();
          rows = fallbackRes.results || [];
        } catch (e) {
          console.warn("Error querying fallback lich_trinh:", e);
        }
      }

      // 🛡️ Lọc trùng phòng thủ: đảm bảo không bao giờ trả về các ca trùng lặp cùng người, thủ thuật, giờ, phòng, máy, giường
      const seenRowKeys = new Set();
      const dedupedRows = [];
      for (const r of rows) {
        const sig = `${String(r.patient_name).trim().toUpperCase()}|${String(r.dob || '').trim()}|${String(r.procedure_name).trim().toLowerCase()}|${r.start_time}|${r.end_time}|${String(r.staff_name || '').trim()}|${String(r.machine_name || '').trim()}|${String(r.bed || '').trim()}`;
        if (!seenRowKeys.has(sig)) {
          seenRowKeys.add(sig);
          dedupedRows.push(r);
        }
      }
      rows = dedupedRows;

      const schedule = rows.map(r => ({
        ngay: r.date,
        tenBN: r.patient_name,
        namSinh: r.dob || "",
        phong: r.room || "",
        thuThuat: r.procedure_name,
        gioDienRa: r.start_time,
        gioKetThuc: r.end_time,
        nvChinh: r.staff_name || "",
        nvPhu: r.sub_staff_name || "",
        may: r.machine_name || "",
        giuong: r.bed || ""
      }));

      // Aggregate unique benh_nhan with dsThuThuat list
      const patMap = {};
      rows.forEach(r => {
        const key = `${String(r.patient_name).trim().toUpperCase()}|${String(r.dob || '').trim()}`;
        if (!patMap[key]) {
          patMap[key] = { tenBN: r.patient_name, namSinh: r.dob || "", phong: r.room || "", soLuongCa: 0, dsThuThuat: [] };
        }
        patMap[key].soLuongCa++;
        const tt = String(r.procedure_name || '').trim();
        if (tt && !patMap[key].dsThuThuat.includes(tt)) patMap[key].dsThuThuat.push(tt);
      });
      const benh_nhan = Object.values(patMap);

      // Safe query for gio_ban_chung_cu (Cả nhân sự và bệnh nhân)
      let chungBusyRows = [];
      try {
        const chungRes = await db.prepare(`SELECT date, target_type, name, dob, busy_ranges FROM gio_ban_chung_cu WHERE unit_code = ? AND date IN (${inPlaceholders})`).bind(unitCode, ...dateVariants).all();
        chungBusyRows = chungRes.results || [];
      } catch (e) {
        // gio_ban_chung_cu optional
      }

      // Fallback thông minh 1: nếu gio_ban_chung_cu chưa có dữ liệu ngày này, thử lấy từ bảng cũ gio_ban_cu
      if (chungBusyRows.length === 0) {
        try {
          const oldRes = await db.prepare(`SELECT date, staff_name, busy_ranges FROM gio_ban_cu WHERE unit_code = ? AND date IN (${inPlaceholders}) AND staff_name != 'ID' AND busy_ranges != 'ID'`).bind(unitCode, ...dateVariants).all();
          if (oldRes.results && oldRes.results.length > 0) {
            chungBusyRows = oldRes.results.map(r => {
              const isStaff = r.staff_name.startsWith('BS') || r.staff_name.startsWith('Bs') || r.staff_name.startsWith('KTV');
              return {
                date: r.date,
                target_type: isStaff ? 'nhan_su' : 'benh_nhan',
                name: r.staff_name,
                dob: '',
                busy_ranges: r.busy_ranges
              };
            });
          }
        } catch(e) {}
      }

      // Safe parse slots và phân bổ vào staffBusy / patBusyList / leavePatList
      const staffBusy = [];
      const patBusyList = [];
      const leavePatList = [];

      chungBusyRows.forEach(b => {
        const str = String(b.busy_ranges || '').trim();
        if (!str || str === 'ID' || str === '[]' || str === '[""]') return;

        if (b.target_type === 'ra_vien') {
          leavePatList.push({ tenBN: b.name, namSinh: b.dob || "", gioRa: str });
          return;
        }

        let slots = [];
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            slots = parsed.map(s => {
              const parts = String(s).split('-');
              return parts.length === 2 ? { from: parts[0].trim(), to: parts[1].trim(), tt: 'Báo bận' } : null;
            }).filter(Boolean);
          }
        } catch(e) {}
        if (slots.length === 0) {
          slots = str.split(',').map(s => {
            const parts = s.split('-');
            return parts.length === 2 ? { from: parts[0].trim(), to: parts[1].trim(), tt: 'Báo bận' } : null;
          }).filter(Boolean);
        }
        if (slots.length > 0) {
          if (b.target_type === 'nhan_su') {
            staffBusy.push({ ten: b.name, slots: slots });
          } else {
            patBusyList.push({ tenBN: b.name, namSinh: b.dob || "", slots: slots });
          }
        }
      });

      return success({
        schedule: schedule,
        patients: benh_nhan,
        benh_nhan: benh_nhan,
        staffBusy: staffBusy,
        patBusy: patBusyList,
        leavePat: leavePatList
      });
    }

    case "getScheduleData": {
      const targetDate = args[0];
      let ymd = targetDate || "";
      let dmy = targetDate || "";
      if (ymd.includes('/')) {
        const p = ymd.split('/');
        ymd = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
      } else if (ymd.includes('-')) {
        const p = ymd.split('-');
        dmy = `${p[2]}/${p[1]}/${p[0]}`;
      }

      // Check current schedule table first
      let res = await db.prepare("SELECT date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ? AND (date = ? OR date = ?) ORDER BY start_time ASC").bind(unitCode, ymd, dmy).all();
      
      // If not in current schedule, fallback to lich_su
      if (!res.results || res.results.length === 0) {
        res = await db.prepare("SELECT date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_su WHERE unit_code = ? AND (date = ? OR date = ?) ORDER BY start_time ASC").bind(unitCode, ymd, dmy).all();
      }

      const rows = (res.results || []).map(r => ({
        ngay: r.date,
        tenBN: r.patient_name,
        namSinh: r.dob || "",
        phong: r.room || "",
        thuThuat: r.procedure_name,
        gioDienRa: r.start_time,
        gioKetThuc: r.end_time,
        nvChinh: r.staff_name || "",
        nvPhu: r.sub_staff_name || "",
        may: r.machine_name || "",
        giuong: r.bed || ""
      }));
      return success(rows);
    }

    case "getSatData": {
      const staffRes = await db.prepare("SELECT * FROM nhan_su WHERE unit_code = ? AND name NOT GLOB '[0-9]*' ORDER BY priority ASC, id ASC").bind(unitCode).all().catch(() => db.prepare("SELECT * FROM nhan_su WHERE unit_code = ? ORDER BY id ASC").bind(unitCode).all());
      const patRes = await db.prepare("SELECT id, name, age, arrive_time, room, thu_thuat, leave_time FROM benh_nhan WHERE unit_code = ? AND is_saturday = 0 AND (leave_time IS NULL OR TRIM(leave_time) = '' OR LOWER(leave_time) = 'none')").bind(unitCode).all();
      
      const nhan_su = (staffRes.results || []).map((r, idx) => ({
        id: r.id || (idx + 1),
        ten: r.name,
        name: r.name,
        vaiTro: r.role || "KTV",
        role: r.role || "KTV",
        quyen: r.system || "Cả hai",
        system: r.system || "Cả hai",
        kyNang: r.skills || "",
        skills: r.skills || "",
        trangThai: r.trang_thai || "Đi làm",
        thoiGianLam: r.thoi_gian_lam || "07:30-11:30, 13:00-16:30",
        tenHis: r.his_name || ""
      }));
      const benh_nhan = (patRes.results || []).map(r => {
        let procs = [];
        try { procs = JSON.parse(r.thu_thuat || "[]").map(x => (typeof x === "object" ? x.name : x)); } catch(e) {}
        return {
          id: String(r.id),
          ten: r.name,
          namSinh: String(r.age || ""),
          gioVao: r.arrive_time || "",
          gioRa: r.leave_time || "",
          phong: r.room || "",
          thuThuat: procs.join(","),
          loaiBn: "Thường"
        };
      });
      return success({ staff: nhan_su, patients: benh_nhan, nhan_su, benh_nhan });
    }

    case "getTimRanhData": {
      const res = await db.prepare("SELECT procedure_name, start_time, end_time, staff_name, machine_name FROM tim_ranh WHERE unit_code = ? ORDER BY rowid ASC").bind(unitCode).all();
      if (res.results && res.results.length > 0) {
        return success(res.results.map(r => ({
          thuThuat: r.procedure_name,
          gioDienRa: r.start_time,
          gioKetThuc: r.end_time,
          nvChinh: r.staff_name,
          may: r.machine_name
        })));
      }
      // Fallback to schedule
      const sched = await db.prepare("SELECT procedure_name, start_time, end_time, staff_name, machine_name FROM lich_trinh WHERE unit_code = ? ORDER BY start_time ASC").bind(unitCode).all();
      return success((sched.results || []).map(r => ({
        thuThuat: r.procedure_name,
        gioDienRa: r.start_time,
        gioKetThuc: r.end_time,
        nvChinh: r.staff_name,
        may: r.machine_name
      })));
    }

    // ============================================================
    // 8. CẤU HÌNH & CHỮ CHẠY
    // ============================================================

    case "saveAIModel":

    case "saveAILearnedModel": {
      const model = args[0] || {};
      const modelStr = typeof model === "string" ? model : JSON.stringify(model);
      await setCaiDat(db, unitCode, "ai_learned_model", modelStr);
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu mô hình AI vào CSDL đám mây!" });
    }

    case "getAIModel":

    case "getAILearnedModel": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'ai_learned_model'").bind(unitCode).first();
      let model = null;
      if (rec && rec.value) {
        try { model = JSON.parse(rec.value); } catch(e) {}
      }
      return success(model);
    }

    case "trainAI":

    case "calibrateAI":

    case "autoTrainAI": {
      const model = await trainAIModelOnServer(db, unitCode);
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã huấn luyện mô hình AI thành công!", model });
    }

    // ============================================================
    // 📋 BẢNG RIÊNG QUẢN LÝ PHÁC ĐỒ ĐIỀU TRỊ (CLINICAL PROTOCOLS TABLE)
    // ============================================================

    case "saveAITrainingData": {
      const trainingRecords = Array.isArray(args[0]) ? args[0] : (args[0]?.records || []);
      await setCaiDat(db, unitCode, 'ai_training_data', JSON.stringify(trainingRecords));
      return success({ message: "Đã lưu dữ liệu AI Training!" });
    }

    case "clearAITrainingData": {
      await db.prepare("DELETE FROM cai_dat WHERE unit_code = ? AND key = 'ai_training_data'").bind(unitCode).run();
      return success({ message: "Đã xóa dữ liệu AI Training!" });
    }

    case "autoChotSo": {
      const closeRes = await checkAutoChotSo(db, unitCode);
      return success({
        message: closeRes?.closed ? `Đã chốt sổ tự động ngày ${closeRes.date} thành công!` : "Đã kiểm tra chốt sổ tự động.",
        closed: !!closeRes?.closed,
        closedDate: closeRes?.date || null,
        reason: closeRes?.reason || "",
        count: closeRes?.count || 0
      });
    }

    default:
      return null;
  }
}
