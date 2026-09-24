// ═══════════════════════════════════════════════════════════════════════════════
// 💾 ROUTES: SAO LƯU, ĐỒNG BỘ, CẤU HÌNH HỆ THỐNG & GOOGLE DRIVE
// Ràng buộc Rule 2: 100% câu lệnh SQL phải có WHERE unit_code = ?
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleBackupSyncAction(action, ctx) {
  const { db, args, env, request, executionCtx, unitCode, tokenPayload, origin, helpers } = ctx;
  const {
    success, error, jsonResponse, parseStringOrJsonArray,
    bumpDataVersion, makeBumpDataVersionStmt, setCaiDat,
    ensureSchema
  } = helpers;
  const sanitizeInputText = helpers?.sanitizeInputText || ((str) => (typeof str === "string" ? str.replace(/<[^>]*>/g, "") : str));
  const healBackendPatientName = helpers?.healBackendPatientName || ((str) => String(str || "").trim());
  const checkAutoChotSo = helpers?.checkAutoChotSo || (async () => {});

  switch (action) {
    case "exportTenantData": {
      const uCode = String(args[0] || unitCode || "").trim().toLowerCase();
      if (!uCode) return error("Thiếu mã đơn vị cần xuất dữ liệu!", 400);
      if (tokenPayload && tokenPayload.role !== "SUPER_ADMIN" && uCode !== tokenPayload.unit_code) {
        return error("Bạn không có quyền xuất dữ liệu của đơn vị khác!", 403);
      }

      const tables = [
        'tenants', 'cai_dat', 'tai_khoan', 'nhan_su', 'may_moc', 'phong',
        'thu_thuat', 'benh_nhan', 'lich_trinh', 'lich_su', 'gio_ban_cu', 'gio_ban_chung_cu',
        'cham_cong', 'thong_ke', 'tim_ranh', 'tai_lieu', 'phac_do'
      ];

      const queries = tables.map(t => db.prepare(`SELECT * FROM ${t} WHERE unit_code = ?`).bind(uCode));
      const results = await db.batch(queries);

      const exportPackage = {
        app: "PM-XepLich T.I.M.E.S SaaS",
        version: "4.0.4",
        unit_code: uCode,
        exported_at: new Date().toISOString(),
        tables: {}
      };

      tables.forEach((tableName, idx) => {
        const rows = results[idx]?.results || [];
        exportPackage.tables[tableName] = rows;
      });

      const tenantRow = exportPackage.tables.tenants?.[0];
      exportPackage.unit_name = tenantRow?.unit_name || uCode;
      exportPackage.plan_tier = tenantRow?.plan_tier || 'PRO';

      return success(exportPackage);
    }

    case "exportAllDatabaseForSuperAdmin":

    case "exportAllDatabase": {
      // Dành riêng cho Super Admin: Xuất toàn bộ CSDL của tất cả các đơn vị
      const tables = [
        'tenants', 'cai_dat', 'tai_khoan', 'nhan_su', 'may_moc', 'phong',
        'thu_thuat', 'benh_nhan', 'lich_trinh', 'lich_su', 'gio_ban_cu', 'gio_ban_chung_cu',
        'cham_cong', 'thong_ke', 'tim_ranh', 'tai_lieu', 'phac_do'
      ];

      const queries = tables.map(t => db.prepare(`SELECT * FROM ${t}`));
      let results = [];
      try {
        results = await db.batch(queries);
      } catch (batchErr) {
        results = [];
        for (const t of tables) {
          try {
            const r = await db.prepare(`SELECT * FROM ${t}`).all();
            results.push(r);
          } catch(e) {
            results.push({ results: [] });
          }
        }
      }

      const dbPayload = {
        app: "PM-XepLich T.I.M.E.S SaaS - All Tenants Master Export",
        version: "4.0.4",
        exported_at: new Date().toISOString(),
        tenants: results[0]?.results || [],
        cai_dat: results[1]?.results || [],
        tai_khoan: results[2]?.results || [],
        nhan_su: results[3]?.results || [],
        may_moc: results[4]?.results || [],
        phong: results[5]?.results || [],
        thu_thuat: results[6]?.results || [],
        benh_nhan: results[7]?.results || [],
        lich_trinh: results[8]?.results || [],
        lich_su: results[9]?.results || [],
        gio_ban_cu: results[10]?.results || [],
        gio_ban_chung_cu: results[11]?.results || [],
        cham_cong: results[12]?.results || [],
        thong_ke: results[13]?.results || [],
        tim_ranh: results[14]?.results || [],
        tai_lieu: results[15]?.results || [],
        phac_do: results[16]?.results || []
      };

      return success(dbPayload);
    }

    case "importTenantData": {
      const payload = args[0] || {};
      const targetUnit = String(payload.unit_code || "").trim().toLowerCase();
      const backupData = payload.data || payload;

      if (!targetUnit) return error("Thiếu mã đơn vị cần nạp dữ liệu!", 400);
      if (!backupData || !backupData.tables) return error("Dữ liệu sao lưu không đúng định dạng JSON chuẩn!", 400);

      const tables = [
        'cai_dat', 'tai_khoan', 'nhan_su', 'may_moc', 'phong',
        'thu_thuat', 'benh_nhan', 'lich_trinh', 'lich_su', 'gio_ban_cu', 'gio_ban_chung_cu',
        'cham_cong', 'thong_ke', 'tim_ranh', 'tai_lieu', 'phac_do'
      ];

      const batchStmts = [];
      // Xóa dữ liệu cũ của tenant (trừ bảng tenants)
      tables.forEach(t => {
        batchStmts.push(db.prepare(`DELETE FROM ${t} WHERE unit_code = ?`).bind(targetUnit));
      });

      // Nạp dữ liệu mới
      for (const t of tables) {
        const rows = backupData.tables[t] || [];
        if (Array.isArray(rows) && rows.length > 0) {
          for (const row of rows) {
            const cols = Object.keys(row).filter(k => k !== 'id');
            const placeholders = cols.map(() => '?').join(', ');
            const values = cols.map(c => (c === 'unit_code' ? targetUnit : row[c]));
            const sql = `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${placeholders})`;
            batchStmts.push(db.prepare(sql).bind(...values));
          }
        }
      }

      if (batchStmts.length > 0) {
        await db.batch(batchStmts);
      }

      return success({
        message: `Đã khôi phục thành công toàn bộ dữ liệu cho đơn vị '${targetUnit}'!`,
        unit_code: targetUnit
      });
    }

    case "getBootstrapData": {
      // Tự động kiểm tra chốt sổ khi nạp dữ liệu đầu ngày
      await checkAutoChotSo(db, unitCode);

      // Lấy ngày từ client, hoặc tự tính theo múi giờ Việt Nam (UTC+7)
      const todayArg = String(args[0] || "").trim();
      let todayVN = todayArg;
      if (!todayVN) {
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const yy = nowVN.getUTCFullYear();
        const mm = String(nowVN.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(nowVN.getUTCDate()).padStart(2, "0");
        todayVN = `${yy}-${mm}-${dd}`;
      }
      let ymd = todayVN;
      let dmy = todayVN;
      if (todayVN.includes('/')) {
        const p = todayVN.split('/');
        if (p.length === 3) {
          ymd = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
          dmy = `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`;
        }
      } else if (todayVN.includes('-')) {
        const p = todayVN.split('-');
        if (p.length === 3) {
          ymd = `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
          dmy = `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
        }
      }

      const [settingsRes, staffRes, machinesRes, roomsRes, proceduresRes, patientsRes, scheduleRes, accountsRes, phacDoRes, tenantRes] = await db.batch([
        db.prepare("SELECT key, value FROM cai_dat WHERE unit_code = ?").bind(unitCode),
        db.prepare("SELECT * FROM nhan_su WHERE unit_code = ? ORDER BY priority ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM may_moc WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM phong WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM benh_nhan WHERE unit_code = ? AND is_saturday = 0 ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM lich_trinh WHERE unit_code = ? AND (date = ? OR date = ?) ORDER BY order_idx ASC, start_time ASC").bind(unitCode, ymd, dmy),
        db.prepare("SELECT id, username, role, permissions FROM tai_khoan WHERE unit_code = ?").bind(unitCode),
        db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM tenants WHERE unit_code = ?").bind(unitCode)
      ]);

      const settingsObj = {};
      (settingsRes.results || []).forEach(r => { settingsObj[r.key] = r.value; });

      const may_moc = (machinesRes.results || []).map(m => ({
        id: m.id,
        tenLoai: m.ten_loai,
        maMay: m.ma_may,
        trangThai: m.trang_thai,
        name: m.ma_may,
        ten: m.ma_may
      }));

      const phong = (roomsRes.results || []).map(r => ({
        id: r.id,
        tenPhong: r.ten_phong,
        name: r.ten_phong,
        bacSi: r.bac_si || "",
        ktv: r.ktv || "",
        danhSachMay: r.danh_sach_may || "",
        soGiuong: r.so_giuong || 0,
        danhSachGiuong: r.danh_sach_giuong || ""
      }));

      let links = [];
      if (settingsObj.quick_links) {
        try {
          links = typeof settingsObj.quick_links === 'string' ? JSON.parse(settingsObj.quick_links) : settingsObj.quick_links;
        } catch(e) {}
      }

      let protocolsList = [];
      if (phacDoRes.results && phacDoRes.results.length > 0) {
        protocolsList = phacDoRes.results.map((r, i) => {
          let procsArr = [];
          try {
            procsArr = typeof r.danh_sach_thu_thuat === 'string' ? JSON.parse(r.danh_sach_thu_thuat) : r.danh_sach_thu_thuat;
          } catch(e) {
            procsArr = String(r.danh_sach_thu_thuat || '').split(',').map(s => s.trim()).filter(Boolean);
          }
          return {
            id: String(r.id || (i + 1)),
            name: r.ten_phac_do,
            ten_phac_do: r.ten_phac_do,
            procs: Array.isArray(procsArr) ? procsArr : []
          };
        });
      } else if (settingsObj.clinical_protocols || settingsObj.protocols) {
        try {
          const rawProtocols = settingsObj.clinical_protocols || settingsObj.protocols;
          protocolsList = typeof rawProtocols === 'string' ? JSON.parse(rawProtocols) : rawProtocols;
        } catch(e) {}
      }
      const historyMap = {};
      try {
        const histRes = await db.prepare("SELECT * FROM lich_su_dinh_muc WHERE unit_code = ? ORDER BY tu_ngay ASC, id ASC").bind(unitCode).all().catch(() => ({ results: [] }));
        (histRes.results || []).forEach(h => {
          const key = String(h.ten_thu_thuat || '').trim().toLowerCase();
          if (!historyMap[key]) historyMap[key] = [];
          historyMap[key].push({
            id: h.id,
            tuNgay: h.tu_ngay,
            denNgay: h.den_ngay,
            from: h.tu_ngay,
            to: h.den_ngay,
            thoiGianThucHienMin: h.tg_thuc_hien_min,
            thoiGianThucHienMax: h.tg_thuc_hien_max,
            thoiGianThuThuatMin: h.tg_thu_thuat_min,
            thoiGianThuThuatMax: h.tg_thu_thuat_max,
            khoangCach: h.khoang_cach ?? 0,
            canRutMay: h.can_rut_may || 'Không',
            canNguoiPhu: h.can_nguoi_phu || 'Không',
            dsNguoiPhu: h.ds_nguoi_phu || '',
            vietTat: h.viet_tat || '',
            he: h.he || 'PHCN',
            phanLoai: h.phan_loai || '',
            may: h.may || '',
            lienTuc: h.lien_tuc || 'Không'
          });
        });
      } catch(eHist) {}

      const thu_thuat = (proceduresRes.results || []).map(p => {
        const key = String(p.ten_thu_thuat || '').trim().toLowerCase();
        let listH = historyMap[key] || [];

        if (listH.length === 0 && p.lich_su_dinh_muc) {
          try {
            listH = typeof p.lich_su_dinh_muc === 'string' ? (JSON.parse(p.lich_su_dinh_muc || '[]')) : p.lich_su_dinh_muc;
          } catch(e) { listH = []; }
        }

        return {
          id: p.id,
          ten: p.ten_thu_thuat,
          name: p.ten_thu_thuat,
          vietTat: p.viet_tat,
          he: p.he,
          phanLoai: p.phan_loai,
          may: p.may,
          thoiGianThucHien: p.tg_thuc_hien,
          thoiGianThucHienMin: p.tg_thuc_hien,
          thoiGianThucHienMax: (p.tg_thuc_hien_max && p.tg_thuc_hien_max > 0) ? p.tg_thuc_hien_max : p.tg_thuc_hien,
          thoiGianThuThuat: p.tg_thu_thuat,
          thoiGianThuThuatMin: p.tg_thu_thuat,
          thoiGianThuThuatMax: (p.tg_thu_thuat_max && p.tg_thu_thuat_max > 0) ? p.tg_thu_thuat_max : p.tg_thu_thuat,
          khoangCach: p.khoang_cach,
          canRutMay: (p.can_rut_may === 1 || p.can_rut_may === '1' || p.can_rut_may === 'Có' || p.can_rut_may === true) ? 'Có' : 'Không',
          canNguoiPhu: (p.can_nguoi_phu === 1 || p.can_nguoi_phu === '1' || p.can_nguoi_phu === 'Có' || p.can_nguoi_phu === true) ? 'Có' : 'Không',
          dsNguoiPhu: p.ds_nguoi_phu,
          lienTuc: (p.lien_tuc === 1 || p.lien_tuc === '1' || p.lien_tuc === 'Có' || p.lien_tuc === true) ? 'Có' : ((p.tg_thuc_hien === p.tg_thu_thuat && ((p.tg_thuc_hien_max || p.tg_thuc_hien) === (p.tg_thu_thuat_max || p.tg_thu_thuat)) && p.tg_thuc_hien >= 10) ? 'Có' : 'Không'),
          lichSuDinhMuc: listH,
          history: listH
        };
      });

      // Staff
      const staffList = (staffRes.results || []).map((s, idx) => {
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

      // Patients
      const patientList = (patientsRes.results || []).map((p, idx) => {
        let procsArr = [];
        try {
          const parsed = JSON.parse(p.thu_thuat || "[]");
          if (Array.isArray(parsed)) {
            procsArr = parsed.map(x => (typeof x === "object" ? (x.name || x.ten || "") : String(x))).filter(Boolean);
          } else if (typeof parsed === "string") {
            procsArr = parsed.split(",").map(x => x.trim()).filter(Boolean);
          }
        } catch(e) {
          if (typeof p.thu_thuat === "string") {
            procsArr = p.thu_thuat.split(",").map(x => x.trim()).filter(Boolean);
          }
        }
        const thuThuatStr = procsArr.join(",");

        const patCleanName = healBackendPatientName(p.name);
        return {
          id: String(p.id || (idx + 1)),
          ten: patCleanName,
          name: patCleanName,
          namSinh: String(p.age || ""),
          ngayVao: p.ngay_vao || "",
          gioVao: p.arrive_time === "07:30" ? "" : (p.arrive_time || ""),
          gioBan: p.gio_ban || "",
          gioRa: p.leave_time || "",
          phong: p.room || "",
          thuThuat: thuThuatStr,
          status: p.status,
          loai_bn: p.loai_bn || "NoiTru",
          buoi_dieu_tri: p.buoi_dieu_tri || "TuDong"
        };
      }).filter(p => p.ten && p.ten.trim() !== "");

      // Schedule rows
      let scheduleRows = (scheduleRes.results || []).map(s => ([
        s.date,
        healBackendPatientName(s.patient_name, true),
        s.dob || "",
        s.room || "",
        s.procedure_name,
        s.start_time,
        s.end_time,
        s.staff_name || "",
        s.sub_staff_name || "",
        s.machine_name || "",
        s.bed || ""
      ]));

      let isFinalizedToday = false;
      let finalizedTodayCount = 0;
      // 🛡️ Nếu lich_trinh chưa có dữ liệu ngày hôm nay, kiểm tra xem đã chốt sổ vào lich_su chưa
      // Nếu đã chốt sổ: trả về schedule RỖNG + cờ is_finalized_today=true + số lượng ca
      // → Frontend sẽ hiện thông báo "Đã hoàn tất chốt sổ ngày (X ca)" thay vì bảng lịch trình
      // Điều này giúp nhân viên không nhầm lẫn giữa "lịch đang live" và "lịch đã lưu trữ"
      if (scheduleRows.length === 0) {
        try {
          const histTodayRes = await db.prepare(
            "SELECT COUNT(*) as cnt FROM lich_su WHERE unit_code = ? AND (date = ? OR date = ?)"
          ).bind(unitCode, ymd, dmy).first();
          if (histTodayRes && histTodayRes.cnt > 0) {
            isFinalizedToday = true;
            finalizedTodayCount = Number(histTodayRes.cnt);
            // scheduleRows giữ nguyên RỖNG [] — Frontend tự hiện thông báo "Đã chốt sổ"
          }
        } catch(e) {
          console.warn("Lỗi kiểm tra lich_su hôm nay:", e);
        }

        // 🛡️ Nếu hôm nay chưa có và lịch sử chưa có, nạp bất kỳ lịch nào đang có trong lich_trinh (tránh lệch định dạng ngày)
        if (scheduleRows.length === 0) {
          try {
            const anySchedRes = await db.prepare("SELECT * FROM lich_trinh WHERE unit_code = ? ORDER BY order_idx ASC, start_time ASC").bind(unitCode).all();
            if (anySchedRes && anySchedRes.results && anySchedRes.results.length > 0) {
              scheduleRows = anySchedRes.results.map(s => ([
                s.date,
                healBackendPatientName(s.patient_name, true),
                s.dob || "",
                s.room || "",
                s.procedure_name,
                s.start_time,
                s.end_time,
                s.staff_name || "",
                s.sub_staff_name || "",
                s.machine_name || "",
                s.bed || ""
              ]));
            }
          } catch(eAny) {}
        }
      }

      const tenantInfo = tenantRes?.results?.[0] || { unit_code: unitCode, unit_name: unitCode, plan_tier: "PRO" };
      return success({
        tenant: tenantInfo,
        settings: settingsObj,
        marquee: settingsObj.marquee_text || ("PHẦN MỀM XẾP LỊCH THỦ THUẬT - " + (tenantInfo.unit_name || unitCode).toUpperCase()),
        links: links,
        machines: may_moc,
        may_moc: may_moc,
        rooms: phong,
        phong: phong,
        procedures: thu_thuat,
        thu_thuat: thu_thuat,
        staff: staffList,
        nhan_su: staffList,
        patients: patientList,
        benh_nhan: patientList,
        protocols: protocolsList,
        phac_do: protocolsList,
        schedule: scheduleRows,
        schedules: scheduleRows,
        lich_trinh: scheduleRows,
        is_finalized_today: isFinalizedToday,
        finalized_today_count: finalizedTodayCount,
        accounts: accountsRes.results || [],
        tai_khoan: accountsRes.results || [],
        version: "v3.0.0-cloudflare"
      });
    }

    case "getDataVersion": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'data_version'").bind(unitCode).first();
      const v = rec ? String(rec.value) : "1";
      return success({ version: v });
    }

    case "getMarqueeText":

    case "layThongBaoDongChuChay": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'marquee_text'").bind(unitCode).first();
      return success(rec ? rec.value : ("PHẦN MỀM XẾP LỊCH THỦ THUẬT - " + unitCode.toUpperCase()));
    }

    case "saveMarqueeText":

    case "luuThongBaoDongChuChay": {
      const text = args[0] || "";
      await setCaiDat(db, unitCode, 'marquee_text', String(text));
      await bumpDataVersion(db, unitCode);
      return success(true);
    }

    case "getSystemSettings": {
      const res = await db.prepare("SELECT key, value FROM cai_dat WHERE unit_code = ?").bind(unitCode).all();
      const obj = {};
      (res.results || []).forEach(r => { obj[r.key] = r.value; });
      return success(obj);
    }

    case "saveSystemSettings": {
      let settings = args[0] || {};
      if (typeof settings === "string" && args.length >= 2) {
        settings = { [settings]: args[1] };
      } else if (typeof settings === "string" && args.length === 1) {
        try { settings = JSON.parse(settings); } catch(e) {}
      }
      if (typeof settings === "object" && settings !== null) {
        for (const [k, v] of Object.entries(settings)) {
          await setCaiDat(db, unitCode, String(k), String(v ?? ""));
        }
      }
      await bumpDataVersion(db, unitCode);
      return success(true);
    }

    case "getQuickLinks": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'quick_links'").bind(unitCode).first();
      if (rec && rec.value) {
        try {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list) && list.length > 0) return success(list);
        } catch(e) {}
      }
      const defaultLinks = [
        { icon: "📜", ten: "Tra cứu Văn bản & BHXH", url: "javascript:openDocLookupModal()" },
        { icon: "📖", ten: "Hướng dẫn sử dụng phần mềm", url: "https://xeplichthuthuat.io.vn/hdsd.html" },
        { icon: "📋", ten: "Quy trình Kỹ thuật PHCN", url: "https://kcb.vn/" }
      ];
      return success(defaultLinks);
    }

    case "saveQuickLinks": {
      const links = Array.isArray(args[0]) ? args[0] : (args[0]?.links || []);
      await setCaiDat(db, unitCode, 'quick_links', JSON.stringify(links));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu danh sách liên kết thành công!" });
    }

    // ============================================================
    // 📅 CHẤM CÔNG (CHAM CONG) & NHÂN SỰ CHẤM CÔNG
    // ============================================================

    case "getErrorConfig": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'error_config'").bind(unitCode).first();
      if (rec && rec.value) {
        try { return success(JSON.parse(rec.value)); } catch(e) {}
      }
      return success({ staff: {} });
    }

    case "saveErrorConfig": {
      const config = args[0] || { staff: {} };
      await setCaiDat(db, unitCode, 'error_config', JSON.stringify(config));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu cấu hình thành công!" });
    }

    case "getDocuments": {
      try {
        const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'vb_documents'").bind(unitCode).first();
        if (rec && rec.value) {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list) && list.length > 0) return success(list);
        }
      } catch(e) {}
      const defaultDocs = [
        { id: "qd_4461", number: "4461/QĐ-BYT", title: "Quy trình kỹ thuật khám bệnh, chữa bệnh chuyên ngành Y học cổ truyền", issuer: "Bộ Y tế", signDate: "27/08/2020", link: "https://kcb.vn/van-ban/quyet-dinh-so-4461-qd-byt-ngay-27-8-2020-ve-viec-ban-hanh-tai-lieu-chuyen-mon-huong-dan-quy-trinh-ky-thuat-kham-benh-chua-benh-chuyen-nganh-y-hoc-co-truyen.html" },
        { id: "qd_54", number: "54/QĐ-BYT", title: "Hướng dẫn chẩn đoán và điều trị bệnh chuyên ngành Y học cổ truyền", issuer: "Bộ Y tế", signDate: "12/01/2021", link: "https://kcb.vn/van-ban/quyet-dinh-so-54-qd-byt-ngay-12-01-2021-ve-viec-ban-hanh-tai-lieu-chuyen-mon-huong-dan-chan-doan-va-dieu-tri-benh-theo-y-hoc-co-truyen-ket-hop-y-hoc-hien-dai-tap-1.html" },
        { id: "qd_5024", number: "5024/QĐ-BYT", title: "Quy trình kỹ thuật khám bệnh, chữa bệnh chuyên ngành Phục hồi chức năng", issuer: "Bộ Y tế", signDate: "03/11/2014", link: "https://kcb.vn/van-ban/quyet-dinh-so-5024-qd-byt-ngay-03-11-2014-ve-viec-ban-hanh-tai-lieu-chuyen-mon-huong-dan-quy-trinh-ky-thuat-kham-benh-chua-benh-chuyen-nganh-phuc-hoi-chuc-nang.html" },
        { id: "tt_39", number: "39/2018/TT-BYT", title: "Quy định mức giá tối đa dịch vụ khám bệnh, chữa bệnh không thuộc phạm vi thanh toán của BHYT", issuer: "Bộ Y tế", signDate: "30/11/2018", link: "https://thuvienphapluat.vn/van-ban/Bao-hiem/Thong-tu-39-2018-TT-BYT-dinh-muc-gia-toi-da-dich-vu-kham-chua-benh-khong-thuoc-Bao-hiem-y-te-401824.aspx" },
        { id: "tt_22", number: "22/2023/TT-BYT", title: "Quy định giá dịch vụ khám bệnh, chữa bệnh BHYT áp dụng từ 17/11/2023", issuer: "Bộ Y tế", signDate: "17/11/2023", link: "https://thuvienphapluat.vn/van-ban/Bao-hiem/Thong-tu-22-2023-TT-BYT-gia-dich-vu-kham-chua-benh-bao-hiem-y-te-587216.aspx" },
        { id: "hd_bhxh", number: "HD-BHXH-2026", title: "Bộ quy chuẩn định mức & điều kiện thanh toán BHYT cho dịch vụ YHCT - PHCN mới nhất", issuer: "BHXH Việt Nam", signDate: "01/01/2026", link: "https://baohiemxahoi.gov.vn" }
      ];
      try {
        await setCaiDat(db, unitCode, 'vb_documents', JSON.stringify(defaultDocs));
      } catch(e) {}
      return success(defaultDocs);
    }

    case "saveDocuments": {
      const docs = Array.isArray(args[0]) ? args[0] : [];
      await setCaiDat(db, unitCode, 'vb_documents', JSON.stringify(docs));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu danh mục tài liệu tra cứu thành công!" });
    }

    case "exportDatabase": {
      const isMaster = unitCode === 'master' || unitCode === 'MASTER';
      const [pat, staff, mach, room, proc, sched, hist, acc, cc, tk, cd] = await Promise.all([
        isMaster ? db.prepare("SELECT * FROM benh_nhan").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM benh_nhan WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM nhan_su").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM nhan_su WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM may_moc").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM may_moc WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM phong").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM phong WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM thu_thuat").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM lich_trinh").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM lich_trinh WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM lich_su").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM lich_su WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT username, role, name, note FROM tai_khoan").all().catch(() => ({ results: [] })) : db.prepare("SELECT username, role, name, note FROM tai_khoan WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM cham_cong").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM cham_cong WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM thong_ke").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM thong_ke WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM cai_dat").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM cai_dat WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] }))
      ]);
      return success({
        version: "3.2.0",
        unit_code: unitCode,
        exportedAt: new Date().toISOString(),
        pat: pat.results || [],
        staff: staff.results || [],
        machines: mach.results || [],
        rooms: room.results || [],
        procedures: proc.results || [],
        schedule: sched.results || [],
        history: hist.results || [],
        accounts: acc.results || [],
        chamCong: cc.results || [],
        thongKe: tk.results || [],
        caiDat: cd.results || []
      });
    }

    case "importDatabase": {
      const data = args[0] || {};
      let restoredCount = 0;
      if (data.caiDat && Array.isArray(data.caiDat)) {
        for (const item of data.caiDat) {
          if (item.key) {
            await setCaiDat(db, unitCode, item.key, item.value);
            restoredCount++;
          }
        }
      }
      await bumpDataVersion(db, unitCode);
      return success({ message: `Đã phục hồi thành công ${restoredCount} mục cài đặt!` });
    }

    case "saveGoogleDriveSettings": {
      const cfg = args[0] || {};
      await setCaiDat(db, unitCode, 'gdrive_settings', JSON.stringify(cfg));
      return success({ message: "Đã lưu cài đặt Google Drive!" });
    }

    case "getGoogleDriveSettings": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'gdrive_settings'").bind(unitCode).first();
      return success(rec && rec.value ? JSON.parse(rec.value) : {});
    }

    case "testGoogleDriveUpload": {
      return success({ message: "Kết nối Google Drive thành công!" });
    }

    default:
      return null;
  }
}
