// ═══════════════════════════════════════════════════════════════════════════════
// 🩺 ROUTES: NHÂN SỰ & CHẤM CÔNG (STAFF & TIMESHEETS)
// Ràng buộc Rule 2: 100% câu lệnh SQL phải có WHERE unit_code = ?
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleStaffAction(action, ctx) {
  const { db, args, env, request, executionCtx, unitCode, tokenPayload, origin, helpers } = ctx;
  const {
    success, error, jsonResponse, parseStringOrJsonArray,
    bumpDataVersion, makeBumpDataVersionStmt, setCaiDat, normalizeMonthKeys
  } = helpers;

  switch (action) {
    case "getNhanSu": {
      try {
        await db.prepare("DELETE FROM nhan_su WHERE unit_code = ? AND (name GLOB '[0-9]*' OR name = '' OR name IS NULL)").bind(unitCode).run();
      } catch(e) {}

      const res = await db.prepare("SELECT * FROM nhan_su WHERE unit_code = ? AND name NOT GLOB '[0-9]*' ORDER BY priority ASC, id ASC").bind(unitCode).all();
      const list = (res.results || []).map((s, idx) => {
        const skillsArr = parseStringOrJsonArray(s.skills);
        const tempBusyArr = parseStringOrJsonArray(s.temp_busy);
        const kyNangStr = skillsArr.join(", ");
        const gioBanStr = tempBusyArr.join(", ");

        return {
          id: s.id || (idx + 1),
          ten: s.name,
          name: s.name,
          vaiTro: s.role || "Kỹ thuật viên",
          role: s.role || "Kỹ thuật viên",
          trangThai: s.trang_thai || "Đi làm",
          thoiGianLam: s.thoi_gian_lam || "07:30-11:30, 13:00-16:30",
          kyNang: kyNangStr,
          gioBan: gioBanStr,
          nguoiThayThe: s.nguoi_thay_the || "Không",
          quyen: s.system || "Cả hai",
          he: s.system || "Cả hai",
          system: s.system || "Cả hai",
          tenHis: s.his_name || "",
          priority: s.priority || 0
        };
      });
      return success(list);
    }


    case "addNhanSu": {
      let s = (typeof args[0] === "object" && args[0] !== null) ? args[0] : {
        ten: args[0],
        vaiTro: args[1],
        trangThai: args[2],
        thoiGianLam: args[3],
        kyNang: args[4],
        gioBan: args[5],
        nguoiThayThe: args[6],
        quyen: args[7],
        tenHis: args[8]
      };

      const sName = sanitizeInputText(String(s.ten || s.name || "").trim());
      if (!sName || /^\d+$/.test(sName)) return error("Tên nhân sự không hợp lệ");
      const sRole = String(s.vaiTro || s.role || "Kỹ thuật viên").trim();
      const sTrangThai = String(s.trangThai || s.trang_thai || "Đi làm").trim();
      const sThoiGianLam = String(s.thoiGianLam || s.thoi_gian_lam || "07:30-11:30, 13:00-16:30").trim();
      const sNguoiThayThe = String(s.nguoiThayThe || s.nguoi_thay_the || "Không").trim();
      const sSystem = String(s.quyen || s.system || "Cả hai").trim();
      const skillsArr = parseStringOrJsonArray(s.kyNang !== undefined ? s.kyNang : s.skills);
      const tempBusyArr = parseStringOrJsonArray(s.gioBan !== undefined ? s.gioBan : s.temp_busy);
      const sSkills = JSON.stringify(skillsArr);
      const sTempBusy = JSON.stringify(tempBusyArr);

      const stmtAdd = db.prepare(
        "INSERT INTO nhan_su (unit_code, name, role, system, skills, temp_busy, his_name, trang_thai, thoi_gian_lam, nguoi_thay_the, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, name) DO UPDATE SET role = excluded.role, system = excluded.system, skills = excluded.skills, temp_busy = excluded.temp_busy, his_name = excluded.his_name, trang_thai = excluded.trang_thai, thoi_gian_lam = excluded.thoi_gian_lam, nguoi_thay_the = excluded.nguoi_thay_the, updated_at = CURRENT_TIMESTAMP"
      ).bind(unitCode, sName, sRole, sSystem, sSkills, sTempBusy, String(s.tenHis || ""), sTrangThai, sThoiGianLam, sNguoiThayThe);
      await db.batch([stmtAdd, makeBumpDataVersionStmt(db, unitCode)]);
      return success(true);
    }


    case "editNhanSu": {
      let s;
      if (typeof args[0] === "object" && args[0] !== null) {
        s = args[0];
      } else if (typeof args[0] === "number" || /^\d+$/.test(String(args[0]))) {
        s = {
          ten: args[1],
          vaiTro: args[2],
          trangThai: args[3],
          thoiGianLam: args[4],
          kyNang: args[5],
          gioBan: args[6],
          nguoiThayThe: args[7],
          quyen: args[8],
          tenHis: args[9]
        };
      } else {
        s = {
          ten: args[0],
          vaiTro: args[1],
          trangThai: args[2],
          thoiGianLam: args[3],
          kyNang: args[4],
          gioBan: args[5],
          nguoiThayThe: args[6],
          quyen: args[7],
          tenHis: args[8]
        };
      }

      const sName = sanitizeInputText(String(s.ten || s.name || "").trim());
      if (!sName || /^\d+$/.test(sName)) return error("Tên nhân sự không hợp lệ");
      const sRole = String(s.vaiTro || s.role || "Kỹ thuật viên").trim();
      const sTrangThai = String(s.trangThai || s.trang_thai || "Đi làm").trim();
      const sThoiGianLam = String(s.thoiGianLam || s.thoi_gian_lam || "07:30-11:30, 13:00-16:30").trim();
      const sNguoiThayThe = String(s.nguoiThayThe || s.nguoi_thay_the || "Không").trim();
      const sSystem = String(s.quyen || s.system || "Cả hai").trim();
      const skillsArr = parseStringOrJsonArray(s.kyNang !== undefined ? s.kyNang : s.skills);
      const tempBusyArr = parseStringOrJsonArray(s.gioBan !== undefined ? s.gioBan : s.temp_busy);
      const sSkills = JSON.stringify(skillsArr);
      const sTempBusy = JSON.stringify(tempBusyArr);

      const stmtEdit = db.prepare(
        "INSERT INTO nhan_su (unit_code, name, role, system, skills, temp_busy, his_name, trang_thai, thoi_gian_lam, nguoi_thay_the, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, name) DO UPDATE SET role = excluded.role, system = excluded.system, skills = excluded.skills, temp_busy = excluded.temp_busy, his_name = excluded.his_name, trang_thai = excluded.trang_thai, thoi_gian_lam = excluded.thoi_gian_lam, nguoi_thay_the = excluded.nguoi_thay_the, updated_at = CURRENT_TIMESTAMP"
      ).bind(unitCode, sName, sRole, sSystem, sSkills, sTempBusy, String(s.tenHis || ""), sTrangThai, sThoiGianLam, sNguoiThayThe);
      await db.batch([stmtEdit, makeBumpDataVersionStmt(db, unitCode)]);
      return success(true);
    }


    case "deleteNhanSu": {
      const name = typeof args[1] === "string" ? args[1] : (typeof args[0] === "string" ? args[0] : null);
      if (name && !/^\d+$/.test(name)) {
        await db.prepare("DELETE FROM nhan_su WHERE unit_code = ? AND name = ?").bind(unitCode, name).run();
      } else {
        const idx = typeof args[0] === "number" ? args[0] : parseInt(args[0]);
        if (!isNaN(idx)) {
          const allStaff = await db.prepare("SELECT id FROM nhan_su WHERE unit_code = ? AND name NOT GLOB '[0-9]*' ORDER BY priority ASC, id ASC").bind(unitCode).all();
          if (allStaff.results && allStaff.results[idx]) {
            await db.prepare("DELETE FROM nhan_su WHERE unit_code = ? AND id = ?").bind(unitCode, allStaff.results[idx].id).run();
          }
        }
      }
      await bumpDataVersion(db, unitCode);
      return success(true);
    }

    // ============================================================
    // 6. CRUD BỆNH NHÂN
    // ============================================================

    case "importHistoryBusy": {
      const busyList = args[0] || [];
      if (!Array.isArray(busyList) || busyList.length === 0) return success({ count: 0 });

      const stmts = [];
      for (const b of busyList) {
        const bName = b.name || "";
        const isStaff = b.target_type === 'nhan_su' || bName.startsWith('BS') || bName.startsWith('Bs') || bName.startsWith('KTV');
        stmts.push(
          db.prepare(`INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) VALUES (?, ?, ?, ?, ?, ?)`)
            .bind(unitCode, b.date || "", isStaff ? 'nhan_su' : 'benh_nhan', bName, b.dob || "", typeof b.busy_ranges === 'string' ? b.busy_ranges : JSON.stringify(b.busy_ranges || ""))
        );
      }
      for (let i = 0; i < stmts.length; i += 50) {
        await db.batch(stmts.slice(i, i + 50));
      }
      return success({ count: busyList.length });
    }


    case "getGioBanChungCu": {
      const filterDate = String(args[0] || "").trim();
      const filterType = String(args[1] || "").trim(); // 'nhan_su', 'benh_nhan', 'all'
      const keyword = String(args[2] || "").trim();
      
      let sql = "SELECT id, unit_code, date, target_type, name, dob, busy_ranges, created_at FROM gio_ban_chung_cu WHERE unit_code = ?";
      const params = [unitCode];
      
      if (filterDate && filterDate !== 'all') {
        sql += " AND date = ?";
        params.push(filterDate);
      }
      if (filterType && filterType !== 'all') {
        sql += " AND target_type = ?";
        params.push(filterType);
      }
      if (keyword) {
        sql += " AND (name LIKE ? OR busy_ranges LIKE ?)";
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      sql += " ORDER BY date DESC, id DESC LIMIT 1000";
      
      let records = [];
      try {
        const res = await db.prepare(sql).bind(...params).all();
        records = res.results || [];
      } catch (err) {
        console.error("Error querying gio_ban_chung_cu:", err);
      }
      
      // Lấy danh sách các ngày duy nhất để tiện chọn lọc trong dropdown
      let dates = [];
      if ((!filterDate || filterDate === 'all') && (!filterType || filterType === 'all') && !keyword && records.length < 1000) {
        dates = Array.from(new Set(records.map(r => r.date).filter(Boolean)));
      } else {
        try {
          const dRes = await db.prepare("SELECT DISTINCT date FROM gio_ban_chung_cu WHERE unit_code = ? ORDER BY date DESC").bind(unitCode).all();
          dates = (dRes.results || []).map(r => r.date).filter(Boolean);
        } catch (err) {}
      }
      
      return success({
        records: records,
        dates: dates,
        total: records.length
      });
    }


    case "deleteGioBanChungCu": {
      const id = args[0];
      if (!id) return error("Thiếu ID bản ghi cần xóa");
      await db.prepare("DELETE FROM gio_ban_chung_cu WHERE id = ? AND unit_code = ?").bind(id, unitCode).run();
      return success({ deletedId: id });
    }


    case "deleteGioBanCuByDate": {
      const delDate = String(args[0] || '').trim();
      if (!delDate) return error("Thiếu date cần xóa");
      const delRes = await db.prepare("DELETE FROM gio_ban_cu WHERE unit_code = ? AND date = ?").bind(unitCode, delDate).run();
      return success({ deletedDate: delDate, changes: delRes?.meta?.changes ?? '?' });
    }


    case "getEmployees": {
      const isDefault = (unitCode === "bvtks-cs2" || unitCode === "bvtks_cs2");
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'chamcong_employees'").bind(unitCode).first();
      if (rec && rec.value) {
        try {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list)) {
            const cleanList = list.map(x => (typeof x === 'object' && x !== null ? (x.ten || x.name || x.his_name) : x))
                                  .filter(n => n && !/^(phụ|phu)\s*\d+/i.test(String(n).trim()) && !/^(ktv\s*)?phụ trách/i.test(String(n).trim()));
            if (cleanList.length > 0) {
              if (isDefault) {
                const std13 = [
                  "Hoàng Đức Đạt", "Lê Thị Thu Hoa", "Nguyễn Thị Duyên Thảo", "Nguyễn Thu Hằng",
                  "Đặng Phong Thái", "Phạm Thạch Khuyến", "Nguyễn Thị Xuân Lương", "Nguyễn Thị Hà",
                  "Phan Thị Thu Hiền", "Lê Thị Thu Hiền", "Nguyễn Văn Khính", "Phạm Thị Thuyến", "Trần Thị Duyên"
                ];
                std13.forEach(s => { if (!cleanList.includes(s)) cleanList.push(s); });
              }
              return success(cleanList);
            }
          }
        } catch(e) {}
      }
      // Đối với đơn vị bvtks-cs2 mặc định thì cung cấp danh sách 13 nhân sự chuẩn đầy đủ
      if (isDefault) {
        return success([
          "Hoàng Đức Đạt", "Lê Thị Thu Hoa", "Nguyễn Thị Duyên Thảo", "Nguyễn Thu Hằng",
          "Đặng Phong Thái", "Phạm Thạch Khuyến", "Nguyễn Thị Xuân Lương", "Nguyễn Thị Hà",
          "Phan Thị Thu Hiền", "Lê Thị Thu Hiền", "Nguyễn Văn Khính", "Phạm Thị Thuyến", "Trần Thị Duyên"
        ]);
      }
      // Các đơn vị khác mới tạo sẽ khởi đầu với danh sách rỗng để tự nhập
      return success([]);
    }


    case "saveEmployees": {
      let list = args[0] || [];
      if (typeof list === "object" && list !== null && !Array.isArray(list)) {
        list = list.employees || list.list || [];
      }
      if (Array.isArray(list)) {
        list = list.map(x => (typeof x === 'object' && x !== null ? (x.ten || x.name || x.his_name) : x))
                   .filter(n => n && !/^(phụ|phu)\s*\d+/i.test(String(n).trim()) && !/^(ktv\s*)?phụ trách/i.test(String(n).trim()));
      }
      await setCaiDat(db, unitCode, 'chamcong_employees', JSON.stringify(list));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu danh sách nhân sự chấm công thành công!" });
    }


    case "getChamCongSymbols": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'chamcong_symbols'").bind(unitCode).first();
      if (rec && rec.value) {
        try {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list) && list.length > 0) {
            const normalized = list.map(item => ({
              ...item,
              aliases: Array.isArray(item.aliases) ? item.aliases.join(', ') : (item.aliases || '')
            }));
            return success(normalized);
          }
        } catch(e) {}
      }
      const defaultSymbols = [
        { code: "X", label: "Cả ngày", value: 1.0, bg: "#ffffff", border: "#cbd5e1", color: "#1e293b", aliases: "CA-NGAY, 1" },
        { code: "X/2", label: "Nửa ngày", value: 0.5, bg: "#ccfbf1", border: "#99f6e4", color: "#0f766e", aliases: "1/2, 0.5" },
        { code: "S / C", label: "Sáng / Chiều", value: 0.5, bg: "#d1fae5", border: "#a7f3d0", color: "#047857", aliases: "S, C, SANG, CHIEU" },
        { code: "Lễ", label: "Nghỉ lễ", value: 0.0, bg: "#fee2e2", border: "#fca5a5", color: "#b91c1c", aliases: "LE" },
        { code: "Tết", label: "Nghỉ Tết", value: 0.0, bg: "#fee2e2", border: "#fca5a5", color: "#b91c1c", aliases: "TET" },
        { code: "Nội", label: "Trực / học nội trú", value: 0.0, bg: "#dbeafe", border: "#93c5fd", color: "#1d4ed8", aliases: "NOI" },
        { code: "Ô", label: "Nghỉ ốm", value: 0.0, bg: "#ffedd5", border: "#fed7aa", color: "#c2410c", aliases: "O" },
        { code: "H", label: "Học / Hội chẩn", value: 0.0, bg: "#fef3c7", border: "#fde68a", color: "#b45309", aliases: "" },
        { code: "F", label: "Nghỉ phép", value: 0.0, bg: "#fef3c7", border: "#fde68a", color: "#b45309", aliases: "" },
        { code: "B", label: "Nghỉ bù", value: 0.0, bg: "#fef3c7", border: "#fde68a", color: "#b45309", aliases: "" },
        { code: "TS", label: "Thai sản", value: 0.0, bg: "#f3e8ff", border: "#d8b4fe", color: "#6d28d9", aliases: "" },
        { code: "ĐK / DK", label: "Khám ngoại viện / Dã ngoại", value: 0.0, bg: "#f3e8ff", border: "#d8b4fe", color: "#6d28d9", aliases: "DK, ĐK" },
        { code: "K / V", label: "Nghỉ việc riêng / Không lương", value: 0.0, bg: "#f1f5f9", border: "#cbd5e1", color: "#64748b", aliases: "K, V, VANG" }
      ];
      return success(defaultSymbols);
    }


    case "saveChamCongSymbols": {
      const symbols = (args[0] || []).map(item => ({
        ...item,
        aliases: Array.isArray(item.aliases) ? item.aliases.join(', ') : (item.aliases || '')
      }));
      await setCaiDat(db, unitCode, 'chamcong_symbols', JSON.stringify(symbols));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu danh sách ký hiệu chấm công thành công!" });
    }



    case "getChamCong": {
      const myRaw = String(args[0] || "").trim();
      const myVariants = [];
      if (myRaw) {
        myVariants.push(myRaw);
        myVariants.push(myRaw.replace('-', '_'));
        myVariants.push(myRaw.replace('_', '-'));
        if (myRaw.includes('-')) {
          const p = myRaw.split('-');
          myVariants.push(p[1] + '_' + p[0]);
          myVariants.push(p[1] + '-' + p[0]);
        } else if (myRaw.includes('_')) {
          const p = myRaw.split('_');
          myVariants.push(p[1] + '_' + p[0]);
          myVariants.push(p[1] + '-' + p[0]);
        }
      }
      const uniqueVariants = [...new Set(myVariants)].filter(Boolean);

      if (uniqueVariants.length > 0) {
        const uUnits = (unitCode === "bvtks-cs2" || unitCode === "bvtks_cs2") ? ["bvtks-cs2", "bvtks_cs2"] : [unitCode];
        const uPlaceholders = uUnits.map(() => '?').join(',');

        // 1. Single SQL query on cham_cong with IN (...)
        try {
          const placeholders = uniqueVariants.map(() => '?').join(',');
          const res = await db.prepare(`SELECT month_year, data_json FROM cham_cong WHERE unit_code IN (${uPlaceholders}) AND month_year IN (${placeholders})`).bind(...uUnits, ...uniqueVariants).all();
          if (res && res.results && res.results.length > 0) {
            for (const v of uniqueVariants) {
              const row = res.results.find(r => r.month_year === v);
              if (row && row.data_json) {
                const parsed = JSON.parse(row.data_json);
                if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                  return success(parsed);
                }
              }
            }
          }
        } catch(e) {}

        // 2. Single fallback query on cai_dat with IN (...)
        try {
          const cdKeys = uniqueVariants.map(v => "chamcong_" + v);
          const placeholdersCd = cdKeys.map(() => '?').join(',');
          const resCd = await db.prepare(`SELECT key, value FROM cai_dat WHERE unit_code IN (${uPlaceholders}) AND key IN (${placeholdersCd})`).bind(...uUnits, ...cdKeys).all();
          if (resCd && resCd.results && resCd.results.length > 0) {
            for (const k of cdKeys) {
              const row = resCd.results.find(r => r.key === k);
              if (row && row.value) {
                const parsed = JSON.parse(row.value);
                if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                  return success(parsed);
                }
              }
            }
          }
        } catch(e) {}
      } else {
        // No specific month: query latest
        try {
          const latest = await db.prepare("SELECT data_json FROM cham_cong WHERE unit_code = ? ORDER BY updated_at DESC LIMIT 1").bind(unitCode).first();
          if (latest && latest.data_json) {
            return success(JSON.parse(latest.data_json));
          }
        } catch(e) {}
      }

      return success({});
    }


    case "saveChamCong": {
      let my = "";
      let data = {};
      if (typeof args[0] === "string") {
        my = args[0].trim();
        data = args[1] || {};
      } else if (typeof args[0] === "object") {
        my = String(args[0].month_year || args[0].my || "").trim();
        data = args[0].data || args[0].data_json || {};
        if (typeof data === "string") { try { data = JSON.parse(data); } catch(e) {} }
      }
      // Khử triệt để các key Phụ 1..8 trước khi ghi vào CSDL
      if (typeof data === "object" && data !== null) {
        Object.keys(data).forEach(k => {
          if (/^(phụ|phu)\s*\d+/i.test(String(k).trim()) || /^(ktv\s*)?phụ trách/i.test(String(k).trim())) {
            delete data[k];
          }
        });
      }
      // Chuẩn hoá month_year về duy nhất định dạng chuẩn YYYY-MM (VD: 2026-08)
      let myStandard = my || new Date().toISOString().substring(0, 7);
      const cleanS = myStandard.replace('/', '-').replace('_', '-');
      const parts = cleanS.split('-');
      if (parts.length === 2) {
        if (parts[0].length === 4) {
          myStandard = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        } else if (parts[1].length === 4) {
          myStandard = `${parts[1]}-${parts[0].padStart(2, '0')}`;
        }
      }

      // BẢO VỆ DỮ LIỆU CHẤM CÔNG (Server-side Safe Merge):
      // Đọc bản ghi hiện có từ CSDL để hợp nhất an toàn, không để tình trạng một client gửi thiếu làm xóa mất ngày của các nhân sự khác
      const replaceWhole = (args[2] === true) || (data && data._replaceWhole === true);
      if (!replaceWhole) {
        try {
          const uUnits = (unitCode === "bvtks-cs2" || unitCode === "bvtks_cs2") ? ["bvtks-cs2", "bvtks_cs2"] : [unitCode];
          const uPlaceholders = uUnits.map(() => '?').join(',');
          const existingRow = await db.prepare(`SELECT data_json FROM cham_cong WHERE unit_code IN (${uPlaceholders}) AND month_year = ? ORDER BY updated_at DESC LIMIT 1`).bind(...uUnits, myStandard).first();
          if (existingRow && existingRow.data_json) {
            const parsedExisting = JSON.parse(existingRow.data_json);
            if (parsedExisting && typeof parsedExisting === 'object') {
              const merged = { ...parsedExisting };
              for (const emp in data) {
                if (data[emp] === null || (typeof data[emp] === 'object' && data[emp]._delete === true)) {
                  delete merged[emp];
                  continue;
                }
                if (!merged[emp]) merged[emp] = {};
                if (data[emp].heSo !== undefined) merged[emp].heSo = data[emp].heSo;
                for (const d in data[emp]) {
                  if (d === 'heSo') continue;
                  const v = data[emp][d];
                  if (v !== undefined && v !== null && v !== '') {
                    merged[emp][d] = v;
                  } else if (v === '') {
                    delete merged[emp][d];
                  }
                }
              }
              data = merged;
            }
          }
        } catch(eMerge) {
          console.warn("saveChamCong merge fallback:", eMerge);
        }
      } else {
        if (data && data._replaceWhole) delete data._replaceWhole;
      }

      const jsonStr = typeof data === "string" ? data : JSON.stringify(data);

      const stmtChamCong = db.prepare(`
        INSERT INTO cham_cong (unit_code, month_year, data_json, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(unit_code, month_year) DO UPDATE SET
          data_json = excluded.data_json,
          updated_at = CURRENT_TIMESTAMP
      `).bind(unitCode, myStandard, jsonStr);

      await db.batch([stmtChamCong, makeBumpDataVersionStmt(db, unitCode)]);
      return success({ message: "Đã lưu bảng chấm công thành công!" });
    }


    default:
      return null;
  }
}
