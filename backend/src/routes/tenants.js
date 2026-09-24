// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 ROUTES: MULTI-TENANT SAAS, AUTHENTICATION, BẢN QUYỀN & THANH TOÁN
// Ràng buộc Rule 2: 100% câu lệnh SQL phải có WHERE unit_code = ? (trừ super admin tenant management)
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleTenantsAction(action, ctx) {
  const { db, args, env, request, executionCtx, unitCode, tokenPayload, origin, helpers } = ctx;
  const {
    success, error, jsonResponse, parseStringOrJsonArray,
    bumpDataVersion, makeBumpDataVersionStmt, setCaiDat,
    hashPassword, verifyPassword, isLegacyHash, SUBSCRIPTION_PLANS, calculateSubscriptionInfo,
    checkLoginRateLimit, recordLoginFailure, recordLoginSuccess,
    signJwt, getJwtSecret
  } = helpers;
  const sanitizeInputText = helpers?.sanitizeInputText || ((str) => (typeof str === "string" ? str.replace(/<[^>]*>/g, "") : str));

  switch (action) {
    case "ping": {
      return success({ pong: true, time: Date.now(), unit_code: unitCode });
    }

    // ============================================================
    // 🏢 0. MULTI-TENANT & SAAS SUBSCRIPTION HANDLERS
    // ============================================================

    case "getPublicUnits": {
      try {
        const units = await db.prepare("SELECT unit_code, unit_name, logo_url, plan_tier FROM tenants WHERE is_active = 1 ORDER BY id ASC").all();
        return success(units.results || []);
      } catch (e) {
        return success([{ unit_code: "bvtks-cs2", unit_name: "Bệnh viện Than - Khoáng sản Cơ sở 2", plan_tier: "ENTERPRISE" }]);
      }
    }

    case "getSubscriptionPlans": {
      return success({
        plans: SUBSCRIPTION_PLANS,
        list: Object.values(SUBSCRIPTION_PLANS)
      });
    }

    case "getPublicTenantInfo": {
      const targetUnit = String(args[0] || unitCode || "bvtks-cs2").trim().toLowerCase();
      const tenant = await db.prepare("SELECT unit_code, unit_name, logo_url, plan_tier, is_active, expires_at FROM tenants WHERE unit_code = ?").bind(targetUnit).first();
      if (!tenant) return error(`Đơn vị '${targetUnit}' không tồn tại!`, 404);
      const subInfo = calculateSubscriptionInfo(tenant);
      return success({ ...tenant, ...subInfo });
    }

    case "registerTrialTenant": {
      const payload = args[0] || {};
      let uCode = String(payload.unit_code || payload.code || "").trim().toLowerCase();
      const uName = String(payload.unit_name || payload.name || "").trim();
      const uPhone = String(payload.phone || "").trim();
      const uEmail = String(payload.email || "").trim();
      const uPass = String(payload.password || payload.admin_password || "").trim();

      if (!uName) return error("Vui lòng nhập Tên bệnh viện hoặc Phòng khám!", 400);
      if (!uPhone) return error("Vui lòng nhập Số điện thoại liên hệ!", 400);
      if (!uPass || uPass.length < 4) return error("Mật khẩu quản trị phải có ít nhất 4 ký tự!", 400);

      // Nếu người dùng không nhập mã đơn vị, tự động tạo mã slug đẹp từ tên
      if (!uCode) {
        uCode = uName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d").replace(/Đ/g, "D")
          .toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (uCode.length < 3) uCode = "pk-" + Math.floor(1000 + Math.random() * 9000);
      }

      // Kiểm tra định dạng mã đơn vị
      if (!/^[a-z0-9_-]{3,35}$/.test(uCode)) {
        return error("Mã đơn vị phải từ 3 đến 35 ký tự, chỉ gồm chữ thường không dấu, số, gạch nối (- hoặc _)!", 400);
      }

      // Kiểm tra trùng mã đơn vị
      const exist = await db.prepare("SELECT id FROM tenants WHERE unit_code = ?").bind(uCode).first();
      if (exist) {
        return error(`Mã đơn vị '${uCode}' đã có người đăng ký! Vui lòng chọn mã khác (ví dụ: ${uCode}-${Math.floor(10 + Math.random() * 90)}).`, 400);
      }

      // 1. Tính toán ngày hết hạn 15 ngày kể từ ngày đăng ký
      const nowVN = new Date(Date.now() + 7 * 3600 * 1000);
      const expDate = new Date(nowVN.getTime() + 15 * 86400 * 1000).toISOString().slice(0, 10);

      // 2. Tạo bản ghi đơn vị trong bảng tenants (Full chức năng: max_staff = 999, max_patients = 9999)
      await db.prepare(`
        INSERT INTO tenants (unit_code, unit_name, phone, email, plan_tier, max_staff, max_patients, expires_at, is_active)
        VALUES (?, ?, ?, ?, 'TRIAL_15D', 999, 9999, ?, 1)
      `).bind(uCode, uName, uPhone, uEmail, expDate).run();

      // 3. Tạo tài khoản admin mặc định cho đơn vị mới
      const passHash = await hashPassword(uPass);
      await db.prepare(`
        INSERT INTO tai_khoan (unit_code, username, password_hash, role, permissions)
        VALUES (?, 'admin', ?, 'Admin', 'ALL')
      `).bind(uCode, passHash).run();

      // 4. Batch Seed danh mục mẫu 1-Click Onboarding
      const seedBatch = [];
      const defaultSettings = [
        ["hospital_name", uName],
        ["app_title", uName + " - Quản Lý Xếp Lịch T.I.M.E.S"],
        ["system_theme", "glass-dark"],
        ["thoi_gian_lam_viec", "07:30-11:30, 13:00-16:30"],
        ["so_ca_toi_da_ktv", "12"],
        ["tg_nghi_chuyen_ca", "5"],
        ["cho_phep_xep_thu_7", "1"],
        ["gio_chieu_sang_sang", "13:00"],
        ["gio_chieu_sang_chieu", "16:30"],
        ["ai_auto_learning", "1"],
        ["ai_active_engine", "CP_SOLVER"],
        ["gio_mo_cua", "07:30"],
        ["gio_dong_cua", "16:30"],
        ["chotSoTime", "16:20"],
        ["yhctLunch", "5"],
        ["yhctEnd", "5"],
        ["dropWeight", "10000"],
        ["overtimeWeight", "2"],
        ["imbalanceWeight", "0.1"]
      ];
      for (const [k, v] of defaultSettings) {
        seedBatch.push(db.prepare("INSERT OR REPLACE INTO cai_dat (unit_code, key, value) VALUES (?, ?, ?)").bind(uCode, k, v));
      }

      // Danh mục phòng điều trị mẫu
      const sampleRooms = [
        { name: "Phòng Điện trị liệu (Phòng 1)", bs: "BS. Quản Lý Khoa", ktv: "KTV. Nguyễn Văn A", beds: 6 },
        { name: "Phòng Kéo giãn cột sống (Phòng 2)", bs: "", ktv: "KTV. Nguyễn Văn A", beds: 4 },
        { name: "Phòng Vận động trị liệu (Phòng 3)", bs: "", ktv: "KTV. Trần Thị B", beds: 5 },
        { name: "Phòng Châm cứu & Cấy chỉ (Phòng 4)", bs: "BS. Quản Lý Khoa", ktv: "KTV. Trần Thị B", beds: 6 },
        { name: "Phòng Xoa bóp bấm huyệt (Phòng 5)", bs: "", ktv: "KTV. Trần Thị B", beds: 4 }
      ];
      sampleRooms.forEach((r, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO phong (unit_code, ten_phong, bac_si, ktv, so_giuong, order_idx, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).bind(uCode, r.name, r.bs, r.ktv, r.beds, idx + 1));
      });

      // Danh mục máy móc điều trị mẫu
      const sampleMachines = [
        { type: "Máy Siêu âm điều trị", code: "SA-01" },
        { type: "Máy Siêu âm điều trị", code: "SA-02" },
        { type: "Máy Điện xung đa năng", code: "DX-01" },
        { type: "Máy Điện xung đa năng", code: "DX-02" },
        { type: "Máy Laser công suất thấp", code: "LS-01" },
        { type: "Máy Kéo giãn cột sống cổ/lưng", code: "KG-01" },
        { type: "Máy Sóng ngắn trị liệu", code: "SN-01" },
        { type: "Đèn Hồng ngoại", code: "HN-01" },
        { type: "Đèn Hồng ngoại", code: "HN-02" }
      ];
      sampleMachines.forEach((m, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO may_moc (unit_code, ten_loai, ma_may, order_idx, is_active)
          VALUES (?, ?, ?, ?, 1)
        `).bind(uCode, m.type, m.code, idx + 1));
      });

      // 13 Thủ thuật mẫu YHCT & PHCN chuẩn Bộ Y Tế
      const sampleProcs = [
        { name: "Siêu âm điều trị", vt: "SA", he: "PHCN", may: "SA", tg: 30, lien_tuc: 0 },
        { name: "Điện xung điều trị", vt: "DX", he: "PHCN", may: "DX", tg: 30, lien_tuc: 0 },
        { name: "Điện phân dẫn thuốc", vt: "DP", he: "PHCN", may: "DX", tg: 30, lien_tuc: 0 },
        { name: "Kéo giãn cột sống bằng máy", vt: "KG", he: "PHCN", may: "KG", tg: 30, lien_tuc: 0 },
        { name: "Chiếu đèn hồng ngoại", vt: "HN", he: "PHCN", may: "HN", tg: 30, lien_tuc: 0 },
        { name: "Laser điều trị", vt: "LS", he: "PHCN", may: "LS", tg: 20, lien_tuc: 0 },
        { name: "Sóng ngắn điều trị", vt: "SN", he: "PHCN", may: "SN", tg: 20, lien_tuc: 0 },
        { name: "Tập vận động thụ động", vt: "VĐ-TD", he: "PHCN", may: "", tg: 30, lien_tuc: 0 },
        { name: "Tập vận động có trợ giúp", vt: "VĐ-TG", he: "PHCN", may: "", tg: 30, lien_tuc: 0 },
        { name: "Xoa bóp bấm huyệt điều trị", vt: "XBBH", he: "YHCT", may: "", tg: 30, lien_tuc: 0 },
        { name: "Điện châm điều trị", vt: "ĐC", he: "YHCT", may: "", tg: 30, lien_tuc: 0 },
        { name: "Cứu ngải điều trị", vt: "CN", he: "YHCT", may: "", tg: 20, lien_tuc: 0 },
        { name: "Thủy châm điều trị", vt: "TC", he: "YHCT", may: "", tg: 15, lien_tuc: 0 }
      ];
      sampleProcs.forEach((p, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO thu_thuat (unit_code, ten_thu_thuat, viet_tat, he, may, tg_thuc_hien, tg_thu_thuat, lien_tuc, order_idx, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(uCode, p.name, p.vt, p.he, p.may, p.tg, p.tg, p.lien_tuc, idx + 1));
      });

      // Phác đồ điều trị mẫu
      const sampleProtocols = [
        { name: "Phác đồ Thoái hóa cột sống thắt lưng", procs: JSON.stringify(["Kéo giãn cột sống bằng máy", "Điện xung điều trị", "Chiếu đèn hồng ngoại"]) },
        { name: "Phác đồ Đau vai gáy / Cột sống cổ", procs: JSON.stringify(["Siêu âm điều trị", "Điện xung điều trị", "Xoa bóp bấm huyệt điều trị"]) },
        { name: "Phác đồ Di chứng tai biến / Liệt nửa người", procs: JSON.stringify(["Tập vận động thụ động", "Điện châm điều trị", "Xoa bóp bấm huyệt điều trị"]) }
      ];
      sampleProtocols.forEach((proto, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO phac_do (unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active)
          VALUES (?, ?, ?, ?, 1)
        `).bind(uCode, proto.name, proto.procs, idx + 1));
      });

      // Nhân sự mẫu
      const sampleStaff = [
        { name: "KTV. Nguyễn Văn A", role: "KTV", system: "PHCN", priority: 1, time: "07:30-11:30, 13:00-16:30" },
        { name: "KTV. Trần Thị B", role: "KTV", system: "YHCT", priority: 2, time: "07:30-11:30, 13:00-16:30" },
        { name: "BS. Quản Lý Khoa", role: "BS", system: "ALL", priority: 0, time: "07:30-11:30, 13:00-16:30" }
      ];
      sampleStaff.forEach((s, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO nhan_su (unit_code, name, role, system, priority, thoi_gian_lam, trang_thai, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 'Đi làm', 1)
        `).bind(uCode, s.name, s.role, s.system, s.priority, s.time));
      });

      if (seedBatch.length > 0) {
        await db.batch(seedBatch);
      }

      // Cấp JWT Token để client tự động đăng nhập tức thì
      const jwtSecret = getJwtSecret(env);
      const tokenPayload = {
        sub: "trial-admin-" + uCode,
        username: "admin",
        role: "Admin",
        name: "Quản trị viên " + uName,
        unit_code: uCode,
        unit_name: uName,
        plan_tier: "TRIAL_15D",
        permissions: "ALL",
        exp: Math.floor(Date.now() / 1000) + (15 * 86400)
      };
      const token = await signJwt(tokenPayload, jwtSecret);

      return success({
        message: `Đăng ký thành công! Chào mừng '${uName}' đến với Hệ thống Xếp lịch T.I.M.E.S. Gói Dùng thử 15 ngày miễn phí đã sẵn sàng!`,
        token: token,
        unit_code: uCode,
        unit_name: uName,
        username: "admin",
        role: "Admin",
        plan_tier: "TRIAL_15D",
        plan_name: "Dùng Thử 15 Ngày",
        days_left: 15,
        expires_at: expDate
      });
    }

    case "renewTenantSubscription": {
      const payload = args[0] || {};
      const uCode = String(payload.unit_code || payload.code || args[0] || unitCode || "").trim().toLowerCase();
      const planCode = String(payload.plan_tier || payload.plan_code || payload.plan || args[1] || "PLAN_1M").trim().toUpperCase();

      if (!uCode) return error("Thiếu mã đơn vị cần gia hạn!", 400);

      // Kiểm tra quyền: Chỉ SUPER_ADMIN hoặc chính đơn vị đó mới được thao tác
      if (tokenPayload && tokenPayload.role !== "SUPER_ADMIN" && tokenPayload.unit_code !== uCode) {
        return error("Từ chối truy cập: Bạn không có quyền gia hạn cho đơn vị khác!", 403);
      }

      const plan = SUBSCRIPTION_PLANS[planCode];
      if (!plan) {
        return error(`Gói cước '${planCode}' không tồn tại trong danh mục hệ thống!`, 400);
      }

      const tenant = await db.prepare("SELECT unit_code, unit_name, plan_tier, expires_at FROM tenants WHERE unit_code = ?").bind(uCode).first();
      if (!tenant) return error(`Đơn vị '${uCode}' không tồn tại!`, 404);

      // Tính ngày hết hạn mới (cộng nối tiếp nếu còn hạn, hoặc từ hôm nay nếu đã quá hạn)
      const nowVN = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
      let baseDate;
      if (tenant.expires_at && tenant.expires_at >= nowVN) {
        baseDate = new Date(tenant.expires_at);
      } else {
        baseDate = new Date(nowVN);
      }

      const newExpDate = new Date(baseDate.getTime() + plan.days * 86400 * 1000).toISOString().slice(0, 10);

      await db.prepare(`
        UPDATE tenants SET
          plan_tier = ?,
          expires_at = ?,
          max_staff = 999,
          max_patients = 9999,
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE unit_code = ?
      `).bind(planCode, newExpDate, uCode).run();

      const subInfo = calculateSubscriptionInfo({ ...tenant, plan_tier: planCode, expires_at: newExpDate });

      return success({
        message: `Đã kích hoạt thành công '${plan.name}' cho '${tenant.unit_name}' đến ngày ${newExpDate}!`,
        unit_code: uCode,
        unit_name: tenant.unit_name,
        plan_tier: planCode,
        plan_name: plan.name,
        expires_at: newExpDate,
        days_left: subInfo.days_left
      });
    }

    // ============================================================
    // 💳 PAYMENT & VIETQR AUTOMATION
    // ============================================================

    case "createPaymentOrder": {
      const payload = args[0] || {};
      const uCode = String(payload.unit_code || unitCode || "").trim().toLowerCase();
      const planCode = String(payload.plan_tier || payload.plan_code || "PLAN_1M").trim().toUpperCase();

      if (!uCode) return error("Thiếu mã đơn vị thanh toán!", 400);

      const plan = SUBSCRIPTION_PLANS[planCode] || SUBSCRIPTION_PLANS["PLAN_1M"];
      const amount = Number(payload.amount || plan.price || 400000);

      if (uCode === "bvtks-cs2" || uCode === "bvtks_cs2") {
        return error("Đơn vị bvtks-cs2 đã sở hữu bản quyền Vĩnh viễn trọn đời, không cần thanh toán!", 400);
      }

      const planSuffixMap = { 'PLAN_1M': '1T', 'PLAN_3M': '3T', 'PLAN_6M': '6T', 'PLAN_1Y': '1N' };
      const suffix = planSuffixMap[planCode] || '1T';
      const transferContent = `PMCG ${uCode.toUpperCase()} ${suffix}`;

      const orderCode = `ORD_${Date.now()}_${uCode.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
      const bankAccount = "0392283473";
      const bankName = "MB";
      const accountName = "DANG PHONG THAI";

      const qrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

      try {
        await db.prepare(`
          INSERT INTO payment_transactions (order_code, unit_code, plan_tier, amount, content, bank_account, bank_name, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `).bind(orderCode, uCode, planCode, amount, transferContent, bankAccount, "MB Bank").run();
      } catch (e) {
        console.warn("Lưu payment_transactions thất bại:", e);
      }

      return success({
        order_code: orderCode,
        unit_code: uCode,
        plan_tier: planCode,
        plan_name: plan.name,
        amount: amount,
        amount_text: plan.priceText || (amount.toLocaleString('vi-VN') + ' đ'),
        content: transferContent,
        bank_name: "MB Bank (Ngân hàng TMCP Quân Đội)",
        bank_account: bankAccount,
        account_name: "ĐẶNG PHONG THÁI",
        qr_url: qrUrl
      });
    }

    case "checkPaymentStatus": {
      const payload = args[0] || {};
      const orderCode = String(payload.order_code || args[0] || "").trim();
      const uCode = String(payload.unit_code || args[1] || unitCode || "").trim().toLowerCase();
      const requestedPlan = String(payload.plan_tier || args[2] || "").trim().toUpperCase();

      if (!orderCode && !uCode) {
        return error("Cần mã đơn hàng (order_code) hoặc mã đơn vị (unit_code)!", 400);
      }

      let trans = null;
      if (orderCode) {
        trans = await db.prepare("SELECT * FROM payment_transactions WHERE order_code = ?").bind(orderCode).first();
      } else if (uCode) {
        trans = await db.prepare("SELECT * FROM payment_transactions WHERE unit_code = ? ORDER BY id DESC LIMIT 1").bind(uCode).first();
      }

      const targetUnit = trans ? trans.unit_code : uCode;
      const tenant = await db.prepare("SELECT unit_code, unit_name, plan_tier, expires_at FROM tenants WHERE unit_code = ?").bind(targetUnit).first();

      if (!tenant) return error("Đơn vị không tồn tại!", 404);

      const subInfo = calculateSubscriptionInfo(tenant);

      if (trans && trans.status === "SUCCESS") {
        return success({
          payment_status: "SUCCESS",
          order_code: trans.order_code,
          unit_code: targetUnit,
          unit_name: tenant.unit_name,
          plan_tier: tenant.plan_tier,
          plan_name: subInfo.plan_name,
          expires_at: tenant.expires_at,
          days_left: subInfo.days_left,
          confirmed_at: trans.confirmed_at
        });
      }

      if (requestedPlan && tenant.plan_tier === requestedPlan && !subInfo.is_expired) {
        return success({
          payment_status: "SUCCESS",
          unit_code: targetUnit,
          unit_name: tenant.unit_name,
          plan_tier: tenant.plan_tier,
          plan_name: subInfo.plan_name,
          expires_at: tenant.expires_at,
          days_left: subInfo.days_left
        });
      }

      return success({
        payment_status: trans ? trans.status : "PENDING",
        order_code: orderCode,
        unit_code: targetUnit,
        plan_tier: tenant.plan_tier,
        plan_name: subInfo.plan_name,
        expires_at: tenant.expires_at,
        days_left: subInfo.days_left
      });
    }

    case "manualApprovePayment": {
      const payload = args[0] || {};
      const orderCode = String(payload.order_code || args[0] || "").trim();
      const uCode = String(payload.unit_code || args[1] || "").trim().toLowerCase();
      const targetPlan = String(payload.plan_tier || args[2] || "PLAN_1M").trim().toUpperCase();

      let trans = null;
      if (orderCode) {
        trans = await db.prepare("SELECT * FROM payment_transactions WHERE order_code = ?").bind(orderCode).first();
      }

      const finalUnit = (trans ? trans.unit_code : uCode).toLowerCase();
      const finalPlan = (trans ? trans.plan_tier : targetPlan).toUpperCase();

      if (!finalUnit) return error("Thiếu mã đơn vị cần xác nhận thanh toán!", 400);

      const plan = SUBSCRIPTION_PLANS[finalPlan] || SUBSCRIPTION_PLANS["PLAN_1M"];
      const tenant = await db.prepare("SELECT unit_code, unit_name, plan_tier, expires_at FROM tenants WHERE unit_code = ?").bind(finalUnit).first();
      if (!tenant) return error(`Đơn vị '${finalUnit}' không tồn tại!`, 404);

      const nowVN = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
      let baseDate;
      if (tenant.expires_at && tenant.expires_at >= nowVN) {
        baseDate = new Date(tenant.expires_at);
      } else {
        baseDate = new Date(nowVN);
      }
      const newExpDate = new Date(baseDate.getTime() + plan.days * 86400 * 1000).toISOString().slice(0, 10);

      await db.prepare(`
        UPDATE tenants SET
          plan_tier = ?,
          expires_at = ?,
          max_staff = 999,
          max_patients = 9999,
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE unit_code = ?
      `).bind(finalPlan, newExpDate, finalUnit).run();

      if (trans) {
        await db.prepare(`
          UPDATE payment_transactions SET
            status = 'SUCCESS',
            confirmed_at = CURRENT_TIMESTAMP,
            transaction_ref = 'MANUAL_SUPERADMIN'
          WHERE id = ?
        `).bind(trans.id).run();
      } else {
        try {
          await db.prepare(`
            INSERT INTO payment_transactions (order_code, unit_code, plan_tier, amount, content, status, confirmed_at, transaction_ref)
            VALUES (?, ?, ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP, 'MANUAL_SUPERADMIN')
          `).bind(`MANUAL_${Date.now()}`, finalUnit, finalPlan, plan.price || 0, `Xác nhận thủ công bởi Chủ sở hữu`).run();
        } catch (e) {}
      }

      const subInfo = calculateSubscriptionInfo({ ...tenant, plan_tier: finalPlan, expires_at: newExpDate });

      return success({
        message: `Đã xác nhận nhận tiền thành công! Đơn vị '${tenant.unit_name}' (${finalUnit}) đã nâng cấp lên '${plan.name}' đến ngày ${newExpDate}.`,
        order_code: trans?.order_code,
        unit_code: finalUnit,
        unit_name: tenant.unit_name,
        plan_tier: finalPlan,
        plan_name: plan.name,
        expires_at: newExpDate,
        days_left: subInfo.days_left
      });
    }

    case "getPaymentTransactions": {
      try {
        const list = await db.prepare("SELECT * FROM payment_transactions ORDER BY id DESC LIMIT 50").all();
        return success(list.results || []);
      } catch(e) {
        return success([]);
      }
    }

    case "paymentWebhook": {
      const payload = args[0] || {};

      // 🛡️ 1. XÁC THỰC WEBHOOK SECRET / CHỮ KÝ CỔNG THANH TOÁN (SEPAY / CASSO / PAYOS / CUSTOM)
      let incomingSecret = "";
      if (request && request.headers) {
        incomingSecret = request.headers.get("x-webhook-secret") ||
                         request.headers.get("x-api-key") ||
                         request.headers.get("secure-token") || "";
        const authHeader = request.headers.get("authorization") || "";
        if (authHeader.startsWith("Apikey ")) {
          incomingSecret = authHeader.substring(7).trim();
        } else if (authHeader.startsWith("Bearer ") && !incomingSecret) {
          incomingSecret = authHeader.substring(7).trim();
        }
      }
      if (!incomingSecret && payload.secure_token) {
        incomingSecret = String(payload.secure_token).trim();
      }
      if (!incomingSecret && payload.secret) {
        incomingSecret = String(payload.secret).trim();
      }

      let configuredSecret = env?.PAYMENT_WEBHOOK_SECRET ? String(env.PAYMENT_WEBHOOK_SECRET).trim() : "";
      if (!configuredSecret) {
        const recSec = await db.prepare("SELECT value FROM cai_dat WHERE key = 'payment_webhook_secret' LIMIT 1").first().catch(() => null);
        configuredSecret = recSec ? String(recSec.value).trim() : "";
      }

      // Kiểm tra secret bắt buộc để ngăn chặn gọi tự do
      if (configuredSecret) {
        if (!incomingSecret || incomingSecret !== configuredSecret) {
          console.warn("[SECURITY REJECT] Webhook payment rejected: Invalid or missing webhook secret.");
          return error("Từ chối truy cập: Chữ ký hoặc Webhook Secret không hợp lệ!", 403);
        }
      } else {
        // Chưa cấu hình PAYMENT_WEBHOOK_SECRET: Yêu cầu quyền Super Admin hoặc reject
        if (!incomingSecret && (!tokenPayload || tokenPayload.role !== "SUPER_ADMIN")) {
          return error("Từ chối truy cập: Webhook thanh toán yêu cầu cấu hình biến môi trường PAYMENT_WEBHOOK_SECRET hoặc header xác thực!", 403);
        }
      }

      const rawContent = String(payload.content || payload.description || payload.message || payload.order_code || payload.memo || "").trim();
      const transferAmount = Number(payload.amount || payload.transferAmount || 0);
      const refNo = String(payload.referenceCode || payload.transactionId || payload.id || payload.ref || "").trim();

      // 🛡️ 2. CHỐNG REPLAY ATTACK (KIỂM TRA TRÙNG LẶP MÃ GIAO DỊCH IDEMPOTENCY)
      if (refNo) {
        const existTx = await db.prepare("SELECT id, status, unit_code, plan_tier FROM payment_transactions WHERE transaction_ref = ? AND status = 'SUCCESS'").bind(refNo).first().catch(() => null);
        if (existTx && existTx.id) {
          return success({
            message: `Giao dịch ref '${refNo}' đã được xử lý thành công trước đó (Idempotent replay detected).`,
            unit_code: existTx.unit_code,
            plan_tier: existTx.plan_tier,
            already_processed: true
          });
        }
      }

      const match = rawContent.match(/PMCG\s+([A-Za-z0-9_-]+)(?:\s+([A-Za-z0-9_]+))?/i);
      if (!match) {
        return error("Không tìm thấy cú pháp thanh toán PMCG hợp lệ trong nội dung chuyển khoản!", 400);
      }

      const targetUnit = match[1].toLowerCase();
      const suffix = (match[2] || "1T").toUpperCase();

      const suffixMap = {
        '1T': 'PLAN_1M',
        '3T': 'PLAN_3M',
        '6T': 'PLAN_6M',
        '1N': 'PLAN_1Y',
        '1M': 'PLAN_1M',
        '3M': 'PLAN_3M',
        '6M': 'PLAN_6M',
        '1Y': 'PLAN_1Y'
      };

      const targetPlan = suffixMap[suffix] || 'PLAN_1M';
      const plan = SUBSCRIPTION_PLANS[targetPlan] || SUBSCRIPTION_PLANS['PLAN_1M'];

      // 🛡️ 3. KIỂM TRA ĐỐI CHIẾU SỐ TIỀN CHUYỂN KHOẢN (TRANSFER AMOUNT CHECK)
      if (plan.price > 0 && transferAmount < plan.price) {
        try {
          await db.prepare(`
            INSERT INTO payment_transactions (order_code, unit_code, plan_tier, amount, content, status, confirmed_at, transaction_ref, gateway)
            VALUES (?, ?, ?, ?, ?, 'FAILED_UNDERPAID', CURRENT_TIMESTAMP, ?, 'BANK_WEBHOOK')
          `).bind(`WH_${Date.now()}_${targetUnit}`, targetUnit, targetPlan, transferAmount, rawContent, refNo).run();
        } catch (e) {}

        return error(`Số tiền chuyển khoản (${transferAmount.toLocaleString('vi-VN')} đ) không đủ để kích hoạt gói '${plan.name}' (${plan.price.toLocaleString('vi-VN')} đ)!`, 400);
      }

      const tenant = await db.prepare("SELECT unit_code, unit_name, plan_tier, expires_at FROM tenants WHERE unit_code = ?").bind(targetUnit).first();
      if (!tenant) return error(`Đơn vị '${targetUnit}' không tồn tại trên hệ thống!`, 404);

      const nowVN = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
      let baseDate;
      if (tenant.expires_at && tenant.expires_at >= nowVN) {
        baseDate = new Date(tenant.expires_at);
      } else {
        baseDate = new Date(nowVN);
      }
      const newExpDate = new Date(baseDate.getTime() + plan.days * 86400 * 1000).toISOString().slice(0, 10);

      await db.prepare(`
        UPDATE tenants SET
          plan_tier = ?,
          expires_at = ?,
          max_staff = 999,
          max_patients = 9999,
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE unit_code = ?
      `).bind(targetPlan, newExpDate, targetUnit).run();

      try {
        await db.prepare(`
          INSERT INTO payment_transactions (order_code, unit_code, plan_tier, amount, content, status, confirmed_at, transaction_ref, gateway)
          VALUES (?, ?, ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP, ?, 'BANK_WEBHOOK')
        `).bind(`WH_${Date.now()}_${targetUnit}`, targetUnit, targetPlan, transferAmount || plan.price, rawContent, refNo).run();
      } catch (e) {}

      return success({
        message: `Đã tự động xác nhận thanh toán Webhook và kích hoạt '${plan.name}' cho đơn vị '${tenant.unit_name}'!`,
        unit_code: targetUnit,
        plan_tier: targetPlan,
        expires_at: newExpDate
      });
    }

    case "getTenantsList": {
      // Dành riêng cho Super Admin
      try {
        const tenants = await db.prepare("SELECT * FROM tenants ORDER BY id DESC").all();
        return success(tenants.results || []);
      } catch (e) {
        return error("Không thể lấy danh sách đơn vị: " + e.message, 500);
      }
    }

    case "addTenant": {
      const payload = args[0] || {};
      const uCode = String(payload.unit_code || payload.code || "").trim().toLowerCase();
      const uName = String(payload.unit_name || payload.name || "").trim();
      const uPlan = String(payload.plan_tier || payload.plan || "PRO").trim();
      const uExp = String(payload.expires_at || "2099-12-31").trim();
      const uStaff = parseInt(payload.max_staff || 30, 10);
      const uPats = parseInt(payload.max_patients || 150, 10);
      const uPhone = String(payload.phone || "").trim();
      const uEmail = String(payload.email || "").trim();
      const uPass = String(payload.admin_password || payload.password || "admin123").trim();
      const seedSample = payload.seed_sample_data !== false;

      if (!uCode || !uName) return error("Mã đơn vị và Tên đơn vị là bắt buộc!", 400);

      // Kiểm tra trùng mã đơn vị
      const exist = await db.prepare("SELECT id FROM tenants WHERE unit_code = ?").bind(uCode).first();
      if (exist) return error(`Mã đơn vị '${uCode}' đã tồn tại! Vui lòng chọn mã khác.`, 400);

      // 1. Tạo đơn vị trong bảng tenants
      await db.prepare(`
        INSERT INTO tenants (unit_code, unit_name, phone, email, plan_tier, max_staff, max_patients, expires_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(uCode, uName, uPhone, uEmail, uPlan, uStaff, uPats, uExp).run();

      // 2. Tạo tài khoản admin mặc định cho đơn vị mới
      const passHash = await hashPassword(uPass);
      await db.prepare(`
        INSERT INTO tai_khoan (unit_code, username, password_hash, role, permissions)
        VALUES (?, 'admin', ?, 'Admin', 'ALL')
      `).bind(uCode, passHash).run();

      // 3. Chuẩn bị danh sách câu lệnh Batch Seed mẫu (1-Click Onboarding)
      const seedBatch = [];

      // A. Cài đặt hệ thống chuẩn (cai_dat)
      const defaultSettings = [
        ["hospital_name", uName],
        ["app_title", uName + " - Quản Lý Xếp Lịch T.I.M.E.S"],
        ["system_theme", "glass-dark"],
        ["thoi_gian_lam_viec", "07:30-11:30, 13:00-16:30"],
        ["so_ca_toi_da_ktv", "12"],
        ["tg_nghi_chuyen_ca", "5"],
        ["cho_phep_xep_thu_7", "1"],
        ["gio_chieu_sang_sang", "13:00"],
        ["gio_chieu_sang_chieu", "16:30"],
        ["ai_auto_learning", "1"],
        ["ai_active_engine", "CP_SOLVER"],
        ["gio_mo_cua", "07:30"],
        ["gio_dong_cua", "16:30"],
        ["chotSoTime", "16:20"],
        ["yhctLunch", "5"],
        ["yhctEnd", "5"],
        ["dropWeight", "10000"],
        ["overtimeWeight", "2"],
        ["imbalanceWeight", "0.1"]
      ];
      for (const [k, v] of defaultSettings) {
        seedBatch.push(db.prepare("INSERT OR REPLACE INTO cai_dat (unit_code, key, value) VALUES (?, ?, ?)").bind(uCode, k, v));
      }

      if (seedSample) {
        // B. Phòng điều trị mẫu (phong)
        const sampleRooms = [
          { name: "Phòng Điện trị liệu (Phòng 1)", bs: "BS. Quản Lý Khoa", ktv: "KTV. Nguyễn Văn A", beds: 6 },
          { name: "Phòng Kéo giãn cột sống (Phòng 2)", bs: "", ktv: "KTV. Nguyễn Văn A", beds: 4 },
          { name: "Phòng Vận động trị liệu (Phòng 3)", bs: "", ktv: "KTV. Trần Thị B", beds: 5 },
          { name: "Phòng Châm cứu & Cấy chỉ (Phòng 4)", bs: "BS. Quản Lý Khoa", ktv: "KTV. Trần Thị B", beds: 6 },
          { name: "Phòng Xoa bóp bấm huyệt (Phòng 5)", bs: "", ktv: "KTV. Trần Thị B", beds: 4 }
        ];
        sampleRooms.forEach((r, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO phong (unit_code, ten_phong, bac_si, ktv, so_giuong, order_idx, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
          `).bind(uCode, r.name, r.bs, r.ktv, r.beds, idx + 1));
        });

        // C. Máy móc điều trị mẫu (may_moc)
        const sampleMachines = [
          { type: "Máy Siêu âm điều trị", code: "SA-01" },
          { type: "Máy Siêu âm điều trị", code: "SA-02" },
          { type: "Máy Điện xung đa năng", code: "DX-01" },
          { type: "Máy Điện xung đa năng", code: "DX-02" },
          { type: "Máy Điện xung đa năng", code: "DX-03" },
          { type: "Máy Laser công suất thấp", code: "LS-01" },
          { type: "Máy Laser công suất thấp", code: "LS-02" },
          { type: "Máy Kéo giãn cột sống cổ/lưng", code: "KG-01" },
          { type: "Máy Kéo giãn cột sống cổ/lưng", code: "KG-02" },
          { type: "Máy Sóng ngắn trị liệu", code: "SN-01" },
          { type: "Đèn Hồng ngoại", code: "HN-01" },
          { type: "Đèn Hồng ngoại", code: "HN-02" },
          { type: "Đèn Hồng ngoại", code: "HN-03" },
          { type: "Đèn Hồng ngoại", code: "HN-04" }
        ];
        sampleMachines.forEach((m, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO may_moc (unit_code, ten_loai, ma_may, order_idx, is_active)
            VALUES (?, ?, ?, ?, 1)
          `).bind(uCode, m.type, m.code, idx + 1));
        });

        // D. 13 Thủ thuật mẫu YHCT & PHCN chuẩn Bộ Y Tế (thu_thuat)
        const sampleProcs = [
          { name: "Siêu âm điều trị", vt: "SA", he: "PHCN", may: "SA", tg: 30, lien_tuc: 0 },
          { name: "Điện xung điều trị", vt: "DX", he: "PHCN", may: "DX", tg: 30, lien_tuc: 0 },
          { name: "Điện phân dẫn thuốc", vt: "DP", he: "PHCN", may: "DX", tg: 30, lien_tuc: 0 },
          { name: "Kéo giãn cột sống bằng máy", vt: "KG", he: "PHCN", may: "KG", tg: 30, lien_tuc: 0 },
          { name: "Chiếu đèn hồng ngoại", vt: "HN", he: "PHCN", may: "HN", tg: 30, lien_tuc: 0 },
          { name: "Laser điều trị", vt: "LS", he: "PHCN", may: "LS", tg: 20, lien_tuc: 0 },
          { name: "Sóng ngắn điều trị", vt: "SN", he: "PHCN", may: "SN", tg: 20, lien_tuc: 0 },
          { name: "Tập vận động thụ động", vt: "VĐ-TD", he: "PHCN", may: "", tg: 30, lien_tuc: 0 },
          { name: "Tập vận động có trợ giúp", vt: "VĐ-TG", he: "PHCN", may: "", tg: 30, lien_tuc: 0 },
          { name: "Xoa bóp bấm huyệt điều trị", vt: "XBBH", he: "YHCT", may: "", tg: 30, lien_tuc: 0 },
          { name: "Điện châm điều trị", vt: "ĐC", he: "YHCT", may: "", tg: 30, lien_tuc: 0 },
          { name: "Cứu ngải điều trị", vt: "CN", he: "YHCT", may: "", tg: 20, lien_tuc: 0 },
          { name: "Thủy châm điều trị", vt: "TC", he: "YHCT", may: "", tg: 15, lien_tuc: 0 }
        ];
        sampleProcs.forEach((p, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO thu_thuat (unit_code, ten_thu_thuat, viet_tat, he, may, tg_thuc_hien, tg_thu_thuat, lien_tuc, order_idx, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).bind(uCode, p.name, p.vt, p.he, p.may, p.tg, p.tg, p.lien_tuc, idx + 1));
        });

        // E. Phác đồ điều trị mẫu (phac_do)
        const sampleProtocols = [
          { name: "Phác đồ Thoái hóa cột sống thắt lưng", procs: JSON.stringify(["Kéo giãn cột sống bằng máy", "Điện xung điều trị", "Chiếu đèn hồng ngoại"]) },
          { name: "Phác đồ Đau vai gáy / Cột sống cổ", procs: JSON.stringify(["Siêu âm điều trị", "Điện xung điều trị", "Xoa bóp bấm huyệt điều trị"]) },
          { name: "Phác đồ Di chứng tai biến / Liệt nửa người", procs: JSON.stringify(["Tập vận động thụ động", "Điện châm điều trị", "Xoa bóp bấm huyệt điều trị"]) },
          { name: "Phác đồ Hội chứng ống cổ tay", procs: JSON.stringify(["Laser điều trị", "Siêu âm điều trị", "Tập vận động có trợ giúp"]) }
        ];
        sampleProtocols.forEach((proto, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO phac_do (unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active)
            VALUES (?, ?, ?, ?, 1)
          `).bind(uCode, proto.name, proto.procs, idx + 1));
        });

        // F. Nhân sự mẫu (nhan_su)
        const sampleStaff = [
          { name: "KTV. Nguyễn Văn A", role: "KTV", system: "PHCN", priority: 1, time: "07:30-11:30, 13:00-16:30" },
          { name: "KTV. Trần Thị B", role: "KTV", system: "YHCT", priority: 2, time: "07:30-11:30, 13:00-16:30" },
          { name: "BS. Quản Lý Khoa", role: "BS", system: "ALL", priority: 0, time: "07:30-11:30, 13:00-16:30" }
        ];
        sampleStaff.forEach((s, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO nhan_su (unit_code, name, role, system, priority, thoi_gian_lam, trang_thai, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 'Đi làm', 1)
          `).bind(uCode, s.name, s.role, s.system, s.priority, s.time));
        });
      }

      // Thực thi toàn bộ batch trong 1 request Turso duy nhất!
      if (seedBatch.length > 0) {
        await db.batch(seedBatch);
      }

      return success({
        message: `Đã khởi tạo thành công đơn vị '${uName}' (${uCode}) với bộ danh mục mẫu 1-Click Onboarding!`,
        unit_code: uCode,
        seed_sample: seedSample
      });
    }

    case "updateTenant": {
      const payload = args[0] || {};
      const oldCode = String(payload.old_unit_code || payload.old_code || payload.unit_code || payload.code || "").trim().toLowerCase();
      let newCode = String(payload.new_unit_code || payload.unit_code || payload.code || "").trim().toLowerCase();
      if (!oldCode) return error("Thiếu mã đơn vị cần cập nhật!", 400);
      if (!newCode) newCode = oldCode;

      // Nếu người dùng đổi mã đơn vị sang mã mới
      if (newCode !== oldCode) {
        // Kiểm tra xem newCode đã tồn tại trong tenants chưa
        const checkExist = await db.prepare("SELECT unit_code FROM tenants WHERE unit_code = ?").bind(newCode).first();
        if (checkExist) {
          return error(`Mã đơn vị mới '${newCode}' đã tồn tại trên hệ thống! Vui lòng chọn mã khác.`, 400);
        }

        // Cập nhật cascade trên toàn bộ các bảng dữ liệu thực tế tồn tại trong DB
        const cascadeQueries = [
          db.prepare("UPDATE cai_dat SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE tai_khoan SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE nhan_su SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE may_moc SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE phong SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE thu_thuat SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE benh_nhan SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE lich_trinh SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE lich_su SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE gio_ban_cu SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE cham_cong SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE thong_ke SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE tim_ranh SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE tai_lieu SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE phac_do SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE audit_logs SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode)
        ];

        await db.batch(cascadeQueries);
      }

      const uCode = newCode;
      const targetOldCode = oldCode;

      const uName = payload.unit_name !== undefined && payload.unit_name !== null ? String(payload.unit_name).trim() : null;
      const uPlan = payload.plan_tier !== undefined && payload.plan_tier !== null ? String(payload.plan_tier).trim() : null;
      const uExp = payload.expires_at !== undefined && payload.expires_at !== null ? String(payload.expires_at).trim() : null;
      const uStaff = payload.max_staff !== undefined && payload.max_staff !== null ? parseInt(payload.max_staff, 10) : null;
      const uPats = payload.max_patients !== undefined && payload.max_patients !== null ? parseInt(payload.max_patients, 10) : null;
      const uPhone = payload.phone !== undefined && payload.phone !== null ? String(payload.phone).trim() : null;
      const uEmail = payload.email !== undefined && payload.email !== null ? String(payload.email).trim() : null;
      const uActive = payload.is_active !== undefined && payload.is_active !== null ? (payload.is_active ? 1 : 0) : null;
      const uLogo = payload.logo_url !== undefined && payload.logo_url !== null ? String(payload.logo_url).trim() : null;

      await db.prepare(`
        UPDATE tenants SET
          unit_code = ?,
          unit_name = COALESCE(?, unit_name),
          plan_tier = COALESCE(?, plan_tier),
          expires_at = COALESCE(?, expires_at),
          max_staff = COALESCE(?, max_staff),
          max_patients = COALESCE(?, max_patients),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          logo_url = COALESCE(?, logo_url),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE unit_code = ?
      `).bind(uCode, uName, uPlan, uExp, uStaff, uPats, uPhone, uEmail, uLogo, uActive, targetOldCode).run();

      // Nếu có cập nhật mật khẩu admin
      if (payload.admin_password && String(payload.admin_password).trim()) {
        const passHash = await hashPassword(String(payload.admin_password).trim());
        await db.prepare("INSERT OR REPLACE INTO tai_khoan (unit_code, username, password_hash, role, permissions) VALUES (?, 'admin', ?, 'Admin', 'ALL')").bind(uCode, passHash).run();
      }

      return success({ message: `Đã cập nhật thông tin đơn vị '${uCode}' thành công!`, unit_code: uCode, old_unit_code: oldCode });
    }

    case "toggleTenantStatus": {
      const uCode = String(args[0] || "").trim().toLowerCase();
      const isActive = args[1] ? 1 : 0;
      if (!uCode) return error("Thiếu mã đơn vị!", 400);
      await db.prepare("UPDATE tenants SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(isActive, uCode).run();
      return success({ message: `Đã ${isActive ? 'kích hoạt' : 'khóa'} đơn vị '${uCode}'!`, is_active: isActive });
    }

    case "deleteTenant": {
      const uCode = String(args[0] || "").trim().toLowerCase();
      if (!uCode) return error("Thiếu mã đơn vị!", 400);
      if (uCode === "bvtks-cs2") return error("Không thể xóa đơn vị gốc mặc định!", 400);

      // Xóa toàn bộ dữ liệu thuộc tenant này
      await db.batch([
        db.prepare("DELETE FROM tenants WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM nhan_su WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM may_moc WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM phong WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM thu_thuat WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM benh_nhan WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM lich_trinh WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM phac_do WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM tai_khoan WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM cai_dat WHERE unit_code = ?").bind(uCode)
      ]);

      return success({ message: `Đã xóa toàn bộ dữ liệu đơn vị '${uCode}'!` });
    }

    case "changePassword": {
      const payload = args[0] || {};
      const uName = String(payload.username || "").trim();
      const oldPass = String(payload.old_password || payload.oldPassword || "").trim();
      const newPass = String(payload.new_password || payload.newPassword || "").trim();
      const uCode = String(payload.unit_code || unitCode || "bvtks-cs2").trim().toLowerCase();

      if (!uName || !oldPass || !newPass) {
        return error("Vui lòng điền đầy đủ tên đăng nhập, mật khẩu cũ và mật khẩu mới!", 400);
      }
      if (newPass.length < 6) {
        return error("Mật khẩu mới phải có tối thiểu 6 ký tự!", 400);
      }

      // 1. Đổi mật khẩu Super Admin
      if (uName.toLowerCase() === "superadmin" || uName.toLowerCase() === "master") {
        let rec = null;
        try {
          rec = await db.prepare("SELECT id, value FROM cai_dat WHERE unit_code = 'MASTER' AND key = 'superadmin_password_hash'").first();
        } catch(e) {}
        if (!rec) {
          try {
            rec = await db.prepare("SELECT id, value FROM cai_dat WHERE key = 'superadmin_password_hash'").first();
          } catch(e) {}
        }

        let isOldValid = false;
        if (rec && rec.value) {
          isOldValid = await verifyPassword(oldPass, rec.value);
        } else if (env.INITIAL_SUPERADMIN_PASSWORD) {
          isOldValid = (oldPass === env.INITIAL_SUPERADMIN_PASSWORD);
        }

        if (!isOldValid) {
          return error("Mật khẩu hiện tại của Super Admin không chính xác!", 400);
        }

        const newHash = await hashPassword(newPass);
        if (rec && rec.id) {
          try {
            await db.prepare("UPDATE cai_dat SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(newHash, rec.id).run();
          } catch(e) {
            await db.prepare("UPDATE cai_dat SET value = ? WHERE id = ?").bind(newHash, rec.id).run();
          }
        } else {
          try {
            await db.prepare("INSERT INTO cai_dat (unit_code, key, value) VALUES ('MASTER', 'superadmin_password_hash', ?)").bind(newHash).run();
          } catch(e) {
            await db.prepare("INSERT OR REPLACE INTO cai_dat (key, value) VALUES ('superadmin_password_hash', ?)").bind(newHash).run();
          }
        }
        return success({ message: "Đã đổi mật khẩu Super Admin thành công!" });
      }

      // 2. Đổi mật khẩu tài khoản đơn vị
      const userRec = await db.prepare("SELECT id, password_hash FROM tai_khoan WHERE unit_code = ? AND username = ?").bind(uCode, uName).first();
      if (!userRec) {
        return error("Không tìm thấy tài khoản trong đơn vị này!", 404);
      }

      const isOldValid = await verifyPassword(oldPass, userRec.password_hash);
      if (!isOldValid) {
        return error("Mật khẩu cũ không chính xác!", 400);
      }

      const newHash = await hashPassword(newPass);
      await db.prepare("UPDATE tai_khoan SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(newHash, userRec.id).run();
      return success({ message: "Đã đổi mật khẩu thành công!" });
    }

    case "resetTenantAdminPassword": {
      const uCode = String(args[0] || "").trim().toLowerCase();
      const newPass = String(args[1] || "").trim();
      if (!uCode || !newPass) return error("Thiếu mã đơn vị hoặc mật khẩu mới!", 400);
      if (newPass.length < 6) return error("Mật khẩu mới phải có tối thiểu 6 ký tự!", 400);

      const passHash = await hashPassword(newPass);
      await db.prepare("INSERT OR REPLACE INTO tai_khoan (unit_code, username, password_hash, role, permissions) VALUES (?, 'admin', ?, 'Admin', 'ALL')").bind(uCode, passHash).run();
      return success({ message: `Đã đặt lại mật khẩu admin cho đơn vị '${uCode}' thành công!` });
    }

    // ============================================================
    // 1. BOOTSTRAP TOÀN DIỆN
    // ============================================================

    case "getAccounts": {
      try {
        const recs = await db.prepare("SELECT id, username, role, permissions, updated_at FROM tai_khoan WHERE unit_code = ? ORDER BY id ASC").bind(unitCode).all();
        let list = (recs.results || []).map(r => ({
          id: r.id,
          user: r.username,
          username: r.username,
          role: (r.role && String(r.role).toLowerCase() === 'admin') ? 'Admin' : 'User',
          perms: r.permissions || 'ALL',
          permissions: r.permissions || 'ALL',
          hasPassword: true,
          updated_at: r.updated_at
        }));

        if (list.length === 0) {
          const defaultAdminHash = await hashPassword("admin");
          try {
            await db.batch([
              db.prepare("INSERT OR IGNORE INTO tai_khoan (unit_code, username, password_hash, role, permissions, updated_at) VALUES (?, 'admin', ?, 'admin', 'ALL', CURRENT_TIMESTAMP)").bind(unitCode, defaultAdminHash),
              db.prepare("INSERT OR IGNORE INTO tai_khoan (unit_code, username, password_hash, role, permissions, updated_at) VALUES (?, 'admin_yhct', ?, 'admin', 'ALL', CURRENT_TIMESTAMP)").bind(unitCode, defaultAdminHash)
            ]);
          } catch(errSeed) {}
          list = [
            { id: 1, user: "admin", username: "admin", role: "Admin", perms: "ALL", permissions: "ALL", hasPassword: true },
            { id: 2, user: "admin_yhct", username: "admin_yhct", role: "Admin", perms: "ALL", permissions: "ALL", hasPassword: true }
          ];
        }
        return success(list);
      } catch(e) {
        return success([
          { id: 1, user: "admin", username: "admin", role: "Admin", perms: "ALL", permissions: "ALL", hasPassword: true },
          { id: 2, user: "admin_yhct", username: "admin_yhct", role: "Admin", perms: "ALL", permissions: "ALL", hasPassword: true }
        ]);
      }
    }

    case "saveAccount": {
      let id = "", username = "", password = "", role = "User", permissions = "ALL";
      if (typeof args[0] === "object" && args[0] !== null) {
        id = args[0].id || "";
        username = String(args[0].username || args[0].user || "").trim();
        password = String(args[0].password || args[0].pass || "").trim();
        role = String(args[0].role || "User").trim();
        permissions = String(args[0].permissions || args[0].perms || "ALL").trim();
      } else {
        id = String(args[0] || "").trim();
        username = String(args[1] || "").trim();
        password = String(args[2] || "").trim();
        role = String(args[3] || "User").trim();
        permissions = String(args[4] || "ALL").trim();
      }

      if (!username && id) {
        const byId = await db.prepare("SELECT username FROM tai_khoan WHERE unit_code = ? AND id = ?").bind(unitCode, id).first();
        if (byId) username = byId.username;
      }

      if (!username) return error("Tên tài khoản không được để trống!", 400);

      // 🛡️ Không cho phép tạo hoặc thăng cấp role SUPER_ADMIN từ tài khoản thường/Admin đơn vị
      let normRole = (role.toLowerCase() === 'admin') ? 'Admin' : 'User';
      if (tokenPayload && tokenPayload.role === "SUPER_ADMIN" && role === "SUPER_ADMIN") {
        normRole = "SUPER_ADMIN";
      }

      let existing = null;
      if (id) {
        existing = await db.prepare("SELECT id, username FROM tai_khoan WHERE unit_code = ? AND id = ?").bind(unitCode, id).first();
      }
      if (!existing && username) {
        existing = await db.prepare("SELECT id, username FROM tai_khoan WHERE unit_code = ? AND username = ?").bind(unitCode, username).first();
      }

      if (existing) {
        if (password) {
          const passHash = await hashPassword(password);
          await db.prepare("UPDATE tai_khoan SET username = ?, password_hash = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND id = ?")
            .bind(username, passHash, normRole, permissions, unitCode, existing.id).run();
        } else {
          await db.prepare("UPDATE tai_khoan SET username = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND id = ?")
            .bind(username, normRole, permissions, unitCode, existing.id).run();
        }
      } else {
        if (!password) return error("Vui lòng nhập mật khẩu cho tài khoản mới!", 400);
        const passHash = await hashPassword(password);
        await db.prepare("INSERT INTO tai_khoan (unit_code, username, password_hash, role, permissions, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")
          .bind(unitCode, username, passHash, normRole, permissions).run();
      }
      return success({ message: "Đã lưu tài khoản thành công!" });
    }

    case "deleteAccount": {
      const target = String(args[0] || "").trim();
      if (!target) return error("Tài khoản không hợp lệ!", 400);
      if (target.toLowerCase() === "admin" || target.toLowerCase() === "admin_yhct" || target.toLowerCase() === "superadmin") {
        return error("Không thể xóa tài khoản Quản trị viên tối cao!", 400);
      }
      await db.prepare("DELETE FROM tai_khoan WHERE unit_code = ? AND (id = ? OR username = ?)").bind(unitCode, target, target).run();
      return success({ message: "Đã xóa tài khoản thành công!" });
    }

    case "verifyLogin":

    case "checkLogin": {
      let username = "";
      let password = "";
      let reqUnit = unitCode;

      if (typeof args[0] === "object" && args[0] !== null) {
        username = String(args[0].username || args[0].user || "").trim();
        password = String(args[0].password || args[0].pass || "").trim();
        if (args[0].unit_code || args[0].unitCode) {
          reqUnit = String(args[0].unit_code || args[0].unitCode).trim().toLowerCase();
        }
      } else {
        username = String(args[0] || "").trim();
        password = String(args[1] || "").trim();
        if (args[2]) {
          reqUnit = String(args[2]).trim().toLowerCase();
        }
      }

      if (!username) return error("Vui lòng nhập tên đăng nhập!", 400);
      if (!password) return error("Vui lòng nhập mật khẩu!", 400);
      if (!reqUnit) reqUnit = "bvtks-cs2";

      // 🛡️ Chống Brute-force: Kiểm tra giới hạn số lần thử theo IP và tài khoản
      const clientIp = (request && request.headers && typeof request.headers.get === "function") 
        ? (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown-ip")
        : "unknown-ip";
      const rateLimitKey = `${clientIp}:${username.toLowerCase()}`;
      const rlCheck = await checkLoginRateLimit(db, rateLimitKey);
      if (!rlCheck.allowed) {
        return error(`Tài khoản hoặc địa chỉ IP này đã nhập sai mật khẩu quá 5 lần liên tiếp. Vui lòng thử lại sau ${rlCheck.remainingMins} phút!`, 429);
      }

      const jwtSecret = getJwtSecret(env);

      // 👑 1. Xác thực tài khoản Super Admin (Master System Owner)
      if (username.toLowerCase() === "superadmin" || username.toLowerCase() === "master") {
        let rec = null;
        try {
          rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = 'MASTER' AND key = 'superadmin_password_hash'").first();
        } catch(e) {}
        if (!rec) {
          try {
            rec = await db.prepare("SELECT value FROM cai_dat WHERE key = 'superadmin_password_hash'").first();
          } catch(e) {}
        }
        let expectedHash = rec?.value;
        if (!expectedHash) {
          // Bắt buộc cấu hình mật khẩu ban đầu qua biến môi trường INITIAL_SUPERADMIN_PASSWORD
          if (env.INITIAL_SUPERADMIN_PASSWORD) {
            expectedHash = await hashPassword(env.INITIAL_SUPERADMIN_PASSWORD);
            await setCaiDat(db, "MASTER", "superadmin_password_hash", expectedHash);
          } else {
            return error("Tài khoản Super Admin chưa được thiết lập mật khẩu khởi tạo trong hệ thống. Vui lòng cấu hình biến môi trường INITIAL_SUPERADMIN_PASSWORD trên Cloudflare Worker!", 403);
          }
        }

        const isSuperAdminValid = await verifyPassword(password, expectedHash, env);
        if (isSuperAdminValid) {
          await recordLoginSuccess(db, rateLimitKey);
          // Tự động nâng cấp transparently sang PBKDF2 nếu vẫn là hash legacy SHA-256
          if (isLegacyHash(expectedHash)) {
            try {
              const upgradedHash = await hashPassword(password);
              await setCaiDat(db, "MASTER", "superadmin_password_hash", upgradedHash);
            } catch (errUp) {
              console.warn("Failed to transparently upgrade superadmin hash:", errUp);
            }
          }

          const tokenPayload = {
            sub: "superadmin",
            username: username,
            role: "SUPER_ADMIN",
            name: "Chủ Sở Hữu Phần Mềm SaaS",
            unit_code: "MASTER",
            unit_name: "Hệ Thống Quản Trị Trung Tâm SaaS",
            plan_tier: "MASTER",
            permissions: "SUPER_ADMIN",
            exp: Math.floor(Date.now() / 1000) + (7 * 86400)
          };
          const token = await signJwt(tokenPayload, jwtSecret);

          return success({
            token: token,
            username: username,
            role: "SUPER_ADMIN",
            name: "Chủ Sở Hữu Phần Mềm SaaS",
            unit_code: "MASTER",
            unit_name: "Hệ Thống Quản Trị Trung Tâm SaaS",
            plan_tier: "MASTER",
            permissions: "SUPER_ADMIN"
          });
        }

        // Đăng nhập sai: phạt delay 1000ms + ghi nhận lỗi vào rate limiter
        await recordLoginFailure(db, rateLimitKey);
        await new Promise(r => setTimeout(r, 1000));
        return error("Mật khẩu tài khoản Super Admin không chính xác!", 401);
      }

      // 🏥 2. Kiểm tra Đơn Vị (Tenant Validation)
      if (reqUnit === "master" || reqUnit === "MASTER") {
        return error("Đơn vị 'MASTER' chỉ dành riêng cho tài khoản Super Admin!", 400);
      }

      let tenant = await db.prepare("SELECT * FROM tenants WHERE unit_code = ?").bind(reqUnit).first();
      
      // Nếu là đơn vị gốc bvtks-cs2 mà chưa có trong DB tenants thì tự tạo
      if (!tenant && reqUnit === "bvtks-cs2") {
        await db.prepare("INSERT OR IGNORE INTO tenants (unit_code, unit_name, plan_tier, expires_at, is_active) VALUES ('bvtks-cs2', 'Bệnh viện Than - Khoáng sản Cơ sở 2', 'ENTERPRISE', '2099-12-31', 1)").run();
        tenant = await db.prepare("SELECT * FROM tenants WHERE unit_code = 'bvtks-cs2'").first();
      }

      if (!tenant) {
        return error(`Mã đơn vị '${reqUnit}' không tồn tại trên hệ thống! Vui lòng kiểm tra lại.`, 404);
      }
      if (tenant.is_active === 0) {
        return error(`Đơn vị '${tenant.unit_name}' đang tạm khóa. Vui lòng liên hệ quản trị viên để mở khóa!`, 403);
      }

      // Kiểm tra hạn sử dụng bản quyền
      if (tenant.expires_at) {
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        if (tenant.expires_at < nowVN) {
          return error(`Bản quyền của đơn vị '${tenant.unit_name}' đã hết hạn vào ngày ${tenant.expires_at}. Vui lòng liên hệ để gia hạn!`, 403);
        }
      }

      // 🔑 3. Kiểm tra tài khoản trong bảng tai_khoan theo unit_code
      try {
        let user = await db.prepare("SELECT id, username, password_hash, role, permissions FROM tai_khoan WHERE unit_code = ? AND username = ?").bind(reqUnit, username).first();
        
        // Khởi tạo an toàn cho đơn vị mặc định nếu tài khoản admin chưa có trong DB
        if (!user && reqUnit === "bvtks-cs2" && (username.toLowerCase() === "admin" || username.toLowerCase() === "admin_yhct")) {
          const initHash = await hashPassword("admin");
          await db.prepare("INSERT OR IGNORE INTO tai_khoan (unit_code, username, password_hash, role, permissions, updated_at) VALUES ('bvtks-cs2', ?, ?, 'Admin', 'ALL', CURRENT_TIMESTAMP)").bind(username, initHash).run();
          user = await db.prepare("SELECT id, username, password_hash, role, permissions FROM tai_khoan WHERE unit_code = 'bvtks-cs2' AND username = ?").bind(username).first();
        }

        if (user) {
          const isUserValid = await verifyPassword(password, user.password_hash, env);
          if (isUserValid) {
            await recordLoginSuccess(db, rateLimitKey);
            // Tự động nâng cấp transparently sang PBKDF2 nếu vẫn là hash legacy SHA-256
            if (isLegacyHash(user.password_hash)) {
              try {
                const upgradedHash = await hashPassword(password);
                await db.prepare("UPDATE tai_khoan SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(upgradedHash, user.id).run();
              } catch (errUp) {
                console.warn("Failed to transparently upgrade user hash:", errUp);
              }
            }

            const tokenPayload = {
              sub: String(user.id),
              username: user.username,
              role: user.role || "Admin",
              name: user.username,
              unit_code: tenant.unit_code,
              unit_name: tenant.unit_name,
              plan_tier: tenant.plan_tier || "PRO",
              permissions: user.permissions || "ALL",
              exp: Math.floor(Date.now() / 1000) + (7 * 86400)
            };
            const token = await signJwt(tokenPayload, jwtSecret);
            const subInfo = calculateSubscriptionInfo(tenant);

            return success({
              token: token,
              username: user.username,
              role: user.role || "Admin",
              name: user.username,
              unit_code: tenant.unit_code,
              unit_name: tenant.unit_name,
              logo_url: tenant.logo_url || "",
              plan_tier: tenant.plan_tier || "PRO",
              plan_name: subInfo.plan_name,
              days_left: subInfo.days_left,
              is_expiring_soon: subInfo.is_expiring_soon,
              expires_at: tenant.expires_at,
              permissions: user.permissions || "ALL"
            });
          }
        }
      } catch(e) {
        console.error("Login verification DB error:", e);
      }

      // Đăng nhập thất bại: phạt delay 1000ms + ghi nhận lỗi vào rate limiter
      await recordLoginFailure(db, rateLimitKey);
      await new Promise(r => setTimeout(r, 1000));
      return error("Tên đăng nhập hoặc mật khẩu không chính xác!", 401);
    }

    default:
      return null;
  }
}
