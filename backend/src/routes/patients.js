// ═══════════════════════════════════════════════════════════════════════════════
// 🏥 ROUTES: BỆNH NHÂN, THỦ THUẬT, MÁY MÓC, PHÒNG KHÁM, PHÁC ĐỒ
// Ràng buộc Rule 2: 100% câu lệnh SQL phải có WHERE unit_code = ?
// ═══════════════════════════════════════════════════════════════════════════════

export async function handlePatientsAction(action, ctx) {
  const { db, args, env, request, executionCtx, unitCode, tokenPayload, origin, helpers } = ctx;
  const {
    success, error, jsonResponse, parseStringOrJsonArray,
    bumpDataVersion, makeBumpDataVersionStmt, setCaiDat,
    healBackendPatientName
  } = helpers;

  switch (action) {
    case "getMayMoc":

    case "getDanhSachMay": {
      const res = await db.prepare("SELECT * FROM may_moc WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      const list = (res.results || []).map((m, i) => ({
        id: m.id,
        tenLoai: m.ten_loai,
        maMay: m.ma_may,
        trangThai: m.trang_thai,
        ten_loai: m.ten_loai,
        ma_may: m.ma_may,
        trang_thai: m.trang_thai,
        name: m.ma_may,
        ten: m.ma_may,
        0: i + 1,
        1: m.ten_loai,
        2: m.ma_may,
        3: m.trang_thai
      }));
      return success(list);
    }


    case "addMayMoc": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      const tenLoai = String(payload.tenLoai || payload.ten_loai || args[0] || "");
      const maMayPrefix = String(payload.maMay || payload.ma_may || args[1] || "");
      const qty = parseInt(payload.soLuong || payload.qty || args[2]) || 1;
      const trangThai = String(payload.trangThai || payload.trang_thai || args[3] || "Sẵn sàng");
      
      const stmts = [];
      if (qty > 1) {
        for (let i = 0; i < qty; i++) {
          stmts.push(db.prepare("INSERT INTO may_moc (unit_code, ten_loai, ma_may, trang_thai, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, ma_may) DO UPDATE SET ten_loai = excluded.ten_loai, trang_thai = excluded.trang_thai, updated_at = CURRENT_TIMESTAMP").bind(unitCode, tenLoai, `${maMayPrefix}${i + 1}`, trangThai));
        }
      } else {
        stmts.push(db.prepare("INSERT INTO may_moc (unit_code, ten_loai, ma_may, trang_thai, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, ma_may) DO UPDATE SET ten_loai = excluded.ten_loai, trang_thai = excluded.trang_thai, updated_at = CURRENT_TIMESTAMP").bind(unitCode, tenLoai, maMayPrefix, trangThai));
      }
      stmts.push(makeBumpDataVersionStmt(db, unitCode));
      await db.batch(stmts);
      return success({ message: "Thêm thiết bị thành công" });
    }


    case "editMayMoc": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) {
        payload = args[0];
      } else if (typeof args[1] === "object" && args[1] !== null) {
        payload = args[1];
      } else {
        let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]) && args.length >= 4)) ? 1 : 0;
        payload = { tenLoai: args[offset], maMay: args[offset + 1], trangThai: args[offset + 2], oldMaMay: args[offset + 3] };
      }
      const tenLoai = String(payload.tenLoai || payload.ten_loai || "");
      const maMay = String(payload.maMay || payload.ma_may || "");
      const trangThai = String(payload.trangThai || payload.trang_thai || "Sẵn sàng");
      const oldMaMay = String(payload.oldMaMay || payload.old_ma_may || "");
      const id = payload.id || null;

      let updated = false;
      if (id || (oldMaMay && oldMaMay !== maMay)) {
        const updateRes = await db.prepare(
          "UPDATE may_moc SET ten_loai = ?, ma_may = ?, trang_thai = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND (id = ? OR ma_may = ?)"
        ).bind(tenLoai, maMay, trangThai, unitCode, id || -1, oldMaMay || "").run();
        if (updateRes && (updateRes.changes > 0 || updateRes.affected_row_count > 0)) {
          updated = true;
        }
      }
      if (!updated) {
        const stmt = db.prepare("INSERT INTO may_moc (unit_code, ten_loai, ma_may, trang_thai, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, ma_may) DO UPDATE SET ten_loai = excluded.ten_loai, trang_thai = excluded.trang_thai, updated_at = CURRENT_TIMESTAMP").bind(unitCode, tenLoai, maMay, trangThai);
        await db.batch([stmt, makeBumpDataVersionStmt(db, unitCode)]);
      } else {
        await bumpDataVersion(db, unitCode);
      }
      return success({ message: "Cập nhật thiết bị thành công" });
    }


    case "deleteMayMoc": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      const targetId = payload.id || null;
      let maMay = String(payload.maMay || payload.ma_may || (typeof args[0] === 'string' && !/^\d+$/.test(args[0]) ? args[0] : (typeof args[1] === 'string' ? args[1] : ''))).trim();

      if (!maMay && !targetId && (typeof args[0] === 'number' || (payload.index !== undefined && payload.index !== null))) {
        const idx = typeof args[0] === 'number' ? args[0] : Number(payload.index);
        const allList = await db.prepare("SELECT id, ma_may FROM may_moc WHERE unit_code = ? ORDER BY id ASC").bind(unitCode).all();
        if (allList && allList.results && allList.results[idx]) {
          const rowToDelete = allList.results[idx];
          await db.prepare("DELETE FROM may_moc WHERE unit_code = ? AND id = ?").bind(unitCode, rowToDelete.id).run();
          await bumpDataVersion(db, unitCode);
          return success({ message: "Xóa máy thành công" });
        }
      }

      await db.prepare("DELETE FROM may_moc WHERE unit_code = ? AND (ma_may = ? OR id = ?)").bind(unitCode, maMay, targetId || maMay).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa máy thành công" });
    }


    case "getThuThuat": {
      // Tự động nạp mốc lịch sử định mức ban đầu (áp dụng từ trước 21/09/2026) vào bảng lich_su_dinh_muc nếu chưa có
      try {
        const cntLsdm = await db.prepare("SELECT count(*) as total FROM lich_su_dinh_muc WHERE unit_code = ?").bind(unitCode).first().catch(() => null);
        if (!cntLsdm || cntLsdm.total === 0) {
          const allProcs = await db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] }));
          if (allProcs && allProcs.results && allProcs.results.length > 0) {
            for (const p of allProcs.results) {
              const thMin = p.tg_thuc_hien || 0;
              const thMax = (p.tg_thuc_hien_max && p.tg_thuc_hien_max > 0) ? p.tg_thuc_hien_max : thMin;
              const ttMin = p.tg_thu_thuat || 0;
              const ttMax = (p.tg_thu_thuat_max && p.tg_thu_thuat_max > 0) ? p.tg_thu_thuat_max : ttMin;
              const kc = p.khoang_cach || 0;
              const isLt = (p.lien_tuc === 1 || p.lien_tuc === '1' || p.lien_tuc === 'Có' || p.lien_tuc === true) ? 'Có' : 'Không';
              const rut = p.can_rut_may || 'Không';
              const phu = p.can_nguoi_phu || 'Không';
              const dsPhu = p.ds_nguoi_phu || '';
              const vt = p.viet_tat || '';
              const he = p.he || 'PHCN';
              const pl = p.phan_loai || '';
              const may = p.may || '';

              await db.prepare(`
                INSERT INTO lich_su_dinh_muc (unit_code, ten_thu_thuat, tu_ngay, den_ngay, tg_thuc_hien_min, tg_thuc_hien_max, tg_thu_thuat_min, tg_thu_thuat_max, khoang_cach, lien_tuc, can_rut_may, can_nguoi_phu, ds_nguoi_phu, viet_tat, he, phan_loai, may, created_at, updated_at)
                VALUES (?, ?, '2026-01-01', '2026-09-20', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              `).bind(unitCode, p.ten_thu_thuat, thMin, thMax, ttMin, ttMax, kc, isLt, rut, phu, dsPhu, vt, he, pl, may).run().catch(() => {});
            }
          }
        }
      } catch (eSeed) {}

      const [procRes, histRes] = await Promise.all([
        db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode).all().catch(() => ({ results: [] })),
        db.prepare("SELECT * FROM lich_su_dinh_muc WHERE unit_code = ? ORDER BY tu_ngay ASC, id ASC").bind(unitCode).all().catch(() => ({ results: [] }))
      ]);

      const historyMap = {};
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

      return success((procRes.results || []).map(p => {
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
      }));
    }


    case "addThuThuat":

    case "editThuThuat": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) {
        payload = args[0];
      } else if (typeof args[1] === "object" && args[1] !== null) {
        payload = args[1];
      } else {
        let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]) && args.length >= 11)) ? 1 : 0;
        payload = {
          ten: args[offset],
          vietTat: args[offset + 1],
          he: args[offset + 2],
          phanLoai: args[offset + 3],
          may: args[offset + 4],
          thoiGianThucHienMin: args[offset + 5],
          thoiGianThuThuatMin: args[offset + 6],
          khoangCach: args[offset + 7],
          canRutMay: args[offset + 8],
          canNguoiPhu: args[offset + 9],
          dsNguoiPhu: args[offset + 10],
          thoiGianThuThuatMax: args[offset + 11],
          thoiGianThucHienMax: args[offset + 12],
          lienTuc: args[offset + 13],
          lichSuDinhMuc: args[offset + 14] || args[14],
          id: args[offset + 15] || args[15] || undefined,
          oldTen: args[offset + 16] || args[16] || undefined
        };
      }
      const ten = sanitizeInputText(String(payload.ten || payload.name || "").trim());
      if (!ten) return error("Tên thủ thuật không hợp lệ");
      const vietTat = String(payload.vietTat || payload.viet_tat || "");
      const he = String(payload.he || "YHCT");
      const phanLoai = String(payload.phanLoai || payload.phan_loai || "");
      const may = String(payload.may || "Thủ công");
      const tgThMin = parseInt(payload.thoiGianThucHienMin || payload.thoiGianThucHien || payload.tg_thuc_hien) || 0;
      const tgThMax = parseInt(payload.thoiGianThucHienMax || payload.tg_thuc_hien_max || tgThMin) || tgThMin;
      const tgTtMin = parseInt(payload.thoiGianThuThuatMin || payload.thoiGianThuThuat || payload.tg_thu_thuat) || 0;
      const tgTtMax = parseInt(payload.thoiGianThuThuatMax || payload.tg_thu_thuat_max || tgTtMin) || tgTtMin;
      const kc = parseInt(payload.khoangCach || payload.khoang_cach) || 0;
      const rut = String(payload.canRutMay || payload.can_rut_may || "Không");
      const phu = String(payload.canNguoiPhu || payload.can_nguoi_phu || "Không");
      const dsPhu = String(payload.dsNguoiPhu || payload.ds_nguoi_phu || "");
      const isLt = (payload.lienTuc === 'Có' || payload.lienTuc === 1 || payload.lienTuc === '1' || payload.lienTuc === true || payload.lien_tuc === 1 || payload.lien_tuc === '1' || payload.lien_tuc === 'Có' || payload.lien_tuc === true) ? 1 : ((tgThMin === tgTtMin && tgThMax === tgTtMax && tgThMin >= 10) ? 1 : 0);

      const targetId = payload.id || null;
      const oldTen = payload.oldTen ? sanitizeInputText(String(payload.oldTen).trim()) : null;

      // 1. Kiểm tra bản ghi cũ trong DB (hỗ trợ theo id, oldTen, hoặc ten_thu_thuat case-insensitive)
      let existing = null;
      if (targetId) {
        existing = await db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ? AND id = ?").bind(unitCode, targetId).first().catch(() => null);
      }
      if (!existing && oldTen) {
        existing = await db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ? AND (ten_thu_thuat = ? OR LOWER(ten_thu_thuat) = LOWER(?))").bind(unitCode, oldTen, oldTen).first().catch(() => null);
      }
      if (!existing) {
        existing = await db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ? AND (ten_thu_thuat = ? OR LOWER(ten_thu_thuat) = LOWER(?))").bind(unitCode, ten, ten).first().catch(() => null);
      }
      
      let historyList = [];
      if (payload.lichSuDinhMuc || payload.history || payload.lich_su_dinh_muc) {
        const rawH = payload.lichSuDinhMuc || payload.history || payload.lich_su_dinh_muc;
        historyList = typeof rawH === 'string' ? (JSON.parse(rawH) || []) : (Array.isArray(rawH) ? rawH : []);
      } else if (existing && existing.lich_su_dinh_muc) {
        try {
          historyList = JSON.parse(existing.lich_su_dinh_muc) || [];
        } catch(e) {
          historyList = [];
        }
      }

      // 2. Nếu đã tồn tại bản ghi cũ và các giá trị định mức thời gian thay đổi -> tự động lưu vết mốc cũ vào history
      if (existing) {
        const oldThMin = existing.tg_thuc_hien;
        const oldThMax = (existing.tg_thuc_hien_max && existing.tg_thuc_hien_max > 0) ? existing.tg_thuc_hien_max : oldThMin;
        const oldTtMin = existing.tg_thu_thuat;
        const oldTtMax = (existing.tg_thu_thuat_max && existing.tg_thu_thuat_max > 0) ? existing.tg_thu_thuat_max : oldTtMin;
        const oldLt = (existing.lien_tuc === 1 || existing.lien_tuc === '1' || existing.lien_tuc === 'Có' || existing.lien_tuc === true) ? 'Có' : 'Không';

        const isChanged = (oldThMin !== tgThMin || oldThMax !== tgThMax || oldTtMin !== tgTtMin || oldTtMax !== tgTtMax);

        if (isChanged) {
          const nowVN = new Date(Date.now() + 7 * 3600 * 1000);
          const yesterdayVN = new Date(nowVN.getTime() - 86400 * 1000);
          const denNgayStr = yesterdayVN.toISOString().slice(0, 10);
          
          let tuNgayStr = '2026-01-01';
          if (existing.updated_at) {
            tuNgayStr = String(existing.updated_at).slice(0, 10);
          }
          if (tuNgayStr > denNgayStr) {
            tuNgayStr = denNgayStr;
          }

          // Kiểm tra xem đã có mốc này trong historyList chưa để tránh trùng lặp
          const alreadyExists = historyList.some(h => (h.tuNgay === tuNgayStr && h.denNgay === denNgayStr) || (h.thoiGianThucHienMin === oldThMin && h.thoiGianThuThuatMin === oldTtMin && h.denNgay === denNgayStr));
          
          if (!alreadyExists) {
            historyList.push({
              tuNgay: tuNgayStr,
              denNgay: denNgayStr,
              from: tuNgayStr,
              to: denNgayStr,
              thoiGianThucHienMin: oldThMin,
              thoiGianThucHienMax: oldThMax,
              thoiGianThuThuatMin: oldTtMin,
              thoiGianThuThuatMax: oldTtMax,
              khoangCach: existing.khoang_cach || 0,
              canRutMay: (existing.can_rut_may === 1 || existing.can_rut_may === '1' || existing.can_rut_may === 'Có') ? 'Có' : 'Không',
              canNguoiPhu: (existing.can_nguoi_phu === 1 || existing.can_nguoi_phu === '1' || existing.can_nguoi_phu === 'Có') ? 'Có' : 'Không',
              dsNguoiPhu: existing.ds_nguoi_phu || '',
              vietTat: existing.viet_tat || '',
              he: existing.he || 'PHCN',
              phanLoai: existing.phan_loai || '',
              may: existing.may || '',
              lienTuc: oldLt
            });
          }
        }
      }

      // Lưu các dòng lịch sử vào bảng riêng lich_su_dinh_muc
      if (historyList && historyList.length > 0) {
        for (const h of historyList) {
          const hTu = String(h.tuNgay || h.from || '2026-01-01').trim();
          const hDen = String(h.denNgay || h.to || '2026-12-31').trim();
          const hThMin = parseInt(h.thoiGianThucHienMin || h.thoiGianThucHien || 0) || 0;
          const hThMax = parseInt(h.thoiGianThucHienMax || hThMin) || hThMin;
          const hTtMin = parseInt(h.thoiGianThuThuatMin || h.thoiGianThuThuat || 0) || 0;
          const hTtMax = parseInt(h.thoiGianThuThuatMax || hTtMin) || hTtMin;
          const hLt = String(h.lienTuc || 'Không');
          const hKc = h.khoangCach !== undefined ? parseInt(h.khoangCach) || 0 : (payload.khoangCach !== undefined ? parseInt(payload.khoangCach) || 0 : 0);
          const hCrm = String(h.canRutMay || payload.canRutMay || 'Không');
          const hCnp = String(h.canNguoiPhu || payload.canNguoiPhu || 'Không');
          const hDsnp = String(h.dsNguoiPhu || payload.dsNguoiPhu || '');
          const hVt = String(h.vietTat || payload.vietTat || '');
          const hHe = String(h.he || payload.he || 'PHCN');
          const hPl = String(h.phanLoai || payload.phanLoai || '');
          const hMay = String(h.may || payload.may || '');

          try {
            await db.prepare(`
              INSERT INTO lich_su_dinh_muc (unit_code, ten_thu_thuat, tu_ngay, den_ngay, tg_thuc_hien_min, tg_thuc_hien_max, tg_thu_thuat_min, tg_thu_thuat_max, khoang_cach, lien_tuc, can_rut_may, can_nguoi_phu, ds_nguoi_phu, viet_tat, he, phan_loai, may, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(unitCode, ten, hTu, hDen, hThMin, hThMax, hTtMin, hTtMax, hKc, hLt, hCrm, hCnp, hDsnp, hVt, hHe, hPl, hMay).run().catch(() => {});
          } catch(eH) {}
        }
      }

      const lichSuStr = JSON.stringify(historyList);

      let stmt;
      if (existing && existing.id) {
        stmt = db.prepare(`UPDATE thu_thuat SET
          ten_thu_thuat = ?, viet_tat = ?, he = ?, phan_loai = ?, may = ?,
          tg_thuc_hien = ?, tg_thuc_hien_max = ?, tg_thu_thuat = ?, tg_thu_thuat_max = ?,
          khoang_cach = ?, can_rut_may = ?, can_nguoi_phu = ?, ds_nguoi_phu = ?,
          lien_tuc = ?, lich_su_dinh_muc = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND unit_code = ?`)
          .bind(ten, vietTat, he, phanLoai, may, tgThMin, tgThMax, tgTtMin, tgTtMax, kc, rut, phu, dsPhu, isLt, lichSuStr, existing.id, unitCode);
      } else {
        stmt = db.prepare(`INSERT INTO thu_thuat (unit_code, ten_thu_thuat, viet_tat, he, phan_loai, may, tg_thuc_hien, tg_thuc_hien_max, tg_thu_thuat, tg_thu_thuat_max, khoang_cach, can_rut_may, can_nguoi_phu, ds_nguoi_phu, lien_tuc, lich_su_dinh_muc, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(unit_code, ten_thu_thuat) DO UPDATE SET viet_tat = excluded.viet_tat, he = excluded.he, phan_loai = excluded.phan_loai, may = excluded.may, tg_thuc_hien = excluded.tg_thuc_hien, tg_thuc_hien_max = excluded.tg_thuc_hien_max, tg_thu_thuat = excluded.tg_thu_thuat, tg_thu_thuat_max = excluded.tg_thu_thuat_max, khoang_cach = excluded.khoang_cach, can_rut_may = excluded.can_rut_may, can_nguoi_phu = excluded.can_nguoi_phu, ds_nguoi_phu = excluded.ds_nguoi_phu, lien_tuc = excluded.lien_tuc, lich_su_dinh_muc = excluded.lich_su_dinh_muc, updated_at = CURRENT_TIMESTAMP`)
          .bind(unitCode, ten, vietTat, he, phanLoai, may, tgThMin, tgThMax, tgTtMin, tgTtMax, kc, rut, phu, dsPhu, isLt, lichSuStr);
      }

      try {
        await db.batch([stmt, makeBumpDataVersionStmt(db, unitCode)]);
      } catch(errBatch) {
        if (String(errBatch.message || errBatch).includes("lich_su_dinh_muc")) {
          let fallbackStmt;
          if (existing && existing.id) {
            fallbackStmt = db.prepare(`UPDATE thu_thuat SET
              ten_thu_thuat = ?, viet_tat = ?, he = ?, phan_loai = ?, may = ?,
              tg_thuc_hien = ?, tg_thuc_hien_max = ?, tg_thu_thuat = ?, tg_thu_thuat_max = ?,
              khoang_cach = ?, can_rut_may = ?, can_nguoi_phu = ?, ds_nguoi_phu = ?,
              lien_tuc = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND unit_code = ?`)
              .bind(ten, vietTat, he, phanLoai, may, tgThMin, tgThMax, tgTtMin, tgTtMax, kc, rut, phu, dsPhu, isLt, existing.id, unitCode);
          } else {
            fallbackStmt = db.prepare(`INSERT INTO thu_thuat (unit_code, ten_thu_thuat, viet_tat, he, phan_loai, may, tg_thuc_hien, tg_thuc_hien_max, tg_thu_thuat, tg_thu_thuat_max, khoang_cach, can_rut_may, can_nguoi_phu, ds_nguoi_phu, lien_tuc, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(unit_code, ten_thu_thuat) DO UPDATE SET viet_tat = excluded.viet_tat, he = excluded.he, phan_loai = excluded.phan_loai, may = excluded.may, tg_thuc_hien = excluded.tg_thuc_hien, tg_thuc_hien_max = excluded.tg_thuc_hien_max, tg_thu_thuat = excluded.tg_thu_thuat, tg_thu_thuat_max = excluded.tg_thu_thuat_max, khoang_cach = excluded.khoang_cach, can_rut_may = excluded.can_rut_may, can_nguoi_phu = excluded.can_nguoi_phu, ds_nguoi_phu = excluded.ds_nguoi_phu, lien_tuc = excluded.lien_tuc, updated_at = CURRENT_TIMESTAMP`)
              .bind(unitCode, ten, vietTat, he, phanLoai, may, tgThMin, tgThMax, tgTtMin, tgTtMax, kc, rut, phu, dsPhu, isLt);
          }
          await db.batch([fallbackStmt, makeBumpDataVersionStmt(db, unitCode)]);
        } else {
          throw errBatch;
        }
      }
      return success({ message: "Lưu thủ thuật thành công" });
    }


    case "deleteThuThuat": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]))) ? 1 : 0;
      const targetId = payload.id || null;
      const ten = String(payload.ten || payload.name || args[offset] || args[0] || "").trim();
      if (targetId) {
        const oldProc = await db.prepare("SELECT ten_thu_thuat FROM thu_thuat WHERE unit_code = ? AND id = ?").bind(unitCode, targetId).first().catch(() => null);
        const oldProcName = oldProc?.ten_thu_thuat || ten;
        await db.prepare("DELETE FROM thu_thuat WHERE unit_code = ? AND id = ?").bind(unitCode, targetId).run();
        if (oldProcName) {
          await db.prepare("DELETE FROM lich_su_dinh_muc WHERE unit_code = ? AND (ten_thu_thuat = ? OR LOWER(ten_thu_thuat) = LOWER(?))").bind(unitCode, oldProcName, oldProcName).run().catch(() => {});
        }
      } else {
        await db.prepare("DELETE FROM thu_thuat WHERE unit_code = ? AND (ten_thu_thuat = ? OR LOWER(ten_thu_thuat) = LOWER(?) OR id = ?)").bind(unitCode, ten, ten, ten).run();
        if (ten) {
          await db.prepare("DELETE FROM lich_su_dinh_muc WHERE unit_code = ? AND (ten_thu_thuat = ? OR LOWER(ten_thu_thuat) = LOWER(?))").bind(unitCode, ten, ten).run().catch(() => {});
        }
      }
      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa thủ thuật thành công" });
    }


    case "getPhong":

    case "getPhongThuThuat": {
      const res = await db.prepare("SELECT * FROM phong WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      return success((res.results || []).map(r => ({
        id: r.id,
        tenPhong: r.ten_phong,
        name: r.ten_phong,
        bacSi: r.bac_si || "",
        ktv: r.ktv || "",
        danhSachMay: r.danh_sach_may || "",
        soGiuong: r.so_giuong || 0,
        danhSachGiuong: r.danh_sach_giuong || ""
      })));
    }


    case "addPhong":

    case "editPhong": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) {
        payload = args[0];
      } else if (typeof args[1] === "object" && args[1] !== null) {
        payload = args[1];
      } else {
        let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]) && args.length >= 7)) ? 1 : 0;
        payload = {
          tenPhong: args[offset],
          bacSi: args[offset + 1],
          ktv: args[offset + 2],
          danhSachMay: args[offset + 3],
          soGiuong: args[offset + 4],
          danhSachGiuong: args[offset + 5],
          oldTenPhong: args[offset + 6]
        };
      }
      const tenPhong = sanitizeInputText(String(payload.tenPhong || payload.ten_phong || payload.name || "").trim());
      if (!tenPhong) return error("Tên phòng không hợp lệ");
      const bacSi = String(payload.bacSi || payload.bac_si || "");
      const ktv = String(payload.ktv || "");
      const danhSachMay = String(payload.danhSachMay || payload.danh_sach_may || "");
      const soGiuong = parseInt(payload.soGiuong || payload.so_giuong) || 0;
      const danhSachGiuong = String(payload.danhSachGiuong || payload.danh_sach_giuong || "");
      const oldTenPhong = String(payload.oldTenPhong || payload.old_ten_phong || "");
      const id = payload.id || null;

      let updated = false;
      if (id || (oldTenPhong && oldTenPhong !== tenPhong)) {
        const updateRes = await db.prepare(
          `UPDATE phong SET ten_phong = ?, bac_si = ?, ktv = ?, danh_sach_may = ?, so_giuong = ?, danh_sach_giuong = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND (id = ? OR ten_phong = ?)`
        ).bind(tenPhong, bacSi, ktv, danhSachMay, soGiuong, danhSachGiuong, unitCode, id || -1, oldTenPhong || "").run();
        if (updateRes && (updateRes.changes > 0 || updateRes.affected_row_count > 0)) {
          updated = true;
        }
      }
      if (!updated) {
        const stmt = db.prepare(`INSERT INTO phong (unit_code, ten_phong, bac_si, ktv, danh_sach_may, so_giuong, danh_sach_giuong, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(unit_code, ten_phong) DO UPDATE SET bac_si = excluded.bac_si, ktv = excluded.ktv, danh_sach_may = excluded.danh_sach_may, so_giuong = excluded.so_giuong, danh_sach_giuong = excluded.danh_sach_giuong, updated_at = CURRENT_TIMESTAMP`)
          .bind(unitCode, tenPhong, bacSi, ktv, danhSachMay, soGiuong, danhSachGiuong);
        await db.batch([stmt, makeBumpDataVersionStmt(db, unitCode)]);
      } else {
        await bumpDataVersion(db, unitCode);
      }
      return success({ message: "Lưu phòng thành công" });
    }


    case "deletePhong": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      const targetId = payload.id || null;
      let ten = String(payload.tenPhong || payload.ten || (typeof args[0] === 'string' && !/^\d+$/.test(args[0]) ? args[0] : (typeof args[1] === 'string' ? args[1] : ''))).trim();

      if (!ten && !targetId && (typeof args[0] === 'number' || (payload.index !== undefined && payload.index !== null))) {
        const idx = typeof args[0] === 'number' ? args[0] : Number(payload.index);
        const allList = await db.prepare("SELECT id, ten_phong FROM phong WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
        if (allList && allList.results && allList.results[idx]) {
          const rowToDelete = allList.results[idx];
          await db.prepare("DELETE FROM phong WHERE unit_code = ? AND id = ?").bind(unitCode, rowToDelete.id).run();
          await bumpDataVersion(db, unitCode);
          return success({ message: "Xóa phòng thành công" });
        }
      }

      await db.prepare("DELETE FROM phong WHERE unit_code = ? AND (ten_phong = ? OR id = ?)").bind(unitCode, ten, targetId || ten).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa phòng thành công" });
    }


    case "getBenhNhan": {
      const res = await db.prepare("SELECT * FROM benh_nhan WHERE unit_code = ? AND is_saturday = 0 ORDER BY ngay_vao ASC, name ASC").bind(unitCode).all();
      const list = (res.results || []).map(r => {
        let procs = [];
        try { procs = JSON.parse(r.thu_thuat || "[]"); } catch(e) {
          if (typeof r.thu_thuat === "string") procs = r.thu_thuat.split(",").map(x => ({ name: x.trim() }));
        }
        const procNames = procs.map(p => typeof p === "string" ? p : (p.name || p.ten || "")).filter(Boolean);
        return {
          id: r.id,
          ten: healBackendPatientName(r.name),
          name: healBackendPatientName(r.name),
          namSinh: r.age,
          age: r.age,
          gioiTinh: r.gender,
          phong: r.room,
          room: r.room,
          giuong: r.bed,
          gioVao: r.arrive_time,
          gioRa: r.leave_time,
          ngayVao: r.ngay_vao,
          gioBan: r.gio_ban,
          thuThuat: procNames.join(", "),
          thu_thuat: procs,
          trangThai: r.status,
          status: r.status,
          loai_bn: r.loai_bn || "NoiTru",
          buoi_dieu_tri: r.buoi_dieu_tri || "TuDong"
        };
      });
      return success(list);
    }


  case "addBenhNhan": {
    let p = (typeof args[0] === "object") ? args[0] : {
      ten: args[0],
      namSinh: args[1],
      ngayVao: args[2],
      gioVao: args[3],
      gioBan: args[4],
      gioRa: args[5],
      phong: args[6],
      thuThuat: args[7],
      loai_bn: args[8],
      buoi_dieu_tri: args[9]
    };

    const patName = sanitizeInputText(healBackendPatientName(p.ten || p.name || ""));
    const patAge = parseInt(p.namSinh || p.age) || 0;
    const ngayVao = String(p.ngayVao || "").trim();
    const procs = typeof p.thuThuat === "string" ? p.thuThuat.split(",").map(x => ({ name: x.trim(), status: "Chưa xếp" })) : (p.thu_thuat || []);
    
    // 🛡️ CHỐNG LẶP BỆNH NHÂN: Kiểm tra nếu bệnh nhân cùng tên, năm sinh, ngày vào đã tồn tại trong đơn vị
    if (patName && ngayVao) {
      const existing = await db.prepare(
        "SELECT id FROM benh_nhan WHERE unit_code = ? AND name = ? AND age = ? AND ngay_vao = ? LIMIT 1"
      ).bind(unitCode, patName, patAge, ngayVao).first().catch(() => null);

      if (existing && existing.id) {
        // Đã tồn tại -> Cập nhật thông tin thay vì chèn lặp bản ghi thứ hai!
        const stmtUpdate = db.prepare(`
          UPDATE benh_nhan SET 
            gender = ?, 
            room = ?, 
            bed = ?, 
            arrive_time = ?, 
            leave_time = ?, 
            thu_thuat = ?, 
            status = ?, 
            gio_ban = ?, 
            loai_bn = ?, 
            buoi_dieu_tri = ?, 
            updated_at = CURRENT_TIMESTAMP 
          WHERE unit_code = ? AND id = ?
        `).bind(
          String(p.gender || "Nam"),
          String(p.phong || p.room || ""),
          String(p.bed || ""),
          String(p.gioVao || p.arriveTime || "07:30"),
          String(p.gioRa || p.leaveTime || ""),
          JSON.stringify(procs),
          String(p.status || "Chưa xếp"),
          String(p.gioBan || ""),
          String(p.loai_bn || "NoiTru"),
          String(p.buoi_dieu_tri || "TuDong"),
          unitCode,
          existing.id
        );
        await db.batch([stmtUpdate, makeBumpDataVersionStmt(db, unitCode)]);
        return success({ id: existing.id, isUpdated: true });
      }
    }

    const stmtAdd = db.prepare(
      "INSERT INTO benh_nhan (unit_code, name, age, gender, room, bed, arrive_time, leave_time, thu_thuat, status, ngay_vao, gio_ban, loai_bn, buoi_dieu_tri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      unitCode,
      patName,
      patAge,
      String(p.gender || "Nam"),
      String(p.phong || p.room || ""),
      String(p.bed || ""),
      String(p.gioVao || p.arriveTime || "07:30"),
      String(p.gioRa || p.leaveTime || ""),
      JSON.stringify(procs),
      String(p.status || "Chưa xếp"),
      ngayVao,
      String(p.gioBan || ""),
      String(p.loai_bn || "NoiTru"),
      String(p.buoi_dieu_tri || "TuDong")
    );
    const res = await db.batch([stmtAdd, makeBumpDataVersionStmt(db, unitCode)]);
    const insertedId = res[0]?.meta?.last_row_id || res[0]?.meta?.changes || 1;
    return success({ id: insertedId });
  }


  case "editBenhNhan": {
    let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]) && args.length >= 9)) ? 1 : 0;
    let p = (typeof args[0] === "object" && args[0] !== null) ? args[0] : {
      ten: args[offset],
      namSinh: args[offset + 1],
      ngayVao: args[offset + 2],
      gioVao: args[offset + 3],
      gioBan: args[offset + 4],
      gioRa: args[offset + 5],
      phong: args[offset + 6],
      thuThuat: args[offset + 7],
      oldTen: args[offset + 8] || args[offset],
      oldNamSinh: args[offset + 9] || args[offset + 1],
      loai_bn: args[offset + 10],
      buoi_dieu_tri: args[offset + 11],
      id: args[offset + 12] || 0
    };

    const patId = parseInt(p.id) || 0;
    let patName = healBackendPatientName(p.ten || p.name || "");
    const patAge = parseInt(p.namSinh || p.age) || 0;
    let targetName = healBackendPatientName(p.oldTen || patName);
    if (patName.includes("\ufffd") && targetName && !targetName.includes("\ufffd")) {
      patName = targetName;
    }
    patName = sanitizeInputText(healBackendPatientName(patName));
    const targetAge = parseInt(p.oldNamSinh || p.namSinh || p.age) || 0;
    const procs = typeof p.thuThuat === "string" ? p.thuThuat.split(",").map(x => ({ name: x.trim(), status: "Chưa xếp" })).filter(x => x.name) : (p.thu_thuat || []);
    const loaiBnVal = p.loai_bn ? String(p.loai_bn).trim() : "";
    const buoiVal = p.buoi_dieu_tri ? String(p.buoi_dieu_tri).trim() : "";

    let updateRes = null;
    if (patId > 0) {
      updateRes = await db.prepare(`
        UPDATE benh_nhan SET 
          name = ?, 
          age = ?, 
          gender = ?, 
          room = ?, 
          bed = ?, 
          arrive_time = ?, 
          leave_time = ?, 
          thu_thuat = ?, 
          status = ?, 
          ngay_vao = ?, 
          gio_ban = ?, 
          loai_bn = CASE WHEN ? != '' THEN ? ELSE loai_bn END, 
          buoi_dieu_tri = CASE WHEN ? != '' THEN ? ELSE buoi_dieu_tri END, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE unit_code = ? AND id = ?
      `).bind(
        patName,
        patAge,
        String(p.gender || "Nam"),
        String(p.phong || p.room || ""),
        String(p.bed || ""),
        String(p.gioVao || p.arriveTime || "07:30"),
        String(p.gioRa || p.leaveTime || ""),
        JSON.stringify(procs),
        String(p.status || "Chưa xếp"),
        String(p.ngayVao || ""),
        String(p.gioBan || ""),
        loaiBnVal, loaiBnVal,
        buoiVal, buoiVal,
        unitCode,
        patId
      ).run();
    }

    if (!updateRes || (updateRes.meta && updateRes.meta.changes === 0)) {
      updateRes = await db.prepare(`
        UPDATE benh_nhan SET 
          name = ?, 
          age = ?, 
          gender = ?, 
          room = ?, 
          bed = ?, 
          arrive_time = ?, 
          leave_time = ?, 
          thu_thuat = ?, 
          status = ?, 
          ngay_vao = ?, 
          gio_ban = ?, 
          loai_bn = CASE WHEN ? != '' THEN ? ELSE loai_bn END, 
          buoi_dieu_tri = CASE WHEN ? != '' THEN ? ELSE buoi_dieu_tri END, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE unit_code = ? AND name = ? AND (age = ? OR ? = 0 OR age = 0)
      `).bind(
        patName,
        patAge,
        String(p.gender || "Nam"),
        String(p.phong || p.room || ""),
        String(p.bed || ""),
        String(p.gioVao || p.arriveTime || "07:30"),
        String(p.gioRa || p.leaveTime || ""),
        JSON.stringify(procs),
        String(p.status || "Chưa xếp"),
        String(p.ngayVao || ""),
        String(p.gioBan || ""),
        loaiBnVal, loaiBnVal,
        buoiVal, buoiVal,
        unitCode,
        targetName,
        targetAge,
        targetAge
      ).run();
    }

    if (updateRes && updateRes.meta && updateRes.meta.changes === 0) {
      const existing = await db.prepare("SELECT id FROM benh_nhan WHERE unit_code = ? AND (name = ? OR (? > 0 AND id = ?) OR name = ?) LIMIT 1").bind(unitCode, targetName, patId, patId, patName).first();
      if (existing && existing.id) {
        await db.prepare(`
          UPDATE benh_nhan SET 
            name = ?,
            age = ?, 
            gender = ?, 
            room = ?, 
            bed = ?, 
            arrive_time = ?, 
            leave_time = ?, 
            thu_thuat = ?, 
            status = ?, 
            ngay_vao = ?, 
            gio_ban = ?, 
            loai_bn = CASE WHEN ? != '' THEN ? ELSE loai_bn END, 
            buoi_dieu_tri = CASE WHEN ? != '' THEN ? ELSE buoi_dieu_tri END, 
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(
          patName,
          patAge,
          String(p.gender || "Nam"),
          String(p.phong || p.room || ""),
          String(p.bed || ""),
          String(p.gioVao || p.arriveTime || "07:30"),
          String(p.gioRa || p.leaveTime || ""),
          JSON.stringify(procs),
          String(p.status || "Chưa xếp"),
          String(p.ngayVao || ""),
          String(p.gioBan || ""),
          loaiBnVal, loaiBnVal,
          buoiVal, buoiVal,
          existing.id
        ).run();
      } else {
        console.warn("[editBenhNhan]: Không tìm thấy bệnh nhân để sửa:", { patId, targetName, patName });
      }
    }
    await bumpDataVersion(db, unitCode);
    return success(true);
  }


    case "deleteBenhNhan": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      const patId = parseInt(payload.id || args[3] || (typeof args[0] === "number" && args[0] > 1000 ? args[0] : 0)) || 0;
      const ten = String(payload.ten || payload.name || args[1] || (typeof args[0] === "string" && !/^\d+$/.test(args[0]) ? args[0] : "")).trim();
      const namSinh = parseInt(payload.namSinh || payload.age || args[2]) || 0;

      if (patId > 0) {
        await db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND id = ?").bind(unitCode, patId).run();
      } else if (ten) {
        await db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND name = ? AND (? = 0 OR age = ? OR age = 0)").bind(unitCode, ten, namSinh, namSinh).run();
      } else {
        const idx = typeof args[0] === "number" ? args[0] : parseInt(args[0]);
        if (!isNaN(idx)) {
          const allPats = await db.prepare("SELECT id FROM benh_nhan WHERE unit_code = ? AND is_saturday = 0 ORDER BY ngay_vao ASC, name ASC").bind(unitCode).all();
          if (allPats.results && allPats.results[idx]) {
            await db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND id = ?").bind(unitCode, allPats.results[idx].id).run();
          }
        }
      }
      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa bệnh nhân thành công" });
    }


    case "saveReorderedData": {
      const type = String(args[0] || "").toLowerCase().trim();
      const list = args[1] || [];
      const stmts = [];

      try {
        if (type === "benh_nhan" || type === "patients" || type === "pat") {
          list.forEach((p, idx) => {
            const name = String(p.ten || p.name || "").trim();
            const id = p.id;
            if (name) {
              stmts.push(db.prepare("UPDATE benh_nhan SET order_idx = ? WHERE unit_code = ? AND (name = ? OR id = ?)").bind(idx + 1, unitCode, name, id || 0));
            }
          });
        } else if (type === "nhan_su" || type === "staff" || type === "nhansu") {
          list.forEach((s, idx) => {
            const name = String(s.ten || s.name || "").trim();
            const id = s.id;
            if (name) {
              stmts.push(db.prepare("UPDATE nhan_su SET priority = ? WHERE unit_code = ? AND (name = ? OR id = ?)").bind(idx + 1, unitCode, name, id || 0));
            }
          });
        } else if (type === "may_moc" || type === "machines" || type === "machine" || type === "may") {
          list.forEach((m, idx) => {
            const ma = String(m.maMay || m[2] || m.ten || m.name || "").trim();
            if (ma) {
              stmts.push(db.prepare("UPDATE may_moc SET order_idx = ? WHERE unit_code = ? AND ma_may = ?").bind(idx + 1, unitCode, ma));
            }
          });
        } else if (type === "phong" || type === "rooms" || type === "room") {
          list.forEach((r, idx) => {
            const ten = String(r.tenPhong || r.ten || r.name || r[1] || "").trim();
            if (ten) {
              stmts.push(db.prepare("UPDATE phong SET order_idx = ? WHERE unit_code = ? AND ten_phong = ?").bind(idx + 1, unitCode, ten));
            }
          });
        } else if (type === "thu_thuat" || type === "procedures" || type === "proc") {
          list.forEach((p, idx) => {
            const ten = String(p.ten || p.name || p.ten_thu_thuat || p[1] || "").trim();
            const tgThMin = parseInt(p.thoiGianThucHienMin || p.thoiGianThucHien || p[6]) || 0;
            const tgThMax = parseInt(p.thoiGianThucHienMax || p[13] || tgThMin) || tgThMin;
            const tgTtMin = parseInt(p.thoiGianThuThuatMin || p.thoiGianThuThuat || p[7]) || 0;
            const tgTtMax = parseInt(p.thoiGianThuThuatMax || p[12] || tgTtMin) || tgTtMin;
            const kc = parseInt(p.khoangCach || p[8]) || 0;
            if (ten) {
              stmts.push(db.prepare(`UPDATE thu_thuat SET order_idx = ?, tg_thuc_hien = CASE WHEN ? > 0 THEN ? ELSE tg_thuc_hien END, tg_thuc_hien_max = CASE WHEN ? > 0 THEN ? ELSE tg_thuc_hien_max END, tg_thu_thuat = CASE WHEN ? > 0 THEN ? ELSE tg_thu_thuat END, tg_thu_thuat_max = CASE WHEN ? > 0 THEN ? ELSE tg_thu_thuat_max END, khoang_cach = CASE WHEN ? > 0 THEN ? ELSE khoang_cach END WHERE unit_code = ? AND ten_thu_thuat = ?`)
                .bind(idx + 1, tgThMin, tgThMin, tgThMax, tgThMax, tgTtMin, tgTtMin, tgTtMax, tgTtMax, kc, kc, unitCode, ten));
            }
          });
        }

        if (stmts.length > 0) {
          stmts.push(makeBumpDataVersionStmt(db, unitCode));
          await db.batch(stmts);
        }
      } catch (e) {
        console.warn("[saveReorderedData error]:", e);
      }
      return success({ message: `Đã lưu thứ tự ${type} thành công!` });
    }


    case "bulkUpdatePatients": {
      const patientList = Array.isArray(args[0]) ? args[0] : [];
      const replaceAll = Boolean(args[1]);

      if (replaceAll) {
        await db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND (is_saturday = 0 OR is_saturday IS NULL OR is_saturday = '')").bind(unitCode).run();
      }

      // 🛡️ Deduplicate incoming patient list internally first (giữ bản ghi cuối cùng của mỗi bệnh nhân)
      const uniquePatients = new Map();
      patientList.forEach((p, idx) => {
        if (!p || typeof p !== "object") return;
        const name = healBackendPatientName(String(p.ten || p.name || "").trim());
        if (!name) return;
        const age = parseInt(String(p.namSinh || p.age || "0").replace(/\D/g, "")) || 0;
        const ngayVao = String(p.ngayVao || p.ngay_vao || "").trim();
        const matchKey = `${name.toUpperCase()}|${age}|${ngayVao}`;
        uniquePatients.set(matchKey, { p, name, age, ngayVao, idx });
      });

      // Nếu không phải replaceAll -> Tra cứu bệnh nhân hiện có để UPDATE thay vì chèn trùng lặp
      const existingMap = new Map();
      if (!replaceAll) {
        try {
          const existingRes = await db.prepare(
            "SELECT id, name, age, ngay_vao FROM benh_nhan WHERE unit_code = ? AND (is_saturday = 0 OR is_saturday IS NULL OR is_saturday = '')"
          ).bind(unitCode).all();
          (existingRes.results || []).forEach(r => {
            const k = `${String(r.name || '').trim().toUpperCase()}|${r.age || 0}|${String(r.ngay_vao || '').trim()}`;
            existingMap.set(k, r.id);
          });
        } catch(e) {
          console.warn("[bulkUpdatePatients fetch existing warning]:", e);
        }
      }

      const statements = [];
      uniquePatients.forEach(({ p, name, age, ngayVao, idx }) => {
        const gioVaoRaw = p.gioVao !== undefined ? p.gioVao : (p.arrive_time !== undefined ? p.arrive_time : "");
        const gioVao = String(gioVaoRaw || "07:30");
        const gioBan = String(p.gioBan || p.gio_ban || "");
        const gioRa = String(p.gioRa || p.leave_time || "");
        const room = String(p.phong || p.room || "");
        const gender = String(p.gioiTinh || p.gender || "Nam");
        const bed = String(p.giuong || p.bed || "");
        const status = String(p.trangThai || p.status || "Chưa xếp");
        const loaiBn = String(p.loai_bn || p.loaiBN || "NoiTru");
        const buoiDieuTri = String(p.buoi_dieu_tri || p.buoiDieuTri || "TuDong");

        const rawProcs = p.thuThuat !== undefined ? p.thuThuat : (p.thu_thuat !== undefined ? p.thu_thuat : "");
        let procs = [];
        if (typeof rawProcs === "string" && rawProcs.trim()) {
          procs = rawProcs.split(",").map(x => ({ name: x.trim(), status: "Chưa xếp" })).filter(x => x.name);
        } else if (Array.isArray(rawProcs)) {
          procs = rawProcs.map(x => {
            if (typeof x === "string") return { name: x.trim(), status: "Chưa xếp" };
            if (x && typeof x === "object" && x.name) return { name: String(x.name), status: String(x.status || "Chưa xếp") };
            return null;
          }).filter(Boolean).filter(x => x.name);
        }
        const procsJson = JSON.stringify(procs);

        const matchKey = `${name.toUpperCase()}|${age}|${ngayVao}`;
        const existingId = existingMap.get(matchKey);

        if (existingId) {
          // 🔄 Đã tồn tại -> Cập nhật thông tin thay vì chèn lặp bản ghi mới
          statements.push(
            db.prepare(`
              UPDATE benh_nhan SET 
                gender = ?, room = ?, bed = ?, arrive_time = ?, leave_time = ?, 
                thu_thuat = ?, status = ?, gio_ban = ?, loai_bn = ?, buoi_dieu_tri = ?, 
                updated_at = CURRENT_TIMESTAMP 
              WHERE unit_code = ? AND id = ?
            `).bind(
              gender, room, bed, gioVao, gioRa,
              procsJson, status, gioBan, loaiBn, buoiDieuTri,
              unitCode, existingId
            )
          );
        } else {
          // ➕ Bệnh nhân mới -> Chèn mới
          statements.push(
            db.prepare(
              "INSERT INTO benh_nhan (unit_code, name, age, gender, room, bed, arrive_time, leave_time, thu_thuat, status, ngay_vao, gio_ban, loai_bn, buoi_dieu_tri, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(
              unitCode, name, age, gender, room, bed, gioVao, gioRa,
              procsJson, status, ngayVao, gioBan, loaiBn, buoiDieuTri, idx
            )
          );
        }
      });

      if (statements.length > 0) {
        // Gửi batch lớn (250 câu lệnh/request) tối ưu hóa Turso Pipeline
        const chunkSize = 250;
        for (let i = 0; i < statements.length; i += chunkSize) {
          await db.batch(statements.slice(i, i + chunkSize));
        }
        await bumpDataVersion(db, unitCode);
      }

      return success({ message: `Cập nhật danh sách ${uniquePatients.size} bệnh nhân thành công!` });
    }


    case "getProtocolsData":

    case "getClinicalProtocols":

    case "getPhacDo": {
      const res = await db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode).all().catch(() => ({ results: [] }));
      if (res.results && res.results.length > 0) {
        const list = res.results.map((r, i) => {
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
        return success(list);
      }

      // Fallback nếu bảng phac_do chưa có dữ liệu
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'clinical_protocols'").bind(unitCode).first();
      if (rec && rec.value) {
        try {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list) && list.length > 0) return success(list);
        } catch(e) {}
      }
      return success([]);
    }


    case "saveProtocolsData":

    case "saveClinicalProtocols":

    case "savePhacDo": {
      const protocols = args[0] || [];
      const list = Array.isArray(protocols) ? protocols : (typeof protocols === 'string' ? JSON.parse(protocols || '[]') : []);
      const jsonStr = JSON.stringify(list);

      const stmts = [
        db.prepare("DELETE FROM phac_do WHERE unit_code = ?").bind(unitCode)
      ];

      list.forEach((item, idx) => {
        const name = (item.name || item.ten || item.ten_phac_do || `Phác đồ ${idx + 1}`).trim();
        const procs = item.procs || item.danh_sach_thu_thuat || [];
        const procsJson = typeof procs === 'string' ? procs : JSON.stringify(procs);
        stmts.push(
          db.prepare("INSERT INTO phac_do (unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)")
            .bind(unitCode, name, procsJson, idx)
        );
      });

      if (stmts.length > 0) {
        await db.batch(stmts);
      }
      await setCaiDat(db, unitCode, 'clinical_protocols', jsonStr);
      await bumpDataVersion(db, unitCode);
      return success(true);
    }


    case "addPhacDo":

    case "addProtocol": {
      let payload = {};
      if (typeof args[0] === 'object' && args[0] !== null) payload = args[0];
      const name = String(payload.name || payload.ten || payload.ten_phac_do || args[0] || '').trim();
      const procs = payload.procs || payload.danh_sach_thu_thuat || args[1] || [];
      const procsJson = typeof procs === 'string' ? procs : JSON.stringify(procs);
      const orderIdx = parseInt(payload.order_idx || args[2]) || 0;

      if (!name) return error("Tên phác đồ không được để trống", 400);

      const existPd = await db.prepare("SELECT id FROM phac_do WHERE unit_code = ? AND ten_phac_do = ?").bind(unitCode, name).first();
      if (existPd && existPd.id) {
        await db.prepare("UPDATE phac_do SET danh_sach_thu_thuat = ?, order_idx = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND unit_code = ?").bind(procsJson, orderIdx, existPd.id, unitCode).run();
      } else {
        await db.prepare("INSERT INTO phac_do (unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)").bind(unitCode, name, procsJson, orderIdx).run();
      }
      
      // Đồng bộ lại vào cai_dat
      const allRes = await db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      const allList = (allRes.results || []).map(r => ({
        id: String(r.id),
        name: r.ten_phac_do,
        procs: (() => { try { return JSON.parse(r.danh_sach_thu_thuat); } catch(e) { return []; } })()
      }));
      await setCaiDat(db, unitCode, 'clinical_protocols', JSON.stringify(allList));

      await bumpDataVersion(db, unitCode);
      return success({ message: "Thêm phác đồ thành công" });
    }


    case "editPhacDo":

    case "editProtocol": {
      let payload = {};
      if (typeof args[0] === 'object' && args[0] !== null) payload = args[0];
      const id = payload.id || args[0];
      const name = String(payload.name || payload.ten || payload.ten_phac_do || args[1] || '').trim();
      const procs = payload.procs || payload.danh_sach_thu_thuat || args[2] || [];
      const procsJson = typeof procs === 'string' ? procs : JSON.stringify(procs);

      if (!name) return error("Tên phác đồ không được để trống", 400);

      if (id) {
        await db.prepare("UPDATE phac_do SET ten_phac_do = ?, danh_sach_thu_thuat = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND id = ?").bind(name, procsJson, unitCode, id).run();
      } else {
        await db.prepare("UPDATE phac_do SET danh_sach_thu_thuat = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND ten_phac_do = ?").bind(procsJson, unitCode, name).run();
      }

      // Đồng bộ lại vào cai_dat
      const allRes = await db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      const allList = (allRes.results || []).map(r => ({
        id: String(r.id),
        name: r.ten_phac_do,
        procs: (() => { try { return JSON.parse(r.danh_sach_thu_thuat); } catch(e) { return []; } })()
      }));
      await setCaiDat(db, unitCode, 'clinical_protocols', JSON.stringify(allList));

      await bumpDataVersion(db, unitCode);
      return success({ message: "Cập nhật phác đồ thành công" });
    }


    case "deletePhacDo":

    case "deleteProtocol": {
      let idOrName = args[0];
      if (typeof idOrName === 'object' && idOrName !== null) {
        idOrName = idOrName.id || idOrName.name || idOrName.ten || idOrName.ten_phac_do;
      }
      if (!idOrName) return error("Thiếu ID hoặc Tên phác đồ để xóa", 400);

      await db.prepare("DELETE FROM phac_do WHERE unit_code = ? AND (id = ? OR ten_phac_do = ?)").bind(unitCode, idOrName, idOrName).run();

      // Đồng bộ lại vào cai_dat
      const allRes = await db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      const allList = (allRes.results || []).map(r => ({
        id: String(r.id),
        name: r.ten_phac_do,
        procs: (() => { try { return JSON.parse(r.danh_sach_thu_thuat); } catch(e) { return []; } })()
      }));
      await setCaiDat(db, unitCode, 'clinical_protocols', JSON.stringify(allList));

      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa phác đồ thành công" });
    }

    // ============================================================
    // 🔗 LIÊN KẾT NHANH (QUICK LINKS)
    // ============================================================

    case "getThongKeThuThuat": {
      try {
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

          // 1. Single SQL query on thong_ke with IN (...)
          try {
            const placeholders = uniqueVariants.map(() => '?').join(',');
            const res = await db.prepare(`SELECT month_year, data_json FROM thong_ke WHERE unit_code IN (${uPlaceholders}) AND month_year IN (${placeholders})`).bind(...uUnits, ...uniqueVariants).all();
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
            const cdKeys = uniqueVariants.map(v => "thongke_" + v);
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
        }

        // Không tự động đếm thủ thuật từ lịch trực (lich_trinh/lich_su)
        // Số liệu thống kê thủ thuật chỉ được tính khi người dùng nạp file HIS thực tế
        return success({});
      } catch (err) {
        console.error("getThongKeThuThuat error:", err);
        return success({});
      }
    }


    case "saveThongKeThuThuat": {
      const my = String(args[0] || "").trim();
      const data = args[1] || {};
      const jsonStr = typeof data === "string" ? data : JSON.stringify(data);
      
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

      try {
        await db.prepare(`
          INSERT INTO thong_ke (unit_code, month_year, data_json, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(unit_code, month_year) DO UPDATE SET
            data_json = excluded.data_json,
            updated_at = CURRENT_TIMESTAMP
        `).bind(unitCode, myStandard, jsonStr).run();
      } catch(e) {
        console.warn("saveThongKeThuThuat D1 error, fallback to 2-step:", e);
        try {
          const exist = await db.prepare("SELECT id FROM thong_ke WHERE unit_code = ? AND month_year = ?").bind(unitCode, myStandard).first();
          if (exist && exist.id) {
            await db.prepare("UPDATE thong_ke SET data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND unit_code = ?").bind(jsonStr, exist.id, unitCode).run();
          } else {
            await db.prepare("INSERT INTO thong_ke (unit_code, month_year, data_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").bind(unitCode, myStandard, jsonStr).run();
          }
        } catch(e2) {
          console.error("saveThongKeThuThuat fatal error:", e2);
        }
      }

      await setCaiDat(db, unitCode, "thongke_" + myStandard, jsonStr);
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu dữ liệu thống kê thủ thuật thành công!" });
    }


    default:
      return null;
  }
}
