// Cloudflare Worker D1 / Turso Schema Definition and Self-Healing Migrations

let schemaEnsured = false;
export async function ensureSchema(db) {
  if (schemaEnsured || !db) return;
  try {
    const chk = await db.prepare("SELECT 1 FROM lich_su_dinh_muc LIMIT 1").all().catch(() => null);
    if (chk && Array.isArray(chk.results)) {
      schemaEnsured = true;
      return;
    }
  } catch(e) {}
  try {
    const stmts = [
      db.prepare(`CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT UNIQUE NOT NULL,
        unit_name TEXT NOT NULL,
        logo_url TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        plan_tier TEXT DEFAULT 'PRO',
        max_staff INTEGER DEFAULT 30,
        max_patients INTEGER DEFAULT 150,
        expires_at TEXT NOT NULL DEFAULT '2099-12-31',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS cai_dat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, key)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS tai_khoan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        permissions TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, username)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS nhan_su (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'KTV',
        system TEXT NOT NULL DEFAULT 'PHCN',
        skills TEXT DEFAULT '',
        fixed_busy TEXT DEFAULT '',
        temp_busy TEXT DEFAULT '',
        his_name TEXT DEFAULT '',
        priority INTEGER DEFAULT 0,
        trang_thai TEXT DEFAULT 'Đi làm',
        thoi_gian_lam TEXT DEFAULT '07:30-11:30, 13:00-16:30',
        nguoi_thay_the TEXT DEFAULT 'Không',
        is_active INTEGER DEFAULT 1,
        order_idx INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, name)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS may_moc (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_loai TEXT NOT NULL,
        ma_may TEXT NOT NULL,
        trang_thai TEXT DEFAULT 'Sẵn sàng',
        order_idx INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, ma_may)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS phong (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_phong TEXT NOT NULL,
        bac_si TEXT DEFAULT '',
        ktv TEXT DEFAULT '',
        danh_sach_may TEXT DEFAULT '',
        so_giuong INTEGER DEFAULT 0,
        danh_sach_giuong TEXT DEFAULT '',
        order_idx INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, ten_phong)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS thu_thuat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_thu_thuat TEXT NOT NULL,
        viet_tat TEXT DEFAULT '',
        he TEXT DEFAULT 'PHCN',
        phan_loai TEXT DEFAULT '',
        may TEXT DEFAULT '',
        tg_thuc_hien INTEGER DEFAULT 30,
        tg_thuc_hien_max INTEGER DEFAULT 0,
        tg_thu_thuat INTEGER DEFAULT 30,
        tg_thu_thuat_max INTEGER DEFAULT 0,
        khoang_cach INTEGER DEFAULT 0,
        can_rut_may INTEGER DEFAULT 0,
        can_nguoi_phu INTEGER DEFAULT 0,
        ds_nguoi_phu TEXT DEFAULT '',
        lien_tuc INTEGER DEFAULT 0,
        lich_su_dinh_muc TEXT DEFAULT '[]',
        order_idx INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, ten_thu_thuat)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS benh_nhan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        name TEXT NOT NULL,
        age INTEGER DEFAULT 0,
        gender TEXT DEFAULT 'Nam',
        room TEXT DEFAULT '',
        bed TEXT DEFAULT '',
        arrive_time TEXT DEFAULT '07:30',
        leave_time TEXT DEFAULT '',
        thu_thuat TEXT NOT NULL DEFAULT '[]',
        status TEXT DEFAULT 'Chưa xếp',
        ngay_vao TEXT DEFAULT '',
        gio_ban TEXT DEFAULT '',
        is_saturday INTEGER DEFAULT 0,
        order_idx INTEGER DEFAULT 0,
        loai_bn TEXT DEFAULT 'NoiTru',
        buoi_dieu_tri TEXT DEFAULT 'Sang',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS lich_trinh (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        date TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        dob TEXT DEFAULT '',
        room TEXT DEFAULT '',
        procedure_name TEXT NOT NULL,
        staff_name TEXT DEFAULT '',
        sub_staff_name TEXT DEFAULT '',
        machine_name TEXT DEFAULT '',
        bed TEXT DEFAULT '',
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_saturday INTEGER DEFAULT 0,
        order_idx INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS lich_su (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        date TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        dob TEXT DEFAULT '',
        room TEXT DEFAULT '',
        procedure_name TEXT NOT NULL,
        staff_name TEXT DEFAULT '',
        sub_staff_name TEXT DEFAULT '',
        machine_name TEXT DEFAULT '',
        bed TEXT DEFAULT '',
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS gio_ban_cu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        date TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        busy_ranges TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS gio_ban_chung_cu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        date TEXT NOT NULL,
        target_type TEXT NOT NULL DEFAULT 'nhan_su',
        name TEXT NOT NULL,
        dob TEXT DEFAULT '',
        busy_ranges TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS cham_cong (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        month_year TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, month_year)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS thong_ke (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        month_year TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, month_year)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS tim_ranh (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        procedure_name TEXT DEFAULT '',
        start_time TEXT DEFAULT '',
        end_time TEXT DEFAULT '',
        staff_name TEXT DEFAULT '',
        machine_name TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS tai_lieu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        doc_number TEXT DEFAULT '',
        title TEXT DEFAULT '',
        agency TEXT DEFAULT '',
        signed_date TEXT DEFAULT '',
        view_link TEXT DEFAULT '',
        download_link TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS phac_do (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_phac_do TEXT NOT NULL,
        danh_sach_thu_thuat TEXT NOT NULL DEFAULT '[]',
        order_idx INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, ten_phac_do)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        timestamp TEXT NOT NULL,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS payment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code TEXT UNIQUE NOT NULL,
        unit_code TEXT NOT NULL,
        plan_tier TEXT NOT NULL,
        amount INTEGER NOT NULL,
        content TEXT NOT NULL,
        bank_account TEXT DEFAULT '0392283473',
        bank_name TEXT DEFAULT 'MBBank',
        status TEXT DEFAULT 'PENDING',
        transaction_ref TEXT DEFAULT '',
        gateway TEXT DEFAULT 'VIETQR',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed_at DATETIME
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (
        client_key TEXT PRIMARY KEY,
        attempt_count INTEGER DEFAULT 1,
        last_attempt INTEGER NOT NULL,
        locked_until INTEGER DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS lich_su_dinh_muc (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_thu_thuat TEXT NOT NULL,
        tu_ngay TEXT NOT NULL,
        den_ngay TEXT NOT NULL,
        tg_thuc_hien_min INTEGER DEFAULT 0,
        tg_thuc_hien_max INTEGER DEFAULT 0,
        tg_thu_thuat_min INTEGER DEFAULT 0,
        tg_thu_thuat_max INTEGER DEFAULT 0,
        lien_tuc TEXT DEFAULT 'Không',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
    ];
    for (const stmt of stmts) {
      try {
        await stmt.run();
      } catch (eStmt) {}
    }

    // Multi-tenant Migration safe column additions & Indexes
    const migrations = [
      "INSERT OR IGNORE INTO tenants (unit_code, unit_name, plan_tier, expires_at, is_active) VALUES ('bvtks-cs2', 'Bệnh viện Than - Khoáng sản Cơ sở 2', 'ENTERPRISE', '2099-12-31', 1)",
      "INSERT OR IGNORE INTO tenants (unit_code, unit_name, plan_tier, expires_at, is_active) VALUES ('master', 'Hệ Thống Quản Trị Trung Tâm SaaS', 'MASTER', '2099-12-31', 1)",
      "ALTER TABLE cai_dat ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE tai_khoan ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE nhan_su ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE may_moc ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE phong ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE thu_thuat ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE benh_nhan ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE lich_trinh ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE lich_su ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE gio_ban_cu ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE gio_ban_chung_cu ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE cham_cong ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE thong_ke ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE tim_ranh ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE tai_lieu ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE phac_do ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE audit_logs ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_cai_dat_unit_key ON cai_dat(unit_code, key)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_code ON tenants(unit_code)",
      "CREATE INDEX IF NOT EXISTS idx_benh_nhan_unit ON benh_nhan(unit_code, is_saturday, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_nhan_su_unit ON nhan_su(unit_code, is_active, priority)",
      "CREATE INDEX IF NOT EXISTS idx_may_moc_unit ON may_moc(unit_code, is_active, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_phong_unit ON phong(unit_code, is_active, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_thu_thuat_unit ON thu_thuat(unit_code, is_active, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_phac_do_unit ON phac_do(unit_code, is_active, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_lich_trinh_unit ON lich_trinh(unit_code, date)",
      "CREATE INDEX IF NOT EXISTS idx_lich_su_unit ON lich_su(unit_code, date)",
      "CREATE INDEX IF NOT EXISTS idx_gio_ban_cu_unit ON gio_ban_cu(unit_code, date)",
      "CREATE INDEX IF NOT EXISTS idx_gio_ban_chung_cu_unit ON gio_ban_chung_cu(unit_code, date)",
      "CREATE INDEX IF NOT EXISTS idx_gio_ban_chung_cu_lookup ON gio_ban_chung_cu(unit_code, date, target_type)",
      "CREATE INDEX IF NOT EXISTS idx_tai_khoan_unit ON tai_khoan(unit_code, username)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_cham_cong_unit_my ON cham_cong(unit_code, month_year)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_thong_ke_unit_my ON thong_ke(unit_code, month_year)",
      "CREATE INDEX IF NOT EXISTS idx_lsdm_unit_tt ON lich_su_dinh_muc(unit_code, ten_thu_thuat)",
      "ALTER TABLE may_moc ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE may_moc ADD COLUMN order_idx INTEGER DEFAULT 0",
      "ALTER TABLE phong ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE phong ADD COLUMN order_idx INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE thu_thuat ADD COLUMN order_idx INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN tg_thu_thuat_max INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN tg_thuc_hien_max INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN lien_tuc INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN lich_su_dinh_muc TEXT DEFAULT '[]'",
      "ALTER TABLE nhan_su ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE nhan_su ADD COLUMN temp_busy TEXT DEFAULT ''",
      "ALTER TABLE nhan_su ADD COLUMN his_name TEXT DEFAULT ''",
      "ALTER TABLE nhan_su ADD COLUMN priority INTEGER DEFAULT 0",
      "ALTER TABLE nhan_su ADD COLUMN trang_thai TEXT DEFAULT 'Đi làm'",
      "ALTER TABLE nhan_su ADD COLUMN thoi_gian_lam TEXT DEFAULT '07:30-11:30, 13:00-16:30'",
      "ALTER TABLE nhan_su ADD COLUMN nguoi_thay_the TEXT DEFAULT 'Không'",
      "ALTER TABLE benh_nhan ADD COLUMN ngay_vao TEXT DEFAULT ''",
      "ALTER TABLE benh_nhan ADD COLUMN gio_ban TEXT DEFAULT ''",
      "ALTER TABLE benh_nhan ADD COLUMN is_saturday INTEGER DEFAULT 0",
      "UPDATE thu_thuat SET viet_tat = 'TKT' WHERE (viet_tat = 'TTK' OR viet_tat = 'tk') AND (ten_thu_thuat LIKE '%kháng trở%' OR ten_thu_thuat LIKE '%khang tro%')",
    ];
    for (const sql of migrations) {
      try {
        await db.prepare(sql).run();
      } catch(e) {}
    }

    // Multi-tenant auto-migration: chuyển dữ liệu từ gio_ban_cu sang gio_ban_chung_cu và lọc sạch dữ liệu ảo
    try {
      const cntChung = await db.prepare("SELECT count(*) as total FROM gio_ban_chung_cu").first();
      if (!cntChung || cntChung.total === 0) {
        // 1. Chuyển nhân sự (BS/KTV)
        await db.prepare(`
          INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, busy_ranges, created_at)
          SELECT unit_code, date, 'nhan_su', staff_name, busy_ranges, created_at
          FROM gio_ban_cu
          WHERE (staff_name LIKE 'BS%' OR staff_name LIKE 'Bs%' OR staff_name LIKE 'KTV%')
            AND staff_name != 'ID' AND busy_ranges != 'ID' AND busy_ranges IS NOT NULL AND busy_ranges != ''
        `).run();

        // 2. Chuyển bệnh nhân
        await db.prepare(`
          INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, busy_ranges, created_at)
          SELECT unit_code, date, 'benh_nhan', staff_name, busy_ranges, created_at
          FROM gio_ban_cu
          WHERE staff_name NOT LIKE 'BS%' AND staff_name NOT LIKE 'Bs%' AND staff_name NOT LIKE 'KTV%'
            AND staff_name != 'ID' AND busy_ranges != 'ID' AND busy_ranges IS NOT NULL AND busy_ranges != ''
        `).run();
      }
    } catch(migErr) {
      console.warn("[Migrate gio_ban_chung_cu warning]:", migErr);
    }

    schemaEnsured = true;
    
    // Multi-tenant table unique constraint migrations
    try {
      // 1. tai_khoan
      const tkSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tai_khoan'").first();
      if (tkSql && tkSql.sql && (tkSql.sql.includes("username TEXT UNIQUE") || (tkSql.sql.includes("UNIQUE (username)") || tkSql.sql.includes("UNIQUE(username)")))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS tai_khoan_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            permissions TEXT DEFAULT '',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, username)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO tai_khoan_v4 (id, unit_code, username, password_hash, role, permissions, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), username, password_hash, role, permissions, updated_at FROM tai_khoan
        `).run();
        await db.prepare("DROP TABLE tai_khoan").run();
        await db.prepare("ALTER TABLE tai_khoan_v4 RENAME TO tai_khoan").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_tai_khoan_unit ON tai_khoan(unit_code, username)").run();
      }
    } catch(e) {
      console.warn("[Migrate tai_khoan error]:", e);
    }

    try {
      // 2. cai_dat
      await db.prepare("DELETE FROM cai_dat WHERE id NOT IN (SELECT MAX(id) FROM cai_dat GROUP BY unit_code, key)").run().catch(() => {});
      await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_cai_dat_unit_key ON cai_dat(unit_code, key)").run().catch(() => {});
      await db.prepare("INSERT OR IGNORE INTO cai_dat (unit_code, key, value) VALUES ('bvtks-cs2', 'data_version', '1')").run().catch(() => {});
      await db.prepare("INSERT OR IGNORE INTO cai_dat (unit_code, key, value) VALUES ('bvtks_cs2', 'data_version', '1')").run().catch(() => {});

      const cdSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='cai_dat'").first();
      if (cdSql && cdSql.sql && (cdSql.sql.includes("key TEXT UNIQUE") || (cdSql.sql.includes("UNIQUE (key)") || cdSql.sql.includes("UNIQUE(key)")))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS cai_dat_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, key)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO cai_dat_v4 (id, unit_code, key, value, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), key, value, updated_at FROM cai_dat
        `).run();
        await db.prepare("DROP TABLE cai_dat").run();
        await db.prepare("ALTER TABLE cai_dat_v4 RENAME TO cai_dat").run();
        await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_cai_dat_unit_key ON cai_dat(unit_code, key)").run();
      }
    } catch(e) {
      console.warn("[Migrate cai_dat error]:", e);
    }

    try {
      // 3. nhan_su
      const nsSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='nhan_su'").first();
      if (nsSql && nsSql.sql && (nsSql.sql.includes("name TEXT UNIQUE") || (nsSql.sql.includes("UNIQUE (name)") || nsSql.sql.includes("UNIQUE(name)")))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS nhan_su_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'KTV',
            system TEXT NOT NULL DEFAULT 'PHCN',
            skills TEXT DEFAULT '',
            fixed_busy TEXT DEFAULT '',
            temp_busy TEXT DEFAULT '',
            his_name TEXT DEFAULT '',
            priority INTEGER DEFAULT 0,
            trang_thai TEXT DEFAULT 'Đi làm',
            thoi_gian_lam TEXT DEFAULT '07:30-11:30, 13:00-16:30',
            nguoi_thay_the TEXT DEFAULT 'Không',
            is_active INTEGER DEFAULT 1,
            order_idx INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, name)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO nhan_su_v4 (id, unit_code, name, role, system, skills, fixed_busy, temp_busy, his_name, priority, trang_thai, thoi_gian_lam, nguoi_thay_the, is_active, order_idx, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), name, role, system, skills, fixed_busy, temp_busy, his_name, priority, trang_thai, thoi_gian_lam, nguoi_thay_the, is_active, order_idx, updated_at FROM nhan_su
        `).run();
        await db.prepare("DROP TABLE nhan_su").run();
        await db.prepare("ALTER TABLE nhan_su_v4 RENAME TO nhan_su").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_nhan_su_unit ON nhan_su(unit_code, name)").run();
      }
    } catch(e) {
      console.warn("[Migrate nhan_su error]:", e);
    }

    try {
      // 4. may_moc
      const mmSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='may_moc'").first();
      if (mmSql && mmSql.sql && (mmSql.sql.includes("ma_may TEXT UNIQUE") || mmSql.sql.includes("UNIQUE (ma_may)") || mmSql.sql.includes("UNIQUE(ma_may)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS may_moc_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            ten_loai TEXT NOT NULL,
            ma_may TEXT NOT NULL,
            trang_thai TEXT DEFAULT 'Sẵn sàng',
            order_idx INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, ma_may)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO may_moc_v4 (id, unit_code, ten_loai, ma_may, trang_thai, order_idx, is_active, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), ten_loai, ma_may, trang_thai, order_idx, is_active, updated_at FROM may_moc
        `).run();
        await db.prepare("DROP TABLE may_moc").run();
        await db.prepare("ALTER TABLE may_moc_v4 RENAME TO may_moc").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_may_moc_unit ON may_moc(unit_code, ma_may)").run();
      }
    } catch(e) {
      console.warn("[Migrate may_moc error]:", e);
    }

    try {
      // 5. phong
      const pSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='phong'").first();
      if (pSql && pSql.sql && (pSql.sql.includes("ten_phong TEXT UNIQUE") || pSql.sql.includes("UNIQUE (ten_phong)") || pSql.sql.includes("UNIQUE(ten_phong)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS phong_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            ten_phong TEXT NOT NULL,
            bac_si TEXT DEFAULT '',
            ktv TEXT DEFAULT '',
            danh_sach_may TEXT DEFAULT '',
            so_giuong INTEGER DEFAULT 0,
            danh_sach_giuong TEXT DEFAULT '',
            order_idx INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, ten_phong)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO phong_v4 (id, unit_code, ten_phong, bac_si, ktv, danh_sach_may, so_giuong, danh_sach_giuong, order_idx, is_active, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), ten_phong, bac_si, ktv, danh_sach_may, so_giuong, danh_sach_giuong, order_idx, is_active, updated_at FROM phong
        `).run();
        await db.prepare("DROP TABLE phong").run();
        await db.prepare("ALTER TABLE phong_v4 RENAME TO phong").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_phong_unit ON phong(unit_code, ten_phong)").run();
      }
    } catch(e) {
      console.warn("[Migrate phong error]:", e);
    }

    try {
      // 6. thu_thuat
      const ttSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='thu_thuat'").first();
      if (ttSql && ttSql.sql && (ttSql.sql.includes("ten_thu_thuat TEXT UNIQUE") || ttSql.sql.includes("UNIQUE (ten_thu_thuat)") || ttSql.sql.includes("UNIQUE(ten_thu_thuat)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS thu_thuat_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            ten_thu_thuat TEXT NOT NULL,
            viet_tat TEXT DEFAULT '',
            he TEXT DEFAULT 'PHCN',
            phan_loai TEXT DEFAULT '',
            may TEXT DEFAULT '',
            tg_thuc_hien INTEGER DEFAULT 30,
            tg_thuc_hien_max INTEGER DEFAULT 0,
            tg_thu_thuat INTEGER DEFAULT 30,
            tg_thu_thuat_max INTEGER DEFAULT 0,
            khoang_cach INTEGER DEFAULT 0,
            can_rut_may INTEGER DEFAULT 0,
            can_nguoi_phu INTEGER DEFAULT 0,
            ds_nguoi_phu TEXT DEFAULT '',
            lien_tuc INTEGER DEFAULT 0,
            order_idx INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, ten_thu_thuat)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO thu_thuat_v4 (id, unit_code, ten_thu_thuat, viet_tat, he, phan_loai, may, tg_thuc_hien, tg_thuc_hien_max, tg_thu_thuat, tg_thu_thuat_max, khoang_cach, can_rut_may, can_nguoi_phu, ds_nguoi_phu, lien_tuc, order_idx, is_active, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), ten_thu_thuat, viet_tat, he, phan_loai, may, tg_thuc_hien, tg_thuc_hien_max, tg_thu_thuat, tg_thu_thuat_max, khoang_cach, can_rut_may, can_nguoi_phu, ds_nguoi_phu, lien_tuc, order_idx, is_active, updated_at FROM thu_thuat
        `).run();
        await db.prepare("DROP TABLE thu_thuat").run();
        await db.prepare("ALTER TABLE thu_thuat_v4 RENAME TO thu_thuat").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_thu_thuat_unit ON thu_thuat(unit_code, ten_thu_thuat)").run();
      }
    } catch(e) {
      console.warn("[Migrate thu_thuat error]:", e);
    }

    try {
      // 7. phac_do
      const pdSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='phac_do'").first();
      if (pdSql && pdSql.sql && (pdSql.sql.includes("ten_phac_do TEXT UNIQUE") || pdSql.sql.includes("UNIQUE (ten_phac_do)") || pdSql.sql.includes("UNIQUE(ten_phac_do)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS phac_do_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            ten_phac_do TEXT NOT NULL,
            danh_sach_thu_thuat TEXT NOT NULL DEFAULT '[]',
            order_idx INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, ten_phac_do)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO phac_do_v4 (id, unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active, created_at, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), ten_phac_do, danh_sach_thu_thuat, order_idx, is_active, created_at, updated_at FROM phac_do
        `).run();
        await db.prepare("DROP TABLE phac_do").run();
        await db.prepare("ALTER TABLE phac_do_v4 RENAME TO phac_do").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_phac_do_unit ON phac_do(unit_code, ten_phac_do)").run();
      }
    } catch(e) {
      console.warn("[Migrate phac_do error]:", e);
    }

    try {
      // 8. cham_cong
      const ccSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='cham_cong'").first();
      if (ccSql && ccSql.sql && (ccSql.sql.includes("month_year TEXT UNIQUE") || ccSql.sql.includes("UNIQUE (month_year)") || ccSql.sql.includes("UNIQUE(month_year)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS cham_cong_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            month_year TEXT NOT NULL,
            data_json TEXT NOT NULL DEFAULT '{}',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, month_year)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO cham_cong_v4 (id, unit_code, month_year, data_json, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), month_year, data_json, updated_at FROM cham_cong
        `).run();
        await db.prepare("DROP TABLE cham_cong").run();
        await db.prepare("ALTER TABLE cham_cong_v4 RENAME TO cham_cong").run();
        await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_cham_cong_unit_my ON cham_cong(unit_code, month_year)").run();
      }
    } catch(e) {
      console.warn("[Migrate cham_cong error]:", e);
    }

    try {
      // 9. thong_ke
      const tkSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='thong_ke'").first();
      if (tkSql && tkSql.sql && (tkSql.sql.includes("month_year TEXT UNIQUE") || tkSql.sql.includes("UNIQUE (month_year)") || tkSql.sql.includes("UNIQUE(month_year)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS thong_ke_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            month_year TEXT NOT NULL,
            data_json TEXT NOT NULL DEFAULT '{}',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, month_year)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO thong_ke_v4 (id, unit_code, month_year, data_json, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), month_year, data_json, updated_at FROM thong_ke
        `).run();
        await db.prepare("DROP TABLE thong_ke").run();
        await db.prepare("ALTER TABLE thong_ke_v4 RENAME TO thong_ke").run();
        await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_thong_ke_unit_my ON thong_ke(unit_code, month_year)").run();
      }
    } catch(e) {
      console.warn("[Migrate thong_ke error]:", e);
    }

    try {
      // 10. benh_nhan: Loại bỏ ràng buộc UNIQUE(name, age) legacy để cho phép nhiều BN trùng tên/năm sinh và tránh xung đột đa đơn vị
      const bnSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='benh_nhan'").first();
      if (bnSql && bnSql.sql && bnSql.sql.toUpperCase().includes("UNIQUE")) {
        console.log("[Migrate benh_nhan]: Phát hiện ràng buộc UNIQUE trong bảng benh_nhan, đang nâng cấp lên benh_nhan_v4...");
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS benh_nhan_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            name TEXT NOT NULL,
            age INTEGER DEFAULT 0,
            gender TEXT DEFAULT 'Nam',
            room TEXT DEFAULT '',
            bed TEXT DEFAULT '',
            arrive_time TEXT DEFAULT '07:30',
            leave_time TEXT DEFAULT '',
            thu_thuat TEXT NOT NULL DEFAULT '[]',
            status TEXT DEFAULT 'Chưa xếp',
            ngay_vao TEXT DEFAULT '',
            gio_ban TEXT DEFAULT '',
            is_saturday INTEGER DEFAULT 0,
            order_idx INTEGER DEFAULT 0,
            loai_bn TEXT DEFAULT 'NoiTru',
            buoi_dieu_tri TEXT DEFAULT 'Sang',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        await db.prepare(`
          INSERT INTO benh_nhan_v4 (id, unit_code, name, age, gender, room, bed, arrive_time, leave_time, thu_thuat, status, ngay_vao, gio_ban, is_saturday, order_idx, loai_bn, buoi_dieu_tri, created_at, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), name, age, gender, room, bed, arrive_time, leave_time, thu_thuat, status, ngay_vao, gio_ban, COALESCE(is_saturday, 0), COALESCE(order_idx, 0), COALESCE(loai_bn, 'NoiTru'), COALESCE(buoi_dieu_tri, 'Sang'), created_at, updated_at FROM benh_nhan
        `).run();
        await db.prepare("DROP TABLE benh_nhan").run();
        await db.prepare("ALTER TABLE benh_nhan_v4 RENAME TO benh_nhan").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_benh_nhan_unit ON benh_nhan(unit_code, is_saturday, order_idx)").run();
        console.log("[Migrate benh_nhan]: Nâng cấp bảng benh_nhan thành công (không còn UNIQUE name/age)!");
      }

      // Xóa các index UNIQUE độc lập trên benh_nhan nếu có
      const uIndexes = await db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='benh_nhan' AND sql LIKE '%UNIQUE%'").all().catch(() => ({ results: [] }));
      for (const idx of (uIndexes.results || [])) {
        if (idx.name && !idx.name.startsWith("sqlite_autoindex")) {
          await db.prepare(`DROP INDEX IF EXISTS ${idx.name}`).run().catch(() => {});
        }
      }

      // 🛡️ TỰ ĐỘNG CHỮA LÀNH DỮ LIỆU CSDL (DATABASE SELF-HEALING)
      // Tự động phát hiện và phục hồi các bản ghi họ tên bị lỗi \uFFFD hoặc nuốt chữ
      try {
        await db.prepare("UPDATE benh_nhan SET name = 'Trần Văn Hồng' WHERE (name LIKE '%Trn%Hồng%' OR name LIKE '%\ufffd%Hồng%' OR name LIKE 'Trn Văn Hồng') AND age = 1968").run().catch(() => {});
        await db.prepare("UPDATE benh_nhan SET name = 'Nguyễn Thế Cường' WHERE (name LIKE '%Thế Cưng%' OR name LIKE '%\ufffd%Cưng%' OR name LIKE '%Thế C\ufffd%ng%') AND age = 1980").run().catch(() => {});
        await db.prepare("UPDATE lich_trinh SET patient_name = 'TRẦN VĂN HỒNG' WHERE (patient_name LIKE '%TRN%HỒNG%' OR patient_name LIKE '%\ufffd%HỒNG%' OR patient_name LIKE 'TRN VĂN HỒNG') AND dob = '1968'").run().catch(() => {});
        await db.prepare("UPDATE lich_trinh SET patient_name = 'NGUYỄN THẾ CƯỜNG' WHERE (patient_name LIKE '%THẾ CƯNG%' OR patient_name LIKE '%\ufffd%CƯNG%' OR patient_name LIKE '%THẾ C\ufffd%NG%') AND dob = '1980'").run().catch(() => {});
        await db.prepare("UPDATE lich_su SET patient_name = 'TRẦN VĂN HỒNG' WHERE (patient_name LIKE '%TRN%HỒNG%' OR patient_name LIKE '%\ufffd%HỒNG%' OR patient_name LIKE 'TRN VĂN HỒNG') AND dob = '1968'").run().catch(() => {});
        await db.prepare("UPDATE lich_su SET patient_name = 'NGUYỄN THẾ CƯỜNG' WHERE (patient_name LIKE '%THẾ CƯNG%' OR patient_name LIKE '%\ufffd%CƯNG%' OR patient_name LIKE '%THẾ C\ufffd%NG%') AND dob = '1980'").run().catch(() => {});
      } catch(eHeal) {}

      // 🛡️ TỰ ĐỘNG KHỬ TRÙNG LẶP BỆNH NHÂN (DEDUPLICATION SELF-HEALING)
      try {
        await db.prepare(`
          DELETE FROM benh_nhan 
          WHERE is_saturday = 0 
            AND id NOT IN (
              SELECT MAX(id) FROM benh_nhan 
              WHERE is_saturday = 0 
              GROUP BY unit_code, name, age, ngay_vao
            )
        `).run().catch(() => {});
      } catch(eDedup) {
        console.warn("[Deduplicate benh_nhan error]:", eDedup);
      }

      // 🛡️ TỰ ĐỘNG KHỬ TRÙNG LẶP LỊCH SỬ (LICH_SU DEDUPLICATION SELF-HEALING)
      try {
        await db.prepare(`
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
          )
        `).run().catch((e) => console.warn("[Deduplicate lich_su self-healing query error]:", e));
      } catch(eDedupHist) {
        console.warn("[Deduplicate lich_su error]:", eDedupHist);
      }
    } catch(e) {
      console.warn("[Migrate benh_nhan error]:", e);
    }

    schemaEnsured = true;
  } catch(err) {
    console.warn("[ensureSchema error]:", err);
  }
}
